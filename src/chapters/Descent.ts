import * as THREE from 'three';
import { Chapter } from '../Engine';

export class Descent extends Chapter {
  private particles?: THREE.Points;

  constructor() {
    super("Descent", 75); // 75 seconds duration
  }

  init(): void {
    // Scene setup
    this.scene.background = new THREE.Color(0x020a1a); // Deep blue void
    this.scene.fog = new THREE.FogExp2(0x020a1a, 0.015);

    // Camera Spline (falling down slowly)
    this.cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 100, 0),
      new THREE.Vector3(5, 50, -5),
      new THREE.Vector3(-5, 0, 5),
      new THREE.Vector3(0, -50, 0),
    ]);

    // Look Target Spline (looking slightly downwards and around)
    this.targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 80, 0),
      new THREE.Vector3(0, 30, 0),
      new THREE.Vector3(0, -20, 0),
      new THREE.Vector3(0, -70, 0),
    ]);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0x0a1f4c, 0x1a0a02, 1);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffa500, 0.5); // gold directional
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Geometry: Deep blue cavern walls (low poly, vertex colors)
    const geo = new THREE.CylinderGeometry(30, 20, 200, 16, 32, true);
    // Displace vertices slightly for rough look
    const posAttribute = geo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const z = posAttribute.getZ(i);

        // Only displace on X and Z
        posAttribute.setX(i, x + (Math.random() - 0.5) * 5);
        posAttribute.setZ(i, z + (Math.random() - 0.5) * 5);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
        color: 0x051024,
        side: THREE.BackSide,
        flatShading: true
    });
    const walls = new THREE.Mesh(geo, mat);
    this.scene.add(walls);

    // Emissive glowing floor far below
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -60;
    this.scene.add(floor);

    // Particles: Upward drifting gold light motes
    const partGeo = new THREE.BufferGeometry();
    const partCount = 1000;
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * 40;
      partPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));

    // Create simple circular texture for particles programmatically to avoid extra requests
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);

    const partMat = new THREE.PointsMaterial({
      size: 0.8,
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
      color: 0xffd700
    });
    this.particles = new THREE.Points(partGeo, partMat);
    this.scene.add(this.particles);
  }

  public update(dt: number): void {
      // Drifting particles upwards
      if (this.particles) {
          const positions = this.particles.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
              positions[i] += dt * 5; // Move up
              if (positions[i] > 100) {
                  positions[i] = -100; // Reset to bottom
              }
          }
          this.particles.geometry.attributes.position.needsUpdate = true;
      }
  }
}
