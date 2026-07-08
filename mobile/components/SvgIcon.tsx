import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  Home01Icon, 
  Briefcase01Icon, 
  Add01Icon, 
  ArtificialIntelligenceIcon, 
  Settings01Icon 
} from '@hugeicons/core-free-icons';

export type SvgIconName = 'home' | 'workspace' | 'create' | 'ai' | 'settings';

const ICON_COMPONENTS: Record<SvgIconName, any> = {
  home: Home01Icon,
  workspace: Briefcase01Icon,
  create: Add01Icon,
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
