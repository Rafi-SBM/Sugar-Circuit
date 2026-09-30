import {
  BOARD_SIZE,
  BONUS_PER_EXTRA_TILE,
  SCORE_PER_MATCHED_TILE,
  TILE_TYPES,
  type Board,
  type Cell,
  type Position,
  type TileType,
} from './constants';

export type CascadeStep = {
  stepIndex: number;
  clearedPositions: Position[];
  scoreGained: number;
  chainLevel: number;
  boardBeforeDrop: Board;
  boardAfterDrop: Board;
};

export type SwapResult = {
  valid: boolean;
  board: Board;
  clearedPositions: Position[];
  score: number;
  chain: number;
  matchedCount: number;
  steps: CascadeStep[];
};

export type SwapPair = {
  first: Position;
  second: Position;
};

export function positionKey(position: Position): string {
  return `${position.row}:${position.column}`;
}

export function isAdjacent(first: Position, second: Position): boolean {
  return Math.abs(first.row - second.row) + Math.abs(first.column - second.column) === 1;
}

export function createInitialBoard(random: () => number = Math.random): Board {
  const maxRetries = 100;
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const board = createBoardWithoutMatches(random);
    if (findValidSwap(board)) {
      return board;
    }
  }

  // Fallback: inject a guaranteed valid swap if random attempts failed to produce one
  const board = createBoardWithoutMatches(random);
  return guaranteePlayableSwap(board);
}

export function findValidSwap(board: Board): SwapPair | null {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const first = { row, column };
      const right = { row, column: column + 1 };
      const down = { row: row + 1, column };

      if (column + 1 < BOARD_SIZE && findMatches(swapTiles(board, first, right)).length > 0) {
        return { first, second: right };
      }
      if (row + 1 < BOARD_SIZE && findMatches(swapTiles(board, first, down)).length > 0) {
        return { first, second: down };
      }
    }
  }
  return null;
}

export function findAllValidSwaps(board: Board): SwapPair[] {
  const pairs: SwapPair[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const first = { row, column };
      const right = { row, column: column + 1 };
      const down = { row: row + 1, column };

      if (column + 1 < BOARD_SIZE && findMatches(swapTiles(board, first, right)).length > 0) {
        pairs.push({ first, second: right });
      }
      if (row + 1 < BOARD_SIZE && findMatches(swapTiles(board, first, down)).length > 0) {
        pairs.push({ first, second: down });
      }
    }
  }
  return pairs;
}

export function findMatches(board: Board): Position[] {
  const matches = new Map<string, Position>();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let runStart = 0;
    for (let column = 1; column <= BOARD_SIZE; column += 1) {
      const current = column < BOARD_SIZE ? board[row]?.[column] : null;
      const previous = board[row]?.[column - 1];
      if (current === null || current === undefined || current !== previous) {
        if (column - runStart >= 3 && previous !== null && previous !== undefined) {
          for (let matchColumn = runStart; matchColumn < column; matchColumn += 1) {
            matches.set(positionKey({ row, column: matchColumn }), { row, column: matchColumn });
          }
        }
        runStart = column;
      }
    }
  }

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let runStart = 0;
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = row < BOARD_SIZE ? board[row]?.[column] : null;
      const previous = board[row - 1]?.[column];
      if (current === null || current === undefined || current !== previous) {
        if (row - runStart >= 3 && previous !== null && previous !== undefined) {
          for (let matchRow = runStart; matchRow < row; matchRow += 1) {
            matches.set(positionKey({ row: matchRow, column }), { row: matchRow, column });
          }
        }
        runStart = row;
      }
    }
  }

  return Array.from(matches.values());
}

export function swapTiles(board: Board, first: Position, second: Position): Board {
  const nextBoard = cloneBoard(board);
  const firstTile = nextBoard[first.row]?.[first.column] ?? null;
  const secondTile = nextBoard[second.row]?.[second.column] ?? null;
  const firstRow = nextBoard[first.row];
  const secondRow = nextBoard[second.row];
  if (!firstRow || !secondRow) return nextBoard;
  firstRow[first.column] = secondTile;
  secondRow[second.column] = firstTile;
  return nextBoard;
}

export function resolveSwap(
  board: Board,
  first: Position,
  second: Position,
  random: () => number = Math.random,
): SwapResult {
  if (!isAdjacent(first, second)) {
    return {
      valid: false,
      board,
      clearedPositions: [],
      score: 0,
      chain: 0,
      matchedCount: 0,
      steps: [],
    };
  }

  const swappedBoard = swapTiles(board, first, second);
  const initialMatches = findMatches(swappedBoard);
  if (initialMatches.length === 0) {
    return {
      valid: false,
      board,
      clearedPositions: [],
      score: 0,
      chain: 0,
      matchedCount: 0,
      steps: [],
    };
  }

  let workingBoard = swappedBoard;
  let allClearedPositions: Position[] = [];
  let totalScore = 0;
  let chain = 0;
  const steps: CascadeStep[] = [];

  // Continue resolving matches until gravity drops create no new runs
  while (true) {
    const matches = findMatches(workingBoard);
    if (matches.length === 0) break;
    chain += 1;
    allClearedPositions = [...allClearedPositions, ...matches];
    const stepScore = scoreForMatch(matches.length, chain);
    totalScore += stepScore;

    const boardBeforeDrop = cloneBoard(workingBoard);
    workingBoard = dropAndRefill(workingBoard, matches, random);

    steps.push({
      stepIndex: chain,
      clearedPositions: matches,
      scoreGained: stepScore,
      chainLevel: chain,
      boardBeforeDrop,
      boardAfterDrop: cloneBoard(workingBoard),
    });
  }

  return {
    valid: true,
    board: workingBoard,
    clearedPositions: uniquePositions(allClearedPositions),
    score: totalScore,
    chain,
    matchedCount: allClearedPositions.length,
    steps,
  };
}

export function clearMatches(board: Board, matches: Position[]): Board {
  const nextBoard = cloneBoard(board);
  for (const position of matches) {
    const row = nextBoard[position.row];
    if (row) row[position.column] = null;
  }
  return nextBoard;
}

export function applyGravity(board: Board, random: () => number = Math.random): Board {
  const nextBoard = cloneBoard(board);
  for (let column = 0; column < BOARD_SIZE; column += 1) {
    const remaining: TileType[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const tile = nextBoard[row]?.[column];
      if (tile !== null && tile !== undefined) remaining.push(tile);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const targetRow = nextBoard[row];
      if (targetRow) targetRow[column] = remaining[BOARD_SIZE - 1 - row] ?? null;
    }
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const targetRow = nextBoard[row];
      if (targetRow?.[column] === null) {
        targetRow[column] = randomTile(targetRow, nextBoard, row, column, random);
      }
    }
  }
  return nextBoard;
}

export function dropAndRefill(board: Board, matches: Position[], random: () => number): Board {
  return applyGravity(clearMatches(board, matches), random);
}

export function reshuffleBoard(board: Board, random: () => number = Math.random): Board {
  const tiles: TileType[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const t = board[row]?.[col];
      if (t !== null && t !== undefined) tiles.push(t);
    }
  }

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }

    const candidate: Board = [];
    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      const rowArr: Cell[] = [];
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        rowArr.push(shuffled[idx++] ?? 0);
      }
      candidate.push(rowArr);
    }

    if (findMatches(candidate).length === 0 && findValidSwap(candidate) !== null) {
      return candidate;
    }
  }

  return createInitialBoard(random);
}

function createBoardWithoutMatches(random: () => number): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const nextRow: Cell[] = [];
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      nextRow.push(randomTile(nextRow, board, row, column, random));
    }
    board.push(nextRow);
  }
  return board;
}

function randomTile(
  row: Cell[],
  board: Board,
  rowIndex: number,
  columnIndex: number,
  random: () => number,
): TileType {
  const candidates: TileType[] = Array.from({ length: TILE_TYPES }, (_, index) => index as TileType);
  const leftOne = row[columnIndex - 1];
  const leftTwo = row[columnIndex - 2];
  const aboveOne = board[rowIndex - 1]?.[columnIndex];
  const aboveTwo = board[rowIndex - 2]?.[columnIndex];
  const belowOne = board[rowIndex + 1]?.[columnIndex];
  const belowTwo = board[rowIndex + 2]?.[columnIndex];

  // Exclude colors that would complete a match-3 with adjacent predecessors
  const safeCandidates = candidates.filter(
    (tile) =>
      !(tile === leftOne && tile === leftTwo) &&
      !(tile === aboveOne && tile === aboveTwo) &&
      !(tile === belowOne && tile === belowTwo),
  );

  return (safeCandidates[Math.floor(random() * safeCandidates.length)] ?? 0) as TileType;
}

function guaranteePlayableSwap(board: Board): Board {
  const result = cloneBoard(board);
  // Seed an L-hook pattern at [0,0]-[0,1] and [1,2] so swapping (0,2) with (1,2) forms a match
  const targetColor: TileType = 0;
  const otherColor: TileType = 1;

  if (result[0]) {
    result[0][0] = targetColor;
    result[0][1] = targetColor;
    result[0][2] = otherColor;
  }
  if (result[1]) {
    result[1][2] = targetColor;
  }
  return result;
}

export function scoreForMatch(matchCount: number, chain: number): number {
  return (
    matchCount * SCORE_PER_MATCHED_TILE * chain +
    Math.max(0, matchCount - 3) * BONUS_PER_EXTRA_TILE
  );
}

function uniquePositions(positions: Position[]): Position[] {
  return Array.from(new Map(positions.map((position) => [positionKey(position), position])).values());
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}
