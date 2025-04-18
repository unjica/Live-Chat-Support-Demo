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
- 🔒 Environment-based configuration
- 🚀 Optimized for production deployment

## Tech Stack

- **Frontend:**
  - Next.js 15.3
  - React 19
  - TypeScript
  - Tailwind CSS
  - Socket.IO Client
  - Zustand (State Management)

- **Backend:**
  - Express.js
  - Socket.IO Server
  - Node.js

## Project Structure

```
├── src/                    # Frontend source code
│   ├── app/               # Next.js app directory
│   │   ├── admin/        # Admin dashboard pages
│   │   └── visitor/      # Visitor chat pages
│   ├── components/       # React components
│   │   ├── shared/      # Shared components
│   │   └── visitor/     # Visitor-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript definitions
│   └── styles/          # Global styles
├── backend/              # Backend server
│   ├── server.js        # Express and Socket.IO server
│   └── package.json     # Backend dependencies
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/unjica/Live-Chat-Support-Demo.git
cd Live-Chat-Support-Demo
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Copy `backend/.env.example` to `backend/.env`

5. Start the development servers:
```bash
# In one terminal, start the backend server
cd backend
npm start

# In another terminal, start the frontend server
npm run dev
```

6. Open your browser and visit:
   - Visitor Chat: http://localhost:3000/visitor
   - Admin Dashboard: http://localhost:3000/admin

## Environment Variables

The application requires environment variables to be set up in both frontend and backend. You can find example files in:

- Frontend: `.env.example` in the root directory
- Backend: `backend/.env.example`

### Frontend Variables (.env)
- `NEXT_PUBLIC_API_URL` - The URL of your backend API server

### Backend Variables (backend/.env)
- `FRONTEND_URL` - The URL of your frontend application
- `PORT` - The port number for the backend server

To set up the environment variables:

1. Copy `.env.example` to `.env` in the root directory
2. Copy `backend/.env.example` to `backend/.env`
3. Update the values in both `.env` files with your specific configuration

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

### Backend Scripts
- `cd backend && npm start` - Start the backend server

### Running the Application

To run the application, you'll need to start both the frontend and backend servers. You have two options:

#### Option 1: Run Servers Separately
```bash
# Terminal 1 - Start the backend server
cd backend
npm start

# Terminal 2 - Start the frontend server
npm run dev
```

#### Option 2: Run Both Servers with a Single Command
```bash
# From the root directory
npm run dev:all
```

## Features in Detail

### Visitor Interface
- Real-time message delivery and status updates
- Responsive design for all devices
- Message history preservation

### Admin Dashboard
- Multiple conversation management
- Real-time updates for new messages
- Conversation switching
- Message history tracking
