# JuhasMoney 💸

JuhasMoney is a modern, fast, and elegant personal finance and cash-flow management application. Designed with a mobile-first philosophy, it helps users track their incomes, expenses, installments, and fixed continuous bills while maintaining an intuitive and premium "dark-themed" user experience.

## ✨ Core Features

*   **Smart Dashboard:** Comprehensive overview of your financial health, including total incomes, expenses, pending bills, and current balance.
*   **Intelligent Notification System:** Never miss a due date. Get automatically notified about upcoming bills (due today, tomorrow, or in the next few days) with a smart "soft-delete" inbox zero mechanic.
*   **Recurring & Installment Tracking:** Easily manage both fixed continuous expenses (e.g., subscriptions) and installment plans (e.g., credit card purchases).
*   **Multi-language Support (i18n):** Native support for Portuguese (PT), English (EN), and Spanish (ES), automatically adapting currency formatting (e.g., R$, $, €).
*   **Premium Dark UI:** Designed with Tailwind CSS featuring Glassmorphism, smooth transitions, and a modern Apple-like floating interface.

## 🛠️ Tech Stack & Architecture

JuhasMoney is built using a modern frontend ecosystem focused on developer experience, performance, and scalability.

*   **Framework & Build:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/), bundled by the blazing-fast [Vite](https://vitejs.dev/).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling and [Lucide React](https://lucide.dev/) for crisp, scalable icons.
*   **Routing:** [React Router DOM](https://reactrouter.com/) handling application flow (`/login`, `/onboarding`, `/dashboard`).
*   **State & Data Management:** 
    *   Custom React Hooks (`useTransactions`, `useNotifications`) for local state management.
    *   Currently utilizes a robust `localStorage` mock adapter for offline-first development, fully structured and prepared for a seamless [Supabase](https://supabase.com/) integration.
*   **Internationalization:** [react-i18next](https://react.i18next.com/) for dynamic translation loading.
*   **Testing & QA:** Comprehensive unit and component testing using [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/).
*   **Linting:** [Oxlint](https://oxc.rs/) for ultra-fast, Rust-based code linting.

## 📁 Project Structure

```text
juhasmoney/
├── .agents/            # AI Agent guidelines and persona skills (PO, QA, Dev)
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components (NotificationBell, TransactionItem, etc.)
│   ├── contexts/       # React Context providers (PreferencesContext)
│   ├── hooks/          # Custom hooks handling complex business logic
│   ├── lib/            # Third-party library initializations (Supabase, i18n)
│   ├── locales/        # Translation dictionaries (en, pt, es)
│   ├── pages/          # Main application views (Dashboard, Login, Onboarding)
│   ├── types/          # Global TypeScript interfaces and type definitions
│   └── utils/          # Helper functions and Services (NotificationService, formatters)
├── tests/              # Vitest test suites (unit and component level)
└── vite.config.ts      # Vite bundler configuration
```

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/juhasmoney.git
    cd juhasmoney
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    *   Create a `.env` file in the root directory based on your Supabase project (if enabled) or use the local mocked setup.
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Run Tests:
    ```bash
    npm run test
    ```

## 🧠 AI-Driven Development (Agents)

JuhasMoney leverages specialized AI personas stored in the `.agents/skills/` directory to ensure architectural integrity, product value, and code quality:
*   **Senior PO & UX/UI Designer:** Validates feature scope, ensures "Mobile-First" responsiveness, and proposes MVP paths.
*   **Senior QA Engineer:** Designs automated test plans and handles edge cases.
*   **Senior Dev Reviewer:** Ensures best design patterns, reviews PRs, and maintains code cleanliness.
