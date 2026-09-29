import { openai } from "@ai-sdk/openai";

import { TEXT_MODEL_ID } from "./lib/config";

export const textModel = openai(TEXT_MODEL_ID);
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

export * from "ai";
export * from "./lib";
