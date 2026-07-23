import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  Home01Icon, 
  Settings01Icon, 
  WorkIcon,
  BarChartIcon,
} from '@hugeicons/core-free-icons';
import CreateIcon from '@/assets/icons/create.svg';

export type SvgIconName = 'home' | 'workspace' | 'create' | 'ai' | 'settings' | 'usage' | 'sparkles';

const ICON_COMPONENTS: Record<string, any> = {
  home: Home01Icon,
  workspace: WorkIcon,
  settings: Settings01Icon,
  usage: BarChartIcon,
};

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  isDark?: boolean;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 2.0,
  filled = false,
  isDark = false,
}) => {
  // Use workspace creation SVG icon for 'sparkles', 'ai', and 'create'
  if (name === 'create' || name === 'sparkles' || name === 'ai') {
    return (
      <CreateIcon
        width={size}
        height={size}
        fill={color}
        stroke={color}
        color={color}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  const RawIconData = ICON_COMPONENTS[name];
  if (!RawIconData) return null;

  // When active (filled === true): render per-icon solid fill + inner particle cutouts
  if (filled && Array.isArray(RawIconData)) {
    const bgCutoutColor = isDark ? '#141722' : '#FFFFFF';

    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {RawIconData.map(([tag, attrs], idx) => {
          // 1. Usage (BarChart): All 3 pillars should be filled solid
          if (name === 'usage') {
            return (
              <Path
                key={idx}
                d={attrs.d}
                fill={color}
                stroke={color}
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          // 2. Workspace (Projects): Main body (0) and handle (1) are filled solid, inner clasp line (2) is cutout
          if (name === 'workspace') {
            if (idx === 0 || idx === 1) {
              return (
                <Path
                  key={idx}
                  d={attrs.d}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return (
              <Path
                key={idx}
                d={attrs.d}
                fill="none"
                stroke={bgCutoutColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          // 3. Home: House body (0) is filled solid, door arc (1) is cutout line
          if (name === 'home') {
            if (idx === 0) {
              return (
                <Path
                  key={idx}
                  d={attrs.d}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return (
              <Path
                key={idx}
                d={attrs.d}
                fill="none"
                stroke={bgCutoutColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          // 4. Settings: Outer gear wheel (0) is filled solid, inner center circle (1) is cutout hole
          if (name === 'settings') {
            if (idx === 0) {
              return (
                <Path
                  key={idx}
                  d={attrs.d}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return (
              <Path
                key={idx}
                d={attrs.d}
                fill={bgCutoutColor}
                stroke={bgCutoutColor}
                strokeWidth={1}
              />
            );
          }

          // Fallback
          return (
            <Path
              key={idx}
              d={attrs.d}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    );
  }

  // Inactive state (filled === false): render exact Hugeicons outline
  return (
    <HugeiconsIcon
      icon={RawIconData}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
};
