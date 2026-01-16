// src/hooks/useDeepLink.ts
// Hook para gerenciar Deep Links do Capacitor

import { useEffect, useRef } from 'react';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

interface UseDeepLinkProps {
  onAuthCallback?: (accessToken: string, refreshToken: string) => void;
}

export function useDeepLink({ onAuthCallback }: UseDeepLinkProps = {}) {
  // Usa ref para evitar re-registrar o listener quando o callback muda
  const callbackRef = useRef(onAuthCallback);

  // Atualiza a ref quando o callback muda
  useEffect(() => {
    callbackRef.current = onAuthCallback;
  }, [onAuthCallback]);

  useEffect(() => {
    // Só registra listeners em plataforma nativa
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppUrlOpen = async (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log('[DeepLink] App opened with URL:', url);

      // Verifica se é um callback de autenticação
      if (url.includes('auth-callback')) {
        try {
          const urlObj = new URL(url);
          const accessToken = urlObj.searchParams.get('access_token');
          const refreshToken = urlObj.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[DeepLink] Auth tokens received');

            // Se o Supabase está disponível, seta a sessão
            if (supabase) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error('[DeepLink] Error setting session:', error);
              } else {
                console.log('[DeepLink] Session set successfully');
              }
            }

            // Chama callback customizado se fornecido (via ref)
            if (callbackRef.current) {
              callbackRef.current(accessToken, refreshToken);
            }
          } else {
            console.warn('[DeepLink] Missing tokens in URL');
          }
        } catch (error) {
          console.error('[DeepLink] Error parsing URL:', error);
        }
      }
    };

    // Registra o listener
    let cleanupPromise: Promise<void> | null = null;

    App.addListener('appUrlOpen', handleAppUrlOpen).then((listener) => {
      cleanupPromise = Promise.resolve(listener.remove());
    });

    // Cleanup
    return () => {
      if (cleanupPromise) {
        cleanupPromise.catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez
}
