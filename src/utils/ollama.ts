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
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en la ruta interna de IA: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error al generar respuesta AI:', error);
    throw error;
  }
};
