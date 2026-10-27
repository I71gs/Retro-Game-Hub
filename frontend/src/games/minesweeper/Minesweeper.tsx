import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  neighborMines: number;
}

export function Minesweeper({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const [board, setBoard] = useState<Cell[][]>([]);
  const [firstClick, setFirstClick] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [face, setFace] = useState('🙂');
  const [timer, setTimer] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const timerRef = useRef<any>(null);

  const initBoard = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const newBoard: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      newBoard[r] = [];
      for (let c = 0; c < COLS; c++) {
        newBoard[r][c] = {
          r, c,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0,
        };
      }
    }
    setBoard(newBoard);
    setFirstClick(true);
    setGameOver(false);
    setFace('🙂');
    setTimer(0);
  }, []);

  useEffect(() => {
    initBoard();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [initBoard]);

  const plantMines = useCallback((safeR: number, safeC: number, currentBoard: Cell[][]) => {
    const forbidden = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        forbidden.add(`${safeR + dr},${safeC + dc}`);
      }
    }

    let planted = 0;
    while (planted < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const key = `${r},${c}`;
      if (!forbidden.has(key) && !currentBoard[r][c].isMine) {
        currentBoard[r][c].isMine = true;
        planted++;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!currentBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (currentBoard[nr][nc].isMine) count++;
              }
            }
          }
          currentBoard[r][c].neighborMines = count;
        }
      }
    }
  }, []);

  const revealCascade = useCallback((r: number, c: number, b: Cell[][]) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = b[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) return;

    cell.revealed = true;
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            revealCascade(r + dr, c + dc, b);
          }
        }
      }
    }
  }, []);

  const handleRightClick = useCallback((r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameOver || firstClick) return;

    const nextBoard = board.map(row => row.map(cell => ({ ...cell })));
    const target = nextBoard[r][c];
    if (target.revealed) return;

    target.flagged = !target.flagged;
    AudioManager.play('place');
    setBoard(nextBoard);
  }, [gameOver, firstClick, board]);

  const handleClick = useCallback((r: number, c: number) => {
    if (gameOver) return;

    if (flagMode) {
      handleRightClick(r, c);
      return;
    }

    const nextBoard = board.map(row => row.map(cell => ({ ...cell })));
    const target = nextBoard[r][c];
    if (target.flagged || target.revealed) return;

    if (firstClick) {
      setFirstClick(false);
      plantMines(r, c, nextBoard);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }

    if (nextBoard[r][c].isMine) {
      // Game over
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      setFace('💥');
      AudioManager.play('error');
      // Reveal all mines
      nextBoard.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.revealed = true;
      }));
      setBoard(nextBoard);
      setTimeout(() => onWin('GAME OVER', 2), 400);
      return;
    }

    revealCascade(r, c, nextBoard);
    AudioManager.play('move');

    // Check win
    let unrevealedSafe = 0;
    nextBoard.forEach(row => row.forEach(cell => {
      if (!cell.isMine && !cell.revealed) unrevealedSafe++;
    }));

    setBoard(nextBoard);

    if (unrevealedSafe === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      setFace('😎');
      AudioManager.play('win');
      setTimeout(() => onWin(p1Name, 18), 400);
    }
  }, [gameOver, flagMode, board, firstClick, plantMines, revealCascade, onWin, p1Name, handleRightClick]);

  const flaggedCount = board.flat().filter(c => c.flagged).length;

  return (
    <div className="flex flex-col items-center max-w-sm w-full mx-auto select-none">
      <div className="p-3 rounded-lg border-4 shadow-2xl" style={{ background: '#c0c0c0', borderColor: '#fff #808080 #808080 #fff' }}>
        <div className="flex justify-between items-center p-2 mb-2 border-2" style={{ background: '#c0c0c0', borderColor: '#808080 #fff #fff #808080' }}>
          <div className="font-vt text-2xl text-red-600 bg-black px-2 py-0.5 border border-gray-600 tracking-wider">
            {String(Math.max(0, MINES - flaggedCount)).padStart(3, '0')}
          </div>
          <button
            onClick={initBoard}
            className="w-9 h-9 text-xl bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center active:border-gray-600"
          >
            {face}
          </button>
          <div className="font-vt text-2xl text-red-600 bg-black px-2 py-0.5 border border-gray-600 tracking-wider">
            {String(Math.min(999, timer)).padStart(3, '0')}
          </div>
        </div>

        <div className="grid grid-cols-9 gap-[1px] bg-gray-600 border-2 border-gray-600">
          {board.flatMap((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(r, c, e)}
                onMouseDown={() => { if (!gameOver) setFace('😮'); }}
                onMouseUp={() => { if (!gameOver) setFace('🙂'); }}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-pixel text-xs font-bold transition-none ${
                  cell.revealed
                    ? cell.isMine
                      ? 'bg-red-500 border border-red-700'
                      : 'bg-[#d4d4d4] border border-gray-400'
                    : 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 active:border-gray-500'
                }`}
              >
                {cell.revealed ? (
                  cell.isMine ? '💣' : cell.neighborMines > 0 ? (
                    <span style={{
                      color: ['#00f', '#080', '#f00', '#008', '#800', '#088', '#000', '#888'][cell.neighborMines - 1]
                    }}>
                      {cell.neighborMines}
                    </span>
                  ) : ''
                ) : cell.flagged ? (
                  '🚩'
                ) : ''}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3 w-full max-w-xs">
        <button
          onClick={() => { setFlagMode(!flagMode); AudioManager.play('click'); }}
          className={`btn flex-1 py-2 font-pixel text-[10px] ${flagMode ? 'bg-pink-600 text-white' : ''}`}
        >
          {flagMode ? '🚩 FLAG MODE' : '⛏ REVEAL MODE'}
        </button>
        <button onClick={initBoard} className="btn py-2 px-4 font-pixel text-[10px]">
          ↺ RESET
        </button>
      </div>
      <div className="mt-2 font-pixel text-[8px]" style={{ color: 'var(--text-muted)' }}>
        LEFT CLICK: DIG · RIGHT CLICK: FLAG · TOGGLE FOR TOUCH
      </div>
    </div>
  );
}
