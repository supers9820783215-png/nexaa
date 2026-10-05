import React from 'react';

interface AlumniLogoProps {
  className?: string;
  showText?: boolean;
}

export const AlumniLogo: React.FC<AlumniLogoProps> = ({ className = 'w-10 h-10', showText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 ${showText ? 'flex-row' : ''}`}>
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain drop-shadow-xs"
          role="img"
          aria-label="Alumni Connect Logo"
        >
          <defs>
            {/* Ambient Circular Halo Gradient */}
            <linearGradient id="logoHaloGradient" x1="25" y1="95" x2="175" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A0D2EB" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#C2C2EB" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#D0BDF4" stopOpacity="0.95" />
            </linearGradient>

            {/* Left Leg Gradient (Steel Slate Blue) */}
            <linearGradient id="logoLeftLegGrad" x1="45" y1="42" x2="95" y2="128" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#48688E" />
              <stop offset="50%" stopColor="#5E86AB" />
              <stop offset="100%" stopColor="#7CA3C4" />
            </linearGradient>

            {/* Right Leg Gradient (Soft Lilac / Royal Purple) */}
            <linearGradient id="logoRightLegGrad" x1="100" y1="45" x2="155" y2="128" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6B528D" />
              <stop offset="50%" stopColor="#8458B3" />
              <stop offset="100%" stopColor="#9E80C4" />
            </linearGradient>

            {/* Student Dynamic Arc Gradient */}
            <linearGradient id="logoStudentArcGrad" x1="68" y1="100" x2="135" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5B84A9" />
              <stop offset="100%" stopColor="#83AACB" />
            </linearGradient>

            {/* Subtle Drop Shadow */}
            <filter id="logoSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#494D5F" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Background Ambient Halo Ring */}
          <circle
            cx="100"
            cy="86"
            r="58"
            stroke="url(#logoHaloGradient)"
            strokeWidth="2.5"
            fill="none"
            opacity="0.85"
          />

          {/* Sparkle Star (4-Pointed) */}
          <path
            d="M 134 57 Q 134 62 139 62 Q 134 62 134 67 Q 134 62 129 62 Q 134 62 134 57 Z"
            fill="#C0A9E2"
            opacity="0.95"
          />

          {/* Stylized Left Leg of 'A' with base flare serif */}
          <path
            d="M 96 44 
               L 80 84 
               C 74 98, 64 114, 50 125 
               C 47 127, 44 128, 48 128
               C 57 128, 71 127.5, 82 126
               C 76 122, 72 116, 73 110
               L 83 83
               C 87 74, 93 54, 96 44 Z"
            fill="url(#logoLeftLegGrad)"
          />

          {/* Stylized Right Leg of 'A' */}
          <path
            d="M 104 44 
               L 115 74 
               C 120 70, 126 71, 131 77
               C 137 84, 140 96, 143 114
               C 144 120, 148 123, 151 125
               C 143 125.5, 129 125.5, 119 125
               C 124 120, 124 113, 122 108
               C 118 97, 112 88, 105 82
               L 104 44 Z"
            fill="url(#logoRightLegGrad)"
          />

          {/* Mentor Figure (Purple) Head */}
          <circle cx="121" cy="72" r="7.5" fill="#8458B3" filter="url(#logoSoftShadow)" />

          {/* Student Figure (Slate Blue) Head */}
          <circle cx="87" cy="91" r="6.8" fill="#6A97BD" filter="url(#logoSoftShadow)" />

          {/* Connecting Bridge / Upward Arc */}
          {/* White Negative Space Contour */}
          <path
            d="M 70 123 
               C 71 106, 85 94, 114 93 
               C 127 93, 134 98, 137 107 
               C 134 99, 123 95, 111 95 
               C 88 96, 76 108, 72 123 Z"
            fill="#FFFFFF"
          />

          {/* Blue Dynamic Swoosh */}
          <path
            d="M 71 125 
               C 72 108, 87 96, 115 95 
               C 128 95, 135 100, 137 109 
               C 134 103, 124 98, 113 98 
               C 88 98, 77 110, 73 125 Z"
            fill="url(#logoStudentArcGrad)"
          />

          {/* Graduation Mortarboard Cap at Peak */}
          <g filter="url(#logoSoftShadow)">
            {/* Skullcap Base */}
            <path d="M 87 42 C 87 46.5, 113 46.5, 113 42 Z" fill="#2E384D" />

            {/* Diamond Top Rhombus */}
            <polygon points="100,28 125,35.5 100,43 75,35.5" fill="#3D4A63" />

            {/* Center Cap Button */}
            <circle cx="100" cy="35.5" r="1.5" fill="#5A6985" />

            {/* Right Hanging Tassel */}
            <path d="M 100 35.5 Q 119 37.5 121 47" stroke="#252F42" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <polygon points="120,47 123,47 122,52 119,52" fill="#252F42" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#494D5F] tracking-tight text-base sm:text-lg font-heading leading-tight">
            ALUMNI CONNECT
          </span>
          <span className="text-[11px] text-[#494D5F]/70 font-medium tracking-wide">
            Connect. Learn. Grow.
          </span>
        </div>
      )}
    </div>
  );
};
