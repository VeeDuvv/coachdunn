import type {
  Pose,
  JointAngles,
  FeedbackItem,
  ExerciseType,
  ExerciseConfig,
} from "../types/pose";
import { KEYPOINT_INDICES } from "../hooks/usePoseDetection";

// Calculate angle between three points
export function calculateAngle(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  pointC: { x: number; y: number }
): number {
  const radians =
    Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

// Extract joint angles from pose
export function extractJointAngles(pose: Pose): JointAngles | null {
  const kp = pose.keypoints;

  // Check if we have enough keypoints with good confidence
  const minScore = 0.3;
  const requiredKeypoints = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  for (const idx of requiredKeypoints) {
    if (!kp[idx] || (kp[idx].score && kp[idx].score! < minScore)) {
      return null;
    }
  }

  const getKp = (idx: number) => kp[idx];

  return {
    // Elbow angles
    leftElbow: calculateAngle(
      getKp(KEYPOINT_INDICES.leftShoulder),
      getKp(KEYPOINT_INDICES.leftElbow),
      getKp(KEYPOINT_INDICES.leftWrist)
    ),
    rightElbow: calculateAngle(
      getKp(KEYPOINT_INDICES.rightShoulder),
      getKp(KEYPOINT_INDICES.rightElbow),
      getKp(KEYPOINT_INDICES.rightWrist)
    ),
    // Knee angles
    leftKnee: calculateAngle(
      getKp(KEYPOINT_INDICES.leftHip),
      getKp(KEYPOINT_INDICES.leftKnee),
      getKp(KEYPOINT_INDICES.leftAnkle)
    ),
    rightKnee: calculateAngle(
      getKp(KEYPOINT_INDICES.rightHip),
      getKp(KEYPOINT_INDICES.rightKnee),
      getKp(KEYPOINT_INDICES.rightAnkle)
    ),
    // Hip angles
    leftHip: calculateAngle(
      getKp(KEYPOINT_INDICES.leftShoulder),
      getKp(KEYPOINT_INDICES.leftHip),
      getKp(KEYPOINT_INDICES.leftKnee)
    ),
    rightHip: calculateAngle(
      getKp(KEYPOINT_INDICES.rightShoulder),
      getKp(KEYPOINT_INDICES.rightHip),
      getKp(KEYPOINT_INDICES.rightKnee)
    ),
    // Shoulder angles
    leftShoulder: calculateAngle(
      getKp(KEYPOINT_INDICES.leftElbow),
      getKp(KEYPOINT_INDICES.leftShoulder),
      getKp(KEYPOINT_INDICES.leftHip)
    ),
    rightShoulder: calculateAngle(
      getKp(KEYPOINT_INDICES.rightElbow),
      getKp(KEYPOINT_INDICES.rightShoulder),
      getKp(KEYPOINT_INDICES.rightHip)
    ),
    // Spine angle (using shoulders and hips midpoint)
    spine: calculateSpineAngle(pose),
  };
}

function calculateSpineAngle(pose: Pose): number {
  const kp = pose.keypoints;

  const shoulderMidX = (kp[5].x + kp[6].x) / 2;
  const shoulderMidY = (kp[5].y + kp[6].y) / 2;
  const hipMidX = (kp[11].x + kp[12].x) / 2;
  const hipMidY = (kp[11].y + kp[12].y) / 2;

  // Vertical reference point above shoulders
  const verticalRef = { x: shoulderMidX, y: shoulderMidY - 100 };

  return calculateAngle(
    verticalRef,
    { x: shoulderMidX, y: shoulderMidY },
    { x: hipMidX, y: hipMidY }
  );
}

// Exercise configurations
export const EXERCISE_CONFIGS: Record<ExerciseType, ExerciseConfig> = {
  squat: {
    name: "Squat",
    icon: "🏋️",
    description: "Keep your back straight, knees over toes",
    targetAngles: {
      leftKnee: 90,
      rightKnee: 90,
      leftHip: 90,
      rightHip: 90,
      spine: 10,
    },
    tolerances: {
      leftKnee: 20,
      rightKnee: 20,
      leftHip: 25,
      rightHip: 25,
      spine: 15,
    },
  },
  pushup: {
    name: "Push-up",
    icon: "💪",
    description: "Keep your body in a straight line",
    targetAngles: {
      leftElbow: 90,
      rightElbow: 90,
      spine: 180,
      leftHip: 180,
      rightHip: 180,
    },
    tolerances: {
      leftElbow: 20,
      rightElbow: 20,
      spine: 15,
      leftHip: 20,
      rightHip: 20,
    },
  },
  lunge: {
    name: "Lunge",
    icon: "🦵",
    description: "Front knee at 90°, back straight",
    targetAngles: {
      leftKnee: 90,
      rightKnee: 90,
      spine: 5,
    },
    tolerances: {
      leftKnee: 15,
      rightKnee: 15,
      spine: 10,
    },
  },
  plank: {
    name: "Plank",
    icon: "🧘",
    description: "Keep your body perfectly straight",
    targetAngles: {
      spine: 180,
      leftHip: 180,
      rightHip: 180,
      leftElbow: 90,
      rightElbow: 90,
    },
    tolerances: {
      spine: 10,
      leftHip: 15,
      rightHip: 15,
      leftElbow: 15,
      rightElbow: 15,
    },
  },
  jumpingJack: {
    name: "Jumping Jack",
    icon: "⭐",
    description: "Full arm and leg extension",
    targetAngles: {
      leftShoulder: 180,
      rightShoulder: 180,
      leftHip: 45,
      rightHip: 45,
    },
    tolerances: {
      leftShoulder: 30,
      rightShoulder: 30,
      leftHip: 20,
      rightHip: 20,
    },
  },
};

// Analyze form and generate feedback
export function analyzeForm(
  angles: JointAngles,
  exerciseType: ExerciseType
): { feedback: FeedbackItem[]; formScore: number } {
  const config = EXERCISE_CONFIGS[exerciseType];
  const feedback: FeedbackItem[] = [];
  let totalScore = 0;
  let checkCount = 0;

  const angleNames: Record<keyof JointAngles, string> = {
    leftElbow: "Left Elbow",
    rightElbow: "Right Elbow",
    leftKnee: "Left Knee",
    rightKnee: "Right Knee",
    leftHip: "Left Hip",
    rightHip: "Right Hip",
    leftShoulder: "Left Shoulder",
    rightShoulder: "Right Shoulder",
    spine: "Spine",
  };

  for (const [key, targetAngle] of Object.entries(config.targetAngles)) {
    const angleKey = key as keyof JointAngles;
    const currentAngle = angles[angleKey];
    const tolerance = config.tolerances[angleKey] || 20;

    if (targetAngle === undefined) continue;

    checkCount++;
    const diff = Math.abs(currentAngle - targetAngle);

    if (diff <= tolerance * 0.5) {
      // Excellent form
      totalScore += 100;
      feedback.push({
        id: `${key}-good`,
        message: `${angleNames[angleKey]}: Perfect! ✓`,
        severity: "good",
        bodyPart: key,
      });
    } else if (diff <= tolerance) {
      // Acceptable form
      totalScore += 70;
      const direction = currentAngle < targetAngle ? "more" : "less";
      feedback.push({
        id: `${key}-warning`,
        message: `${angleNames[angleKey]}: Bend ${direction}`,
        severity: "warning",
        bodyPart: key,
      });
    } else {
      // Poor form
      totalScore += 30;
      const direction = currentAngle < targetAngle ? "more" : "less";
      feedback.push({
        id: `${key}-error`,
        message: `${angleNames[angleKey]}: Adjust - bend ${direction}`,
        severity: "error",
        bodyPart: key,
      });
    }
  }

  const formScore = checkCount > 0 ? Math.round(totalScore / checkCount) : 0;

  return { feedback, formScore };
}

// Detect exercise phase (up/down) for rep counting
export function detectPhase(
  angles: JointAngles,
  exerciseType: ExerciseType,
  previousPhase: "up" | "down" | "hold" | "idle"
): "up" | "down" | "hold" | "idle" {
  const thresholds = {
    squat: { up: 160, down: 110 },
    pushup: { up: 160, down: 100 },
    lunge: { up: 160, down: 100 },
    plank: { up: 180, down: 180 }, // Always in hold
    jumpingJack: { up: 150, down: 30 },
  };

  const config = thresholds[exerciseType];
  let primaryAngle: number;

  switch (exerciseType) {
    case "squat":
    case "lunge":
      primaryAngle = (angles.leftKnee + angles.rightKnee) / 2;
      break;
    case "pushup":
      primaryAngle = (angles.leftElbow + angles.rightElbow) / 2;
      break;
    case "plank":
      return "hold";
    case "jumpingJack":
      primaryAngle = (angles.leftShoulder + angles.rightShoulder) / 2;
      break;
    default:
      return "idle";
  }

  if (primaryAngle >= config.up) {
    return "up";
  } else if (primaryAngle <= config.down) {
    return "down";
  }

  return previousPhase === "idle" ? "idle" : previousPhase;
}
