// ===== Configuración =====
const RUTA_MODELO = "sauna.glb"; // EDITA: pon tu modelo en la carpeta models/

const root = document.documentElement;
const contenedor = document.getElementById("escena");
const estado = document.getElementById("estado");

// ===== Renderer =====
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // fondo transparente: se ve la imagen del sitio
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
contenedor.appendChild(renderer.domElement);

// ===== Escena, cámara, luces, controles =====
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 0.9));
const sol = new THREE.DirectionalLight(0xfff1dc, 1.2);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
scene.add(sol);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;

const piso = new THREE.Mesh(
  new THREE.CircleGeometry(1, 64),
  new THREE.ShadowMaterial({ opacity: 0.35 }) // piso invisible que solo muestra la sombra
);
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);

// ===== Encuadre automático (bounding box) =====
let modelo = null;
const vista = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

function encuadrar(obj) {
  const caja = new THREE.Box3().setFromObject(obj);
  const centro = caja.getCenter(new THREE.Vector3());
  const tam = caja.getSize(new THREE.Vector3());

  obj.position.sub(centro);   // centra el modelo en el origen
  obj.position.y += tam.y / 2; // lo apoya sobre el piso

  const maxDim = Math.max(tam.x, tam.y, tam.z);
  const dist = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.3; // más chico = modelo más grande

  camera.position.set(dist * 0.8, tam.y * 0.8 + dist * 0.3, dist);
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();
  controls.target.set(0, tam.y / 2, 0);
  controls.update();

  piso.scale.setScalar(maxDim * 1.4);
  sol.position.set(maxDim, maxDim * 1.6, maxDim);
  const s = sol.shadow.camera;
  s.left = s.bottom = -maxDim * 1.5;
  s.right = s.top = maxDim * 1.5;
  s.near = 0.1;
  s.far = maxDim * 8;
  s.updateProjectionMatrix();

  vista.pos.copy(camera.position);
  vista.target.copy(controls.target);
}

function mostrar(obj) {
  if (modelo) scene.remove(modelo);
  modelo = obj;
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(obj);
  encuadrar(obj);
}

// ===== Modelo de ejemplo (si no existe el .glb) =====
function cabinaEjemplo() {
  const g = new THREE.Group();
  const madera = new THREE.MeshStandardMaterial({ color: 0xa5744a, roughness: 0.8 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 3), madera);
  cuerpo.position.y = 1.2;
  const techo = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.25, 3.6),
    new THREE.MeshStandardMaterial({ color: 0x3f5a47, roughness: 0.9 })
  );
  techo.position.y = 2.5;
  const puerta = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.7, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xb4593a, roughness: 0.7 })
  );
  puerta.position.set(-0.6, 0.85, 1.51);
  const ventana = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xf3d9a4, emissive: 0xf3d9a4, emissiveIntensity: 0.4 })
  );
  ventana.position.set(1, 1.5, 1.51);
  g.add(cuerpo, techo, puerta, ventana);
  return g;
}

// ===== Carga del .glb =====
const loader = new THREE.GLTFLoader();

function cargar(url, alFallar) {
  estado.hidden = false;
  estado.textContent = "Cargando modelo…";
  loader.load(
    url,
    gltf => { mostrar(gltf.scene); estado.hidden = true; },
    xhr => { if (xhr.total) estado.textContent = "Cargando modelo… " + Math.round(xhr.loaded / xhr.total * 100) + "%"; },
    err => { console.warn("Error al cargar el modelo:", err); if (alFallar) alFallar(); }
  );
}

cargar(RUTA_MODELO, () => {
  mostrar(cabinaEjemplo());
  estado.textContent = "No se encontró " + RUTA_MODELO + ". Mostrando un modelo de ejemplo.";
});


// ===== Botones =====
const btnRotar = document.getElementById("rotar");
btnRotar.addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotar.textContent = controls.autoRotate ? "⏸ Rotación" : "▶ Rotación";
});
document.getElementById("reset").addEventListener("click", () => {
  camera.position.copy(vista.pos);
  controls.target.copy(vista.target);
  controls.update();
});

// ===== Tamaño y animación =====
function ajustar() {
  const w = contenedor.clientWidth, h = contenedor.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", ajustar);
ajustar();

(function animar() {
  requestAnimationFrame(animar);
  controls.update();
  renderer.render(scene, camera);
})();
