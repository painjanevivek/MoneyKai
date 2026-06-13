import { startTransition, useEffect, useState } from 'react';

import { aiClient } from '@/services/aiClient';
import type { AiChatRequest, AiChatResponse, AiModelStatusResponse, AiProviderStatus } from './types';

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

export function useAiProviderStatus(autoLoad = true) {
  const [state, setState] = useState<AsyncState<AiProviderStatus>>(() => ({
    ...idleState<AiProviderStatus>(),
    loading: autoLoad,
  }));

  const refresh = async () => {
    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await aiClient.getProviderStatus();
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
    } catch (error) {
      startTransition(() => {
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'AI is temporarily unavailable.',
          loading: false,
        });
      });
    }
  };

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    let cancelled = false;

    async function hydrate() {
      try {
        const data = await aiClient.getProviderStatus();
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
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'AI is temporarily unavailable.',
            loading: false,
          });
        });
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [autoLoad]);

  return { ...state, refresh };
}

export function useAiModelStatus(autoLoad = true) {
  const [state, setState] = useState<AsyncState<AiModelStatusResponse>>(() => ({
    ...idleState<AiModelStatusResponse>(),
    loading: autoLoad,
  }));

  const refresh = async () => {
    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await aiClient.getModelStatus();
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
    } catch (error) {
      startTransition(() => {
        setState({
          data: null,
          error: error instanceof Error ? error.message : 'AI is temporarily unavailable.',
          loading: false,
        });
      });
    }
  };

  useEffect(() => {
    if (!autoLoad) {
      return;
    }
    let cancelled = false;

    async function hydrate() {
      try {
        const data = await aiClient.getModelStatus();
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
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'AI is temporarily unavailable.',
            loading: false,
          });
        });
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [autoLoad]);

  return { ...state, refresh };
}

export function useAiChat() {
  const [state, setState] = useState<AsyncState<AiChatResponse>>(idleState);

  const send = async (payload: AiChatRequest) => {
    startTransition(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
    });
    try {
      const data = await aiClient.chat(payload);
      startTransition(() => {
        setState({ data, error: null, loading: false });
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI is temporarily unavailable.';
      startTransition(() => {
        setState({ data: null, error: message, loading: false });
      });
      throw error;
    }
  };

  const reset = () => {
    startTransition(() => {
      setState(idleState<AiChatResponse>());
    });
  };

  return {
    ...state,
    send,
    reset,
  };
}
