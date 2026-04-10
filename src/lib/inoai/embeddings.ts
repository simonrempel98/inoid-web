// @ts-nocheck
import OpenAI from 'openai'

const MODEL = 'text-embedding-3-small' // 1536 Dimensionen, sehr günstig

let client: OpenAI | null = null
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

/** Mehrere Texte auf einmal einbetten (1 API-Call pro Batch) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const openai = getClient()
  const res = await openai.embeddings.create({ model: MODEL, input: texts })
  return res.data.sort((a, b) => a.index - b.index).map(d => d.embedding)
}

/** Einzelnen Text einbetten */
export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text])
  return embedding
}
