import React from 'react';

interface GreenDiamondIconProps {
  className?: string;
  size?: number;
}

/**
 * A beautiful, faceted emerald-green gemstone/diamond icon
 */
export const GreenDiamondIcon: React.FC<GreenDiamondIconProps> = ({
  className = 'w-4 h-4',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    >
      <defs>
        <linearGradient id="emeraldGradTop" x1="2" y1="3" x2="22" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="emeraldGradCenter" x1="6" y1="8" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="emeraldGradLeft" x1="2" y1="8" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>
        <linearGradient id="emeraldGradRight" x1="22" y1="8" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="emeraldHighlight" x1="7" y1="3" x2="17" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {/* Top Table / Bezel */}
      <polygon points="6,3 18,3 22,8 2,8" fill="url(#emeraldGradTop)" />
      {/* Center Top Facet (Table) */}
      <polygon points="8,3 16,3 14,8 10,8" fill="url(#emeraldHighlight)" />
      {/* Left Top Facet */}
      <polygon points="2,8 6,3 10,8" fill="#059669" fillOpacity="0.9" />
      {/* Right Top Facet */}
      <polygon points="18,3 22,8 14,8" fill="#6EE7B7" fillOpacity="0.9" />

      {/* Lower Pavilion Left */}
      <polygon points="2,8 10,8 12,22" fill="url(#emeraldGradLeft)" />
      {/* Lower Pavilion Center */}
      <polygon points="10,8 14,8 12,22" fill="url(#emeraldGradCenter)" />
      {/* Lower Pavilion Right */}
      <polygon points="14,8 22,8 12,22" fill="url(#emeraldGradRight)" />

      {/* Brilliant Reflection Sparkle */}
      <polygon points="11,9 13,9 12,14" fill="#FFFFFF" fillOpacity="0.65" />
      <polygon points="9,4 15,4 12,5.5" fill="#FFFFFF" fillOpacity="0.75" />

      {/* Subtle Facet Stroke */}
      <path
        d="M6 3L18 3L22 8L12 22L2 8L6 3Z M2 8L22 8 M6 3L10 8L12 22L14 8L18 3 M8 3L10 8 M16 3L14 8"
        stroke="#064E3B"
        strokeWidth="0.5"
        strokeOpacity="0.4"
      />
    </svg>
  );
};

export default GreenDiamondIcon;
