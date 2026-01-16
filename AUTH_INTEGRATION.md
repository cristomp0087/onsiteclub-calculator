# Sistema de Autenticação - OnSite Calculator

## 📋 Visão Geral

Sistema de autenticação completo integrado ao OnSite Calculator com:
- Login/Signup local dentro do app
- Verificação de assinatura para Voice Feature
- Deep linking para retorno do checkout Stripe
- Integração com Supabase

---

## 🎯 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuário abre o app                                  │
│     ↓                                                    │
│  2. Verifica se está autenticado (Supabase)             │
│     ├─ NÃO → Mostra AuthScreen (Login/Signup)          │
│     └─ SIM → Carrega perfil e mostra Calculator        │
│                                                          │
│  3. No Calculator, clica no botão de Voice              │
│     ├─ TEM ACESSO → Inicia gravação                    │
│     └─ SEM ACESSO → Abre VoiceUpgradePopup             │
│                                                          │
│  4. No Popup, clica "Start Free Trial"                  │
│     ↓                                                    │
│  5. Abre navegador externo:                             │
│     https://auth.onsiteclub.ca/checkout/premium         │
│     ?prefilled_email=...&redirect=onsitecalculator://...│
│                                                          │
│  6. Usuário completa checkout no Stripe                 │
│     ↓                                                    │
│  7. Página web redireciona para:                        │
│     onsitecalculator://auth-callback                    │
│     ?access_token=...&refresh_token=...                 │
│                                                          │
│  8. App recebe deep link, atualiza sessão               │
│     ↓                                                    │
│  9. Atualiza perfil do Supabase                         │
│     ↓                                                    │
│  10. Libera Voice Feature ✅                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:

1. **`src/hooks/useAuth.ts`**
   - Hook de autenticação principal
   - Gerencia estado de login/logout
   - Verifica assinatura e libera Voice Feature
   - Funções: `signIn`, `signUp`, `signOut`, `refreshProfile`

2. **`src/hooks/useDeepLink.ts`**
   - Gerencia deep links do Capacitor
   - Escuta `appUrlOpen` events
   - Processa tokens de autenticação do callback

3. **`src/components/AuthScreen.tsx`**
   - Tela de Login/Signup integrada
   - Interface amigável com validação
   - Suporte a profissões (trades)

4. **`src/styles/AuthScreen.css`**
   - Estilos da tela de autenticação
   - Design responsivo e moderno

5. **`AUTH_INTEGRATION.md`** (este arquivo)
   - Documentação completa do sistema

### Arquivos Modificados:

1. **`src/App.tsx`**
   - Integração completa de autenticação
   - Renderização condicional (Auth → Calculator)
   - Deep link handler

2. **`src/components/VoiceUpgradePopup.tsx`**
   - Atualizado para usar Capacitor Browser
   - Redireciona para checkout correto
   - Preço ajustado ($9.99/ano)

3. **`src/hooks/index.ts`**
   - Exporta novos hooks

4. **`src/styles/App.css`**
   - Adicionados estilos de loading

5. **`android/app/src/main/AndroidManifest.xml`**
   - Configurado deep link `onsitecalculator://auth-callback`

6. **`package.json`**
   - Adicionados: `@capacitor/browser`, `@capacitor/app`

---

## 🔐 Variáveis de Ambiente

Certifique-se de que o `.env.local` contém:

```bash
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://xmpckuiluwhcdzyadggh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Checkout (obrigatório para Voice)
VITE_STRIPE_CHECKOUT_URL=https://buy.stripe.com/test_...
```

---

## 📊 Estrutura do Banco de Dados (Supabase)

### Tabela: `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  nome TEXT, -- Nome completo
  trade TEXT, -- Profissão
  birthday DATE,
  gender TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '6 months'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Constraint para subscription_status
ALTER TABLE profiles
ADD CONSTRAINT subscription_status_check
CHECK (subscription_status IN ('trialing', 'active', 'canceled', 'past_due'));
```

### Trigger Automático (Criar Perfil)

```sql
-- Cria perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    nome,
    trade,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    CONCAT(
      NEW.raw_user_meta_data->>'first_name',
      ' ',
      NEW.raw_user_meta_data->>'last_name'
    ),
    NEW.raw_user_meta_data->>'trade',
    'trialing',
    NOW() + INTERVAL '6 months'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔗 Integração com Checkout (auth.onsiteclub.ca)

### O que o projeto de checkout precisa fazer:

1. **Receber parâmetros na URL:**
   ```
   https://auth.onsiteclub.ca/checkout/premium
     ?prefilled_email=user@example.com
     &redirect=onsitecalculator://auth-callback
   ```

2. **Após pagamento bem-sucedido:**
   - Atualizar `profiles.subscription_status` → `'active'` ou `'trialing'`
   - Redirecionar para:
     ```
     onsitecalculator://auth-callback
       ?access_token={token}
       &refresh_token={token}
       &subscription_status=active
     ```

3. **Exemplo de código no checkout:**
   ```typescript
   // Após sucesso do Stripe
   const redirectUrl = searchParams.get('redirect');
   const { access_token, refresh_token } = session;

   if (redirectUrl?.startsWith('onsitecalculator://')) {
     const callbackUrl = new URL(redirectUrl);
     callbackUrl.searchParams.set('access_token', access_token);
     callbackUrl.searchParams.set('refresh_token', refresh_token);
     callbackUrl.searchParams.set('subscription_status', 'active');

     window.location.href = callbackUrl.toString();
   }
   ```

---

## 🚀 Comandos para Build

### Desenvolvimento Web:
```bash
npm run dev
```

### Build para Produção:
```bash
npm run build
```

### Sincronizar com Android:
```bash
npm run cap:sync
npm run cap:android
```

### Build APK:
1. Abrir no Android Studio: `npm run cap:android`
2. Build > Build Bundle(s) / APK(s) > Build APK(s)

---

## 🧪 Como Testar

### 1. Teste de Login/Signup Local:
- Abra o app
- Tente criar uma conta
- Faça logout
- Faça login novamente

### 2. Teste de Voice sem Assinatura:
- Faça login
- Clique no botão de Voice
- Deve abrir o popup de upgrade

### 3. Teste de Deep Link (Web):
- No browser, acesse:
  ```
  onsitecalculator://auth-callback?access_token=test&refresh_token=test
  ```
- O app deve abrir (se instalado)

### 4. Teste de Checkout Completo:
- Clique em "Start Free Trial" no popup
- Complete o checkout no Stripe (teste)
- Deve retornar ao app com Voice liberado

---

## 🐛 Troubleshooting

### Voice não funciona após checkout:
1. Verifique se o `subscription_status` foi atualizado no Supabase
2. Execute `refreshProfile()` manualmente
3. Confira logs do console: `[App] Auth state`

### Deep Link não funciona:
1. Certifique-se de que o AndroidManifest.xml está atualizado
2. Reinstale o app após modificar o manifest
3. Teste com: `adb shell am start -a android.intent.action.VIEW -d "onsitecalculator://auth-callback?access_token=test"`

### Erro ao fazer login:
1. Verifique as credenciais do Supabase
2. Confira se a tabela `profiles` existe
3. Verifique se o trigger está ativo

---

## 📝 Próximos Passos

- [ ] Implementar refresh token automático
- [ ] Adicionar verificação de email
- [ ] Implementar reset de senha
- [ ] Adicionar OAuth (Google, Apple)
- [ ] Adicionar analytics de conversão
- [ ] Implementar notificações push

---

## 🔗 Links Úteis

- **Checkout**: https://auth.onsiteclub.ca/checkout/premium
- **Success**: https://auth.onsiteclub.ca/success
- **Billing**: https://auth.onsiteclub.ca/billing
- **Webhook Stripe**: https://auth.onsiteclub.ca/api/webhooks/stripe

- **Supabase Dashboard**: https://app.supabase.com
- **Stripe Dashboard**: https://dashboard.stripe.com

---

**OnSite Club © 2025**
