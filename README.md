# MiniCom - Real-time Live Chat Demo

A modern, lightweight customer support chat prototype inspired by Intercom. Built with Next.js, Socket.IO, and Tailwind CSS.

![MiniCom Demo](https://placehold.co/1200x600?text=MiniCom+Demo)

## 🚀 Features

- **Real-time Chat**
  - Instant message delivery
  - Message notifications
  - Sound alerts
  - Focus/blur detection

- **Agent Dashboard**
  - Active conversation list
  - Visitor management
  - Message history
  - Real-time updates

- **Chat Widget**
  - Clean, modern design
  - Dark mode support
  - Responsive layout
  - User avatars (DiceBear)

- **User Experience**
  - Sound notifications
  - Unread message count
  - Smooth animations
  - Real-time message delivery

## 🛠️ Tech Stack

- **Frontend**
  - Next.js 14 (App Router)
  - React 18
  - Tailwind CSS
  - Zustand (State Management)

- **Backend**
  - Socket.IO (Real-time communication)
  - Node.js

## 🌐 Live Demo

[Demo URL] (Coming soon)

## 🤖 AI-Assisted Development

This project was developed with the help of AI tools:

- **ChatGPT / Cursor**
  - Zustand store architecture design
  - Socket.IO integration patterns
  - UI component development with Tailwind
  - Debugging and configuration validation
  - Code optimization and best practices

## 🏗️ Architecture & Decisions

### State Management
- **Why Zustand?**
  - Simpler API than Context + Reducer
  - Better performance with less boilerplate
  - Built-in middleware support
  - Excellent TypeScript integration

### Project Structure
```
src/
├── app/              # Next.js app router pages
│   ├── shared/      # Shared components
│   └── visitor/     # Visitor-specific components
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── store/           # Zustand store
├── styles/          # Global styles
└── types/           # TypeScript types
```

### Key Components
- `SocketInitializer`: Manages Socket.IO connections
- `MessageBubble`: Renders chat messages
- `MessageInput`: Handles message input
- `ChatHeader`: Displays chat header
- `DarkModeToggle`: Manages theme switching
- `Avatar`: Displays user avatars

### Data Storage
- In-memory state management
- Real-time synchronization via Socket.IO
- Chat history maintained in Zustand store

## 📈 Areas for Improvement

- **Core Features**
  - Typing indicators
  - Read receipts
  - Message search
  - Conversation archiving

- **Authentication**
  - User authentication
  - Role-based access
  - Session management

- **Agent Features**
  - Agent presence/status
  - Availability management
  - Conversation assignment
  - Performance metrics

- **Additional Features**
  - File sharing
  - Rich text formatting
  - Chat transcripts
  - Analytics dashboard

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/minicom.git
   cd minicom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Start the Socket.IO server**
   ```bash
   node server.js
   ```

5. **Open in browser**
   - Admin: http://localhost:3000/admin
   - Visitor: http://localhost:3000/visitor

## 📝 Notes

- No environment variables needed
- Fully local development setup
- Built-in TypeScript support
- Hot reloading enabled

## 📄 License

MIT License - Feel free to use this project as a starting point for your own live chat implementation.
