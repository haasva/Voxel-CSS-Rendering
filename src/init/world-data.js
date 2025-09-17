import { createNoise2D } from 'simplex-noise';

export let worldData;



class WorldGenerator {
  constructor({
    sizeX = 500,
    sizeY = 500,
    sizeZ = 10,
    maxElevation = 1,
    noiseScale = 2,
    seed = Math.random()
  } = {}) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.maxElevation = maxElevation;
    this.noiseScale = noiseScale;

    // SimplexNoise v4+ style
    this.noise2D = createNoise2D(() => seed);

    this.worldData = this._generateWorld();

  }

_generateWorld() {
  const { sizeX, sizeY, sizeZ, maxElevation, noiseScale, noise2D } = this;

  let world = new Array(sizeX).fill(null).map(() =>
    new Array(sizeY).fill(null).map(() =>
      new Array(sizeZ).fill(null).map(() => ({
        isBlock: false,
        material: "air",
        shadedTop: false,
      }))
    )
  );

  // store elevations first so we can compare neighbors
  let elevations = new Array(sizeX).fill(0).map(() =>
    new Array(sizeY).fill(0)
  );

  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      let n = noise2D(x / noiseScale, y / noiseScale);
      elevations[x][y] = Math.floor(((n + 1) / 2) * maxElevation);
    }
  }

  // fill blocks
  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      let elevation = elevations[x][y];

      for (let z = 0; z < sizeZ; z++) {
        if (z <= elevation) {
          world[x][y][z].isBlock = true;
          world[x][y][z].elevation = elevation;

          if (z === elevation) {
            world[x][y][z].material = "grass";
            if (Math.random() < 0.1) {
              world[x][y][z].material = "tree";
              world[x][y][z].hasTree = true;
            }
          }
        }
      }
    }
  }

  // shading step
  const dirs = [
    [1, 0], 
    [-1, 0],
    [0, 1], 
    [0, -1],
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1]
  ];

  for (let x = 0; x < sizeX; x++) {
    for (let y = 0; y < sizeY; y++) {
      let elevation = elevations[x][y];
      if (elevation < 0 || elevation >= sizeZ) continue;

      const topBlock = world[x][y][elevation];
      if (!topBlock.isBlock) continue;

      // check if any neighbor is higher
      for (let [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= sizeX || ny >= sizeY) continue;

        if (elevations[nx][ny] > elevation) {
          topBlock.shadedTop = true;
          break;
        }
      }
    }
  }

  return world;
}


  getWorldData() {
    return this.worldData;
  }
}



const generator = new WorldGenerator({
  sizeX: 500,
  sizeY: 500,
  sizeZ: 20,
  maxElevation: 8,
  noiseScale: 20
});

console.log(generator.getWorldData());


export function generateWorldData() {
  worldData = generator.getWorldData();
}

