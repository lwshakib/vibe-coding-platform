import { GoogleGenAI } from "@google/genai";
import { getModelName } from "./model";
import { getSingleApiKey } from "./model";
import { CODE_GENERATION_PROMPT } from "./prompts";

export const streamText = async (messages: any) => {
  const ai = new GoogleGenAI({
    apiKey: getSingleApiKey(),
  });
  const chat = await ai.chats.create({
    model: getModelName(),
    history: messages.slice(0, -1),
    config: {
      maxOutputTokens: 65535,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemInstruction: CODE_GENERATION_PROMPT,
    },
  });
  const stream = await chat.sendMessageStream({
    message: messages[messages.length - 1].content,
  });
  return stream;
};
