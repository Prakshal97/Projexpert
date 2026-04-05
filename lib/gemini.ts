import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error("Please define GEMINI_API_KEY in .env.local")
}

export const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Returns gemini-pro model (text-only, universally available).
 * Note: systemInstruction must be embedded in chat history for gemini-pro,
 * NOT passed as a parameter (only supported in gemini-1.5+).
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
}
