"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizBee = void 0;
const gpt_3_encoder_1 = require("gpt-3-encoder");
const openai_1 = require("openai");
const environment_config_js_1 = require("../config/environment.config.js");
const vector_server_js_1 = require("../servers/vector.server.js");
class WizBee {
    openAI;
    template;
    static indexName = 'link';
    static vectorField = 'content_vector';
    static completionModel = 'gpt-4';
    static turboModel = 'gpt-3.5-turbo';
    static embeddingModel = 'text-embedding-ada-002';
    constructor() {
        const configuration = new openai_1.Configuration({
            apiKey: environment_config_js_1.openAI.key,
        });
        this.openAI = new openai_1.OpenAIApi(configuration);
        this.template = `
    You are a friendly bot assistant, answering beekeeping related question by using given context. The context could be from multiple references, if it is each is separated by ;;;. Answer the question using only that information. If you can't create an answer with the references, say "Sorry, could not generated a good answer. You may find your answer in the references bellow.".

    Question: $query

    Context: $context
    `;
    }
    /**
     * @description use openAI embedding as we also use it for the uploaded documents
     */
    async createEmbedding(text) {
        const response = await this.openAI.createEmbedding({
            model: WizBee.embeddingModel,
            input: text,
        });
        const [{ embedding }] = response.data.data;
        return { embedding, tokens: response.data.usage.total_tokens };
    }
    /**
     * @description create buffer for redis query needs to be of same size as index vector. We use langchain for creating the vector db and they use float32 (https://github.com/hwchase17/langchain/blob/master/langchain/vectorstores/redis.py)
     */
    createQueryParam(vector) {
        return Buffer.from(new Float32Array(vector).buffer);
    }
    /**
     * @description Transform the result from redis to a more readable format, as it is in array format of [result count, key, document[key, value, ...] ...]
     */
    transformResult(input) {
        if (!input)
            return undefined;
        if (!Array.isArray(input))
            return undefined;
        // first element is result count
        input.shift();
        const result = [];
        for (let i = 1; i < input.length; i += 2) {
            const obj = {};
            const arr = input[i];
            for (let j = 0; j < arr.length; j += 2) {
                if (arr[j] === 'content_vector')
                    continue;
                else if (arr[j] === 'metadata') {
                    obj[arr[j]] = JSON.parse(arr[j + 1]);
                }
                else if (arr[j] === 'score') {
                    obj[arr[j]] = parseFloat(arr[j + 1]);
                }
                else {
                    obj[arr[j]] = arr[j + 1];
                }
            }
            result.push(obj);
        }
        return result;
    }
    /**
     * @description The minimum matching score required for a document to be considered a match. Defaults to 0.2. Because the similarity calculation algorithm is based on cosine similarity, the smaller the angle, the higher the similarity.
     */
    filterScore(input, minScore = 0.2) {
        return input.filter((item) => item.score <= minScore);
    }
    /**
     * @description combine documents into a single string and filter out possible metadata duplicates
     */
    concatDocuments(documents) {
        let tokenCount = 0;
        let contextText = '';
        const refs = [];
        // Concat matched documents
        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];
            const content = document.content;
            const encoded = (0, gpt_3_encoder_1.encode)(content);
            refs.push({ ...document.metadata, score: document.score });
            tokenCount += encoded.length;
            if (tokenCount > 4000) {
                break;
            }
            contextText += `${content.trim()}\n###\n`;
        }
        return { contextText, refs: this.filterDuplicates(refs) };
    }
    // https://stackoverflow.com/a/36744732/5316675
    filterDuplicates(obj) {
        return (obj = obj.filter((value, index, self) => index === self.findIndex((t) => t.file === value.file)));
    }
    /**
     * @description search for the most similar documents, based on KNN flat index
     * @param text the text to search for
     * @param k number of results to return
     * @param minScore the minimum matching score required for a document to be considered a match. Defaults to 0.2. Because the similarity calculation algorithm is based on cosine similarity, the smaller the angle, the higher the similarity. (Cosine Distance = 1 — Cosine Similarity)
     */
    async searchKNN(embedding, k = 2, minScore = 0.3) {
        const unit32Buffer = this.createQueryParam(embedding);
        const queryResult = await vector_server_js_1.VectorServer.client.call('FT.SEARCH', WizBee.indexName, `*=>[KNN $K @${WizBee.vectorField} $BLOB as score]`, 'PARAMS', 4, 'K', k, 'BLOB', unit32Buffer, 'SORTBY', 'score', 'DIALECT', 2);
        if (!queryResult)
            return undefined;
        const result = this.transformResult(queryResult);
        if (!result)
            return undefined;
        return this.filterScore(result, minScore);
    }
    /**
     * @description helper function to create completion prompt
     */
    _createPrompt(input, contextText) {
        return this.template
            .replace('$query', input)
            .replace('$context', contextText)
            .replace(/\n/g, ' ');
    }
    /**
     * @description completion prompt gives better answers but is 10x more expensive
     */
    async _createAnswer(input, contextText) {
        const completionResponse = await this.openAI.createCompletion({
            model: WizBee.completionModel,
            prompt: this._createPrompt(input, contextText),
            max_tokens: 500,
            temperature: 0.2, // Set to 0 for deterministic results
        });
        return completionResponse.data;
    }
    /**
     * @description use the turbo model to translate the question to english
     */
    async translate(text) {
        try {
            const response = await this.openAI.createChatCompletion({
                model: WizBee.turboModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a machine translation system for beekeeping related texts.',
                    },
                    {
                        role: 'user',
                        content: `Please provide the english translation for the following sentence: ${text}`,
                    },
                ],
                max_tokens: 500,
                temperature: 0.1,
                user: 'WizBee_' + environment_config_js_1.env,
            });
            return response.data;
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * @description use the turbo model and chat completion to answer the user question
     */
    async createAnswer(input, contextText, lang) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are a friendly bot assistant, answering beekeeping related question or questions about the usage of the b.tree beekeeping software by using only given context. The context could be from multiple references or from the official b.tree documentation and each is separated by ###. If you cannot give a good answer with given context, please type "Sorry, we cannot give a good answer to that question."',
                },
                {
                    role: 'system',
                    content: `Context: ${contextText}`,
                },
                {
                    role: 'user',
                    content: `${input}`,
                },
            ];
            if (lang !== 'en') {
                messages.push({
                    role: 'system',
                    content: `User question is in language ${lang}, respond in the same language.`,
                });
            }
            const response = await this.openAI.createChatCompletion({
                model: WizBee.completionModel,
                messages,
                max_tokens: 500,
                temperature: 0.1,
                user: 'WizBee_' + environment_config_js_1.env,
            });
            return response.data;
        }
        catch (e) {
            return undefined;
        }
    }
    /**
     * @description exposed entry point called by controller
     */
    async search(question, lang) {
        let tokens = 0;
        let input = question.replace(/\n/g, ' ');
        if (lang !== 'en') {
            const translation = await this.translate(input);
            if ('usage' in translation && 'choices' in translation) {
                tokens += translation?.usage?.total_tokens ?? 0;
                input = translation.choices[0].message.content ?? input;
            }
        }
        const { embedding, tokens: embeddingTokens } = await this.createEmbedding(input);
        tokens += embeddingTokens;
        const results = await this.searchKNN(embedding, 4, 0.21);
        if (!results)
            return undefined;
        if (results.length === 0)
            return undefined;
        const { contextText, refs } = this.concatDocuments(results);
        // const answer = await this.createAnswer(question, contextText);
        const answer = await this.createAnswer(question, contextText, lang);
        tokens += answer?.usage?.total_tokens ?? 0;
        const answerText = answer?.choices[0].message?.content ?? undefined;
        //return { text: answer.choices[0].text, refs, tokens };
        return { text: answerText, refs, tokens };
    }
}
exports.WizBee = WizBee;
