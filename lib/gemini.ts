import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-3.1-flash-lite';

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

/** Google Search 그라운딩이 활성화된 Gemini 모델 반환 */
export function getGeminiModel() {
  return getClient().getGenerativeModel({
    model: MODEL,
    tools: [{ googleSearch: {} } as never],
  });
}

export { MODEL };
