# 💰 SmartPaisa

> **"Spend Smart. Save More."**

AI-powered finance management app for students, bachelors, and people living away from home. Built with React Native + Expo SDK 56 and Supabase.

![SmartPaisa](https://img.shields.io/badge/SmartPaisa-v1.0.0-0D8C4C?style=for-the-badge)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge)

---

## ✨ Features

### Core Features
- 📊 **Smart Dashboard** — Monthly allowance, spending overview, budget health meter, AI insights
- 💸 **Expense Management** — Add/edit/delete transactions with categories, payment methods, receipts
- 👥 **Group Splits** — Splitwise-like bill splitting with debt simplification algorithm
- 🔮 **Savings Predictor** — AI-powered budget simulation with interactive category sliders
- 🔄 **Monthly Reset** — Auto-reset allowance with carry-forward and manual adjustments

### Gamification
- 🏆 **No-Spend Challenges** — Streak tracking, XP system, motivational messages
- 🎖️ **AI Badges** — Dynamic badge system with glow effects and milestones
- 📈 **Financial Health Score** — 0-100 gauge with personalized recommendations

### Special Features
- 🚨 **Emergency SOS Mode** — Survival budget, essential-only spending, glowing SOS button
- 📝 **Digital Ledger** — Freeform notes, checklists, pin/search functionality
- 📊 **Analytics & Reports** — Pie charts, trend lines, weekly heatmaps, category comparisons
- 🤖 **AI Smart Insights** — Rule-based spending analysis with actionable tips
- 🌙 **Dark Mode** — Full dark theme support

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native + Expo SDK 56 |
| **Routing** | Expo Router (file-based) |
| **State** | Zustand + AsyncStorage persistence |
| **Backend** | Supabase (Auth, PostgreSQL, Storage) |
| **Charts** | react-native-gifted-charts |
| **Animations** | react-native-reanimated |
| **Typography** | Poppins (Google Fonts) |
| **Validation** | react-hook-form + Zod |
| **Language** | TypeScript |

---

## 📁 Project Structure

```
SmartPaisa/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── _layout.tsx         # Root layout (fonts, providers)
│   │   ├── index.tsx           # Entry redirect
│   │   ├── (auth)/             # Auth screens
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   └── forgot-password.tsx
│   │   └── (tabs)/             # Main tab screens
│   │       ├── index.tsx       # Dashboard
│   │       ├── transactions.tsx
│   │       ├── groups.tsx
│   │       ├── savings.tsx
│   │       ├── analytics.tsx
│   │       └── settings.tsx
│   ├── components/
│   │   ├── ui/                 # Design system (Card, Button, Input...)
│   │   ├── charts/             # Chart components
│   │   └── dashboard/          # Dashboard widgets
│   ├── stores/                 # Zustand state management
│   ├── services/               # Supabase client
│   ├── utils/                  # Business logic engines
│   ├── hooks/                  # Custom React hooks
│   ├── constants/              # Theme, categories, badges
│   └── types/                  # TypeScript interfaces
├── supabase/
│   └── migrations/             # SQL database schema
├── assets/                     # Images, fonts
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
└── .env.example                # Environment variables template
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) — for APK builds
- Android Studio (optional, for emulator)

### 1. Clone & Install

```bash
git clone <repository-url>
cd SmartPaisa
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** The app works in **demo mode** without Supabase credentials — all data is stored locally with sample data preloaded.

### 3. Setup Supabase (Optional)

1. Create a [Supabase project](https://supabase.com)
2. Go to SQL Editor → paste contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration
4. Copy your project URL and anon key to `.env`
5. Enable Google OAuth in Authentication → Providers

### 4. Run the App

```bash
# Start development server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator (macOS only)
npx expo start --ios
```

---

## 📱 APK Build

### Quick APK (for testing)

```bash
# Login to Expo
eas login

# Build APK
eas build -p android --profile preview
```

The APK download link will appear in your terminal and at [expo.dev](https://expo.dev).

### Production Build

```bash
# Build AAB for Google Play
eas build -p android --profile production

# Submit to Play Store
eas submit -p android --profile production
```

### EAS Build Profiles

| Profile | Output | Usage |
|---|---|---|
| `development` | Dev client | Development with hot reload |
| `preview` | APK | Testing on devices |
| `production` | AAB | Google Play Store |

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|---|---|---|
| Primary Green | `#0D8C4C` | Headers, CTAs, active states |
| Secondary Green | `#22C55E` | Success, positive values |
| Accent Orange | `#F4A261` | Warnings, highlights, badges |
| Background | `#F8FAFC` | Light mode background |
| Dark Background | `#0F172A` | Dark mode background |
| Emergency Red | `#FF5A5A` | SOS, over-budget alerts |

### Typography
- **Font:** Poppins (Regular, Medium, SemiBold, Bold)
- **Scale:** 10px — 40px

---

## 🗄 Database Schema

The app uses Supabase (PostgreSQL) with Row Level Security:

- **profiles** — User profiles with budget settings
- **transactions** — Income/expense records
- **budgets** — Monthly budget cycles
- **groups** / **group_members** — Split groups
- **group_expenses** / **expense_splits** — Shared expenses
- **challenges** — No-spend challenge tracking
- **badges** — Achievement system
- **notes** — Digital ledger entries

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

---

## 🧪 Demo Account

The app ships with demo data. Simply tap **Sign In** with any email/password to see the full dashboard with:

- ₹15,000 monthly allowance
- 14 sample transactions across all categories
- 2 groups (Flatmates, Goa Trip)
- 1 active challenge (No Food Delivery)
- 4 unlocked badges
- Sample notes

---

## 📋 Key Algorithms

### Debt Simplification
Uses a net-balance greedy algorithm to minimize the number of transactions needed to settle group debts. See `src/utils/debtSimplification.ts`.

### Savings Engine
Projects month-end savings based on current spending velocity, with interactive category reduction sliders. See `src/utils/savingsEngine.ts`.

### AI Insight Engine
Rule-based pattern matching on spending data to generate personalized financial insights. See `src/utils/insightEngine.ts`.

---

## 🔧 Configuration

### app.json
- Package: `com.smartpaisa.app`
- Orientation: Portrait only
- Typed routes enabled
- React Compiler enabled

### eas.json
- Preview profile generates `.apk` files
- Production profile generates `.aab` files

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for financial discipline.
