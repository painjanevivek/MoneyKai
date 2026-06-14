import { startTransition, useCallback, useEffect, useState } from 'react';

import { aiClient } from '@/services/aiClient';
import type {
  AiAttachmentAnalyzeRequest,
  AiAttachmentAnalyzeResponse,
  AiAttachmentUploadResponse,
  AiBudgetCoachRequest,
  AiChatRequest,
  AiChatResponse,
  AiChatStreamCompletedEvent,
  AiChatStreamEvent,
  AiDocumentSummarizeRequest,
  AiDocumentSummaryResponse,
  AiModelStatusResponse,
  AiOpsStatusResponse,
  AiProviderStatus,
  AiTransactionInsightsRequest,
} from './types';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

const idleState = <T,>(): AsyncState<T> => ({
  data: null,
  error: null,
  loading: false,
});

const toErrorMessage = (error: unknown, fallback = 'AI is temporarily unavailable.') =>
  error instanceof Error ? error.message : fallback;

function useAutoLoadResource<T>(loader: () => Promise<T>, autoLoad = true) {
  const [state, setState] = useState<AsyncState<T>>(() => ({
    ...idleState<T>(),
    loading: autoLoad,
  }));

  const refresh = useCallback(async () => {
    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await loader();
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
      return data;
    } catch (error) {
      const message = toErrorMessage(error);
      startTransition(() => {
        setState({ data: null, error: message, loading: false });
      });
      throw error;
    }
  }, [loader]);

  useEffect(() => {
    if (!autoLoad) {
      startTransition(() => {
        setState((current) => (current.loading ? { ...current, loading: false } : current));
      });
      return;
    }

    let cancelled = false;

    async function hydrate() {
      try {
        const data = await loader();
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setState({ data, error: null, loading: false });
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setState({ data: null, error: toErrorMessage(error), loading: false });
        });
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [autoLoad, loader]);

  return { ...state, refresh };
}

function useAsyncAction<TPayload, TResult>(runner: (payload: TPayload) => Promise<TResult>) {
  const [state, setState] = useState<AsyncState<TResult>>(idleState);

  const run = useCallback(async (payload: TPayload) => {
    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await runner(payload);
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
      return data;
    } catch (error) {
      const message = toErrorMessage(error);
      startTransition(() => {
        setState({ data: null, error: message, loading: false });
      });
      throw error;
    }
  }, [runner]);

  const reset = useCallback(() => {
    startTransition(() => {
      setState(idleState<TResult>());
    });
  }, []);

  return { ...state, run, reset };
}

function usePayloadResource<TPayload, TResult>(
  payload: TPayload | null,
  loader: (payload: TPayload) => Promise<TResult>,
  autoLoad = true,
) {
  const [state, setState] = useState<AsyncState<TResult>>(() => ({
    ...idleState<TResult>(),
    loading: autoLoad && payload !== null,
  }));

  const refresh = useCallback(async (nextPayload?: TPayload | null) => {
    const activePayload = (nextPayload ?? payload) as TPayload | null;
    if (activePayload === null) {
      startTransition(() => {
        setState(idleState<TResult>());
      });
      return null;
    }

    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await loader(activePayload as TPayload);
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
      return data;
    } catch (error) {
      const message = toErrorMessage(error);
      startTransition(() => {
        setState({ data: null, error: message, loading: false });
      });
      throw error;
    }
  }, [loader, payload]);

  useEffect(() => {
    const activePayload = payload;

    if (!autoLoad || activePayload === null) {
      startTransition(() => {
        setState((current) => ({ ...current, loading: false }));
      });
      return;
    }

    let cancelled = false;

    async function hydrate() {
      try {
        const data = await loader(activePayload as TPayload);
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setState({ data, error: null, loading: false });
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setState({ data: null, error: toErrorMessage(error), loading: false });
        });
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [autoLoad, loader, payload]);

  return { ...state, refresh };
}

export function useAiProviderStatus(autoLoad = true) {
  return useAutoLoadResource<AiProviderStatus>(aiClient.getProviderStatus, autoLoad);
}

export function useAiModelStatus(autoLoad = true) {
  return useAutoLoadResource<AiModelStatusResponse>(aiClient.getModelStatus, autoLoad);
}

export function useAiOpsStatus(autoLoad = true) {
  return useAutoLoadResource<AiOpsStatusResponse>(aiClient.getOpsStatus, autoLoad);
}

export function useAiChat() {
  const state = useAsyncAction<AiChatRequest, AiChatResponse>(aiClient.chat);
  return {
    ...state,
    send: state.run,
  };
}

interface StreamingChatState {
  data: AiChatResponse | null;
  error: string | null;
  loading: boolean;
  partialMessage: string;
  requestId: string | null;
  model: string | null;
  provider: string | null;
}

const idleStreamingState = (): StreamingChatState => ({
  data: null,
  error: null,
  loading: false,
  partialMessage: '',
  requestId: null,
  model: null,
  provider: null,
});

export function useAiStreamingChat() {
  const [state, setState] = useState<StreamingChatState>(idleStreamingState);

  const send = async (payload: AiChatRequest) => {
    startTransition(() => {
      setState({
        data: null,
        error: null,
        loading: true,
        partialMessage: '',
        requestId: null,
        model: null,
        provider: null,
      });
    });

    try {
      const completed = await aiClient.streamChat(payload, (event: AiChatStreamEvent) => {
        startTransition(() => {
          setState((current) => applyStreamingEvent(current, event));
        });
      });

      const response = mapCompletedEventToResponse(completed);
      startTransition(() => {
        setState({
          data: response,
          error: null,
          loading: false,
          partialMessage: response.message,
          requestId: response.requestId,
          model: response.model,
          provider: response.provider,
        });
      });
      return response;
    } catch (error) {
      const message = toErrorMessage(error);
      startTransition(() => {
        setState((current) => ({ ...current, error: message, loading: false }));
      });
      throw error;
    }
  };

  const reset = () => {
    startTransition(() => {
      setState(idleStreamingState());
    });
  };

  return {
    ...state,
    send,
    reset,
  };
}

export function useAiAttachmentUpload() {
  const state = useAsyncAction<FormData, AiAttachmentUploadResponse>(aiClient.uploadAttachment);
  return {
    ...state,
    upload: state.run,
  };
}

export function useAiAttachmentAnalysis() {
  const state = useAsyncAction<AiAttachmentAnalyzeRequest, AiAttachmentAnalyzeResponse>(aiClient.analyzeAttachment);
  return {
    ...state,
    analyze: state.run,
  };
}

export function useAiDocumentSummary() {
  const state = useAsyncAction<AiDocumentSummarizeRequest, AiDocumentSummaryResponse>(aiClient.summarizeDocument);
  return {
    ...state,
    summarize: state.run,
  };
}

export function useAiTransactionInsights(payload: AiTransactionInsightsRequest | null, autoLoad = true) {
  return usePayloadResource(payload, aiClient.getTransactionInsights, autoLoad);
}

export function useAiBudgetCoach(payload: AiBudgetCoachRequest | null, autoLoad = true) {
  return usePayloadResource(payload, aiClient.getBudgetCoach, autoLoad);
}

function applyStreamingEvent(state: StreamingChatState, event: AiChatStreamEvent): StreamingChatState {
  if (event.type === 'meta') {
    return {
      ...state,
      requestId: event.requestId,
      model: event.model ?? state.model,
      provider: event.provider ?? state.provider,
    };
  }

  if (event.type === 'delta') {
    return {
      ...state,
      requestId: event.requestId,
      model: event.model ?? state.model,
      provider: event.provider ?? state.provider,
      partialMessage: `${state.partialMessage}${event.delta}`,
    };
  }

  if (event.type === 'completed') {
    const response = mapCompletedEventToResponse(event);
    return {
      data: response,
      error: null,
      loading: false,
      partialMessage: response.message,
      requestId: response.requestId,
      model: response.model,
      provider: response.provider,
    };
  }

  return {
    ...state,
    loading: false,
    error: event.error.message,
    requestId: event.requestId ?? state.requestId,
  };
}

function mapCompletedEventToResponse(event: AiChatStreamCompletedEvent): AiChatResponse {
  return {
    requestId: event.requestId,
    provider: event.provider || 'openrouter',
    model: event.model || '',
    message: event.message,
    finishReason: event.finishReason ?? null,
    usage: event.usage || {},
    annotations: [],
    providerMetadata: event.providerMetadata,
    safety: event.safety,
  };
}
