import {
  BLITZ_TIME_LIMIT_SECONDS,
  MAX_MOVES,
  SCORE_TARGET,
  type Board,
  type GameMode,
  type Position,
  type ThemeMode,
} from '../game/constants';
import {
  createInitialBoard,
  findAllValidSwaps,
  reshuffleBoard,
  type SwapResult,
} from '../game/engine';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface FloatingScore {
  id: string;
  text: string;
  position: Position;
}

export interface ComboCallout {
  text: string;
  chain: number;
  timestamp: number;
}

export interface GameState {
  board: Board;
  score: number;
  bestScore: number;
  bestChain: number;
  moves: number;
  status: GameStatus;
  selected: Position | null;
  invalidPosition: Position | null;
  lastMove: { message: string; score: number } | null;
  mode: GameMode;
  secondsLeft: number;
  theme: ThemeMode;
  isMuted: boolean;
  floatingScores: FloatingScore[];
  comboCallout: ComboCallout | null;
  animatingSwap: { from: Position; to: Position; isRevert?: boolean } | null;
  boardShuffleNotice: boolean;
}

export type GameAction =
  | { type: 'SELECT_TILE'; position: Position }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'START_SWAP_ANIMATION'; from: Position; to: Position; isRevert?: boolean }
  | { type: 'FINISH_SWAP_ANIMATION' }
  | { type: 'INVALID_SWAP'; position: Position }
  | { type: 'PLAY_MOVE'; result: SwapResult }
  | { type: 'TICK_BLITZ_TIMER' }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'SET_THEME'; theme: ThemeMode }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'DISMISS_FLOATING_SCORE'; id: string }
  | { type: 'CLEAR_COMBO_CALLOUT' }
  | { type: 'CHECK_BOARD_STALL' }
  | { type: 'CLEAR_SHUFFLE_NOTICE' }
  | { type: 'RESTART' };

const COMBO_TITLES: Record<number, string> = {
  2: 'SWEET COMBO!',
  3: 'SUPER CASCADE!',
  4: 'DELICIOUS!',
  5: 'SPECTACULAR!',
  6: 'INCREDIBLE CRUSH!',
};

export function createInitialState(savedBestScore: number = 0, defaultTheme: ThemeMode = 'cyber'): GameState {
  return {
    board: createInitialBoard(),
    score: 0,
    bestScore: savedBestScore,
    bestChain: 0,
    moves: 0,
    status: 'playing',
    selected: null,
    invalidPosition: null,
    lastMove: null,
    mode: 'moves',
    secondsLeft: BLITZ_TIME_LIMIT_SECONDS,
    theme: defaultTheme,
    isMuted: false,
    floatingScores: [],
    comboCallout: null,
    animatingSwap: null,
    boardShuffleNotice: false,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_TILE':
      return {
        ...state,
        selected: action.position,
        invalidPosition: null,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selected: null,
        invalidPosition: null,
      };

    case 'START_SWAP_ANIMATION':
      return {
        ...state,
        animatingSwap: {
          from: action.from,
          to: action.to,
          isRevert: action.isRevert,
        },
      };

    case 'FINISH_SWAP_ANIMATION':
      return {
        ...state,
        animatingSwap: null,
      };

    case 'INVALID_SWAP':
      return {
        ...state,
        selected: null,
        invalidPosition: action.position,
        animatingSwap: null,
        lastMove: { message: 'No chain there — try another swap', score: 0 },
      };

    case 'PLAY_MOVE': {
      const nextScore = state.score + action.result.score;
      const nextMoves = state.moves + 1;

      let nextStatus: GameStatus = state.status;
      if (state.mode === 'moves') {
        if (nextScore >= SCORE_TARGET) {
          nextStatus = 'won';
        } else if (nextMoves >= MAX_MOVES) {
          nextStatus = 'lost';
        }
      } else if (state.mode === 'blitz') {
        if (nextScore >= SCORE_TARGET) {
          nextStatus = 'won';
        }
      }

      const chainMessage =
        action.result.chain > 1
          ? `Cascade ×${action.result.chain} · +${action.result.score}`
          : `Chain cleared · +${action.result.score}`;

      const newFloatingScores: FloatingScore[] = [];
      if (action.result.clearedPositions.length > 0) {
        const centerPos = action.result.clearedPositions[0]!;
        newFloatingScores.push({
          id: `${Date.now()}-${Math.random()}`,
          text: `+${action.result.score}`,
          position: centerPos,
        });
      }

      let comboCallout: ComboCallout | null = state.comboCallout;
      if (action.result.chain >= 2) {
        const title = COMBO_TITLES[action.result.chain] ?? `CASCADE ×${action.result.chain}!`;
        comboCallout = {
          text: title,
          chain: action.result.chain,
          timestamp: Date.now(),
        };
      }

      // Reshuffle if the board settled into a state with no playable swaps
      const validSwaps = findAllValidSwaps(action.result.board);
      let boardToUse = action.result.board;
      let shouldShuffle = false;

      if (validSwaps.length === 0 && nextStatus === 'playing') {
        boardToUse = reshuffleBoard(action.result.board);
        shouldShuffle = true;
      }

      return {
        ...state,
        board: boardToUse,
        score: nextScore,
        bestScore: Math.max(state.bestScore, nextScore),
        bestChain: Math.max(state.bestChain, action.result.chain),
        moves: nextMoves,
        status: nextStatus,
        selected: null,
        invalidPosition: null,
        animatingSwap: null,
        lastMove: { message: chainMessage, score: action.result.score },
        floatingScores: [...state.floatingScores, ...newFloatingScores],
        comboCallout,
        boardShuffleNotice: shouldShuffle,
      };
    }

    case 'TICK_BLITZ_TIMER': {
      if (state.mode !== 'blitz' || state.status !== 'playing') {
        return state;
      }
      const nextSeconds = Math.max(0, state.secondsLeft - 1);
      const isTimeUp = nextSeconds === 0;
      const nextStatus: GameStatus = isTimeUp
        ? state.score >= SCORE_TARGET
          ? 'won'
          : 'lost'
        : state.status;

      return {
        ...state,
        secondsLeft: nextSeconds,
        status: nextStatus,
      };
    }

    case 'SET_GAME_MODE':
      return {
        ...createInitialState(state.bestScore, state.theme),
        mode: action.mode,
        isMuted: state.isMuted,
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.theme,
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        isMuted: !state.isMuted,
      };

    case 'DISMISS_FLOATING_SCORE':
      return {
        ...state,
        floatingScores: state.floatingScores.filter((f) => f.id !== action.id),
      };

    case 'CLEAR_COMBO_CALLOUT':
      return {
        ...state,
        comboCallout: null,
      };

    case 'CHECK_BOARD_STALL': {
      const validSwaps = findAllValidSwaps(state.board);
      if (validSwaps.length === 0 && state.status === 'playing') {
        return {
          ...state,
          board: reshuffleBoard(state.board),
          boardShuffleNotice: true,
        };
      }
      return state;
    }

    case 'CLEAR_SHUFFLE_NOTICE':
      return {
        ...state,
        boardShuffleNotice: false,
      };

    case 'RESTART':
      return {
        ...createInitialState(state.bestScore, state.theme),
        mode: state.mode,
        isMuted: state.isMuted,
        bestScore: state.bestScore,
        bestChain: state.bestChain,
      };

    default:
      return state;
  }
}
