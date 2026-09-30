import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type GameMode } from '../game/constants';

interface MovesHudProps {
  mode: GameMode;
  movesLeft: number;
  secondsLeft: number;
}

export function MovesHud({ mode, movesLeft, secondsLeft }: MovesHudProps) {
  const valueScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isMovesMode = mode === 'moves';
  const isUrgent = isMovesMode ? movesLeft <= 5 : secondsLeft <= 15;
  const accent = isUrgent ? '#FF7B87' : '#FFD166';

  const displayValue = isMovesMode
    ? String(movesLeft).padStart(2, '0')
    : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const label = isMovesMode ? 'MOVES' : 'TIME';
  const subline = isMovesMode ? 'LEFT' : 'REMAINING';

  useEffect(() => {
    valueScale.setValue(0.85);
    Animated.spring(valueScale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [displayValue, valueScale]);

  useEffect(() => {
    if (!isUrgent) {
      pulseAnim.setValue(1);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [isUrgent, pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: isUrgent ? pulseAnim : 1 }] }}>
      <LinearGradient
        colors={isUrgent ? ['#57182C', '#330D1B'] : ['#361B4D', '#201036']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.container,
          isUrgent && { borderColor: 'rgba(255, 77, 109, 0.45)' },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accent}25` }]}>
          <MaterialCommunityIcons
            name={isUrgent ? 'alert-decagram' : isMovesMode ? 'gesture-tap' : 'timer-sand'}
            size={18}
            color={accent}
          />
        </View>

        <Text style={styles.label}>{label}</Text>

        <Animated.Text
          testID="moves-card"
          accessibilityLabel={`${label} ${subline}: ${displayValue}`}
          style={[
            styles.valueText,
            {
              color: accent,
              transform: [{ scale: valueScale }],
            },
          ]}
        >
          {displayValue}
        </Animated.Text>

        <Text style={styles.subline}>{subline}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    color: '#9AA7C5',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 1,
  },
  subline: {
    color: '#9AA7C5',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
