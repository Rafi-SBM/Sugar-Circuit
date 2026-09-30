import {
  BOARD_SIZE,
  MAX_MOVES,
  SCORE_PER_MATCHED_TILE,
  SCORE_TARGET,
  type Board,
} from '../src/game/constants';
import {
  applyGravity,
  createInitialBoard,
  findAllValidSwaps,
  findMatches,
  findValidSwap,
  isAdjacent,
  reshuffleBoard,
  resolveSwap,
  scoreForMatch,
  swapTiles,
} from '../src/game/engine';
import {
  createInitialState,
  gameReducer,
  type GameState,
} from '../src/state/gameReducer';

const fixedRandom = () => 0;

describe('Match-3 Pure Game Engine', () => {
  describe('Board Initialization & Invariants', () => {
    it('creates an 8x8 board with valid tile types', () => {
      const board = createInitialBoard(fixedRandom);
      expect(board).toHaveLength(BOARD_SIZE);
      expect(board.every((row) => row.length === BOARD_SIZE)).toBe(true);
      for (const row of board) {
        for (const cell of row) {
          expect(cell).toBeGreaterThanOrEqual(0);
          expect(cell).toBeLessThanOrEqual(5);
        }
      }
    });

    it('creates a board with zero pre-existing matches (OPT-001)', () => {
      const board = createInitialBoard(fixedRandom);
      expect(findMatches(board)).toEqual([]);
    });

    it('guarantees at least one playable swap on board initialization', () => {
      const board = createInitialBoard(fixedRandom);
      const validSwap = findValidSwap(board);
      expect(validSwap).not.toBeNull();
      expect(isAdjacent(validSwap!.first, validSwap!.second)).toBe(true);
    });
  });

  describe('Adjacency Rules (AC-03)', () => {
    it('allows only orthogonal adjacent swaps', () => {
      expect(isAdjacent({ row: 0, column: 0 }, { row: 0, column: 1 })).toBe(true);
      expect(isAdjacent({ row: 0, column: 0 }, { row: 1, column: 0 })).toBe(true);
      expect(isAdjacent({ row: 2, column: 3 }, { row: 2, column: 2 })).toBe(true);
      expect(isAdjacent({ row: 2, column: 3 }, { row: 1, column: 3 })).toBe(true);
    });

    it('rejects diagonal, distant, and identical coordinates', () => {
      // Diagonals
      expect(isAdjacent({ row: 0, column: 0 }, { row: 1, column: 1 })).toBe(false);
      expect(isAdjacent({ row: 3, column: 3 }, { row: 4, column: 2 })).toBe(false);

      // Distance > 1
      expect(isAdjacent({ row: 0, column: 0 }, { row: 0, column: 2 })).toBe(false);
      expect(isAdjacent({ row: 0, column: 0 }, { row: 3, column: 0 })).toBe(false);

      // Same position
      expect(isAdjacent({ row: 1, column: 1 }, { row: 1, column: 1 })).toBe(false);
    });
  });

  describe('Match Detection (AC-04)', () => {
    it('identifies horizontal runs of 3 or more', () => {
      const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 1));
      // Give different colors except row 2 cols 1..3
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          board[r]![c] = ((r * 2 + c) % 5) as any;
        }
      }
      board[2]![1] = 0;
      board[2]![2] = 0;
      board[2]![3] = 0;

      const matches = findMatches(board);
      const matchPositions = matches.map((p) => `${p.row},${p.column}`);
      expect(matchPositions).toContain('2,1');
      expect(matchPositions).toContain('2,2');
      expect(matchPositions).toContain('2,3');
    });

    it('identifies vertical runs of 3 or more', () => {
      const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 1));
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          board[r]![c] = ((r * 3 + c) % 5) as any;
        }
      }
      board[4]![5] = 2;
      board[5]![5] = 2;
      board[6]![5] = 2;

      const matches = findMatches(board);
      const matchPositions = matches.map((p) => `${p.row},${p.column}`);
      expect(matchPositions).toContain('4,5');
      expect(matchPositions).toContain('5,5');
      expect(matchPositions).toContain('6,5');
    });

    it('deduplicates intersections like T or L shapes', () => {
      const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 1));
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          board[r]![c] = ((r * 2 + c) % 5) as any;
        }
      }
      // Horizontal at row 3 cols 2,3,4
      board[3]![2] = 4;
      board[3]![3] = 4;
      board[3]![4] = 4;
      // Vertical at col 3 rows 2,3,4 (cross intersection at 3,3)
      board[2]![3] = 4;
      board[4]![3] = 4;

      const matches = findMatches(board);
      // 5 distinct cells total (3 horizontal + 2 vertical, intersection counted once)
      const matchedAtT = matches.filter(
        (p) => (p.row === 3 && [2, 3, 4].includes(p.column)) || (p.column === 3 && [2, 3, 4].includes(p.row)),
      );
      expect(matchedAtT).toHaveLength(5);
    });
  });

  describe('Swap Resolution & Reversion (AC-03, AC-05, AC-06)', () => {
    it('immutably swaps tiles', () => {
      const board = createInitialBoard(fixedRandom);
      const swapped = swapTiles(board, { row: 0, column: 0 }, { row: 0, column: 1 });
      expect(swapped).not.toBe(board);
      expect(swapped[0]).not.toBe(board[0]);
      expect(swapped[0]![0]).toBe(board[0]![1]);
      expect(swapped[0]![1]).toBe(board[0]![0]);
    });

    it('reverts invalid swaps that create no matches', () => {
      const board = createInitialBoard(() => 0.1);
      const result = resolveSwap(board, { row: 0, column: 0 }, { row: 0, column: 1 }, fixedRandom);
      expect(result.valid).toBe(false);
      expect(result.board).toEqual(board);
      expect(result.score).toBe(0);
      expect(result.clearedPositions).toEqual([]);
    });

    it('rejects non-adjacent swap attempts immediately', () => {
      const board = createInitialBoard(fixedRandom);
      const result = resolveSwap(board, { row: 0, column: 0 }, { row: 2, column: 0 }, fixedRandom);
      expect(result.valid).toBe(false);
      expect(result.board).toEqual(board);
    });

    it('executes valid swaps, cascades, and awards points (AC-07)', () => {
      const board: Board = [
        [0, 1, 2, 3, 4, 5, 0, 1],
        [1, 2, 3, 4, 5, 0, 1, 2],
        [2, 3, 4, 5, 0, 1, 2, 3],
        [3, 4, 5, 0, 1, 2, 3, 4],
        [4, 5, 0, 1, 2, 3, 4, 5],
        [5, 0, 1, 2, 3, 4, 5, 0],
        [0, 1, 0, 2, 4, 5, 0, 1],
        [1, 2, 1, 3, 5, 0, 1, 2],
      ];
      // Swapping [6,1] with [7,1] produces a match-3
      const result = resolveSwap(board, { row: 6, column: 1 }, { row: 7, column: 1 }, fixedRandom);
      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.board.flat()).not.toContain(null);
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Gravity & Refill (AC-05)', () => {
    it('causes tiles to drop and fills vacated cells from the top', () => {
      const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 1));
      board[7]![3] = null;
      board[6]![3] = 5;

      const nextBoard = applyGravity(board, fixedRandom);
      expect(nextBoard[7]![3]).toBe(5);
      expect(nextBoard[0]![3]).not.toBeNull();
      expect(nextBoard.flat()).not.toContain(null);
    });
  });

  describe('Scoring Formula (OPT-002, AC-07)', () => {
    it('computes basic 3-tile match score', () => {
      const score = scoreForMatch(3, 1);
      expect(score).toBe(3 * SCORE_PER_MATCHED_TILE); // 150 pts
    });

    it('applies bonus points for larger matches (4+ tiles)', () => {
      const score4 = scoreForMatch(4, 1);
      expect(score4).toBe(4 * SCORE_PER_MATCHED_TILE + 25); // 225 pts
    });

    it('multiplies score by cascade chain level', () => {
      const chain2 = scoreForMatch(3, 2);
      expect(chain2).toBe(3 * SCORE_PER_MATCHED_TILE * 2); // 300 pts
    });
  });

  describe('Board Stall & Reshuffle', () => {
    it('reshuffles a board and restores valid moves', () => {
      const board = createInitialBoard(fixedRandom);
      const reshuffled = reshuffleBoard(board, fixedRandom);
      expect(reshuffled).toHaveLength(BOARD_SIZE);
      expect(findMatches(reshuffled)).toEqual([]);
      expect(findValidSwap(reshuffled)).not.toBeNull();
    });
  });
});

describe('Game State Reducer (AC-14, TR-001)', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createInitialState(1000);
  });

  it('selects and deselects tiles', () => {
    const s1 = gameReducer(initialState, { type: 'SELECT_TILE', position: { row: 2, column: 3 } });
    expect(s1.selected).toEqual({ row: 2, column: 3 });

    const s2 = gameReducer(s1, { type: 'CLEAR_SELECTION' });
    expect(s2.selected).toBeNull();
  });

  it('handles invalid swap feedback', () => {
    const s1 = gameReducer(initialState, { type: 'INVALID_SWAP', position: { row: 1, column: 1 } });
    expect(s1.invalidPosition).toEqual({ row: 1, column: 1 });
    expect(s1.lastMove?.message).toContain('No chain');
  });

  it('updates score, moves, and checks win condition (AC-08, AC-09)', () => {
    const s1 = gameReducer(initialState, {
      type: 'PLAY_MOVE',
      result: {
        valid: true,
        board: initialState.board,
        clearedPositions: [{ row: 0, column: 0 }],
        score: SCORE_TARGET + 100,
        chain: 2,
        matchedCount: 3,
        steps: [],
      },
    });

    expect(s1.score).toBe(SCORE_TARGET + 100);
    expect(s1.moves).toBe(1);
    expect(s1.status).toBe('won');
    expect(s1.bestScore).toBe(SCORE_TARGET + 100);
    expect(s1.bestChain).toBe(2);
  });

  it('triggers game over when max moves are reached without target score', () => {
    let state = initialState;
    for (let i = 0; i < MAX_MOVES; i++) {
      state = gameReducer(state, {
        type: 'PLAY_MOVE',
        result: {
          valid: true,
          board: state.board,
          clearedPositions: [{ row: 0, column: 0 }],
          score: 50,
          chain: 1,
          matchedCount: 3,
          steps: [],
        },
      });
    }

    expect(state.moves).toBe(MAX_MOVES);
    expect(state.score).toBe(50 * MAX_MOVES); // 1200 < 2500
    expect(state.status).toBe('lost');
  });

  it('resets the game while preserving high scores on RESTART (AC-09)', () => {
    const s1 = gameReducer(initialState, {
      type: 'PLAY_MOVE',
      result: {
        valid: true,
        board: initialState.board,
        clearedPositions: [{ row: 0, column: 0 }],
        score: 1500,
        chain: 3,
        matchedCount: 3,
        steps: [],
      },
    });

    const restarted = gameReducer(s1, { type: 'RESTART' });
    expect(restarted.score).toBe(0);
    expect(restarted.moves).toBe(0);
    expect(restarted.status).toBe('playing');
    expect(restarted.bestScore).toBe(1500);
    expect(restarted.bestChain).toBe(3);
  });
});
