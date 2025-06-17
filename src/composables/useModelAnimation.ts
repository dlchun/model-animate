import { ref, shallowRef } from 'vue';
import * as THREE from 'three';
import type { ModelState, LoadingState } from '../types/three';
import { MODEL_PATH, ANIMATION_PATH, ANIMATIONS, MODEL_FILE } from '../config/animations';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export function useModelAnimation(scene: THREE.Scene) {
  // 使用 shallowRef 来避免深层响应式
  const modelState = shallowRef<ModelState>({
    model: null,
    mixer: null,
    animations: [],
    currentAnimation: null,
  });

  const loadingState = ref<LoadingState>({
    isLoading: true,
    progress: 0,
    error: null,
  });

  const clock = new THREE.Clock();

  const loadModel = async () => {
    const loader = new FBXLoader();
    loader.setPath(MODEL_PATH);

    try {
      const object = await loader.loadAsync(MODEL_FILE);
      object.scale.setScalar(0.01);
      object.position.set(0, 0, 0);

      // 设置阴影
      object.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const newModelState = {
        model: object,
        mixer: new THREE.AnimationMixer(object),
        animations: [],
        currentAnimation: null,
      };
      modelState.value = newModelState;
      scene.add(object);

      // 加载动画
      await loadAnimations();
      loadingState.value.isLoading = false;
    } catch (error) {
      loadingState.value.error = error instanceof Error ? error.message : '加载模型失败';
      loadingState.value.isLoading = false;
    }
  };

  const loadAnimations = async () => {
    const loader = new FBXLoader();
    loader.setPath(ANIMATION_PATH);

    for (const config of ANIMATIONS) {
      try {
        const animationObject = await loader.loadAsync(config.file);
        const animationClip = animationObject.animations[0];
        animationClip.name = config.name;
        
        const newAnimations = [...modelState.value.animations, animationClip];
        modelState.value = {
          ...modelState.value,
          animations: newAnimations,
        };

        if (modelState.value.model) {
          modelState.value.model.animations.push(animationClip);
        }

        // 如果是第一个动画，自动播放
        if (newAnimations.length === 1) {
          playAnimation(config.name);
        }
      } catch (error) {
        console.error(`加载动画 ${config.name} 失败:`, error);
      }
    }
  };

  const playAnimation = (name: string) => {
    const { mixer, animations, currentAnimation } = modelState.value;
    if (!mixer) return;

    // 停止当前动画
    if (currentAnimation) {
      currentAnimation.fadeOut(0.5);
    }

    // 查找并播放新动画
    const clip = animations.find((a) => a.name === name);
    if (clip) {
      const config = ANIMATIONS.find((a) => a.name === name);
      const newAnimation = mixer.clipAction(clip);

      newAnimation
        .setEffectiveTimeScale(config?.timeScale || 1)
        .setEffectiveWeight(1)
        .fadeIn(0.5)
        .play();

      newAnimation
        .reset()
        .setLoop(config?.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
        .crossFadeFrom(currentAnimation || newAnimation, 0.5, true);

      modelState.value = {
        ...modelState.value,
        currentAnimation: newAnimation,
      };
    }
  };

  const updateAnimation = () => {
    const { mixer } = modelState.value;
    if (mixer) {
      const delta = clock.getDelta();
      mixer.update(delta);
    }
  };

  return {
    modelState,
    loadingState,
    loadModel,
    playAnimation,
    updateAnimation,
  };
} 