import React from 'react';
import { SvgProps } from 'react-native-svg';

import HomeIcon from '@/assets/icons/home.svg';
import WorkspaceIcon from '@/assets/icons/workspace.svg';
import CreateIcon from '@/assets/icons/create.svg';
import AiIcon from '@/assets/icons/artificialintelligence.svg';
import SettingsIcon from '@/assets/icons/settings.svg';

export type SvgIconName = 'home' | 'workspace' | 'create' | 'ai' | 'settings';

const ICON_COMPONENTS: Record<SvgIconName, React.FC<SvgProps>> = {
  home: HomeIcon,
  workspace: WorkspaceIcon,
  create: CreateIcon,
  ai: AiIcon,
  settings: SettingsIcon,
};

interface SvgIconProps extends SvgProps {
  name: SvgIconName;
  size?: number;
  color?: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  ...props
}) => {
  const IconComponent = ICON_COMPONENTS[name];
  if (!IconComponent) return null;

  return (
    <IconComponent
      width={size}
      height={size}
      fill={color}
      {...props}
    />
  );
};
