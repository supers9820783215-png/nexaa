import React from 'react';

interface AlumniLogoProps {
  className?: string;
  showText?: boolean;
}

export const AlumniLogo: React.FC<AlumniLogoProps> = ({ className = 'w-10 h-10', showText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${showText ? 'flex-row' : ''}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
          role="img"
          aria-label="AlumNexa Crest"
        >
          <defs>
            {/* Primary Left Pillar Gradient - Deep Forest to Radiant Sage */}
            <linearGradient id="anGradPillarLeft" x1="20" y1="82" x2="52" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#25422B" />
              <stop offset="45%" stopColor="#3E6545" />
              <stop offset="100%" stopColor="#5E8F66" />
            </linearGradient>

            {/* Primary Right Pillar Gradient - Deep Slate Charcoal to Executive Navy */}
            <linearGradient id="anGradPillarRight" x1="80" y1="82" x2="48" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#17202A" />
              <stop offset="50%" stopColor="#243342" />
              <stop offset="100%" stopColor="#3E546B" />
            </linearGradient>

            {/* Nexus Connection Ribbon - Prestigious Emerald to Warm Gold Accent */}
            <linearGradient id="anGradNexusRibbon" x1="28" y1="62" x2="72" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5E8F66" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Apex Beacon Star Gradient */}
            <linearGradient id="anGradBeacon" x1="44" y1="8" x2="56" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Ambient Background Crest Glow */}
            <radialGradient id="anCrestGlow" cx="50" cy="50" r="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5E8F66" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#5E8F66" stopOpacity="0" />
            </radialGradient>

            {/* Soft Shadow for Dimensional Elevation */}
            <filter id="anElevatedShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#1F242D" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Subtle Ambient Background Halo */}
          <circle cx="50" cy="50" r="46" fill="url(#anCrestGlow)" />

          {/* Outer Protective Shield Geometry Ring */}
          <rect
            x="7"
            y="7"
            width="86"
            height="86"
            rx="24"
            fill="#FFFFFF"
            stroke="#EAE5DC"
            strokeWidth="1.5"
            className="drop-shadow-xs"
          />

          <g filter="url(#anElevatedShadow)">
            {/* Left Arch Pillar of the 'A' (Ascending Student Journey) */}
            <path
              d="M 50 20
                 C 47 20, 44 23, 42 27
                 L 22 72
                 C 20.5 75.5, 22.5 79, 26.5 79
                 C 29.5 79, 32 77, 33.5 74
                 L 43.5 51
                 C 45 47.5, 48 45, 50 45
                 C 51 45, 52 45.5, 52.8 46.5
                 L 46.5 31
                 C 48 24.5, 50 20, 50 20 Z"
              fill="url(#anGradPillarLeft)"
            />

            {/* Right Arch Pillar of the 'A' (Accomplished Alumni Leadership) */}
            <path
              d="M 50 20
                 C 53 20, 56 23, 58 27
                 L 78 72
                 C 79.5 75.5, 77.5 79, 73.5 79
                 C 70.5 79, 68 77, 66.5 74
                 L 56.5 51
                 C 55 47.5, 52 45, 50 45
                 C 49 45, 48 45.5, 47.2 46.5
                 L 53.5 31
                 C 52 24.5, 50 20, 50 20 Z"
              fill="url(#anGradPillarRight)"
            />

            {/* Dynamic Interlocking Nexus Bridge (Student-Alumni Bridge) */}
            <path
              d="M 28 62
                 C 34 52, 45 50, 50 50
                 C 55 50, 66 52, 72 62
                 C 67 56, 56 54, 50 54
                 C 44 54, 33 56, 28 62 Z"
              fill="url(#anGradNexusRibbon)"
            />
            <path
              d="M 33 60
                 C 40 54.5, 46 53, 50 53
                 C 54 53, 60 54.5, 67 60
                 C 63 56.5, 55 55, 50 55
                 C 45 55, 37 56.5, 33 60 Z"
              fill="#FFFFFF"
              opacity="0.85"
            />

            {/* Apex Beacon Diamond Star (Academic Guidance & Future Vision) */}
            <path
              d="M 50 10
                 C 50.8 15, 52.2 16.5, 57 17.5
                 C 52.2 18.5, 50.8 20, 50 25
                 C 49.2 20, 47.8 18.5, 43 17.5
                 C 47.8 16.5, 49.2 15, 50 10 Z"
              fill="url(#anGradBeacon)"
            />

            {/* Center Core Sparkle Accent */}
            <circle cx="50" cy="17.5" r="1.6" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#1F242D] tracking-tight text-base sm:text-lg font-heading leading-tight">
            AlumNexa
          </span>
          <span className="text-[11px] text-[#7E8696] font-medium tracking-wide">
            DTSS College of Commerce
          </span>
        </div>
      )}
    </div>
  );
};
