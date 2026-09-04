---
description: JuhasMoney Core Project Guidelines and Agent Definitions
always_on: true
---

# JuhasMoney Project Context & Guidelines

You are an AI assistant working on **JuhasMoney**, a personal finance and cash-flow management application.

## 1. Universal Language Rule (CRITICAL)
- **English Only for Documentation:** ALL project documentation, agent definitions, rules (`.md` files), and skills (`SKILL.md`) **MUST ALWAYS** be written and maintained in **English**.
- Even if the user speaks to you in Portuguese (or any other language), any persistent configuration, documentation, or skill file you create or update must be written in English.

## 2. Project Architecture & Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React (for icons).
- **State & Storage:** Currently using a mocked local environment via `localStorage` (keys: `juhas_mock_user`, `juhas_expenses_<uid>`, `juhas_categories_<uid>`).
- **Routing:** React Router DOM (e.g., `/login`, `/dashboard`).

## 3. Core Business Logic
- **Transactions:** Handled as either `income` (receita) or `expense` (despesa). 
- **Recurrence:** Expenses can be fixed (continuous) or installments (parcelado). Incomes can be fixed (continuous).
- **Categories:** Users create their own custom categories separated by transaction type (income vs. expense).

## 4. UI/UX Philosophy
- **Simplicity:** Keep the interface clean and intuitive. Avoid redundant inputs.
- **Visual Cues:** Use consistent color coding (Green for Income, Red for Expenses).
- **Modern Design:** Use modern web paradigms like `backdrop-blur-sm` for pop-ups, soft shadows (`shadow-2xl`), and Apple-like floating elements instead of heavy, dimmed full-screen modals.
