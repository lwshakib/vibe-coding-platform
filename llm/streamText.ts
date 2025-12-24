import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const streamText = async (messages: any) => {
  const chat = await ai.chats.create({
    model: "gemini-2.5-flash",
    history: messages.slice(0, -1),
    config: {
      maxOutputTokens: 65535,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemInstruction: "You are a helpful assistant.",
    },
  });
  const stream = await chat.sendMessageStream({
    message: messages[messages.length - 1].content,
  });
  return stream;
};
