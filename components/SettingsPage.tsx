import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../hooks/useToast';
import { COLOR_PRESETS, VIDEO_SERVERS } from '../constants';
import { fetchMalUserAnimeList, fetchAnilistUserAnimeList } from '../api';
import type { Anime } from '../types';
import ShortcutSettings from './ShortcutSettings'; // Import the new component

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-primary-accent))]">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Toggle: React.FC<{ label: string; tooltip?: string; checked: boolean; onChange: () => void; }> = ({ label, tooltip, checked, onChange }) => (
    <div className="flex flex-col pt-4 border-t border-white/10" title={tooltip}>
        <div className="flex justify-between items-center">
            <label className="font-semibold text-[rgb(var(--text-secondary))]">{label}</label>
            <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`} aria-checked={checked} role="switch">
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        {tooltip && <p className="text-sm text-[rgb(var(--text-muted))] mt-1">{tooltip}</p>}
    </div>
);

const Dropdown: React.FC<{label: string, tooltip?: string, options: {value: string, label: string}[], selected: string, onChange: (value: any) => void}> = ({ label, tooltip, options, selected, onChange }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/10" title={tooltip}>
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
    const { addToast } = useToast();
    const [isImporting, setIsImporting] = useState<'' | 'mal' | 'anilist'>('');
    const [importStatus, setImportStatus] = useState('');
    const [deleteBeforeImporting, setDeleteBeforeImporting] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    const handleNotificationToggle = () => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    addToast('Push notifications enabled!', 'success');
                    new Notification('ANISTREAM', { body: 'Notifications enabled!' });
                } else {
                    addToast('Push notifications were not enabled.', 'warning');
                }
            });
        } else if (Notification.permission === 'denied') {
            addToast('Notifications are blocked by your browser.', 'error');
        } else if (Notification.permission === 'granted') {
            addToast('To disable notifications, please use browser settings.', 'info');
        }
    };

    const handleClearWatchHistory = () => {
        if (window.confirm("Are you sure? This will clear all local watch history and continue watching progress.")) {
            clearProgress();
            addToast("Watch history cleared.", 'info');
        }
    }
    
    const handleImport = async (type: 'mal' | 'anilist') => {
        setIsImporting(type);
        setImportStatus('Importing...');
        addToast(`Starting import from ${type === 'mal' ? 'MyAnimeList' : 'AniList'}...`, 'info');
        try {
            let externalList: Anime[] = [];
            if (type === 'mal') {
                if (!settings.malUsername) throw new Error("MyAnimeList username is not set.");
                externalList = await fetchMalUserAnimeList(settings.malUsername);
            } else {
                if (!settings.anilistUsername) throw new Error("AniList username is not set.");
                externalList = await fetchAnilistUserAnimeList(settings.anilistUsername);
            }

            let finalMessage = '';

            if (deleteBeforeImporting) {
                overwriteWatchlist(externalList);
                finalMessage = `Successfully imported ${externalList.length} titles and replaced your old watchlist.`;
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
                finalMessage = `Successfully imported and merged ${newItemsCount} new title(s) into your watchlist.`;
            }

            setImportStatus(finalMessage);
            addToast(finalMessage, 'success');

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setImportStatus(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsImporting('');
            setTimeout(() => setImportStatus(''), 5000);
        }
    };
    
    const handleExportWatchlist = (format: 'json' | 'text' | 'xml') => {
        if (watchlist.length === 0) {
            addToast("Your watchlist is empty. Nothing to export.", 'warning');
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
        addToast(`Exported watchlist as ${format.toUpperCase()}`, 'success');
    };

    const handleRestorePlaybackDefaults = () => {
        if (window.confirm("Are you sure you want to restore playback settings to their default values?")) {
            updateSettings({
                homepageTrailer: true,
                autoPlay: true,
                autoSkip: false,
                startMuted: false,
                videoLoadStrategy: 'idle',
                rememberVolume: true,
                rememberPlaybackSpeed: false,
                showSeekThumbnails: false,
            });
            addToast("Playback settings restored to default.", "success");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsSection title="Appearance">
                <Dropdown label="Color Preset" selected={settings.colorPreset} onChange={v => updateSettings({ colorPreset: v })} options={COLOR_PRESETS.map(p => ({ value: p.id, label: p.name }))} tooltip="Change the primary color theme of the website." />
                <Dropdown label="Title Language" selected={settings.displayTitleLanguage} onChange={v => updateSettings({ displayTitleLanguage: v })} options={[{value: 'english', label: 'English'}, {value: 'japanese', label: 'Japanese'}]} tooltip="Choose whether to display anime titles in English or Japanese (Romaji)." />
                <Dropdown label="Load More Style" selected={settings.loadMoreMode} onChange={v => updateSettings({ loadMoreMode: v })} options={[{value: 'auto', label: 'Automatic (Infinite Scroll)'}, {value: 'manual', label: 'Manual (Button)'}]} tooltip="How new content is loaded on grid pages." />
                <Toggle label="Force Desktop Mode" checked={settings.forceDesktopMode} onChange={() => updateSettings({ forceDesktopMode: !settings.forceDesktopMode })} tooltip="Forces the desktop layout on all devices, including mobile." />
                <Toggle label="Watch History on Home Page" checked={settings.showWatchHistoryOnHome} onChange={() => updateSettings({ showWatchHistoryOnHome: !settings.showWatchHistoryOnHome })} tooltip="Show or hide the 'Continue Watching' section on the home page." />
            </SettingsSection>
            
            <SettingsSection title="Playback & Homepage">
                <Toggle label="Homepage Trailer" checked={settings.homepageTrailer} onChange={() => updateSettings({ homepageTrailer: !settings.homepageTrailer })} tooltip="Stop video previews on the homepage for a streamlined experience. (Consumes more data)" />
                <Toggle label="Auto Play Next Episode" checked={settings.autoPlay} onChange={() => updateSettings({ autoPlay: !settings.autoPlay })} tooltip="Automatically starts the next episode without user interaction." />
                <Toggle label="Auto Skip Intro/Outro" checked={settings.autoSkip} onChange={() => updateSettings({ autoSkip: !settings.autoSkip })} tooltip="Automatically skips intros and outros for a seamless experience." />
                <Toggle label="Start Videos Muted" checked={settings.startMuted} onChange={() => updateSettings({ startMuted: !settings.startMuted })} tooltip="Choose whether to start videos muted or unmuted." />
                <Dropdown 
                    label="Video Load Strategy" 
                    selected={settings.videoLoadStrategy} 
                    onChange={v => updateSettings({ videoLoadStrategy: v })} 
                    options={[
                        {value: 'idle', label: 'Idle (Recommended)'}, 
                        {value: 'visible', label: 'Visible'}, 
                        {value: 'eager', label: 'Eager'}
                    ]}
                    tooltip="Control when and how video resources begin loading." 
                />
                <Toggle label="Remember Player Volume" checked={settings.rememberVolume} onChange={() => updateSettings({ rememberVolume: !settings.rememberVolume })} tooltip="Saves and restores the player volume between sessions." />
                <Toggle label="Remember Playback Speed" checked={settings.rememberPlaybackSpeed} onChange={() => updateSettings({ rememberPlaybackSpeed: !settings.rememberPlaybackSpeed })} tooltip="Saves and restores the playback speed between sessions." />
                <Toggle label="Show Seek Thumbnails (Beta)" checked={settings.showSeekThumbnails} onChange={() => updateSettings({ showSeekThumbnails: !settings.showSeekThumbnails })} tooltip="Show a thumbnail preview when hovering over the seek bar. May not be available for all sources." />
                 <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button onClick={handleRestorePlaybackDefaults} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-semibold text-[rgb(var(--text-secondary))] hover:bg-white/20">Restore Playback Defaults</button>
                </div>
            </SettingsSection>


            <SettingsSection title="Notifications">
                <Toggle 
                    label="Enable Desktop Push Notifications" 
                    checked={notificationPermission === 'granted'} 
                    onChange={handleNotificationToggle}
                    tooltip="Allow the site to send you notifications for friend requests, replies, etc." 
                />
                <Toggle label="Email Notifications" checked={settings.emailNotifications} onChange={() => updateSettings({ emailNotifications: !settings.emailNotifications })} tooltip="Receive notifications via email (feature coming soon)." />
                <Toggle label="In-App Toast Alerts" checked={settings.inAppToastAlerts} onChange={() => updateSettings({ inAppToastAlerts: !settings.inAppToastAlerts })} tooltip="Show pop-up alerts for actions like adding to watchlist." />
                <Toggle label="MAL/AniList Sync Alerts" checked={settings.malSyncAlerts} onChange={() => updateSettings({ malSyncAlerts: !settings.malSyncAlerts })} tooltip="Show toast alerts for sync status." />
                <Toggle label="Auto-Mark as Read" checked={settings.autoMarkAsRead} onChange={() => updateSettings({ autoMarkAsRead: !settings.autoMarkAsRead })} tooltip="Automatically mark notifications as read after opening the dropdown." />
            </SettingsSection>

            <SettingsSection title="Content">
                <Toggle label="Restrict Adult Content" checked={settings.restrictAdultContent} onChange={() => updateSettings({ restrictAdultContent: !settings.restrictAdultContent })} tooltip="Hides explicit content (e.g., Hentai, Erotica). Requires login to disable." />
                 <Toggle label="Show Comments Section" checked={settings.showComments} onChange={() => updateSettings({ showComments: !settings.showComments })} tooltip="Show or hide the comments section on the player page." />
                 <Toggle label="Blur Episode Thumbnails" checked={settings.blurEpisodeThumbnails} onChange={() => updateSettings({ blurEpisodeThumbnails: !settings.blurEpisodeThumbnails })} tooltip="Blur thumbnails in the episode list to avoid spoilers." />
                 <Toggle label="Hide Filler Episodes" checked={settings.hideFillerEpisodes} onChange={() => updateSettings({ hideFillerEpisodes: !settings.hideFillerEpisodes })} tooltip="Automatically hide episodes marked as filler in the player." />
                 <Dropdown label="Default Provider" selected={settings.videoServer} onChange={v => updateSettings({ videoServer: v })} options={VIDEO_SERVERS.map(s => ({ value: s.id, label: s.name }))} tooltip="Choose your preferred video source provider." />
                <Dropdown label="Default Language" selected={settings.defaultLanguage} onChange={v => updateSettings({ defaultLanguage: v })} options={[{value: 'sub', label: 'Subtitles'}, {value: 'dub', label: 'Dubbing'}, {value: 'ssub', label: 'S-Sub'}]} tooltip="Select your preferred audio/subtitle language."/>
                <Dropdown label="Player Focus Mode" selected={settings.playerFocusMode} onChange={v => updateSettings({ playerFocusMode: v })} options={[{value: 'overlay', label: 'Overlay'}, {value: 'fullscreen', label: 'Fullscreen'}]} tooltip="Choose the behavior for the player 'Focus' button." />
            </SettingsSection>
            
            <SettingsSection title="Keyboard Shortcuts">
                <ShortcutSettings />
            </SettingsSection>
            
            <SettingsSection title="MyAnimeList Integration">
                <TextInput label="Username:" value={settings.malUsername} onChange={v => updateSettings({ malUsername: v })} placeholder="Enter MAL username" />
                <Toggle label="Auto Sync with MAL" checked={settings.autoSyncMal} onChange={() => updateSettings({ autoSyncMal: !settings.autoSyncMal })} tooltip="Automatically sync watchlist status and episode progress with your MyAnimeList account." />
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
                    <Toggle label="Auto Sync Progress" checked={settings.autoSyncAniList} onChange={() => updateSettings({ autoSyncAniList: !settings.autoSyncAniList })} tooltip="Automatically update episode progress on your AniList profile." />
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
            
            <SettingsSection title="Danger Zone">
                <button onClick={handleClearWatchHistory} className="w-full text-center font-semibold text-[rgb(var(--color-danger))] hover:underline">Clear Watch History</button>
            </SettingsSection>
        </div>
    );
};

export default SettingsPage;