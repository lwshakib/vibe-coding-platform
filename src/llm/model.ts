import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GOOGLE_API_KEY } from "@/env";

export const getSingleAPIKey = () => {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set");
  }
  

  return GOOGLE_API_KEY.split(",")[Math.floor(Math.random() * GOOGLE_API_KEY.split(",").length)];
};

export const GeminiModel = () => {
  const gemini = createGoogleGenerativeAI({
    apiKey: getSingleAPIKey(),
  });
  return gemini("gemini-2.5-flash");
};
