import { Loading, LoadingBar } from 'quasar';
import { ref } from 'vue';

// Global loading state management
const globalLoadingState = ref(false);
const loadingOperations = ref(new Set<string>());

export function useLoadingManager() {
	const startLoading = (operationId: string) => {
		loadingOperations.value.add(operationId);
		if (!globalLoadingState.value) {
			globalLoadingState.value = true;
			LoadingBar.start();
		}
	};

	const stopLoading = (operationId: string) => {
		loadingOperations.value.delete(operationId);
		if (loadingOperations.value.size === 0 && globalLoadingState.value) {
			globalLoadingState.value = false;
			LoadingBar.stop();
			if (Loading.isActive)
				Loading.hide();
		}
	};

	const forceStopAll = () => {
		loadingOperations.value.clear();
		globalLoadingState.value = false;
		if (LoadingBar.isActive)
			LoadingBar.stop();
		if (Loading.isActive)
			Loading.hide();
	};

	const isLoading = () => globalLoadingState.value;

	return {
		startLoading,
		stopLoading,
		forceStopAll,
		isLoading,
	};
}
