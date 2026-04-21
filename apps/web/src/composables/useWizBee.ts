import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from '../stores/auth';
import { useApiFetch } from './useApi';

export interface MonthlyUsage {
	totalInputTokens: number;
	totalOutputTokens: number;
	totalRequests: number;
	estimatedCostEUR: number;
	monthlyLimitEUR: number;
	remainingBudgetEUR: number;
	isOverBudget: boolean;
}

export interface ChatMessage {
	role: 'user' | 'model' | 'tool';
	content: string;
	toolName?: string;
	toolDone?: boolean;
	toolOutput?: string;
	toolInput?: string;
}

export function useWizBee() {
	const api = useApiFetch();
	const { t } = useI18n();
	const authStore = useAuthUserStore();

	const question = ref('');
	const chatHistory = ref<ChatMessage[]>([]);
	const error = ref<string | undefined>(undefined);
	const isFetching = ref(false);
	const isStreaming = ref(false);
	const monthlyUsage = ref<MonthlyUsage | null>(null);
	let abortController: AbortController | null = null;

	const isPremium = computed(() => authStore.isPremium);
	const isDisabled = computed(() => !isPremium.value || (monthlyUsage.value?.isOverBudget ?? false));

	async function fetchMonthlyUsage() {
		try {
			const res = await api.get('/v1/wizbee/usage', { loadingIndicator: false });
			monthlyUsage.value = res;
		}
		catch {
			monthlyUsage.value = null;
		}
	}

	async function transcribeAudio(params: {
		blob: Blob;
		fileName: string;
		language?: string;
	}): Promise<{ text: string; language: string | null }> {
		const res = await api.postMultiPart('/v1/wizbee/transcribe', {
			audio: new File([params.blob], params.fileName, { type: params.blob.type || 'audio/webm' }),
			fileName: params.fileName,
			...(params.language ? { language: params.language } : {}),
		});
		return { text: res?.text ?? '', language: res?.language ?? null };
	}

	function clearChat() {
		chatHistory.value = [];
		error.value = undefined;
		question.value = '';
	}

	function upsertLastModelMessage(content: string) {
		const last = chatHistory.value.at(-1);
		if (last && last.role === 'model') {
			last.content = content;
		}
		else {
			chatHistory.value.push({ role: 'model', content });
		}
	}

	async function sendQuestion(input?: string) {
		const raw = input ?? question.value;
		error.value = undefined;

		if (isStreaming.value || isFetching.value) {
			abortStream();
		}

		const userQuestions = raw
			.split(/\n+/)
			.map(q => q.trim())
			.filter(q => q.length > 0);
		if (userQuestions.length === 0)
			return;

		userQuestions.forEach(q => chatHistory.value.push({ role: 'user', content: q }));
		question.value = '';

		isFetching.value = true;
		abortController = new AbortController();

		const body = {
			question: userQuestions.join('\n'),
			history: chatHistory.value.slice(0, -(userQuestions.length)),
		};

		try {
			const response = await api.stream('/v1/wizbee/ask/stream', body, abortController.signal);
			const responseStream = response.body!;
			isStreaming.value = true;
			isFetching.value = false;
			const reader = responseStream.getReader();

			let accumulated = '';
			let modelText = '';

			reader.read().then(function processStream({ done, value }): any {
				if (done) {
					isStreaming.value = false;
					abortController = null;
					if (modelText) {
						upsertLastModelMessage(modelText);
					}
					fetchMonthlyUsage();
					return;
				}

				const decoded = new TextDecoder('utf-8').decode(value);
				accumulated += decoded;
				const responses = accumulated.split(/\}\s*\{/);
				let newAccum = '';
				let aborted = false;

				for (let i = 0; i < responses.length; i++) {
					let response = responses[i];
					if (i !== 0)
						response = `{${response}`;
					if (i !== responses.length - 1)
						response = `${response}}`;
					if (!response)
						continue;

					let json: any;
					try {
						json = JSON.parse(response);
					}
					catch {
						newAccum = response;
						continue;
					}

					if (json.type === 'error') {
						error.value = json.content || t('error.unknown');
						// Leave any tool rows that were in-progress visibly "done" so the
						// UI doesn't keep a spinner forever, and fully reset streaming
						// state — the server may still send a `done` frame, but we treat
						// the request as terminated from the client's point of view.
						chatHistory.value
							.filter(m => m.role === 'tool' && !m.toolDone)
							.forEach((m) => { m.toolDone = true; });
						isFetching.value = false;
						isStreaming.value = false;
						abortStream();
						fetchMonthlyUsage();
						aborted = true;
						break;
					}

					if (json.type === 'tool_call') {
						chatHistory.value.push({
							role: 'tool',
							content: json.toolName || 'tool',
							toolName: json.toolName,
							toolInput: JSON.stringify(json.toolInput),
							toolDone: false,
						});
					}

					if (json.type === 'tool_result') {
						const toolMsg = [...chatHistory.value].reverse().find(
							m => m.role === 'tool' && m.toolName === json.toolName && !m.toolDone,
						);
						if (toolMsg) {
							toolMsg.toolDone = true;
							toolMsg.toolOutput = JSON.stringify(json.toolOutput);
						}
						// Reset modelText so the next text chunk starts a new model bubble
						modelText = '';
					}

					if (json.type === 'text') {
						modelText += json.content;
						upsertLastModelMessage(modelText);
					}
				}

				accumulated = newAccum;
				if (aborted)
					return;
				return reader.read().then(processStream);
			});
		}
		catch (e) {
			// Abort is expected, not an error
			if (e instanceof DOMException && e.name === 'AbortError') {
				isFetching.value = false;
				isStreaming.value = false;
				abortController = null;
				return;
			}
			console.error(e);
			isFetching.value = false;
			isStreaming.value = false;
			abortController = null;
			error.value = t('error.unknown');
			fetchMonthlyUsage();
		}
	}

	function abortStream() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		isFetching.value = false;
		isStreaming.value = false;
	}

	return {
		question,
		chatHistory,
		error,
		isFetching,
		isStreaming,
		monthlyUsage,
		isPremium,
		isDisabled,
		fetchMonthlyUsage,
		transcribeAudio,
		sendQuestion,
		abortStream,
		clearChat,
	};
}
