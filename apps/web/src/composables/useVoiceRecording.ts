import { onBeforeUnmount, ref } from 'vue';

export type VoiceRecordingError = 'permission' | 'unsupported' | 'unknown' | 'timeout';

export interface UseVoiceRecordingOptions {
	/**
	 * Hard cap on recording duration, in milliseconds. When reached, the
	 * recorder auto-stops and resolves `stop()` normally — this is the
	 * "I forgot the mic was on" safety net.
	 *
	 */
	maxDurationMs?: number;
}

const MAX_DURATION_MS = 1000 * 60 * 5;

const PREFERRED_MIME_TYPES: Array<{ mime: string; ext: string }> = [
	{ mime: 'audio/webm;codecs=opus', ext: 'webm' },
	{ mime: 'audio/webm', ext: 'webm' },
	{ mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
	{ mime: 'audio/ogg', ext: 'ogg' },
	{ mime: 'audio/mp4', ext: 'm4a' },
	{ mime: 'audio/mpeg', ext: 'mp3' },
];

function pickMimeType(): { mime: string; ext: string } | null {
	if (typeof MediaRecorder === 'undefined')
		return null;
	for (const candidate of PREFERRED_MIME_TYPES) {
		try {
			if (MediaRecorder.isTypeSupported(candidate.mime))
				return candidate;
		}
		catch {
			// ignore — some browsers throw for unknown types
		}
	}
	// Fallback: let the browser choose — we'll assume webm.
	return { mime: '', ext: 'webm' };
}

export interface VoiceRecordingResult {
	blob: Blob;
	mimeType: string;
	/** Extension matching the container (e.g. 'webm', 'ogg', 'm4a'). */
	extension: string;
}

export function useVoiceRecording() {
	const maxDurationMs = MAX_DURATION_MS;

	const isRecording = ref(false);
	const isSupported = ref(
		typeof navigator !== 'undefined'
		&& !!navigator.mediaDevices?.getUserMedia
		&& typeof MediaRecorder !== 'undefined',
	);
	const error = ref<VoiceRecordingError | null>(null);
	const remainingSeconds = ref<number | null>(null);

	let recorder: MediaRecorder | null = null;
	let mediaStream: MediaStream | null = null;
	let chunks: Blob[] = [];
	let stopResolver: ((result: VoiceRecordingResult | null) => void) | null = null;
	let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
	let countdownTimer: ReturnType<typeof setInterval> | null = null;
	/** Set to `true` when the timeout fired, so callers can distinguish auto-stop from manual stop. */
	let timedOut = false;

	function clearTimers() {
		if (autoStopTimer) {
			clearTimeout(autoStopTimer);
			autoStopTimer = null;
		}
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
		remainingSeconds.value = null;
	}

	function cleanup() {
		clearTimers();
		recorder = null;
		chunks = [];
		if (mediaStream) {
			// Release the mic so the browser indicator turns off.
			mediaStream.getTracks().forEach(track => track.stop());
			mediaStream = null;
		}
	}

	async function start(): Promise<boolean> {
		error.value = null;
		if (!isSupported.value) {
			error.value = 'unsupported';
			return false;
		}
		if (isRecording.value)
			return true;

		const picked = pickMimeType();
		if (!picked) {
			error.value = 'unsupported';
			return false;
		}

		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		}
		catch (e: any) {
			// NotAllowedError / SecurityError → user denied or page is not secure.
			if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
				error.value = 'permission';
			}
			else {
				error.value = 'unknown';
			}
			cleanup();
			return false;
		}

		try {
			recorder = picked.mime
				? new MediaRecorder(mediaStream, { mimeType: picked.mime })
				: new MediaRecorder(mediaStream);
		}
		catch {
			error.value = 'unsupported';
			cleanup();
			return false;
		}

		chunks = [];
		timedOut = false;
		recorder.addEventListener('dataavailable', (ev) => {
			if (ev.data && ev.data.size > 0)
				chunks.push(ev.data);
		});
		recorder.addEventListener('stop', () => {
			const mime = recorder?.mimeType || picked.mime || 'audio/webm';
			const blob = new Blob(chunks, { type: mime });
			const result: VoiceRecordingResult = {
				blob,
				mimeType: mime,
				extension: picked.ext,
			};
			if (timedOut)
				error.value = 'timeout';
			cleanup();
			isRecording.value = false;
			if (stopResolver) {
				const resolve = stopResolver;
				stopResolver = null;
				resolve(blob.size > 0 ? result : null);
			}
		});
		recorder.addEventListener('error', () => {
			error.value = 'unknown';
			cleanup();
			isRecording.value = false;
			if (stopResolver) {
				const resolve = stopResolver;
				stopResolver = null;
				resolve(null);
			}
		});

		recorder.start();
		isRecording.value = true;

		// Arm the auto-stop safety net. We schedule a single stop() at the
		// hard cap and a 1 Hz countdown tick so the UI can render "stops in
		// 30s". If the caller stops earlier these timers are cleared in
		// cleanup() / clearTimers().
		if (maxDurationMs > 0) {
			remainingSeconds.value = Math.ceil(maxDurationMs / 1000);
			countdownTimer = setInterval(() => {
				if (remainingSeconds.value === null)
					return;
				remainingSeconds.value = Math.max(0, remainingSeconds.value - 1);
			}, 1000);
			autoStopTimer = setTimeout(() => {
				timedOut = true;
				try {
					recorder?.stop();
				}
				catch {
					// If the recorder is already inactive, fall through — the
					// 'stop' listener above (or cleanup) will settle state.
				}
			}, maxDurationMs);
		}
		return true;
	}

	/**
	 * Stop the active recording and resolve with the captured blob (or null
	 * if there was no audio / an error occurred).
	 */
	function stop(): Promise<VoiceRecordingResult | null> {
		if (!recorder || !isRecording.value) {
			return Promise.resolve(null);
		}
		return new Promise((resolve) => {
			stopResolver = resolve;
			try {
				recorder?.stop();
			}
			catch {
				// If stop throws (e.g. already inactive), resolve now.
				cleanup();
				isRecording.value = false;
				stopResolver = null;
				resolve(null);
			}
		});
	}

	/**
	 * Abort without keeping the audio (e.g. the user navigated away).
	 */
	function cancel() {
		if (recorder && isRecording.value) {
			try {
				recorder.stop();
			}
			catch {
				// ignore
			}
		}
		// Drop the resolver so `stop()`'s promise — if still pending — rejects to null.
		if (stopResolver) {
			const resolve = stopResolver;
			stopResolver = null;
			resolve(null);
		}
		cleanup();
		isRecording.value = false;
	}

	onBeforeUnmount(cancel);

	return {
		isRecording,
		isSupported,
		error,
		remainingSeconds,
		maxDurationMs,
		start,
		stop,
		cancel,
	};
}
