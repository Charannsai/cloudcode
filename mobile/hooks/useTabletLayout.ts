import { useMemo } from 'react'
import { useDeviceType } from './useDeviceType'
import { useTabletLayoutStore } from '@/store/tabletLayoutStore'
import { IDE_LAYOUT } from '@/constants/tokens'

/**
 * Computes the pixel dimensions for each IDE panel based on current
 * screen size and panel visibility state.
 */
export function useTabletLayout() {
  const { screenWidth, screenHeight, isTablet, isLandscape } = useDeviceType()
  const { sidebarVisible, rightPanelVisible, bottomPanelVisible } = useTabletLayoutStore()

  return useMemo(() => {
    if (!isTablet) {
      return {
        isTablet: false as const,
        activityBarWidth: 0,
        sidebarWidth: 0,
        rightPanelWidth: 0,
        bottomPanelHeight: 0,
        editorWidth: screenWidth,
        editorHeight: screenHeight,
        statusBarHeight: 0,
        titleBarHeight: 0,
        menuBarHeight: 0,
        editorTabBarHeight: 0,
      }
    }

    const activityBarWidth = IDE_LAYOUT.activityBarWidth
    const sidebarWidth = sidebarVisible ? IDE_LAYOUT.sidebarWidth : 0
    const rightPanelWidth = rightPanelVisible ? IDE_LAYOUT.rightPanelWidth : 0
    const statusBarHeight = IDE_LAYOUT.statusBarHeight
    const titleBarHeight = IDE_LAYOUT.titleBarHeight
    const menuBarHeight = IDE_LAYOUT.menuBarHeight
    const editorTabBarHeight = IDE_LAYOUT.editorTabBarHeight

    // Compute remaining editor width
    const editorWidth = screenWidth - activityBarWidth - sidebarWidth - rightPanelWidth

    // Compute vertical space for the editor area
    const verticalChrome = titleBarHeight + menuBarHeight + editorTabBarHeight + statusBarHeight
    const availableHeight = screenHeight - verticalChrome
    const bottomPanelHeight = bottomPanelVisible ? IDE_LAYOUT.bottomPanelHeight : 0
    const editorHeight = availableHeight - bottomPanelHeight

    return {
      isTablet: true as const,
      activityBarWidth,
      sidebarWidth,
      rightPanelWidth,
      bottomPanelHeight,
      editorWidth,
      editorHeight,
      statusBarHeight,
      titleBarHeight,
      menuBarHeight,
      editorTabBarHeight,
    }
  }, [screenWidth, screenHeight, isTablet, isLandscape, sidebarVisible, rightPanelVisible, bottomPanelVisible])
}
