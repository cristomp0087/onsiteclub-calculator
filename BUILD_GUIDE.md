# 📱 Guia de Build para Android

## 🚀 Métodos Disponíveis

### **Método 1: Script Automático** ⭐ (Mais Fácil)

Basta executar o script e pronto!

#### **Windows:**
```bash
# Duplo clique no arquivo ou execute:
build-android.bat
```

#### **Linux/Mac:**
```bash
chmod +x build-android.sh
./build-android.sh
```

**O que o script faz:**
1. ✅ Build da aplicação web (React + Vite)
2. ✅ Sincroniza com Capacitor
3. ✅ Copia assets para Android
4. ✅ Abre Android Studio automaticamente

**Depois no Android Studio:**
- Clique em `Run` (▶️) para instalar no celular conectado
- Ou `Build > Build APK` para gerar o arquivo APK

---

### **Método 2: Build Completo via Linha de Comando** 🤖

Gera o APK sem abrir o Android Studio!

```bash
# Windows
build-apk.bat

# Ou via npm
npm run android:apk
```

**Resultado:**
- APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`
- Tamanho: ~15-20 MB

---

### **Método 3: Instalar Direto no Celular** 📲

```bash
# 1. Conecte o celular via USB
# 2. Ative a depuração USB no celular
# 3. Execute:

install-to-phone.bat

# Ou via npm:
npm run android:install
```

**Requisitos:**
- ADB instalado (vem com Android Studio)
- Celular conectado via USB
- Depuração USB ativada

---

### **Método 4: Deploy Completo** 🚢 (Recomendado para Produção)

Faz tudo: verifica código, builda, instala e inicia logs!

```bash
deploy.bat
```

**O que faz:**
1. ✅ Type check (TypeScript)
2. ✅ Lint (ESLint)
3. ✅ Build web
4. ✅ Sync Capacitor
5. ✅ Build APK
6. ✅ Instala no celular (se conectado)
7. ✅ Mostra logs em tempo real

---

## 📋 Comandos NPM Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Servidor de desenvolvimento (web)
npm run build               # Build de produção
npm run type-check          # Verifica erros TypeScript
npm run lint                # Verifica código

# Android (Android Studio)
npm run android:build       # Build + Sync + Abre Android Studio

# Android (Linha de Comando)
npm run android:apk         # Gera APK via Gradle
npm run android:install     # Instala APK no celular via ADB
npm run android:logs        # Mostra logs do app no celular

# Capacitor
npm run cap:sync           # Sincroniza web → Android
npm run cap:android        # Abre Android Studio
```

---

## 🔧 Setup Inicial (Primeira Vez)

### 1. Instale as Dependências
```bash
npm install
```

### 2. Configure as Variáveis de Ambiente
```bash
# Já está configurado em .env.local
# Verifique se as chaves do Supabase estão corretas
```

### 3. Adicione a Plataforma Android (se necessário)
```bash
npx cap add android
```

### 4. Sincronize pela Primeira Vez
```bash
npm run build
npx cap sync android
```

---

## 📱 Instalar no Celular

### Via Android Studio (Método Visual):
1. Execute: `build-android.bat`
2. No Android Studio, conecte o celular via USB
3. Clique no botão **Run** (▶️) no topo
4. Selecione seu dispositivo
5. Aguarde a instalação

### Via ADB (Linha de Comando):
```bash
# 1. Verifique se o celular está conectado
adb devices

# 2. Instale o APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 3. Inicie o app
adb shell am start -n ca.onsiteclub.calculator/.MainActivity

# 4. Veja os logs
adb logcat -s "Capacitor:*" "chromium:*"
```

---

## 🐛 Troubleshooting

### APK não gera:
```bash
# Limpe o build
cd android
gradlew clean
cd ..

# Build novamente
npm run android:apk
```

### Android Studio não abre:
```bash
# Configure o path do Android Studio manualmente
# Edite capacitor.config.ts e adicione:
android: {
  androidStudioPath: 'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe'
}
```

### ADB não encontrado:
```bash
# Adicione ao PATH do Windows:
# C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk\platform-tools

# Ou instale via:
# https://developer.android.com/studio/releases/platform-tools
```

### Erro de build "No signing config":
```bash
# Use Debug build (não requer assinatura):
cd android
gradlew assembleDebug
```

### Deep Link não funciona:
1. Certifique-se de reinstalar o app após modificar o `AndroidManifest.xml`
2. Teste com: `adb shell am start -a android.intent.action.VIEW -d "onsitecalculator://auth-callback"`

---

## 📦 Gerar APK de Release (Produção)

### 1. Crie uma Keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure em `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=***
MYAPP_RELEASE_KEY_PASSWORD=***
```

### 3. Build Release:
```bash
cd android
gradlew assembleRelease
```

**APK estará em:**
`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔗 Links Úteis

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [ADB Platform Tools](https://developer.android.com/studio/releases/platform-tools)
- [Configurar Depuração USB](https://developer.android.com/studio/debug/dev-options)

---

## ⚡ Atalhos Rápidos

```bash
# Build rápido para desenvolvimento
npm run build && npx cap sync android && npx cap open android

# Build + Instalar no celular
build-apk.bat
install-to-phone.bat

# Deploy completo (recomendado)
deploy.bat

# Ver logs do app rodando
npm run android:logs
```

---

**OnSite Club © 2025**
