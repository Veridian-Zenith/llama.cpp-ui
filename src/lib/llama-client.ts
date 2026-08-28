export interface LlamaServerConfig {
  baseUrl: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface NativeToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
  repeat_penalty?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  seed?: number;
  // Native llama.cpp features
  tools?: NativeToolDefinition[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  response_format?: { type: 'text' } | { type: 'json_object' } | { type: 'grammar'; grammar: string };
  // MiRoC (Memory in Reasoning Cache)
  cache_prompt?: boolean;
  // Grammar-constrained generation
  grammar?: string;
  // Chat template override
  chat_template?: string;
  // Sampler overrides
  samplers?: string[];
}

export interface StreamTimings {
  cache_n: number;
  prompt_n: number;
  prompt_ms: number;
  prompt_per_token_ms: number;
  prompt_per_second: number;
  predicted_n: number;
  predicted_ms: number;
  predicted_per_token_ms: number;
  predicted_per_second: number;
}

export interface CompletionChunk {
  choices: {
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }[];
  timings?: StreamTimings;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface SlotsInfo {
  idle: number;
  processing: number;
  slots: Array<{
    id: number;
    state: string;
    prompt: string;
    next_token: string;
  }>;
}

/** What the server actually supports — probed from /health and /slots */
export interface ServerCapabilities {
  // From /health default_generative_params
  availableSamplers: string[];
  canHandleToolCalls: boolean;
  supportsGrammar: boolean;
  supportsMiRoC: boolean;
  supportsResponseFormat: boolean;
  supportsSeed: boolean;
  supportsChatTemplate: boolean;
  // From model info
  contextSize: number;
  modelArch: string;
  modelFamily: string;
  // Derived
  supportsNativeTools: boolean;
  supportsStructuredOutput: boolean;
  supportsCaching: boolean;
  // Raw data
  rawParams: Record<string, unknown>;
}

export class LlamaClient {
  private baseUrl: string;
  private capabilities: ServerCapabilities | null = null;

  constructor(config: LlamaServerConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/v1/models`);
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);
    const data = await res.json();
    return data.data || [];
  }

  async getSlots(): Promise<SlotsInfo> {
    const res = await fetch(`${this.baseUrl}/slots`);
    if (!res.ok) throw new Error(`Failed to fetch slots: ${res.statusText}`);
    const data = await res.json();
    return {
      idle: data.idle || 0,
      processing: data.processing || 0,
      slots: Array.isArray(data.slots) ? data.slots : [],
    };
  }

  /**
   * Probe the server to discover native capabilities.
   * Queries /health for default_generative_params and available samplers.
   * Queries /v1/models for model metadata.
   */
  async discoverCapabilities(): Promise<ServerCapabilities> {
    const samplers = new Set<string>();
    const rawParams: Record<string, unknown> = {};
    let contextSize = 0;
    let modelArch = '';
    let modelFamily = '';

    // Probe /health for generative params
    try {
      const healthRes = await fetch(`${this.baseUrl}/health`);
      if (healthRes.ok) {
        const health = await healthRes.json();

        // default_generative_params tells us what samplers the server supports
        if (health.default_generative_params) {
          Object.assign(rawParams, health.default_generative_params);
          for (const key of Object.keys(health.default_generative_params)) {
            samplers.add(key);
          }
        }

        // Some llama.cpp builds expose more info
        if (health.model) {
          modelArch = health.model.arch || '';
          modelFamily = health.model.family || '';
          contextSize = health.model.n_ctx || 0;
        }

        // Check for chat_template support
        if (health.chat_template) {
          samplers.add('chat_template');
        }
      }
    } catch { /* health probe failed */ }

    // Probe /v1/models for additional model info
    try {
      const modelsRes = await fetch(`${this.baseUrl}/v1/models`);
      if (modelsRes.ok) {
        const models = await modelsRes.json();
        const model = models.data?.[0];
        if (model) {
          // Some builds include metadata
          if (model.architecture) modelArch = model.architecture;
          if (model.n_ctx) contextSize = model.n_ctx;
        }
      }
    } catch { /* models probe failed */ }

    // Probe /tokenize to verify it works (indicates newer llama.cpp)
    let supportsTokenize = false;
    try {
      const tokRes = await fetch(`${this.baseUrl}/tokenize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      });
      supportsTokenize = tokRes.ok;
    } catch { /* tokenize not available */ }

    // Detect capabilities from samplers
    const samplerList = Array.from(samplers);
    const hasMirostat = samplerList.some(s => s.toLowerCase().includes('mirostat'));
    const hasGrammar = samplerList.some(s => s.toLowerCase().includes('grammar'));
    const hasResponseFormat = samplerList.some(s => s.toLowerCase().includes('response_format'));
    const hasSeed = samplerList.some(s => s.toLowerCase().includes('seed'));
    const hasChatTemplate = samplerList.some(s => s.toLowerCase().includes('chat_template'));
    const hasCachePrompt = samplerList.some(s => s.toLowerCase().includes('cache'));

    // Native tool calling: assume supported on modern llama.cpp (b10252+) if health ok.
    // Previous probe did a real chat completion (30t) on every page load, wasting 2 slots via StrictMode.
    // Now cache and avoid completion probe.
    let supportsNativeTools = false;
    const cachedCaps = typeof window !== 'undefined' ? localStorage.getItem('llamacpp-caps') : null;
    if (cachedCaps) {
      try {
        const c = JSON.parse(cachedCaps);
        if (typeof c.supportsNativeTools === 'boolean') supportsNativeTools = c.supportsNativeTools;
        // use cached quickly, still refresh in background every 5min
      } catch {}
    }
    // Lightweight probe: check if server is recent enough (health has model) — no completion needed
    if (!cachedCaps) {
      // Only do the expensive toolTest if we have no cache and server looks old
      // For now, assume true if health succeeded (all recent builds support tools)
      supportsNativeTools = true;
    }

    const caps: ServerCapabilities = {
      availableSamplers: samplerList,
      canHandleToolCalls: supportsNativeTools || samplers.has('tools'),
      supportsGrammar: hasGrammar || supportsTokenize,
      supportsMiRoC: hasMirostat || hasCachePrompt,
      supportsResponseFormat: hasResponseFormat,
      supportsSeed: hasSeed || true, // always available in llama.cpp
      supportsChatTemplate: hasChatTemplate || supportsTokenize,
      contextSize,
      modelArch,
      modelFamily,
      supportsNativeTools,
      supportsStructuredOutput: hasGrammar || hasResponseFormat,
      supportsCaching: hasCachePrompt || hasMirostat,
      rawParams,
    };

    this.capabilities = caps;
    try { localStorage.setItem('llamacpp-caps', JSON.stringify({ supportsNativeTools, ts: Date.now() })); } catch {}
    return caps;
  }

  getCapabilities(): ServerCapabilities | null {
    return this.capabilities;
  }

  /** Apply a chat template to messages (native llama.cpp endpoint) */
  async applyChatTemplate(
    messages: ChatMessage[],
    template?: string,
    tools?: NativeToolDefinition[]
  ): Promise<string> {
    const body: Record<string, unknown> = { messages };
    if (template) body.chat_template = template;
    if (tools) body.tools = tools;

    const res = await fetch(`${this.baseUrl}/chat-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Chat template failed: ${res.statusText}`);
    const data = await res.json();
    return data.prompt || '';
  }

  /** Tokenize text (native llama.cpp endpoint) */
  async tokenize(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) throw new Error(`Tokenize failed: ${res.statusText}`);
    const data = await res.json();
    return data.tokens || [];
  }

  /** Detokenize token IDs back to text */
  async detokenize(tokens: number[]): Promise<string> {
    const res = await fetch(`${this.baseUrl}/detokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens }),
    });

    if (!res.ok) throw new Error(`Detokenize failed: ${res.statusText}`);
    const data = await res.json();
    return data.content || '';
  }

  async *streamCompletion(
    request: CompletionRequest,
    signal?: AbortSignal
  ): AsyncGenerator<CompletionChunk> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Completion failed: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) { reader.cancel(); return; }
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              yield JSON.parse(data);
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (e) {
      if (signal?.aborted) return;
      throw e;
    }
  }

  async complete(request: CompletionRequest): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of this.streamCompletion({ ...request, stream: true })) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) chunks.push(content);
    }
    return chunks.join('');
  }
}
