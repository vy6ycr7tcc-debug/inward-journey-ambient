import * as THREE from 'three';
import { Chapter } from '../Engine';

export class StillWater extends Chapter {
  private reflections?: THREE.Points;

  constructor() {
    super("Still Water", 60); // 60 seconds
  }

  init(): void {
    // Scene setup: deep night, very calm
    this.scene.background = new THREE.Color(0x010510);
    this.scene.fog = new THREE.FogExp2(0x010510, 0.008);

    // Camera Spline (gentle lateral drift over the lake)
    this.cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-40, 3, 50),
      new THREE.Vector3(0, 3, 40),
      new THREE.Vector3(40, 3, 30),
    ]);

    // Look Target Spline (looking towards the moon)
    this.targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, -100),
      new THREE.Vector3(0, 5, -100),
      new THREE.Vector3(0, 5, -100),
    ]);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a1020, 1.0);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    moonLight.position.set(0, 20, -100);
    this.scene.add(moonLight);

    // Lake (mirror-still, so just a very flat plane)
    const lakeGeo = new THREE.PlaneGeometry(500, 500);
    const lakeMat = new THREE.MeshBasicMaterial({
        color: 0x01030a,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    this.scene.add(lake);

    // Large soft moon disc
    const moonGeo = new THREE.CircleGeometry(15, 32);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 230, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 230, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const moonTex = new THREE.CanvasTexture(canvas);

    const moonMat = new THREE.MeshBasicMaterial({
        map: moonTex,
        transparent: true,
        fog: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffffee
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, 25, -120);
    this.scene.add(moon);

    // Faint stars
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 1000;
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
        starsPos[i * 3] = (Math.random() - 0.5) * 300;
        starsPos[i * 3 + 1] = Math.random() * 100 + 10;
        starsPos[i * 3 + 2] = (Math.random() - 0.5) * 300 - 50;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.6
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(stars);

    // Gold shimmering reflections on water
    const refGeo = new THREE.BufferGeometry();
    const refCount = 500;
    const refPos = new Float32Array(refCount * 3);
    for (let i = 0; i < refCount; i++) {
        // cluster somewhat near the center path to the moon
        refPos[i * 3] = (Math.random() - 0.5) * 20 * (1 - (Math.random() * 0.5));
        refPos[i * 3 + 1] = 0.1; // just above water
        refPos[i * 3 + 2] = -Math.random() * 100;
    }
    refGeo.setAttribute('position', new THREE.BufferAttribute(refPos, 3));
    const refMat = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    this.reflections = new THREE.Points(refGeo, refMat);
    this.scene.add(this.reflections);
  }

  private time = 0;

  public update(dt: number): void {
      this.time += dt;
      if (this.reflections) {
          // Shimmer effect by slightly altering opacity or position
          // Opacity is harder per-particle without shaders, so we'll slightly wobble them in X
          const positions = this.reflections.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
               positions[i * 3] += Math.sin(this.time * 2 + i) * dt * 0.5;
          }
          this.reflections.geometry.attributes.position.needsUpdate = true;
      }
  }
}
