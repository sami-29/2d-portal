import * as THREE from "three";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

//variables
const frameWidth = 3,
  frameHeight = 3,
  stencilRef = 1,
  portalScale = 1,
  scrollSpeed = 0.005,
  duration = 2000,
  duration_camera = 1500,
  portalMaxZPos = 5,
  camera3DposZ = 6;

let portalZPos = -1,
  startTime = performance.now();

const targetPlane = {
    width: 4,
    height: 5,
  },
  targetPlanePosition = {
    x: -5,
    y: targetPlane.height / 2,
    z: -1,
  };

let isInPortal = false;

const loader = new GLTFLoader();

function loadModel(modelObject) {
  let { path, scale, position } = modelObject;

  loader.load(path, (gltf) => {
    let model = gltf.scene;

    model.scale.set(scale, scale, scale);
    model.position.set(position.x, position.y, position.z);
    scene3D.add(model);
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

// Create the camera for the 3D world
let camera3D = new THREE.PerspectiveCamera(
  75,
  targetPlane.width / targetPlane.height,
  0.1,
  1000
);
camera3D.position.z = camera3DposZ;

// Create a separate scene for the 3D world
let scene3D = new THREE.Scene();
scene3D.background = new THREE.Color(0xa8def0);

// Create a render target to render the 3D scene onto a texture
let renderTarget = new THREE.WebGLRenderTarget(
  targetPlane.width * 512,
  targetPlane.height * 512
);

scene3D.add(new THREE.AmbientLight(0xffffff, 0.9));
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
scene3D.add(dirLight);

// Create a quad to display the texture on
let quad = new THREE.Mesh(
  new THREE.PlaneGeometry(targetPlane.width, targetPlane.height, 32),
  new THREE.MeshPhongMaterial({
    map: renderTarget.texture,
  })
);
quad.position.z = portalZPos;

let frame = new THREE.Mesh(
  new THREE.PlaneGeometry(targetPlane.width, targetPlane.height, 32),
  new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: new THREE.TextureLoader().load("./Fancy-Frame-Transparent.png"),
    transparent: true,
  })
);

const coneGeometry = new THREE.ConeGeometry(1, 2, 3);

// Create the cone's material
const coneMaterial = new THREE.MeshLambertMaterial({
  color: "white",
});

// Create the cone mesh
const cone = new THREE.Mesh(coneGeometry, coneMaterial);

// Add the cone to the scene
scene3D.add(cone);

// Add the 3D world and portal to the main scene
const portal = new THREE.Group();

portal.add(frame);
portal.add(quad);
portal.position.z = portalZPos;

scene.add(portal);
scene.add(camera3D);

loadModel({
  path: "./shiba/scene.gltf",
  scale: 1,
  position: { x: 15, y: 3, z: -2 },
});

const controls = new OrbitControls(camera3D, renderer.domElement);
controls.enabled = isInPortal;

window.addEventListener("wheel", onScroll);

function onScroll(event) {
  if (event.deltaY > 0) {
    portalZPos += event.deltaY * scrollSpeed;
  } else {
    portalZPos -= -event.deltaY * scrollSpeed;
  }
  portal.position.z = portalZPos;

  // Clamp the Z position so that it doesn't go too far
  if (portalZPos >= portalMaxZPos) {
    portal.position.z = portalMaxZPos;
    controls.enabled = true;
    isInPortal = true;
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    window.removeEventListener("wheel", onScroll);
    window.addEventListener("keydown", onEscapeKey);
  }
  if (portalZPos < -1) {
    portalZPos = -1;
    portal.position.z = portalZPos;
    controls.enabled = false;
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

const endPositionPortal = new THREE.Vector3(0, 0, -1);
const endPosition = new THREE.Vector3(0, 0, camera3DposZ),
  endTarget = new THREE.Vector3(0, 0, 0);

function animate() {
  let time = performance.now() - startTime;
  let progress = time / duration;

  let ease = easeInOutCubic(progress);
  portal.position.lerp(endPositionPortal, ease);

  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    portal.position.z = portalZPos;
    camera3D.aspect = targetPlane.width / targetPlane.height;
    window.addEventListener("wheel", onScroll);
    controls.reset();
  }
}

function animateCamera() {
  let progress = (performance.now() - startTime) / duration_camera;
  progress = Math.min(progress, 1);

  let ease = easeInOutCubic(progress);
  camera3D.position.lerp(endPosition, ease);
  camera3D.lookAt(endTarget);

  if (progress < 1) {
    requestAnimationFrame(animateCamera);
  } else {
    // animation is complete, start the next animation
    isInPortal = false;
    startTime = performance.now();
    requestAnimationFrame(animate);
  }
}

// update function that will be called on every frame
function update() {
  // Render the 3D scene onto the render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene3D, camera3D);
  renderer.setRenderTarget(null);

  // Render the main scene

  if (isInPortal) {
    renderer.render(scene3D, camera3D);
    controls.update();
    portalZPos = -1;
  } else {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(update);
}

update();
