import { useState, useEffect, useCallback, useRef } from 'react';

export interface SlotInfo {
  id: number;
  n_ctx: number;
  is_processing: boolean;
}

export interface ServerStats {
  slots: SlotInfo[];
  totalContext: number;
  usedContext: number;
  contextUsagePercent: number;
  idleSlots: number;
  busySlots: number;
  connected: boolean;
}

export interface TokenStats {
  promptTokens: number;
  generationTokens: number;
  promptTokensPerSecond: number;
  generationTokensPerSecond: number;
  totalTokens: number;
  lastPromptTokens: number;
  lastGenerationTokens: number;
}

export interface PerformanceMetrics {
  promptMs: number;
  generationMs: number;
  totalMs: number;
}

export function useServerStats(serverUrl: string, isConnected: boolean) {
  const [stats, setStats] = useState<ServerStats>({
    slots: [],
    totalContext: 0,
    usedContext: 0,
    contextUsagePercent: 0,
    idleSlots: 0,
    busySlots: 0,
    connected: false,
  });

  const [tokenStats, setTokenStats] = useState<TokenStats>({
    promptTokens: 0,
    generationTokens: 0,
    promptTokensPerSecond: 0,
    generationTokensPerSecond: 0,
    totalTokens: 0,
    lastPromptTokens: 0,
    lastGenerationTokens: 0,
  });

  const prevTokens = useRef({ prompt: 0, generation: 0 });

  const fetchSlots = useCallback(async () => {
    if (!isConnected) return;
    try {
      const res = await fetch(`${serverUrl}/slots`);
      if (!res.ok) return;
      const slots: SlotInfo[] = await res.json();
      const totalCtx = slots.reduce((a, s) => a + s.n_ctx, 0);
      const busy = slots.filter((s) => s.is_processing).length;
      setStats({
        slots,
        totalContext: totalCtx,
        usedContext: 0,
        contextUsagePercent: 0,
        idleSlots: slots.length - busy,
        busySlots: busy,
        connected: true,
      });
    } catch {
      setStats((s) => ({ ...s, connected: false }));
    }
  }, [serverUrl, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    const timeout = setTimeout(fetchSlots, 0);
    const interval = setInterval(fetchSlots, 2000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isConnected, fetchSlots]);

  const updateTokenStats = useCallback(
    (promptTokens: number, generationTokens: number) => {
      const dp = promptTokens - prevTokens.current.prompt;
      const dg = generationTokens - prevTokens.current.generation;
      prevTokens.current = { prompt: promptTokens, generation: generationTokens };

      setTokenStats((prev) => ({
        promptTokens,
        generationTokens,
        promptTokensPerSecond: dp > 0 ? dp : prev.promptTokensPerSecond,
        generationTokensPerSecond: dg > 0 ? dg : prev.generationTokensPerSecond,
        totalTokens: promptTokens + generationTokens,
        lastPromptTokens: dp,
        lastGenerationTokens: dg,
      }));
    },
    []
  );

  const updateContextUsage = useCallback((used: number, total: number) => {
    setStats((s) => ({
      ...s,
      usedContext: used,
      contextUsagePercent: total > 0 ? (used / total) * 100 : 0,
    }));
  }, []);

  return { stats, tokenStats, updateTokenStats, updateContextUsage, refreshSlots: fetchSlots };
}
