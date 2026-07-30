import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameConfig } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import {
  GRID_SIZE, placeShipsRandom, createAIState, getAIShot, processAIResult,
  type Ship,
} from './ai/hunt_target';

type Cell = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

function makeGrid(): Cell[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty') as Cell[]);
}

function applyShipsToGrid(ships: Ship[]): Cell[][] {
  const g = makeGrid();
  ships.forEach(s => s.cells.forEach(([r, c]) => { g[r][c] = 'ship'; }));
  return g;
}

type Phase = 'placing' | 'battle';

export function Battleship({ config }: { config: GameConfig }) {
  const { p1Name, onWin } = config;
  const [phase, setPhase] = useState<Phase>('placing');
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [aiShips, setAiShips] = useState<Ship[]>([]);
  const [playerGrid, setPlayerGrid] = useState<Cell[][]>(makeGrid);
  const [aiGrid, setAiGrid] = useState<Cell[][]>(makeGrid);
  const [aiState] = useState(createAIState);
  const [status, setStatus] = useState('Randomizing your fleet...');
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const ended = useRef(false);

  // Auto-place ships on mount
  useEffect(() => {
    const pShips = placeShipsRandom();
    const aShips = placeShipsRandom();
    setPlayerShips(pShips);
    setAiShips(aShips);
    setPlayerGrid(applyShipsToGrid(pShips));
    setAiGrid(makeGrid());
    setStatus('Your fleet is ready! Attack the enemy grid (right).');
    setPhase('battle');
  }, []);

  const checkAllSunk = (ships: Ship[]) => ships.every(s => s.hits >= s.size);

  const handleAttack = useCallback((r: number, c: number) => {
    if (!playerTurn || gameOver || phase !== 'battle') return;
    if (aiGrid[r][c] === 'hit' || aiGrid[r][c] === 'miss' || aiGrid[r][c] === 'sunk') return;

    const ship = aiShips.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
    const newAiGrid = aiGrid.map(row => [...row]) as Cell[][];
    const newAiShips = aiShips.map(s => ({ ...s, cells: [...s.cells] }));

    if (ship) {
      const si = newAiShips.findIndex(s => s.name === ship.name);
      newAiShips[si].hits++;
      const sunk = newAiShips[si].hits >= newAiShips[si].size;
      if (sunk) {
        newAiShips[si].cells.forEach(([sr, sc]) => { newAiGrid[sr][sc] = 'sunk'; });
        AudioManager.play('win');
        setStatus(`💥 ${ship.name} sunk!`);
      } else {
        newAiGrid[r][c] = 'hit';
        AudioManager.play('hit');
        setStatus(`🎯 Hit!`);
      }
    } else {
      newAiGrid[r][c] = 'miss';
      AudioManager.play('miss');
      setStatus('💧 Miss!');
    }

    setAiGrid(newAiGrid);
    setAiShips(newAiShips);

    if (checkAllSunk(newAiShips) && !ended.current) {
      ended.current = true;
      setGameOver(true);
      setStatus('🏆 YOU WIN! All enemy ships sunk!');
      setTimeout(() => onWin(p1Name, 25), 600);
      return;
    }

    setPlayerTurn(false);

    // AI turn
    setTimeout(() => {
      const [ar, ac] = getAIShot(aiState);
      const pShip = playerShips.find(s => s.cells.some(([sr, sc]) => sr === ar && sc === ac));
      const newPGrid = playerGrid.map(row => [...row]) as Cell[][];
      const newPShips = playerShips.map(s => ({ ...s }));

      if (pShip) {
        const si = newPShips.findIndex(s => s.name === pShip.name);
        newPShips[si].hits++;
        const sunk = newPShips[si].hits >= newPShips[si].size;
        if (sunk) {
          newPShips[si].cells.forEach(([sr, sc]) => { newPGrid[sr][sc] = 'sunk'; });
          setStatus(`💥 Enemy sunk your ${pShip.name}!`);
        } else {
          newPGrid[ar][ac] = 'hit';
          setStatus('⚠️ Enemy hit your ship!');
        }
        processAIResult(aiState, ar, ac, true);
        AudioManager.play('error');
      } else {
        newPGrid[ar][ac] = 'miss';
        setStatus('Enemy missed!');
        processAIResult(aiState, ar, ac, false);
      }

      setPlayerGrid(newPGrid);
      setPlayerShips(newPShips);

      if (checkAllSunk(newPShips) && !ended.current) {
        ended.current = true;
        setGameOver(true);
        setStatus('💀 YOU LOSE! All your ships were sunk!');
        setTimeout(() => onWin('COMPUTER', null), 600);
        return;
      }

      setPlayerTurn(true);
    }, 800);
  }, [playerTurn, gameOver, phase, aiGrid, aiShips, playerGrid, playerShips, aiState, p1Name, onWin]);

  function cellClass(cell: Cell, isPlayer: boolean): string {
    if (cell === 'ship' && isPlayer) return 'bs-cell ship';
    if (cell === 'hit') return 'bs-cell hit';
    if (cell === 'miss') return 'bs-cell miss';
    if (cell === 'sunk') return 'bs-cell sunk';
    return 'bs-cell';
  }

  function cellContent(cell: Cell): string {
    if (cell === 'hit') return '🔥';
    if (cell === 'miss') return '💧';
    if (cell === 'sunk') return '💀';
    return '';
  }

  return (
    <div className="bs-wrapper">
      <div className="bs-status">{status}</div>

      <div className="bs-boards">
        {/* Player Board */}
        <div className="bs-board-section">
          <div className="bs-board-label" style={{ color: 'var(--p1)' }}>YOUR FLEET</div>
          <div className="bs-grid">
            {playerGrid.map((row, r) =>
              row.map((cell, c) => (
                <div key={`p-${r}-${c}`} className={cellClass(cell, true)} style={{ cursor: 'default' }}>
                  {cellContent(cell)}
                </div>
              ))
            )}
          </div>
          {/* Ship status */}
          <div className="bs-ships-remaining mt-1">
            {playerShips.map(s => (
              <div key={s.name} className={`bs-ship-chip${s.hits >= s.size ? ' sunk' : ''}`}>
                {s.name[0]} {'▪'.repeat(s.size - s.hits)}{'×'.repeat(s.hits)}
              </div>
            ))}
          </div>
        </div>

        {/* AI Board */}
        <div className="bs-board-section">
          <div className="bs-board-label" style={{ color: 'var(--p2)' }}>
            ENEMY WATERS {playerTurn && !gameOver ? '← ATTACK!' : ''}
          </div>
          <div className="bs-grid">
            {aiGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`a-${r}-${c}`}
                  className={`${cellClass(cell, false)}${playerTurn && !gameOver && cell === 'empty' ? ' hover:opacity-80' : ''}`}
                  style={{ cursor: playerTurn && !gameOver && cell === 'empty' ? 'crosshair' : 'default' }}
                  onClick={() => handleAttack(r, c)}
                >
                  {cellContent(cell)}
                </div>
              ))
            )}
          </div>
          {/* AI ship status */}
          <div className="bs-ships-remaining mt-1">
            {aiShips.map(s => (
              <div key={s.name} className={`bs-ship-chip${s.hits >= s.size ? ' sunk' : ''}`}>
                {s.name[0]} {'▪'.repeat(s.size - s.hits)}{'×'.repeat(s.hits)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
