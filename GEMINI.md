---
description: JuhasMoney Core Project Guidelines and Agent Definitions
always_on: true
---

# JuhasMoney Project Context & Guidelines

You are an AI assistant working on **JuhasMoney**, a personal finance and cash-flow management application.

## 1. Universal Language Rule (CRITICAL)
- **English Only for Documentation & Tests:** ALL project documentation, agent definitions, rules (`.md` files), skills (`SKILL.md`), and test code (descriptions, assertions, variables) **MUST ALWAYS** be written and maintained in **English**.
- Even if the user speaks to you in Portuguese, any persistent configuration, documentation, or code file you create or update must adhere to this rule.

## 2. Project Architecture & Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React (for icons).
- **State & Storage:** Supabase (PostgreSQL) for backend database, authentication, and state persistence.
- **Routing:** React Router DOM.
- **Security:** Ensure data isolation using Supabase Row Level Security (RLS) and validate context-aware technology choices before introducing new heavy libraries.

## 3. Core Business Logic
- **Transactions:** Handled as either `income` (receita) or `expense` (despesa).
- **Recurrence:** Expenses can be fixed (continuous) or installments (parcelado). Incomes can be fixed (continuous).
- **Categories:** Users create custom categories separated by transaction type (income vs. expense).
- **Credit Cards:** The system supports credit card management. Users can add cards (with limits, closing, and due days) and associate expenses with specific cards. Credit card bills aggregate these expenses dynamically based on closing dates.

## 4. PO & Product Vision
- **MVP Approach:** Break down features into smaller deliverables (Minimum Viable Product). Validate ideas before building complex systems.
- **Edge Cases Anticipation:** Always consider offline states, empty lists, invalid inputs, and lack of data before proceeding with implementation.

## 5. UX/UI Philosophy
- **Mobile-First & Responsive:** ALWAYS think about features and fixes considering BOTH web (desktop) and app (mobile) versions. Use Tailwind's responsive breakpoints (`sm:`, `md:`) extensively.
- **Simplicity & Fluidity:** Keep the interface clean and intuitive. Optimize screen flows to require fewer clicks.
- **Visual Cues:** Use consistent color coding (e.g., Green for Income, Red for Expenses) and clear visual feedback (loading, success, error states).
- **Modern Design:** Use modern web paradigms like `backdrop-blur-sm` for pop-ups, soft shadows (`shadow-2xl`), and Apple-like floating elements instead of heavy full-screen modals.
- **UI Primitives:** Always use the UI primitive components located in `src/components/ui/` (Button, Input, Card, Modal, Badge) when building new screens.

## 6. Design Patterns & Clean Code
- **Principles:** Strictly adhere to SOLID, DRY (Don't Repeat Yourself), and KISS (Keep It Simple, Stupid). The best pattern is often the simplest one that robustly solves the problem.
- **Separation of Concerns:** Keep components clean. Extract business logic, data fetching, and complex state management into custom React hooks (e.g., `useTransactions`, `useCreditCards`).
- **Refactoring:** Actively identify and eliminate code smells like massive components or excessive prop drilling, prioritizing long-term maintainability. Ask: "Will another developer easily understand this code in 6 months?"

## 7. QA & Testing Strategy
- **Shift-Left Testing:** Validate requirements and identify unhandled negative scenarios before or during implementation.
- **Test Planning:** Always consider the Happy Path, Alternative Paths, and Negative Paths/Edge Cases (invalid inputs, API failures, concurrent modifications).
- **Automation Pyramid:**
  - **Unit Tests:** Focus on pure functions and complex business logic (e.g., financial calculations, data filters) using **Vitest**.
  - **Component / UI Tests:** Focus on rendering, accessibility, and state changes (loading, error, empty) isolated from the backend using **React Testing Library**.
  - **E2E Tests:** Focus on critical user journeys using tools like **Playwright** or **Cypress** (when configured).
