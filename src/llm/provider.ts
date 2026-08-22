export interface LLMProvider {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}

export class LocalLlamaProvider implements LLMProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}

// OpenCode provider — uses the running opencode agent for LLM calls (free, no API key needed).
// Since we're already running inside an opencode agent, we handle prompts directly.
export class OpenCodeProvider implements LLMProvider {
  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    // Return the prompt for the human agent to evaluate
    // The pipeline will call me (the opencode agent) directly for scoring
    return `PROMPT_FOR_AGENT: system="${systemPrompt}" message="${userMessage}"`;
  }
}

// OpenRouter provider — supports multiple LLMs via a single API key
export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const model = this.defaultModel;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }
}

export function createProvider(): LLMProvider {
  const provider = process.env.MODEL_PROVIDER ?? 'opencode';

  if (provider === 'opencode') {
    return new OpenCodeProvider();
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required for openai provider');
    return new OpenAIProvider(apiKey);
  }

  if (provider === 'local') {
    const baseUrl = process.env.LOCAL_LLM_BASE_URL;
    if (!baseUrl) throw new Error('LOCAL_LLM_BASE_URL is required for local provider');
    return new LocalLlamaProvider(baseUrl);
  }

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is required for openrouter provider');
    return new OpenRouterProvider(apiKey, process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet');
  }

  throw new Error(`Unknown MODEL_PROVIDER: ${provider}`);
}
