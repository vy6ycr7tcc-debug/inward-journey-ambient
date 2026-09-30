import * as THREE from 'three';
import { Chapter } from '../Engine';

export class EmberField extends Chapter {
  private particles?: THREE.Points;

  constructor() {
    super("Ember Field", 90); // 90 seconds
  }

  init(): void {
    // Scene setup: warm horizon, dark overall
    this.scene.background = new THREE.Color(0x1a0a02);
    this.scene.fog = new THREE.FogExp2(0x1a0a02, 0.012);

    // Camera Spline (slow forward push over water)
    this.cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(0, 4.5, -50),
      new THREE.Vector3(0, 4.0, -100),
      new THREE.Vector3(0, 3.5, -150),
    ]);

    // Look Target Spline (looking straight ahead towards horizon)
    this.targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, -10),
      new THREE.Vector3(0, 4, -60),
      new THREE.Vector3(0, 4, -110),
      new THREE.Vector3(0, 4, -160),
    ]);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xff5500, 0x051024, 0.8);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffcc00, 0.4);
    dirLight.position.set(0, 5, -50);
    this.scene.add(dirLight);

    // Water plane
    const waterGeo = new THREE.PlaneGeometry(400, 400, 32, 32);
    // Displace water to make it not completely flat
    const posAttribute = waterGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const z = posAttribute.getZ(i);
        posAttribute.setZ(i, z + (Math.random() - 0.5) * 1.5);
    }
    waterGeo.computeVertexNormals();

    const waterMat = new THREE.MeshLambertMaterial({
        color: 0x0a0502,
        flatShading: true,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    this.scene.add(water);

    // Horizon glow (fake using a large plane far away)
    const horizonGeo = new THREE.PlaneGeometry(300, 100);
    const horizonMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.2,
        fog: false,
        depthWrite: false
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.set(0, 10, -200);
    this.scene.add(horizon);

    // Particles: Floating gold/ember particles
    const partGeo = new THREE.BufferGeometry();
    const partCount = 2000;
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * 200; // x
      partPos[i * 3 + 1] = Math.random() * 20 + 0.5; // y (above water)
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 300 - 50; // z
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));

    // Add custom attribute for individual animation speeds/offsets
    const speeds = new Float32Array(partCount);
    for (let i = 0; i < partCount; i++) {
        speeds[i] = Math.random() * 0.5 + 0.5;
    }
    partGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);

    const partMat = new THREE.PointsMaterial({
      size: 0.6,
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
      color: 0xff8800
    });
    this.particles = new THREE.Points(partGeo, partMat);
    this.scene.add(this.particles);
  }

  private time = 0;

  public update(dt: number): void {
      this.time += dt;
      if (this.particles) {
          const positions = this.particles.geometry.attributes.position.array as Float32Array;
          const speeds = this.particles.geometry.attributes.aSpeed.array as Float32Array;

          for (let i = 0; i < speeds.length; i++) {
              // Gentle wave motion
              positions[i * 3 + 1] += Math.sin(this.time * speeds[i] + i) * dt * 0.5;
              // Slow drift towards camera
              positions[i * 3 + 2] += dt * 2 * speeds[i];

              if (positions[i * 3 + 2] > 50) {
                  positions[i * 3 + 2] = -250;
              }
          }
          this.particles.geometry.attributes.position.needsUpdate = true;
      }
  }
}
