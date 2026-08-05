import OpenAI from "openai"
import dotenv from "dotenv"
dotenv.config();

export const OPENAI_IMAGE_MODEL =
  process.env.OPENAI_MODEL ?? "gpt-5.4"

let client: OpenAI | null = null

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


console.log("api key", OPENAI_API_KEY)

export function getOpenAI(): OpenAI {
  if (!client) {
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in env variables")
    }
    client = new OpenAI({ apiKey: OPENAI_API_KEY })
  }
  return client
}
