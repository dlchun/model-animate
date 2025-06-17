<template>
  <div class="model-viewer">
    <canvas ref="canvasRef" width="800" height="500"></canvas>
    <div v-if="loadingState.isLoading" class="loading">
      加载中... {{ Math.round(loadingState.progress) }}%
    </div>
    <div v-if="loadingState.error" class="error">
      {{ loadingState.error }}
    </div>
    <div class="controls">
      <button
        v-for="animation in ANIMATIONS"
        :key="animation.name"
        @click="playAnimation(animation.name)"
        :disabled="loadingState.isLoading"
      >
        {{ getAnimationLabel(animation.name) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, shallowRef } from 'vue';
import { useThreeScene } from '../composables/useThreeScene';
import { useModelAnimation } from '../composables/useModelAnimation';
import { ANIMATIONS } from '../config/animations';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const sceneState = useThreeScene(canvasRef);
const modelAnimationRef = shallowRef<ReturnType<typeof useModelAnimation> | null>(null);

// 动画标签映射
const animationLabels: Record<string, string> = {
  idle: '待机',
  walking: '走路',
  running: '跑步',
  run: '跑步',
  turnLeft: '左转',
  turnRight: '右转',
  walkBack: '后退',
  walkForward: '前进',
};

const getAnimationLabel = (name: string) => animationLabels[name] || name;

// 动画循环
let animationFrameId: number;

const animate = () => {
  modelAnimationRef.value?.updateAnimation();
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(async () => {
  if (canvasRef.value && sceneState.value.scene) {
    modelAnimationRef.value = useModelAnimation(sceneState.value.scene);
    await modelAnimationRef.value.loadModel();
    animate();
  }
});

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});

// 计算属性用于访问状态
const loadingState = computed(() => modelAnimationRef.value?.loadingState.value ?? { isLoading: true, progress: 0, error: null });
const playAnimation = (name: string) => modelAnimationRef.value?.playAnimation(name);
</script>

<style scoped>
.model-viewer {
  position: relative;
  width: 800px;
  height: 500px;
}

.loading,
.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.error {
  background: rgba(255, 0, 0, 0.8);
}

.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: rgba(0, 0, 0, 0.9);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
