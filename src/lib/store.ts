import { create } from 'zustand';
import { LlamaClient, type ChatMessage, type CompletionRequest, type ServerCapabilities } from './llama-client';
import { type ToolCall, type SandboxConfig, getToolByName } from './tools/types';
import { DEFAULT_SANDBOX } from './tools/types';
import { executeTool } from './tools/executor';
import { buildToolGuide, type AgenticMode } from './agentic';
import { type PersonalityMode, buildPersonalityPrompt } from './personality';
import { chatStore, type ChatConversation } from './chat-store';
import { profileStore } from './profile';
import { memoryStore } from './memory';
import { DEFAULT_LLAMA_URL } from './config';

export interface Settings {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens: number;
  repeat_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  systemPrompt: string;
  serverUrl: string;
  seed: number;
  personalityMode: PersonalityMode;
}

export interface ToolCallRecord extends ToolCall {
  startTime?: number;
  endTime?: number;
}

export interface DisplayMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallRecord[];
  thinking?: string;
  timestamp: number;
}

export interface StreamingStats {
  promptTokens: number;
  generationTokens: number;
  promptTokensPerSecond: number;
  generationTokensPerSecond: number;
  totalTokens: number;
  promptMs: number;
  generationMs: number;
  cacheTokens: number;
}

interface AppState {
  client: LlamaClient | null;
  settings: Settings;
  messages: DisplayMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  currentModel: string;
  error: string | null;

  agenticMode: AgenticMode;
  sandbox: SandboxConfig;
  panelOpen: boolean;
  terminalOpen: boolean;
  pendingApproval: ToolCallRecord | null;
  streamingStats: StreamingStats;
  serverCapabilities: ServerCapabilities | null;

  // Chat history
  activeChatId: string | null;
  chats: ChatConversation[];

  connect: (url: string) => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => void;
  updateSandbox: (partial: Partial<SandboxConfig>) => void;
  setAgenticMode: (mode: AgenticMode) => void;
  setPanelOpen: (open: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  approveToolCall: (id: string) => void;
  denyToolCall: (id: string) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  setError: (err: string | null) => void;

  // Chat management
  createChat: (firstMessage?: string) => string;
  switchChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  refreshChats: () => void;
}

let abortController: AbortController | null = null;

function parseToolCalls(text: string): Array<{ name: string; arguments: Record<string, unknown> }> {
  const calls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
  const patterns = [
    /```tool\s*\n([\s\S]*?)```/g,
    /\[TOOL\]\s*(\w+)\s*\[ARGS\]\s*(\{[\s\S]*?\})\s*\[\/ARGS\]\s*\[\/TOOL\]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        if (pattern.source.includes('TOOL')) {
          const toolName = match[1];
          const argsStr = match[2];
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(argsStr); } catch { /* skip */ }
          calls.push({ name: toolName, arguments: args });
        } else {
          let raw = match[1] || match[0];
          raw = raw.replace(/^```(tool|json)\s*\n?/, '').replace(/\n?```$/, '').trim();
          const parsed = JSON.parse(raw);
          if (parsed.name && typeof parsed.name === 'string') {
            calls.push({
              name: parsed.name,
              arguments: parsed.arguments || {},
            });
          }
        }
      } catch {
        const block = (match[1] || match[0]).trim();
        const nameMatch = block.match(/"name"\s*:\s*"([^"]+)"/);
        const argsMatch = block.match(/"arguments"\s*:\s*(\{[\s\S]*?\})/);
        if (nameMatch) {
          let args: Record<string, unknown> = {};
          if (argsMatch) {
            try { args = JSON.parse(argsMatch[1]); } catch { /* skip */ }
          }
          calls.push({ name: nameMatch[1], arguments: args });
        }
      }
    }
  }

  return calls;
}

function extractThinking(text: string): { thinking: string; text: string } {
  const patterns = [
    /<think>([\s\S]*?)<\/think>/i,
    /\[think\]([\s\S]*?)\[\/think\]/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        thinking: match[1].trim(),
        text: text.replace(pattern, '').trim(),
      };
    }
  }
  return { thinking: '', text };
}

export const useStore = create<AppState>((set, get) => ({
  client: null,
  settings: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    max_tokens: 4096,
    repeat_penalty: 1.1,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    systemPrompt: 'You are a helpful assistant with access to tools and the internet.',
    serverUrl: DEFAULT_LLAMA_URL,
    seed: -1,
    personalityMode: 'sidekick',
  },
  messages: [],
  isStreaming: false,
  isConnected: false,
  currentModel: '',
  error: null,
  agenticMode: 'auto',
  sandbox: { ...DEFAULT_SANDBOX },
  panelOpen: false,
  terminalOpen: false,
  pendingApproval: null,
  serverCapabilities: null,
  streamingStats: {
    promptTokens: 0,
    generationTokens: 0,
    promptTokensPerSecond: 0,
    generationTokensPerSecond: 0,
    totalTokens: 0,
    promptMs: 0,
    generationMs: 0,
    cacheTokens: 0,
  },
  activeChatId: null,
  chats: chatStore.getAll(),

  connect: async (url: string) => {
    const client = new LlamaClient({ baseUrl: url });
    const ok = await client.health();
    if (!ok) {
      set({ error: 'Cannot connect to llama-server. Is it running?', isConnected: false });
      return;
    }
    try {
      const models = await client.getModels();
      const model = models[0]?.id || 'unknown';
      // Probe server for native capabilities
      const capabilities = await client.discoverCapabilities();
      set({
        client,
        isConnected: true,
        currentModel: model,
        error: null,
        serverCapabilities: capabilities,
        settings: { ...get().settings, serverUrl: url },
      });
    } catch (e) {
      set({ error: `Connected but failed to get models: ${e}`, isConnected: false });
    }
  },

  updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  updateSandbox: (partial) => set((s) => ({ sandbox: { ...s.sandbox, ...partial } })),
  setAgenticMode: (mode) => set({ agenticMode: mode }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setError: (err) => set({ error: err }),

  createChat: (firstMessage?: string) => {
    const chat = chatStore.create(firstMessage);
    set({ activeChatId: chat.id, messages: [], chats: chatStore.getAll() });
    return chat.id;
  },

  switchChat: (chatId: string) => {
    const chat = chatStore.getById(chatId);
    chatStore.setActiveId(chatId);
    set({
      activeChatId: chatId,
      messages: chat?.messages || [],
      chats: chatStore.getAll(),
    });
  },

  deleteChat: (chatId: string) => {
    chatStore.delete(chatId);
    const chats = chatStore.getAll();
    const activeId = chatStore.getActiveId();
    set({
      chats,
      activeChatId: activeId,
      messages: activeId ? (chatStore.getById(activeId)?.messages || []) : [],
    });
  },

  renameChat: (chatId: string, title: string) => {
    chatStore.update(chatId, { title });
    set({ chats: chatStore.getAll() });
  },

  refreshChats: () => set({ chats: chatStore.getAll() }),

  sendMessage: async (content: string) => {
    const { client, settings, messages, agenticMode, sandbox, activeChatId } = get();
    if (!client || get().isStreaming) return;

    // Auto-create chat if none active
    let chatId = activeChatId;
    if (!chatId) {
      const chat = chatStore.create(content);
      chatId = chat.id;
      set({ activeChatId: chatId });
    }

    const userMsg: DisplayMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    set({ messages: newMessages, isStreaming: true, error: null });

    // Persist user message
    chatStore.addMessage(chatId, userMsg);

    // Auto-extract memories from user message
    memoryStore.autoExtract(content, chatId);

    // Build system prompt lean — single personality source, no duplication
    let systemPrompt =
      buildPersonalityPrompt(
        settings.personalityMode,
        settings.personalityMode === 'custom' ? settings.systemPrompt : undefined
      ) || settings.systemPrompt;

    // Inject personalization (name, persona)
    systemPrompt = profileStore.buildPersonalizedSystemPrompt(systemPrompt);

    // Inject memory context relevant to the current message
    const memoryContext = memoryStore.buildContext(content);
    if (memoryContext) {
      systemPrompt += '\n\n' + memoryContext;
    }

    // Lean tool guide only when not native (native uses JSON schema, saves ~2k tokens)
    if (agenticMode !== 'chat' && !get().serverCapabilities?.supportsNativeTools) {
      systemPrompt += '\n\n' + buildToolGuide();
    }

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const caps = get().serverCapabilities;

    const req: CompletionRequest = {
      messages: apiMessages,
      temperature: settings.temperature,
      top_p: settings.top_p,
      top_k: settings.top_k,
      max_tokens: settings.max_tokens,
      repeat_penalty: settings.repeat_penalty,
      frequency_penalty: settings.frequency_penalty,
      presence_penalty: settings.presence_penalty,
      stream: true,
      seed: settings.seed >= 0 ? settings.seed : undefined,

      // Enable MiRoC caching if available
      ...(caps?.supportsMiRoC ? { cache_prompt: true } : {}),
    };

    abortController = new AbortController();
    const signal = abortController.signal;
    const streamStart = Date.now();
    const estPromptTokens = apiMessages.reduce((a, m) => a + Math.ceil(m.content.length / 3.5), 0);
    set({
      streamingStats: {
        ...get().streamingStats,
        promptTokens: estPromptTokens,
        generationTokens: 0,
        totalTokens: estPromptTokens,
        promptMs: 0,
        generationMs: 0,
        generationTokensPerSecond: 0,
        promptTokensPerSecond: 0,
      },
    });

    try {
      let fullContent = '';
      let fullReasoning = '';
      const assistantId = `msg-${Date.now()}-assistant`;

      // Track native tool calls from streaming response
      const nativeToolCalls = new Map<number, { id: string; name: string; arguments: string }>();

      for await (const chunk of client.streamCompletion(req, signal)) {
        if (signal.aborted) break;

        const delta = chunk.choices[0]?.delta;
        const reasoningDelta = delta?.reasoning_content;
        const contentDelta = delta?.content;

        if (reasoningDelta) {
          fullReasoning += reasoningDelta;
        }

        if (contentDelta) {
          fullContent += contentDelta;
        }

        // Live TPS — update every token chunk (dynamic, not just final timings)
        if (contentDelta || reasoningDelta) {
          const elapsed = Date.now() - streamStart;
          const estGen = Math.ceil(fullContent.length / 3.8) + Math.ceil(fullReasoning.length / 3.8);
          const tps = elapsed > 300 ? estGen / (elapsed / 1000) : get().streamingStats.generationTokensPerSecond;
          if (elapsed % 150 < 50 || contentDelta) {
            set({
              streamingStats: {
                ...get().streamingStats,
                generationTokens: estGen,
                totalTokens: estPromptTokens + estGen,
                generationMs: elapsed,
                generationTokensPerSecond: tps,
              },
            });
          }
        }

        // Handle native tool calls from the streaming response
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!nativeToolCalls.has(idx)) {
              nativeToolCalls.set(idx, {
                id: tc.id || `native-tc-${Date.now()}-${idx}`,
                name: '',
                arguments: '',
              });
            }
            const existing = nativeToolCalls.get(idx)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name += tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          }
        }

        // Capture timings from final chunk
        if (chunk.timings) {
          set({ streamingStats: {
            ...get().streamingStats,
            promptTokens: chunk.timings.prompt_n,
            generationTokens: chunk.timings.predicted_n,
            promptTokensPerSecond: chunk.timings.prompt_per_second,
            generationTokensPerSecond: chunk.timings.predicted_per_second,
            totalTokens: chunk.timings.prompt_n + chunk.timings.predicted_n,
            promptMs: chunk.timings.prompt_ms,
            generationMs: chunk.timings.predicted_ms,
            cacheTokens: chunk.timings.cache_n,
          }});
        }

        if (contentDelta || reasoningDelta) {
          const existingIdx = get().messages.findIndex((m) => m.id === assistantId);
          const assistantMsg: DisplayMessage = {
            id: assistantId,
            role: 'assistant',
            content: fullContent,
            thinking: fullReasoning || undefined,
            timestamp: Date.now(),
          };

          if (existingIdx >= 0) {
            const msgs = [...get().messages];
            msgs[existingIdx] = assistantMsg;
            set({ messages: msgs });
          } else {
            set({ messages: [...get().messages, assistantMsg] });
          }
        }
      }

      // Convert native tool calls to our format if any were received
      const parsedNativeToolCalls = Array.from(nativeToolCalls.values())
        .filter((tc) => tc.name)
        .map((tc) => {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.arguments); } catch { /* partial parse */ }
          return { name: tc.name, arguments: args };
        });

      // Persist assistant message
      const finalAssistantMsg: DisplayMessage = {
        id: assistantId,
        role: 'assistant',
        content: fullContent,
        thinking: fullReasoning || undefined,
        timestamp: Date.now(),
      };
      chatStore.addMessage(chatId, finalAssistantMsg);

      // After streaming complete, parse tool calls
      // Merge native tool calls (from server) with text-parsed tool calls (from model output)
      const textToolCalls = parseToolCalls(fullContent);
      const allToolCalls = [...parsedNativeToolCalls, ...textToolCalls];

      if (agenticMode !== 'chat' && allToolCalls.length > 0) {
        const { thinking, text } = extractThinking(fullContent);
        const toolAssistantMsg: DisplayMessage = {
          id: assistantId,
          role: 'assistant',
          content: text,
          thinking: thinking || undefined,
          toolCalls: allToolCalls.map((tc, i) => ({
            id: `tc-${Date.now()}-${i}`,
            name: tc.name,
            arguments: tc.arguments,
            status: 'pending' as const,
          })),
          timestamp: Date.now(),
        };

        const existingIdx = get().messages.findIndex((m) => m.id === assistantId);
        if (existingIdx >= 0) {
          const msgs = [...get().messages];
          msgs[existingIdx] = toolAssistantMsg;
          set({ messages: msgs });
        } else {
          set({ messages: [...get().messages, toolAssistantMsg] });
        }

        const updateToolMessages = () => {
          const msgs = [...get().messages];
          const idx = msgs.findIndex((m) => m.id === assistantId);
          if (idx >= 0) msgs[idx] = { ...toolAssistantMsg, toolCalls: [...toolAssistantMsg.toolCalls!] };
          set({ messages: msgs });
        };

        for (const tc of toolAssistantMsg.toolCalls!) {
          const def = getToolByName(tc.name);
          if (!def) {
            tc.status = 'error';
            tc.error = `Unknown tool: ${tc.name}`;
            updateToolMessages();
            continue;
          }

          if (agenticMode === 'auto' || !def.requiresApproval) {
            tc.status = 'running';
            tc.startTime = Date.now();
            updateToolMessages();

            const result = await executeTool(tc, sandbox);
            tc.endTime = Date.now();
            tc.status = result.error ? 'error' : 'completed';
            tc.result = result.output;
            tc.error = result.error;

            updateToolMessages();
          } else if (agenticMode === 'manual') {
            set({ pendingApproval: tc });

            const approved = await new Promise<boolean>((resolve) => {
              const check = () => {
                const current = get().pendingApproval;
                if (current === null) { resolve(true); return; }
                if (current.id === tc.id && current.status === 'denied') { resolve(false); return; }
                if (current.id === tc.id && current.status === 'approved') { resolve(true); return; }
                requestAnimationFrame(check);
              };
              check();
            });

            set({ pendingApproval: null });

            if (approved) {
              tc.status = 'running';
              tc.startTime = Date.now();
              updateToolMessages();
              const result = await executeTool(tc, sandbox);
              tc.endTime = Date.now();
              tc.status = result.error ? 'error' : 'completed';
              tc.result = result.output;
              tc.error = result.error;
            } else {
              tc.status = 'denied';
            }
            updateToolMessages();
          }
        }

        // Feed results back to model
        const toolResults = toolAssistantMsg.toolCalls!
          .map((tc) => `[Tool: ${tc.name}] ${tc.error || tc.result || 'denied'}`)
          .join('\n\n');

        if (toolAssistantMsg.toolCalls!.some((tc) => tc.status === 'completed')) {
          const followUpMessages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...get().messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'assistant', content: fullContent },
            { role: 'user', content: `Tool results:\n${toolResults}\n\nPlease use these results to answer my original question.` },
          ];

          const followUpId = `msg-${Date.now()}-followup`;
          let followUpContent = '';
          for await (const chunk of client.streamCompletion({ ...req, messages: followUpMessages }, signal)) {
            if (signal.aborted) break;
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              followUpContent += delta;
              const { thinking: ft, text: ftText } = extractThinking(followUpContent);
              const followUpMsg: DisplayMessage = {
                id: followUpId,
                role: 'assistant',
                content: ftText,
                thinking: ft || undefined,
                timestamp: Date.now(),
              };
              const fIdx = get().messages.findIndex((m) => m.id === followUpId);
              if (fIdx >= 0) {
                const msgs = [...get().messages];
                msgs[fIdx] = followUpMsg;
                set({ messages: msgs });
              } else {
                set({ messages: [...get().messages, followUpMsg] });
              }
            }
          }

          // Persist follow-up
          const finalFollowUp: DisplayMessage = {
            id: followUpId,
            role: 'assistant',
            content: followUpContent,
            timestamp: Date.now(),
          };
          chatStore.addMessage(chatId, finalFollowUp);
        }
      }

      // Update chat list
      set({ chats: chatStore.getAll() });
    } catch (e) {
      set({ error: `Stream error: ${e}` });
    } finally {
      set({ isStreaming: false });
      abortController = null;
    }
  },

  approveToolCall: (id: string) => {
    set((s) => {
      if (!s.pendingApproval || s.pendingApproval.id !== id) return s;
      return { pendingApproval: { ...s.pendingApproval, status: 'approved' } };
    });
  },

  denyToolCall: (id: string) => {
    set((s) => {
      if (!s.pendingApproval || s.pendingApproval.id !== id) return s;
      return { pendingApproval: { ...s.pendingApproval, status: 'denied' } };
    });
  },

  stopStreaming: () => {
    abortController?.abort();
    set({ isStreaming: false });
  },

  clearMessages: () => {
    const { activeChatId } = get();
    if (activeChatId) {
      chatStore.updateMessages(activeChatId, []);
    }
    set({ messages: [], error: null, pendingApproval: null });
  },
}));
