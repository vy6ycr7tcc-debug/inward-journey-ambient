import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import { InputManager } from './Input';

export abstract class Chapter {
  public scene: THREE.Scene;
  public duration: number;
  public name: string;

  protected cameraPath: THREE.CatmullRomCurve3;
  protected targetPath: THREE.CatmullRomCurve3;

  constructor(name: string, duration: number) {
    this.name = name;
    this.duration = duration;
    this.scene = new THREE.Scene();
    this.cameraPath = new THREE.CatmullRomCurve3();
    this.targetPath = new THREE.CatmullRomCurve3();
  }

  abstract init(): void;

  public update(_t: number): void {
      // optional update override for animations inside the chapter
  }

  public getCameraTransform(progress: number): { position: THREE.Vector3, target: THREE.Vector3 } {
    const pos = this.cameraPath.getPoint(progress);
    const target = this.targetPath.getPoint(progress);
    return { position: pos, target };
  }
}

export class Engine {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;

  private chapters: Chapter[] = [];
  private currentChapterIndex = 0;
  private chapterTime = 0;

  private lastTime = 0;
  private isPaused = false;

  public input: InputManager;
  public audio: AudioManager;

  // Transitions
  private isTransitioning = false;
  private transitionTime = 0;
  private transitionDuration = 2.0;
  private chapterChangeListeners: ((index: number) => void)[] = [];

  // Transition overlay
  private fadePlane: THREE.Mesh;
  private uiCamera: THREE.OrthographicCamera;
  private uiScene: THREE.Scene;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Hard constraints: No dynamic shadows for perf
    this.renderer.shadowMap.enabled = false;

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // UI Overlay for fade out (compliant with no post-processing rule)
    this.uiScene = new THREE.Scene();
    this.uiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const planeGeo = new THREE.PlaneGeometry(2, 2);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    this.fadePlane = new THREE.Mesh(planeGeo, planeMat);
    this.uiScene.add(this.fadePlane);

    this.input = new InputManager();
    this.audio = new AudioManager();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  public addChapter(chapter: Chapter) {
    chapter.init();
    this.chapters.push(chapter);
  }

  public startChapter(index: number) {
    this.currentChapterIndex = index;
    this.chapterTime = 0;
    this.isPaused = false;
    this.isTransitioning = false;
    this.notifyChapterChange(this.currentChapterIndex);
  }

  public onChapterChange(listener: (index: number) => void) {
      this.chapterChangeListeners.push(listener);
  }

  private notifyChapterChange(index: number) {
      this.chapterChangeListeners.forEach(l => l(index));
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    this.audio.togglePause();
  }

  public isAppPaused() {
    return this.isPaused;
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // 30fps target: roughly 33ms per frame
  private minFrameTime = 1000 / 30;

  public animate(time: number) {
    requestAnimationFrame(this.animate.bind(this));

    if (this.lastTime === 0) {
        this.lastTime = time;
    }

    const delta = time - this.lastTime;

    if (delta < this.minFrameTime) {
      return; // Cap to 30fps
    }

    this.lastTime = time;

    if (!this.isPaused) {
      this.update(delta / 1000);
    }
    this.render();
  }

  private update(dt: number) {
    if (this.chapters.length === 0) return;

    const chapter = this.chapters[this.currentChapterIndex];

    if (this.isTransitioning) {
        this.transitionTime += dt;
        if (this.transitionTime >= this.transitionDuration) {
            this.isTransitioning = false;
            this.currentChapterIndex = (this.currentChapterIndex + 1) % this.chapters.length;
            this.chapterTime = this.transitionTime - this.transitionDuration;
            this.notifyChapterChange(this.currentChapterIndex);
        }
    } else {
        this.chapterTime += dt;
        if (this.chapterTime >= chapter.duration) {
            this.isTransitioning = true;
            this.transitionTime = 0;
        }
    }

    // Ease in/out
    const progress = Math.min(1.0, this.chapterTime / chapter.duration);
    // Simple smoothstep for easing
    const easedProgress = progress * progress * (3 - 2 * progress);

    const transform = chapter.getCameraTransform(easedProgress);
    this.camera.position.copy(transform.position);
    this.camera.lookAt(transform.target);

    chapter.update(dt);
  }

  private render() {
    if (this.chapters.length === 0) return;
    const chapter = this.chapters[this.currentChapterIndex];
    this.renderer.autoClear = true;
    this.renderer.render(chapter.scene, this.camera);

    if (this.isTransitioning) {
        // Fade to black and fade back in
        const halfDuration = this.transitionDuration / 2;
        let opacity = 0;
        if (this.transitionTime < halfDuration) {
            // fading out
            opacity = this.transitionTime / halfDuration;
        } else {
            // fading in next scene
            opacity = 1.0 - ((this.transitionTime - halfDuration) / halfDuration);
        }

        (this.fadePlane.material as THREE.MeshBasicMaterial).opacity = opacity;

        this.renderer.autoClear = false;
        this.renderer.render(this.uiScene, this.uiCamera);
    }
  }
}
