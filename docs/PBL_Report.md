# PROJECT REPORT

## A PROJECT REPORT ON

**Retro Game Hub**


## BACHELOR OF TECHNOLOGY

IN CSIT (CYBER SECURITY) / (AIML)


## SUBMITTED BY

| PRN | Name of the Student |
|---|---|
| 2501106155 | Shubham Salunke |


## UNDER THE GUIDANCE OF

(Name of the Guide)


School of Computer Science and Information Technology

Symbiosis Skills and Professional University, Pune

Academic Year 2025-26

---

## CERTIFICATE

This is to certify that the project titled “Retro Game Hub” submitted to the School of Computer Science and Information Technology (CSIT), Symbiosis Skills and Professional University, Pune, as part of the Project-Based Learning (PBL) is based on our original work carried out under the guidance of ___________________________.

The report has not been submitted elsewhere for the award of any other degree, diploma, or certification.

The material borrowed from other sources and incorporated in the report has been duly acknowledged and referenced.

We understand that we could be held responsible and accountable for plagiarism, if any, detected later.

Sr. No | PRN | Name | Sign
--- | --- | --- | ---
1 | 2501106155 | Shubham Salunke | ________

Date: __________

Place: Pune
 
Name of Guide: ________________________

Designation:

Director

School of CSIT

---

## ABSTRACT

Retro Game Hub is a browser-built collection of classic games using only HTML, CSS, and Vanilla JavaScript. It delivers an interactive, offline-ready experience with persistent player profiles, a coin reward system, AI opponents, and responsive retro visuals. This project demonstrates how traditional notebook games can be transformed into a polished digital arcade without using frameworks or external libraries.

The latest updates include a full reward-path fix for Tetris and Pong, a unified game-over modal system, removal of an obsolete Mastermind module, and improved coin persistence in the player database.

---

## ACKNOWLEDGEMENT

I, Shubham Salunke, express my sincere gratitude to my project guide for their valuable support and guidance through the development of Retro Game Hub. I also thank my mentors for their feedback during testing and the opportunity to work on this project in the Project-Based Learning program. This project has been an invaluable learning experience in full-stack web development, software architecture, and system design.

---

## TABLE OF CONTENTS

1. Introduction
2. Literature Review
3. Subject-Wise Integration
4. Methodology & System Design
5. Implementation
6. Results and Analysis
7. Discussion
8. Conclusion & Future Scope
9. References
10. Appendix

---

## CHAPTER 1: INTRODUCTION

### 1.1 Background

Retro Game Hub is a web-based game collection inspired by the notebook games played by students during their school years. The project aims to recreate these classics in a modern browser environment while preserving their simplicity and nostalgic appeal.

### 1.2 Motivation

The motivation behind the project is to build a compact, offline-capable gaming platform that works without installation and showcases core web technologies. It also serves as a practical demonstration of game logic, UI design, and state persistence.

### 1.3 Problem Statement

Many notebook-style games are available only as simple mobile applications or desktop installs. This project addresses the need for a lightweight, browser-accessible retro game hub that can run on any device with minimum dependencies.

### 1.4 Objectives

- Build a multi-game web application using only HTML, CSS, and JavaScript.
- Implement persistent player profiles and reward tracking using LocalStorage.
- Create AI opponents and game logic for multiple classic games.
- Provide a polished retro interface with sound, themes, and responsive design.
- Fix known gameplay issues including reward persistence and modal behavior.

### 1.5 Scope

The scope includes nine playable games, player account management, coin rewards, leaderboards, and a retro-themed UI suitable for desktop and mobile browsers.

---

## CHAPTER 2: LITERATURE REVIEW

### 2.1 Existing Solutions

Existing retro game hubs often rely on frameworks, external libraries, or server-side logic. Many are limited to a single game or do not include persistent player data.

### 2.2 Comparative Study

Retro Game Hub differentiates by using only vanilla JavaScript and local browser storage, combining multiple classic games in a single app while keeping the experience lightweight and offline-capable.

---

## CHAPTER 3: SUBJECT-WISE INTEGRATION

| Course Code | Course Name | Concept Used | Application in Project |
|---|---|---|---|
| CSIT | Web Development | HTML, CSS, JavaScript | Building the game UI and responsive layout |
| AI/ML | Artificial Intelligence | Minimax, Alpha-Beta pruning | Game AI for Tic-Tac-Toe, Connect Four |
| Programming | Data Structures & Algorithms | Arrays, loops, event handling | Game state, collision and board logic |
| Software Engineering | Project Management | Versioning, testing | Bug fixes, report documentation |

---

## CHAPTER 4: METHODOLOGY & SYSTEM DESIGN

### 4.1 Architecture Diagram

The application uses a modular architecture with a central UI controller and separate game modules. Core components include:
- `index.html` for screen layout
- `css/main.css` for styling and themes
- `js/main.js` for app routing and game launch
- `js/player.js` for LocalStorage-based persistence
- `js/ui.js` for modal and HUD management
- `games/*.js` for individual game logic

### 4.2 Hardware Requirement

No special hardware is required. The app runs in any modern browser on desktop and mobile.

### 4.3 Software Requirement

- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript-enabled environment
- No server or installation required

### 4.4 Flowchart / Algorithm

Game flow begins at the boot screen, proceeds to player login/guest mode, then loads the selected game. Each game module handles its own state, win condition, and reward logic.

### 4.5 Database Design

The project uses browser `LocalStorage` as a simple key-value store for player profiles and game statistics.

### 4.6 Models/Equations

Scoring and reward calculations are implemented using game-specific rules and fixed coin values.

### 4.7 Approach, Architecture, Tools & Technologies

The project uses vanilla web technologies and a modular JavaScript structure. Key tools are browser DevTools and LocalStorage.

---

## CHAPTER 5: IMPLEMENTATION

### 5.1 Development Process

The application was built iteratively, adding game modules one by one and testing each feature in isolation. The latest fixes were applied after identifying coin persistence and modal problems.

### 5.2 Modules

- UI Controller: screen navigation, modals, HUD
- Player Database: account creation, login, coins, leaderboard
- Sound Engine: Web Audio procedural music and effects
- Games: Tic-Tac-Toe, Dots & Boxes, Snakes & Ladders, Battleship, Connect Four, Hangman, Memory Match, Tetris, Pong

### 5.3 Algorithms

- Minimax for unbeatable Tic-Tac-Toe and Connect Four AI
- Heuristic move selection for Dots & Boxes
- Grid-based collision and line clearing for Tetris
- Paddle and ball physics for Pong

---

## CHAPTER 6: RESULT ANALYSIS

### 6.1 Output

The final product runs as a browser-based retro arcade with persistent player coins, profile login, leaderboards, and polished game interactions.

### 6.2 Testing

The app was tested for:
- Player login and guest mode
- Coin rewards and LocalStorage persistence
- Game win/loss scenarios for Tetris, Pong, Tic-Tac-Toe, and others
- UI modal behavior after games
- Responsive display across desktop and mobile screen sizes

### 6.3 Performance

The app is lightweight and performs well in modern browsers, with no dependency on external libraries or servers.

---

## CHAPTER 7: DISCUSSION

This project demonstrates that classic games can be recreated in a modern browser using only vanilla web technologies. The latest debugging effort focused on making reward flows reliable and improving user feedback at game end.

---

## CHAPTER 8: CONCLUSION & FUTURE SCOPE

Retro Game Hub successfully delivers multiple classic games in one browser experience, complete with player accounts, coins, and AI opponents.

Future scope includes:
- Adding multiplayer networking
- More game modules like Sudoku or Chess
- Better animation and sound variation
- Mobile app packaging

---

## REFERENCES

- MDN Web Docs
- Web Audio API documentation
- LocalStorage documentation
- Algorithm references for Minimax and Alpha-Beta pruning

---

## APPENDIX

Source code files are available in the `retro-game-hub` folder, including:
- `index.html`
- `css/main.css`
- `js/main.js`
- `js/player.js`
- `js/ui.js`
- `js/sound.js`
- `games/*.js`

Additional data and testing notes may be appended by the project team.