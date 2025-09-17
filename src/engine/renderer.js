import { worldData } from "../init/world-data.js";
import { applyNeoTransforms, updateAllCardboardRotations } from "../init/start.js";
import { SETTINGS } from "../init/start.js";
import { updateEPlane } from "./entity-plane.js";

const canvases = {
  horizontal: [],
  verticalX: [],
  verticalY: [],
};

export const player = {
  worldX: 250,
  worldY: 250,
  worldZ: 10, // middle height
  canvasX: 5,
  canvasY: 5
};

export let worldX, worldY, worldZ;

export let currentBlock = null;


export function createVoxelCanvasGrid() {
  const container = document.getElementById('renderer');

  const size = 200 * 10;    // canvas size
  const spacing = 100;  // distance between planes
  const count = 11;    // number of canvases each direction

  // Horizontal canvases (stacked in Y)
  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.classList.add('horizontal');
    if (i === 0) canvas.classList.add(`floor`);
    
    // position: translate Y down, rotate to lay flat
    canvas.style.transform = `
      translateY(${500 - (i * spacing)}px)
       rotateX(-90deg) rotateY(180deg)

    `;
    container.appendChild(canvas);
    canvases.horizontal.push(canvas);
  }

  // Vertical canvases (stacked in X)
  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.classList.add('verticalX');
    if (i === 0) canvas.classList.add(`first`);
    if (i === 10) canvas.classList.add(`last`);

    // position: translate X right, rotate to stand up
    canvas.style.transform = `
      translateX(${500 - (i * spacing)}px)
      rotateY(90deg)


    `;
    container.appendChild(canvas);
    canvases.verticalX.push(canvas);
  }

  // Vertical canvases (stacked in Y)
  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.classList.add('verticalY');
     if (i === 0) canvas.classList.add(`first`);
         if (i === 10) canvas.classList.add(`last`);
    // position: translate X right, rotate to stand up
    canvas.style.transform = `
      translateZ(${500 - (i * spacing)}px)
      rotateX(0deg)
      rotateY(180deg)


    `;
    container.appendChild(canvas);
    canvases.verticalY.push(canvas);
  }

Object.values(canvases).forEach(arr => {
    arr.forEach(canvas => {

        canvas.style.msInterpolationMode = 'nearest-neighbor';

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    });
});

preloadTextures(() => {
  console.log("All textures loaded!");
  renderWorldToCanvases();
});
  
}


function renderWorldToCanvases() {
  renderSlices(canvases.horizontal, "z");  // horizontal slices (fixed Z)
  renderSlices(canvases.verticalX, "x");   // vertical X slices (fixed X)
  renderSlices(canvases.verticalY, "y");   // vertical Y slices (fixed Y)
}

const textures = {};

function preloadTextures(callback) {
  const images = {
    desert: 'desert.png',
    steppe: 'steppe.png',
    montane: 'montane.jpg'
  };
  let loaded = 0;
  const total = Object.keys(images).length;

  Object.entries(images).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      textures[key] = img;
      loaded++;
      if (loaded === total && typeof callback === 'function') {
        callback();
      }
    };
    img.onerror = () => {
      loaded++;
      if (loaded === total && typeof callback === 'function') {
        callback();
      }
    };
  });
  console.log(textures);
}


const faces = {
  z: [
    {
      name: "top",
      offset: -1, // zNeg
      texture: "montane",
      isVisible: (world, x, y, zNeg, zPos) =>
        world[x]?.[y]?.[zNeg]?.isBlock && !(world[x]?.[y]?.[zPos]?.isBlock),
      applyStyle: (world, x, y, zNeg) => 
        zNeg >= 0 && world[x]?.[y]?.[zNeg]?.shadedTop === true,
      map: (gy, gOther, cellSize, gridSize) => [
        gOther * cellSize, gy * cellSize
      ],

    },
    {
      name: "bottom",
      offset: 0, // zPos
      texture: "desert",
      isVisible: (world, x, y, zNeg, zPos) =>
        world[x]?.[y]?.[zPos]?.isBlock && !(world[x]?.[y]?.[zNeg]?.isBlock),
      map: (gy, gOther, cellSize, gridSize) => [
        gOther * cellSize, gy * cellSize
      ]
    }
  ],

  x: [
    {
      name: "right",
      offset: -1,
      texture: "steppe",
      isVisible: (world, xNeg, xPos, y, z) =>
        world[xNeg]?.[y]?.[z]?.isBlock && !(world[xPos]?.[y]?.[z]?.isBlock),
      map: (gy, gOther, cellSize, gridSize) => [
        gy * cellSize, (gridSize - gOther - 1) * cellSize
      ]
    },
    {
      name: "left",
      offset: 0,
      texture: "steppe",
      isVisible: (world, xNeg, xPos, y, z) =>
        world[xPos]?.[y]?.[z]?.isBlock && !(world[xNeg]?.[y]?.[z]?.isBlock),
      map: (gy, gOther, cellSize, gridSize) => [
        gy * cellSize, (gridSize - gOther - 1) * cellSize
      ]
    }
  ],

  y: [
    {
      name: "front",
      offset: -1,
      texture: "steppe",
      isVisible: (world, x, yNeg, yPos, z) =>
        world[x]?.[yNeg]?.[z]?.isBlock && !(world[x]?.[yPos]?.[z]?.isBlock),
      map: (gy, gOther, cellSize, gridSize) => [
        gOther * cellSize, (gridSize - gy - 1) * cellSize
      ]
    },
    {
      name: "back",
      offset: 0,
      texture: "steppe",
      isVisible: (world, x, yNeg, yPos, z) =>
        world[x]?.[yPos]?.[z]?.isBlock && !(world[x]?.[yNeg]?.[z]?.isBlock),
      map: (gy, gOther, cellSize, gridSize) => [
        gOther * cellSize, (gridSize - gy - 1) * cellSize
      ]
    }
  ]
};


function renderSlices(canvases, axis) {
  const sizeX = worldData.length;
  const sizeY = worldData[0].length;
  const sizeZ = worldData[0][0].length;

  const cellSize = 20 * 10;
  const gridSize = 10;
  const halfGrid = Math.floor(gridSize / 2);
  const midPlaneIndex = Math.floor(canvases.length / 2);

  canvases.forEach((canvas, i) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const plane = (axis === "z")
      ? (player.worldZ - midPlaneIndex + i)
      : (axis === "x")
      ? (player.worldX - midPlaneIndex + i)
      : (player.worldY - midPlaneIndex + i);

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gOther = 0; gOther < gridSize; gOther++) {

        if (axis === "z") {
          worldX = player.worldX - halfGrid + gOther;
          worldY = player.worldY - halfGrid + gy;
        } else if (axis === "x") {
          worldX = plane;
          worldY = player.worldY - halfGrid + gy ;
          worldZ = player.worldZ - halfGrid + gOther;
        } else { // y
          worldX = player.worldX - halfGrid + gOther;
          worldY = plane;
          worldZ = player.worldZ - halfGrid + gy;
        }

        // skip out of bounds
        if (worldX < 0 || worldY < 0 || worldZ < -20 || worldX >= sizeX || worldY >= sizeY || worldZ >= 19) continue;



        // loop through all faces defined for this axis
        for (const face of faces[axis]) {
          const [cx, cy] = face.map(gy, gOther, cellSize, gridSize);

          let visible = false;
          let applyStyle = false;
          if (axis === "z") {
            const zNeg = plane - 1;
            const zPos = plane;
            visible = face.isVisible(worldData, worldX, worldY, zNeg, zPos);
            applyStyle = typeof face.applyStyle === "function" 
            ? face.applyStyle(worldData, worldX, worldY, zNeg)
            : false;
          }  else if (axis === "x") {
            const xNeg = plane - 1;
            const xPos = plane;
            visible = face.isVisible(worldData, xNeg, xPos, worldY, worldZ);
          } else if (axis === "y") {
            const yNeg = plane - 1;
            const yPos = plane;
            visible = face.isVisible(worldData, worldX, yNeg, yPos, worldZ);
          }

          if (visible) {
            ctx.save();
            if (applyStyle) ctx.filter = "brightness(80%)";
            ctx.drawImage(
              textures[face.texture],
              0, 0, 100, 100,
              cx, cy, cellSize, cellSize
            );
            ctx.restore();
          }


        }
      }
    }
  });
}

export function getTerrainHeight(x, y) {
  const sizeX = worldData.length;
  const sizeY = worldData[0].length;
  const sizeZ = worldData[0][0].length;
  // bounds check
  if (x < 0 || x >= sizeX || y < 0 || y >= sizeY) {
    return 0;
  }

  // start from the top and go down until we find a solid block
  for (let z = sizeZ - 2; z >= 0; z--) {
    if (worldData[x][y][z].material != 'air') {
      return z; // top-most solid block
    }
  }
  return 6; // if no blocks, default ground
}

async function handleMovement(e) {
  let moved = false;

  // Convert yaw into radians
  const rad = -SETTINGS.yaw * Math.PI / 180;

  // Forward direction vector (relative to yaw)
  const dirX = Math.round(Math.cos(rad));
  const dirY = Math.round(Math.sin(rad));

  // Right direction vector (perpendicular)
  const rightX = Math.round(Math.cos(rad + Math.PI / 2));
  const rightY = Math.round(Math.sin(rad + Math.PI / 2));

  switch (e.key.toLowerCase()) {
    case "a": // forward
      if (player.worldX + dirX >= 7 && player.worldX + dirX < worldData.length - 7 &&
          player.worldY + dirY >= 7 && player.worldY + dirY < worldData[0].length - 7) {
        player.worldX += dirX;
        player.worldY += dirY;
        moved = true;
      }
      break;

    case "d": // backward
      if (player.worldX - dirX >= 7 && player.worldX - dirX < worldData.length - 7 &&
          player.worldY - dirY >= 7 && player.worldY - dirY < worldData[0].length - 7) {
        player.worldX -= dirX;
        player.worldY -= dirY;
        moved = true;
      }
      break;

    case "w": // right
      if (player.worldX + rightX >= 7 && player.worldX + rightX < worldData.length - 7 &&
          player.worldY + rightY >= 7 && player.worldY + rightY < worldData[0].length - 7) {
        player.worldX += rightX;
        player.worldY += rightY;
        moved = true;
      }
      break;

    case "s": // left
      if (player.worldX - rightX >= 7 && player.worldX - rightX < worldData.length - 7 &&
          player.worldY - rightY >= 7 && player.worldY - rightY < worldData[0].length - 7) {
        player.worldX -= rightX;
        player.worldY -= rightY;
        moved = true;
      }
      break;
  }

  if (moved) {

    updatePlayerHeight();
      await updateEPlane();
      updateAllCardboardRotations();
    renderWorldToCanvases();
    updateCoordinatesText();
    applyNeoTransforms();


    const floor = document.querySelector('.floor');
    if (player.worldZ <= 6) floor.classList.add('visible');
    else floor.classList.remove('visible');
  }
}


function updatePlayerHeight() {
  const groundZ = getTerrainHeight(player.worldX, player.worldY);
  player.worldZ = groundZ + 2; // stand just above the top block
}


const xyz = document.getElementById('xyz');
function updateCoordinatesText() {
  xyz.querySelector('#x').textContent = player.worldX;
  xyz.querySelector('#y').textContent = player.worldY;
  xyz.querySelector('#z').textContent = player.worldZ;
}


window.addEventListener("keydown", handleMovement);
