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

// Recording and Analysis Types
export type RecordingStatus = "idle" | "recording" | "analyzing" | "complete";

export interface RepData {
  repNumber: number;
  timestamp: number;
  formScore: number;
  issues: FormIssue[];
  angles: JointAngles;
}

export interface FormIssue {
  bodyPart: keyof JointAngles;
  severity: "warning" | "error";
  actualAngle: number;
  targetAngle: number;
  deviation: number;
}

export interface SetRecording {
  id: string;
  exerciseType: ExerciseType;
  startTime: number;
  endTime?: number;
  reps: RepData[];
  status: RecordingStatus;
}

export interface SetAnalysis {
  totalReps: number;
  duration: number;
  averageFormScore: number;
  bestRep: number;
  worstRep: number;
  commonIssues: IssueAnalysis[];
  recommendations: Recommendation[];
  overallGrade: "A" | "B" | "C" | "D" | "F";
}

export interface IssueAnalysis {
  bodyPart: keyof JointAngles;
  occurrences: number;
  percentageOfReps: number;
  averageDeviation: number;
  description: string;
}

export interface Recommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  tip: string;
}
