// src/components/VoiceUpgradePopup.tsx
// Modal para upgrade de Voice feature

import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

interface VoiceUpgradePopupProps {
  onClose: () => void;
  userEmail?: string;
  userId?: string;
}

// URL da API - varia entre web e nativo
const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://calculator.onsiteclub.ca'
  : '';

export default function VoiceUpgradePopup({ onClose, userEmail }: VoiceUpgradePopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutUrl = 'https://auth.onsiteclub.ca/checkout/calculator';

  const handleStartTrial = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Pega o access token da sessão atual
      if (!supabase) {
        throw new Error('Autenticação não disponível');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // 2. Chama a API para gerar o JWT token seguro
      const tokenResponse = await fetch(`${API_BASE_URL}/api/checkout-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ app: 'calculator' }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao preparar checkout');
      }

      const { token } = await tokenResponse.json();

      // 3. Monta a URL com o token JWT
      const redirectUri = 'onsitecalculator://auth-callback';
      const url = new URL(checkoutUrl);

      // Envia apenas o token JWT (contém user_id criptografado)
      url.searchParams.set('token', token);

      // Email é opcional, apenas para mostrar no UI do checkout
      if (userEmail) {
        url.searchParams.set('prefilled_email', userEmail);
      }

      url.searchParams.set('redirect', redirectUri);

      // 4. Abre o browser externo
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: url.toString(),
          presentationStyle: 'popover',
        });
      } else {
        window.open(url.toString(), '_blank');
      }

      // Fecha o popup após abrir o checkout
      onClose();

    } catch (err) {
      console.error('[VoiceUpgrade] Error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>

        <div className="popup-icon">🎙️</div>

        <h2 className="popup-title">Voice Calculator</h2>

        <p className="popup-description">
          Speak your measurements and let AI do the math!
        </p>

        <div className="popup-features">
          <div className="popup-feature">✓ Voice recognition in English & Portuguese</div>
          <div className="popup-feature">✓ Understands fractions and feet/inches</div>
          <div className="popup-feature">✓ Hands-free on the job site</div>
        </div>

        <div className="popup-pricing">
          <div className="popup-trial">
            <span className="popup-trial-badge">6 MONTHS FREE</span>
            <p className="popup-trial-text">Try it free, cancel anytime</p>
          </div>
          <p className="popup-price">Then $11.99 CAD/year</p>
        </div>

        {error && (
          <div className="popup-error">
            {error}
          </div>
        )}

        <button
          className="popup-btn popup-btn-primary"
          onClick={handleStartTrial}
          disabled={isLoading}
        >
          {isLoading ? 'Preparing...' : 'Start Free Trial'}
        </button>

        <button className="popup-btn popup-btn-secondary" onClick={onClose}>
          Maybe Later
        </button>

        <p className="popup-note">
          Credit card required. You won't be charged during trial.
        </p>
      </div>
    </div>
  );
}
