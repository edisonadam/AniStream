import React from 'react';

// @FIX: Update IconProps to allow any valid SVG attribute, including 'style', and handle the 'title' prop for accessibility.
// Fix: Added title property to IconProps to allow passing a title for accessibility.
type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

const createIcon = (path: React.ReactNode): React.FC<IconProps> => ({ className, title, ...props }) => (
  <svg className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title && <title>{title}</title>}
    {path}
  </svg>
);

const createSolidIcon = (path: React.ReactNode): React.FC<IconProps> => ({ className, title, ...props }) => (
    <svg className={`w-6 h-6 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor" {...props}>
      {title && <title>{title}</title>}
      {path}
    </svg>
);

export const GoogleIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 48 48" {...props} >
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.565-3.113-11.28-7.481l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const HamburgerIcon = createIcon(<path d="M4 6h16M4 12h16M4 18h16" />);
export const SearchIcon = createIcon(<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />);
export const BellIcon = createIcon(<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />);
export const UserIcon = createIcon(<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />);
export const CloseIcon = createIcon(<path d="M18 6L6 18M6 6l12 12" />);
export const BookmarkIcon = createIcon(<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />);
export const LogoutIcon = createIcon(<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />);
export const UsersIcon = createIcon(<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />);
export const MessageCircleIcon = createIcon(<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />);
export const LevelUpIcon = createIcon(<path d="M13 7h8m0 0v8m0-8l-8 8m-5-8h1.17a1 1 0 00.78-.37l2.83-3.23a1 1 0 000-1.26l-2.83-3.23a1 1 0 00-.78-.37H8a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V12" />);
export const HeartIcon = createIcon(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />);
export const RefreshCwIcon = createIcon(<path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />);
export const SettingsIcon = createIcon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></>);
export const FilmIcon = createIcon(<path d="M21 7.5v9a1.5 1.5 0 01-1.5 1.5H18v2H6v-2H4.5A1.5 1.5 0 013 16.5v-9A1.5 1.5 0 014.5 6H6V4h12v2h1.5a1.5 1.5 0 011.5 1.5zM6 10.5H3v6h3v-6zm12 0h-9v6h9v-6z" />);
export const BookOpenIcon = createIcon(<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />);
export const GiftIcon = createIcon(<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />);
export const MoonIcon = createIcon(<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />);
export const SunIcon = createIcon(<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>);
export const HomeIcon = createIcon(<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />);
export const TrendingUpIcon = createIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>);
export const CalendarIcon = createIcon(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>);
export const HistoryIcon = createIcon(<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />);
export const InfoIcon = createIcon(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>);
export const AcademicCapIcon = createSolidIcon(<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 011.085.12l3.395 3.393a1 1 0 001.414 0l3.395-3.393a1 1 0 011.085-.12l2.87-1.11a1 1 0 000-1.84l-7-3zM3.25 9.42l5.74 2.22a1 1 0 00.976 0l5.74-2.22a1 1 0 000-1.84L10 5.25 3.25 7.58a1 1 0 000 1.84zM10 18a1 1 0 001-1v-5.586l-1-1-1 1V17a1 1 0 001 1z" />);
export const EyeIcon = createIcon(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = createIcon(<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />);
export const ChevronDownIcon = createIcon(<path d="M19 9l-7 7-7-7" />);
export const ClipboardIcon = createIcon(<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>);
export const ShieldCheckIcon = createIcon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />);
export const NewspaperIcon = createSolidIcon(<path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />);
export const StarIcon = createIcon(<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />);
export const MailIcon = createIcon(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>);
export const QuestionMarkCircleIcon = createIcon(<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>);
export const DownloadIcon = createIcon(<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />);
export const AnnouncementIcon = createIcon(<path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18h.01M12 6h.01M4 12H2m10 6a2 2 0 11-4 0 2 2 0 014 0zm8-12v12" />);
export const ShoppingCartIcon = createIcon(<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></>);
export const TrophyIcon = createIcon(<path d="M8 21h8m-4-8v8m-8-8a6 6 0 1112 0v-3a6 6 0 11-12 0v3zm0-3h12" />);
export const PlusIcon = createIcon(<path d="M12 5v14M5 12h14" />);
export const CheckIcon = createIcon(<path d="M20 6L9 17l-5-5" />);
export const DotsVerticalIcon = createIcon(<><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></>);
export const ChevronLeftIcon = createIcon(<path d="M15 18l-6-6 6-6" />);
export const ChevronRightIcon = createIcon(<path d="M9 18l6-6-6-6" />);
export const ViewGridIcon = createIcon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>);
export const ViewListIcon = createIcon(<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>);
export const ViewCarouselIcon = createIcon(<><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/><rect x="4" y="9" width="4" height="6" rx="1"/><rect x="10" y="9" width="4" height="6" rx="1"/><rect x="16" y="9" width="4" height="6" rx="1"/></>);
export const RewindIcon = createIcon(<><polygon points="11 19 2 12 11 5 11 19" /><polygon points="22 19 13 12 22 5 22 19" /></>);
export const FastForwardIcon = createIcon(<><polygon points="13 19 22 12 13 5 13 19" /><polygon points="2 19 11 12 2 5 2 19" /></>);
export const ShareIcon = createIcon(<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />);
export const ExternalLinkIcon = createIcon(<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />);
export const CodeIcon = createIcon(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>);
export const PlayIcon = createIcon(<polygon points="5 3 19 12 5 21 5 3" />);
export const PauseIcon = createIcon(<><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>);
export const VolumeUpIcon = createIcon(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></>);
export const VolumeOffIcon = createIcon(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>);
export const FullscreenEnterIcon = createIcon(<path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />);
export const FullscreenExitIcon = createIcon(<path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />);
export const ExclamationTriangleIcon = createIcon(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>);
export const ScissorsIcon = createIcon(<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>);
export const UserPlusIcon = createIcon(<><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>);
export const PictureInPictureIcon = createIcon(<><path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M21 3h-6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" /></>);
export const ArrowTopRightOnSquareIcon = createIcon(<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />);
export const LightbulbOffIcon = createIcon(<path d="M9 18h6m-3-13.01V2M9 2a3 3 0 013 3v1m-6 6H2m20 0h-2m-3.4-9.6a8.94 8.94 0 00-11.2 0M19.6 18.2a8.94 8.94 0 000-11.2m-11.2 0a8.94 8.94 0 000 11.2m-4-4.2H2m20 0h-2M12 6a6 6 0 016 6" />);
export const LightbulbIcon = createIcon(<path d="M9 18h6m-3-13.01V2M9 2a3 3 0 013 3v1m-6 6H2m20 0h-2m-3.4-9.6a8.94 8.94 0 00-11.2 0M19.6 18.2a8.94 8.94 0 000-11.2m-11.2 0a8.94 8.94 0 000 11.2m-4-4.2H2m20 0h-2M12 6a6 6 0 016 6" />);
export const SparklesIcon = createIcon(<path d="M12 3L9.27 7.76L4 9l4.77 4.27L7.53 19L12 16.3l4.47 2.7l-1.24-5.73L20 9l-5.27-.24L12 3z" />);
export const ThumbsUpIcon = createIcon(<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />);
export const ThumbsDownIcon = createIcon(<path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4.33v7.34A2.31 2.31 0 0119.67 14H17" />);
export const VerifiedIcon = createSolidIcon(<path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />);
export const LockClosedIcon = createSolidIcon(<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />);
export const ArrowUpIcon = createIcon(<path d="M12 19V5M5 12l7-7 7 7" />);
export const HeartIconSolid = createSolidIcon(<path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />);
export const PlusCircleIcon = createIcon(<><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></>);
export const FlagIcon = createIcon(<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />);
export const CaptionsIcon = createIcon(<><path d="M15 16H9M13 12H9M11 8H9" /><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z" /></>);
export const CogIcon = createIcon(<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />);
export const MicrophoneIcon = createIcon(<path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />);
export const MicrophoneOffIcon = createIcon(<><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></>);
export const VideoCameraIcon = createIcon(<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />);
export const VideoCameraOffIcon = createIcon(<><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path d="M3 3l18 18" /></>);
export const DevicePhoneMobileIcon = createIcon(<path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />);
export const DeviceDesktopIcon = createIcon(<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>);
export const ChartBarIcon = createIcon(<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />);