import * as THREE from 'three';

export interface ModelState {
  model: THREE.Group | null;
  mixer: THREE.AnimationMixer | null;
  animations: THREE.AnimationClip[];
  currentAnimation: THREE.AnimationAction | null;
}

export interface AnimationConfig {
  file: string;
  name: string;
  loop?: boolean;
  timeScale?: number;
}

export interface ThreeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: THREE.OrbitControls;
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
} 