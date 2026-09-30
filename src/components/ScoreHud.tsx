import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SCORE_TARGET } from '../game/constants';

interface ScoreHudProps {
  score: number;
  bestScore: number;
  progress: number;
  accentColor?: string;
}

const STAR_MILESTONES = [
  { threshold: 1000, label: '★' },
  { threshold: 1800, label: '★★' },
  { threshold: SCORE_TARGET, label: '★★★' },
];

export function ScoreHud({ score, bestScore, progress, accentColor = '#62F2C6' }: ScoreHudProps) {
  const valueScale = useRef(new Animated.Value(1)).current;
  const starBounce = useRef(new Animated.Value(1)).current;

  const currentStars = score >= SCORE_TARGET ? 3 : score >= 1800 ? 2 : score >= 1000 ? 1 : 0;

  useEffect(() => {
    valueScale.setValue(0.85);
    Animated.spring(valueScale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [score, valueScale]);

  useEffect(() => {
    if (currentStars > 0) {
      starBounce.setValue(1.3);
      Animated.spring(starBounce, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStars, starBounce]);

  return (
    <LinearGradient
      colors={['#2D164D', '#1D0E38', '#140A28']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="trophy" size={14} color="#FBBF24" />
          <Text style={styles.hudLabel}>SCORE</Text>
        </View>
        <View style={styles.bestPillWrap}>
          <MaterialCommunityIcons name="crown" size={11} color="#FBBF24" />
          <Text
            testID="best-card"
            accessibilityLabel={`BEST: ${bestScore}`}
            style={styles.bestPill}
          >
            BEST {bestScore.toLocaleString()}
          </Text>
        </View>
      </View>

      <Animated.Text
        testID="score-card"
        accessibilityLabel={`SCORE: ${score}`}
        style={[styles.scoreValue, { transform: [{ scale: valueScale }] }]}
      >
        {score.toLocaleString()}
      </Animated.Text>

      <View style={styles.bottomRow}>
        <View style={styles.starsRow}>
          {STAR_MILESTONES.map((milestone, idx) => {
            const isEarned = score >= milestone.threshold;
            return (
              <Animated.View
                key={idx}
                style={[
                  styles.starItem,
                  isEarned && { transform: [{ scale: starBounce }] },
                ]}
              >
                <MaterialCommunityIcons
                  name={isEarned ? 'star' : 'star-outline'}
                  size={14}
                  color={isEarned ? '#FFD166' : 'rgba(255, 255, 255, 0.22)'}
                />
              </Animated.View>
            );
          })}
          <Text style={styles.targetLabel}>TARGET: {SCORE_TARGET.toLocaleString()}</Text>
        </View>
        <Text style={[styles.percentText, { color: accentColor }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* Progress Track with Milestone Tick Notches */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(progress * 100, 3)}%`,
              backgroundColor: accentColor,
            },
          ]}
        />
        {/* Star 1 Tick */}
        <View style={[styles.tickMark, { left: `${(1000 / SCORE_TARGET) * 100}%` }]} />
        {/* Star 2 Tick */}
        <View style={[styles.tickMark, { left: `${(1800 / SCORE_TARGET) * 100}%` }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 160,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    shadowColor: '#62F2C6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  hudLabel: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  bestPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  bestPill: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  scoreValue: {
    color: '#F4F7FF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginVertical: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetLabel: {
    color: '#9AA7C5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    position: 'relative',
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
