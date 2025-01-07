<template>
  <canvas id="canvas" width="800" height="500"></canvas>
  <div class="controls">
    <button @click="switchAnimation('idle')">待机</button>
    <button @click="switchAnimation('walking')">走路</button>
    <button @click="switchAnimation('running')">跑步</button>
    <button @click="switchAnimation('run')">跑步</button>
    <button @click="switchAnimation('turnLeft')">左转</button>
    <button @click="switchAnimation('turnRight')">右转</button>
    <button @click="switchAnimation('walkBack')">后退</button>
    <button @click="switchAnimation('walkForward')">前进</button>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
let canvasDOM;
let scene: any;
let camera: any;
let renderer: any;
// 添加动画相关变量
let mixer: THREE.AnimationMixer;
let animations: THREE.AnimationClip[] = [];
let currentAnimation: THREE.AnimationAction | null = null;

const clock = new THREE.Clock();
onMounted(() => {
  init();
  animate();
});
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  const delta = clock.getDelta();
  mixer?.update(delta);
}
function init() {
  canvasDOM = document.getElementById("canvas") as HTMLCanvasElement;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvasDOM.width / canvasDOM.height, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 1;

  scene.add(camera);
  renderer = new THREE.WebGLRenderer({ canvas: canvasDOM });
  renderer.setSize(canvasDOM.width, canvasDOM.height);
  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  // 添加平行光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  // 添加点光源
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(1, 1, 1);
  scene.add(pointLight);

  addControls();
  addModel();
}

//添加控制器
function addControls() {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = false;
}
let model: any;
// 加载 FBX 模型
function addModel() {
  const loader = new FBXLoader();

  // 添加加载进度提示
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = function (url: string, loaded: number, total: number) {
    console.log(`Loading: ${(loaded / total) * 100}%`);
  };

  loader.setPath("src/assets/models/pack/"); // 设置模型路径
  loader.load(
    "Arissa.fbx", // 替换为你的模型文件名
    (object: any) => {
      // 调整模型大小和位置
      object.scale.setScalar(0.01); // 根据需要调整缩放比例
      object.position.set(0, 0, 0);
      console.log(object);
      // 创建动画混合器
      mixer = new THREE.AnimationMixer(object);
      model = object;
      // 遍历模型中的所有网格
      object.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(object);
      // 遍历动画文件夹加载所有动画
      const animationFiles = [
        { file: "standing idle 01.fbx", name: "idle" },
        { file: "standing run back.fbx", name: "walking" },
        { file: "standing run forward stop.fbx", name: "running" },
        { file: "standing run forward.fbx", name: "run" },
        { file: "standing turn 90 left.fbx", name: "turnLeft" },
        { file: "standing turn 90 right.fbx", name: "turnRight" },
        { file: "standing walk back.fbx", name: "walkBack" },
        { file: "standing walk forward.fbx", name: "walkForward" },
      ];

      // 加载所有动画文件
      animationFiles.forEach(({file, name}) => {
        loadAnimation(file, name);
      });
      loadAnimation("standing idle 01.fbx", "idle");
      loadAnimation("standing run back.fbx", "walking");
      loadAnimation("standing run forward stop.fbx", "running");
    },
    (xhr: any) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error: any) => {
      console.error("加载模型出错:", error);
    }
  );
}

// 加载动画文件
function loadAnimation(filename: string, animationName: string) {
  const loader = new FBXLoader();
  loader.setPath("/src/assets/models/pack/animate/");
  loader.load(
    filename,
    (animationObject: any) => {
      const animationClip = animationObject.animations[0];
      animationClip.name = animationName;
      animations.push(animationClip);
      model.animations.push(animationClip);
      // 如果是第一个动画，自动播放
      if (animations.length === 1) {
        playAnimation(animationName);
      }

      console.log(`动画 ${animationName} 加载完成`);
    },
    undefined,
    (error) => {
      console.error(`加载动画 ${animationName} 出错:`, error);
    }
  );
}
// 播放指定动画
function playAnimation(name: string) {
  if (!mixer) return;
  // 停止当前动画
  if (currentAnimation) {
    currentAnimation.fadeOut(0.5);
  }

  // 查找并播放新动画
  const clip = animations.find((a) => a.name === name);
  if (clip) {
    // 创建新的动画动作
    currentAnimation = mixer.clipAction(clip);
    
    // 设置动画参数
    currentAnimation
      .setEffectiveTimeScale(1)  // 设置动画播放速度
      .setEffectiveWeight(1)     // 设置动画权重
      .fadeIn(0.5)              // 淡入时间0.5秒
      .play();                  // 播放动画
    
    // 设置动画过渡
    currentAnimation.reset()    // 重置动画状态
      .setLoop(THREE.LoopRepeat, 10 ) // 设置循环播放
      .crossFadeFrom(mixer.existingAction as unknown as THREE.AnimationAction || currentAnimation, 0.5, true); // 与上一个动画交叉淡入淡出
    // 保存当前动画以供下次过渡使用
    (mixer as any).existingAction = currentAnimation;
  }
}

// 添加切换动画的方法（可以通过按钮或其他方式调用）
function switchAnimation(animationName: string) {
  playAnimation(animationName);
}
</script>
<style>
.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 10px;
}
</style>
