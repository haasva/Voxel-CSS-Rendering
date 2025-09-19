import { generateWorldData } from "./world-data.js";
import { createVoxelCanvasGrid } from "../engine/renderer.js";
import { initEPlane, cardboardMap } from "../engine/entity-plane.js";



export let SETTINGS = {
    pointerLock: false,
    yaw: 0,   // z rotation
    pitch: 0,  // angle
    translateZ: -0.4,
    translateX: 0,
    translateY: 0,
    fov: 90,
    zoom: 40
}

async function startGame() {
    generateWorldData();
    initEPlane();
    createVoxelCanvasGrid();
}

document.addEventListener('DOMContentLoaded', async () => {
    await startGame();
});




const renderer = document.getElementById('renderer');
const engineWrapper = document.getElementById('engine-wrapper');


document.addEventListener('mousemove', updateCameraRotation);
// apply touch control
document.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
        updateCameraRotation();
    }
});
document.addEventListener('touchmove', (event) => {
        updateCameraRotation(event);
});


document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePointerLock();
      }
});

togglePointerLock();


export function togglePointerLock() {

  const requestPointerLock = engineWrapper.requestPointerLock 
  || engineWrapper.mozRequestPointerLock 
  || engineWrapper.webkitRequestPointerLock;
  if (document.pointerLockElement === engineWrapper) {
    SETTINGS.pointerLock = false;
    document.exitPointerLock();
  } else {
    SETTINGS.pointerLock = true;
    requestPointerLock.call(engineWrapper);
  }
}


function updateCameraRotation(event) {
    if (SETTINGS.pointerLock === false) return;

    // 

    let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

  // also considers touch event
    if (event.touches && event.touches.length === 1) {
        const touch = event.touches[0];
        movementX = (touch.clientX - (window.innerWidth)) / 20;
        movementY = (touch.clientY - (window.innerHeight)) / 20;
    }
    
  
    SETTINGS.yaw += -(movementX / window.innerWidth) * 180;
    SETTINGS.pitch += (movementY / window.innerHeight) * 60;

    
    if (SETTINGS.yaw > 360) {
      SETTINGS.yaw = 0;
    }
    if (SETTINGS.yaw < 0) {
      SETTINGS.yaw = 360;
    }
 
    applyNeoTransforms();
    

}

export function applyNeoTransforms() {
updateAllCardboardRotations();

  renderer.style.transform = `
  
    rotateX(${-SETTINGS.pitch}deg)  /* Pitch - applied first */
    rotateY(${-SETTINGS.yaw}deg) /* Yaw - applied second */
    scale3d(${SETTINGS.zoom}, ${SETTINGS.zoom}, ${SETTINGS.zoom}) 
 translateY(-50px) translateX(50px) translateZ(50px)
    `;
}

applyNeoTransforms();


export function updateAllCardboardRotations() {
    cardboardMap.forEach((_, cardboard) => {
        cardboard.style.setProperty('--rotation-z', `${SETTINGS.yaw}deg`);
    });
}
