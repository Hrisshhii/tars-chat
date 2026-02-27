# 💬 Tars Chat – Fullstack Realtime Messaging App

A modern full-stack real-time chat application built using:

- ⚡ Next.js (App Router)
- 🧠 Convex (Realtime Backend & Database)
- 🔐 Clerk (Authentication)
- 🎨 TailwindCSS (UI)
- 🎞 Framer Motion (Animations)
- 😀 Emoji Picker
- ☁️ Deployed on Vercel

---

## 🌍 Live Demo

Vercel Deployment: https://tars-chat-black.vercel.app/

---

## 🚀 Features

### ✅ Authentication
- Clerk-based secure login/signup
- User auto-sync into Convex DB

### 💬 1-on-1 Chat
- Realtime messaging
- Message timestamps
- Seen status (single tick / double tick)
- Delete message (sender only)

### 👥 Group Chat
- Create group with custom name
- Add multiple participants
- Group header shows members
- Delete group (creator only)

### 🟢 Presence System
- Online status (live ping every 10 seconds)
- Last seen indicator
- Auto offline on unload

### ✍ Typing Indicators
- Realtime typing status

### 😀 Emoji Support
- Emoji picker integrated
- Works with realtime messaging

### 🔔 Unread Messages
- Unread message count per conversation
- Auto-clear when opened

### 🎨 Modern UI
- Glassmorphism effects
- Gradient message bubbles
- Framer Motion animations
- Responsive layout

---

## 🗂 Database Schema (Convex)

### users
- clerkId
- name
- email
- imageUrl
- isOnline
- lastSeen

### conversations
- participants[]
- isGroup
- name
- lastMessage

### messages
- conversationId
- senderId
- content
- seenBy[]
- createdAt

---

## 🛠 Local Setup

```bash
git clone https://github.com/your-username/tars-chat
cd tars-chat
npm install
```

---

## 🧠 AI Tool Used
This project was built using AI-assisted development tools:
- ChatGPT (architecture, debugging, UI improvements)

---