import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export class DiceScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh;
  private container: HTMLElement;
  private frameId: number | null = null;
  private targetRotation = new THREE.Euler(0, 0, 0);
  private currentRotation = new THREE.Euler(0, 0, 0);

  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 12; // Moved back to fit 3x larger dice

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear container to prevent duplicate dice
    container.innerHTML = '';
    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3.5);
    mainLight.position.set(5, 10, 7);
    this.scene.add(mainLight);

    const backLight = new THREE.PointLight(0xffffff, 3);
    backLight.position.set(0, 0, -5); // Backlight to show translucency
    this.scene.add(backLight);

    const fillLight = new THREE.PointLight(0xffffff, 1.5);
    fillLight.position.set(-5, 0, 5);
    this.scene.add(fillLight);

    const cyanRim = new THREE.PointLight(0x00ffff, 0.8);
    cyanRim.position.set(0, -5, -5);
    this.scene.add(cyanRim);

    // Cube Body (Vibrant Red Translucent Resin)
    const size = 6.6; // 2.2 * 3
    const geometry = new RoundedBoxGeometry(size, size, size, 10, 1.05); // Increased bevel for larger size
    
    const marbledTexture = this.createMarbledTexture();
    
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff4444,
      map: marbledTexture,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 1.0,
      thickness: 4.5, // Increased for larger size
      ior: 1.45,
      transparent: true,
      opacity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      attenuationColor: 0xff8888,
      attenuationDistance: 8.0,
    });

    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    // Add Symbols (Standard Dots 1-6)
    this.addSymbols();

    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    window.addEventListener('resize', this.onResize);
    
    this.animate();
  }

  private createMarbledTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base Red
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(0, 0, 512, 512);

    // Swirls
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 50 + Math.random() * 150;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, 'rgba(255, 150, 150, 0.4)');
      grad.addColorStop(0.5, 'rgba(255, 50, 50, 0.2)');
      grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine grain
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 5000; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createSymbolTexture(dotCount: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Standard White Dots (Deeply Recessed)
    ctx.fillStyle = '#ffffff';
    
    const drawDot = (x: number, y: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // Deep Inner shadow for recess
      ctx.globalCompositeOperation = 'source-atop';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
    };

    const positions: Record<number, [number, number][]> = {
      1: [[256, 256]],
      2: [[128, 128], [384, 384]],
      3: [[128, 128], [256, 256], [384, 384]],
      4: [[128, 128], [384, 128], [128, 384], [384, 384]],
      5: [[128, 128], [384, 128], [256, 256], [128, 384], [384, 384]],
      6: [[128, 128], [128, 256], [128, 384], [384, 128], [384, 256], [384, 384]],
    };

    positions[dotCount]?.forEach(([x, y]) => drawDot(x, y));

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }

  private addSymbols() {
    const symbolMaterial = (dotCount: number) => {
      const texture = this.createSymbolTexture(dotCount);
      return new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: texture,
        bumpScale: 0.08,
        transparent: true,
        metalness: 0.1,
        roughness: 0.2,
        side: THREE.DoubleSide,
      });
    };

    const size = 6.6;
    const offset = size / 2 + 0.005;
    const planeSize = size * 0.95;

    // Standard Dice Layout (Opposite faces sum to 7)
    // 1 - Top
    const face1 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(1));
    face1.position.y = offset;
    face1.rotation.x = -Math.PI / 2;
    this.cube.add(face1);

    // 6 - Bottom
    const face6 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(6));
    face6.position.y = -offset;
    face6.rotation.x = Math.PI / 2;
    this.cube.add(face6);

    // 3 - Front
    const face3 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(3));
    face3.position.z = offset;
    this.cube.add(face3);

    // 4 - Back
    const face4 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(4));
    face4.position.z = -offset;
    face4.rotation.y = Math.PI;
    this.cube.add(face4);

    // 2 - Right
    const face2 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(2));
    face2.position.x = offset;
    face2.rotation.y = Math.PI / 2;
    this.cube.add(face2);

    // 5 - Left
    const face5 = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), symbolMaterial(5));
    face5.position.x = -offset;
    face5.rotation.y = -Math.PI / 2;
    this.cube.add(face5);
  }

  private onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    this.frameId = requestAnimationFrame(this.animate);

    // Idle floating animation
    const time = Date.now() * 0.001;
    this.cube.position.y = Math.sin(time) * 0.1;
    
    // Smooth rotation easing
    this.cube.rotation.x += (this.targetRotation.x - this.cube.rotation.x) * 0.05;
    this.cube.rotation.y += (this.targetRotation.y - this.cube.rotation.y) * 0.05;
    this.cube.rotation.z += (this.targetRotation.z - this.cube.rotation.z) * 0.05;

    // Subtle continuous rotation
    this.cube.rotation.y += 0.002;

    this.renderer.render(this.scene, this.camera);
  }

  public setRotation(category: string) {
    switch (category) {
      case '##':
        // Left face visible
        this.targetRotation.set(0, Math.PI / 2, 0);
        break;
      case 'Data Visualization & Information Design':
        // Top face visible
        this.targetRotation.set(Math.PI / 2, 0, 0);
        break;
      case '@':
        // Right face visible
        this.targetRotation.set(0, -Math.PI / 2, 0);
        break;
      default:
        this.targetRotation.set(Math.PI / 4, Math.PI / 4, 0);
    }
  }

  public destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
