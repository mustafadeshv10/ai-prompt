
import { GoogleGenAI } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the Base64 prefix `data:image/jpeg;base64,`, remove it.
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as data URL."));
      }
    };
    reader.onerror = (error) => {
        reject(error);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const generatePromptFromImage = async (imageFile: File): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key is not configured. Please set up your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const imagePart = await fileToGenerativePart(imageFile);
        
        const textPart = {
            text: `Analyze this image and describe it in extreme detail. The description must be a creative, evocative, and inspiring prompt suitable for an advanced text-to-image AI like Midjourney or DALL-E.

            Your description should cover:
            - **Subject:** What is the main focus? Describe it with rich adjectives.
            - **Composition:** How is the shot framed (e.g., close-up, wide shot, rule of thirds)?
            - **Environment/Background:** What surrounds the subject? Describe the setting.
            - **Lighting:** Describe the quality of light (e.g., soft morning light, dramatic studio lighting, neon glow).
            - **Color Palette:** What are the dominant and accent colors?
            - **Style/Medium:** Is it photorealistic, an oil painting, digital art, 3D render, etc.?
            - **Mood/Atmosphere:** What feeling does the image evoke (e.g., serene, chaotic, nostalgic, futuristic)?
            
            Combine these elements into a single, cohesive paragraph. Write the response in English.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
        });
        
        const text = response.text;
        if (text) {
            return text;
        } else {
            // Check for more specific reasons for empty response if available
            const finishReason = response.candidates?.[0]?.finishReason;
            if (finishReason === 'SAFETY') {
                throw new Error("Could not generate a prompt. The image was blocked due to safety policies.");
            }
            throw new Error("Failed to generate prompt. The model returned an empty response.");
        }
    } catch (error: any) {
        console.error("Gemini API call failed:", error);
        // Provide a more user-friendly error message
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided API key is not valid. Please check your configuration.');
        }
        throw new Error(error.message || "An error occurred while communicating with the AI model.");
    }
};
