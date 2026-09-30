import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComboCallout } from '../state/gameReducer';

interface ComboCalloutBannerProps {
  callout: ComboCallout;
  onComplete: () => void;
}

export function ComboCalloutBanner({ callout, onComplete }: ComboCalloutBannerProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [callout.timestamp, onComplete, opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlayContainer,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 123, 135, 0.95)', 'rgba(182, 162, 255, 0.95)', 'rgba(98, 242, 198, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientPill}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#0B1020" />
        <Text style={styles.calloutText}>{callout.text}</Text>
        <View style={styles.multiplierBadge}>
          <Text style={styles.multiplierText}>×{callout.chain}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: '44%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  gradientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#62F2C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 10,
  },
  calloutText: {
    color: '#0B1020',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  multiplierBadge: {
    backgroundColor: '#0B1020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  multiplierText: {
    color: '#FFD166',
    fontSize: 14,
    fontWeight: '900',
  },
});
