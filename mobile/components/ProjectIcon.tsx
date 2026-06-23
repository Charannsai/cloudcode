import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export type DetectedTech = 'nextjs' | 'react' | 'node' | 'flask' | 'fastapi' | 'gin' | 'rust' | 'python' | 'git' | 'empty';

export interface ProjectIconProps {
  type?: string;
  name?: string;
  githubUrl?: string | null;
  size?: number;
  isDark?: boolean;
}

/**
 * Detects the project technology based on workspace properties
 */
export function detectProjectTech(
  type?: string,
  name?: string,
  githubUrl?: string | null
): DetectedTech {
  const normType = (type || '').toLowerCase();
  const normName = (name || '').toLowerCase();
  const normUrl = (githubUrl || '').toLowerCase();

  // 1. Direct type matches
  if (normType === 'nextjs') return 'nextjs';
  if (normType === 'react') return 'react';
  if (normType === 'node') return 'node';
  if (normType === 'flask') return 'flask';
  if (normType === 'fastapi') return 'fastapi';
  if (normType === 'gin') return 'gin';
  if (normType === 'rust') return 'rust';

  // 2. Name matching
  if (normName.includes('next')) return 'nextjs';
  if (normName.includes('react') || normName.includes('vite')) return 'react';
  if (normName.includes('node') || normName.includes('express') || normName.includes('npm')) return 'node';
  if (normName.includes('fastapi')) return 'fastapi';
  if (normName.includes('flask')) return 'flask';
  if (normName.includes('rust') || normName.includes('cargo')) return 'rust';
  if (normName.includes('gin') || normName.includes('golang') || normName.includes('go-')) return 'gin';
  if (normName.includes('python') || normName.includes('django')) return 'python';

  // 3. Git URL matching
  if (normUrl) {
    if (normUrl.includes('next')) return 'nextjs';
    if (normUrl.includes('react') || normUrl.includes('vite')) return 'react';
    if (normUrl.includes('node') || normUrl.includes('express')) return 'node';
    if (normUrl.includes('fastapi')) return 'fastapi';
    if (normUrl.includes('flask')) return 'flask';
    if (normUrl.includes('rust') || normUrl.includes('cargo')) return 'rust';
    if (normUrl.includes('gin') || normUrl.includes('go')) return 'gin';
    if (normUrl.includes('python')) return 'python';
    return 'git';
  }

  return 'empty';
}

/**
 * Returns a cohesive accent color associated with the tech
 */
export function getTechColors(tech: DetectedTech, isDark: boolean = true) {
  switch (tech) {
    case 'nextjs':
      return {
        primary: isDark ? '#FFFFFF' : '#000000',
        bg: isDark ? '#1F2023' : '#EAEAEA',
        glow: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
      };
    case 'react':
      return {
        primary: '#61DAFB',
        bg: isDark ? '#0F2027' : '#E6F7FF',
        glow: 'rgba(97, 218, 251, 0.2)'
      };
    case 'node':
      return {
        primary: '#68A063',
        bg: isDark ? '#111E16' : '#F0F9F0',
        glow: 'rgba(104, 160, 99, 0.2)'
      };
    case 'fastapi':
      return {
        primary: '#059669',
        bg: isDark ? '#06201B' : '#E6FDF5',
        glow: 'rgba(5, 150, 105, 0.2)'
      };
    case 'flask':
      return {
        primary: '#E2E8F0',
        bg: isDark ? '#1E293B' : '#F1F5F9',
        glow: 'rgba(226, 232, 240, 0.15)'
      };
    case 'rust':
      return {
        primary: '#DEA584',
        bg: isDark ? '#2D1B15' : '#FDF3EE',
        glow: 'rgba(222, 165, 132, 0.2)'
      };
    case 'gin':
      return {
        primary: '#00ADD8',
        bg: isDark ? '#0C232B' : '#E6F8FD',
        glow: 'rgba(0, 173, 216, 0.2)'
      };
    case 'python':
      return {
        primary: '#FFD43B',
        bg: isDark ? '#1F241F' : '#FFFDF0',
        glow: 'rgba(255, 212, 59, 0.2)'
      };
    case 'git':
      return {
        primary: '#F05032',
        bg: isDark ? '#271210' : '#FFF5F2',
        glow: 'rgba(240, 80, 50, 0.2)'
      };
    case 'empty':
    default:
      return {
        primary: isDark ? '#9CA3AF' : '#4B5563',
        bg: isDark ? '#1F2937' : '#F3F4F6',
        glow: 'rgba(156, 163, 175, 0.15)'
      };
  }
}

export function ProjectIcon({ type, name, githubUrl, size = 32, isDark = true }: ProjectIconProps) {
  const tech = detectProjectTech(type, name, githubUrl);
  const colors = getTechColors(tech, isDark);

  switch (tech) {
    case 'nextjs':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <Circle cx="50" cy="50" r="48" fill={isDark ? '#000000' : '#FFFFFF'} stroke={colors.primary} strokeWidth="2" />
          <Path
            d="M75 75L42.5 33.3H35V66.6H40.8V42.5L70 79.5C71.8 78.2 73.5 76.7 75 75Z"
            fill={colors.primary}
          />
          <Path
            d="M65 33.3H70.8V66.6H65V33.3Z"
            fill={colors.primary}
          />
        </Svg>
      );

    case 'react':
      return (
        <Svg width={size} height={size} viewBox="-12 -11 24 22" fill="none">
          <Circle cx="0" cy="0" r="2" fill={colors.primary} />
          <G stroke={colors.primary} strokeWidth="1.2">
            <Ellipse rx="11" ry="4.2" />
            <Ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <Ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </G>
        </Svg>
      );

    case 'node':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Hexagonal node logo structure */}
          <Path
            d="M50 8L15 28V68L50 88L85 68V28L50 8Z"
            stroke={colors.primary}
            strokeWidth="3.5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Leaf node details */}
          <Path
            d="M50 25C40 35 40 50 50 65C60 50 60 35 50 25Z"
            fill={colors.primary}
          />
          <Circle cx="50" cy="48" r="4" fill={isDark ? '#111E16' : '#FFFFFF'} />
        </Svg>
      );

    case 'fastapi':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <Path
            d="M50 5L15 25V75L50 95L85 75V25L50 5Z"
            stroke={colors.primary}
            strokeWidth="3.5"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Lightning Bolt */}
          <Path
            d="M55 25L32 52H48L42 75L68 45H52L55 25Z"
            fill={colors.primary}
          />
        </Svg>
      );

    case 'flask':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Chemical Flask beaker */}
          <Path
            d="M38 15H62M45 15V35L22 75C20 78 22 82 26 82H74C78 82 80 78 78 75L55 35V15"
            stroke={colors.primary}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Fluid inside */}
          <Path
            d="M29 63L50 63L71 63L61 45H39L29 63Z"
            fill={colors.primary}
            opacity="0.4"
          />
          {/* Beaker fluid core */}
          <Path
            d="M26 80C34 83 66 83 74 80L69 71H31L26 80Z"
            fill={colors.primary}
          />
        </Svg>
      );

    case 'rust':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Gear shape */}
          <Circle cx="50" cy="50" r="32" stroke={colors.primary} strokeWidth="4" strokeDasharray="6, 4" fill="none" />
          <Circle cx="50" cy="50" r="24" stroke={colors.primary} strokeWidth="3" fill="none" />
          {/* Inner details R logo */}
          <Path
            d="M42 35H55C59 35 61 37 61 40C61 43 59 45 55 45H42V35ZM42 45V60M42 45H52L60 60"
            stroke={colors.primary}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'gin':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Go's dynamic paper airplane/gopher look */}
          <Path
            d="M15 45L85 15L65 85L50 55L15 45Z"
            stroke={colors.primary}
            strokeWidth="4"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M50 55L85 15"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="50" cy="55" r="5" fill={colors.primary} />
        </Svg>
      );

    case 'python':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Interlocking python shapes simplified */}
          <Path
            d="M48 10C35 10 26 15 26 26V36H48V41H21C14 41 10 47 10 58C10 69 15 74 24 74H33V66C33 57 39 52 48 52H70V42C70 30 64 26 53 26H35V21C35 15 41 10 48 10Z"
            fill={colors.primary}
          />
          <Path
            d="M52 90C65 90 74 85 74 74V64H52V59H79C86 59 90 53 90 42C90 31 85 26 76 26H67V34C67 43 61 48 52 48H30V58C30 70 36 74 47 74H65V79C65 85 59 90 52 90Z"
            fill={isDark ? '#4B5563' : '#6B7280'}
            opacity="0.85"
          />
          <Circle cx="35" cy="18" r="2.5" fill={isDark ? '#000000' : '#FFFFFF'} />
          <Circle cx="65" cy="82" r="2.5" fill={isDark ? '#000000' : '#FFFFFF'} />
        </Svg>
      );

    case 'git':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Git branching graph */}
          <Rect x="20" y="20" width="60" height="60" rx="12" stroke={colors.primary} strokeWidth="4.5" transform="rotate(45 50 50)" fill="none" />
          <Circle cx="35" cy="50" r="6" fill={colors.primary} />
          <Circle cx="65" cy="35" r="6" fill={colors.primary} />
          <Circle cx="65" cy="65" r="6" fill={colors.primary} />
          <Path
            d="M35 50H50C58 50 58 35 65 35M50 50C58 50 58 65 65 65"
            stroke={colors.primary}
            strokeWidth="4"
            fill="none"
          />
        </Svg>
      );

    case 'empty':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Sleek box container */}
          <Path
            d="M50 15L18 31V69L50 85L82 69V31L50 15Z"
            stroke={colors.primary}
            strokeWidth="3.5"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M50 85V48M18 31L50 48M82 31L50 48"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
}
