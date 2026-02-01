# 🛠️ Contributing to Vibe - Detailed Technical Guide

First off, thank you for considering contributing to Vibe! Community contributions are the lifeblood of this project. This document provides a deep technical dive into how Vibe is structured and how you can add new features effectively.

---

## 📜 Table of Contents
1. [Core Philosophy](#-core-philosophy)
2. [Local Development Workflow](#-local-development-workflow)
3. [The Feature Architecture](#-the-feature-architecture)
4. [Adding a New Workspace Starter Template](#-adding-a-new-workspace-starter-template)
5. [State Management (Zustand)](#-state-management-zustand)
6. [Coding Standards Deep Dive](#-coding-standards-deep-dive)
7. [Testing Procedures](#-testing-procedures)
8. [Pull Request & Review Process](#-pull-request--review-process)

---

## 💡 Core Philosophy
Vibe is built on the principle of **"Zero Latency Development."** 
- **Reactive UI**: Every change in state must be reflected in the UI immediately. Use Framer Motion for transitions to make the app feel "alive."
- **Client-First Runtime**: We leverage the user's CPU for the Node.js runtime (WebContainer). The backend is strictly for persistence, heavy AI inference, and secure OAuth.
- **Explicit Typings**: Avoid `any` at all costs. Use Zod for runtime validation where possible.

---

## 📂 Local Development Workflow

### 1. Database Management (Prisma)
Vibe uses PostgreSQL. If you modify `prisma/schema.prisma`:
- **Migration**: Run `bun db:migrate` to generate a new SQL migration and apply it to your local database.
- **Client Generation**: Run `bun db:generate` to update the TypeScript types in `@/generated/prisma`.
- **Inspection**: Use `bun db:studio` to open a GUI for your local data.

### 2. Environment Variables
Ensure your `.env` contains a valid `GOOGLE_GENERATIVE_AI_API_KEY`. Without this, the AI features will be disabled. We recommend using a dedicated development key from [Google AI Studio](https://aistudio.google.com).

---

## 🏗️ The Feature Architecture

All complex logic is isolated in the `/features` folder to keep the `/app` directory clean.
- **Editor**: Built on **CodeMirror 6**. Language support is dynamically loaded. Extensions (themes, autocomplete) are managed in `features/editor/extensions.ts`.
- **Chat**: Handles the LLM stream. It uses a custom parser (`lib/parseVibeArtifact.ts`) to extract file changes from AI responses. 
- **WebContainer Manager**: A singleton located in `lib/webcontainer.ts`. It handles the lifecycle of the browser-based Node.js runtime, including booting, mounting files, and spawning shell processes.

---

## 🚀 Adding a New Workspace Starter Template

Support for a new framework requires synchronizing the registry and the file generator:

1. **Registry**: Add an entry to `lib/workspace-registry.ts` inside the `WORKSPACE_REGISTRY` constant. Define the `AppType` (ensure it matches the Prisma enum).
2. **Template**: Define the file structure in `lib/starters.ts`. This must return a `Files` object (a recursive structure where keys are filenames and values are `{ file: { contents: string } }`).
3. **Boot Logic**: Ensure the `package.json` in your template has a `"dev"` script that starts a web server on port 3000, 3001, etc. Vibe will automatically detect these ports and show the preview.

---

## 🧠 State Management (Zustand)

Vibe's global state is managed via Zustand in `context/index.ts`.

### Critical Store Actions:
- `setFiles(files: Files)`: Updates the in-memory file system. This triggers a recursive write to the WebContainer FS.
- `updateFile(path: string, content: string)`: Updates a specific path. This is tied to the editor's "Change" event.
- `addMessage(msg: Message)`: Appends to the chat history and triggers a DB sync via a debounced background task.

---

## 🎨 Coding Standards Deep Dive

### 1. Component Convention
- Use **PascalCase** for component folders and files (e.g., `features/ChatWindow/Header.tsx`).
- Export components as named functions: `export function Header() { ... }`.
- Always define a `Props` interface even if empty.

### 2. Styling (Tailwind 4)
- We use the latest **Tailwind CSS 4** engine.
- Favor CSS variables over hardcoded hex codes.
- Use `cn()` utility from `lib/utils.ts` for conditional class merging.

---

## 🧪 Testing Procedures

### Unit Testing (Vitest)
Run `bun test` to execute the suite. New logic in `lib/` or `features/` should always include a corresponding `[name].test.ts` file.

### Manual QA Checklist
Before submitting a PR, verify:
1. Workspace boots correctly (terminal shows prompt).
2. File edits in the editor are reflected in the terminal (`cat [file]`).
3. AI chat can successfully generate a new file.
4. UI is responsive at multiple viewport widths (Mobile/Desktop).

---

## 🏁 Pull Request & Review Process

1. **Self-Review**: Read through your diff. Remove any `console.log` or commented-out code.
2. **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add astro support`, `fix: terminal scroll issue`).
3. **PR Description**: Detail *what* changed and *how* to test it. Attach screenshots for UI changes.
4. **Review**: At least one maintainer must approve the PR. Address all comments promptly.

---

**Thank you for helping us build the future of coding! 🚀**
