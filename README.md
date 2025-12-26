# 🚀 Vibe - AI-Powered Browser-Based Coding Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

> **Vibe** is the ultimate AI-powered coding platform that enables you to build, preview, and deploy full-stack web applications directly in your browser. No setup required, just start coding!

![Vibe Platform](https://via.placeholder.com/1200x600/667eea/ffffff?text=Vibe+Coding+Platform)

## ✨ Features

### 🤖 AI-Powered Development

- **Intelligent Code Completions** - Google Gemini AI-powered suggestions
- **Smart Code Generation** - Generate entire components with natural language
- **Context-Aware Assistance** - AI understands your codebase

### 💻 In-Browser Development

- **WebContainer Technology** - Full Node.js runtime in the browser
- **Live Terminal** - Interactive shell with full command support
- **Real-time Preview** - See changes instantly with hot-reload
- **No Setup Required** - Start coding immediately

### 🎨 Professional Code Editor

- **Syntax Highlighting** - Powered by CodeMirror
- **Multi-file Support** - Work with entire project structures
- **File Explorer** - Intuitive tree-based navigation
- **Tab Management** - Work with multiple files simultaneously

### 🔧 Framework Support

- ⚛️ React
- ⚡ Vite
- 🔺 Next.js
- 📦 Express.js
- 🎯 And more coming soon!

### 🌙 Modern UI/UX

- Dark & Light themes
- Responsive design
- Smooth animations
- Professional aesthetics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/vibe-coding-platform.git
cd vibe-coding-platform
```

2. **Install dependencies**

```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibe"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

4. **Set up the database**

```bash
# Generate Prisma client
bun db:generate

# Run migrations
bun db:migrate
```

5. **Start the development server**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 📁 Project Structure

```
vibe-coding-platform/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (main)/              # Main application pages
│   └── api/                 # API routes
├── components/              # Reusable UI components
│   └── ui/                  # shadcn/ui components
├── features/                # Feature-specific components
│   ├── components/          # Chat, preview, input components
│   └── editor/              # Code editor components
├── context/                 # React context providers
├── lib/                     # Utility functions
├── prisma/                  # Database schema & migrations
└── public/                  # Static assets
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion
- **Code Editor**: CodeMirror
- **State Management**: Zustand

### Backend

- **Runtime**: Node.js / Bun
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **AI**: Google Gemini (Generative AI)
- **WebContainer**: StackBlitz WebContainer API

### DevOps

- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Package Manager**: Bun (recommended) / npm

## 📖 Usage

### Creating a Workspace

1. Navigate to `/workspaces`
2. Click "New Workspace"
3. Enter a workspace name
4. Select your preferred framework
5. Start coding!

### AI Code Completions

- Type naturally and press `Tab` to accept AI suggestions
- AI learns from your codebase context
- Supports multiple languages (JavaScript, TypeScript, HTML, CSS, etc.)

### Using the Terminal

- Access the built-in terminal at the bottom of the code editor
- Run npm commands, install packages, start dev servers
- Full Node.js environment powered by WebContainer

### Live Preview

- Switch between Code and Preview tabs
- Support for multiple responsive breakpoints
- Refresh or open in new tab options

## 🔐 Environment Variables

| Variable                       | Description                   | Required |
| ------------------------------ | ----------------------------- | -------- |
| `DATABASE_URL`                 | PostgreSQL connection string  | Yes      |
| `BETTER_AUTH_SECRET`           | Secret for session encryption | Yes      |
| `BETTER_AUTH_URL`              | Base URL of your application  | Yes      |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID        | No       |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret    | No       |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key         | Yes      |

## 📝 Available Scripts

```bash
# Development
bun dev              # Start development server
bun build            # Build for production
bun start            # Start production server

# Database
bun db:generate      # Generate Prisma client
bun db:migrate       # Run database migrations
bun db:studio        # Open Prisma Studio
bun db:reset         # Reset database

# Code Quality
bun lint             # Run ESLint
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [StackBlitz](https://stackblitz.com/) - WebContainer technology
- [Google](https://ai.google.dev/) - Gemini AI
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📧 Support

- 📖 [Documentation](https://docs.vibe.dev)
- 💬 [Discord Community](https://discord.gg/vibe)
- 🐛 [Issue Tracker](https://github.com/yourusername/vibe-coding-platform/issues)
- 📧 [Email Support](mailto:support@vibe.dev)

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ by the Vibe Team**
