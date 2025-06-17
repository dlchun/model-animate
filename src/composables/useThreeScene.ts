import { ref, onMounted, onUnmounted, type Ref, shallowRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

interface SceneState {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
  bgScene?: THREE.Scene;
  bgCamera?: THREE.OrthographicCamera;
  bgMesh?: THREE.Mesh;
}

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  // 使用 shallowRef 来避免深层响应式
  const sceneState = shallowRef<SceneState>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null
  });

  const initScene = () => {
    if (!canvasRef.value) return;

    // 创建场景
    const scene = new THREE.Scene();

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.value.width / canvasRef.value.height,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 1;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.value,
      antialias: true // 添加抗锯齿
    });
    renderer.setSize(canvasRef.value.width, canvasRef.value.height);
    
    // 设置背景色
    renderer.setClearColor(0x000000, 0); // 设置透明背景

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // 创建渐变背景
    const createGradientBackground = () => {
      // 创建一个渐变纹理
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      
      const context = canvas.getContext('2d');
      if (!context) return null;

      // 创建渐变
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#2c3e50'); // 顶部颜色
      gradient.addColorStop(1, '#3498db'); // 底部颜色

      // 填充渐变
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // 创建背景网格
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        depthWrite: false
      });

      // 创建背景网格
      const bgMesh = new THREE.Mesh(geometry, material);
      
      // 创建背景场景和相机
      const bgScene = new THREE.Scene();
      const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
      
      return { bgScene, bgCamera, bgMesh };
    };

    // 添加背景
    const background = createGradientBackground();
    if (background) {
      const { bgScene, bgMesh } = background;
      bgScene.add(bgMesh);
    }

    // 更新状态
    sceneState.value = {
      scene,
      camera,
      renderer,
      controls,
      ...(background || {})
    };

    // 添加光源
    addLights(scene);
  };

  const addLights = (scene: THREE.Scene) => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 点光源
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(1, 1, 1);
    scene.add(pointLight);
  };

  const animate = () => {
    const { scene, camera, renderer, controls, bgScene, bgCamera } = sceneState.value;
    if (!scene || !camera || !renderer || !controls) return;

    requestAnimationFrame(animate);
    controls.update();

    // 先渲染背景
    if (bgScene && bgCamera) {
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(bgScene, bgCamera);
    }

    // 渲染主场景
    renderer.render(scene, camera);
  };

  onMounted(() => {
    initScene();
    animate();
  });

  onUnmounted(() => {
    const { scene, renderer, controls } = sceneState.value;
    // 清理资源
    scene?.clear();
    renderer?.dispose();
    controls?.dispose();
  });

  return sceneState;
} 