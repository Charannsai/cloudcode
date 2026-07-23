import React from 'react';
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
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 2.0,
  filled = false,
}) => {
  // Use the workspace creation SVG icon (create.svg) for 'sparkles', 'ai', and 'create'
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

  const IconComponent = ICON_COMPONENTS[name];
  if (!IconComponent) return null;

  return (
    <HugeiconsIcon
      icon={IconComponent}
      size={size}
      color={color}
      strokeWidth={filled ? 2.6 : strokeWidth}
    />
  );
};
