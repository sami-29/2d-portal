import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

//variables
const frameWidth = 3,
  frameHeight = 3,
  portalScale = 1,
  scrollSpeed = 0.005,
  duration = 1000,
  duration_camera = 1000,
  endPositionPortal = new THREE.Vector3(0, 0, -1);

let portalZPos = -1,
  startTime = performance.now();

const endPosition = new THREE.Vector3(0, 0, 6),
  endTarget = new THREE.Vector3(0, 0, 0);

// initialize the gltf loader
const loader = new GLTFLoader();

function loadModel(modelObject) {
  let { path, scale } = modelObject;

  try {
    loader.load(path, (gltf) => {
      let model = gltf.scene;
      model.scale.set(scale, scale, scale);
      scene.add(model);
      let box = new THREE.Box3().setFromObject(model);
      let center = box.getCenter();
      model.lookAt(center.x, center.y, center.z);
    });
  } catch (error) {
    console.log(error);
  }
}

// Create the scene
const scene = new THREE.Scene();

// Create the camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 6;

// Create the renderer

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.render(scene, camera); // -> Also needed
});

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// Create the 2D "picture frame" portal
let portalMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  map: new THREE.TextureLoader().load("./Fancy-Frame-Transparent.png"),
  transparent: true,
});
let portalGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
let portal = new THREE.Mesh(portalGeometry, portalMaterial);

// Create the 3D scene
let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.scale.set(0.5, 0.5, 0.5);

// Add the objects to the scene
scene.add(portal);
// scene.add(cube);
loadModel({
  path: "./WW/scene.gltf",
  scale: 1,
});

portal.scale.set(portalScale, portalScale, portalScale);
portal.position.z = portalZPos;

// Add event listener for scroll
window.addEventListener("wheel", onScroll);

function onScroll(event) {
  if (event.deltaY > 0) {
    portalZPos += event.deltaY * scrollSpeed;
  } else {
    portalZPos -= -event.deltaY * scrollSpeed;
  }
  portal.position.z = portalZPos;

  // Clamp the Z position so that it doesn't go too far
  if (portalZPos > 6) {
    portal.position.z = portalZPos;
    controls.enabled = true;
    portal.visible = false;
    window.removeEventListener("wheel", onScroll);
    window.addEventListener("keydown", onEscapeKey);
  }
  if (portalZPos < -1) {
    portalZPos = -1;
    portal.position.z = portalZPos;
    controls.enabled = false;
    portal.visible = true;
  }
}

function onEscapeKey(event) {
  if (event.keyCode === 27) {
    startTime = performance.now();
    requestAnimationFrame(animateCamera);

    controls.enabled = false;
    window.removeEventListener("keydown", onEscapeKey);
  }
}

function easeInOutCubic(t) {
  if (t < 0.5) {
    return 4 * t * t * t;
  } else {
    return (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
}

function animate() {
  let time = performance.now() - startTime;
  let progress = time / duration;

  let ease = easeInOutCubic(progress);
  portal.position.lerp(endPositionPortal, ease);

  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    portal.position.z = -1;
    portalZPos = -1;
    window.addEventListener("wheel", onScroll);
    controls.reset();
  }
}

function animateCamera() {
  let progress = (performance.now() - startTime) / duration_camera;
  progress = Math.min(progress, 1);

  let ease = easeInOutCubic(progress);
  camera.position.lerp(endPosition, ease);
  camera.lookAt(endTarget);

  if (progress < 1) {
    requestAnimationFrame(animateCamera);
  } else {
    // animation is complete, start the next animation
    portal.visible = true;
    startTime = performance.now();
    requestAnimationFrame(animate);
  }
}

// Render the scene
function render() {
  requestAnimationFrame(render);

  renderer.render(scene, camera);
}
render();
window.onload = function () {
  console.log("Initial camera position: ", camera.position);
};
