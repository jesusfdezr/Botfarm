import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaResponse {
  message?: {
    content?: string;
  };
  error?: string;
}

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT || 'https://ollama.com/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'qwen3.5:397b-cloud';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || process.env.NEXT_PUBLIC_OLLAMA_API_KEY;

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === 'user' || candidate.role === 'assistant' || candidate.role === 'system') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  );
};

export async function POST(request: Request) {
  if (!OLLAMA_API_KEY) {
    return NextResponse.json(
      { error: 'El servidor no tiene configurada la API key de Ollama.' },
      { status: 500 },
    );
  }

  let payload: { messages?: unknown };

  try {
    payload = (await request.json()) as { messages?: unknown };
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON valido.' }, { status: 400 });
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0 || !payload.messages.every(isChatMessage)) {
    return NextResponse.json({ error: 'La solicitud debe incluir una lista valida de mensajes.' }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: payload.messages,
        stream: false,
      }),
    });

    const data = (await upstreamResponse.json().catch(() => ({}))) as OllamaResponse;

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: data.error || `Error en la API de Ollama Cloud: ${upstreamResponse.status}` },
        { status: upstreamResponse.status },
      );
    }

    if (!data.message?.content) {
      return NextResponse.json({ error: 'Ollama no devolvio contenido util.' }, { status: 502 });
    }

    return NextResponse.json({ message: { content: data.message.content } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al contactar con Ollama.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
