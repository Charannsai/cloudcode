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

  // 1. Check for specific frameworks inside name/githubUrl first to override general type (e.g. react/node)
  if (normName.includes('next') || normUrl.includes('next') || normType === 'nextjs') return 'nextjs';
  if (normName.includes('fastapi') || normUrl.includes('fastapi') || normType === 'fastapi') return 'fastapi';
  if (normName.includes('flask') || normUrl.includes('flask') || normType === 'flask') return 'flask';
  if (normName.includes('rust') || normName.includes('cargo') || normUrl.includes('rust') || normUrl.includes('cargo') || normType === 'rust') return 'rust';
  if (normName.includes('gin') || normName.includes('golang') || normName.includes('go-') || normUrl.includes('gin') || normUrl.includes('go') || normType === 'gin') return 'gin';
  if (normName.includes('python') || normName.includes('django') || normUrl.includes('python') || normType === 'python') return 'python';

  // 2. Direct general type matches
  if (normType === 'react') return 'react';
  if (normType === 'node') return 'node';

  // 3. Fallbacks
  if (normName.includes('react') || normName.includes('vite') || normUrl.includes('react') || normUrl.includes('vite')) return 'react';
  if (normName.includes('node') || normName.includes('express') || normName.includes('npm') || normUrl.includes('node') || normUrl.includes('express')) return 'node';
  if (normUrl) return 'git';

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
        primary: '#47C27F',
        bg: isDark ? '#14251C' : '#E8F8F0',
        glow: 'rgba(71, 194, 127, 0.2)'
      };
    case 'rust':
      return {
        primary: '#E05A36',
        bg: isDark ? '#2B1A16' : '#FFF5F2',
        glow: 'rgba(224, 90, 54, 0.2)'
      };
    case 'gin':
      return {
        primary: '#00ADD8',
        bg: isDark ? '#0C232B' : '#E6F8FD',
        glow: 'rgba(0, 173, 216, 0.2)'
      };
    case 'python':
      return {
        primary: '#3776AB',
        bg: isDark ? '#141E26' : '#EBF3FA',
        glow: 'rgba(55, 118, 171, 0.2)'
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
        <Svg width={size} height={size} viewBox="0 0 255 225" fill="none">
          <G fill="#00ADD8">
            <Path d="M40.2,101.1c-0.4,0-0.5-0.2-0.3-0.5l2.1-2.7c0.2-0.3,0.7-0.5,1.1-0.5l35.7,0c0.4,0,0.5,0.3,0.3,0.6 l-1.7,2.6c-0.2,0.3-0.7,0.6-1,0.6L40.2,101.1z" />
            <Path d="M25.1,110.3c-0.4,0-0.5-0.2-0.3-0.5l2.1-2.7c0.2-0.3,0.7-0.5,1.1-0.5l45.6,0c0.4,0,0.6,0.3,0.5,0.6 l-0.8,2.4c-0.1,0.4-0.5,0.6-0.9,0.6L25.1,110.3z" />
            <Path d="M49.3,119.5c-0.4,0-0.5-0.3-0.3-0.6l1.4-2.5c0.2-0.3,0.6-0.6,1-0.6l20,0c0.4,0,0.6,0.3,0.6,0.7l-0.2,2.4 c0,0.4-0.4,0.7-0.7,0.7L49.3,119.5z" />
            <Path d="M153.1,99.3c-6.3,1.6-10.6,2.8-16.8,4.4c-1.5,0.4-1.6,0.5-2.9-1c-1.5-1.7-2.6-2.8-4.7-3.8 c-6.3-3.1-12.4-2.2-18.1,1.5c-6.8,4.4-10.3,10.9-10.2,19c0.1,8,5.6,14.6,13.5,15.7c6.8,0.9,12.5-1.5,17-6.6 c0.9-1.1,1.7-2.3,2.7-3.7c-3.6,0-8.1,0-19.3,0c-2.1,0-2.6-1.3-1.9-3c1.3-3.1,3.7-8.3,5.1-10.9c0.3-0.6,1-1.6,2.5-1.6 c5.1,0,23.9,0,36.4,0c-0.2,2.7-0.2,5.4-0.6,8.1c-1.1,7.2-3.8,13.8-8.2,19.6c-7.2,9.5-16.6,15.4-28.5,17 c-9.8,1.3-18.9-0.6-26.9-6.6c-7.4-5.6-11.6-13-12.7-22.2c-1.3-10.9,1.9-20.7,8.5-29.3c7.1-9.3,16.5-15.2,28-17.3 c9.4-1.7,18.4-0.6,26.5,4.9c5.3,3.5,9.1,8.3,11.6,14.1C154.7,98.5,154.3,99,153.1,99.3z" />
            <Path d="M186.2,154.6c-9.1-0.2-17.4-2.8-24.4-8.8c-5.9-5.1-9.6-11.6-10.8-19.3c-1.8-11.3,1.3-21.3,8.1-30.2 c7.3-9.6,16.1-14.6,28-16.7c10.2-1.8,19.8-0.8,28.5,5.1c7.9,5.4,12.8,12.7,14.1,22.3c1.7,13.5-2.2,24.5-11.5,33.9 c-6.6,6.7-14.7,10.9-24,12.8C191.5,154.2,188.8,154.3,186.2,154.6z M210,114.2c-0.1-1.3-0.1-2.3-0.3-3.3 c-1.8-9.9-10.9-15.5-20.4-13.3c-9.3,2.1-15.3,8-17.5,17.4c-1.8,7.8,2,15.7,9.2,18.9c5.5,2.4,11,2.1,16.3-0.6 C205.2,129.2,209.5,122.8,210,114.2z" />
          </G>
        </Svg>
      );

    case 'python':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Interlocking python shapes simplified with exact official yellow and blue colors */}
          <Path
            d="M48 10C35 10 26 15 26 26V36H48V41H21C14 41 10 47 10 58C10 69 15 74 24 74H33V66C33 57 39 52 48 52H70V42C70 30 64 26 53 26H35V21C35 15 41 10 48 10Z"
            fill="#3776AB"
          />
          <Path
            d="M52 90C65 90 74 85 74 74V64H52V59H79C86 59 90 53 90 42C90 31 85 26 76 26H67V34C67 43 61 48 52 48H30V58C30 70 36 74 47 74H65V79C65 85 59 90 52 90Z"
            fill="#FFD43B"
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
