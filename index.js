
function start(){
const originalBoxSize = 3;
const boxHeight = 0.6;
let boxSize = originalBoxSize;
let gameStarted = false;
let score = 0;

const stack = [];
const overhangs = [];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0XF3F3F3);


const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game").appendChild(renderer.domElement);

const scoreElement = document.getElementById("score");
const instructionsElement = document.getElementById("instructions");

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const layer = generateBox(x, y, z, width, depth);
    layer.direction = direction;
    layer.directionMultiplier = 1;
  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1);
  const overhang = generateBox(x, y, z, width, depth, false);
    overhangs.push(overhang);
    
    const direction = stack[stack.length - 1].direction;
  const delta = x - stack[stack.length - 2].position.x;

  const fallDistance = 40;
  const fallSideDistance = 20 * Math.sign(delta || 1); // Default to 1 if delta is 0

  const fallAxis = direction;
  const perpendicularAxis = fallAxis === "x" ? "z" : "x";

  gsap.to(overhang.position, {
    y: y - fallDistance,
    [fallAxis]: overhang.position[fallAxis] + fallSideDistance,
    duration: 1,
    ease: "power1.in",
    onComplete: () => {
      scene.remove(overhang.threejs); // remove after animation
    }
  });

  gsap.to(overhang.threejs.rotation, {
    x: Math.random() * 2,
    y: Math.random() * 2,
    z: Math.random() * 2,
    duration: 1
  });
}

function generateBox(x, y, z, width, depth, shouldAddToScene = true) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const hue = (stack.length * 8) % 360;
  const color = new THREE.Color(`hsl(${hue}, 100%, 68%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if (shouldAddToScene) scene.add(mesh);
  return {
    threejs: mesh,
    width,
    depth,
    position: mesh.position
  };
}


function cutBox(topLayer, previousLayer, direction) {
  const delta = topLayer.position[direction] - previousLayer.position[direction];
  const overhangSize = Math.abs(delta);
  const size = direction === "x" ? topLayer.width : topLayer.depth;
  const overlap = size - overhangSize;

  if (overlap > 0) {
    const newWidth = direction === "x" ? overlap : topLayer.width;
    const newDepth = direction === "z" ? overlap : topLayer.depth;
    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;

    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX = direction === "x" ? topLayer.position.x + overhangShift : topLayer.position.x;
    const overhangZ = direction === "z" ? topLayer.position.z + overhangShift : topLayer.position.z;
    const overhangWidth = direction === "x" ? overhangSize : newWidth;
    const overhangDepth = direction === "z" ? overhangSize : newDepth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);
  } else {
    missedTheSpot();
  }
}

function missedTheSpot() {
  const topLayer = stack[stack.length - 1];
  addOverhang(topLayer.position.x, topLayer.position.z, topLayer.width, topLayer.depth);
  scene.remove(topLayer.threejs);
  stack.pop();

  setTimeout(() => {
    alert("Game over!");
    window.location.reload();
  }, 500);
}

// function startGame() {
//     gameStarted = true;
//       score = 0;
//   scoreElement.innerText = score;

//   instructionsElement.classList.add("hide");
//   renderer.setAnimationLoop(animation);

//   const firstLayer = generateBox(0, 0, 0, boxSize, boxSize);
//   stack.push(firstLayer);

//   const secondLayer = generateBox(-15, boxHeight, 0, boxSize, boxSize);
//   secondLayer.direction = "x";
//   stack.push(secondLayer);
// }


function startGame() {
  gameStarted = true;
  score = 0;
  scoreElement.innerText = score;

  instructionsElement.classList.add("hide");
  renderer.setAnimationLoop(animation);

  const firstLayer = generateBox(0, 0, 0, boxSize, boxSize);
  stack.push(firstLayer);

  const secondLayer = generateBox(-10, boxHeight, 0, boxSize, boxSize); // off-center
  secondLayer.direction = "x";
  secondLayer.directionMultiplier = 1;
  stack.push(secondLayer);
}




function placeLayer() {
  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];
  const direction = topLayer.direction;

  cutBox(topLayer, previousLayer, direction);

  const nextX = direction === "x" ? topLayer.position.x : -3;
  const nextZ = direction === "z" ? topLayer.position.z : -3;
  const newDirection = direction === "x" ? "z" : "x";

    addLayer(nextX, nextZ, topLayer.width, topLayer.depth, newDirection);
    
      score++;
  scoreElement.innerText = score;

}

// function animation() {
//   const speed = 0.08;
//   const topLayer = stack[stack.length - 1];
//   if (!topLayer) return;
//   topLayer.threejs.position[topLayer.direction] += speed;
//   if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
//     camera.position.y += speed;
//   }
//   renderer.render(scene, camera);
// }


function animation() {
  const speed = 0.1;
  const topLayer = stack[stack.length - 1];
  if (!topLayer) return;

  const axis = topLayer.direction;
  topLayer.threejs.position[axis] += speed * topLayer.directionMultiplier;

  // Bounce back if out of bounds
  if (topLayer.threejs.position[axis] > 10 || topLayer.threejs.position[axis] < -10) {
    topLayer.directionMultiplier *= -1;
  }

  // Move the camera up slowly
  if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
    camera.position.y += speed;
  }

    renderer.render(scene, camera);
    console.log(topLayer.threejs.position[axis]);

}



window.addEventListener("click", () => {
  if (!gameStarted) {
    startGame();
  } else {
    placeLayer();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    if (!gameStarted) {
      startGame();
    } else {
      placeLayer();
    }
  }
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 0);
scene.add(dirLight);

camera.position.set(14, 12, 14);
camera.lookAt(0, 0, 0);
}