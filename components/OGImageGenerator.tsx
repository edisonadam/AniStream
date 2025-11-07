import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChevronLeftIcon, DownloadIcon, SparklesIcon } from './icons/Icons';

interface OGImageGeneratorProps {
  onGoBack: () => void;
}

const OGImageGenerator: React.FC<OGImageGeneratorProps> = ({ onGoBack }) => {
  const [prompt, setPrompt] = useState(
    `Create a simulated screenshot of a website called ANISTREAM for an Open Graph (og:image) preview, with a size of 1200x630 pixels. The image should show the clean, centered layout of the main page without any sidebars overlapping. It should feature a large hero/carousel section at the top with a featured anime, and a grid of anime cards below it. The aesthetic should be dark, modern, and with a 'liquid glass' feel, using blues and cyans as accent colors.`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
          },
      });
  
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      setImageUrl(`data:image/png;base64,${base64ImageBytes}`);
    } catch (e) {
      console.error("Gemini API call failed", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while generating the image.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'og-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>
      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-4 text-[rgb(var(--color-primary-accent))]">Open Graph Image Generator</h1>
        <p className="text-center text-[rgb(var(--text-muted))] mb-8">Use Gemini to generate a 1200x630px OG image for social media previews.</p>

        <div className="space-y-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-[rgb(var(--text-secondary))]">Image Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={12}
            className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl p-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-wait transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                <span>Generate Image</span>
              </div>
            )}
          </button>
        </div>
        
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        
        {imageUrl && (
          <div className="mt-8 text-center animate-cinematic-fade-in">
            <h2 className="text-xl font-bold mb-4">Generated Image</h2>
            <img src={imageUrl} alt="Generated OG" className="w-full max-w-2xl mx-auto rounded-lg shadow-lg border border-white/10" style={{aspectRatio: '16 / 9'}} />
            <button
              onClick={handleDownload}
              className="mt-4 px-6 py-2 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <DownloadIcon className="w-5 h-5" />
              Download Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OGImageGenerator;