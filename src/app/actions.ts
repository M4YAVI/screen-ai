"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server"; // Note: /server import
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function transcribeAudio(formData: FormData) {
    try {
        const file = formData.get("audio") as Blob;
        const apiKey = formData.get("apiKey") as string;
        const context = formData.get("context") as string;
        const modelName = formData.get("model") as string || "gemini-2.5-flash";

        if (!file || !apiKey) {
            throw new Error("Missing audio file or API key");
        }

        // Initialize Gemini with the provided key using the server-side SDKs
        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Convert Blob to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Create a temporary file path
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.webm`);

        // Write buffer to temp file
        await fs.writeFile(tempFilePath, buffer);

        try {
            // 1. Upload the file to Gemini
            console.log("Uploading file to Gemini...");
            const uploadResult = await fileManager.uploadFile(tempFilePath, {
                mimeType: "audio/webm",
                displayName: `Audio Recording ${new Date().toISOString()}`,
            });

            const fileUri = uploadResult.file.uri;
            console.log(`Uploaded file: ${fileUri}`);

            // 2. Wait for processing to complete
            let fileState = uploadResult.file.state;
            console.log(`Current state: ${fileState}`);

            while (fileState === FileState.PROCESSING) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const fileStatus = await fileManager.getFile(uploadResult.file.name);
                fileState = fileStatus.state;
                console.log(`Polled state: ${fileState}`);
            }

            if (fileState === FileState.FAILED) {
                throw new Error("Audio processing failed on Gemini servers.");
            }

            // 3. Generate content using the file URI
            console.log("Generating transcription...");
            const prompt = context
                ? `Context: ${context}. Transcribe this audio precisely. Identify speakers if possible. Format it clearly.`
                : "Transcribe this audio precisely. Identify speakers if possible. Format it clearly.";

            const result = await model.generateContent([
                { text: prompt },
                {
                    fileData: {
                        mimeType: uploadResult.file.mimeType,
                        fileUri: fileUri
                    }
                },
            ]);

            const responseText = result.response.text();

            // Cleanup: Delete file from Gemini (optional, but good practice)
            // await fileManager.deleteFile(uploadResult.file.name); 

            return { success: true, text: responseText };

        } finally {
            // Always clean up local temp file
            await fs.unlink(tempFilePath).catch((err) => console.error("Failed to cleanup temp file:", err));
        }

    } catch (error: any) {
        console.error("Transcription Action Error:", error);
        return { success: false, error: error.message };
    }
}
