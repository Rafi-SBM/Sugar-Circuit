import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  BOARD_SIZE,
  TILE_DEFINITIONS,
  type Position,
  type TileType,
} from '../game/constants';

interface TileProps {
  tile: TileType;
  position: Position;
  selected: boolean;
  hinted: boolean;
  invalid: boolean;
  swapOffset?: { x: number; y: number } | null;
  cellSize: number;
  boardPadding: number;
  boardGap: number;
  onPress: (position: Position) => void;
  onSwipe: (from: Position, to: Position) => void;
}

export function Tile({
  tile,
  position,
  selected,
  hinted,
  invalid,
  swapOffset,
  cellSize,
  boardPadding,
  boardGap,
  onPress,
  onSwipe,
}: TileProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(1)).current;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tileDefinition = TILE_DEFINITIONS[tile] ?? TILE_DEFINITIONS[0];

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.12 : 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  useEffect(() => {
    if (!hinted) {
      hintPulse.setValue(1);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1.08,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0.95,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [hintPulse, hinted]);

  useEffect(() => {
    if (!invalid) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: -7, duration: 45, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 7, duration: 45, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -5, duration: 45, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5, duration: 45, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 45, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [invalid, shake]);

  useEffect(() => {
    if (swapOffset) {
      Animated.spring(slideX, {
        toValue: swapOffset.x,
        friction: 7,
        tension: 150,
        useNativeDriver: true,
      }).start();
      Animated.spring(slideY, {
        toValue: swapOffset.y,
        friction: 7,
        tension: 150,
        useNativeDriver: true,
      }).start();
    } else {
      slideX.setValue(0);
      slideY.setValue(0);
    }
  }, [slideX, slideY, swapOffset]);

  const left = boardPadding + position.column * (cellSize + boardGap);
  const top = boardPadding + position.row * (cellSize + boardGap);

  const handleTouchStart = (e: GestureResponderEvent) => {
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    touchStartRef.current = { x: touch.pageX, y: touch.pageY };
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.nativeEvent.changedTouches?.[0] || e.nativeEvent;
    const deltaX = touch.pageX - touchStartRef.current.x;
    const deltaY = touch.pageY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Trigger directional swap along the dominant axis once past threshold
    const SWIPE_THRESHOLD = 20;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const targetCol = deltaX > 0 ? position.column + 1 : position.column - 1;
        if (targetCol >= 0 && targetCol < BOARD_SIZE) {
          onSwipe(position, { row: position.row, column: targetCol });
        }
      } else {
        const targetRow = deltaY > 0 ? position.row + 1 : position.row - 1;
        if (targetRow >= 0 && targetRow < BOARD_SIZE) {
          onSwipe(position, { row: targetRow, column: position.column });
        }
      }
    }
  };

  const combinedScale = Animated.multiply(scale, hinted ? hintPulse : 1);

  return (
    <Animated.View
      style={[
        styles.tileContainer,
        {
          width: cellSize,
          height: cellSize,
          left,
          top,
          transform: [
            { translateX: Animated.add(shake, slideX) },
            { translateY: slideY },
            { scale: combinedScale },
          ],
          zIndex: selected ? 25 : swapOffset ? 18 : 1,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${tileDefinition.label} tile at row ${position.row + 1}, column ${position.column + 1}`}
        onPress={() => onPress(position)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={({ pressed }) => [
          styles.tilePressable,
          {
            backgroundColor: tileDefinition.background,
            borderColor: selected
              ? '#FFFFFF'
              : hinted
              ? '#FFD166'
              : tileDefinition.border,
            borderWidth: selected ? 2.5 : hinted ? 2.2 : 1.2,
          },
          pressed && styles.tilePressed,
          selected && [styles.tileSelectedShadow, { shadowColor: tileDefinition.glow }],
          hinted && styles.tileHintShadow,
        ]}
      >
        {/* Multistage Dimensional Gradient */}
        <LinearGradient
          colors={[tileDefinition.highlight, tileDefinition.background, tileDefinition.shadow]}
          start={{ x: 0.15, y: 0.05 }}
          end={{ x: 0.85, y: 0.95 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top 3D Bevel Highlight Rim */}
        <View style={styles.topBevelRim} />

        {/* Specular Gloss Reflection Arc */}
        <View style={styles.specularGloss} />

        {/* Bottom Depth Shadow Lip */}
        <View style={[styles.bottomDepthLip, { backgroundColor: tileDefinition.shadow }]} />

        {/* Ambient Center Glow */}
        <View style={[styles.innerGlow, { backgroundColor: tileDefinition.glow }]} />

        {/* Distinctive Vector Icon */}
        <MaterialCommunityIcons
          name={tileDefinition.icon}
          size={Math.round(cellSize * 0.46)}
          color={tileDefinition.foreground}
          style={styles.icon}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tileContainer: {
    position: 'absolute',
  },
  tilePressable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  tilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.92 }],
  },
  tileSelectedShadow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  tileHintShadow: {
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  topBevelRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  specularGloss: {
    position: 'absolute',
    top: 3,
    left: 5,
    right: 5,
    height: '36%',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  bottomDepthLip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.85,
  },
  innerGlow: {
    position: 'absolute',
    width: '65%',
    height: '65%',
    borderRadius: 999,
    opacity: 0.35,
  },
  icon: {
    shadowColor: 'rgba(0, 0, 0, 0.45)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
});
