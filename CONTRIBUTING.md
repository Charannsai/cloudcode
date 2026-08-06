# Contributing to CloudCode

Thanks for your interest in contributing to CloudCode! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** installed and running (for backend container management)
- **Expo CLI** (`npx expo`) for mobile development
- A **Supabase** project (free tier works)

### Setting Up the Development Environment

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/cloudcode.git
   cd cloudcode
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env.local
   ```
   Fill in your Supabase and JWT credentials in `.env.local`.

   ```bash
   npm run dev
   ```

3. **Mobile app setup:**
   ```bash
   cd mobile
   npm install
   cp .env.example .env
   ```
   Update the API URL to point to your backend server.

   ```bash
   npx expo start -c
   ```

4. **Web (marketing site) setup:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

- Open an issue with a clear title and description.
- Include steps to reproduce, expected behavior, and actual behavior.
- Add screenshots or logs if applicable.

### Suggesting Features

- Open an issue tagged with `feature-request`.
- Describe the use case and how it would improve CloudCode.

### Submitting Pull Requests

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and test them.
3. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat: add terminal resize support for tablet layout"
   ```
4. Push and open a pull request against `main`.
5. Fill in the PR description explaining what changed and why.

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring (no behavior change) |
| `docs:` | Documentation changes |
| `chore:` | Build, tooling, or config changes |
| `style:` | Formatting, whitespace (no logic change) |

### Code Guidelines

- Use **TypeScript** for all new code.
- Follow the existing code style and patterns in the project.
- Keep components focused and reusable.
- Add comments for non-obvious logic.

## Project Structure

See the [README](README.md) for the full repository structure and architecture overview.

## Questions?

Open a discussion or issue — we're happy to help.
