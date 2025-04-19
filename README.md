# 💬 Live Chat Support Demo

> This repo is a **template** — click [Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate) to create your own real-time chat support app instantly!

A real-time support chat app built with **Next.js (App Router)**, **Socket.IO**, **Zustand**, and **Tailwind CSS**. Visitors can instantly chat with an admin, while both sides see messages update in real time. Admins can end a conversation, and all chats are locally persisted per role.

---

## ✨ Features

- ✅ Real-time chat with Socket.IO  
- 🧑‍💻 Separate interfaces for **visitor** and **admin**  
- 🧠 Role-based persistence:
  - Visitor chats → `sessionStorage`
  - Admin chats → `localStorage`
- 🔄 Admin can **end** a conversation
- 🕓 Visitor can **resume** the chat after it ends
- 💻 Deployed on Vercel (frontend) + Railway (Socket.IO backend)
- 💅 Styled with Tailwind CSS

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/          → Admin dashboard view
│   └── visitor/        → Visitor chat interface
├── components/         → Shared chat & UI components
├── store/              → Zustand state (chat logic)
├── lib/                → Socket.IO client setup
├── types/              → Message & user type definitions
└── styles/             → Tailwind global styles
```

---

## 🚀 One-Click Deploy

Deploy your own version of this app in seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/unjica/Live-Chat-Support-Demo)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/oCcOIf?referralCode=unjica-chat-template)

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
   npm install
   npm run dev

   # In a separate terminal
   node server.js
   ```

4. Open two browser tabs:
   - Admin: `http://localhost:3000/admin`
   - Visitor: `http://localhost:3000/visitor`

---

## 🛰 Backend (Socket.IO Server)

- Located in `server.js`
- Uses `express`, `cors`, and `socket.io`
- Listens on `process.env.PORT` for Railway compatibility
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
- End conversation as admin and resume as visitor

---

## 🌍 Deployment Notes

### Frontend → Vercel

```bash
vercel --prod
```

Set the following in Vercel project settings:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

---

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