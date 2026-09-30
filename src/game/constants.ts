export const BOARD_SIZE = 8;
export const TILE_TYPES = 6;

export const MAX_MOVES = 24;
export const SCORE_TARGET = 2500;
export const BLITZ_TIME_LIMIT_SECONDS = 90;

export const SCORE_PER_MATCHED_TILE = 50;
export const BONUS_PER_EXTRA_TILE = 25;

export const DURATION_SWAP_MS = 220;
export const DURATION_MATCH_FX_MS = 380;
export const DURATION_FALL_MS = 240;
export const DURATION_INVALID_SHAKE_MS = 280;

export type GameMode = 'moves' | 'blitz';
export type ThemeMode = 'cyber' | 'solar';

export type TileType = 0 | 1 | 2 | 3 | 4 | 5;
export type Cell = TileType | null;
export type Board = Cell[][];
export type Position = { row: number; column: number };

export interface TileDefinition {
  label: string;
  name: string;
  icon: 'star-four-points' | 'heart' | 'clover' | 'diamond-stone' | 'flower' | 'hexagon';
  background: string;
  highlight: string;
  shadow: string;
  foreground: string;
  border: string;
  glow: string;
}

export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  0: {
    label: 'strawberry heart',
    name: 'Strawberry Heart',
    icon: 'heart',
    background: '#E61E50',
    highlight: '#FF6B8B',
    shadow: '#99002B',
    foreground: '#FFFFFF',
    border: '#FFA3B8',
    glow: '#FF2E63',
  },
  1: {
    label: 'golden star',
    name: 'Golden Star',
    icon: 'star-four-points',
    background: '#F59E0B',
    highlight: '#FCD34D',
    shadow: '#B45309',
    foreground: '#FFFFFF',
    border: '#FDE68A',
    glow: '#FBBF24',
  },
  2: {
    label: 'emerald clover',
    name: 'Emerald Clover',
    icon: 'clover',
    background: '#059669',
    highlight: '#34D399',
    shadow: '#065F46',
    foreground: '#FFFFFF',
    border: '#A7F3D0',
    glow: '#10B981',
  },
  3: {
    label: 'sapphire diamond',
    name: 'Sapphire Diamond',
    icon: 'diamond-stone',
    background: '#2563EB',
    highlight: '#60A5FA',
    shadow: '#1E40AF',
    foreground: '#FFFFFF',
    border: '#BFDBFE',
    glow: '#3B82F6',
  },
  4: {
    label: 'grape blossom',
    name: 'Grape Blossom',
    icon: 'flower',
    background: '#8B5CF6',
    highlight: '#A78BFA',
    shadow: '#6D28D9',
    foreground: '#FFFFFF',
    border: '#DDD6FE',
    glow: '#8B5CF6',
  },
  5: {
    label: 'tangerine drop',
    name: 'Tangerine Drop',
    icon: 'hexagon',
    background: '#EA580C',
    highlight: '#FB923C',
    shadow: '#9A3412',
    foreground: '#FFFFFF',
    border: '#FED7AA',
    glow: '#F97316',
  },
};

export const THEMES = {
  cyber: {
    id: 'cyber' as ThemeMode,
    name: 'Royal Twilight',
    background: ['#160D2E', '#241445', '#120924'] as const,
    glowA: '#7C3AED',
    glowB: '#DB2777',
    panel: 'rgba(38, 20, 69, 0.75)',
    panelRaised: 'rgba(56, 30, 99, 0.85)',
    border: 'rgba(255, 255, 255, 0.12)',
    accentMint: '#34D399',
    accentCoral: '#FF4D6D',
    accentGold: '#FBBF24',
    accentViolet: '#A78BFA',
    text: '#FFFFFF',
    muted: '#C4B5FD',
  },
  solar: {
    id: 'solar' as ThemeMode,
    name: 'Candy Sunset',
    background: ['#2B1028', '#42163C', '#1D0A1C'] as const,
    glowA: '#E11D48',
    glowB: '#F59E0B',
    panel: 'rgba(64, 21, 58, 0.75)',
    panelRaised: 'rgba(92, 30, 84, 0.85)',
    border: 'rgba(255, 210, 230, 0.15)',
    accentMint: '#FBBF24',
    accentCoral: '#FB7185',
    accentGold: '#FCD34D',
    accentViolet: '#F472B6',
    text: '#FFFFFF',
    muted: '#FBCFE8',
  },
};
