import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  Home01Icon, 
  ArtificialIntelligenceIcon, 
  Settings01Icon, 
  WorkIcon
} from '@hugeicons/core-free-icons';
import CreateIcon from '@/assets/icons/create.svg';

export type SvgIconName = 'home' | 'workspace' | 'create' | 'ai' | 'settings';

const ICON_COMPONENTS: Record<Exclude<SvgIconName, 'create'>, any> = {
  home: Home01Icon,
  workspace: WorkIcon,
  ai: ArtificialIntelligenceIcon,
  settings: Settings01Icon,
};

interface SvgIconProps {
  name: SvgIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 2.0,
}) => {
  if (name === 'create') {
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
      strokeWidth={strokeWidth}
    />
  );
};
