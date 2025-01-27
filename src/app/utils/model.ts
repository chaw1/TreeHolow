// src/app/utils/model.ts
import { OpenAI } from "@langchain/openai";

export function getModel() {
  return new OpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    maxTokens: 1000,
  });
}