import { GOOGLE_API_KEY } from "@/lib/env";

export const getSingleApiKey = () => {
  return GOOGLE_API_KEY?.split(",")[
    Math.floor(Math.random() * GOOGLE_API_KEY.split(",").length)
  ];
};

export const getModelName = () => {
  const allowedModels = ["gemini-2.5-flash-lite"];
  return allowedModels[Math.floor(Math.random() * allowedModels.length)];
};
