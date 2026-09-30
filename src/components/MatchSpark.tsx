import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { type Position } from '../game/constants';

interface MatchSparkProps {
  position: Position;
  cellSize: number;
  boardPadding: number;
  boardGap: number;
  glowColor?: string;
}

const BURST_DIRECTIONS = [
  { dx: 0, dy: -24 },
  { dx: 21, dy: -12 },
  { dx: 21, dy: 12 },
  { dx: 0, dy: 24 },
  { dx: -21, dy: 12 },
  { dx: -21, dy: -12 },
];

export function MatchSpark({
  position,
  cellSize,
  boardPadding,
  boardGap,
  glowColor = '#62F2C6',
}: MatchSparkProps) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const particleDist = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue: 2.2,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(particleDist, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, particleDist, ringScale, scale]);

  const left = boardPadding + position.column * (cellSize + boardGap);
  const top = boardPadding + position.row * (cellSize + boardGap);
  const centerOffset = cellSize / 2;

  return (
    <>
      {/* Central Expanding Core */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkCore,
          {
            width: cellSize,
            height: cellSize,
            left,
            top,
            backgroundColor: glowColor,
            opacity,
            transform: [{ scale }],
          },
        ]}
      />

      {/* Shockwave Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sparkRing,
          {
            width: cellSize,
            height: cellSize,
            left,
            top,
            borderColor: glowColor,
            opacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Radial Particle Sparks */}
      {BURST_DIRECTIONS.map((dir, i) => {
        const transX = particleDist.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dir.dx],
        });
        const transY = particleDist.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dir.dy],
        });

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.sparkDot,
              {
                left: left + centerOffset - 3,
                top: top + centerOffset - 3,
                backgroundColor: glowColor,
                opacity,
                transform: [{ translateX: transX }, { translateY: transY }, { scale }],
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  sparkCore: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    elevation: 8,
  },
  sparkRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2.5,
  },
  sparkDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
