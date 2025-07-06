import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

export const EyeIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
)

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({ 
  className = '', 
  size = 16, 
  filled = false 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={filled ? 0 : 2}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

export const ChatIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

export const ShareIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

export const BookmarkIcon: React.FC<IconProps & { filled?: boolean }> = ({ 
  className = '', 
  size = 16, 
  filled = false 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke={filled ? "none" : "currentColor"}
    strokeWidth={filled ? 0 : 2}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)

export const PlayIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M8 5v14l11-7z"/>
  </svg>
)

export const DownloadIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

export const MoreIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
)

export const RobotIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7H15L13.5 7.5C13.1 7.4 12.6 7.4 12 7.4S10.9 7.4 10.5 7.5L9 7H3V9H4.62L6.16 12.5C6.58 13.73 7.69 14.5 9 14.5H15C16.31 14.5 17.42 13.73 17.84 12.5L19.38 9H21ZM7.5 12C7.22 12 7 11.78 7 11.5S7.22 11 7.5 11 8 11.22 8 11.5 7.78 12 7.5 12ZM16.5 12C16.22 12 16 11.78 16 11.5S16.22 11 16.5 11 17 11.22 17 11.5 16.78 12 16.5 12ZM18 22H6V20H18V22ZM3.97 19L5.97 19C5.97 17.8 6.8 16.79 7.97 16.54C8.67 16.38 9.33 16.38 10.03 16.54C11.2 16.79 12.03 17.8 12.03 19L14.03 19C14.03 17.8 14.8 16.79 15.97 16.54C16.67 16.38 17.33 16.38 18.03 16.54C19.2 16.79 20.03 17.8 20.03 19H22.03C22.03 17.34 20.8 15.94 19.21 15.64C18.23 15.45 17.18 15.45 16.2 15.64C15.46 15.78 14.8 16.05 14.21 16.43C13.62 16.05 12.96 15.78 12.22 15.64C11.24 15.45 10.19 15.45 9.21 15.64C7.62 15.94 6.39 17.34 6.39 19H3.97Z"/>
  </svg>
)

export const SparkleIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2L15.09 8.26L22 9L17 14.74L18.18 22L12 18.27L5.82 22L7 14.74L2 9L8.91 8.26L12 2Z"/>
  </svg>
)