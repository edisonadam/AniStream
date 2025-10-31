import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useProfileData } from '../hooks/useProfileData';
import { useWatchLater } from '../hooks/useWatchLater';
import { COLOR_PRESETS, VIDEO_SERVERS, VIDSRC_DOMAINS } from '../constants';

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

const RadioGroup: React.FC<{ label: string, options: {value: string, label: string}[], selected: string, onChange: (value: any) => void }> = ({ label, options, selected, onChange }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/10">
        <label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">{label}</label>
        <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
            {options.map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)} className={`px-4 py-1.5 text-sm capitalize rounded-full transition-all ${selected === opt.value ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{opt.label}</button>
            ))}
        </div>
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

const SettingsPage: React.FC = () => {
    const { settings, updateSettings, restoreDefaults } = useSettings();
    const { clearHistory } = useProfileData();
    const { overwriteWatchLaterList } = useWatchLater();

    const handleClearWatchHistory = () => {
        if (window.confirm("Are you sure? This will clear all local watch history and continue watching progress.")) {
            // Note: This is a placeholder for clearing continue watching.
            // A more robust implementation would be in the ContinueWatchingContext.
            localStorage.removeItem(`continue-watching-${localStorage.getItem('ani-stream-user')}`);
            clearHistory();
            alert("Watch history cleared.");
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <SettingsSection title="App Behavior">
                <Toggle label="Auto Sync with AniList" checked={settings.autoSyncAniList} onChange={() => updateSettings({ autoSyncAniList: !settings.autoSyncAniList })} note="This feature is not supported on embedded players." />
                <div className="flex flex-col pt-4 border-t border-white/10">
                    <label className="font-semibold text-[rgb(var(--text-secondary))]">Sync Threshold (%)</label>
                    <input type="range" min="1" max="100" value={settings.syncThreshold} onChange={e => updateSettings({ syncThreshold: parseInt(e.target.value, 10)})} className="w-full h-2 bg-[rgb(var(--surface-4))] rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm text-right text-[rgb(var(--text-muted))]">{settings.syncThreshold}%</span>
                </div>
                <Toggle label="Hide Spoilers" checked={settings.hideSpoilers} onChange={() => updateSettings({ hideSpoilers: !settings.hideSpoilers })} note="Hide episode images, titles, and descriptions." />
                <RadioGroup label="Watch or Info Page" selected={settings.defaultPageAction} onChange={(v) => updateSettings({ defaultPageAction: v})} options={[{value: 'watch', label: 'Watch'}, {value: 'info', label: 'Info'}]} />
            </SettingsSection>

            <SettingsSection title="Appearance">
                <Dropdown label="Color Preset" selected={settings.colorPreset} onChange={v => updateSettings({ colorPreset: v })} options={COLOR_PRESETS.map(p => ({ value: p.id, label: p.name }))} />
                 <div className="flex flex-col pt-4 border-t border-white/10">
                    <label className="font-semibold text-[rgb(var(--text-secondary))]">Border Radius</label>
                    <input type="range" min="0" max="100" value={settings.borderRadius} onChange={e => updateSettings({ borderRadius: parseInt(e.target.value, 10)})} className="w-full h-2 bg-[rgb(var(--surface-4))] rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm text-right text-[rgb(var(--text-muted))]">{settings.borderRadius}%</span>
                </div>
                <Dropdown label="Episode List Layout" selected={settings.episodeViewStyle} onChange={v => updateSettings({ episodeViewStyle: v })} options={[{value: 'auto', label: 'Auto'}, {value: 'default', label: 'Carousel'}, {value: 'compact', label: 'Compact'}, {value: 'grid', label: 'Grid'}]} />
                <Toggle label="Watch History on Home Page" checked={settings.showWatchHistoryOnHome} onChange={() => updateSettings({ showWatchHistoryOnHome: !settings.showWatchHistoryOnHome })} />
                <RadioGroup label="Card Layout" selected={settings.cardLayout} onChange={v => updateSettings({ cardLayout: v })} options={[{value: 'classic', label: 'Classic'}, {value: 'anichart', label: 'AniChart'}, {value: 'card_list', label: 'List'}]} />
                <RadioGroup label="Card Size" selected={settings.cardSize} onChange={v => updateSettings({ cardSize: v })} options={[{value: 'medium', label: 'Medium'}, {value: 'large', label: 'Large'}]} />
                <Dropdown label="Title Language" selected={settings.displayTitleLanguage} onChange={v => updateSettings({ displayTitleLanguage: v })} options={[{value: 'english', label: 'English'}, {value: 'japanese', label: 'Japanese'}]} />
                <Dropdown label="Character Name Language" selected={settings.characterNameLanguage} onChange={v => updateSettings({ characterNameLanguage: v })} options={[{value: 'romaji', label: 'Romaji'}, {value: 'native', label: 'Native'}]} />
            </SettingsSection>

            <SettingsSection title="Comments">
                 <Toggle label="Show Comments" checked={settings.showComments} onChange={() => updateSettings({ showComments: !settings.showComments })} />
            </SettingsSection>

            <SettingsSection title="Media Settings">
                <Dropdown label="Default Provider" selected={settings.videoServer} onChange={v => updateSettings({ videoServer: v })} options={VIDEO_SERVERS.map(s => ({ value: s.id, label: s.name }))} />
                <RadioGroup label="Default Language" selected={settings.defaultLanguage} onChange={v => updateSettings({ defaultLanguage: v })} options={[{value: 'sub', label: 'Subtitles'}, {value: 'dub', label: 'Dubbing'}, {value: 'ssub', label: 'S-Sub'}]} />
                <Toggle label="Force Maximum Quality (AHD)" checked={settings.forceMaxQuality} onChange={() => updateSettings({ forceMaxQuality: !settings.forceMaxQuality })} />
                <Toggle label="Auto Play" checked={true} onChange={() => {}} />
                <Toggle label="Auto Skip Intro/Outro" checked={settings.autoSkipIntro} onChange={() => updateSettings({ autoSkipIntro: !settings.autoSkipIntro })} />
                <Toggle label="Auto Next Episode" checked={settings.autoplayNext} onChange={() => updateSettings({ autoplayNext: !settings.autoplayNext })} />
            </SettingsSection>

             <SettingsSection title="Other Utilities">
                <button className="w-full text-left font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">Keyboard Shortcuts</button>
                <button onClick={handleClearWatchHistory} className="w-full text-left font-semibold text-[rgb(var(--color-danger))] pt-4 border-t border-white/10 hover:underline">Clear Watch History</button>
                <button onClick={restoreDefaults} className="w-full text-left font-semibold text-[rgb(var(--color-warning))] pt-4 border-t border-white/10 hover:underline">Restore Default Settings</button>
            </SettingsSection>
        </div>
    );
};

export default SettingsPage;