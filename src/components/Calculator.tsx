// src/components/Calculator.tsx
// Componente principal da calculadora

import { useCallback } from 'react';
import { useCalculator, useOnlineStatus, useVoiceRecorder } from '../hooks';
import { calculate } from '../lib/calculator';
import type { VoiceState, VoiceResponse } from '../types/calculator';

// Teclado de frações
const FRACTION_PAD = [
  ['1/8"', '1/4"', '3/8"', '1/2"'],
  ['5/8"', '3/4"', '7/8"', "'ft"],
];

// Teclado numérico
const KEYPAD = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const API_ENDPOINT = import.meta.env.VITE_API_URL || '/api/interpret';

interface CalculatorProps {
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  hasVoiceAccess: boolean;
  onVoiceUpgradeClick: () => void;
  userName?: string;
}

export default function Calculator({
  voiceState,
  setVoiceState,
  hasVoiceAccess,
  onVoiceUpgradeClick,
  userName,
}: CalculatorProps) {
  const isOnline = useOnlineStatus();
  const {
    expression,
    setExpression,
    displayValue,
    lastResult,
    compute,
    clear,
    backspace,
    appendKey,
    appendFraction,
    appendOperator,
  } = useCalculator();

  // Handler para quando gravação terminar
  const handleAudioUpload = useCallback(async (audioBlob: Blob) => {
    setVoiceState('processing');
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('API Error');
      
      const data: VoiceResponse = await response.json();

      if (data.expression) {
        setExpression(data.expression);
        const result = calculate(data.expression);
        if (result) {
          // Trigger display update através do hook
        }
      }
    } catch (error) {
      console.error('[Voice] Error:', error);
    } finally {
      setVoiceState('idle');
    }
  }, [setExpression, setVoiceState]);

  const { startRecording, stopRecording } = useVoiceRecorder({
    onRecordingComplete: handleAudioUpload,
    onError: (error) => {
      console.error('[Voice] Recording error:', error);
      alert('Microphone access denied or not available.');
    },
  });

  // Voice button handlers
  const handleVoiceStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    
    if (!hasVoiceAccess) {
      onVoiceUpgradeClick();
      return;
    }
    
    if (voiceState === 'idle') {
      setVoiceState('recording');
      startRecording();
    }
  };

  const handleVoiceEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (voiceState === 'recording') {
      stopRecording();
    }
  };

  // Keypad handler
  const handleKeyClick = (key: string) => {
    switch (key) {
      case '=':
        compute();
        break;
      case 'C':
        clear();
        break;
      case '⌫':
        backspace();
        break;
      case '÷':
        appendOperator('/');
        break;
      case '×':
        appendOperator('*');
        break;
      case '+':
      case '-':
        appendOperator(key);
        break;
      case '%':
        appendOperator('%');
        break;
      default:
        appendKey(key);
    }
  };

  // Fraction handler
  const handleFractionClick = (frac: string) => {
    if (frac === "'ft") {
      appendKey("' ");
    } else {
      appendFraction(frac);
    }
  };

  const getVoiceButtonText = () => {
    if (!isOnline) return 'Offline';
    if (!hasVoiceAccess) return '🔒 Upgrade to Voice';
    if (voiceState === 'recording') return 'Release to Send';
    if (voiceState === 'processing') return 'Thinking...';
    return 'Hold to Speak';
  };

  // Handler para abrir site OnSite Club
  const handleLogoClick = () => {
    if (window.confirm('Você tem certeza que quer abrir o site OnSite Club?')) {
      window.open('https://onsiteclub.ca', '_blank');
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <img
            src="/images/onsite-club-logo.png"
            alt="OnSite Club"
            className="logo-img"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="header-actions">
          {userName && <div className="user-name">{userName}</div>}
          {!isOnline && <div className="offline-badge">Offline</div>}
        </div>
      </header>

      <main className="main">
        {/* Left Card: Display & Voice */}
        <div className="card left-card">
          <div className="display-section">
            <div className="display-row">
              <div className="display-box primary">
                <span className={`display-value ${voiceState}`}>
                  {lastResult?.isInchMode ? lastResult.resultFeetInches : displayValue}
                </span>
              </div>
              {lastResult?.isInchMode && (
                <div className="display-box secondary">
                  <span className="display-value-secondary">{lastResult.resultTotalInches}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="divider" />
          
          <input
            type="text"
            className="expression-input"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') compute();
            }}
            placeholder="Type or speak: 5 1/2 + 3 1/4 - 2"
          />
          
          <button
            className={`voice-btn ${voiceState === 'recording' ? 'listening' : ''}`}
            disabled={!isOnline}
            onMouseDown={handleVoiceStart}
            onMouseUp={handleVoiceEnd}
            onMouseLeave={voiceState === 'recording' ? handleVoiceEnd : undefined}
            onTouchStart={handleVoiceStart}
            onTouchEnd={handleVoiceEnd}
          >
            <span className="voice-icon">
              {voiceState === 'recording' ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="10" r="8" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 2C8.34 2 7 3.34 7 5V10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10V5C13 3.34 11.66 2 10 2Z" />
                  <path d="M5.5 9.5V10C5.5 12.49 7.51 14.5 10 14.5C12.49 14.5 14.5 12.49 14.5 10V9.5" strokeLinecap="round" />
                  <path d="M10 14.5V18" strokeLinecap="round" />
                  <path d="M7 18H13" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="voice-text">{getVoiceButtonText()}</span>
          </button>

          {/* Memory Display */}
          {lastResult && lastResult.expression && (
            <div className="memory">
              <div className="memory-expr">{lastResult.expression}</div>
              <div className="memory-line">────────</div>
            </div>
          )}
        </div>

        {/* Right Card: Keypad & Fractions */}
        <div className="card right-card">
          <div className="fraction-container">
            <div className="fraction-pad">
              {FRACTION_PAD.flat().map((frac, i) => (
                <button
                  key={i}
                  className={`frac-btn ${frac === "'ft" ? 'feet' : ''}`}
                  onClick={() => handleFractionClick(frac)}
                >
                  {frac}
                </button>
              ))}
            </div>
          </div>

          <div className="keypad">
            {KEYPAD.map((row, rowIndex) => (
              <div key={rowIndex} className={`keypad-row ${rowIndex === KEYPAD.length - 1 ? 'last-row' : ''}`}>
                {row.map((key, keyIndex) => (
                  <button
                    key={keyIndex}
                    className={`key ${key === '=' ? 'equals' : ''} ${key === 'C' || key === '⌫' ? 'danger' : ''} ${'÷×-+%'.includes(key) ? 'operator' : ''}`}
                    onClick={() => handleKeyClick(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
