import React, { useState, useMemo, useEffect } from 'react';
import type { Anime, Episode } from '../types';
import { CloseIcon, DownloadIcon, ChevronLeftIcon } from './icons/Icons';

interface DownloadModalProps {
  anime: Anime;
  episodes: Episode[]; // These are the initial episodes from TMDB
  season: number;
  onClose: () => void;
}

type ModalStep = 'options' | 'pack';
type Quality = '1080p' | '720p' | '480p';

const EPISODES_PER_PAGE = 25;

const subtitleOptions = [
    { value: 'eng', label: 'English' },
    { value: 'spa', label: 'Spanish' },
    { value: 'por', label: 'Portuguese' },
    { value: 'ara', label: 'Arabic' },
    { value: 'fre', label: 'French' },
    { value: 'ger', label: 'German' },
    { value: 'ita', label: 'Italian' },
    { value: 'rus', label: 'Russian' },
];

const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + " GB";
    return (bytes / 1e6).toFixed(1) + " MB";
}

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
  const [downloadableEpisodes, setDownloadableEpisodes] = useState<Episode[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
  const [selectedQuality, setSelectedQuality] = useState<Quality>('720p');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('eng');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState('');
  const [episodePage, setEpisodePage] = useState(1);

  const [downloadingEpisodes, setDownloadingEpisodes] = useState<Set<number>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  // Simulate GET /api/series/{id}/downloads
  useEffect(() => {
    const fetchDownloadData = async () => {
      setIsLoadingData(true);
      setDataError(null);
      await sleep(500); // Simulate network latency

      try {
        if (!episodes || episodes.length === 0) {
            setDownloadableEpisodes([]);
            setIsLoadingData(false);
            return;
        }

        const data: Episode[] = episodes.map(ep => {
          const runtime = ep.runtime || 24; // Default to 24 mins
          const baseSize = runtime * 60 * 150 * 1024; // Base size for 480p

          return {
            ...ep,
            qualities: {
              '480p': { url: `https://mock.download/${anime.id}/s${season}/e${ep.episode_number}/480p.mp4`, size: baseSize * 1 },
              '720p': { url: `https://mock.download/${anime.id}/s${season}/e${ep.episode_number}/720p.mp4`, size: baseSize * 1.8 },
              '1080p': { url: `https://mock.download/${anime.id}/s${season}/e${ep.episode_number}/1080p.mp4`, size: baseSize * 3.5 },
            }
          };
        });
        setDownloadableEpisodes(data);
      } catch (e) {
        setDataError('Failed to fetch download information.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDownloadData();
  }, [anime.id, episodes, season]);

  useEffect(() => {
    document.body.classList.add('modal-open');
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
    return [...downloadableEpisodes].sort((a, b) => a.episode_number - b.episode_number);
  }, [downloadableEpisodes]);

  const totalEpisodePages = useMemo(() => Math.ceil(sortedEpisodes.length / EPISODES_PER_PAGE), [sortedEpisodes]);

  const paginatedEpisodes = useMemo(() => {
      const start = (episodePage - 1) * EPISODES_PER_PAGE;
      return sortedEpisodes.slice(start, start + EPISODES_PER_PAGE);
  }, [sortedEpisodes, episodePage]);

  const handleToggleEpisode = (epNum: number) => {
    setSelectedEpisodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(epNum)) newSet.delete(epNum);
        else newSet.add(epNum);
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedEpisodes(e.target.checked ? new Set(sortedEpisodes.map(ep => ep.episode_number)) : new Set());
  };

  const handleSingleDownload = async (episode: Episode) => {
    const epNum = episode.episode_number;

    if (downloadingEpisodes.has(epNum)) return;

    setDownloadingEpisodes(prev => new Set(prev).add(epNum));
    setDownloadProgress(prev => ({ ...prev, [epNum]: 0 }));

    try {
        const qualityInfo = episode.qualities?.[selectedQuality];
        if (!qualityInfo) {
            throw new Error(`Quality ${selectedQuality} not available.`);
        }
        const filename = `${anime.title.replace(/[^\w\s-]/g, '').replace(/ /g, '_')}_S${String(season).padStart(2, '0')}E${String(episode.episode_number).padStart(3, '0')}_[${selectedQuality}]_[${selectedSubtitle}].mp4`;

        // Simulate download with progress
        const downloadDuration = 1500 + Math.random() * 1500; // 1.5s to 3s
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            await sleep(downloadDuration / steps);
            setDownloadProgress(prev => ({ ...prev, [epNum]: (i / steps) * 100 }));
        }

        const mockContent = `This is a mock video file for ${filename}.\nURL: ${qualityInfo.url}\nSize: ${formatSize(qualityInfo.size)}`;
        const blob = new Blob([mockContent], { type: 'video/mp4' });

        triggerDownload(blob, filename);

    } catch (error) {
        alert(`Failed to download episode ${epNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setDownloadingEpisodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(epNum);
            return newSet;
        });
        setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[epNum];
            return newProgress;
        });
    }
  };
  
  const handleDownloadSelected = async () => {
    if(selectedEpisodes.size === 0) return;
    const episodesToDownload = sortedEpisodes.filter(ep => selectedEpisodes.has(ep.episode_number));
    for (const ep of episodesToDownload) {
        handleSingleDownload(ep);
        await sleep(200); // Stagger downloads
    }
  };

  const handleCreateZip = async () => {
    if (selectedEpisodes.size === 0) return;
    if (selectedEpisodes.size > 25) {
        alert("Please select 25 episodes or fewer to create a ZIP file.");
        return;
    }
    
    setIsZipping(true);
    setZipProgress(0);

    // Simulate POST /api/series/{id}/zip
    setZipStatus("Sending request to packaging server...");
    await sleep(1000);
    const jobId = `zip-job-${Date.now()}`;
    setZipProgress(10);
    
    // Simulate polling GET /api/zip/{job_id}
    const pollInterval = setInterval(() => {
      setZipProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 10 + Math.random() * 10;
      });
    }, 800);

    setZipStatus(`Packaging ${selectedEpisodes.size} episode(s)...`);
    
    await sleep(5000 + selectedEpisodes.size * 100); // Simulate zipping time
    
    clearInterval(pollInterval);
    setZipProgress(100);
    setZipStatus('Zip created! Your download will start shortly.');

    const filename = `${anime.title.replace(/[^\w\s-]/g, '').replace(/ /g, '_')}_S${String(season).padStart(2, '0')}_[${selectedQuality}]_[${selectedSubtitle}]_${selectedEpisodes.size}_episodes.zip`;
    const mockContent = `This is a mock ZIP file containing ${selectedEpisodes.size} episodes.\n\n` +
      Array.from(selectedEpisodes).map(epNum => {
        const episode = sortedEpisodes.find(e => e.episode_number === epNum);
        const epFilename = `${anime.title.replace(/[^\w\s-]/g, '').replace(/ /g, '_')}_S${String(season).padStart(2, '0')}E${String(epNum).padStart(3, '0')}_[${selectedQuality}]_[${selectedSubtitle}].mp4`;
        return `- ${epFilename} (URL: ${episode?.qualities?.[selectedQuality]?.url})`;
      }).join('\n');
    const blob = new Blob([mockContent], { type: 'application/zip' });
    triggerDownload(blob, filename);

    await sleep(2500);
    setIsZipping(false);
    onClose();
  };
  
  const isAllSelected = useMemo(() => {
    if (sortedEpisodes.length === 0) return false;
    return selectedEpisodes.size === sortedEpisodes.length;
  }, [selectedEpisodes.size, sortedEpisodes.length]);

  const isPageSelected = useMemo(() => {
    if (paginatedEpisodes.length === 0) return false;
    return paginatedEpisodes.every(ep => selectedEpisodes.has(ep.episode_number));
  }, [selectedEpisodes, paginatedEpisodes]);

  const handleSelectPage = () => {
    const pageEpisodeNumbers = paginatedEpisodes.map(ep => ep.episode_number);
    if (isPageSelected) {
        // Deselect all on page
        setSelectedEpisodes(prev => {
            const newSet = new Set(prev);
            pageEpisodeNumbers.forEach(num => newSet.delete(num));
            return newSet;
        });
    } else {
        // Select all on page
        setSelectedEpisodes(prev => {
            const newSet = new Set(prev);
            pageEpisodeNumbers.forEach(num => newSet.add(num));
            return newSet;
        });
    }
  };

  const PaginationControls = () => {
    if (totalEpisodePages <= 1) return null;
    return (
        <div className="flex flex-wrap justify-center items-center gap-2 pt-3">
            {[...Array(totalEpisodePages)].map((_, i) => {
                const pageNum = i + 1;
                return (<button key={pageNum} onClick={() => setEpisodePage(pageNum)} className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-transform hover:scale-105 ${ episodePage === pageNum ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-4))]' }`}>{pageNum}</button>);
            })}
        </div>
    );
  };

  const renderOptions = () => (
    <div className="relative">
      <button onClick={onClose} className="absolute top-0 right-0 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1" id="download-modal-title">Download Options</h2>
      <p className="text-sm text-[rgb(var(--text-muted))] mb-6">Choose how you'd like to download this series.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-[rgba(30,30,40,0.6)] p-4 rounded-2xl flex flex-col items-center text-center border border-transparent hover:border-[rgb(var(--color-primary-accent))] transition-all">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Nyaa (Torrent)</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-4 flex-grow">Opens Nyaa.si search page in a new tab.</p>
          <button onClick={handleNyaaDownload} className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">Open Nyaa Torrent</button>
        </div>
        <div className="flex-1 bg-[rgba(30,30,40,0.6)] p-4 rounded-2xl flex flex-col items-center text-center border border-transparent hover:border-[rgb(var(--color-primary-accent))] transition-all">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">Episode Pack</h3>
          <p className="text-xs text-[rgb(var(--text-muted))] mb-4 flex-grow">Select episodes to download individually or as a .zip file.</p>
          <button onClick={() => setStep('pack')} className="w-full py-2.5 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors">Open Episode Pack</button>
        </div>
      </div>
    </div>
  );

  const renderEpisodePack = () => (
    <div className="flex flex-col h-full p-0">
      <div className="flex-shrink-0 p-3 border-b border-white/10 flex justify-between items-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-10">
        <button onClick={() => setStep('options')} className="flex items-center gap-1 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))]"><ChevronLeftIcon className="w-5 h-5"/> <span className="font-semibold text-sm">Back</span></button>
        <h2 className="text-lg text-center font-bold text-[rgb(var(--text-primary))] truncate px-2" id="download-modal-title">Episodes — S{season}</h2>
        <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
      </div>

      {isZipping ? (
        <div className="flex-1 p-8 text-center flex flex-col justify-center items-center">
          <h3 className="text-xl font-bold mb-4">{zipStatus}</h3>
          <div className="w-full bg-[rgb(var(--surface-4))] rounded-full h-2.5"><div className="bg-[rgb(var(--color-primary))] h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${zipProgress}%` }}></div></div>
          <button onClick={() => setIsZipping(false)} className="mt-6 px-4 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20">Cancel</button>
        </div>
      ) : isLoadingData ? (
        <div className="flex-1 flex items-center justify-center p-12 text-center text-[rgb(var(--text-muted))]">Loading download data...</div>
      ) : dataError ? (
        <div className="flex-1 flex items-center justify-center p-12 text-center text-[rgb(var(--color-danger))]">{dataError}</div>
      ) : downloadableEpisodes.length > 0 ? (
        <>
        <div className="flex-shrink-0 p-3 flex flex-wrap justify-between items-center border-b border-white/10 gap-2">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} id="select-all-episodes" className="h-5 w-5 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]" />
                    <label htmlFor="select-all-episodes" className="font-semibold text-sm text-[rgb(var(--text-secondary))] cursor-pointer">Select All</label>
                </div>
                 <button 
                  onClick={handleSelectPage} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isPageSelected ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10 text-[rgb(var(--text-secondary))] hover:bg-white/20'}`}
                  >
                    {isPageSelected ? 'Deselect Page' : 'Select Page'}
                </button>
            </div>
            <div className="flex items-center gap-2">
                <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value as Quality)} className="bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-lg py-1.5 px-3 text-sm text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]"><option value="1080p">1080p</option><option value="720p">720p</option><option value="480p">480p</option></select>
                <select value={selectedSubtitle} onChange={e => setSelectedSubtitle(e.target.value)} className="bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-lg py-1.5 px-3 text-sm text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]">
                    {subtitleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 episode-list">
          <div className="space-y-1">
            {paginatedEpisodes.map(ep => {
                const epNum = ep.episode_number;
                const isDownloading = downloadingEpisodes.has(epNum);
                const progress = downloadProgress[epNum] ?? 0;
                return (
                    <label key={ep.episode_number} htmlFor={`ep-${ep.episode_number}`} className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors cursor-pointer ${selectedEpisodes.has(ep.episode_number) ? 'bg-[rgb(var(--color-primary))/0.2]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}>
                        <input id={`ep-${ep.episode_number}`} type="checkbox" checked={selectedEpisodes.has(ep.episode_number)} onChange={() => handleToggleEpisode(ep.episode_number)} className="h-5 w-5 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-sm">E{String(ep.episode_number).padStart(2, '0')}: {ep.name}</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">{formatSize(ep.qualities?.[selectedQuality]?.size ?? 0)}</p>
                        </div>
                        <div className="w-24 flex-shrink-0 flex items-center justify-end">
                            {isDownloading ? (
                                <div className="w-full flex items-center justify-end gap-2">
                                    <div className="w-12 h-1.5 bg-[rgb(var(--surface-4))] rounded-full overflow-hidden">
                                        <div className="h-full bg-[rgb(var(--color-primary))] rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="text-xs text-[rgb(var(--text-muted))] w-8 text-right">{progress.toFixed(0)}%</span>
                                </div>
                            ) : (
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSingleDownload(ep); }} className="p-2 bg-[rgb(var(--surface-3))] rounded-full text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-4))] transition-colors" aria-label={`Download Episode ${ep.episode_number}`}>
                                    <DownloadIcon />
                                </button>
                            )}
                        </div>
                    </label>
                );
            })}
          </div>
          <PaginationControls />
        </div>
        
        <div className="flex-shrink-0 border-t border-white/10 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-10 p-3">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="font-semibold text-sm text-[rgb(var(--text-secondary))]">{selectedEpisodes.size} episode(s) selected</p>
                <div className="flex gap-2">
                    <button onClick={handleDownloadSelected} disabled={selectedEpisodes.size === 0} className="px-4 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Direct Download</button>
                    <button onClick={handleCreateZip} disabled={selectedEpisodes.size === 0} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 shadow-lg shadow-[rgb(var(--shadow-color))/0.3] disabled:opacity-50 disabled:cursor-not-allowed">Create ZIP</button>
                </div>
            </div>
        </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-12 text-center text-[rgb(var(--text-muted))]">Episode downloads unavailable.</div>
      )}
    </div>
  );

  return (
    <>
      <div role="dialog" aria-modal="true" aria-labelledby="download-modal-title" className="modal-backdrop animate-cinematic-fade-in" onClick={onClose}></div>
        <div onClick={e => e.stopPropagation()} className="modal">
          {step === 'options' ? renderOptions() : renderEpisodePack()}
        </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 9998; }
        .modal {
          position: fixed;
          top: 10vh;
          left: 50%;
          transform: translateX(-50%);
          width: 90vw;
          max-width: 500px; /* Increased max-width for better layout */
          padding: 0; /* Padding is now handled internally by steps */
          max-height: 80vh;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          color: rgb(var(--text-primary));
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 25px rgba(var(--shadow-color), 0.2);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeInTop 0.3s ease;
        }
        .modal > div { padding: 16px; } /* Add padding back to direct children */
        .modal > .flex-col { padding: 0; } /* Remove for episode pack view */

        .episode-list { max-height: 50vh; overflow-y: auto; padding-right: 8px; scrollbar-width: thin; scrollbar-color: rgb(var(--scrollbar-thumb)) rgb(var(--scrollbar-track)); }
        .episode-list::-webkit-scrollbar { width: 8px; }
        .episode-list::-webkit-scrollbar-track { background: var(--scrollbar-track); }
        .episode-list::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }
        .episode-list::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
        body.modal-open { overflow: hidden; }
        @keyframes fadeInTop {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
};

export default DownloadModal;