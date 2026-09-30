import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const CONFETTI_COUNT = 38;
const CONFETTI_COLORS = ['#62F2C6', '#FF7B87', '#FFD166', '#B6A2FF', '#45CFC2', '#FF9F43', '#54A0FF'];

interface ConfettiPieceProps {
  index: number;
}

function ConfettiPiece({ index }: ConfettiPieceProps) {
  const { width, height } = Dimensions.get('window');
  const animY = useRef(new Animated.Value(-40)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animRotate = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  const startX = Math.random() * width;
  const drift = (Math.random() - 0.5) * 140;
  const duration = 2400 + Math.random() * 1600;
  const delay = Math.random() * 800;
  const size = 8 + Math.random() * 8;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 3 === 0;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(animY, {
          toValue: height + 60,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animX, {
          toValue: drift,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animRotate, {
          toValue: 720 + Math.random() * 720,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(animOpacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [animOpacity, animRotate, animX, animY, delay, drift, duration, height]);

  const spin = animRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: startX,
          width: size,
          height: isCircle ? size : size * 1.6,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
          opacity: animOpacity,
          transform: [
            { translateY: animY },
            { translateX: animX },
            { rotate: spin },
          ],
        },
      ]}
    />
  );
}

export function ConfettiCannon() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
        <ConfettiPiece key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    zIndex: 999,
  },
});
