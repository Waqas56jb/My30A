import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let resolvedModel: string | null = null;
let modelStatus: 'unknown' | 'ok' | 'unavailable' = 'unknown';
let availableIds: string[] = [];

export type ConciergeTool = {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ConciergeMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export async function verifyOpenAiModel() {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    });
    if (!res.ok) {
      modelStatus = 'unavailable';
      logger.warn({ status: res.status }, 'OpenAI models list failed');
      return { ok: false, model: env.OPENAI_MODEL };
    }
    const body = (await res.json()) as { data?: { id: string }[] };
    availableIds = (body.data ?? []).map((m) => m.id);
    if (availableIds.includes(env.OPENAI_MODEL)) {
      resolvedModel = env.OPENAI_MODEL;
      modelStatus = 'ok';
      return { ok: true, model: resolvedModel };
    }
    if (env.OPENAI_MODEL_FALLBACK && availableIds.includes(env.OPENAI_MODEL_FALLBACK)) {
      resolvedModel = env.OPENAI_MODEL_FALLBACK;
      modelStatus = 'ok';
      logger.warn(
        { configured: env.OPENAI_MODEL, fallback: resolvedModel },
        'Configured OpenAI model missing; using OPENAI_MODEL_FALLBACK',
      );
      return { ok: true, model: resolvedModel };
    }
    modelStatus = 'unavailable';
    logger.error(
      { configured: env.OPENAI_MODEL, sample: availableIds.slice(0, 20) },
      'Configured OpenAI model is not available on this key',
    );
    return { ok: false, model: env.OPENAI_MODEL, available: availableIds.slice(0, 40) };
  } catch (error) {
    modelStatus = 'unavailable';
    logger.error({ err: error }, 'OpenAI model verification failed');
    return { ok: false, model: env.OPENAI_MODEL };
  }
}

export function openaiHealth() {
  return {
    status: modelStatus,
    configured: env.OPENAI_MODEL,
    resolved: resolvedModel,
  };
}

export function getResolvedModel() {
  return resolvedModel;
}

export function getActiveModel() {
  return resolvedModel ?? env.OPENAI_MODEL ?? null;
}

type OpenAiJson = Record<string, unknown>;

async function openaiJson(path: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.openai.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = ((await res.json().catch(() => ({}))) ?? {}) as OpenAiJson;
  return { ok: res.ok, status: res.status, json };
}

function openaiErrorMessage(json: OpenAiJson) {
  const err = json.error as { message?: string } | string | undefined;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object' && err.message) return err.message;
  return 'Vitoria could not complete that reply.';
}

function toolOutputJson(value: unknown) {
  try {
    const text = JSON.stringify(value);
    return text.length > 12000 ? `${text.slice(0, 12000)}…[truncated]` : text;
  } catch {
    return JSON.stringify({ error: 'unserializable_tool_result' });
  }
}

function extractToolCalls(response: OpenAiJson): Array<{ name: string; arguments: string; call_id: string }> {
  const output = (response.output as Array<OpenAiJson>) ?? [];
  return output
    .filter((item) => item.type === 'function_call' || item.type === 'tool_call')
    .map((item) => ({
      name: String(item.name),
      arguments: String(item.arguments ?? '{}'),
      call_id: String(item.call_id ?? item.id ?? item.name),
    }));
}

function extractResponsesText(response: OpenAiJson) {
  if (typeof response.output_text === 'string' && response.output_text) return response.output_text;
  const output = (response.output as Array<OpenAiJson>) ?? [];
  const bits: string[] = [];
  for (const item of output) {
    const content = item.content as Array<{ text?: string; type?: string }> | undefined;
    content?.forEach((part) => {
      if (part.text) bits.push(part.text);
    });
    if (item.type === 'message' && typeof item.text === 'string') bits.push(item.text);
  }
  return bits.join('\n').trim();
}

async function runResponsesLoop(
  model: string,
  opts: {
    instructions: string;
    messages: ConciergeMessage[];
    tools: ConciergeTool[];
    executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  },
) {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
  const input = opts.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));

  let current = await openaiJson('/v1/responses', {
    model,
    instructions: opts.instructions,
    input,
    tools: opts.tools,
  });
  if (!current.ok) {
    logger.error({ status: current.status, error: current.json }, 'Responses API error');
    throw new Error(openaiErrorMessage(current.json));
  }

  for (let i = 0; i < 4; i += 1) {
    const calls = extractToolCalls(current.json);
    if (!calls.length) break;
    const outputs = [];
    for (const call of calls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
      } catch {
        parsed = {};
      }
      delete parsed.property_id;
      delete parsed.propertyId;
      const result = await opts.executeTool(call.name, parsed);
      toolCalls.push({ name: call.name, arguments: parsed });
      outputs.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: toolOutputJson(result),
      });
    }
    current = await openaiJson('/v1/responses', {
      model,
      previous_response_id: current.json.id,
      input: outputs,
      tools: opts.tools,
    });
    if (!current.ok) {
      logger.error({ status: current.status, error: current.json }, 'Responses API tool follow-up error');
      throw new Error(openaiErrorMessage(current.json));
    }
  }

  return {
    text:
      extractResponsesText(current.json) ||
      'I want to get that right rather than guess. Tell me a little more, or I can connect you with the team.',
    toolCalls,
  };
}

async function runChatLoop(
  model: string,
  opts: {
    instructions: string;
    messages: ConciergeMessage[];
    tools: ConciergeTool[];
    executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  },
) {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: opts.instructions },
    ...opts.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ];
  const tools = opts.tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  for (let i = 0; i < 5; i += 1) {
    const current = await openaiJson('/v1/chat/completions', { model, messages, tools });
    if (!current.ok) {
      logger.error({ status: current.status, error: current.json }, 'Chat Completions API error');
      throw new Error(openaiErrorMessage(current.json));
    }
    const choice = (current.json.choices as Array<{ message?: Record<string, unknown> }> | undefined)?.[0]?.message;
    if (!choice) throw new Error('Vitoria could not complete that reply.');

    const calls =
      (choice.tool_calls as Array<{ id: string; function?: { name?: string; arguments?: string } }> | undefined) ?? [];
    if (!calls.length) {
      return {
        text:
          String(choice.content ?? '').trim() ||
          'I want to get that right rather than guess. Tell me a little more, or I can connect you with the team.',
        toolCalls,
      };
    }

    messages.push(choice);
    for (const call of calls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(call.function?.arguments || '{}') as Record<string, unknown>;
      } catch {
        parsed = {};
      }
      delete parsed.property_id;
      delete parsed.propertyId;
      const name = String(call.function?.name ?? '');
      const result = await opts.executeTool(name, parsed);
      toolCalls.push({ name, arguments: parsed });
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: toolOutputJson(result),
      });
    }
  }

  return {
    text: 'I want to get that right rather than guess. Tell me a little more, or I can connect you with the team.',
    toolCalls,
  };
}

export async function runConciergeTurn(opts: {
  instructions: string;
  messages: ConciergeMessage[];
  tools: ConciergeTool[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}) {
  const model = getActiveModel();
  if (!model) throw new Error('VITORIA_MODEL_UNAVAILABLE');

  try {
    return await runResponsesLoop(model, opts);
  } catch (error) {
    logger.warn({ err: error }, 'Responses API turn failed; falling back to chat completions');
    return runChatLoop(model, opts);
  }
}

export async function responsesCreate(body: Record<string, unknown>) {
  const model = getActiveModel();
  const { ok, status, json } = await openaiJson('/v1/responses', { ...body, model });
  if (!ok) {
    logger.error({ status, error: json }, 'Responses API error');
    throw new Error('Vitoria could not complete that reply.');
  }
  return json;
}
