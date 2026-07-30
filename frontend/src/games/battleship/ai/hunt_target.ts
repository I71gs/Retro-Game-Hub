// Hunt-and-Target AI for Battleship

export const GRID_SIZE = 10;

export interface Ship {
  name: string;
  size: number;
  cells: [number,number][];
  hits: number;
}

export function placeShipsRandom(): Ship[] {
  const SHIPS_DEF = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 },
  ];

  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const ships: Ship[] = [];

  for (const def of SHIPS_DEF) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horiz = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horiz ? GRID_SIZE : GRID_SIZE - def.size + 1));
      const c = Math.floor(Math.random() * (horiz ? GRID_SIZE - def.size + 1 : GRID_SIZE));
      const cells: [number,number][] = [];
      let ok = true;
      for (let i = 0; i < def.size; i++) {
        const nr = horiz ? r : r + i;
        const nc = horiz ? c + i : c;
        if (grid[nr][nc]) { ok = false; break; }
        cells.push([nr, nc]);
      }
      if (ok) {
        cells.forEach(([nr, nc]) => { grid[nr][nc] = true; });
        ships.push({ name: def.name, size: def.size, cells, hits: 0 });
        placed = true;
      }
    }
  }
  return ships;
}

interface AIState {
  mode: 'hunt' | 'target';
  lastHit: [number,number] | null;
  targets: [number,number][];
  tried: Set<string>;
}

export function createAIState(): AIState {
  return { mode: 'hunt', lastHit: null, targets: [], tried: new Set() };
}

export function getAIShot(state: AIState): [number,number] {
  let r: number, c: number;
  if (state.mode === 'target' && state.targets.length > 0) {
    [r, c] = state.targets.shift()!;
  } else {
    // Hunt: checkerboard pattern first
    const candidates: [number,number][] = [];
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = (i % 2); j < GRID_SIZE; j += 2)
        if (!state.tried.has(`${i},${j}`)) candidates.push([i, j]);
    if (candidates.length === 0) {
      for (let i = 0; i < GRID_SIZE; i++)
        for (let j = 0; j < GRID_SIZE; j++)
          if (!state.tried.has(`${i},${j}`)) candidates.push([i, j]);
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    [r, c] = pick;
  }
  state.tried.add(`${r},${c}`);
  return [r, c];
}

export function processAIResult(state: AIState, r: number, c: number, hit: boolean) {
  if (hit) {
    state.mode = 'target';
    state.lastHit = [r, c];
    // Add adjacent cells as targets
    const neighbors: [number,number][] = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
    neighbors.forEach(([nr, nc]) => {
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !state.tried.has(`${nr},${nc}`))
        state.targets.push([nr, nc]);
    });
  } else if (state.targets.length === 0) {
    state.mode = 'hunt';
    state.lastHit = null;
  }
}
