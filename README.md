# 10x-cards

## Overview

10x-cards is an AI-powered flashcard generator designed to simplify the creation and management of educational flashcards. It leverages advanced language models via Openrouter.ai to automatically generate flashcard suggestions from user-provided text, saving time and effort in content creation.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [AI Development Support](#ai-development-support)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

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

## Test - reset hasla / rejestracja uzytkownika

skrzynka mailowa (lokalnie):

```link
http://localhost:54324
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
