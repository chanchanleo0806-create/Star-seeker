import { GoogleGenAI } from "@google/genai";

export interface SearchResult {
  text: string;
  sources: { uri: string; title: string }[];
  suggestion?: string;
}

export async function* performSearchStream(query: string): AsyncGenerator<{ text?: string; sources?: { uri: string; title: string }[]; suggestion?: string; done?: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `사용자 검색어: "${query}"
      
      1. 오타가 있다면 첫 줄에 "추천검색어: [수정된 검색어]"라고 적으세요.
      2. 그 다음 줄부터 검색 결과 요약을 한국어로 매우 간결하게 작성하세요.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    let suggestion: string | undefined;
    let sources: { uri: string; title: string }[] = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;

      // Extract suggestion if present
      if (!suggestion && fullText.includes("추천검색어:")) {
        const lines = fullText.split('\n');
        const suggestionLine = lines.find(line => line.trim().startsWith("추천검색어:"));
        if (suggestionLine && (suggestionLine.includes("\n") || fullText.split('\n').length > 1)) {
           suggestion = suggestionLine.replace("추천검색어:", "").trim();
        }
      }

      // Extract sources
      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      if (chunks.length > 0) {
        const newSources = chunks
          .filter(c => c.web)
          .map(c => ({
            uri: c.web!.uri,
            title: c.web!.title || c.web!.uri
          }));
        
        const allSources = [...sources, ...newSources];
        sources = Array.from(new Map(allSources.map(s => [s.uri, s])).values());
      }

      yield { 
        text: fullText.replace(/^추천검색어:.*$/m, "").trim(), 
        suggestion, 
        sources 
      };
    }

    yield { done: true };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}
