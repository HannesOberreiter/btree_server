import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthUserStore } from '../stores/auth';
import { useApiFetch } from './useApi';

export interface MonthlyUsage {
	totalInputTokens: number;
	totalOutputTokens: number;
	totalRequests: number;
	estimatedCostUSD: number;
	monthlyLimitUSD: number;
	remainingBudgetUSD: number;
	isOverBudget: boolean;
}

export interface ChatMessage {
	role: 'user' | 'model' | 'tool';
	content: string;
	toolName?: string;
	toolDone?: boolean;
	toolOutput?: string;
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
	let breakStream = false;

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

	function clearChat() {
		chatHistory.value = [];
		error.value = undefined;
		question.value = '';
	}

	function upsertLastModelMessage(content: string) {
		const last = chatHistory.value[chatHistory.value.length - 1];
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

		if (isStreaming.value) {
			breakStream = true;
			isFetching.value = false;
			isStreaming.value = false;
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

		const body = {
			question: userQuestions.join('\n'),
			history: chatHistory.value.slice(0, -(userQuestions.length)),
		};
		const stream = api.stream('/v1/wizbee/ask/stream', body);

		try {
			const responseStream = (await stream).body!;
			isStreaming.value = true;
			isFetching.value = false;
			const reader = responseStream.getReader();

			let accumulated = '';
			let modelText = '';

			reader.read().then(function processStream({ done, value }): any {
				if (breakStream) {
					breakStream = false;
					isStreaming.value = false;
					reader.cancel();
					return;
				}
				if (done) {
					isStreaming.value = false;
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
						isStreaming.value = false;
						fetchMonthlyUsage();
						return;
					}

					if (json.type === 'tool_call') {
						chatHistory.value.push({
							role: 'tool',
							content: json.toolName || 'tool',
							toolName: json.toolName,
							toolOutput: json.toolOutput,
							toolDone: false,
						});
					}

					if (json.type === 'tool_result') {
						const toolMsg = [...chatHistory.value].reverse().find(
							m => m.role === 'tool' && m.toolName === json.toolName && !m.toolDone,
						);
						if (toolMsg) {
							toolMsg.toolDone = true;
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
				return reader.read().then(processStream);
			});
		}
		catch (e) {
			console.error(e);
			isFetching.value = false;
			isStreaming.value = false;
			breakStream = false;
			error.value = t('error.unknown');
			fetchMonthlyUsage();
		}
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
		sendQuestion,
		clearChat,
	};
}
