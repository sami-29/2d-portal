import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

//variables
const frameWidth = 3,
  frameHeight = 3,
  stencilRef = 1,
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
  let { path, scale, position } = modelObject;

  loader.load(path, (gltf) => {
    gltf.scene.renderOrder = 2;
    let model = gltf.scene;
    console.log(model);

    model.traverse((object) => {
      if (object.material) {
        console.log(object.material);
        object.material.stencilWrite = true;
        object.material.stencilRef = stencilRef;
        object.material.stencilFunc = THREE.AlwaysStencilFunc;
        object.material.stencilFail = THREE.ReplaceStencilOp;
        object.material.stencilZFail = THREE.ReplaceStencilOp;
        object.material.stencilZPass = THREE.ReplaceStencilOp;
      }
    });

    model.scale.set(scale, scale, scale);
    model.position.set(position.x, position.y, position.z);
    scene.add(model);
  });
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

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
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
controls.update();
controls.enabled = false;

// Create the 2D "picture frame" portal
// let portalMaterial = new THREE.MeshBasicMaterial({
//   color: 0xffffff,
//   map: new THREE.TextureLoader().load("./Fancy-Frame-Transparent.png"),
//   transparent: true,
// });
// let portalGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
// let portal = new THREE.Mesh(portalGeometry, portalMaterial);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const portalColor = "black";

const portalGeometry = new THREE.PlaneGeometry(3, 3);
const portalMaterial = new THREE.MeshBasicMaterial({
  color: portalColor,

  depthWrite: false,
  stencilWrite: true,
  stencilRef: stencilRef,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilFail: THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
});

const portal = new THREE.Mesh(portalGeometry, portalMaterial);
scene.add(portal);

// Add the objects to the scene
scene.add(portal);

const coneGeometry = new THREE.ConeGeometry(1, 2, 3);

// Create the cone's material
const coneMaterial = new THREE.MeshLambertMaterial({
  color: "red",
  stencilWrite: "true",
  stencilRef: stencilRef,
  stencilFunc: THREE.EqualStencilFunc,
  stencilFail: THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
});
console.log(coneMaterial);
// Create the cone mesh
const cone = new THREE.Mesh(coneGeometry, coneMaterial);

// Position the cone
cone.position.set(0, 2, -2);
cone.scale.set(0.5, 0.5, 0.5);

// Add the cone to the scene
scene.add(cone);

loadModel({
  path: "./shiba/scene.gltf",
  scale: 1,
  position: { x: 0, y: 3, z: -2 },
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
  if (portalZPos >= 6) {
    portal.position.z = portalZPos;
    controls.enabled = true;
    portal.visible = false;
    renderer.setClearColor(portalColor);
    coneMaterial.stencilWrite = false;
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
    if (progress > 0.2) {
      coneMaterial.stencilWrite = true;
      renderer.setClearColor(0xffffff);
    }
    requestAnimationFrame(animate);
  } else {
    portal.position.z = -1;
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
  renderer.clearStencil();

  renderer.render(scene, camera);
}
render();
window.onload = function () {};
