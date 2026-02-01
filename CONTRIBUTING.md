# 🛠️ Contributing to Vibe - Technical Guide

Thank you for your interest in contributing! This document provides a deep technical dive into how Vibe is structured and how you can add new features effectively.

---

## 📜 Table of Contents
1. [Core Philosophy](#-core-philosophy)
2. [Local Development Workflow](#-local-development-workflow)
3. [The Feature Architecture](#-the-feature-architecture)
4. [Adding a New Workspace Starter Template](#-adding-a-new-workspace-starter-template)
5. [State Management (Zustand)](#-state-management-zustand)
6. [Coding Standards Deep Dive](#-coding-standards-deep-dive)
7. [Testing Procedures](#-testing-procedures)

---

## 💡 Core Philosophy
Vibe is built on the principle of **"Zero Latency Development."** 
- **Everything must be reactive**: UI changes must reflect state immediately.
- **Client-First Runtime**: The backend should only be used for persistence and heavy LLM processing.
- **Strict Typing**: No `any` types. Everything must be interface-defined.

---

## 📂 Local Development Workflow

### Database Changes
We use Prisma. If you modify `prisma/schema.prisma`:
1. Run `bun db:migrate` to update your local DB.
2. Run `bun db:generate` to regenerate the TypeScript client.
3. If necessary, update the `context/` store to accommodate the new model fields.

### Env Management
Ensure your `.env` contains a valid `GOOGLE_GENERATIVE_AI_API_KEY`. Without this, the chat feature and component generation will fail silently or throw a 500 error.

---

## 🏗️ The Feature Architecture

All complex logic is isolated in the `/features` folder.
- **Editor**: Uses CodeMirror 6. If you want to add a language support, modify `features/editor/extensions.ts`.
- **Chat**: State is managed in `context/index.ts`. The AI logic lives in `app/api/chat/route.ts`.
- **WebContainer Manager**: Located in `lib/webcontainer.ts`. This class handles the boot sequence and file system mounts.

---

## 🚀 Adding a New Workspace Starter Template

If you want to add support for a new framework (e.g., Svelte, Astro):

1. **Update Registry**: Add a new entry to `lib/workspace-registry.ts` in the `WORKSPACE_REGISTRY` array.
2. **Define Template Files**: Create a corresponding file in `lib/starters.ts` that returns the default `files` object (a recursive `Files` structure).
3. **Configure Dependencies**: Ensure the `package.json` in your template includes the necessary dev scripts (e.g., `"dev": "astro dev"`).
4. **Test Boot**: Create a new workspace using the template and verify the preview starts correctly.

---

## 🧠 State Management (Zustand)

Vibe's state lives in `context/index.ts` within the `useWorkspaceStore` hook.

### Key Store Actions:
- `setFiles`: Updates the virtual file system. Whenever this is called, a side effect should check if the WebContainer needs a `writeFile` call.
- `updateFile`: Modifies a single file's content.
- `messages`: An array of `Message` objects. This is persisted to the DB only when the workspace is "Saved" (either manually or via the auto-save debouncer).

---

## 🎨 Coding Standards Deep Dive

### 1. Component Structure
Always use functional components with explicit prop types:
```tsx
interface FeatureProps {
  workspaceId: string;
  onAction?: (data: any) => void;
}

export function MyFeature({ workspaceId, onAction }: FeatureProps) {
  // Logic here
  return <div>...</div>;
}
```

### 2. Styling
We use **Tailwind CSS 4**. Prioritize:
- **CSS Variables**: Use `--primary`, `--background`, etc., for consistency.
- **Responsive Classes**: Always test your component at mobile, tablet, and desktop breakpoints.
- **Accessibility**: Use `aria-` attributes. All buttons must have descriptive labels.

---

## 🧪 Testing Procedures

### Unit Testing
We use **Vitest**. Place your tests in a `__tests__` folder next to the logic you are testing.
```bash
bun test
```

### Integration Testing
Currently, we perform manual integration testing by:
1. Booting the app.
2. Creating a workspace.
3. Verifying the WebContainer terminal responds to `ls`.
4. Triggering an AI edit and ensuring the preview updates.

---

## 🤝 Pull Request Checklist
- [ ] My code follows the project's style guidelines.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented my code, particularly in hard-to-understand areas.
- [ ] I have updated the documentation accordingly.
- [ ] My changes generate no new lint errors (`bun lint`).

Thank you for contributing to Vibe! 🚀
