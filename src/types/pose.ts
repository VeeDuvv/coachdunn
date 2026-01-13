// Pose detection types
export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export interface JointAngles {
  leftElbow: number;
  rightElbow: number;
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftShoulder: number;
  rightShoulder: number;
  spine: number;
}

export type ExerciseType =
  | "squat"
  | "pushup"
  | "lunge"
  | "plank"
  | "jumpingJack";

export interface ExerciseState {
  type: ExerciseType;
  repCount: number;
  phase: "up" | "down" | "hold" | "idle";
  formScore: number;
  feedback: FeedbackItem[];
}

export interface FeedbackItem {
  id: string;
  message: string;
  severity: "good" | "warning" | "error";
  bodyPart?: string;
}

export interface ExerciseConfig {
  name: string;
  icon: string;
  description: string;
  targetAngles: Partial<JointAngles>;
  tolerances: Partial<JointAngles>;
}
