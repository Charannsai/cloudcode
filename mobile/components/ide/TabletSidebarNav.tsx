import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { SvgIcon } from '@/components/SvgIcon'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'

/**
 * IDE-style vertical sidebar navigation for tablets.
 * Replaces the floating bottom tab bar on tablet devices.
 * Looks like VS Code's activity bar: vertical icon strip with labels.
 */

const SIDEBAR_WIDTH = 64

interface TabletSidebarNavProps {
  state: any
  descriptors: any
  navigation: any
}

export default function TabletSidebarNav({ state, descriptors, navigation }: TabletSidebarNavProps) {
  const { isDark, colors } = useAppTheme()

  const activeColor = colors.tabBarActive || colors.primary
  const inactiveColor = colors.tabBarInactive || colors.textSecondary

  const tabs = [
    { key: 'dashboard', routeIndex: 0, icon: 'home' as const, label: 'Home' },
    { key: 'projects', routeIndex: 1, icon: 'workspace' as const, label: 'Projects' },
    { key: 'ai', routeIndex: 2, icon: 'sparkles' as const, label: 'AI' },
    { key: 'usage', routeIndex: 3, icon: 'usage' as const, label: 'Usage' },
    { key: 'settings', routeIndex: 4, icon: 'settings' as const, label: 'Settings' },
  ]

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? '#0D1117' : '#F0F2F5',
      borderRightColor: colors.border,
    }]}>
      {/* Logo / Brand at top */}
      <View style={styles.brandSection}>
        <View style={[styles.brandIcon, { backgroundColor: isDark ? '#161B22' : '#FFFFFF' }]}>
          <Svg width={22} height={22} viewBox="0 0 880 560">
            <Defs>
              <LinearGradient id="tabletNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isDark ? '#58A6FF' : '#0969DA'} />
                <Stop offset="100%" stopColor={isDark ? '#A78BFA' : '#7C3AED'} />
              </LinearGradient>
            </Defs>
            <Path
              d="M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z"
              fill="url(#tabletNavGrad)"
              scale={0.025}
            />
          </Svg>
        </View>
      </View>

      {/* Navigation items */}
      <View style={styles.navItems}>
        {tabs.map((tab) => {
          const isFocused = state.index === tab.routeIndex
          const route = state.routes[tab.routeIndex]

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.navItem,
                isFocused && {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {/* Active indicator bar */}
              {isFocused && (
                <View style={[styles.activeBar, { backgroundColor: activeColor }]} />
              )}
              <SvgIcon
                name={tab.icon}
                size={22}
                color={isFocused ? activeColor : inactiveColor}
                filled={isFocused}
                isDark={isDark}
                strokeWidth={isFocused ? 2.2 : 1.6}
              />
              <Text style={[styles.navLabel, {
                color: isFocused ? activeColor : inactiveColor,
                fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  brandSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItems: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  navItem: {
    width: SIDEBAR_WIDTH,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 2.5,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 20,
  },
})
