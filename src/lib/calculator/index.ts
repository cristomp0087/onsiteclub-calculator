// src/lib/calculator/index.ts
// API pública do calculator engine

export {
  calculate,
  parseToInches,
  formatInches,
  formatTotalInches,
  formatNumber,
  tokenize,
  evaluateTokens,
} from './engine';

export type { CalculationResult } from '../../types/calculator';
