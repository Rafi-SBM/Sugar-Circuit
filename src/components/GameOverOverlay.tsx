import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../audio/soundManager';
import { type GameState } from '../state/gameReducer';
import { ConfettiCannon } from './ConfettiCannon';

interface GameOverOverlayProps {
  state: GameState;
  onRestart: () => void;
}

export function GameOverOverlay({ state, onRestart }: GameOverOverlayProps) {
  const didWin = state.status === 'won';

  useEffect(() => {
    if (didWin) {
      soundManager.playWin();
      soundManager.triggerHaptic('success');
    } else {
      soundManager.playGameOver();
      soundManager.triggerHaptic('warning');
    }
  }, [didWin]);

  return (
    <View style={styles.overlayBackdrop}>
      {didWin && <ConfettiCannon />}

      <View style={styles.card}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: didWin ? 'rgba(98, 242, 198, 0.18)' : 'rgba(255, 123, 135, 0.18)' },
          ]}
        >
          <MaterialCommunityIcons
            name={didWin ? 'trophy-award' : 'flag-checkered'}
            size={40}
            color={didWin ? '#62F2C6' : '#FF7B87'}
          />
        </View>

        {/* 3 Stars Trophy Row on Win */}
        {didWin && (
          <View style={styles.starsTrophyRow}>
            <MaterialCommunityIcons name="star" size={26} color="#FFD166" />
            <MaterialCommunityIcons name="star" size={32} color="#FFD166" />
            <MaterialCommunityIcons name="star" size={26} color="#FFD166" />
          </View>
        )}

        <Text style={[styles.kicker, { color: didWin ? '#34D399' : '#FB7185' }]}>
          {didWin ? 'LEVEL COMPLETED!' : 'OUT OF MOVES'}
        </Text>

        <Text style={styles.title}>
          {didWin ? 'Sweet Victory!' : 'So Close!'}
        </Text>

        <Text style={styles.description}>
          {didWin
            ? 'Awesome job! You crushed the 2,500 point target with moves to spare!'
            : 'You were so close to clearing the board. Take another shot!'}
        </Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text testID="final-score" style={styles.scoreValue}>
            {state.score.toLocaleString()}
          </Text>
          {state.score >= state.bestScore && state.score > 0 && (
            <View style={styles.newRecordPill}>
              <MaterialCommunityIcons name="crown" size={13} color="#FBBF24" />
              <Text style={styles.newRecordText}>NEW PERSONAL BEST!</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>BEST CASCADE</Text>
            <Text style={styles.statVal}>×{state.bestChain || 1}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MOVES PLAYED</Text>
            <Text style={styles.statVal}>{state.moves}</Text>
          </View>
        </View>

        <Pressable
          testID="restart-button"
          accessibilityRole="button"
          accessibilityLabel={didWin ? 'Play next game' : 'Try again'}
          onPress={onRestart}
          style={({ pressed }) => [
            styles.restartButton,
            { backgroundColor: didWin ? '#10B981' : '#F59E0B' },
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.restartButtonText}>
            {didWin ? 'PLAY AGAIN' : 'TRY AGAIN'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 9, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#121A33',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(179, 199, 255, 0.22)',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 26,
    elevation: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starsTrophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#F4F7FF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#9AA7C5',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    color: '#9AA7C5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#62F2C6',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  newRecordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 209, 102, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  newRecordText: {
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    color: '#9AA7C5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statVal: {
    color: '#F4F7FF',
    fontSize: 18,
    fontWeight: '800',
  },
  restartButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#62F2C6',
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: '#62F2C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
