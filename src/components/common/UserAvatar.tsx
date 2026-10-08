import React from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

// Modern vibrant colored background palette
const colorPalette = [
  'bg-emerald-600 border-emerald-700',
  'bg-blue-600 border-blue-700',
  'bg-indigo-600 border-indigo-700',
  'bg-violet-600 border-violet-700',
  'bg-purple-600 border-purple-700',
  'bg-rose-600 border-rose-700',
  'bg-amber-600 border-amber-700',
  'bg-teal-600 border-teal-700',
  'bg-cyan-600 border-cyan-700',
  'bg-[#2A537A] border-[#1F3E5C]',
  'bg-[#5A7458] border-[#4A6048]',
];

export const getInitialColor = (name?: string): string => {
  const str = (name || 'U').trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  size = 'sm',
  className = '',
}) => {
  const initials = getInitials(name);
  const colorClass = getInitialColor(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${colorClass} text-white font-bold flex items-center justify-center shrink-0 border select-none shadow-sm ${className}`}
      title={name}
      aria-label={name}
    >
      <span className="tracking-wider">{initials}</span>
    </div>
  );
};
