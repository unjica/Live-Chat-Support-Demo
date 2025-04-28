# 💬 Live Chat Support Demo

> This repo is a **template** — click [Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate) to create your own real-time chat support app instantly!

A real-time support chat app built with **Next.js (App Router)**, **Socket.IO**, **Zustand**, and **Tailwind CSS**. Visitors can instantly chat with an admin, while both sides see messages update in real time. All chats are locally persisted per role.

---

## ✨ Features

- ✅ Real-time chat with Socket.IO  
- 🧑‍💻 Separate interfaces for **visitor** and **admin**  
- 🧠 Role-based persistence:
  - Visitor chats → `sessionStorage`
  - Admin chats → `localStorage`
- 💻 Deployed on Vercel (frontend) + Railway (Socket.IO backend)
- 💅 Styled with Tailwind CSS

---

## 📁 Project Structure

```
.
├── frontend/           → Next.js frontend application
│   ├── src/
│   │   ├── app/       → Admin & visitor views
│   │   ├── components → Shared components
│   │   ├── store/     → Zustand state
│   │   ├── lib/       → Socket.IO client
│   │   ├── types/     → Type definitions
│   │   └── styles/    → Tailwind styles
│   ├── public/        → Static assets
│   ├── package.json   → Frontend dependencies
│   └── [config files] → Next.js, TypeScript, etc.
└── backend/           → Socket.IO server
    ├── server.js      → Main server entry point
    ├── controllers/   → Socket.IO event handlers
    ├── services/      → Business logic
    ├── routes/        → HTTP routes (if needed)
    ├── utils/         → Utility functions
    └── package.json   → Backend dependencies
```

---

## 🚀 One-Click Deploy

Deploy your own version of this app in seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/unjica/Live-Chat-Support-Demo)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/starters?template=node)

---

## 🧑‍💻 How to Use This Template

1. Click **[Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate)** to copy this repo into your account.
2. Update environment variables:

   **Frontend (`.env.local`):**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   **Backend (`.env` or Railway variables):**
   ```
   FRONTEND_URL=http://localhost:3000
   ```

3. Run locally:

   ```bash
   # Install dependencies for both frontend and backend
   npm install

   # Start both frontend and backend
   npm run dev

   # Or run services separately:
   # Frontend
   cd frontend && npm run dev
   # Backend
   cd backend && npm run start
   ```

4. Open two browser tabs:
   - Admin: `http://localhost:3000/admin`
   - Visitor: `http://localhost:3000/visitor`

---

## 🛰 Backend Architecture

The backend is organized following a modular structure:

- `server.js`: Main entry point that sets up Express and Socket.IO
- `controllers/`: Contains Socket.IO event handlers for:
  - User connections/disconnections
  - Message handling
  - Typing indicators
  - Conversation state management
- `services/`: Business logic for chat operations
- `routes/`: HTTP endpoints (if needed for additional features)
- `utils/`: Helper functions and utilities

Key features:
- Uses `express` for HTTP server
- Implements `socket.io` for real-time communication
- Handles the following events:
  - `user_join`
  - `send_message`
  - `typing_start`, `typing_stop`
  - `conversation_ended`, `conversation_resumed`

---

## 🧪 Dev Tips

- Open admin and visitor tabs to simulate both roles
- Test real-time message syncing
- Test persistence:
  - Reload the tab
  - Visitor chat clears after closing the tab
  - Admin chat stays saved across reloads (localStorage)

---

## 🌍 Deployment Notes

### Frontend → Vercel

1. Create a new project in Vercel and connect it to your repository
2. Configure the following settings in Vercel:
   - Framework Preset: Next.js
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. Set the following environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
   ```

4. Deploy using the Vercel CLI:
   ```bash
   # Install Vercel CLI if you haven't already
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

### Backend → Railway

- Set start command: `node server.js`
- Set environment variables:

```
FRONTEND_URL=https://your-vercel-project.vercel.app
```

- Make sure ports are not hardcoded — use `process.env.PORT`

---

## 🧠 Technologies Used

- [Next.js (App Router)](https://nextjs.org/)
- [Socket.IO](https://socket.io/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [Railway](https://railway.app/)

---

## 💡 Future Improvements

- 📁 Export/download chat history
- 🗃 Add backend persistence (DB)
- 🔐 Auth for both roles
- 👥 Multi-agent support
- 💬 Typing indicators with avatars
- 🔄 Support for parallel chats with multiple users

---

## 📄 License

MIT — use freely and modify as you wish!

---

## 👋 Author

Made with ❤️ by [Sanja Malovic](https://github.com/unjica)