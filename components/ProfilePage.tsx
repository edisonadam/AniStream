import React, { useState, useMemo, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useProfileData } from '../hooks/useProfileData';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useWatchlist } from '../hooks/useWatchlist';
import { useToast } from '../hooks/useToast';
import { ChevronLeftIcon, VerifiedIcon, UserIcon, ShieldCheckIcon, HistoryIcon, CogIcon, RefreshCwIcon, LockClosedIcon, EyeIcon, DeviceDesktopIcon, DevicePhoneMobileIcon, StarIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons/Icons';
import type { Anime, Settings, Page, WatchProgressInfo } from '../types';
import { COLOR_PRESETS, VIDEO_SERVERS } from '../constants';
import { fetchAnilistUserAnimeList, fetchMalUserAnimeList } from '../api';
import ShortcutSettings from './ShortcutSettings';
import AnimeCard from './AnimeCard';

interface ProfilePageProps {
    onGoBack: () => void;
    allAnime: Anime[];
    onSelectAnime: (anime: Anime) => void;
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
    onNavigate: (page: Page) => void;
}

type MainTab = 'general' | 'security' | 'sessions' | 'preferences' | 'sync' | 'privacy';
type GeneralSubTab = 'profile' | 'privacy' | 'statistics' | 'activity' | 'ratings';

const ProfilePage: React.FC<ProfilePageProps> = ({ onGoBack, allAnime, onSelectAnime, getEpisodeStatus, onNavigate }) => {
    const { user } = useAuth();
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('general');
    const [activeGeneralSubTab, setActiveGeneralSubTab] = useState<GeneralSubTab>('profile');

    const renderContent = () => {
        switch (activeMainTab) {
            case 'general':
                return <GeneralSection activeSubTab={activeGeneralSubTab} setActiveSubTab={setActiveGeneralSubTab} allAnime={allAnime} onSelectAnime={onSelectAnime} getEpisodeStatus={getEpisodeStatus} onNavigate={onNavigate} />;
            case 'security':
                return <SecuritySection />;
            case 'sessions':
                return <SessionsSection />;
            case 'preferences':
                return <PreferencesSection />;
            case 'sync':
                return <SyncSection />;
            case 'privacy':
                return <PrivacySection isSubSection={false} />;
            default:
                return <GeneralSection activeSubTab={activeGeneralSubTab} setActiveSubTab={setActiveGeneralSubTab} allAnime={allAnime} onSelectAnime={onSelectAnime} getEpisodeStatus={getEpisodeStatus} onNavigate={onNavigate} />;
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto py-12 text-center">
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <div className="text-center md:text-left mb-8">
                <h1 className="text-4xl font-bold">Settings</h1>
                <p className="text-lg text-[rgb(var(--text-muted))]">Manage your account and preferences</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                <aside className="md:w-1/4 lg:w-1/5 flex-shrink-0">
                    <nav className="space-y-2">
                        <SideNavItem icon={<UserIcon />} label="General" isActive={activeMainTab === 'general'} onClick={() => setActiveMainTab('general')} />
                        <SideNavItem icon={<ShieldCheckIcon />} label="Security" isActive={activeMainTab === 'security'} onClick={() => setActiveMainTab('security')} />
                        <SideNavItem icon={<HistoryIcon />} label="Sessions" isActive={activeMainTab === 'sessions'} onClick={() => setActiveMainTab('sessions')} />
                        <SideNavItem icon={<CogIcon />} label="Preferences" isActive={activeMainTab === 'preferences'} onClick={() => setActiveMainTab('preferences')} />
                        <SideNavItem icon={<RefreshCwIcon />} label="Sync" isActive={activeMainTab === 'sync'} onClick={() => setActiveMainTab('sync')} />
                        <SideNavItem icon={<EyeIcon />} label="Privacy" isActive={activeMainTab === 'privacy'} onClick={() => setActiveMainTab('privacy')} />
                    </nav>
                </aside>
                <main className="flex-1 min-w-0">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

const SideNavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${isActive ? 'bg-[rgb(var(--surface-3))] text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))]'}`}>
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const Section: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, noPadding?: boolean }> = ({ title, subtitle, children, noPadding = false }) => (
    <div className={`bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-2xl ${noPadding ? '' : 'p-6'}`}>
        {(title || subtitle) && (
            <div className={`${noPadding ? 'p-6' : ''}`}>
                <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))]">{title}</h3>
                {subtitle && <p className="text-sm text-[rgb(var(--text-muted))] mt-1 mb-4">{subtitle}</p>}
            </div>
        )}
        <div className={`space-y-4 ${noPadding ? '' : 'pt-4 border-t border-white/10'}`}>{children}</div>
    </div>
);


const GeneralSection: React.FC<{ 
    activeSubTab: GeneralSubTab, 
    setActiveSubTab: (tab: GeneralSubTab) => void,
    allAnime: Anime[],
    onSelectAnime: (anime: Anime) => void,
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null },
    onNavigate: (page: Page) => void
}> = ({ activeSubTab, setActiveSubTab, allAnime, onSelectAnime, getEpisodeStatus, onNavigate }) => (
    <div className="space-y-8">
        <div className="flex flex-wrap border-b border-white/10">
            <SubTabButton label="Profile" isActive={activeSubTab === 'profile'} onClick={() => setActiveSubTab('profile')} />
            <SubTabButton label="Privacy" isActive={activeSubTab === 'privacy'} onClick={() => setActiveSubTab('privacy')} />
            <SubTabButton label="Statistics" isActive={activeSubTab === 'statistics'} onClick={() => setActiveSubTab('statistics')} />
            <SubTabButton label="Activity" isActive={activeSubTab === 'activity'} onClick={() => setActiveSubTab('activity')} />
            <SubTabButton label="Ratings" isActive={activeSubTab === 'ratings'} onClick={() => setActiveSubTab('ratings')} />
        </div>
        {activeSubTab === 'profile' && <ProfileSubSection />}
        {activeSubTab === 'privacy' && <PrivacySection isSubSection />}
        {activeSubTab === 'statistics' && <StatisticsSubSection />}
        {activeSubTab === 'activity' && <ActivitySubSection allAnime={allAnime} onSelectAnime={onSelectAnime} getEpisodeStatus={getEpisodeStatus} onNavigate={onNavigate} />}
        {activeSubTab === 'ratings' && <RatingsSubSection allAnime={allAnime} onSelectAnime={onSelectAnime} getEpisodeStatus={getEpisodeStatus} onLoginRequest={() => {}} />}
    </div>
);

const SubTabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>{label}</button>
);

const ProfileSubSection: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.username || '');
    const [language, setLanguage] = useState('English');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const { addToast } = useToast();

    const handleSave = () => {
        if (!user) return;
        updateUser({ username: displayName, avatar: user.avatar });
        addToast("Profile saved successfully!", "success");
    };

    return (
        <div className="space-y-6">
            <Section title="Profile Overview" noPadding>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <img src={user?.avatar} alt="avatar" className="w-20 h-20 rounded-full" />
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <p className="font-bold text-lg">{user?.username}</p>
                                {user?.isVip && <VerifiedIcon className="w-5 h-5 text-yellow-400" title="VIP Member" />}
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Private</span>
                            </div>
                            <p className="text-sm text-[rgb(var(--text-muted))]">{user?.email}</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">Member since {new Date(user?.joinedDate || 0).toLocaleDateString()}</p>
                        </div>
                        <button className="px-3 py-1.5 text-sm bg-white/10 rounded-lg hover:bg-white/20">Verify Email</button>
                    </div>
                </div>
            </Section>
            <Section title="Profile Information">
                <TextInput label="Display Name" value={displayName} onChange={setDisplayName} />
                <Dropdown label="Language" selected={language} onChange={setLanguage} options={[{ value: 'English', label: 'English' }]} />
                <div>
                    <label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 block">Bio (Optional)</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 500))} maxLength={500} placeholder="Tell us about yourself..." className="w-full bg-[rgb(var(--surface-input))] rounded-lg p-2" rows={3}></textarea>
                    <p className="text-xs text-right text-[rgb(var(--text-muted))]">{bio.length}/500</p>
                </div>
                <TextInput label="Location (Optional)" value={location} onChange={setLocation} placeholder="Select a country"/>
                <TextInput label="Website (Optional)" value={website} onChange={setWebsite} placeholder="https://example.com" />
                <Dropdown label="Timezone" selected={timezone} onChange={setTimezone} options={[{ value: 'UTC', label: 'UTC' }]} />
                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} className="px-5 py-2.5 bg-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Save Changes</button>
                </div>
            </Section>
        </div>
    );
};

const PrivacySection: React.FC<{ isSubSection?: boolean }> = ({ isSubSection = false }) => {
    const { settings, updateSettings } = useSettings();
    const { addToast } = useToast();
    const handleSave = () => addToast("Privacy settings saved!", "success");

    const content = (
        <div className="p-6 space-y-4">
            <Toggle label="Private Profile" checked={settings.privateProfile} onChange={() => updateSettings({ privateProfile: !settings.privateProfile })} tooltip="Only approved followers can see your profile" />
            <Toggle label="Allow Messages" checked={settings.allowMessages} onChange={() => updateSettings({ allowMessages: !settings.allowMessages })} tooltip="Let other users send you direct messages" />
            <Toggle label="Show Online Status" checked={settings.showOnlineStatus} onChange={() => updateSettings({ showOnlineStatus: !settings.showOnlineStatus })} tooltip="Display when you're online to other users" />
            <div className="flex justify-end pt-4 border-t border-white/10">
                <button onClick={handleSave} className="px-5 py-2.5 bg-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Save Changes</button>
            </div>
        </div>
    );

    return <Section title="Privacy Settings" subtitle={!isSubSection ? "Control who can see your profile and interact with you" : ""} noPadding>{content}</Section>
};

const StatisticsSubSection: React.FC = () => {
    const { ratings } = useProfileData();
    const { watchProgressList } = useWatchProgress();
    const { watchlist } = useWatchlist();

    const stats = useMemo(() => {
        const totalMinutes = watchProgressList.reduce((acc, p) => acc + (p.progress / 100 * 24 * (p.currentEpisode || 1)), 0);
        const completionRate = watchlist.length > 0 ? (watchlist.filter(a => a.status === 'Completed').length / watchlist.length) * 100 : 0;
        const genreCounts: Record<string, number> = {};
        watchlist.forEach(anime => { (anime.genres || []).forEach(genre => { genreCounts[genre] = (genreCounts[genre] || 0) + 1; }); });
        const favoriteGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(g => g[0]);

        return {
            animeWatched: watchlist.length,
            episodesWatched: watchProgressList.reduce((acc, p) => acc + p.currentEpisode, 0),
            comments: 0,
            daysWatched: (totalMinutes / 60 / 24).toFixed(1),
            watchingStreak: 6,
            averageRating: ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(2) : '0.00',
            completionRate: completionRate.toFixed(0) + '%',
            favoriteGenres: favoriteGenres,
        };
    }, [watchProgressList, watchlist, ratings]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[rgb(var(--surface-2))/0.6] rounded-2xl border border-white/10">
                <StatCard label="Anime Watched" value={stats.animeWatched} />
                <StatCard label="Episodes" value={stats.episodesWatched} />
                <StatCard label="Comments" value={stats.comments} />
                <StatCard label="Days Watched" value={stats.daysWatched} />
            </div>
            <Section title="Detailed Statistics" noPadding>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                    <StatCard label="Watching Streak" value={`${stats.watchingStreak} days`} />
                    <StatCard label="Average Rating" value={stats.averageRating + '/10'} />
                    <StatCard label="Completion Rate" value={stats.completionRate} />
                    <StatCard label="Favorite Genres" value={stats.favoriteGenres.join(', ')} isSmallText />
                </div>
            </Section>
        </div>
    );
};

const ActivitySubSection: React.FC<{
    allAnime: Anime[], 
    onSelectAnime: (anime: Anime) => void, 
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null },
    onNavigate: (page: Page) => void
}> = ({ allAnime, onSelectAnime, getEpisodeStatus, onNavigate }) => {
    const { watchProgressList } = useWatchProgress();

    const watchableItems = useMemo(() => {
        if (watchProgressList.length === 0) return [];

        const animeMap = new Map<number, Anime>();
        allAnime.forEach(anime => {
            if(anime) animeMap.set(anime.id, anime);
        });

        // Show items that are in progress (0 < progress < 100) or just recently watched
        return watchProgressList
            .filter(p => p.progress > 0 && p.progress < 100)
            .map(progressInfo => {
                const anime = animeMap.get(progressInfo.animeId);
                return anime ? { anime, progressInfo } : null;
            })
            .filter((item): item is { anime: Anime; progressInfo: WatchProgressInfo } => item !== null && !!item.anime.thumbnail)
            .map(item => item.anime)
            .slice(0, 10); // Limit to 10 items for the carousel
    }, [watchProgressList, allAnime]);

    return (
        <div className="space-y-6">
            <Section title="Continue Watching" noPadding>
                <div className="p-6">
                    {watchableItems.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-[rgb(var(--text-muted))]">Pick up where you left off</p>
                                <button onClick={() => onNavigate('history')} className="text-sm font-semibold text-[rgb(var(--color-primary-accent))] hover:underline">
                                    View All History
                                </button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
                                {watchableItems.map((anime) => (
                                    <div key={anime.id} className="flex-shrink-0 w-40">
                                        <AnimeCard 
                                            anime={anime} 
                                            onSelect={onSelectAnime} 
                                            episodeStatus={getEpisodeStatus(anime.id)} 
                                            onLoginRequest={() => {}}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[rgb(var(--text-muted))]">No active watch history found.</p>
                            <button onClick={() => onNavigate('history')} className="mt-2 text-sm font-semibold text-[rgb(var(--color-primary-accent))] hover:underline">
                                View Full History
                            </button>
                        </div>
                    )}
                </div>
            </Section>
            
            <Section title="Recent Activity">
                <p className="text-center text-[rgb(var(--text-muted))] py-4">No recent community activity</p>
            </Section>
        </div>
    );
};

const RatingsSubSection: React.FC<{
    allAnime: Anime[], 
    onSelectAnime: (anime: Anime) => void, 
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null },
    onLoginRequest: (reason: string) => void
}> = ({ allAnime, onSelectAnime, getEpisodeStatus, onLoginRequest }) => {
    const { likedAnime, dislikedAnime } = useProfileData();

    const animeMap = useMemo(() => new Map(allAnime.map(a => [a.id, a])), [allAnime]);

    const likedAnimeDetails = useMemo(() => 
        likedAnime.map(id => animeMap.get(id)).filter((a): a is Anime => a !== undefined),
        [likedAnime, animeMap]
    );

    const dislikedAnimeDetails = useMemo(() => 
        dislikedAnime.map(id => animeMap.get(id)).filter((a): a is Anime => a !== undefined),
        [dislikedAnime, animeMap]
    );

    return (
        <div className="space-y-8 animate-subtle-fade-in-up">
            <Section title="Liked Anime" subtitle={`You have liked ${likedAnimeDetails.length} anime.`} noPadding>
                <div className="p-6">
                    {likedAnimeDetails.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {likedAnimeDetails.map(anime => (
                                <AnimeCard 
                                    key={anime.id}
                                    anime={anime}
                                    onSelect={onSelectAnime}
                                    episodeStatus={getEpisodeStatus(anime.id)}
                                    onLoginRequest={onLoginRequest}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[rgb(var(--text-muted))]">
                            <ThumbsUpIcon className="w-12 h-12 mx-auto mb-2 opacity-30"/>
                            <p>You haven't liked any anime yet.</p>
                        </div>
                    )}
                </div>
            </Section>
            
            <Section title="Disliked Anime" subtitle={`You have disliked ${dislikedAnimeDetails.length} anime.`} noPadding>
                <div className="p-6">
                    {dislikedAnimeDetails.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {dislikedAnimeDetails.map(anime => (
                                <AnimeCard 
                                    key={anime.id}
                                    anime={anime}
                                    onSelect={onSelectAnime}
                                    episodeStatus={getEpisodeStatus(anime.id)}
                                    onLoginRequest={onLoginRequest}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[rgb(var(--text-muted))]">
                            <ThumbsDownIcon className="w-12 h-12 mx-auto mb-2 opacity-30"/>
                            <p>No disliked anime.</p>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
};

const SecuritySection: React.FC = () => (
    <div className="space-y-8">
        <Section title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
            <p>Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
            <div className="flex justify-start"><button className="px-5 py-2.5 bg-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Enable Two-Factor Authentication</button></div>
        </Section>
        <Section title="Change Password" subtitle="Update your account password">
            <TextInput label="Current Password" type="password" value="" onChange={() => {}} />
            <TextInput label="New Password" type="password" value="" onChange={() => {}} />
            <TextInput label="Confirm New Password" type="password" value="" onChange={() => {}} />
            <div className="flex justify-end"><button className="px-5 py-2.5 bg-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Change Password</button></div>
        </Section>
        <Section title="Security Tips" subtitle="Best practices to keep your account secure">
            <ul className="list-disc list-inside space-y-2 text-[rgb(var(--text-secondary))]">
                <li><strong>Strong Passwords:</strong> Use a unique, strong password with at least 12 characters including numbers and symbols.</li>
                <li><strong>Regular Updates:</strong> Keep your authenticator app and browser updated.</li>
                <li><strong>Backup Codes:</strong> Store your backup codes in a secure location.</li>
                <li><strong>Session Management:</strong> Regularly review and terminate unused sessions from the Sessions page.</li>
            </ul>
        </Section>
    </div>
);

const SessionsSection: React.FC = () => {
    const mockSessions = [
        { id: 1, device: 'Chrome on Windows', type: 'desktop', location: 'New York, USA', ip: '192.168.1.1', lastActive: '11 minutes ago', isCurrent: true },
        { id: 2, device: 'Safari on iPhone', type: 'mobile', location: 'New York, USA', ip: '192.168.1.1', lastActive: '2 hours ago', isCurrent: false },
        { id: 3, device: 'Firefox on Linux', type: 'desktop', location: 'London, UK', ip: '10.0.0.1', lastActive: 'Yesterday', isCurrent: false },
    ];

    const getIcon = (type: string) => {
        if (type === 'mobile') return <DevicePhoneMobileIcon className="w-8 h-8 text-[rgb(var(--text-muted))]" />;
        return <DeviceDesktopIcon className="w-8 h-8 text-[rgb(var(--text-muted))]" />;
    };

    return (
        <Section title="Active Sessions" subtitle="Manage your active sessions across all devices">
            {mockSessions.map(session => (
                <div key={session.id} className="bg-[rgb(var(--surface-3))] p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {getIcon(session.type)}
                        <div className="text-left">
                            <p className="font-bold text-[rgb(var(--text-primary))]">{session.device} {session.isCurrent && <span className="text-green-400 text-sm">(Current)</span>}</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">{session.location} &bull; {session.ip} &bull; Last active: {session.lastActive}</p>
                        </div>
                    </div>
                    {!session.isCurrent && (
                        <button className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 self-end sm:self-center">Sign Out</button>
                    )}
                </div>
            ))}
            <div className="pt-4 border-t border-white/10">
                <button className="px-5 py-2.5 bg-red-500/10 text-red-400 rounded-lg font-semibold hover:bg-red-500/20">Sign out all other sessions</button>
            </div>
        </Section>
    );
};

const PreferencesSection: React.FC = () => {
    const { settings, updateSettings, restoreDefaults } = useSettings();
    const { clearProgress } = useWatchProgress();
    const { addToast } = useToast();

    const handleAdChange = (key: keyof Settings['ads'], value: boolean) => updateSettings({ ads: { ...settings.ads, [key]: value } });
    const handleRestore = () => {
        if (window.confirm("Are you sure you want to restore all settings to their defaults? This cannot be undone.")) {
            restoreDefaults(); addToast("Settings restored to default.", "success");
        }
    };
    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire view history? This cannot be undone.")) {
            clearProgress(); addToast("View history cleared.", "success");
        }
    };

    return (
        <div className="space-y-8">
            <Section title="Language & Comments">
                <Dropdown label="Default Language" selected={settings.defaultLanguage} onChange={v => updateSettings({ defaultLanguage: v })} options={[{ value: 'sub', label: 'Japanese (Original)' }, { value: 'dub', label: 'English (Dub)' }]} />
                <Toggle label="Show Comments by Default" checked={settings.showComments} onChange={() => updateSettings({ showComments: !settings.showComments })} />
            </Section>
            <Section title="Playback Settings">
                <Toggle label="Auto Play Videos" checked={settings.autoPlayVideos} onChange={() => updateSettings({ autoPlayVideos: !settings.autoPlayVideos })} tooltip="Start playing videos automatically." />
                <div>
                    <label className="font-semibold text-[rgb(var(--text-secondary))] mb-1 block">AniList Sync Threshold</label>
                    <p className="text-sm text-[rgb(var(--text-muted))] mb-2">Mark episode as watched after reaching this percentage.</p>
                    <div className="flex items-center gap-4"><input type="range" min="1" max="100" value={settings.anilistSyncThreshold} onChange={e => updateSettings({ anilistSyncThreshold: parseInt(e.target.value, 10)})} className="w-full" /><span className="font-bold w-12 text-center">{settings.anilistSyncThreshold}%</span></div>
                </div>
                <Toggle label="Auto Play Next Episode" checked={settings.autoPlay} onChange={() => updateSettings({ autoPlay: !settings.autoPlay })} tooltip="Continue to next episode automatically" />
                <Toggle label="Auto Skip Intro" checked={settings.autoSkip} onChange={() => updateSettings({ autoSkip: !settings.autoSkip })} tooltip="Skip opening sequences" />
                <Toggle label="Skip Outro" checked={false} onChange={() => {}} tooltip="Skip ending sequences" />
            </Section>
            <Section title="Notification Settings">
                <p>Browser Permission: <span className="font-semibold capitalize text-[rgb(var(--text-secondary))]">{Notification.permission}</span></p>
                <Toggle label="Enable Notifications" checked={settings.enableBrowserNotifications} onChange={() => { if (Notification.permission === 'default') { Notification.requestPermission().then(p => updateSettings({ enableBrowserNotifications: p === 'granted'})); } else { updateSettings({ enableBrowserNotifications: !settings.enableBrowserNotifications }); }}} tooltip="Get notified about new episodes and updates" />
            </Section>
            <Section title="Advertisement Settings">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div><h4 className="font-semibold mb-2">Ad Locations</h4><Checkbox label="Home Page" checked={settings.ads.home} onChange={v => handleAdChange('home', v)} /><Checkbox label="Video Player" checked={settings.ads.player} onChange={v => handleAdChange('player', v)} /><Checkbox label="Search Results" checked={settings.ads.search} onChange={v => handleAdChange('search', v)} /><Checkbox label="Info Pages" checked={settings.ads.info} onChange={v => handleAdChange('info', v)} /><Checkbox label="Watch Pages" checked={settings.ads.watch} onChange={v => handleAdChange('watch', v)} /></div>
                    <div><h4 className="font-semibold mb-2">Ad Types</h4><Checkbox label="Interstitials (Soon)" checked={settings.ads.interstitials} onChange={v => handleAdChange('interstitials', v)} disabled /><Checkbox label="Icon Notification (Soon)" checked={settings.ads.icon} onChange={v => handleAdChange('icon', v)} disabled /><Checkbox label="Custom Widget (Soon)" checked={settings.ads.widget} onChange={v => handleAdChange('widget', v)} disabled /><Checkbox label="In-Page Push (Soon)" checked={settings.ads.inPage} onChange={v => handleAdChange('inPage', v)} disabled /><Checkbox label="Popunder" checked={settings.ads.popunder} onChange={v => handleAdChange('popunder', v)} /></div>
                </div>
            </Section>
            <div className="pt-6 flex flex-wrap gap-4">
                <button onClick={handleRestore} className="px-4 py-2 bg-yellow-500/10 text-yellow-300 rounded-lg font-semibold hover:bg-yellow-500/20">Restore Defaults</button>
                <button onClick={handleClearHistory} className="px-4 py-2 bg-red-500/10 text-red-300 rounded-lg font-semibold hover:bg-red-500/20">Clear View History</button>
            </div>
        </div>
    );
};

const SyncSection: React.FC = () => {
    const { addToast } = useToast();
    const handleExport = (format: 'json' | 'xml' | 'text') => addToast(`Exporting as ${format.toUpperCase()}...`, 'success');
    return (
        <div className="space-y-8">
            <Section title="AniList Integration" subtitle="Connect your AniList account for automatic syncing">
                <p>Connection Status: <span className="font-semibold text-red-400">Disconnected</span></p>
                <div className="flex justify-start"><button className="px-5 py-2.5 bg-[rgb(var(--color-primary))] rounded-lg font-semibold">Connect to AniList</button></div>
            </Section>
            <Section title="Export Watchlist" subtitle="Download your watchlist for backup or import" noPadding>
                <div className="p-6 space-y-4">
                    <ExportOption label="JSON (AniList Import)" description="Compatible with AniList import format" onDownload={() => handleExport('json')} />
                    <ExportOption label="XML (MAL Import)" description="Compatible with MyAnimeList import format" onDownload={() => handleExport('xml')} />
                    <ExportOption label="Text (Human Readable)" description="Readable text format" onDownload={() => handleExport('text')} />
                </div>
            </Section>
            <Section title="Import Watchlist" subtitle="Upload watchlist files from other services" noPadding>
                <div className="p-6 space-y-4">
                    <ImportOption label="JSON (From AniList)" description="Import AniList export files" />
                    <ImportOption label="XML (From MAL)" description="Import MyAnimeList export files" />
                    <ImportOption label="Text (From Kuudere)" description="Import Kuudere text export files" />
                </div>
            </Section>
        </div>
    );
};

// --- Helper Components ---
const ExportOption: React.FC<{ label: string, description: string, onDownload: () => void }> = ({ label, description, onDownload }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center"><div className="flex-1">
        <p className="font-semibold">{label}</p><p className="text-sm text-[rgb(var(--text-muted))]">{description}</p></div>
        <button onClick={onDownload} className="mt-2 sm:mt-0 px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20">Download</button>
    </div>
);
const ImportOption: React.FC<{ label: string, description: string }> = ({ label, description }) => (
    <div><p className="font-semibold">{label}</p><p className="text-sm text-[rgb(var(--text-muted))] mb-2">{description}</p>
        <input type="file" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-[rgb(var(--color-primary))] file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]" />
    </div>
);
const StatCard: React.FC<{ label: string, value: string | number, isSmallText?: boolean }> = ({ label, value, isSmallText = false }) => (
    <div className="bg-[rgb(var(--surface-3))/0.5] p-3 rounded-lg text-center">
        <p className={`font-bold ${isSmallText ? 'text-sm' : 'text-2xl'}`}>{value}</p><p className="text-xs text-[rgb(var(--text-muted))]">{label}</p>
    </div>
);
const Toggle: React.FC<{ label: string; tooltip?: string; checked: boolean; onChange: () => void; }> = ({ label, tooltip, checked, onChange }) => (
    <div><div className="flex justify-between items-center"><label className="font-semibold text-[rgb(var(--text-secondary))]">{label}</label>
        <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>
    </div>{tooltip && <p className="text-sm text-[rgb(var(--text-muted))] mt-1">{tooltip}</p>}</div>
);
const Dropdown: React.FC<{label: string, options: {value: string, label: string}[], selected: string, onChange: (value: any) => void}> = ({ label, options, selected, onChange }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center"><label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">{label}</label>
        <select value={selected} onChange={(e) => onChange(e.target.value)} className="w-full sm:w-auto bg-[rgb(var(--surface-input))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))]">{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
    </div>
);
const TextInput: React.FC<{ label: string, type?: string, value: string, onChange: (value: string) => void, placeholder?: string }> = ({ label, type = 'text', value, onChange, placeholder }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center"><label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full sm:w-60 bg-[rgb(var(--surface-input))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))]" />
    </div>
);
const Checkbox: React.FC<{ label: string, checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean }> = ({ label, checked, onChange, disabled }) => (
    <label className={`flex items-center gap-2 text-sm ${disabled ? 'text-[rgb(var(--text-muted))]' : 'text-[rgb(var(--text-secondary))] cursor-pointer'}`}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />{label}
    </label>
);

export default ProfilePage;