import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { soundManager } from './src/audio/soundManager';
import {
  BOARD_SIZE,
  MAX_MOVES,
  SCORE_TARGET,
  THEMES,
  type GameMode,
  type Position,
  type ThemeMode,
  type TileType,
} from './src/game/constants';
import {
  findValidSwap,
  isAdjacent,
  positionKey,
  resolveSwap,
} from './src/game/engine';
import {
  createInitialState,
  gameReducer,
} from './src/state/gameReducer';

import { ComboCalloutBanner } from './src/components/ComboCalloutBanner';
import { FloatingScoreBadge } from './src/components/FloatingScoreBadge';
import { GameOverOverlay } from './src/components/GameOverOverlay';
import { Header } from './src/components/Header';
import { HowToPlayModal } from './src/components/HowToPlayModal';
import { MatchSpark } from './src/components/MatchSpark';
import { MovesHud } from './src/components/MovesHud';
import { ScoreHud } from './src/components/ScoreHud';
import { Tile } from './src/components/Tile';

const BOARD_GAP = 6;
const BOARD_PADDING = 10;
const GRID_CELLS = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => ({
  row: Math.floor(i / BOARD_SIZE),
  column: i % BOARD_SIZE,
}));

interface MatchFx {
  key: string;
  positions: Position[];
}

interface ActiveSwapAnimation {
  from: Position;
  to: Position;
  offsetFrom: { x: number; y: number };
  offsetTo: { x: number; y: number };
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 640;
  const verticalChrome = isDesktop ? 290 : 260;
  const maxFromHeight = Math.max(260, height - verticalChrome);
  const maxFromWidth = Math.min(width - 32, 540);
  const boardSize = Math.max(260, Math.min(maxFromWidth, maxFromHeight, 490));
  const cellSize = Math.floor((boardSize - BOARD_PADDING * 2 - BOARD_GAP * (BOARD_SIZE - 1)) / BOARD_SIZE);

  const initialBestScore = typeof window !== 'undefined' && window.localStorage
    ? parseInt(window.localStorage.getItem('nexus_best_score') || '0', 10) || 0
    : 0;

  const [state, dispatch] = useReducer(gameReducer, initialBestScore, createInitialState);
  const [matchFx, setMatchFx] = useState<MatchFx | null>(null);
  const [activeSwap, setActiveSwap] = useState<ActiveSwapAnimation | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isIdleHintActive, setIsIdleHintActive] = useState(false);

  const boardEntrance = useRef(new Animated.Value(1)).current;
  const boardShake = useRef(new Animated.Value(0)).current;
  const theme = THEMES[state.theme] ?? THEMES.cyber;

  const progress = Math.min(state.score / SCORE_TARGET, 1);
  const movesLeft = Math.max(0, MAX_MOVES - state.moves);
  const isGameOver = state.status !== 'playing';

  const hintSwap = isIdleHintActive && !state.selected && !isBusy
    ? findValidSwap(state.board)
    : null;

  useEffect(() => {
    if (state.bestScore > 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('nexus_best_score', String(state.bestScore));
      } catch {}
    }
  }, [state.bestScore]);

  useEffect(() => {
    if (state.mode !== 'blitz' || state.status !== 'playing') return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_BLITZ_TIMER' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.mode, state.status]);

  useEffect(() => {
    setIsIdleHintActive(false);
    if (state.status !== 'playing' || isBusy) return;

    const idleTimer = setTimeout(() => {
      setIsIdleHintActive(true);
    }, 3200);

    return () => clearTimeout(idleTimer);
  }, [isBusy, state.board, state.selected, state.status]);

  useEffect(() => {
    if (!state.lastMove) return;
    boardEntrance.setValue(0.97);
    Animated.spring(boardEntrance, {
      toValue: 1,
      friction: 7,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [boardEntrance, state.lastMove]);

  useEffect(() => {
    if (!state.boardShuffleNotice) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_SHUFFLE_NOTICE' });
    }, 2400);
    return () => clearTimeout(timer);
  }, [state.boardShuffleNotice]);

  // Animate the physical slide transition before committing the engine result
  const executeSwap = (first: Position, second: Position) => {
    if (isBusy || state.status !== 'playing') return;

    if (!isAdjacent(first, second)) {
      soundManager.playTap();
      dispatch({ type: 'SELECT_TILE', position: second });
      return;
    }

    setIsBusy(true);
    setIsIdleHintActive(false);
    soundManager.playSwap();
    soundManager.triggerHaptic('light');

    const deltaX = (second.column - first.column) * (cellSize + BOARD_GAP);
    const deltaY = (second.row - first.row) * (cellSize + BOARD_GAP);

    setActiveSwap({
      from: first,
      to: second,
      offsetFrom: { x: deltaX, y: deltaY },
      offsetTo: { x: -deltaX, y: -deltaY },
    });

    const result = resolveSwap(state.board, first, second);

    if (!result.valid) {
      setTimeout(() => {
        soundManager.playInvalid();
        soundManager.triggerHaptic('warning');
        dispatch({ type: 'INVALID_SWAP', position: second });
        setActiveSwap(null);
        setTimeout(() => setIsBusy(false), 240);
      }, 160);
      return;
    }

    setTimeout(() => {
      setActiveSwap(null);
      setMatchFx({
        key: `${state.moves}-${Date.now()}`,
        positions: result.clearedPositions,
      });

      soundManager.playMatch(result.chain);
      if (result.chain >= 2) {
        soundManager.playImpact();
        const shakeMagnitude = Math.min(result.chain * 2.5, 8);
        Animated.sequence([
          Animated.timing(boardShake, { toValue: -shakeMagnitude, duration: 40, useNativeDriver: true }),
          Animated.timing(boardShake, { toValue: shakeMagnitude, duration: 40, useNativeDriver: true }),
          Animated.timing(boardShake, { toValue: -shakeMagnitude / 2, duration: 40, useNativeDriver: true }),
          Animated.timing(boardShake, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
      }

      soundManager.triggerHaptic(result.chain > 1 ? 'medium' : 'light');
      dispatch({ type: 'PLAY_MOVE', result });

      setTimeout(() => {
        setMatchFx(null);
        setIsBusy(false);
      }, 340);
    }, 160);
  };

  const handleTilePress = (position: Position) => {
    if (isBusy || state.status !== 'playing') return;

    if (!state.selected) {
      soundManager.playTap();
      dispatch({ type: 'SELECT_TILE', position });
      return;
    }

    if (positionKey(state.selected) === positionKey(position)) {
      soundManager.playTap();
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    executeSwap(state.selected, position);
  };

  const handleTileSwipe = (from: Position, to: Position) => {
    executeSwap(from, to);
  };

  const handleToggleMode = () => {
    soundManager.playTap();
    const nextMode: GameMode = state.mode === 'moves' ? 'blitz' : 'moves';
    dispatch({ type: 'SET_GAME_MODE', mode: nextMode });
  };

  const handleToggleTheme = () => {
    soundManager.playTap();
    const nextTheme: ThemeMode = state.theme === 'cyber' ? 'solar' : 'cyber';
    dispatch({ type: 'SET_THEME', theme: nextTheme });
  };

  const handleToggleSound = () => {
    soundManager.toggleMute();
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  const handleManualShuffle = () => {
    if (isBusy || state.status !== 'playing') return;
    soundManager.playTap();
    dispatch({ type: 'CHECK_BOARD_STALL' });
  };

  const restart = () => {
    soundManager.playTap();
    setMatchFx(null);
    setActiveSwap(null);
    setIsBusy(false);
    dispatch({ type: 'RESTART' });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background[0] }]}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFillObject} />

      {/* Atmospheric Ambient Glow Orbs */}
      <View style={[styles.glowOrbOne, { backgroundColor: theme.glowA }]} />
      <View style={[styles.glowOrbTwo, { backgroundColor: theme.glowB }]} />

      {/* Main Container - Responsive Frame for Desktop & Mobile */}
      <View style={[styles.content, isDesktop && styles.desktopCabinet]}>
        {/* Header with Title, Game Modes, Themes, Audio and Help */}
        <Header
          mode={state.mode}
          theme={state.theme}
          isMuted={state.isMuted}
          onToggleMode={handleToggleMode}
          onToggleTheme={handleToggleTheme}
          onToggleSound={handleToggleSound}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          accentColor={theme.accentMint}
        />

        {/* HUD with Live Score, Milestone Progress & Moves/Timer */}
        <View style={styles.hudRow}>
          <ScoreHud
            score={state.score}
            bestScore={state.bestScore}
            progress={progress}
            accentColor={theme.accentMint}
          />
          <MovesHud
            mode={state.mode}
            movesLeft={movesLeft}
            secondsLeft={state.secondsLeft}
          />
        </View>

        {/* Sleek Dynamic Interaction Ribbon */}
        <View
          style={styles.actionRibbon}
          accessibilityLabel={
            state.selected
              ? 'Tile selected. Tap an adjacent neighbor to swap.'
              : isIdleHintActive
              ? 'Hint available. Look for the gently pulsing tiles.'
              : 'Tap or swipe adjacent tiles horizontally or vertically to match three or more.'
          }
        >
          <View
            style={[
              styles.ribbonIconCircle,
              {
                backgroundColor: state.selected
                  ? `${theme.accentMint}28`
                  : isIdleHintActive
                  ? 'rgba(255, 209, 102, 0.22)'
                  : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                state.selected
                  ? 'gesture-tap'
                  : isIdleHintActive
                  ? 'lightbulb-on'
                  : 'gesture-swipe'
              }
              size={17}
              color={
                state.selected
                  ? theme.accentMint
                  : isIdleHintActive
                  ? '#FFD166'
                  : '#9AA7C5'
              }
            />
          </View>

          <View style={styles.ribbonContent}>
            <Text style={styles.ribbonKicker}>
              {state.selected
                ? 'CANDY SELECTED'
                : isIdleHintActive
                ? 'HINT AVAILABLE'
                : 'MAKE A CHAIN'}
            </Text>
            <Text style={styles.ribbonPrompt}>
              {state.selected
                ? 'Now tap a touching neighbor to swap'
                : isIdleHintActive
                ? 'Psst... try swapping the glowing pair!'
                : `Match 3 candies · Reach ${SCORE_TARGET.toLocaleString()} pts!`}
            </Text>
          </View>

          <View
            style={[
              styles.ribbonBadge,
              {
                borderColor: state.selected
                  ? theme.accentMint
                  : isIdleHintActive
                  ? '#FFD166'
                  : 'rgba(255, 255, 255, 0.14)',
              },
            ]}
          >
            <Text
              style={[
                styles.ribbonBadgeText,
                {
                  color: state.selected
                    ? theme.accentMint
                    : isIdleHintActive
                    ? '#FFD166'
                    : '#9AA7C5',
                },
              ]}
            >
              {state.selected ? 'SWAP' : isIdleHintActive ? 'HINT' : 'MATCH 3+'}
            </Text>
          </View>
        </View>

        {/* Game Board Shell with Dynamic Screen Shake */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#F59E0B']}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.95, y: 0.95 }}
          style={styles.boardShell}
        >
          <Animated.View
            style={[
              styles.board,
              {
                width: boardSize,
                height: boardSize,
                transform: [
                  { scale: boardEntrance },
                  { translateX: boardShake },
                ],
              },
            ]}
          >
            {/* Recessed Grid Socket Wells (Tactile physical depth underneath tiles) */}
            {GRID_CELLS.map((cell) => {
              const left = BOARD_PADDING + cell.column * (cellSize + BOARD_GAP);
              const top = BOARD_PADDING + cell.row * (cellSize + BOARD_GAP);
              return (
                <View
                  key={`socket-${cell.row}-${cell.column}`}
                  style={[
                    styles.cellSocket,
                    {
                      left,
                      top,
                      width: cellSize,
                      height: cellSize,
                    },
                  ]}
                >
                  <View style={styles.cellSocketRim} />
                </View>
              );
            })}
            {state.board.map((row, rowIndex) =>
              row.map((tile, columnIndex) => {
                const isSelected =
                  Boolean(state.selected) &&
                  state.selected?.row === rowIndex &&
                  state.selected.column === columnIndex;

                const isHinted = Boolean(
                  hintSwap &&
                    ((hintSwap.first.row === rowIndex && hintSwap.first.column === columnIndex) ||
                      (hintSwap.second.row === rowIndex && hintSwap.second.column === columnIndex)),
                );

                const isInvalid = Boolean(
                  state.invalidPosition &&
                    state.invalidPosition?.row === rowIndex &&
                    state.invalidPosition.column === columnIndex,
                );

                let swapOffset: { x: number; y: number } | null = null;
                if (activeSwap) {
                  if (activeSwap.from.row === rowIndex && activeSwap.from.column === columnIndex) {
                    swapOffset = activeSwap.offsetFrom;
                  } else if (activeSwap.to.row === rowIndex && activeSwap.to.column === columnIndex) {
                    swapOffset = activeSwap.offsetTo;
                  }
                }

                return (
                  <Tile
                    key={`${rowIndex}-${columnIndex}`}
                    tile={(tile ?? 0) as TileType}
                    position={{ row: rowIndex, column: columnIndex }}
                    selected={isSelected}
                    hinted={isHinted}
                    invalid={isInvalid}
                    swapOffset={swapOffset}
                    cellSize={cellSize}
                    boardPadding={BOARD_PADDING}
                    boardGap={BOARD_GAP}
                    onPress={handleTilePress}
                    onSwipe={handleTileSwipe}
                  />
                );
              }),
            )}

            {/* Match Sparks with radial particles */}
            {matchFx?.positions.map((position) => (
              <MatchSpark
                key={`${matchFx.key}-${positionKey(position)}`}
                position={position}
                cellSize={cellSize}
                boardPadding={BOARD_PADDING}
                boardGap={BOARD_GAP}
                glowColor={theme.accentMint}
              />
            ))}

            {/* Floating Score Badges */}
            {state.floatingScores.map((scoreItem) => (
              <FloatingScoreBadge
                key={scoreItem.id}
                id={scoreItem.id}
                text={scoreItem.text}
                position={scoreItem.position}
                cellSize={cellSize}
                boardPadding={BOARD_PADDING}
                boardGap={BOARD_GAP}
                onDismiss={(id) => dispatch({ type: 'DISMISS_FLOATING_SCORE', id })}
              />
            ))}
          </Animated.View>
        </LinearGradient>

        {/* Cascade Multiplier Combo Callout */}
        {state.comboCallout && (
          <ComboCalloutBanner
            callout={state.comboCallout}
            onComplete={() => dispatch({ type: 'CLEAR_COMBO_CALLOUT' })}
          />
        )}

        {/* Board Stall Reshuffle Notice */}
        {state.boardShuffleNotice && (
          <View style={styles.shuffleNoticePill}>
            <MaterialCommunityIcons name="shuffle-variant" size={16} color="#FFD166" />
            <Text style={styles.shuffleNoticeText}>No moves left — Shuffling board! ✨</Text>
          </View>
        )}

        {/* Footer Status Pill & Best Chain indicator */}
        <View style={styles.footerRow}>
          <View
            style={[
              styles.statusPill,
              state.lastMove?.score
                ? styles.statusSuccess
                : state.invalidPosition
                ? styles.statusError
                : styles.statusNeutral,
            ]}
          >
            <MaterialCommunityIcons
              name={
                state.lastMove?.score
                  ? 'check-circle-outline'
                  : state.invalidPosition
                  ? 'close-circle-outline'
                  : 'gesture-tap'
              }
              size={13}
              color={
                state.lastMove?.score
                  ? theme.accentMint
                  : state.invalidPosition
                  ? theme.accentCoral
                  : theme.muted
              }
            />
            <Text
              testID="status-message"
              accessibilityLiveRegion="polite"
              style={styles.statusText}
            >
              {state.lastMove?.message ?? 'Swap 2 touching candies to match 3!'}
            </Text>
          </View>

          <View style={styles.footerRightGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shuffle board"
              onPress={handleManualShuffle}
              style={({ pressed }) => [styles.shuffleBtn, pressed && styles.shuffleBtnPressed]}
            >
              <MaterialCommunityIcons name="shuffle" size={14} color="#9AA7C5" />
            </Pressable>
            <Text style={styles.footerHint}>BEST CHAIN ×{state.bestChain || 1}</Text>
          </View>
        </View>
      </View>

      {/* Game Over Modal Screen */}
      {isGameOver && <GameOverOverlay state={state} onRestart={restart} />}

      {/* How To Play Modal */}
      <HowToPlayModal
        visible={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 580,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 24 : 6,
    paddingBottom: 8,
  },
  desktopCabinet: {
    maxHeight: '98%',
    backgroundColor: 'rgba(10, 16, 34, 0.45)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(179, 199, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    elevation: 16,
    marginVertical: 'auto',
  },
  glowOrbOne: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 480,
    opacity: 0.18,
    top: -220,
    right: -180,
  },
  glowOrbTwo: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 440,
    opacity: 0.16,
    bottom: -180,
    left: -160,
  },
  hudRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 6,
  },
  actionRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    gap: 8,
    marginBottom: 6,
  },
  ribbonIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonContent: {
    flex: 1,
  },
  ribbonKicker: {
    color: '#9AA7C5',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ribbonPrompt: {
    color: '#F4F7FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 0.5,
  },
  ribbonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
  },
  ribbonBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  boardShell: {
    padding: 3,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  board: {
    borderRadius: 23,
    backgroundColor: '#070D1F',
    overflow: 'hidden',
    position: 'relative',
  },
  cellSocket: {
    position: 'absolute',
    borderRadius: 14,
    backgroundColor: 'rgba(4, 9, 22, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.045)',
    overflow: 'hidden',
  },
  cellSocketRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  shuffleNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 209, 102, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
  },
  shuffleNoticeText: {
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    maxWidth: '70%',
  },
  statusSuccess: {
    backgroundColor: 'rgba(98, 242, 198, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(98, 242, 198, 0.3)',
  },
  statusError: {
    backgroundColor: 'rgba(255, 123, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 135, 0.3)',
  },
  statusNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    color: '#F4F7FF',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shuffleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 6,
    borderRadius: 10,
  },
  shuffleBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  footerHint: {
    color: '#9AA7C5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
