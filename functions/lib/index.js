"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithGroq = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const groq_sdk_1 = require("groq-sdk");
admin.initializeApp();
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY, // Secret never exposed to client
});
// Function to generate JSON using Groq
exports.generateWithGroq = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    try {
        const { prompt, model = "mixtral-8x7b-32768" } = data;
        if (!prompt) {
            throw new functions.https.HttpsError("invalid-argument", "Prompt is required");
        }
        const response = await groq.chat.completions.create({
            model,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 1,
            max_tokens: 1024,
        });
        return {
            success: true,
            result: response.choices[0]?.message?.content || "",
        };
    }
    catch (error) {
        console.error("Groq API error:", error);
        throw new functions.https.HttpsError("internal", "Error generating content");
    }
});
//# sourceMappingURL=index.js.map