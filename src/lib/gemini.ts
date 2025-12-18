import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiModel =
    | "gemini-2.0-flash"
    | "gemini-2.5-flash"
    | "gemini-2.5-flash-lite"
    | "gemini-3-flash";

export async function getGeminiResponse(
    prompt: string,
    modelName: GeminiModel = "gemini-2.0-flash",
    imageData?: string, // Base64 image
    apiKey?: string
) {
    try {
        const finalKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
        if (!finalKey) throw new Error("API Key is missing");

        const genAI = new GoogleGenerativeAI(finalKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        if (imageData) {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: imageData.split(",")[1] || imageData,
                        mimeType: "image/jpeg",
                    },
                },
            ]);
            return result.response.text();
        }

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error generating response. Please check your API key and model selection.";
    }
}
