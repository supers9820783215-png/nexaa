import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

// Generates a consistent, academic-palette color based on the user's initial
const getInitialColor = (initial: string) => {
  const colors = [
    'bg-[#5A7458] text-white border-[#4A6048]', // DTSS Forest Sage
    'bg-[#2A537A] text-white border-[#1F3E5C]', // Executive Collegiate Blue
    'bg-[#553E7A] text-white border-[#3F2E5C]', // Academic Plum
    'bg-[#784433] text-white border-[#5A3326]', // Warm Terracotta
    'bg-[#345932] text-white border-[#274426]', // Deep Pine
    'bg-[#1F242D] text-white border-[#343A46]', // Slate Charcoal
  ];
  const charCode = initial.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  avatar,
  size = 'sm',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();

  // Treat dummy Unsplash stock photos as empty so genuine initials are shown
  const isDummyPhoto = !avatar || avatar.includes('unsplash.com') || avatar.trim() === '';

  if (!isDummyPhoto && !imgError) {
    return (
      <img
        src={avatar}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-lg object-cover border border-[#E6E1D7] shrink-0 ${className}`}
      />
    );
  }

  const colorClass = getInitialColor(initial);

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg ${colorClass} font-bold flex items-center justify-center shrink-0 border select-none shadow-2xs ${className}`}
      title={name}
      aria-label={name}
    >
      <span>{initial}</span>
    </div>
  );
};
