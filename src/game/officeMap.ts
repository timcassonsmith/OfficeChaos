import { GRID_H, GRID_W, REGIONS } from './constants';

export interface OfficeTile {
  type: string;
  walkable: boolean;
  region: string | null;
  deskId?: number;
  sides?: Record<string, boolean>;
}

export const MAIN_BOUNDS = { x0: 2, y0: 6, x1: 13, y1: 12 };
export const BOSS_BOUNDS = { x0: 5, y0: 1, x1: 10, y1: 4 };

export const OFFICE_MAP: OfficeTile[][] = buildOfficeMap();

export const DESK_POSITIONS = [
  { gx: 3, gy: 7 }, { gx: 6, gy: 7 }, { gx: 9, gy: 7 }, { gx: 12, gy: 7 },
  { gx: 3, gy: 10 }, { gx: 6, gy: 10 },
];

export const POI = {
  coffee: { gx: 2, gy: 10 },
  cooler: { gx: 2, gy: 9 },
  vending: { gx: 2, gy: 8 },
  sofa: { gx: 12, gy: 8 },
  bossDesk: { gx: 7.5, gy: 2.5 },
  bossDoor: { gx: 7.5, gy: 5.2 },
};

function buildOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    map[y] = [];
    for (let x = 0; x < GRID_W; x++) {
      map[y][x] = { type: 'void', walkable: false, region: null };
    }
  }

  fillRegion(map, BOSS_BOUNDS, 'boss_floor', REGIONS.BOSS);
  fillRegion(map, MAIN_BOUNDS, 'main_floor', REGIONS.MAIN);

  for (let x = 6; x <= 9; x++) {
    map[5][x] = { type: 'hall_floor', walkable: true, region: REGIONS.HALL };
  }
  map[5][7] = { type: 'doorway', walkable: true, region: REGIONS.HALL };
  map[5][8] = { type: 'doorway', walkable: true, region: REGIONS.HALL };

  map[2][7] = { type: 'boss_desk', walkable: false, region: REGIONS.BOSS };
  map[2][8] = { type: 'boss_chair', walkable: false, region: REGIONS.BOSS };
  map[3][5] = { type: 'bookshelf', walkable: false, region: REGIONS.BOSS };
  map[3][10] = { type: 'plant', walkable: true, region: REGIONS.BOSS };
  map[1][6] = { type: 'window', walkable: false, region: REGIONS.BOSS };
  map[1][9] = { type: 'window', walkable: false, region: REGIONS.BOSS };
  map[4][5] = { type: 'filing', walkable: false, region: REGIONS.BOSS };
  map[4][10] = { type: 'plant', walkable: true, region: REGIONS.BOSS };

  const cubicles = [
    [3, 7], [6, 7], [9, 7], [12, 7],
    [3, 10], [6, 10], [9, 10], [12, 10],
  ];
  cubicles.forEach(([cx, cy], i) => {
    map[cy][cx] = { type: 'desk', walkable: false, deskId: i, region: REGIONS.MAIN };
    map[cy - 1][cx] = { type: 'partition', walkable: false, region: REGIONS.MAIN };
    map[cy][cx - 1] = { type: 'partition', walkable: false, region: REGIONS.MAIN };
    map[cy][cx + 1] = { type: 'partition', walkable: false, region: REGIONS.MAIN };
  });

  map[8][2] = { type: 'vending', walkable: false, region: REGIONS.MAIN };
  map[9][2] = { type: 'cooler', walkable: false, region: REGIONS.MAIN };
  map[10][2] = { type: 'coffee', walkable: false, region: REGIONS.MAIN };
  map[8][12] = { type: 'sofa', walkable: false, region: REGIONS.MAIN };
  map[10][12] = { type: 'bookshelf', walkable: false, region: REGIONS.MAIN };
  [[4, 8], [11, 8], [5, 11], [10, 11]].forEach(([x, y]) => {
    map[y][x] = { type: 'plant', walkable: true, region: REGIONS.MAIN };
  });
  map[11][11] = { type: 'printer', walkable: false, region: REGIONS.MAIN };

  buildWalls(map);
  return map;
}

function fillRegion(
  map: OfficeTile[][],
  b: typeof MAIN_BOUNDS,
  floorType: string,
  region: string,
) {
  for (let y = b.y0; y <= b.y1; y++) {
    for (let x = b.x0; x <= b.x1; x++) {
      map[y][x] = { type: floorType, walkable: true, region };
    }
  }
}

function buildWalls(map: OfficeTile[][]) {
  const markWall = (x: number, y: number, side: string) => {
    if (!map[y]?.[x] || map[y][x].type === 'void') return;
    if (!map[y][x].sides) map[y][x].sides = {};
    map[y][x].sides![side] = true;
  };

  for (let x = BOSS_BOUNDS.x0; x <= BOSS_BOUNDS.x1; x++) markWall(x, BOSS_BOUNDS.y0, 'north');
  for (let y = BOSS_BOUNDS.y0; y <= BOSS_BOUNDS.y1; y++) {
    markWall(BOSS_BOUNDS.x0, y, 'west');
    markWall(BOSS_BOUNDS.x1, y, 'east');
  }
  for (let x = BOSS_BOUNDS.x0; x <= BOSS_BOUNDS.x1; x++) {
    if (x >= 6 && x <= 9) continue;
    markWall(x, BOSS_BOUNDS.y1 + 1, 'north');
  }

  for (let x = MAIN_BOUNDS.x0; x <= MAIN_BOUNDS.x1; x++) markWall(x, MAIN_BOUNDS.y0 - 1, 'north');
  for (let y = MAIN_BOUNDS.y0; y <= MAIN_BOUNDS.y1; y++) {
    markWall(MAIN_BOUNDS.x0 - 1, y, 'west');
    markWall(MAIN_BOUNDS.x1 + 1, y, 'east');
  }
}

function isFloor(tile: OfficeTile) {
  return ['boss_floor', 'main_floor', 'hall_floor', 'doorway'].includes(tile.type);
}

export { isFloor };
