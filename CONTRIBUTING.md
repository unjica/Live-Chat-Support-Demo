# 🤝 Contributing to Live Chat Support Starter Kit

Thanks for your interest in contributing! Whether it's fixing a bug, adding a feature, improving documentation, or offering feedback — you're welcome here.

This project is open-source and thrives on community input. Here's how to get started:

---

## 🧰 Getting Started

1. **Fork the repo**
   Click “Fork” (top right) and clone your fork locally.

2. **Create a branch**
   git checkout -b feature/your-feature-name

3. **Make your changes**
   - Follow the existing code style
   - Include comments where appropriate
   - Update any relevant documentation

4. **Commit your changes**
   git commit -m "feat: brief description of your change"

5. **Push and open a pull request**
   git push origin feature/your-feature-name

   - Open a pull request (PR) to the `main` branch
   - Describe your changes clearly and link any related issues

---

## 🧪 Code Guidelines

- Language: TypeScript (strict mode)
- Style: Prettier formatting, ESLint compliant
- State: Zustand for all local/global state
- Backend: NestJS + Socket.IO + Prisma/PostgreSQL
- Tests: Jest integration suite against dedicated PostgreSQL; run npm run lint, npm run typecheck, npm run build and npm test

---

## 📦 Folder Structure

/frontend
 /app
 /components
 /store
 /lib
 /types

/backend
 /src
 /prisma
 /test

---

## ✅ Good PR Practices

- Keep changes focused and atomic (1 PR = 1 feature or fix)
- Reference related Issues or Discussions in your PR
- Use semantic commit messages:
 - feat: for new features
 - fix: for bug fixes
 - docs: for documentation
 - refactor: for code improvements
- Open a Discussion if you’re unsure or want to validate an idea

---

## 🙌 Need Help?

Open a Discussion or create an Issue.
We're happy to support contributors of all levels — thanks for making this project better!
