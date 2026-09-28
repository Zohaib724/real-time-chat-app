# Real-Time Chat App

A real-time one-to-one chat application built using Next.js, TypeScript, Tailwind CSS, and Appwrite. Users can create accounts, log in, view registered users, start one-to-one conversations, and exchange messages in real time.

## Features

- User signup with name, email, and password
- User login and logout
- Protected chat page
- List of registered users
- One-to-one conversations
- Messages stored in Appwrite Database
- Real-time message updates using Appwrite Realtime
- Sender name and message timestamp
- Previous messages load when opening a conversation
- Automatic message scrolling
- Empty messages are prevented
- Responsive chat interface
- Deployed on Vercel

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Appwrite
- Appwrite Authentication
- Appwrite TablesDB
- Appwrite Realtime
- Vercel

## Project Structure

```text
real-time-chat-app/
│
├── app/
│   ├── chat/
│   ├── login/
│   ├── signup/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   └── appwrite.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md