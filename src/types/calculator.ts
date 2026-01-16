// src/types/calculator.ts
// Tipos para o engine de cálculo

export type VoiceState = 'idle' | 'recording' | 'processing';

export interface CalculationResult {
  /** Formato feet/inches: "8' 1"" */
  resultFeetInches: string;
  /** Formato polegadas totais: "97 In" */
  resultTotalInches: string;
  /** Valor decimal em polegadas */
  resultDecimal: number;
  /** Expressão original */
  expression: string;
  /** true = medidas de construção, false = matemática pura */
  isInchMode: boolean;
}

export interface Token {
  type: 'number' | 'fraction' | 'mixed' | 'feet' | 'operator';
  value: string;
  numericValue?: number;
}

export interface VoiceResponse {
  expression: string;
  error?: string;
}
