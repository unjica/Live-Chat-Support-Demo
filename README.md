# Live Chat Support Demo

A real-time chat support application built with Next.js, Socket.IO, and TypeScript. This application demonstrates a WhatsApp-style chat interface with support for both visitor and admin interactions.

## Features

- 💬 Real-time messaging using Socket.IO
- 👥 Separate interfaces for visitors and admin
- 📱 Responsive design with WhatsApp-inspired UI
- 🔄 Real-time message status updates
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support
- 📊 Admin dashboard for managing multiple conversations

## Tech Stack

- **Frontend:**
  - Next.js 15.3
  - React 19
  - TypeScript
  - Tailwind CSS
  - Socket.IO Client
  - Zustand (State Management)

- **Backend:**
  - Express
  - Socket.IO Server
  - Node.js

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/live-chat-support-demo.git
cd live-chat-support-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
# In one terminal, start the Socket.IO server
npm run server

# In another terminal, start the Next.js development server
npm run dev
```

4. Open your browser and visit:
   - Visitor Chat: http://localhost:3000/visitor
   - Admin Dashboard: http://localhost:3000/admin

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   └── visitor/           # Visitor chat pages
├── components/            # React components
│   ├── shared/           # Shared components
│   └── visitor/          # Visitor-specific components
├── lib/                   # Utility functions and configurations
├── store/                # State management (Zustand)
├── types/                # TypeScript type definitions
└── styles/               # Global styles and Tailwind CSS
```

## Features in Detail

### Visitor Interface
- WhatsApp-style chat interface
- Real-time message delivery
- Message status indicators
- Responsive design for mobile devices

### Admin Dashboard
- Multiple conversation management
- Real-time updates for new messages
- Conversation switching
- Message history preservation

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Socket.IO server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```
