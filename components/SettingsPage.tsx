import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useWatchlist } from '../hooks/useWatchlist';
import { COLOR_PRESETS, VIDEO_SERVERS } from '../constants';
import { fetchMalUserAnimeList, fetchAnilistUserAnimeList } from '../api';
import type { Anime } from '../types';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-primary-accent))]">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Toggle: React.FC<{ label: string; note?: string; checked: boolean; onChange: () => void; }> = ({ label, note, checked, onChange }) => (
    <div className="flex flex-col pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
            <label className="font-semibold text-[rgb(var(--text-secondary))]">{label}</label>
            <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        {note && <p className="text-sm text-[rgb(var(--text-muted))] mt-1">{note}</p>}
    </div>
);

const Dropdown: React.FC<{label: string, options: {value: string, label: string}[], selected: string, onChange: (value: any) => void}> = ({ label, options, selected, onChange }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/10">
        <label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">{label}</label>
        <select
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="w-full sm:w-auto bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const TextInput: React.FC<{ label: string, type?: string, value: string, placeholder?: string, onChange: (value: string) => void }> = ({ label, type = 'text', value, placeholder, onChange }) => (
     <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/10">
        <label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">{label}</label>
        <input 
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className="w-full sm:w-auto bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
        />
    </div>
);


const SettingsPage: React.FC = () => {
    const { settings, updateSettings, restoreDefaults } = useSettings();
    const { clearProgress } = useWatchProgress();
    const { watchlist, overwriteWatchlist } = useWatchlist();
    const [isImporting, setIsImporting] = useState<'' | 'mal' | 'anilist'>('');
    const [importStatus, setImportStatus] = useState('');
    const [deleteBeforeImporting, setDeleteBeforeImporting] = useState(false);

    const handleClearWatchHistory = () => {
        if (window.confirm("Are you sure? This will clear all local watch history and continue watching progress.")) {
            clearProgress();
            alert("Watch history cleared.");
        }
    }
    
    const handleImport = async (type: 'mal' | 'anilist') => {
        setIsImporting(type);
        setImportStatus('Importing...');
        try {
            let externalList: Anime[] = [];
            if (type === 'mal') {
                if (!settings.malUsername) throw new Error("MyAnimeList username is not set.");
                externalList = await fetchMalUserAnimeList(settings.malUsername);
            } else {
                if (!settings.anilistUsername) throw new Error("AniList username is not set.");
                externalList = await fetchAnilistUserAnimeList(settings.anilistUsername);
            }

            if (deleteBeforeImporting) {
                overwriteWatchlist(externalList);
                setImportStatus(`Successfully imported ${externalList.length} titles and replaced your old watchlist.`);
            } else {
                const mergedList = [...watchlist];
                const watchlistIds = new Set(watchlist.map(a => a.id));
                
                let newItemsCount = 0;
                externalList.forEach(anime => {
                    if (!watchlistIds.has(anime.id)) {
                        mergedList.push(anime);
                        newItemsCount++;
                    }
                });
                overwriteWatchlist(mergedList);
                setImportStatus(`Successfully imported and merged ${newItemsCount} new title(s) into your watchlist.`);
            }

        } catch (e) {
            setImportStatus(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setTimeout(() => {
                setIsImporting('');
                setImportStatus('');
            }, 5000);
        }
    };
    
    const handleExportWatchlist = (format: 'json' | 'text' | 'xml') => {
        if (watchlist.length === 0) {
            alert("Your watchlist is empty. Nothing to export.");
            return;
        }

        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let filename = `anistream_watchlist_${date}`;
        let blob: Blob;

        switch (format) {
            case 'text':
                const textContent = watchlist.map(anime => anime.malUrl).filter(Boolean).join('\n');
                blob = new Blob([textContent], { type: 'text/plain' });
                filename += '.txt';
                break;
            case 'xml':
                const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<watchlist>\n${watchlist.map(anime => `  <anime>\n    <mal_id>${anime.id}</mal_id>\n    <title><![CDATA[${anime.title}]]></title>\n    <mal_url>${anime.malUrl || ''}</mal_url>\n  </anime>`).join('\n')}\n</watchlist>`;
                blob = new Blob([xmlContent], { type: 'application/xml' });
                filename += '.xml';
                break;
            case 'json':
            default:
                const jsonContent = JSON.stringify(watchlist, null, 2);
                blob = new Blob([jsonContent], { type: 'application/json' });
                filename += '.json';
                break;
        }

        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };
    
    const handleAccountMerge = () => {
        if (window.confirm("WARNING: This is a one-way process. The stats and data of the account you are merging FROM will be PERMANENTLY LOST. Only the data of your CURRENT account will remain. Do you wish to proceed?")) {
            alert("Account merging is not yet implemented. This is a placeholder for a future secure account merging flow.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsSection title="Account Merging">
                <div className="space-y-2 text-sm text-[rgb(var(--text-muted))] bg-[rgb(var(--color-danger))]/20 border border-[rgb(var(--color-danger))]/50 p-4 rounded-lg">
                    <p className="font-bold text-[rgb(var(--color-danger))]">DANGER ZONE: IRREVERSIBLE ACTION</p>
                    <p>Merging will transfer this account's data to another, permanently deleting the other account's original data (watchlist, history, etc.).</p>
                    <p>This cannot be undone.</p>
                </div>
                 <button onClick={handleAccountMerge} className="w-full text-center font-semibold text-white bg-[rgb(var(--color-danger))] hover:bg-red-700 py-2 rounded-lg">
                    Initiate Account Merge
                </button>
            </SettingsSection>
            
            <SettingsSection title="MyAnimeList Integration">
                <TextInput label="Username:" value={settings.malUsername} onChange={v => updateSettings({ malUsername: v })} placeholder="Enter MAL username" />
                <div className="flex justify-end">
                    <button onClick={() => handleImport('mal')} disabled={!settings.malUsername || isImporting === 'mal'} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-sm text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-wait">
                         {isImporting === 'mal' ? 'Importing...' : 'Import from MAL'}
                    </button>
                </div>
            </SettingsSection>
            
            <SettingsSection title="AniList Integration">
                <TextInput label="Username" value={settings.anilistUsername} onChange={v => updateSettings({ anilistUsername: v })} placeholder="Enter AniList username" />
                <TextInput label="Auth Token" type="password" value={settings.anilistToken} onChange={v => updateSettings({ anilistToken: v })} placeholder="Enter AniList auth token" />
                <p className="text-xs text-[rgb(var(--text-muted))] !mt-2 text-right">Get your token from AniList's <a href="https://anilist.co/settings/developer" target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--color-primary-accent))] hover:underline">developer settings</a>.</p>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <Toggle label="Auto Sync Progress" checked={settings.autoSyncAniList} onChange={() => updateSettings({ autoSyncAniList: !settings.autoSyncAniList })} note="Automatically update episode progress on your AniList profile." />
                    <button onClick={() => handleImport('anilist')} disabled={!settings.anilistUsername || isImporting === 'anilist'} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-sm text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-wait">
                        {isImporting === 'anilist' ? 'Importing...' : 'Import from AniList'}
                    </button>
                </div>
            </SettingsSection>

            <SettingsSection title="Data Management">
                {importStatus && <p className="text-center text-sm text-[rgb(var(--text-secondary))]">{importStatus}</p>}
                <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <label htmlFor="delete-before-import" className="font-semibold text-[rgb(var(--text-secondary))]">Erase List Before Importing:</label>
                        <input type="checkbox" id="delete-before-import" checked={deleteBeforeImporting} onChange={e => setDeleteBeforeImporting(e.target.checked)} className="h-4 w-4 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] focus:ring-offset-0 cursor-pointer" />
                    </div>
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-1">If checked, your current watchlist will be replaced by the imported list.</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                    <h4 className="font-semibold text-[rgb(var(--text-secondary))]">Export Watchlist:</h4>
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Export your watchlist for backup or use in other services.</p>
                    <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => handleExportWatchlist('text')} className="px-4 py-2 bg-white/10 text-sm text-[rgb(var(--text-secondary))] rounded-xl font-semibold hover:bg-white/20">TEXT</button>
                        <button onClick={() => handleExportWatchlist('xml')} className="px-4 py-2 bg-white/10 text-sm text-[rgb(var(--text-secondary))] rounded-xl font-semibold hover:bg-white/20">XML</button>
                        <button onClick={() => handleExportWatchlist('json')} className="px-4 py-2 bg-white/10 text-sm text-[rgb(var(--text-secondary))] rounded-xl font-semibold hover:bg-white/20">JSON</button>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Appearance">
                <Dropdown label="Color Preset" selected={settings.colorPreset} onChange={v => updateSettings({ colorPreset: v })} options={COLOR_PRESETS.map(p => ({ value: p.id, label: p.name }))} />
                <Dropdown label="Title Language" selected={settings.displayTitleLanguage} onChange={v => updateSettings({ displayTitleLanguage: v })} options={[{value: 'english', label: 'English'}, {value: 'japanese', label: 'Japanese'}]} />
                <Dropdown label="Load More Style" selected={settings.loadMoreMode} onChange={v => updateSettings({ loadMoreMode: v })} options={[{value: 'auto', label: 'Automatic (Infinite Scroll)'}, {value: 'manual', label: 'Manual (Button)'}]} />
                <Toggle label="Watch History on Home Page" checked={settings.showWatchHistoryOnHome} onChange={() => updateSettings({ showWatchHistoryOnHome: !settings.showWatchHistoryOnHome })} />
            </SettingsSection>

            <SettingsSection title="Content & Comments">
                <Toggle label="Restrict Adult Content" note="Hides explicit content (Hentai, Erotica)." checked={settings.restrictAdultContent} onChange={() => updateSettings({ restrictAdultContent: !settings.restrictAdultContent })} />
                 <Toggle label="Show Comments Section" checked={settings.showComments} onChange={() => updateSettings({ showComments: !settings.showComments })} />
                 <Toggle label="Blur Episode Thumbnails" checked={settings.blurEpisodeThumbnails} onChange={() => updateSettings({ blurEpisodeThumbnails: !settings.blurEpisodeThumbnails })} />
            </SettingsSection>

            <SettingsSection title="Media Player">
                <Dropdown label="Default Provider" selected={settings.videoServer} onChange={v => updateSettings({ videoServer: v })} options={VIDEO_SERVERS.map(s => ({ value: s.id, label: s.name }))} />
                <Dropdown label="Default Language" selected={settings.defaultLanguage} onChange={v => updateSettings({ defaultLanguage: v })} options={[{value: 'sub', label: 'Subtitles'}, {value: 'dub', label: 'Dubbing'}, {value: 'ssub', label: 'S-Sub'}]} />
                <Toggle label="Auto Play Next Episode" checked={settings.autoplayNext} onChange={() => updateSettings({ autoplayNext: !settings.autoplayNext })} />
                <Toggle label="Auto Skip Intro" checked={settings.autoSkipIntro} onChange={() => updateSettings({ autoSkipIntro: !settings.autoSkipIntro })} />
                 <Toggle label="Auto Skip Outro" checked={settings.autoSkipOutro} onChange={() => updateSettings({ autoSkipOutro: !settings.autoSkipOutro })} />
            </SettingsSection>

             <SettingsSection title="Other Utilities">
                <button onClick={handleClearWatchHistory} className="w-full text-left font-semibold text-[rgb(var(--color-danger))] hover:underline">Clear Watch History</button>
                <button onClick={restoreDefaults} className="w-full text-left font-semibold text-[rgb(var(--color-warning))] pt-4 border-t border-white/10 hover:underline">Restore Default Settings</button>
            </SettingsSection>
        </div>
    );
};

export default SettingsPage;