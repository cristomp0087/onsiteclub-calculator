// src/hooks/useCalculatorHistory.ts
// Hook para gerenciar histórico de cálculos com persistência

import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import type { CalculationResult, HistoryEntry } from '../types/calculator';

const HISTORY_KEY = 'calculator_history';
const MAX_HISTORY_SIZE = 5;

export function useCalculatorHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega histórico do storage ao montar
  useEffect(() => {
    loadHistory();
  }, []);

  // Carrega histórico do Preferences ou localStorage
  const loadHistory = async () => {
    try {
      let storedHistory: HistoryEntry[] = [];

      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: HISTORY_KEY });
        if (value) {
          storedHistory = JSON.parse(value);
        }
      } else {
        const value = localStorage.getItem(HISTORY_KEY);
        if (value) {
          storedHistory = JSON.parse(value);
        }
      }

      setHistory(storedHistory);
    } catch (err) {
      console.warn('[History] Error loading history:', err);
    } finally {
      setIsLoaded(true);
    }
  };

  // Salva histórico no storage
  const saveHistory = async (newHistory: HistoryEntry[]) => {
    try {
      const value = JSON.stringify(newHistory);

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: HISTORY_KEY, value });
      } else {
        localStorage.setItem(HISTORY_KEY, value);
      }
    } catch (err) {
      console.warn('[History] Error saving history:', err);
    }
  };

  // Adiciona entrada ao histórico (mantém máximo de 5)
  const addToHistory = useCallback(async (result: CalculationResult) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      expression: result.expression,
      resultFeetInches: result.resultFeetInches,
      resultTotalInches: result.resultTotalInches,
      resultDecimal: result.resultDecimal,
      isInchMode: result.isInchMode,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Adiciona no início (mais recente primeiro)
      const updated = [entry, ...prev].slice(0, MAX_HISTORY_SIZE);
      saveHistory(updated);
      return updated;
    });
  }, []);

  // Limpa todo o histórico
  const clearHistory = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: HISTORY_KEY });
      } else {
        localStorage.removeItem(HISTORY_KEY);
      }
      setHistory([]);
    } catch (err) {
      console.warn('[History] Error clearing history:', err);
    }
  }, []);

  return {
    history,
    isLoaded,
    addToHistory,
    clearHistory,
  };
}
