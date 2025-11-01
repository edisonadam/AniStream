import React from 'react';

type IconProps = {
  className?: string;
};

const createIcon = (path: React.ReactNode): React.FC<IconProps> => ({ className }) => (
  <svg className={`w-6 h-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    {path}
  </svg>
);

const createSolidIcon = (path: React.ReactNode): React.FC<IconProps> => ({ className }) => (
    <svg className={`w-6 h-6 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor">
      {path}
    </svg>
);

export const GoogleIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 48 48" >
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.566-3.108-11.283-7.481l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.011,35.797,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const HamburgerIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />);
export const SearchIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />);
export const BellIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />);
export const UserIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />);
export const UserPlusIcon: React.FC<IconProps> = createIcon(<><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" /></>);
export const MessageCircleIcon: React.FC<IconProps> = createIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
export const CloseIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />);
export const PlusIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />);
export const CheckIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />);
export const DotsVerticalIcon: React.FC<IconProps> = createSolidIcon(<path d="M10 6a2 2 0 11-4 0 2 2 0 014 0zM10 12a2 2 0 11-4 0 2 2 0 014 0zM10 18a2 2 0 11-4 0 2 2 0 014 0z" />);
export const StarIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={`w-6 h-6 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
export const ChevronLeftIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />);
export const ChevronRightIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />);
export const ChevronDownIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />);
export const ViewGridIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />);
export const ViewListIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />);
export const ViewCarouselIcon: React.FC<IconProps> = ({ className }) => (<svg className={`w-6 h-6 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"></rect></svg>);
export const EyeIcon: React.FC<IconProps> = createIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>);
export const EyeOffIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />);
export const RewindIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />);
export const FastForwardIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />);
export const RefreshCwIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12" />);
export const ShareIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />);
export const DownloadIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />);
export const SparklesIcon: React.FC<IconProps> = createSolidIcon(<path fillRule="evenodd" d="M5 2a1 1 0 011 1v1.586l.707-.707a1 1 0 011.414 1.414L7.414 6H9a1 1 0 110 2H7.414l.707.707a1 1 0 01-1.414 1.414L6 9.414V11a1 1 0 11-2 0V9.414l-.707.707a1 1 0 01-1.414-1.414L2.586 8H1a1 1 0 110-2h1.586l-.707-.707a1 1 0 011.414-1.414L4 4.586V3a1 1 0 011-1zM15 2a1 1 0 011 1v1.586l.707-.707a1 1 0 011.414 1.414L17.414 6H19a1 1 0 110 2h-1.586l.707.707a1 1 0 01-1.414 1.414L16 9.414V11a1 1 0 11-2 0V9.414l-.707.707a1 1 0 01-1.414-1.414L12.586 8H11a1 1 0 110-2h1.586l-.707-.707a1 1 0 011.414-1.414L14 4.586V3a1 1 0 011-1zM5 12a1 1 0 011 1v1.586l.707-.707a1 1 0 011.414 1.414L7.414 16H9a1 1 0 110 2H7.414l.707.707a1 1 0 01-1.414 1.414L6 19.414V21a1 1 0 11-2 0v-1.586l-.707.707a1 1 0 01-1.414-1.414L2.586 18H1a1 1 0 110-2h1.586l-.707-.707a1 1 0 011.414-1.414L4 14.586V13a1 1 0 011-1z" clipRule="evenodd" />);
export const ArrowUpIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />);
export const UsersIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 12.75a5.995 5.995 0 01-3 5.197z" />);
export const MoonIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />);
export const SunIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />);
export const PlayIcon: React.FC<IconProps> = createSolidIcon(<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />);
export const CalendarIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />);
export const HomeIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />);
export const TrendingUpIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />);
export const HistoryIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />);
export const InfoIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />);
export const BookOpenIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />);
export const GiftIcon: React.FC<IconProps> = createIcon(<>
    <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
    <path d="M12 8l0 13" />
    <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a2.5 2.5 0 0 1 4.5 1.5" />
    <path d="M16.5 8a2.5 2.5 0 0 0 0 -5a2.5 2.5 0 0 0 -4.5 1.5" />
</>);
export const AcademicCapIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.07.002z" />);

export const BookmarkIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />);
export const LogoutIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />);
export const FlagIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-13l9-4 9 4v7" />);
export const ScissorsIcon: React.FC<IconProps> = createIcon(<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>);
export const ThumbsUpIcon: React.FC<IconProps> = createIcon(<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />);
export const VerifiedIcon: React.FC<IconProps> = createSolidIcon(<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />);
export const ExternalLinkIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />);
export const ShieldCheckIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417l5.611 1.573a2.986 2.986 0 002.778 0L17.389 20.42a12.02 12.02 0 00-4.389-14.416z" />);
export const HeartIcon: React.FC<IconProps> = createIcon(<path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />);
export const ClipboardIcon: React.FC<IconProps> = createIcon(<>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 2H8.6c-.4 0-.8.2-1.1.5L3.5 6.5c-.3.3-.5.7-.5 1.1V20c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7h5V2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h4" />
</>);
export const NewspaperIcon: React.FC<IconProps> = createIcon(<>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 15h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 15h4" />
</>);

export const LevelUpIcon: React.FC<IconProps> = createIcon(<>
    <path d="M4 19h16" />
    <path d="M4 15h4" />
    <path d="M9 15h4" />
    <path d="M14 15h4" />
    <path d="M12 11l3 -3l3 3" />
    <path d="M15 8v-5" />
</>);