const OLLAMA_ENDPOINT = import.meta.env.VITE_OLLAMA_ENDPOINT || 'https://ollama.com/api/chat';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3.5:397b-cloud';
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: {
    content: string;
  };
  error?: string;
}

export const generateAIResponse = async (messages: ChatMessage[]): Promise<string> => {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY no configurada en .env.local');
  }

  try {
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en la API de Ollama Cloud: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error al generar respuesta AI:', error);
    throw error;
  }
};
