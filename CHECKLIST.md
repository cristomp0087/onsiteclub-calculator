# ✅ Checklist de Build e Deploy

## 📋 Antes de Buildar

- [ ] Código sem erros de TypeScript: `npm run type-check`
- [ ] Código sem erros de Lint: `npm run lint`
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Tabela `profiles` criada no Supabase
- [ ] Trigger `handle_new_user` configurado no Supabase
- [ ] Deep link testado: `onsitecalculator://auth-callback`

## 🔧 Setup do Supabase (Apenas 1x)

Execute este SQL no Supabase:

```sql
-- 1. Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  nome TEXT,
  trade TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '6 months'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, nome, trade, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    CONCAT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
    NEW.raw_user_meta_data->>'trade',
    'trialing',
    NOW() + INTERVAL '6 months'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🚀 Build Android

### Método Rápido (Recomendado):
```bash
build-android.bat
```
Depois no Android Studio: **Run** (▶️)

### Ou via Linha de Comando:
```bash
build-apk.bat
install-to-phone.bat
```

## 📱 Teste no Celular

### Funcionalidades para testar:

- [ ] **Login/Signup**
  - [ ] Criar nova conta
  - [ ] Fazer login
  - [ ] Logout

- [ ] **Calculadora**
  - [ ] Cálculos normais (ex: `5 + 3`)
  - [ ] Frações (ex: `1/2 + 1/4`)
  - [ ] Feet/Inches (ex: `1' 6" + 5 3/4"`)
  - [ ] Mixed numbers (ex: `5 1/2`)

- [ ] **Voice Feature (sem assinatura)**
  - [ ] Clicar no botão de voz
  - [ ] Modal de upgrade aparece
  - [ ] Botão "Start Free Trial" funciona

- [ ] **Checkout Flow**
  - [ ] Abre navegador externo
  - [ ] URL correta: `https://auth.onsiteclub.ca/checkout/premium`
  - [ ] Parâmetros corretos na URL

- [ ] **Deep Link (após checkout)**
  - [ ] App recebe callback
  - [ ] Perfil atualizado
  - [ ] Voice liberado

## 🧪 Testar Deep Link Manualmente

```bash
# No Windows (com celular conectado):
adb shell am start -a android.intent.action.VIEW -d "onsitecalculator://auth-callback?access_token=test&refresh_token=test"

# Deve:
# 1. Abrir o app
# 2. Logar no console: "[DeepLink] App opened with URL"
```

## 🔗 Integração com Checkout

No projeto `onsite-auth`, após sucesso do Stripe:

```typescript
const redirectUrl = searchParams.get('redirect');
const { access_token, refresh_token } = session;

if (redirectUrl?.startsWith('onsitecalculator://')) {
  const url = new URL(redirectUrl);
  url.searchParams.set('access_token', access_token);
  url.searchParams.set('refresh_token', refresh_token);

  window.location.href = url.toString();
}
```

## 📊 Verificar no Supabase

Após criar uma conta, verifique no Supabase:

```sql
-- Ver perfil criado
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;

-- Ver subscription_status
SELECT email, subscription_status, trial_ends_at FROM profiles;
```

## 🐛 Debug

### Ver logs do app:
```bash
npm run android:logs

# Ou:
adb logcat -s "Capacitor:*" "chromium:*" "Console:*"
```

### Ver erros específicos:
```bash
adb logcat | grep -i "error"
adb logcat | grep -i "auth"
adb logcat | grep -i "supabase"
```

## 📦 Deploy Final

### Build de Release:

1. **Criar Keystore** (apenas 1x):
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configurar `android/app/build.gradle`**:
```gradle
signingConfigs {
    release {
        storeFile file('../../my-release-key.keystore')
        storePassword 'SUA_SENHA'
        keyAlias 'my-key-alias'
        keyPassword 'SUA_SENHA'
    }
}
```

3. **Build Release**:
```bash
cd android
gradlew assembleRelease
```

4. **APK de produção estará em**:
`android/app/build/outputs/apk/release/app-release.apk`

## 🎯 Checklist Pré-Deploy

- [ ] Todas as funcionalidades testadas
- [ ] Deep link funcionando
- [ ] Login/Signup funcionando
- [ ] Voice modal aparece corretamente
- [ ] Checkout abre no navegador
- [ ] Sem erros no console
- [ ] Performance OK (sem travamentos)
- [ ] APK gerado com sucesso
- [ ] APK testado em dispositivo real

## 📱 Publicar na Play Store

1. Build Release (acima)
2. Criar conta no Google Play Console
3. Criar novo app
4. Upload do APK/AAB
5. Configurar listing (descrição, screenshots)
6. Definir classificação de conteúdo
7. Submeter para revisão

---

**Checklist completo! Boa sorte no deploy! 🚀**
