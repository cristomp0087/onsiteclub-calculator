// src/lib/subscription.ts
// Gerenciamento de assinaturas e verificação de acesso premium

import { supabase } from './supabase';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const SUBSCRIPTION_CACHE_KEY = 'calculator_subscription_status';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

// Cache em memória como fallback
let memoryCache: CachedSubscription | null = null;

// Flag para evitar múltiplas chamadas simultâneas
let isChecking = false;

interface CachedSubscription {
  hasAccess: boolean;
  checkedAt: number;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  app: string;
  status: 'active' | 'canceled' | 'past_due' | 'inactive' | 'trialing';
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

/**
 * Lê cache (tenta Preferences, fallback para memória)
 */
async function getCache(): Promise<CachedSubscription | null> {
  try {
    // Tentar memória primeiro (mais rápido)
    if (memoryCache) {
      const isExpired = Date.now() - memoryCache.checkedAt > CACHE_DURATION;
      if (!isExpired) {
        return memoryCache;
      }
    }

    // Se estiver na web ou memória expirou, tentar Preferences
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: SUBSCRIPTION_CACHE_KEY });
      if (value) {
        const cached: CachedSubscription = JSON.parse(value);
        memoryCache = cached; // Atualiza memória
        return cached;
      }
    }
  } catch (err) {
    console.warn('[Subscription] Error reading cache:', err);
  }
  return null;
}

/**
 * Salva cache (tenta Preferences e memória)
 */
async function setCache(data: CachedSubscription): Promise<void> {
  try {
    // Sempre salva em memória
    memoryCache = data;

    // Salva em Preferences se estiver em plataforma nativa
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({
        key: SUBSCRIPTION_CACHE_KEY,
        value: JSON.stringify(data),
      });
    }
  } catch (err) {
    console.warn('[Subscription] Error saving cache:', err);
  }
}

/**
 * Verifica se o usuário tem assinatura ativa no Supabase
 * Consulta diretamente a tabela 'subscriptions'
 */
export async function hasActiveSubscription(): Promise<boolean> {
  if (!supabase) {
    console.warn('[Subscription] Supabase not available');
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Subscription] No user logged in');
      return false;
    }

    console.log('[Subscription] Checking for user:', user.id);

    // Primeiro, busca TODAS as subscriptions do usuário (para debug)
    const { data: allSubs, error: allError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    console.log('[Subscription] All subscriptions for user:', allSubs, 'Error:', allError);

    // Busca subscription específica do calculator
    // Tenta tanto 'calculator' quanto 'calculator-pro' para compatibilidade
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('app', ['calculator', 'calculator-pro', 'onsite-calculator'])
      .maybeSingle();

    // PGRST116 = "No rows found" - isso é esperado para usuários sem assinatura
    if (error && error.code !== 'PGRST116') {
      console.error('[Subscription] Error fetching subscription:', error);
      return false;
    }

    if (!data) {
      console.log('[Subscription] No subscription found for user with app calculator/calculator-pro');
      return false;
    }

    const subscription = data as SubscriptionData;

    console.log('[Subscription] Found subscription:', subscription);

    // Verifica se está ativo ou em trial
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    // Verifica se não expirou
    const notExpired = !subscription.current_period_end ||
                       new Date(subscription.current_period_end) > new Date();

    const hasAccess = isActive && notExpired;

    console.log('[Subscription] Status:', subscription.status, 'isActive:', isActive, 'notExpired:', notExpired, 'Has access:', hasAccess);

    return hasAccess;
  } catch (err) {
    console.error('[Subscription] Exception checking subscription:', err);
    return false;
  }
}

/**
 * Verifica acesso premium com cache local
 * Usa apenas Supabase como fonte de verdade (tabela subscriptions)
 */
export async function checkPremiumAccess(): Promise<boolean> {
  // Evita chamadas simultâneas
  if (isChecking) {
    console.log('[Subscription] Already checking, returning cached or false');
    return memoryCache?.hasAccess ?? false;
  }

  try {
    isChecking = true;

    // Tentar cache primeiro
    const cached = await getCache();

    if (cached) {
      const isExpired = Date.now() - cached.checkedAt > CACHE_DURATION;

      if (!isExpired) {
        console.log('[Subscription] Using cached status:', cached.hasAccess);
        return cached.hasAccess;
      } else {
        console.log('[Subscription] Cache expired, checking Supabase');
      }
    }

    // Verifica direto no Supabase (tabela subscriptions)
    const hasAccess = await hasActiveSubscription();
    console.log('[Subscription] Supabase check result:', hasAccess);

    // Salvar no cache
    await setCache({
      hasAccess,
      checkedAt: Date.now(),
    });

    return hasAccess;
  } catch (err) {
    console.error('[Subscription] Error checking premium access:', err);
    return false;
  } finally {
    isChecking = false;
  }
}

/**
 * Limpa o cache de assinatura
 * Deve ser chamado quando voltar do checkout ou quando fazer refresh manual
 */
export async function clearSubscriptionCache(): Promise<void> {
  try {
    // Limpa memória
    memoryCache = null;

    // Limpa Preferences se estiver em plataforma nativa
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: SUBSCRIPTION_CACHE_KEY });
    }

    console.log('[Subscription] Cache cleared');
  } catch (err) {
    console.error('[Subscription] Error clearing cache:', err);
  }
}

/**
 * Verifica o status da assinatura e atualiza o cache
 * Útil para forçar uma verificação após retornar do checkout
 */
export async function refreshSubscriptionStatus(): Promise<boolean> {
  console.log('[Subscription] Forcing subscription refresh');
  await clearSubscriptionCache();
  return checkPremiumAccess();
}
