import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { type Position } from '../game/constants';

interface FloatingScoreBadgeProps {
  id: string;
  text: string;
  position: Position;
  cellSize: number;
  boardPadding: number;
  boardGap: number;
  onDismiss: (id: string) => void;
}

export function FloatingScoreBadge({
  id,
  text,
  position,
  cellSize,
  boardPadding,
  boardGap,
  onDismiss,
}: FloatingScoreBadgeProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -36,
        duration: 650,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 470,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onDismiss(id);
    });
  }, [id, onDismiss, opacity, scale, translateY]);

  const left = boardPadding + position.column * (cellSize + boardGap);
  const top = boardPadding + position.row * (cellSize + boardGap);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left,
          top,
          width: cellSize,
          height: cellSize,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.scoreText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  scoreText: {
    color: '#FFD166',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
