import { ref, onMounted, onUnmounted, type Ref, shallowRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  // 使用 shallowRef 来避免深层响应式
  const sceneState = shallowRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    controls: null as OrbitControls | null
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
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value });
    renderer.setSize(canvasRef.value.width, canvasRef.value.height);

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // 更新状态
    sceneState.value = {
      scene,
      camera,
      renderer,
      controls
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
    const { scene, camera, renderer, controls } = sceneState.value;
    if (!scene || !camera || !renderer || !controls) return;

    requestAnimationFrame(animate);
    controls.update();
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