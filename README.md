# 10x-cards

## Overview

10x-cards is an AI-powered flashcard generator designed to simplify the creation and management of educational flashcards. It leverages advanced language models via Openrouter.ai to automatically generate flashcard suggestions from user-provided text, saving time and effort in content creation.

Actual project is hosted on Cloudflare Pages. Link: https://10x-cards-4sq.pages.dev

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployments & Hosting](#deployments--hosting)
- [AI Development Support](#ai-development-support)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework
- **Testing:**
  - [Vitest](https://vitest.dev/) - Unit and integration testing framework with UI for debugging
  - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Testing React components
  - [Playwright](https://playwright.dev/) - End-to-end testing with cross-browser support
  - [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking for tests
  - [ts-jest](https://kulshekhar.github.io/ts-jest/) - TypeScript integration for tests

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/abialobrodzki/10x-cards.git
cd 10x-cards
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## Deployments & Hosting

The application is hosted on **Cloudflare Pages**, utilizing its support for Astro and serverless/edge functions to serve both static content and API endpoints (`src/pages/api`).

Continuous Integration and Continuous Deployment (CI/CD) are managed via **GitHub Actions**, which automate the build and deployment process to Cloudflare Pages upon code changes.

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

This project is licensed under the **MIT License**.

---

# Komponenty widoku generowania fiszek

Ten katalog zawiera komponenty używane w widoku generowania fiszek z tekstu edukacyjnego przy pomocy AI.

## Struktura komponentów

```
GenerateView (główny komponent widoku)
│
├── TextInputForm (formularz wprowadzania tekstu)
│
├── LoadingIndicator (wskaźnik ładowania)
│
├── SkeletonLoader (placeholder podczas ładowania)
│
├── ErrorNotification (komunikaty o błędach)
│
├── SuccessNotification (komunikaty o sukcesie)
│
├── FlashcardList (lista wygenerowanych fiszek)
│   └── FlashcardItem (pojedyncza fiszka)
│
├── EditFlashcardModal (modal edycji fiszki)
│
└── BulkSaveButton (przyciski zapisu fiszek)
```

## Komponenty UI

Wszystkie podstawowe komponenty UI pochodzą z biblioteki Shadcn/ui i znajdują się w `src/components/ui`.

## Typy i modele

Typy wykorzystywane przez komponenty widoku generowania fiszek znajdują się w `src/types/viewModels.ts`.

## Zarządzanie stanem

Stan aplikacji jest zarządzany przez custom hook `useGenerateFlashcardsView` znajdujący się w `src/components/hooks/useGenerateFlashcardsView.tsx`.

## Endpointy API

Widok korzysta z następujących endpointów API:

- `POST /api/generations/generate` - Generowanie fiszek z tekstu
- `POST /api/generations/:id/accept-flashcards` - Zapisywanie zaakceptowanych fiszek

## Przepływ danych

1. Użytkownik wprowadza tekst edukacyjny w komponencie `TextInputForm`
2. Po kliknięciu "Generuj fiszki" wysyłane jest żądanie do API
3. Podczas generowania wyświetlany jest `LoadingIndicator` i `SkeletonLoader`
4. Po wygenerowaniu fiszek wyświetlana jest lista w komponencie `FlashcardList`
5. Użytkownik może akceptować, edytować lub odrzucać poszczególne fiszki
6. Po zakończeniu użytkownik może zapisać wszystkie lub tylko zaakceptowane fiszki
7. Wyniki zapisywania są wyświetlane w komunikacie sukcesu lub błędu

## Wykorzystanie

Komponent `GenerateView` jest używany na stronie `/generate` i nie wymaga przekazania żadnych propsów:

```tsx
// W pliku src/pages/generate.astro
import GenerateView from "../components/GenerateView";

// ...

<GenerateView client:load />;
```

---

## Test - reset hasla / rejestracja uzytkownika

skrzynka mailowa (lokalnie):

```link
http://localhost:54324
```

## Test - przekazywanie informacji o projekcie do AI

**przekazanie repo**

```link
https://gitingest.com/
(alternatywa: https://repomix.com/)
```

**Google AI (free) - szeroki kontekst (lepiej przez Cursora)**

```link
https://aistudio.google.com/
```

**Antrophic - poprawianie promptów (konieczne doładowanie)**

```link
https://console.anthropic.com/
```

## Test - API - manual

**SQL Query - Supabase**
RLS - disable (now):

```sql
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
```

RLS - enable (need auth):

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
```

**Postman curl**
generate flashcards - POST:

```bash
curl --location 'http://localhost:3000/api/generations/generate' \
--header 'Content-Type: application/json' \
--data '{
    "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis auctor semper lorem et rhoncus. Aliquam vitae ultricies sapien, eu posuere mauris. Quisque tincidunt placerat nibh, vitae laoreet dui tempor et. Etiam id sapien vel ipsum gravida ullamcorper sit amet in magna. Aliquam mollis vehicula semper. Fusce nec volutpat purus. Vivamus id egestas ex. Maecenas augue lectus, mattis eu auctor id, elementum porttitor sem. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce pellentesque risus in ligula dictum placerat. Morbi in erat leo. Pellentesque dapibus facilisis mi vitae viverra. Phasellus ultrices rhoncus est, ac elementum risus venenatis et. Nam vel faucibus est. Ut vestibulum ullamcorper quam in tristique. Nulla pulvinar ipsum non ligula auctor auctor. Vivamus laoreet metus ac enim hendrerit, nec laoreet est malesuada. Vestibulum rutrum, ipsum ac varius finibus, elit dolor dignissim tellus, nec consequat ex tortor et lorem. Proin massa justo, pulvinar eu venenatis id cras."
}'
```

pull flashcards - GET:

```bash
curl --location 'http://localhost:3000/api/flashcards'
```

---

# 10xCards Testing Setup

This document outlines the testing infrastructure and practices for the 10xCards project.

## Testing Tools

### Unit and Integration Testing

- **Vitest**: Fast Vite-based testing framework
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **@testing-library/jest-dom**: DOM testing utilities

### End-to-End Testing

- **Playwright**: Cross-browser testing framework
- **Axe-core**: Accessibility testing

## Testing Structure

- `src/test/unit/`: Unit and integration tests
- `src/test/e2e/`: End-to-end tests
- `src/test/setup.ts`: Global test setup for Vitest

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode for development
npm run test:watch

# Open UI for interactive testing
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Open UI for interactive E2E testing
npm run test:e2e:ui

# Debug mode with step-by-step execution
npm run test:e2e:debug

# Update screenshot baselines
npm run test:e2e -- --update-snapshots
```

### Environment Variables - package.json scripts before running tests

```bash
# run supabase locally
supabase start
supabase migration up
supabase stop

# run dev server locally
dev astro dev # for local dev in port 3000
# or
dev:e2e npm run dev astro dev -- --mode test --port4321 # for e2e tests in port 4321
```

## Testing Guidelines

### Unit Testing Best Practices

- Use `test.each` for parameterized tests
- Mock external dependencies
- Focus on testing behavior, not implementation
- Use the smallest possible rendering scope
- Keep tests isolated from each other

### E2E Testing Best Practices

- Use the Page Object Model pattern for maintainable tests
- Use locators for resilient element selection
- Implement visual comparison with `expect(page).toHaveScreenshot()`
- Use trace viewer for debugging test failures
- Test accessibility with axe-core

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you encounter port conflicts running E2E tests while the dev server is running, kill the dev server first or modify the port in `playwright.config.ts`.

2. **Accessibility issues**: The E2E tests check for accessibility violations using axe-core. Currently, there are two issues detected:

   - Missing main landmark: Add a `<main>` tag to the page
   - Content not contained in landmarks: Ensure all content is within proper semantic HTML landmarks

3. **Screenshot tests**: Before running screenshot tests, you need to generate baseline screenshots with:
   ```bash
   npm run test:e2e -- --update-snapshots
   ```
   Then remove the `.skip` from the screenshot test.

<!--
TO DO:
Uwaga: Zauważyłem potencjalne duplikaty nazw plików (FlashcardItem.tsx, FlashcardList.tsx) na różnych poziomach zagnieżdżenia. Warto sprawdzić, czy to celowe, czy może pozostałość po refaktoryzacji.
-->
