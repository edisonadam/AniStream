import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { Anime } from '../types';
import { CloseIcon, SparklesIcon, PlayIcon } from './icons/Icons';

interface FindSourcesModalProps {
  anime: Anime;
  episode: number;
  onClose: () => void;
  onSelectSource: (url: string) => void;
}

const SITES = ['animekai.to', 'anix.to', 'aniwave.to'];
const LANGUAGES = ['sub', 'dub'];

interface SearchResult {
  videoUrl: string | null;
  introUrl: string | null;
  outroUrl: string | null;
}

const FindSourcesModal: React.FC<FindSourcesModalProps> = ({ anime, episode, onClose, onSelectSource }) => {
  const [site, setSite] = useState(SITES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setResults(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const schema = {
        type: Type.OBJECT,
        properties: {
          videoUrl: { type: Type.STRING, description: "The 'src' URL of the main video player iframe." },
          introUrl: { type: Type.STRING, description: 'The URL for an intro/opening video.' },
          outroUrl: { type: Type.STRING, description: 'The URL for an outro/ending video.' },
        },
        required: ['videoUrl', 'introUrl', 'outroUrl']
      };

      const prompt = `
        You are an expert web scraping assistant. Your task is to find video sources from specified anime streaming websites. You must return your findings in the structured JSON format requested.
        
        Instructions:
        1. Go to the website: ${site}
        2. Find the anime titled: "${anime.title_english || anime.title}"
        3. Navigate to episode number: ${episode}
        4. Make sure the selected language version is: ${language}
        5. Once on the correct episode page, extract the following information:
           - The 'src' URL of the main video player iframe.
           - Any URL for an "intro" or "opening" video, if available on the page.
           - Any URL for an "outro" or "ending" video, if available on the page.
        
        Return the data in the specified JSON format. If a piece of information cannot be found, return null for that field. Do not make up information.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      });

      const jsonString = response.text.trim();
      const parsedResult: SearchResult = JSON.parse(jsonString);
      
      if (!parsedResult.videoUrl) {
          setError("AI couldn't find a video source. The site might be down or the anime may not be available there.");
      }
      setResults(parsedResult);

    } catch (e) {
      console.error("Gemini API call failed", e);
      setError(e instanceof Error ? `AI Error: ${e.message}` : "An unknown error occurred while searching.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const ResultItem: React.FC<{ label: string; url: string | null, onPlay?: () => void }> = ({ label, url, onPlay }) => {
    if (!url) return null;
    return (
      <div>
        <label className="text-sm font-semibold text-[rgb(var(--text-muted))]">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <input readOnly value={url} className="flex-1 bg-[rgb(var(--surface-input))] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono" />
          {onPlay && (
            <button onClick={onPlay} className="p-2 bg-white/10 rounded-lg hover:bg-[rgb(var(--color-primary))] transition-colors" title="Play Now"><PlayIcon className="w-4 h-4"/></button>
          )}
          <button onClick={() => navigator.clipboard.writeText(url)} className="p-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">Copy</button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998] flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
      <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-lg m-4 p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
        
        <div className="text-center mb-6">
          <SparklesIcon className="w-8 h-8 mx-auto text-[rgb(var(--color-primary-accent))]" />
          <h2 className="text-2xl font-bold mt-2">Find External Sources</h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">Using AI (Beta)</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Target Site</label>
            <select value={site} onChange={e => setSite(e.target.value)} className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-xl px-3 py-2">
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Language</label>
            <div className="flex bg-[rgb(var(--surface-input))] rounded-xl p-1">
              {LANGUAGES.map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-colors ${language === lang ? 'bg-[rgb(var(--color-primary))] text-white' : 'hover:bg-white/10'}`}>{lang}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSearch} disabled={isLoading} className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div><span>Searching with AI...</span></>
            ) : (
                <><SparklesIcon className="w-5 h-5"/><span>Find Sources</span></>
            )}
        </button>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        
        {results && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3 animate-cinematic-fade-in">
            <h3 className="font-bold">Results</h3>
            <ResultItem label="Main Video Source" url={results.videoUrl} onPlay={() => results.videoUrl && onSelectSource(results.videoUrl)} />
            <ResultItem label="Intro Source" url={results.introUrl} />
            <ResultItem label="Outro Source" url={results.outroUrl} />
            {!results.videoUrl && !results.introUrl && !results.outroUrl && <p className="text-sm text-center text-[rgb(var(--text-muted))]">The AI couldn't find any sources on this site.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindSourcesModal;
