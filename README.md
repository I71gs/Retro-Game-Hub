# Retro Game Hub

Retro Game Hub is a lightweight browser arcade built with plain HTML, CSS, and JavaScript. It brings 9 classic mini-games into a single web app with player profiles, a coin reward system, theme controls, and local persistence.

## What This Project Is

A single-page retro game platform that runs in modern browsers and works offline after first load. The project is built without frameworks, relying on vanilla JavaScript for game logic, UI management, and audio synthesis.

## Core Features

- 9 built-in games:
  - Tic-Tac-Toe
  - Dots & Boxes
  - Snakes & Ladders
  - Battleship
  - Connect Four
  - Hangman
  - Memory Match
  - Tetris
  - Pong
- Player profiles with PIN-based login and guest mode
- Coin rewards saved in browser `localStorage`
- Theme switching and display settings
- Procedural sound and music using Web Audio API
- Simple multiplayer-ready server using `Express` and `ws`

## How to Run

1. Open a terminal in the project folder.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000` in your browser.

## Project Structure

- `index.html` — main app shell and screen layout
- `css/main.css` — styles, themes, and responsive layout
- `js/main.js` — app controller and routing logic
- `js/ui.js` — screen rendering and modal control
- `js/player.js` — profile, session, and local storage logic
- `js/sound.js` — sound effects and music engine
- `games/*.js` — individual game implementations
- `server.js` — Node server for hosting and multiplayer support
- `package.json` — application metadata and start script

## Why It Matters

This project is a compact and self-contained demonstration of web app development without external libraries. It shows how to build game logic, UI flow, persistence, and audio from scratch in a browser-friendly way.

## Short Project Description

Retro Game Hub is a browser-based arcade that packages classic retro games into a polished single-page experience. It supports player accounts, coin tracking, theme customization, and lightweight multiplayer hosting, all implemented with vanilla web technologies.
