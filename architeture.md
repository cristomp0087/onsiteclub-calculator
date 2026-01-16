# OnSite Calculator — Arquitetura v4.0 (Full System Map)

**STATUS:** ✅ Mapeamento completo (Core + Hooks + UI + Auth/Paywall + Voz + Android Native)
**ÚLTIMA ATUALIZAÇÃO:** 2026-01-16
**OBJETIVO:** Documentação técnica profunda para **evitar duplicação de lógica**, garantir consistência e permitir que uma IA faça alterações sem criar "arquiteturas paralelas".

---

## Como usar este documento com IA
- **Antes de alterar qualquer código**, a IA deve ler este documento inteiro.
- **Regra de ouro:** lógica de cálculo fica no Core Engine; UI não “inventa cálculo”.
- Qualquer mudança deve respeitar: **Single Source of Truth**, **contratos de tipos**, e **guardas de backend (modo Dev)**.

---

## 1) Visão geral do produto

### O que é
**OnSite Calculator** é uma calculadora para trabalhadores da construção civil que resolve:
- **Matemática normal (decimal)**: `12.5 * 3`, `100/4`, etc.
- **Medidas de obra (feet/inches e frações)**: `1' 6 1/2" + 5 3/4"`, com arredondamento padrão (**1/16**).
- **Entrada por voz (IA)**: o usuário fala (“one foot six and a half plus five and three quarters”), o sistema:
  1) transcreve (IA),
  2) interpreta para expressão,
  3) envia para o mesmo motor `calculate()`.

### Para quem
- Carpinteiros, framers, drywall, flooring, eletricistas e qualquer pessoa que precisa de **medidas rápidas e confiáveis** no canteiro.

### Modelo de monetização (Freemium)
| Tier | Acesso | O que libera |
|---|---|---|
| **Free** | sem login (modo local) | cálculo manual completo (decimal + inches) |
| **Voice (Pago)** | requer login + assinatura ativa | gravação por voz + transcrição + parsing + cálculo |

---

## 2) 🧭 Mapa de UI e fluxos principais

### Telas / Componentes macro
| Tela / Módulo | Arquivo | Responsabilidade |
|---|---|---|
| **Calculator (principal)** | `src/components/Calculator.tsx` | Container: header + display + teclado + card de voz |
| **Auth (login/signup)** | `src/components/AuthScreen.tsx` | Auth e criação de perfil |
| **Paywall voz** | `src/components/VoiceUpgradePopup.tsx` | Bloqueio premium + redirect Stripe |
| **App Shell** | `App.tsx` (ou equivalente) | Decide fluxo: modo dev vs auth vs calculadora |

### 2.1 Header (Cabeçalho)
**Responsabilidade**: Branding e status do usuário

**Elementos**:
- **Logo OnSite Club** (esquerda):
  - Arquivo: `public/images/onsite-club-logo.png`
  - Clicável: Abre https://onsiteclub.ca com confirmação
  - Estilo: `height: 40px`, `cursor: pointer`

- **User Info** (direita):
  - Badge com nome do usuário (quando logado)
  - Badge "Offline" (quando sem conexão)

**Estilo**:
- Background: `#FFFFFF` (branco)
- Border bottom: `1px solid rgba(209, 213, 219, 0.5)`
- Padding: `8px 12px`

**Documentação completa**: Ver `HEADER_CHANGES.md`

### Fluxo do usuário (alto nível)
1) Abre o app → usa calculadora **sem login** (Free).
2) Clica no microfone → se não logado/sem assinatura → abre **Paywall**.
3) Login/signup → se assinatura ativa → grava voz → processa → calcula → exibe.

---

## 3) 🧩 Layouts (wireframes ASCII)

### 3.1 Calculator (tela principal)
```
┌─────────────────────────────────────────────┐
│ HEADER (branco)                             │
│ [Logo OnSite]         [User] [Offline?]    │
├─────────────────────────────────────────────┤
│ Display (grande) [displayValue]             │
│ Expression (pequeno) [expression]           │
├─────────────────────────────────────────────┤
│ LEFT CARD (Voice) │ RIGHT CARD (Keypad)    │
│ 🎙 Mic Button     │ FRACTION_PAD           │
│ VoiceState badge  │ 1/8 1/4 3/8 1/2        │
│ Paywall / Active  │ 5/8 3/4 7/8 'ft        │
│                   │ ─────────────────      │
│                   │ C  ⌫  %  ÷             │
│                   │ 7  8  9  ×             │
│                   │ 4  5  6  -             │
│                   │ 1  2  3  +             │
│                   │ 0  .  =                │
└─────────────────────────────────────────────┘
```

### 3.2 AuthScreen (Login/Signup)
```
┌──────────────────────────────┐
│ Email                        │
│ Password                     │
│ Trade (dropdown)             │
│ Name                         │
│ [Login] [Sign Up]            │
└──────────────────────────────┘
```

---

## 4) 🎨 Design System e estilos

### 4.1 Arquitetura de estilos
**Arquivo principal:** `src/styles/App.css` (arquivo único consolidado)

### 4.2 Paleta de Cores (OnSite Club Brand)
O projeto utiliza as **cores oficiais da marca OnSite Club**:

**Cores Principais**
- **Amarelo OnSite**: `#FDB913` - Ações principais (botão de voz, 'ft, destaques)
- **Azul Petróleo OnSite**: `#2C5F5D` - Operadores matemáticos e botão igual
- **Azul Petróleo Escuro**: `#234E4C` - Hover dos botões de operação

**Cores de Fundo**
- **App Background**: `#F8F9FA` - Cinza muito claro
- **Header**: `#FFFFFF` - Branco
- **Cards**: `#FFFFFF` - Branco com sombra `0 1px 3px rgba(0, 0, 0, 0.1)`
- **Display Box**: `#F9FAFB` - Cinza claríssimo
- **Expression Input**: `#FFFFFF` - Branco
- **Fraction Container**: `#FEF3C7` - Amarelo muito claro

**Cores de Botões**
- **Numéricos**: Background `#F3F4F6`, Border `#D1D5DB`, Texto `#1F2937`
- **Operadores (÷×+-%)**`: Background `#2C5F5D`, Texto `#FFFFFF`
- **Igual (=)**: Background `#2C5F5D`, Texto `#FFFFFF`
- **C/Backspace**: Background `#E5E7EB`, Texto `#6B7280`
- **Frações**: Background `#FFFFFF`, Border `#D1D5DB`
- **Botão 'ft**: Background `#FDB913`, Texto `#FFFFFF`
- **Botão de Voz**: Background `#FDB913`, Listening: `#2C5F5D`

**Cores de Texto**
- **Principal**: `#111827` - Preto suave
- **Secundário**: `#374151` - Cinza escuro
- **Placeholder**: `#9CA3AF` - Cinza médio
- **Memory**: `#6B7280` - Cinza médio

**Documentação completa**: Ver `COLOR_THEME.md` na raiz do projeto

### 4.3 Tema Visual
- **Modo**: Light (tema claro profissional)
- **Contraste**: Alto contraste para acessibilidade
- **Transições**: `0.15s - 0.2s` para interações suaves
- **Bordas**: `1-2px` sólidas com cantos arredondados `8-12px`
- **Sombras**: Sutis para profundidade (`0 1px 3px rgba(0, 0, 0, 0.1)`)

### 4.4 Regras de Estilo
- **Single File**: Todos os estilos em `src/styles/App.css`
- **Mobile First**: Media queries para desktop (`@media (min-width: 768px)`)
- **Responsivo**: Ajustes específicos para telas pequenas (`@media (max-height: 700px)`)
- **Estados**: Focus, hover, active, disabled claramente definidos
- **Consistência**: Cores da marca OnSite Club em todos os elementos interativos

---

## 5) 🧠 CORE ENGINE (`src/lib/calculator/`)

### Princípio
O motor de cálculo é **isolado da UI**. Ele **não sabe o que é React**.

- **Arquivo principal:** `src/lib/calculator/engine.ts`
- **Exportador público:** `src/lib/calculator/index.ts`

### 5.1 Ponto de entrada único
A função **`calculate(expr: string)`** é o **único** ponto de entrada para processar inputs.

### 5.2 Fluxo de decisão (calculate)
**Objetivo:** decidir o “modo de operação” com base na string.

1) **Detecção (inch mode)**  
Regex: `/'|"|\d+\/\d+/`  
- Encontrou `'` ou `"` ou fração `1/2` → **modo construção**  
- Caso contrário → tenta **modo matemático puro**

2) **Modo Matemático Puro**
- Chama `calculatePureMath()` (ou equivalente)
- Retorno: `isInchMode: false`

3) **Modo Construção (Inches)**
- `tokenize()` → tokens seguros
- `evaluateTokens()` → resolve expressão (PEMDAS)
- `formatInches()` → formata resultado (arredondamento 1/16)
- Retorno: `isInchMode: true`

### 5.3 Mapa de funções (API)
| Função | Parâmetros | Retorno | Responsabilidade |
|---|---|---|---|
| `calculate` | `expr: string` | `CalculationResult \| null` | **Orquestrador principal** (sempre use) |
| `parseToInches` | `str: string` | `number` | Converte `"1' 6 1/2"` → `18.5` |
| `formatInches` | `val: number` | `string` | `18.5` → `"1' 6 1/2\""` (1/16) |
| `formatTotalInches` | `val: number` | `string` | `18.5` → `"18 1/2 In"` |
| `formatNumber` | `val: number` | `string` | Formata decimal sem zeros inúteis |
| `tokenize` | `expr: string` | `string[]` | Parser léxico seguro |
| `evaluateTokens` | `tokens: string[]` | `number` | Engine matemática (pilha PEMDAS) |

---

## 6) 🪝 Hooks & State (`src/hooks/`)

### Papel desta camada
É a ponte entre **React** e o **Core Engine**.

### 6.1 Hook principal: `useCalculator()`
**Arquivo:** `src/hooks/useCalculator.ts`  
**Regra:** não adicione lógica de cálculo aqui — somente estado e UX de input.

**Estado**
- `expression`: string bruta digitada (`"1' + 5"`)
- `displayValue`: valor no display grande (resultado atual/parcial)
- `lastResult`: `CalculationResult` completo da última conta válida
- `justCalculated`: flag para decidir se o próximo dígito limpa ou concatena

**Ações**
- `compute()`:
  - chama `engine.calculate(expression)`
  - atualiza `displayValue` e `lastResult`
- `appendFraction(frac)`:
  - suporta mixed numbers: `"5" + "1/2"` → `"5 1/2"`
- `appendOperator(op)`:
  - concatenação segura de operadores
  - uso de resultado anterior (Ans), se aplicável

### 6.2 Hooks auxiliares

**`useAuth` (Autenticação)**
- **Arquivo**: `src/hooks/useAuth.ts`
- **Responsabilidade**: Gerenciar estado de autenticação e perfil do usuário
- **Estado**:
  - `user`: Usuário autenticado (Supabase)
  - `profile`: Perfil completo do banco
  - `hasVoiceAccess`: Flag calculada (assinatura ativa ou trial válido)
  - `loading`: Estado de carregamento
- **Ações**:
  - `signIn()`: Login com email/senha
  - `signUp()`: Criar conta
  - `signOut()`: Logout
  - `refreshProfile()`: Atualizar perfil após checkout
- **⚠️ Importante (v4.0)**:
  - useEffect com `[]` (sem dependências) para evitar loops infinitos
  - Listener `onAuthStateChange` simplificado:
    - `SIGNED_OUT`: Limpa estado imediatamente
    - `SIGNED_IN`: Chama `loadSession()` para recarregar
    - Outros eventos são ignorados
  - `refreshProfile` não tem dependências para evitar re-renders
  - Verificação de `hasVoiceAccess` usa apenas Supabase (tabela `subscriptions`)

**`useDeepLink` (Deep Linking)**
- **Arquivo**: `src/hooks/useDeepLink.ts`
- **Responsabilidade**: Capturar URLs de retorno (OAuth, Stripe)
- **⚠️ Importante**:
  - Usa `useRef` para callback evitando re-registro de listeners
  - useEffect com `[]` (sem dependências)
  - Só ativo em plataforma nativa (Capacitor)

**`useVoiceRecorder` (Gravação de Voz)** - SPEC V7
- **Arquivo**: `src/hooks/useVoiceRecorder.ts`
- **Responsabilidade**: MediaRecorder, blobs, permissões
- **Estado**: `VoiceState = 'idle' | 'recording' | 'processing'`
- **Fluxo simplificado (v4.0)**:
  1. `startRecording()`: Solicita microfone, cria MediaRecorder, inicia gravação
  2. `stopRecording()`: Para gravação, gera Blob, chama `onRecordingComplete`
  3. Blob enviado para API `/api/interpret`
- **⚠️ Importante**:
  - Não usa `timeslice` no MediaRecorder (coleta chunks via `ondataavailable`)
  - Limpa stream após parar (`track.stop()`)
  - Formato de saída: `audio/webm`

**`useOnlineStatus` (Status de Conexão)**
- **Responsabilidade**: Listeners `window.online/offline`
- **Uso**: Desabilita features que dependem de API (voz)

---

## 7) 🎙️ Sistema de Voz (IA) — SPEC V7

### Objetivo
Transformar voz em expressão válida **sem bypassar o motor**.

### 7.1 Pipeline Completo (v4.0)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RECORD    │───▶│  WHISPER    │───▶│   GPT-4o    │───▶│  CALCULATE  │
│  (WebM)     │    │ (Transcrição)│    │  (Parse)    │    │  (Engine)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     App                API                 API               App
```

1. **Record** (App - `useVoiceRecorder`):
   - Usuário segura botão → `startRecording()`
   - Solta botão → `stopRecording()` → Blob WebM

2. **Upload** (App - `Calculator.tsx`):
   - `handleAudioUpload()` envia FormData para API
   - Endpoint: `https://calculator.onsiteclub.ca/api/interpret` (nativo) ou `/api/interpret` (web)

3. **Transcribe** (API - `api/interpret.ts`):
   - OpenAI Whisper (`whisper-1`)
   - Prompt otimizado para português/inglês
   - Retorna texto transcrito

4. **Parse** (API - `api/interpret.ts`):
   - OpenAI GPT-4o (não mini!)
   - System prompt SPEC V7 (multilíngue)
   - Retorna JSON: `{"expression": "5 1/2 + 3 1/4"}`

5. **Calculate** (App - `useCalculator`):
   - `setExpressionAndCompute(expression)`
   - Engine calcula e atualiza display

### 7.2 API Endpoint (`api/interpret.ts`)

**Localização**: `api/interpret.ts` (Vercel Serverless Function)

**Configuração**:
- Modelo Whisper: `whisper-1`
- Modelo GPT: `gpt-4o` (temperature: 0)
- CORS: Permite origens do app + Capacitor

**System Prompt SPEC V7**:
```
You are a parser for a construction calculator.
Convert spoken phrases into mathematical expressions.
Return ONLY valid JSON: {"expression":"..."}

FORMAT RULES:
- Operators: + - * /
- Fractions: 1/2, 3/8, 1/16 (NO spaces around /)
- Mixed numbers: whole SPACE fraction → "5 1/2", "3 3/4"
- Feet: apostrophe → "2'" or "2' 6"

LANGUAGE (PT/EN/ES/FR):
- "cinco e meio" / "five and a half" → "5 1/2"
- "três pés e duas" / "three feet two" → "3' 2"

FIX COMMON SPEECH ERRORS:
- "103/8" → "10 3/8" (missing space)
- "51/2" → "5 1/2"
```

### 7.3 Estados da Voz
```
idle → recording → processing → idle
         ↓              ↓
      (gravando)    (API call)
```

### 7.4 Botão de Voz (UX)

**Estados visuais**:
- `idle`: "Hold to Speak" + ícone microfone
- `recording`: "Listening..." + círculo preenchido (amarelo)
- `processing`: "Processing..." + spinner

**Regras de UX**:
- Botão NÃO move durante interação (`min-height: 48px`, sem transform)
- `touch-action: none` para evitar conflitos
- Eventos: `onTouchStart/End`, `onMouseDown/Up/Leave`

### 7.5 Regras
- A voz **não calcula**. A voz **só gera expressão**.
- A expressão final sempre passa por `calculate()` (fonte única).
- API endpoint varia: nativo usa URL completa, web usa path relativo.

---

## 8) 🔐 Auth, Dados e Paywall (Supabase + Stripe)

### 8.1 Supabase client (modo dev)
**Arquivo:** `src/lib/supabase.ts`

**Env vars**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Regra:** `isSupabaseEnabled()` retorna `false` se faltar chave → o app deve funcionar em modo local (sem login).

### 8.2 Tipos de dados (profiles)
**Tabela referência:** `profiles` (Supabase)

```ts
export interface UserProfile {
  id: string;
  email: string;
  trade: string; // profissão
  subscription_status: 'trialing' | 'active' | 'canceled';
  trial_ends_at: string;
}
```

### 8.3 Tabela `subscriptions` (Verificação de Acesso)

**Estrutura**:
```ts
interface SubscriptionData {
  id: string;
  user_id: string;           // UUID do Supabase Auth
  app: string;               // 'calculator'
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'inactive';
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}
```

**Verificação de acesso** (`src/lib/subscription.ts`):
- Fonte única: tabela `subscriptions` no Supabase
- Cache local: 5 minutos (memória + Capacitor Preferences)
- Status válidos: `active` ou `trialing`
- Também verifica `current_period_end` não expirado

### 8.4 Gate do Voice (pago)

**Onde aplicar**:
- `Calculator.tsx` recebe `hasVoiceAccess` e `voiceState`
- Se não tiver acesso → botão de mic abre `VoiceUpgradePopup.tsx`

### 8.5 Checkout Externo

**VoiceUpgradePopup.tsx**:
- URL: `https://auth.onsiteclub.ca/checkout/calculator`
- Parâmetros enviados:
  - `user_id`: UUID do Supabase (identificador único e seguro)
  - `prefilled_email`: Email para pré-preencher formulário
  - `redirect`: `onsitecalculator://auth-callback`

**Fluxo**:
1. Usuário clica "Start Free Trial"
2. Abre browser externo com URL do checkout
3. Usuário completa pagamento no `auth.onsiteclub.ca`
4. Checkout grava na tabela `subscriptions` usando `user_id`
5. Redirect via deep link para o app
6. App verifica `subscriptions` e libera Voice

**⚠️ Importante**: O `user_id` é o identificador seguro. O checkout DEVE usar esse ID para associar a compra ao usuário correto.

## 9) 📦 Tipagem global (`src/types/calculator.ts`)

Contratos compartilhados entre engine e UI.

```ts
export interface CalculationResult {
  resultFeetInches: string;  // "1' 6 1/2\""
  resultTotalInches: string; // "18 1/2 In"
  resultDecimal: number;     // 18.5
  expression: string;        // histórico normalizado
  isInchMode: boolean;       // UI decide régua vs decimal
}

export type VoiceState = 'idle' | 'recording' | 'processing';
```

---

## 10) ⚙️ Fluxo de dados (Data Flow) — exemplo real

1. Usuário clica em `1/2"` no `Calculator.tsx`
2. Calculator chama `appendFraction("1/2\"")` do hook `useCalculator`
3. `useCalculator` atualiza `expression` (ex.: `"5"` → `"5 1/2"`)
4. Usuário clica `=`
5. `compute()` chama `engine.calculate("5 1/2")`
6. `engine.ts` detecta fração → modo inches → retorna `CalculationResult`
7. `useCalculator` atualiza `displayValue` e `lastResult`
8. UI renderiza o valor final no display

---

## 11) 🗺️ Mapa do repositório (Repo Map)

| Pasta/Arquivo | Papel | Não deve conter |
|---|---|---|
| `src/lib/calculator/` | motor puro (tokens, eval, formatadores) | estado React, UI, hooks |
| `src/hooks/` | estado e UX de input | regras matemáticas "novas" |
| `src/components/` | render e composição | lógica de cálculo e parsing de inches |
| `src/lib/supabase.ts` | client + guard dev | UI, lógica de paywall |
| `src/types/` | contratos compartilhados | lógica, side effects |

---

## 12) ⚠️ Regras de manutenção (Rules for AI)

1. **Não mexa em engine.ts para formatação visual de UI.**
   Se precisar mudar aparência do resultado, altere `formatInches` / `formatNumber` ou crie `formatter.ts` dentro do core, mantendo matemática pura.

2. **Auth opcional obrigatório:** qualquer código que use user/supabase precisa de guardas:
   ```ts
   if (!supabase) return;
   ```
   O app deve funcionar localmente.

3. **Single Source of Truth:** o estado da calculadora vive somente em `useCalculator`.
   Não crie `useState` paralelo de `expression` dentro de `Calculator.tsx`.

4. **Consistência de tipos:** sempre use `CalculationResult` para transportar resultados.
   Não passe strings soltas como "resultado".

5. **Voz não calcula:** voz gera texto → expressão → `calculate()`.

6. **Evitar loops infinitos em hooks:**
   - `useEffect` com `[]` quando não precisa de dependências
   - Não fazer async operations dentro de listeners do Supabase
   - Usar flags (`isChecking`) para evitar chamadas simultâneas

---

## 13) 🧱 Roadmap e Changelog

### Roadmap (curto)
- [ ] Documentar tabela/políticas do Supabase (se houver RLS)
- [ ] Documentar fluxo Stripe → atualização subscription_status (webhook/backend)
- [ ] Padronizar parsing de voz em módulo único (evitar regex solta na UI)

### Changelog

**v4.0 (2026-01-16) - Auth & Subscription Simplification**
- ✅ **Fix: Loop Infinito de Login Resolvido**:
  - `useAuth.ts`: Listener `onAuthStateChange` simplificado
  - Agora processa apenas `SIGNED_OUT` (limpa estado) e `SIGNED_IN` (recarrega sessão)
  - Evita async operations dentro do listener que causavam re-renders

- ✅ **Subscription Simplificado**:
  - Removida dependência do Auth Hub API externo
  - Fonte única de verdade: tabela `subscriptions` no Supabase
  - Cache local de 5 minutos (memória + Capacitor Preferences)
  - Flag `isChecking` para evitar chamadas simultâneas

- ✅ **Identificação Segura no Checkout**:
  - `VoiceUpgradePopup.tsx` agora envia `user_id` (UUID Supabase)
  - Parâmetros: `user_id`, `prefilled_email`, `redirect`
  - Checkout usa `user_id` para associar compra ao usuário correto

- ✅ **Display de Resultados**:
  - `engine.ts`: Resultados inteiros agora mostram conversão feet/inches
  - Exemplo: `12 + 15 = 27` exibe `2' 3"` no display principal
  - `isInchMode: true` sempre para mostrar ambos os formatos

- ✅ **Arquitetura Documentada**:
  - Pipeline de voz completo (Record → Whisper → GPT-4o → Calculate)
  - Estrutura da tabela `subscriptions`
  - Fluxo de checkout externo documentado

**v3.2 (2026-01-15) - UI Redesign & Branding**
- ✅ **Tema Claro Completo**: Migrado de tema escuro para tema claro profissional
  - Fundo app: `#F8F9FA` (cinza muito claro)
  - Cards: `#FFFFFF` com sombras sutis
  - Display: `#F9FAFB` com bordas claras

- ✅ **Cores da Marca OnSite Club**:
  - Amarelo OnSite `#FDB913` para ações principais (voz, 'ft)
  - Azul Petróleo `#2C5F5D` para operadores matemáticos
  - Alto contraste para acessibilidade

- ✅ **Header Simplificado**:
  - Logo OnSite Club local (`public/images/onsite-club-logo.png`)
  - Logo clicável com confirmação para abrir site
  - Removido texto "OnSite" e "CALCULATOR"
  - Removido botão de logout
  - Badge de usuário e offline apenas

- ✅ **Botões Redesenhados**:
  - Numéricos: Cinza claro `#F3F4F6`
  - Operadores: Azul petróleo `#2C5F5D`
  - Frações: Container amarelo claro `#FEF3C7`
  - Voz: Amarelo OnSite `#FDB913`

- ✅ **Bug Fixes**:
  - Corrigido loop infinito em `useAuth` (dependências vazias)
  - Corrigido loop infinito em `useDeepLink` (useRef para callback)
  - Corrigido `refreshProfile` para evitar re-renders

- ✅ **Documentação**:
  - Criado `COLOR_THEME.md` com paleta completa
  - Criado `HEADER_CHANGES.md` com mudanças do header
  - Atualizado `architeture.md` com novas seções

**v3.0**: Sistema mapeado completo (Core + Hooks + UI + Auth + Voz + Paywall), regras anti-duplicação formalizadas.

---

## 14) 📚 Arquivos de Documentação

**Arquivos principais de documentação**:
- `architeture.md` - Arquitetura completa do sistema (este arquivo)
- `COLOR_THEME.md` - Paleta de cores e design system
- `HEADER_CHANGES.md` - Mudanças específicas do header
- `README.md` - Instruções de setup e uso

**Regra importante**: Antes de fazer alterações significativas, consulte todos os arquivos de documentação relevantes.