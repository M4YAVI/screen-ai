import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiModel =
    | "gemini-2.0-flash"
    | "gemini-2.5-flash"
    | "gemini-2.5-flash-lite"
    | "gemini-3-flash";

export async function getGeminiResponse(
    prompt: string,
    modelName: GeminiModel = "gemini-2.5-flash",
    imageData?: string, // Base64 image
    audioData?: string, // Base64 audio
    apiKey?: string,
    useGrounding: boolean = false,
    history: { role: "user" | "model"; parts: { text: string }[] }[] = []
) {
    try {
        const finalKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
        if (!finalKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(finalKey);

        // Define tools if grounding is requested
        // @ts-ignore
        const tools: any = useGrounding ? [{ googleSearch: {} }] : [];

        const model = genAI.getGenerativeModel({
            model: modelName,
            tools: tools
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 8000,
            },
        });

        const parts: any[] = [{ text: prompt }];

        if (imageData) {
            parts.push({
                inlineData: {
                    data: imageData.split(",")[1] || imageData,
                    mimeType: "image/png",
                },
            });
        }

        if (audioData) {
            parts.push({
                inlineData: {
                    data: audioData.split(",")[1] || audioData,
                    mimeType: "audio/webm; codecs=opus", // Common web recording format
                },
            });
        }

        const result = await chat.sendMessage(parts);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error generating response. Please check your API key and model selection.";
    }
}

