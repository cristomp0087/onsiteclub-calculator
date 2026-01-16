// src/components/AuthScreen.tsx
// Tela de autenticação local (Login/Signup)

import { useState } from 'react';
import '../styles/AuthScreen.css';

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: string | null }>;
  loading?: boolean;
}

interface SignUpMetadata {
  firstName: string;
  lastName: string;
  trade?: string;
}

const TRADES = [
  { value: '', label: 'Selecione sua profissão (opcional)' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'framer', label: 'Framer' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'painter', label: 'Painter' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'mason', label: 'Mason' },
  { value: 'welder', label: 'Welder' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'supervisor', label: 'Site Supervisor' },
  { value: 'other', label: 'Other' },
];

export default function AuthScreen({ onSignIn, onSignUp, loading }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    trade: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!formData.email || !formData.password) {
      setError('Preencha email e senha');
      return;
    }

    if (mode === 'signup') {
      if (!formData.firstName || !formData.lastName) {
        setError('Nome e sobrenome são obrigatórios');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let result;

      if (mode === 'login') {
        result = await onSignIn(formData.email, formData.password);
      } else {
        result = await onSignUp(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          trade: formData.trade,
        });
      }

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao processar. Tente novamente.');
      console.error('[AuthScreen]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">📐</span>
            <h1>OnSite Calculator</h1>
          </div>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Entre na sua conta'
              : 'Crie sua conta grátis'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="João"
                  required
                />
              </div>

              <div className="form-group">
                <label>Sobrenome</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Silva"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Profissão</label>
              <select
                value={formData.trade}
                onChange={(e) => updateField('trade', e.target.value)}
              >
                {TRADES.map((trade) => (
                  <option key={trade.value} value={trade.value}>
                    {trade.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="trial-badge">
              <div className="trial-header">
                <span className="trial-tag">6 MESES GRÁTIS</span>
              </div>
              <p className="trial-text">
                Comece com acesso completo por 6 meses. Depois apenas $9.99/ano para Voice Feature.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Carregando...' : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="auth-link"
              disabled={isSubmitting}
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>

        {mode === 'signup' && (
          <p className="terms-text">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="https://onsiteclub.ca/terms" target="_blank" rel="noopener noreferrer">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="https://onsiteclub.ca/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </a>
          </p>
        )}
      </div>
    </div>
  );
}