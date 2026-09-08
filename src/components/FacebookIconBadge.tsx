import React from 'react';

interface FacebookIconBadgeProps {
  className?: string;
  size?: number; // size in px, default 16 (small like star)
  title?: string;
}

/**
 * Small, clean Facebook icon badge without text
 */
export const FacebookIconBadge: React.FC<FacebookIconBadgeProps> = ({
  className = '',
  size = 18,
  title = 'Facebook Top Friends',
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#1877F2] text-white shadow-2xs shrink-0 transition-transform hover:scale-110 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: `${Math.round(size * 0.65)}px`, height: `${Math.round(size * 0.65)}px` }}
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </span>
  );
};

export default FacebookIconBadge;
