import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type GameMode, type ThemeMode } from '../game/constants';

interface HeaderProps {
  mode: GameMode;
  theme: ThemeMode;
  isMuted: boolean;
  onToggleMode: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenHowToPlay: () => void;
  accentColor?: string;
}

export function Header({
  mode,
  theme,
  isMuted,
  onToggleMode,
  onToggleTheme,
  onToggleSound,
  onOpenHowToPlay,
  accentColor = '#62F2C6',
}: HeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleColumn}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Sugar Circuit</Text>
          <View style={styles.candyPill}>
            <MaterialCommunityIcons name="candy" size={13} color="#FBBF24" />
          </View>
        </View>
        <Text style={styles.subtitleText}>Match 3 candies to clear the board</Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Mode Toggle Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Game mode: ${mode === 'moves' ? 'Classic Moves' : 'Speed Blitz'}. Tap to switch.`}
          onPress={onToggleMode}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        >
          <MaterialCommunityIcons
            name={mode === 'moves' ? 'swap-horizontal' : 'lightning-bolt'}
            size={18}
            color={accentColor}
          />
          <Text style={styles.modeBadgeText}>{mode === 'moves' ? 'MOVES' : 'BLITZ'}</Text>
        </Pressable>

        {/* Theme Toggle Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Current theme: ${theme}. Tap to switch theme.`}
          onPress={onToggleTheme}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        >
          <MaterialCommunityIcons
            name={theme === 'cyber' ? 'weather-night' : 'white-balance-sunny'}
            size={18}
            color="#FFD166"
          />
        </Pressable>

        {/* Sound Toggle Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute game audio' : 'Mute game audio'}
          onPress={onToggleSound}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'volume-off' : 'volume-high'}
            size={18}
            color={isMuted ? '#9AA7C5' : accentColor}
          />
        </Pressable>

        {/* Info / How To Play Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open instructions and how to play guide"
          onPress={onOpenHowToPlay}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
        >
          <MaterialCommunityIcons name="help-circle-outline" size={18} color="#9AA7C5" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 8,
  },
  titleColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candyPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  titleText: {
    color: '#F4F7FF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: '#9AA7C5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 2,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  modeBadgeText: {
    color: '#F4F7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
