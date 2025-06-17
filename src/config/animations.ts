import type { AnimationConfig } from '../types/three';

export const MODEL_PATH = '/models/pack/';
export const ANIMATION_PATH = '/models/pack/animate/';
export const MODEL_FILE = 'Arissa.fbx';

export const ANIMATIONS: AnimationConfig[] = [
  { file: 'standing idle 01.fbx', name: 'idle', loop: true, timeScale: 1 },
  { file: 'standing run back.fbx', name: 'walking', loop: true, timeScale: 1 },
  { file: 'standing run forward stop.fbx', name: 'running', loop: true, timeScale: 1 },
  { file: 'standing run forward.fbx', name: 'run', loop: true, timeScale: 1 },
  { file: 'standing turn 90 left.fbx', name: 'turnLeft', loop: false, timeScale: 1 },
  { file: 'standing turn 90 right.fbx', name: 'turnRight', loop: false, timeScale: 1 },
  { file: 'standing walk back.fbx', name: 'walkBack', loop: true, timeScale: 1 },
  { file: 'standing walk forward.fbx', name: 'walkForward', loop: true, timeScale: 1 },
]; 