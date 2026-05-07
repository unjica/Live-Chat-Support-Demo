![License](https://img.shields.io/github/license/unjica/Live-Chat-Support-Demo)
![Last Commit](https://img.shields.io/github/last-commit/unjica/Live-Chat-Support-Demo)
![Issues](https://img.shields.io/github/issues/unjica/Live-Chat-Support-Demo)
![Stars](https://img.shields.io/github/stars/unjica/Live-Chat-Support-Demo?style=social)

![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io)

# 💬 Live Chat Support Demo

> This repo is a **template** — click [Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate) to create your own real-time chat support app instantly!

A real-time support chat app built with **Next.js (App Router)**, **Socket.IO**, **Zustand**, and **Tailwind CSS**. Visitors can instantly chat with an admin, while both sides see messages update in real time. All chats are locally persisted per role.

> Featured on Dev.to 🚀 [Live Chat Support Starter Kit — Open Source!](https://dev.to/unjica/live-chat-support-starter-kit-open-source-79h)

---

## ✨ Features

- ✅ Real-time chat with Socket.IO  
- ⌨️ Typing indicators (visitor ↔ admin)  
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
│   │   ├── config/    → Configuration files
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

## ⚙️ Configuration

The application uses a centralized configuration system located in `frontend/src/config/`:

### Chat Configuration (`chat.ts`)
```typescript
export const chatConfig = {
  welcomeMessage: 'Hi 👋 How can we help you?',  // Initial greeting message
  defaultAgentName: 'Support Team',  // Default name for support agents
};
```

To modify the chat appearance or behavior:
1. Update the values in `chatConfig`
2. The changes will automatically reflect across all components using these settings

### Environment Configuration
- Frontend: `.env.local`
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```
- Backend: `.env`
  ```
  FRONTEND_URL=http://localhost:3000
  FRONTEND_URL_2=https://staging.your-app.com    # Optional: Additional frontend URL
  FRONTEND_URL_3=https://dev.your-app.com        # Optional: Additional frontend URL
  PORT=3001
  ```

  > 💡 **Multiple Frontend URLs**: You can configure multiple frontend URLs by setting additional environment variables (`FRONTEND_URL_2`, `FRONTEND_URL_3`, etc.). This is useful when you have multiple environments (staging, development, etc.) that need to connect to the same backend. The backend will automatically handle CORS for all configured URLs.

---

## 🧠 State Management

The application uses Zustand for state management with the following key stores:

### Chat Store (`store/chatStore.ts`)
```typescript
interface ChatState {
  messages: Message[];
  user: User | null;
  conversations: Record<string, Message[]>;
  onlineVisitors: Set<string>;
  isChatFocused: boolean;
  selectedVisitorId: string | null;
  role: UserRole | null;
  // ... actions
}
```

Key features:
- Role-based persistence (admin/visitor)
- Real-time message synchronization
- Online status tracking
- Conversation management

### Usage Example
```typescript
const { messages, user, sendMessage } = useChatStore();

// Send a message
sendMessage({
  conversationId: '123',
  senderId: user.id,
  content: 'Hello!'
});
```

---

## 🧩 Component Architecture

The application follows a modular component structure:

### Visitor Components
- `ChatWidget`: Floating chat button and window container
- `ChatWindow`: Main chat interface for visitors
- `MessageBubble`: Individual message display
- `MessageInput`: Message composition and sending

### Admin Components
- `ChatHeader`: Conversation header with visitor info
- `VisitorList`: List of active visitors
- `ChatContainer`: Main admin chat interface

### Shared Components
- `Avatar`: User avatar display
- `DarkModeToggle`: Theme switching
- `ErrorToast`: Error notifications
- `MessageInput`: Sends messages and emits Socket.IO typing start/stop (debounced idle)

### Component Communication
- Components communicate through Zustand store
- Real-time updates via Socket.IO
- Props for component-specific configuration

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
- 🔄 Support for parallel chats with multiple users

---

## 📄 License

MIT — use freely and modify as you wish!

---

## 👋 Author

Made with ❤️ by [Sanja Malovic](https://github.com/unjica)
