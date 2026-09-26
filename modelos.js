// Visores 3D pequeños. Uso en el HTML:
// <div class="modelo3d" data-modelo="archivo.glb" data-forma="cabina"></div>
// Si el .glb no existe, se muestra un objeto de ejemplo (data-forma).

const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
const grupo = (...partes) => { const g = new THREE.Group(); g.add(...partes); return g; };
const bloque = (w, h, d, c, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  return m;
};
const cilindro = (r1, r2, h, c, x, y, z, seg = 32) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat(c));
  m.position.set(x, y, z);
  return m;
};

function cabina(ancho) {
  const g = grupo(
    bloque(ancho, 2.4, 3, 0xa5744a, 0, 1.2, 0),                 // cuerpo
    bloque(ancho + 0.5, 0.25, 3.6, 0x3f5a47, 0, 2.5, 0),        // techo
    bloque(0.9, 1.7, 0.05, 0xb4593a, -ancho / 2 + 0.9, 0.85, 1.51), // puerta
    cilindro(0.15, 0.15, 0.8, 0x2b2a26, ancho / 2 - 0.6, 2.9, -0.6, 12) // chimenea
  );
  const ventanas = ancho > 5 ? 2 : 1;
  for (let i = 0; i < ventanas; i++) {
    g.add(bloque(0.9, 0.6, 0.05, 0xf3d9a4, ancho / 2 - 0.8 - i * 1.3, 1.5, 1.51));
  }
  return g;
}

const FORMAS = {
  ducha: () => grupo(
    cilindro(1.1, 1.1, 0.12, 0xd9d2c5, 0, 0.06, 0),          // base
    cilindro(0.07, 0.07, 3, 0xb8b2a6, 0, 1.5, 0, 16),        // tubo
    bloque(1, 0.12, 0.12, 0xb8b2a6, 0.5, 3, 0),              // brazo
    cilindro(0.5, 0.35, 0.15, 0x8f9aa0, 1, 2.9, 0)           // cabezal
  ),
  cabina: () => cabina(4),
  familiar: () => cabina(6.5),
  combo: () => {                                             // ducha + sauna individual
    const c = cabina(4), d = FORMAS.ducha();
    c.position.x = -1.8;
    d.position.x = 3.2;
    return grupo(c, d);
  },
  cubeta: () => {                                            // cubeta de sauna
    const asa = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 32, Math.PI), mat(0x2b2a26));
    asa.position.y = 1.2;
    return grupo(
      cilindro(0.9, 0.75, 1.2, 0xa5744a, 0, 0.6, 0),
      cilindro(0.93, 0.93, 0.08, 0x3f5a47, 0, 0.95, 0),
      cilindro(0.78, 0.78, 0.08, 0x3f5a47, 0, 0.2, 0),
      asa
    );
  },
  reloj: () => {                                             // reloj
    const aro = cilindro(1.2, 1.2, 0.25, 0x3f5a47, 0, 0, 0);
    const cara = cilindro(1.05, 1.05, 0.28, 0xf3ead8, 0, 0, 0);
    aro.rotation.x = cara.rotation.x = Math.PI / 2;
    return grupo(aro, cara,
      bloque(0.08, 0.8, 0.05, 0x2b2a26, 0, 0.35, 0.16),
      bloque(0.5, 0.08, 0.05, 0xb4593a, 0.2, 0, 0.16));
  }
};

function iniciar(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  contenedor.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1));
  const sol = new THREE.DirectionalLight(0xfff1dc, 1.2);
  sol.position.set(5, 8, 5);
  scene.add(sol);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false; // así la rueda del mouse sigue moviendo la página
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;

  function mostrar(obj) {
    scene.add(obj);
    const cajaB = new THREE.Box3().setFromObject(obj);
    const centro = cajaB.getCenter(new THREE.Vector3());
    const tam = cajaB.getSize(new THREE.Vector3());
    obj.position.sub(centro); // centra el objeto en el origen
    const maxDim = Math.max(tam.x, tam.y, tam.z);
    const dist = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.3; // más chico = modelo más grande
    camera.position.set(dist * 0.7, dist * 0.35, dist);
    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    controls.update();
  }

  const ejemplo = () => mostrar((FORMAS[contenedor.dataset.forma] || FORMAS.cabina)());
  const ruta = contenedor.dataset.modelo;
  if (ruta) new THREE.GLTFLoader().load(ruta, g => mostrar(g.scene), undefined, ejemplo);
  else ejemplo();

  function ajustar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();

  (function animar() {
    requestAnimationFrame(animar);
    controls.update();
    renderer.render(scene, camera);
  })();
}

document.querySelectorAll(".modelo3d").forEach(iniciar);
