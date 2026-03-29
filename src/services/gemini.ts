import { GoogleGenAI, Type } from "@google/genai";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function getRecommendedSearchQueries(likedSongs: any[]): Promise<string[]> {
  if (!apiKey || likedSongs.length === 0) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these liked songs: ${likedSongs.map(s => `${s.title} by ${s.artist}`).join(', ')}, suggest 5 diverse music search queries (e.g., "90s rock hits", "lo-fi study beats", "modern jazz"). Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Failed to get AI recommendations:', error);
    return [];
  }
}
