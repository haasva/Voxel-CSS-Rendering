import { worldData } from "../init/world-data.js";
import { player } from "./renderer.js";

const ePlane = document.getElementById('e-plane');


export function initEPlane() {

  const container = document.createElement("div");
  container.id = "ePlane";

  // reference point = player position
  const halfGrid = 5; // since 10x10 grid
  for (let gy = 0; gy < 10; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      const worldX = player.worldX - halfGrid + gx;
      const worldY = player.worldY - halfGrid + gy;
      const worldZ = player.worldZ; // or use player.worldZ

      const cell = document.createElement("div");
      cell.className = 'eCell';

      // Show coordinates
      cell.textContent = `${worldX},${worldY},${worldZ}`;

      // Optional coloring if inside/outside world
      if (
        worldX < 0 || worldX >= worldData.length ||
        worldY < 0 || worldY >= worldData[0].length
      ) {
      } else {
      }

      container.appendChild(cell);
    }
  }

  document.getElementById('renderer').appendChild(container);

}

export async function updateEPlane() {
  const container = document.getElementById("ePlane");

  if (!container) return;
    container.style.transform = `rotateX(90deg)  rotateZ(180deg) translateZ(${-((player.worldZ - 2 )* 100)}px) translateX(-100px)`;
  let i = 0;
  const halfGrid = 5;

  for (let gy = 0; gy < 10; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      const worldX = player.worldX  - halfGrid + gx;
      const worldY = player.worldY - halfGrid + gy;

      const cell = container.children[i];
      cell.innerHTML = '';

      if (
        worldX < 0 || worldX >= worldData.length ||
        worldY < 0 || worldY >= worldData[0].length
      ) {
        cell.textContent = "X";
        cell.style.background = "#400"; // out of bounds
      } else {
        // find max elevation in this column (X,Y)
        let maxElevation = -1;
        for (let z = 0; z < worldData[0][0].length; z++) {
          if (worldData[worldX][worldY][z]?.isBlock) {
            maxElevation = z;
          }
        }

        //cell.textContent = `${worldX},${worldY}\nZ:${maxElevation}`;

        const elevation = maxElevation;
        cell.style.transform = `translateZ(${(elevation * 100)}px)`;

        for (let z = 0; z < worldData[0][0].length; z++) {
          if (worldData[worldX][worldY][z].hasTree === true) {
            cell.appendChild(createTreeSprite(worldX, worldY));
            cell.classList.add('tree');
          }
        }
      }

      i++;
    }
  }
}

export const cardboardMap = new Map();

function createTreeSprite(x, y) {
  const key = `${x},${y}`;
  const tree = document.createElement("div");
  tree.className = "tree";
  tree.classList.add('cardboard');
  cardboardMap.set(tree, { cellKey: key, element: tree });
  return tree;
}




function getSurfaceBlock(x, y) {
  const column = worldData[x]?.[y];
  if (!column) return 0; // out of bounds or no column

  let highestElevation = 0;

  for (let z = 0; z < column.length; z++) {
    const block = column[z];
    // Check if the block exists and has the 'isBlock' property set to true.
    if (block && block.isBlock === true) {
      // Since z corresponds to elevation, the current z is a candidate.
      highestElevation = z;
    }
  }
  
  console.log(`Highest elevation at (${x},${y}) is ${highestElevation}`);
  return highestElevation + 2;
}

