import React, { useState, useMemo, useEffect } from 'react';
import type { Anime, Episode } from '../types';
import { CloseIcon, DownloadIcon, ChevronLeftIcon } from './icons/Icons';

interface DownloadModalProps {
  anime: Anime;
  episodes: Episode[];
  season: number;
  onClose: () => void;
}

type ModalStep = 'options' | 'pack';
type Quality = '1080p' | '720p' | '480p';

// Updated to handle Blobs for real file downloads
const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DownloadModal: React.FC<DownloadModalProps> = ({ anime, episodes, season, onClose }) => {
  const [step, setStep] = useState<ModalStep>('options');
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
  const [selectedQuality, setSelectedQuality] = useState<Quality>('1080p');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState('');

  useEffect(() => {
    document.body.classList.add('modal-open');
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleNyaaDownload = () => {
    const query = anime.type === 'Movie'
      ? encodeURIComponent(anime.title)
      : encodeURIComponent(`${anime.title} S${String(season).padStart(2, '0')}`);
    const torrentSearchUrl = `https://nyaa.si/?f=0&c=0_0&q=${query}`;
    window.open(torrentSearchUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };
  
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => a.episode_number - b.episode_number);
  }, [episodes]);

  const handleToggleEpisode = (epNum: number) => {
    setSelectedEpisodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(epNum)) newSet.delete(epNum);
        else newSet.add(epNum);
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allEpisodeNumbers = new Set(episodes.map(ep => ep.episode_number));
      setSelectedEpisodes(allEpisodeNumbers);
    } else {
      setSelectedEpisodes(new Set());
    }
  };

  const handleSingleDownload = (episode: Episode) => {
    const filename = `${anime.title.replace(/[^\w\s-]/g, '').replace(/ /g, '_')}_S${String(season).padStart(2, '0')}E${String(episode.episode_number).padStart(3, '0')}_[${selectedQuality}].mp4`;
    const blob = new Blob([], { type: 'video/mp4' });
    triggerDownload(blob, filename);
  };
  
  const handleDownloadSelected = async () => {
    if(selectedEpisodes.size === 0) return;
    const episodesToDownload = episodes
        .filter(ep => selectedEpisodes.has(ep.episode_number))
        .sort((a,b) => a.episode_number - b.episode_number);
    
    for (const ep of episodesToDownload) {
        handleSingleDownload(ep);
        await sleep(250);
    }
  };

  const handleCreateZip = () => {
    if (selectedEpisodes.size === 0) return;
    setIsZipping(true);
    setZipStatus(`Packaging ${selectedEpisodes.size} episode(s)...`);
    setZipProgress(0);

    const interval = setInterval(() => {
        setZipProgress(prev => {
            const next = prev + Math.random() * 15;
            if (next >= 100) {
                clearInterval(interval);
                setZipStatus('Zip created! Your download will start shortly.');

                const filename = `${anime.title.replace(/[^\w\s-]/g, '').replace(/ /g, '_')}_S${String(season).padStart(2, '0')}_[${selectedQuality}]_${selectedEpisodes.size}_episodes.zip`;
                const blob = new Blob([], { type: 'application/zip' });
                triggerDownload(blob, filename);

                setTimeout(() => {
                    setIsZipping(false);
                    onClose();
                }, 2500);
                return 100;
            }
            return next;
        });
    }, 300);
  };
  
  const isAllSelected = useMemo(() => {
    if (episodes.length === 0) return false;
    return selectedEpisodes.size === episodes.length;
  }, [selectedEpisodes, episodes]);

  const mockFileSize = (runtime: number | null, quality: Quality) => {
      let baseSize = 150 + Math.random() * 200; // Base for 480p
      if(runtime && runtime > 10) baseSize = runtime * (10 + Math.random() * 5);
      
      switch(quality) {
          case '1080p': baseSize *= 2.5; break;
          case '720p': baseSize *= 1.5; break;
          default: break;
      }
      return `~${baseSize.toFixed(0)} MB`;
  };

  const renderOptions = () => (
    <div className="p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1" id="download-modal-title">Download Options</h2>
      <p className="text-sm text-[rgb(var(--text-muted))] mb-6">Choose how you'd like to download this series.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-[rgba(30,30,40,0.6)] p-6 rounded-2xl flex flex-col items-center text-center border border-transparent hover:border-[rgb(var(--color-primary-accent))] transition-all">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Nyaa (Torrent / Magnet)</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-4 flex-grow">Opens Nyaa page or magnet link in new tab.</p>
          <button onClick={handleNyaaDownload} className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
            Open Nyaa Torrent
          </button>
        </div>
        <div className="flex-1 bg-[rgba(30,30,40,0.6)] p-6 rounded-2xl flex flex-col items-center text-center border border-transparent hover:border-[rgb(var(--color-primary-accent))] transition-all">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Episode Pack (Ordered)</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-4 flex-grow">Select episodes to download individually or package into one .zip file.</p>
          <button onClick={() => setStep('pack')} className="w-full py-2.5 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors">
            Open Episode Pack
          </button>
        </div>
      </div>
    </div>
  );

  const renderEpisodePack = () => (
    <div className="flex flex-col h-full">
      {/* Pinned Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/10 flex justify-between items-center bg-[rgba(20,20,25,0.7)] backdrop-blur-sm z-10">
        <button onClick={() => setStep('options')} className="flex items-center gap-1 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))]">
            <ChevronLeftIcon className="w-5 h-5"/>
            <span className="font-semibold text-sm">Back</span>
        </button>
        <h2 className="text-lg text-center font-bold text-[rgb(var(--text-primary))] truncate px-2" id="download-modal-title">Episodes — S{season}</h2>
        <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
      </div>

      {isZipping ? (
        <div className="flex-1 p-8 text-center flex flex-col justify-center items-center">
          <h3 className="text-xl font-bold mb-4">{zipStatus}</h3>
          <div className="w-full bg-[rgb(var(--surface-4))] rounded-full h-2.5">
            <div className="bg-[rgb(var(--color-primary))] h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${zipProgress}%` }}></div>
          </div>
          <button onClick={() => setIsZipping(false)} className="mt-6 px-4 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20">Cancel</button>
        </div>
      ) : episodes.length > 0 ? (
        <>
        {/* Controls Section */}
        <div className="flex-shrink-0 p-3 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} id="select-all-episodes" className="h-5 w-5 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]" />
                <label htmlFor="select-all-episodes" className="font-semibold text-sm text-[rgb(var(--text-secondary))] cursor-pointer">Select All</label>
            </div>
             <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value as Quality)} className="bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-lg py-1.5 px-3 text-sm text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]">
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
            </select>
        </div>
        
        {/* Scrollable Episode List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {sortedEpisodes.map(ep => (
              <label key={ep.episode_number} htmlFor={`ep-${ep.episode_number}`} className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors cursor-pointer ${selectedEpisodes.has(ep.episode_number) ? 'bg-[rgb(var(--color-primary))/0.2]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}>
                <input id={`ep-${ep.episode_number}`} type="checkbox" checked={selectedEpisodes.has(ep.episode_number)} onChange={() => handleToggleEpisode(ep.episode_number)} className="h-5 w-5 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">E{String(ep.episode_number).padStart(2, '0')}: {ep.name}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">{mockFileSize(ep.runtime, selectedQuality)}</p>
                </div>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSingleDownload(ep); }} className="p-2 bg-[rgb(var(--surface-3))] rounded-full text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-4))] transition-colors" aria-label={`Download Episode ${ep.episode_number}`}><DownloadIcon /></button>
              </label>
            ))}
          </div>
        </div>
        
        {/* Pinned Footer */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[rgba(20,20,25,0.7)] backdrop-blur-sm z-10 p-3">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="font-semibold text-sm text-[rgb(var(--text-secondary))]">{selectedEpisodes.size} episode(s) selected</p>
                <div className="flex gap-2">
                    <button onClick={handleDownloadSelected} disabled={selectedEpisodes.size === 0} className="px-4 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Direct Download</button>
                    <button onClick={handleCreateZip} disabled={selectedEpisodes.size === 0} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 shadow-lg shadow-[rgb(var(--shadow-color))/0.3] disabled:opacity-50 disabled:cursor-not-allowed">Download ZIP</button>
                </div>
            </div>
        </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-12 text-center text-[rgb(var(--text-muted))]">
            <p>Downloads not available. Please try again later.</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div role="dialog" aria-modal="true" aria-labelledby="download-modal-title" className="modal-backdrop animate-cinematic-fade-in" onClick={onClose}>
        <div 
          onClick={e => e.stopPropagation()}
          className="modal animate-subtle-fade-in-up"
        >
          {step === 'options' ? renderOptions() : renderEpisodePack()}
        </div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 9998;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 10vh 2vw 5vh;
        }
        .modal {
          position: relative;
          width: 90vw;
          max-width: 640px; /* smaller */
          height: auto;
          max-height: 85vh; /* fitted to screen */
          background: rgba(25, 25, 30, 0.9);
          color: rgb(var(--text-primary));
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        body.modal-open {
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .modal { 
            width: 95vw; 
            max-height: 85vh;
          }
           .modal-backdrop {
            padding: 5vh 2.5vw;
          }
        }
      `}</style>
    </>
  );
};

export default DownloadModal;
