import { GoogleGenAI, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { UploadedImage } from "../types";

// Helper to remove data URL prefix for API
const cleanBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const checkApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptForApiKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio SDK not found in window");
  }
};

export const generateAvatarVideo = async (
  images: UploadedImage[],
  promptOverride?: string
): Promise<string | null> => {
  try {
    // 1. Initialize Client (Assuming key is selected via promptForApiKey)
    // Note: We create a new instance to pick up the potentially newly selected key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Prepare Reference Images
    // Veo allows up to 3 reference images for 'veo-3.1-generate-preview'.
    // We prioritize Full, Front, Back in that order.
    const priorityOrder: Record<string, number> = { full: 1, front: 2, back: 3, closeup: 4 };
    
    const sortedImages = [...images].sort((a, b) => {
       return (priorityOrder[a.type] || 99) - (priorityOrder[b.type] || 99);
    });

    const selectedImages = sortedImages.slice(0, 3); // Max 3

    const referenceImagesPayload: VideoGenerationReferenceImage[] = selectedImages.map((img) => ({
      image: {
        imageBytes: cleanBase64(img.base64),
        mimeType: img.file.type || 'image/png',
      },
      referenceType: VideoGenerationReferenceType.ASSET, // Using ASSET as these are character reference sheets
    }));

    // 3. Construct Prompt
    const basePrompt = "A high-quality 3D render turntable video of this character. The character is rotating 360 degrees. Solid studio lighting, neutral background. 4k detail, seamless loop.";
    const finalPrompt = promptOverride ? `${basePrompt} ${promptOverride}` : basePrompt;

    // 4. Call API
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview', // Required for multiple reference images
      prompt: finalPrompt,
      config: {
        numberOfVideos: 1,
        referenceImages: referenceImagesPayload,
        resolution: '720p', // Required for this model feature
        aspectRatio: '16:9'
      }
    });

    // 5. Poll for completion
    // Video generation takes time.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log("Polling Veo operation...", operation.metadata);
    }

    if (operation.error) {
      throw new Error(operation.error.message || "Video generation failed");
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
        throw new Error("No video URI returned from API");
    }

    // Return the URI. The caller must append the API key when fetching.
    return videoUri;

  } catch (error) {
    console.error("Gemini Video Generation Error:", error);
    throw error;
  }
};