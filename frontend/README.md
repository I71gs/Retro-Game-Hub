# 🕹️ Retro Game Hub — Modern React Frontend

<div align="center">

![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff0055?style=for-the-badge&logo=framer&logoColor=white)

**The modern Single Page Application (SPA) edition of the Retro Game Hub.**

</div>

---

## 📖 Overview

This directory contains the modernized React implementation of Retro Game Hub. It pairs the nostalgic gameplay of all 14 arcade classics with modern component-driven architecture, declarative state management, smooth physics animations, and utility-first styling.

---

## 🎮 Included Games (React Implementations)

All 14 games have dedicated TypeScript components in `src/games/`:
- **Board & Strategy**:
  - `tictactoe/` — Tic-Tac-Toe
  - `dots/` — Dots & Boxes
  - `snl/` — Snakes & Ladders
  - `battleship/` — Battleship
  - `connectfour/` — Connect Four
- **Puzzles & Lexical**:
  - `hangman/` — Hangman
  - `memory/` — Memory Match
  - `game2048/` — 2048
  - `minesweeper/` — Minesweeper
- **Arcade & Reflex**:
  - `tetris/` — Tetris
  - `pong/` — Pong
  - `snake/` — Snake
  - `breakout/` — Breakout
  - `simonsays/` — Simon Says

---

## 🛠️ Tech Stack

- **Framework**: React 19 with Concurrent Features
- **Language**: TypeScript (~6.0) with strict type checking
- **Bundler**: Vite 8 with Hot Module Replacement (HMR)
- **Styling**: Tailwind CSS v4 & custom CRT retro animations
- **State Management**: Zustand 5.0 with persistent local storage
- **Animations**: Framer Motion 12
- **Linter**: Oxlint for high-performance static analysis

---

## 🚀 Getting Started

### Prerequisites
Node.js (v18 or higher recommended)

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Oxlint
npm run lint

# Build production bundle
npm run build

# Preview production build
npm run preview
```
