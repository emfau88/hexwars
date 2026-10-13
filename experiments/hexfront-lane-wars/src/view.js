import * as T from 'three';
import { UNITS } from './rules.js';

const COLORS = { orange: 0xda934f, blue: 0x579ab4 };
const point = (u, height = 0.6) => new T.Vector3(u.p - 15, height, u.x + (u.lane || 0) * 7);
const dispose = root => root.traverse(o => { o.geometry?.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) m?.dispose(); });

export class LabView {
  constructor(stage, onSelect) {
    this.stage = stage; this.models = new Map(); this.effects = []; this.selected = null; this.ranges = false; this.elapsed = 0;
    this.scene = new T.Scene(); this.scene.background = new T.Color(0xbcc6af);
    this.camera = new T.OrthographicCamera(-18, 18, 10, -10, 0.1, 100);
    this.camera.position.set(1, 17, 20); this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 1.25;
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label', 'Automatisches 3D-Robotergefecht');
    stage.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xf3f2db, 0x718063, 2.6));
    const sun = new T.DirectionalLight(0xfff2d5, 2.8); sun.position.set(-5, 15, 8); sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 12, bottom: -12 }); sun.shadow.mapSize.set(2048, 1024); sun.shadow.bias = -0.0004; this.scene.add(sun);
    const slab = new T.Mesh(new T.BoxGeometry(33, 0.32, 5.4), new T.MeshStandardMaterial({ color: 0x87947b, roughness: 1 })); slab.position.y = -0.2; slab.receiveShadow = true; this.scene.add(slab); this.slab = slab;
    const lane = new T.Mesh(new T.PlaneGeometry(30, 3.4), new T.MeshStandardMaterial({ color: 0xb0bba0, roughness: 1 })); lane.rotation.x = -Math.PI / 2; lane.position.y = -0.032; lane.receiveShadow = true; this.scene.add(lane);
    const vertices = [];
    for (let x = -14; x <= 14; x += 2) vertices.push(x, -0.025, -1.7, x, -0.025, 1.7);
    for (const z of [-1.7, 0, 1.7]) vertices.push(-15, -0.025, z, 15, -0.025, z);
    const grid = new T.BufferGeometry(); grid.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    this.scene.add(new T.LineSegments(grid, new T.LineBasicMaterial({ color: 0x56654f, transparent: true, opacity: 0.18 })));
    for (const [x, color] of [[-15.2, COLORS.orange], [15.2, COLORS.blue]]) {
      const stripe = new T.Mesh(new T.BoxGeometry(0.12, 0.025, 3.4), new T.MeshStandardMaterial({ color })); stripe.position.set(x, -0.015, 0); this.scene.add(stripe);
    }
    this.raycaster = new T.Raycaster();
    stage.addEventListener('pointerdown', event => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.raycaster.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), this.camera);
      const hit = this.raycaster.intersectObjects([...this.models.values()].map(m => m.root), true).find(h => h.object.userData.unitId);
      onSelect(hit?.object.userData.unitId ?? null);
    });
    stage.addEventListener('wheel', event => {
      event.preventDefault();
      this.camera.zoom = T.MathUtils.clamp(this.camera.zoom * Math.exp(-event.deltaY * 0.001), 0.65, 3);
      this.camera.updateProjectionMatrix();
    }, { passive: false });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(stage); this.resize();
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    const halfWidth = 17.5, halfHeight = halfWidth * h / w;
    this.camera.left = -halfWidth; this.camera.right = halfWidth; this.camera.top = halfHeight; this.camera.bottom = -halfHeight; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  createRobot(u) {
    const root = new T.Group(); const team = new T.MeshStandardMaterial({ color: COLORS[u.owner], roughness: 0.7, metalness: 0.15 });
    const shell = new T.MeshStandardMaterial({ color: 0xe0e1ca, roughness: 0.75 }); const dark = new T.MeshStandardMaterial({ color: 0x34423a, roughness: 0.7, metalness: 0.3 });
    const glow = new T.MeshStandardMaterial({ color: 0xc5f1f2, emissive: 0x80c7da, emissiveIntensity: 0.7 });
    const materials = [team, shell, dark, glow];
    const box = (w, h, d, material, x, y, z, parent = root) => { const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.userData.unitId = u.id; parent.add(mesh); return mesh; };
    let legs = [], animated = root;
    if (u.type === 'drone') {
      const hull = new T.Mesh(new T.SphereGeometry(0.27, 12, 8), shell); hull.scale.set(1, 0.7, 1); hull.position.y = 0.6; hull.castShadow = true; hull.userData.unitId = u.id; root.add(hull);
      for (const x of [-0.28, 0.28]) { box(0.12, 0.15, 0.4, team, x, 0.54, 0); box(0.07, 0.04, 0.25, glow, x, 0.445, 0); }
      box(0.17, 0.1, 0.1, dark, 0, 0.61, -0.23); box(0.095, 0.035, 0.02, glow, 0, 0.62, -0.29);
    } else if (u.type === 'mech') {
      box(0.5, 0.38, 0.36, shell, 0, 0.78, 0); box(0.45, 0.09, 0.39, team, 0, 0.91, 0); box(0.25, 0.08, 0.04, dark, 0, 0.79, -0.2); box(0.17, 0.028, 0.025, glow, 0, 0.8, -0.23);
      box(0.3, 0.14, 0.24, dark, 0, 0.49, 0);
      for (const x of [-0.17, 0.17]) {
        const leg = new T.Group(); leg.position.set(x, 0.45, 0); root.add(leg); legs.push(leg);
        box(0.14, 0.29, 0.14, dark, 0, -0.14, 0, leg); box(0.17, 0.18, 0.19, team, 0, -0.2, 0, leg); box(0.21, 0.1, 0.29, dark, 0, -0.39, -0.045, leg);
      }
      box(0.14, 0.3, 0.2, team, -0.34, 0.67, 0); box(0.2, 0.19, 0.5, dark, 0.35, 0.68, -0.12); box(0.15, 0.13, 0.08, team, 0.35, 0.68, -0.4);
    } else {
      box(0.4, 0.22, 0.5, shell, 0, 0.43, 0.1);
      for (const x of [-0.29, 0.29]) { box(0.15, 0.15, 0.6, team, x, 0.24, 0.1); box(0.1, 0.04, 0.3, glow, x, 0.15, 0.1); }
      const turret = new T.Group(); root.add(turret); animated = turret;
      box(0.3, 0.22, 0.3, team, 0, 0.63, 0.05, turret); box(0.11, 0.12, 0.78, dark, 0, 0.64, -0.39, turret); box(0.06, 0.04, 0.57, glow, 0, 0.72, -0.36, turret);
    }
    const ringPoints = Array.from({ length: 65 }, (_, i) => new T.Vector3(Math.cos(i / 64 * Math.PI * 2) * UNITS[u.type].range, 0.025, Math.sin(i / 64 * Math.PI * 2) * UNITS[u.type].range));
    const ring = new T.Line(new T.BufferGeometry().setFromPoints(ringPoints), new T.LineBasicMaterial({ color: COLORS[u.owner], transparent: true, opacity: 0.4, depthWrite: false })); this.scene.add(ring);
    const marker = new T.Mesh(new T.RingGeometry(0.4, 0.46, 32), new T.MeshBasicMaterial({ color: 0xfff4bf, side: T.DoubleSide })); marker.rotation.x = -Math.PI / 2; this.scene.add(marker);
    const health = document.createElement('div'); health.className = `health ${u.owner}`; health.innerHTML = '<span></span>'; document.getElementById('health-bars').append(health);
    this.scene.add(root);
    const model = { root, ring, marker, health, legs, materials, animated, type: u.type, hit: 0, shot: 0 };
    this.models.set(u.id, model); return model;
  }

  reset(game) {
    for (const model of this.models.values()) {
      this.scene.remove(model.root, model.ring, model.marker); dispose(model.root); dispose(model.ring); dispose(model.marker); model.health.remove();
    }
    this.models.clear(); this.selected = null;
    for (const fx of this.effects) { this.scene.remove(fx.object); dispose(fx.object); } this.effects = [];
    if (game) {
      const halfSpan = Math.max(12, ...game.units.map(u => Math.abs(u.p - 15) + 2));
      this.camera.zoom = Math.min(1.25, 17.5 / halfSpan); this.camera.updateProjectionMatrix();
      this.slab.scale.x = Math.max(1, halfSpan * 2 / 33);
    }
  }

  handle(events) {
    for (const e of events) {
      if (e.kind === 'shot') {
        const muzzle = e.type === 'mech' ? new T.Vector3(0.35, 0.68, -0.44) : e.type === 'rail' ? new T.Vector3(0, 0.64, -0.78) : new T.Vector3(0, 0.62, -0.3);
        const angle = Math.atan2(-(e.to.p - e.from.p), -(e.to.x - e.from.x));
        const from = muzzle.applyAxisAngle(new T.Vector3(0, 1, 0), angle).add(point(e.from, 0)), to = point(e.to, 0.58);
        const beam = new T.Line(new T.BufferGeometry().setFromPoints([from, to]), new T.LineBasicMaterial({ color: e.type === 'rail' ? 0xe0fbff : COLORS[e.owner], transparent: true, opacity: 1, depthTest: false }));
        this.scene.add(beam); this.effects.push({ object: beam, age: 0, duration: e.type === 'rail' ? 0.22 : 0.12 });
        if (e.type === 'mech') {
          const splash = new T.Mesh(new T.RingGeometry(0.65, UNITS.mech.splash, 24), new T.MeshBasicMaterial({ color: COLORS[e.owner], transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false }));
          splash.rotation.x = -Math.PI / 2; splash.position.copy(point(e.to, 0.04)); this.scene.add(splash); this.effects.push({ object: splash, age: 0, duration: 0.2 });
        }
        const model = this.models.get(e.source); if (model) model.shot = 0.18;
      } else if (e.kind === 'hit') { const model = this.models.get(e.id); if (model) model.hit = 0.15;
      } else if (e.kind === 'destroyed') {
        const burst = new T.Mesh(new T.IcosahedronGeometry(0.28, 0), new T.MeshBasicMaterial({ color: COLORS[e.owner], transparent: true, opacity: 0.8, wireframe: true }));
        burst.position.copy(point(e, 0.55)); this.scene.add(burst); this.effects.push({ object: burst, age: 0, duration: 0.5, burst: true });
      }
    }
  }

  render(game, previous, alpha, dt) {
    this.elapsed += dt;
    const alive = new Set(game.units.map(u => u.id));
    for (const [id, model] of this.models) if (!alive.has(id)) { this.scene.remove(model.root, model.ring, model.marker); dispose(model.root); dispose(model.ring); dispose(model.marker); model.health.remove(); this.models.delete(id); }
    for (const u of game.units) {
      const model = this.models.get(u.id) || this.createRobot(u); const old = previous.get(u.id) || u;
      const p = { ...u, p: T.MathUtils.lerp(old.p, u.p, alpha), x: T.MathUtils.lerp(old.x, u.x, alpha) };
      model.root.position.copy(point(p, 0));
      const target = game.units.find(v => v.id === u.target);
      const desired = target ? Math.atan2(-(target.p - u.p), -(target.x - u.x)) : (u.owner === 'orange' ? -Math.PI / 2 : Math.PI / 2);
      const delta = Math.atan2(Math.sin(desired - model.root.rotation.y), Math.cos(desired - model.root.rotation.y));
      model.root.rotation.y += delta * (dt ? Math.min(1, dt * 14) : 1);
      if (u.type === 'mech') model.legs.forEach((leg, i) => { leg.rotation.x = u.moving ? Math.sin(game.time * 8 + i * Math.PI + u.order) * 0.34 : 0; });
      else model.root.position.y = Math.sin(game.time * 3 + u.order) * 0.045;
      model.hit = Math.max(0, model.hit - dt); model.shot = Math.max(0, model.shot - dt);
      model.materials[0].emissive.setHex(model.hit ? 0xffffff : 0x000000); model.materials[0].emissiveIntensity = model.hit ? 0.6 : 0;
      if (u.type === 'rail') { model.animated.position.z = model.shot * 0.5; model.materials[3].emissiveIntensity = u.target && u.cooldown < 0.5 ? 2.5 : 0.7; }
      model.ring.position.copy(point(p, 0)); model.ring.visible = this.ranges || u.id === this.selected;
      model.ring.material.opacity = u.id === this.selected ? 0.7 : 0.15;
      model.marker.position.copy(point(p, 0.035)); model.marker.visible = u.id === this.selected;
      const screen = point(p, u.type === 'mech' ? 1.2 : 0.95).project(this.camera);
      model.health.style.left = `${(screen.x + 1) * 0.5 * this.stage.clientWidth}px`; model.health.style.top = `${(1 - screen.y) * 0.5 * this.stage.clientHeight}px`;
      model.health.classList.toggle('selected', u.id === this.selected); model.health.firstElementChild.style.width = `${u.hp / UNITS[u.type].hp * 100}%`;
    }
    this.effects = this.effects.filter(fx => {
      fx.age += dt;
      if (fx.age >= fx.duration) { this.scene.remove(fx.object); dispose(fx.object); return false; }
      fx.object.material.opacity = 1 - fx.age / fx.duration;
      if (fx.burst) fx.object.scale.setScalar(1 + fx.age * 3);
      return true;
    });
    this.renderer.render(this.scene, this.camera);
  }
}
