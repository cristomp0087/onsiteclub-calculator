// src/components/HistoryModal.tsx
// Modal para exibir histórico de cálculos no formato "armada"

import type { HistoryEntry } from '../types/calculator';
import '../styles/HistoryModal.css';

interface HistoryModalProps {
  history: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Formata uma expressão no estilo "armada" (operador alinhado à esquerda)
 * Ex: "5 1/2 + 3 1/4" -> ["5 1/2", "+ 3 1/4"]
 */
function formatExpression(expression: string): string[] {
  // Encontra operadores (+, -, *, /)
  const operatorMatch = expression.match(/\s*([+\-*/])\s*/);

  if (!operatorMatch) {
    // Sem operador - retorna expressão simples
    return [expression.trim()];
  }

  const operatorIndex = expression.indexOf(operatorMatch[0]);
  const firstPart = expression.slice(0, operatorIndex).trim();
  const operator = operatorMatch[1];
  const secondPart = expression.slice(operatorIndex + operatorMatch[0].length).trim();

  return [firstPart, `${operator} ${secondPart}`];
}

export function HistoryModal({ history, isOpen, onClose }: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <h2>Histórico</h2>
          <button className="history-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="history-modal-content">
          {history.length === 0 ? (
            <div className="history-empty">
              Nenhum cálculo ainda
            </div>
          ) : (
            history.map((entry) => {
              const lines = formatExpression(entry.expression);

              return (
                <div key={entry.id} className="history-entry">
                  <div className="history-expression">
                    {lines.map((line, idx) => (
                      <div key={idx} className="history-line">{line}</div>
                    ))}
                  </div>
                  <div className="history-divider">────────</div>
                  <div className="history-result">
                    <span className="history-result-main">{entry.resultFeetInches}</span>
                    <span className="history-result-alt">({entry.resultTotalInches})</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
