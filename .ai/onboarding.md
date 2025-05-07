# Project Onboarding: 10xCards

## Welcome

Welcome to the 10xCards project! This document provides an onboarding summary to help you quickly understand the project structure, recent developments, and key areas of focus. 10xCards is an AI-powered flashcard generator designed to simplify the creation and management of educational flashcards. It leverages advanced language models via Openrouter.ai to automatically generate flashcard suggestions from user-provided text.

## Project Overview & Structure

10xCards is a modern web application built with Astro for the frontend framework, incorporating React for dynamic UI components, and TypeScript for type safety. Styling is handled by Tailwind CSS, with Shadcn/ui components. Supabase is used for the backend database and authentication, and Openrouter.ai provides the core AI capabilities for flashcard generation. The project is hosted on Cloudflare Pages with CI/CD managed through GitHub Actions.

The project follows a structured organization:

*   **`src/`**: Main source code.
    *   **`pages/`**: Astro pages (e.g., `index.astro`, `generate.astro`, `flashcards.astro`) and API endpoints (`api/`).
        *   **`pages/api/`**: Backend logic for auth, flashcards CRUD, and generation.
    *   **`components/`**: React (`.tsx`) and Astro (`.astro`) components.
        *   **`components/ui/`**: Shadcn/ui based components.
        *   **`components/hooks/`**: Custom React hooks, notably `useGenerateFlashcardsView.tsx`.
    *   **`lib/`**: Core services and helper functions.
        *   **`lib/openrouter.service.ts`**: Key service for interacting with the Openrouter.ai API.
    *   **`db/`**: Supabase client (`supabase.client.ts`) and database type definitions (`database.types.ts`).
    *   **`layouts/`**: Astro layouts for page structure.
    *   **`middleware/`**: Astro middleware (`index.ts`) for request handling (e.g., authentication).
    *   **`types.ts`**: Shared TypeScript types for backend and frontend.
    *   **`types/viewModels.ts`**: Specific types for view models.
    *   **`styles/`**: Global stylesheets.
    *   **`test/`**: Unit (`src/test/unit`) and E2E (`src/test/e2e`) tests.
    *   **`mocks/`**: Mock service workers and other test mocks.
*   **`public/`**: Static assets served directly (e.g., `favicon.png`).
*   **`supabase/`**: Configuration and migration files for local Supabase setup.
*   **`.github/`**: GitHub Actions workflows for CI/CD.
*   **Configuration Files**: `astro.config.mjs`, `tailwind.config.js` (inferred), `vite.config.ts`, `playwright.config.ts`, `package.json`, `tsconfig.json`.

## Core Modules

### `AI Flashcard Generation Engine`
-   **Role:** Handles the core logic of communicating with Openrouter.ai to parse user text and generate flashcard suggestions.
-   **Key Files/Areas:** `src/lib/openrouter.service.ts`, `src/lib/openrouter.types.ts`, `src/lib/openrouter.utils.ts`, `src/lib/services/ai.service.ts`, `src/lib/services/generation.service.ts`.
-   **Recent Focus:** Initial implementation was ~3 weeks ago. Ongoing refinements as part of broader feature development.

### `Flashcard Generation View & UI`
-   **Role:** Provides the user interface for inputting text, viewing AI-generated flashcards, editing, and saving them. Managed by a complex state hook.
-   **Key Files/Areas:** `src/pages/generate.astro`, `src/components/GenerateView.tsx`, `src/components/TextInputForm.tsx`, `src/components/FlashcardList.tsx`, `src/components/FlashcardItem.tsx`, `src/components/EditFlashcardModal.tsx`, `src/components/hooks/useGenerateFlashcardsView.tsx`.
-   **Recent Focus:** Core components developed ~3 weeks ago. Recent enhancements include accessibility (`data-testid` attributes) and minor UI/UX improvements.

### `Flashcard & Generation APIs`
-   **Role:** Backend API endpoints for managing the lifecycle of flashcards (CRUD) and the generation process (initiating generation, accepting flashcards).
-   **Key Files/Areas:** `src/pages/api/flashcards.ts`, `src/pages/api/flashcards/[id].ts`, `src/pages/api/generations/generate.ts`, `src/pages/api/generations/[id]/accept-flashcards.ts`.
-   **Recent Focus:** Significant development ~2-3 weeks ago. Unit tests added more recently (~1-2 weeks ago).

### `Authentication & Authorization`
-   **Role:** Manages user sign-up, login, logout, password recovery, and session management using Supabase Auth. Protects routes and API endpoints via Astro middleware.
-   **Key Files/Areas:** `src/middleware/index.ts`, `src/pages/auth/**`, `src/pages/api/auth/**`, `src/components/auth/**`, `src/db/supabase.client.ts`.
-   **Recent Focus:** Very active recently (last 5-6 days and ~2 weeks ago) with refactoring of middleware, session handling, and implementation of auth forms and API endpoints.

### `Supabase Database Integration`
-   **Role:** Provides the database layer for storing user data, flashcards, generations, etc. Includes client setup and type definitions.
-   **Key Files/Areas:** `src/db/supabase.client.ts`, `src/db/database.types.ts`, `supabase/migrations/`.
-   **Recent Focus:** Client configuration refined recently, particularly around cookie/session management. Database schema established ~3 weeks ago.

### `Testing Framework`
-   **Role:** Ensures code quality and application stability through a comprehensive suite of unit (Vitest), integration (Vitest with MSW), and end-to-end (Playwright) tests.
-   **Key Files/Areas:** `src/test/**`, `vitest.config.ts`, `playwright.config.ts`, `src/mocks/**`, GitHub Actions workflows in `.github/workflows/`.
-   **Recent Focus:** Extremely active in the last week, with major efforts in setting up CI/CD pipelines, adding numerous tests, and configuring test environments.

## Key Contributors

Based on recent commit history (last ~200 commits):

*   **adrianbialobrodzki**: Appears to be the primary developer, actively working on all aspects of the project including backend, frontend, services, testing, CI/CD, and documentation.

## Overall Takeaways & Recent Focus

The project is rapidly evolving with a strong emphasis on building a robust and well-tested application.
Key recent initiatives (last 1-2 weeks) include:
1.  **CI/CD Pipeline Automation:** Extensive work on GitHub Actions to automate linting, testing (unit, E2E, coverage), and build processes.
2.  **Testing Coverage & Refinement:** Significant additions and improvements to unit and E2E tests, including Page Object Models for Playwright and `data-testid` attributes for components.
3.  **Authentication System Polish:** Refinements to middleware, Supabase client session handling, and auth flows.
4.  **Documentation & AI Developer Support:** Ongoing updates to `README.md` and internal AI-assist documentation.

Core feature development for flashcard generation and management happened primarily ~2-3 weeks ago and forms the foundation of the application.

## Potential Complexity/Areas to Note

*   **AI Service Integration (`src/lib/openrouter.service.ts`):** Interacting with external AI services involves managing API calls, responses, errors, and potentially rate limits. The existing caching mechanism also adds a layer to understand.
*   **`useGenerateFlashcardsView.tsx` Hook:** This is a large and central piece of state management for the flashcard generation UI. Understanding its data flow and state transitions will be important.
*   **Authentication & Middleware (`src/middleware/index.ts`):** Securely handling user sessions, especially with Supabase's SSR capabilities, and correctly protecting routes requires careful attention.
*   **Advanced Testing Setup:** The combination of Vitest, MSW, Playwright (with visual testing), and their integration into GitHub Actions presents a sophisticated testing environment that new developers will need to get familiar with.

## Questions for the Team

1.  What is the current status and location of the `src/assets/` directory mentioned in the project structure guidelines for "static internal assets"?
2.  Could you provide the `.env.example` file or a definitive list of all required environment variables (for Supabase, OpenRouter.ai, etc.) and their purposes for local development and testing?
3.  What is the recommended workflow for using the local Supabase development environment (`supabase start`) in conjunction with `npm run dev`?
4.  Are there any specific style guides or conventions for Tailwind CSS usage beyond the general utility-first approach?
5.  Can you elaborate on the intended use of the various documents within the `.ai/` directory and how they guide AI-assisted development?
6.  What are the current known limitations or areas for improvement in the AI flashcard generation quality from Openrouter.ai?
7.  Are there any performance considerations or optimizations that have been implemented or are planned, especially for the frontend or AI interactions?

## Next Steps

1.  **Set up Development Environment:** Follow the "Development Environment Setup" section below. Pay close attention to Node.js version and environment variable configuration.
2.  **Explore Core Features:** Run the application locally and try out the flashcard generation (`/generate`) and viewing (`/flashcards`) features.
3.  **Review Authentication Flow:** Walk through the user registration, login, and password reset processes to understand the auth mechanisms.
4.  **Examine Testing Setup:** Look at `vitest.config.ts`, `playwright.config.ts`, and browse through some unit tests in `src/test/unit` and E2E tests in `src/test/e2e` to get a feel for the testing strategy.
5.  **Dive into `useGenerateFlashcardsView.tsx`:** Read through this key hook to understand the state management for the flashcard generation UI.

## Development Environment Setup

1.  **Prerequisites:**
    *   Node.js v22.14.0 (check `.nvmrc` if using nvm: `nvm use`).
    *   npm (comes with Node.js).
2.  **Clone Repository:**
    ```bash
    git clone https://github.com/abialobrodzki/10x-cards.git
    cd 10x-cards
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Variables:**
    *   This project requires environment variables for services like Supabase and OpenRouter.ai.
    *   Typically, a `.env.example` file is provided to be copied to `.env` and filled with your credentials. **This file was not found during the automated exploration; please ask the team for the current list of required variables and an example file.**
    *   Variables are loaded using the `dotenv` package.
5.  **Local Supabase Setup (for backend-dependent features/tests):**
    *   Ensure you have the Supabase CLI installed.
    *   Start the local Supabase services:
        ```bash
        supabase start
        ```
    *   Apply database migrations:
        ```bash
        supabase migration up
        ```
    *   When finished, you can stop Supabase: `supabase stop`
6.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application should be available at `http://localhost:4321` (Astro's default, but check terminal output).

7.  **Running Tests:**
    *   Unit tests: `npm test`
    *   E2E tests: `npm run test:e2e` (ensure dev server or `dev:e2e` server is running as per `README.md` testing guidelines if tests require a live server).
    *   Refer to `README.md` and `package.json` for more specific test scripts (watch mode, UI, coverage).

## Helpful Resources

*   **Project Repository:** `https://github.com/abialobrodzki/10x-cards.git`
*   **Tech Stack Documentation:**
    *   Astro: `https://astro.build/`
    *   React: `https://react.dev/`
    *   Tailwind CSS: `https://tailwindcss.com/`
    *   Supabase: `https://supabase.com/docs`
    *   Vitest: `https://vitest.dev/`
    *   Playwright: `https://playwright.dev/`
    *   OpenRouter.ai: (Refer to their official documentation)
*   **Deployment & Hosting:**
    *   Cloudflare Pages: `https://pages.cloudflare.com/`
*   **Local Development Tools:**
    *   Local Mail Catcher (for email testing, often started with `supabase start`): `http://localhost:54324` (from `README.md`)
*   **Internal AI Development Guidelines:**
    *   Cursor IDE Rules: Files in `.cursor/rules/`
    *   GitHub Copilot Instructions: `.github/copilot-instructions.md`
    *   Windsurf Rules: `.windsurfrules`
    *   Other planning documents: `.ai/` directory (e.g., `prd.md`, `api-plan.md`)
