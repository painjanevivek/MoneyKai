# ðŸ’° MoneyKai

> **"Spend Smart. Save More."**

AI-powered finance management app for students, bachelors, and people living away from home. Built with React Native + Expo SDK 56 and Supabase.

![MoneyKai](https://img.shields.io/badge/MoneyKai-v1.0.0-0D8C4C?style=for-the-badge)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge)

---

## âœ¨ Features

### Core Features
- ðŸ“Š **Smart Dashboard** â€” Monthly allowance, spending overview, budget health meter, AI insights
- ðŸ’¸ **Expense Management** â€” Add/edit/delete transactions with categories, payment methods, receipts
- ðŸ‘¥ **Group Splits** â€” Splitwise-like bill splitting with debt simplification algorithm
- ðŸ”® **Savings Predictor** â€” AI-powered budget simulation with interactive category sliders
- ðŸ”„ **Monthly Reset** â€” Auto-reset allowance with carry-forward and manual adjustments

### Gamification
- ðŸ† **No-Spend Challenges** â€” Streak tracking, XP system, motivational messages
- ðŸŽ–ï¸ **AI Badges** â€” Dynamic badge system with glow effects and milestones
- ðŸ“ˆ **Financial Health Score** â€” 0-100 gauge with personalized recommendations

### Special Features
- ðŸš¨ **Emergency SOS Mode** â€” Survival budget, essential-only spending, glowing SOS button
- ðŸ“ **Digital Ledger** â€” Freeform notes, checklists, pin/search functionality
- ðŸ“Š **Analytics & Reports** â€” Pie charts, trend lines, weekly heatmaps, category comparisons
- ðŸ¤– **AI Smart Insights** â€” Rule-based spending analysis with actionable tips
- ðŸŒ™ **Dark Mode** â€” Full dark theme support

---

## ðŸ›  Tech Stack

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

## ðŸ“ Project Structure

```
MoneyKai/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                    # Expo Router screens
â”‚   â”‚   â”œâ”€â”€ _layout.tsx         # Root layout (fonts, providers)
â”‚   â”‚   â”œâ”€â”€ index.tsx           # Entry redirect
â”‚   â”‚   â”œâ”€â”€ (auth)/             # Auth screens
â”‚   â”‚   â”‚   â”œâ”€â”€ login.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ signup.tsx
â”‚   â”‚   â”‚   â””â”€â”€ forgot-password.tsx
â”‚   â”‚   â””â”€â”€ (tabs)/             # Main tab screens
â”‚   â”‚       â”œâ”€â”€ index.tsx       # Dashboard
â”‚   â”‚       â”œâ”€â”€ transactions.tsx
â”‚   â”‚       â”œâ”€â”€ groups.tsx
â”‚   â”‚       â”œâ”€â”€ savings.tsx
â”‚   â”‚       â”œâ”€â”€ analytics.tsx
â”‚   â”‚       â””â”€â”€ settings.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ ui/                 # Design system (Card, Button, Input...)
â”‚   â”‚   â”œâ”€â”€ charts/             # Chart components
â”‚   â”‚   â””â”€â”€ dashboard/          # Dashboard widgets
â”‚   â”œâ”€â”€ stores/                 # Zustand state management
â”‚   â”œâ”€â”€ services/               # Supabase client
â”‚   â”œâ”€â”€ utils/                  # Business logic engines
â”‚   â”œâ”€â”€ hooks/                  # Custom React hooks
â”‚   â”œâ”€â”€ constants/              # Theme, categories, badges
â”‚   â””â”€â”€ types/                  # TypeScript interfaces
â”œâ”€â”€ supabase/
â”‚   â””â”€â”€ migrations/             # SQL database schema
â”œâ”€â”€ assets/                     # Images, fonts
â”œâ”€â”€ app.json                    # Expo config
â”œâ”€â”€ eas.json                    # EAS Build profiles
â””â”€â”€ .env.example                # Environment variables template
```

---

## ðŸš€ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) â€” for APK builds
- Android Studio (optional, for emulator)

### 1. Clone & Install

```bash
git clone <repository-url>
cd MoneyKai
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

> **Note:** The app works in **demo mode** without Supabase credentials â€” all data is stored locally with sample data preloaded.

### 3. Setup Supabase (Optional)

1. Create a [Supabase project](https://supabase.com)
2. Go to SQL Editor â†’ paste contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration
4. Copy your project URL and anon key to `.env`
5. Enable Google OAuth in Authentication â†’ Providers

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

## ðŸ“± APK Build

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

## ðŸŽ¨ Design System

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
- **Scale:** 10px â€” 40px

---

## ðŸ—„ Database Schema

The app uses Supabase (PostgreSQL) with Row Level Security:

- **profiles** â€” User profiles with budget settings
- **transactions** â€” Income/expense records
- **budgets** â€” Monthly budget cycles
- **groups** / **group_members** â€” Split groups
- **group_expenses** / **expense_splits** â€” Shared expenses
- **challenges** â€” No-spend challenge tracking
- **badges** â€” Achievement system
- **notes** â€” Digital ledger entries

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

---

## ðŸ§ª Demo Account

The app ships with demo data. Simply tap **Sign In** with any email/password to see the full dashboard with:

- â‚¹15,000 monthly allowance
- 14 sample transactions across all categories
- 2 groups (Flatmates, Goa Trip)
- 1 active challenge (No Food Delivery)
- 4 unlocked badges
- Sample notes

---

## ðŸ“‹ Key Algorithms

### Debt Simplification
Uses a net-balance greedy algorithm to minimize the number of transactions needed to settle group debts. See `src/utils/debtSimplification.ts`.

### Savings Engine
Projects month-end savings based on current spending velocity, with interactive category reduction sliders. See `src/utils/savingsEngine.ts`.

### AI Insight Engine
Rule-based pattern matching on spending data to generate personalized financial insights. See `src/utils/insightEngine.ts`.

---

## ðŸ”§ Configuration

### app.json
- Package: `com.moneykai.app`
- Orientation: Portrait only
- Typed routes enabled
- React Compiler enabled

### eas.json
- Preview profile generates `.apk` files
- Production profile generates `.aab` files

---

## ðŸ“„ License

MIT License â€” see [LICENSE](LICENSE) for details.

---

Built with â¤ï¸ for financial discipline.

