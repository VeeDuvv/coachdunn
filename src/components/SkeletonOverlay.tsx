import { useEffect, useRef } from "react";
import type { Pose, FeedbackItem } from "../types/pose";
import { KEYPOINT_INDICES } from "../hooks/usePoseDetection";

interface SkeletonOverlayProps {
  pose: Pose | null;
  videoWidth: number;
  videoHeight: number;
  feedback: FeedbackItem[];
}

// Define skeleton connections
const SKELETON_CONNECTIONS: [number, number][] = [
  // Face
  [KEYPOINT_INDICES.leftEar, KEYPOINT_INDICES.leftEye],
  [KEYPOINT_INDICES.leftEye, KEYPOINT_INDICES.nose],
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.rightEye],
  [KEYPOINT_INDICES.rightEye, KEYPOINT_INDICES.rightEar],
  // Upper body
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.rightShoulder],
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.leftElbow],
  [KEYPOINT_INDICES.leftElbow, KEYPOINT_INDICES.leftWrist],
  [KEYPOINT_INDICES.rightShoulder, KEYPOINT_INDICES.rightElbow],
  [KEYPOINT_INDICES.rightElbow, KEYPOINT_INDICES.rightWrist],
  // Torso
  [KEYPOINT_INDICES.leftShoulder, KEYPOINT_INDICES.leftHip],
  [KEYPOINT_INDICES.rightShoulder, KEYPOINT_INDICES.rightHip],
  [KEYPOINT_INDICES.leftHip, KEYPOINT_INDICES.rightHip],
  // Lower body
  [KEYPOINT_INDICES.leftHip, KEYPOINT_INDICES.leftKnee],
  [KEYPOINT_INDICES.leftKnee, KEYPOINT_INDICES.leftAnkle],
  [KEYPOINT_INDICES.rightHip, KEYPOINT_INDICES.rightKnee],
  [KEYPOINT_INDICES.rightKnee, KEYPOINT_INDICES.rightAnkle],
];

// Map body parts to keypoint pairs for highlighting
const BODY_PART_KEYPOINTS: Record<string, number[]> = {
  leftElbow: [
    KEYPOINT_INDICES.leftShoulder,
    KEYPOINT_INDICES.leftElbow,
    KEYPOINT_INDICES.leftWrist,
  ],
  rightElbow: [
    KEYPOINT_INDICES.rightShoulder,
    KEYPOINT_INDICES.rightElbow,
    KEYPOINT_INDICES.rightWrist,
  ],
  leftKnee: [
    KEYPOINT_INDICES.leftHip,
    KEYPOINT_INDICES.leftKnee,
    KEYPOINT_INDICES.leftAnkle,
  ],
  rightKnee: [
    KEYPOINT_INDICES.rightHip,
    KEYPOINT_INDICES.rightKnee,
    KEYPOINT_INDICES.rightAnkle,
  ],
  leftHip: [
    KEYPOINT_INDICES.leftShoulder,
    KEYPOINT_INDICES.leftHip,
    KEYPOINT_INDICES.leftKnee,
  ],
  rightHip: [
    KEYPOINT_INDICES.rightShoulder,
    KEYPOINT_INDICES.rightHip,
    KEYPOINT_INDICES.rightKnee,
  ],
  leftShoulder: [
    KEYPOINT_INDICES.leftElbow,
    KEYPOINT_INDICES.leftShoulder,
    KEYPOINT_INDICES.leftHip,
  ],
  rightShoulder: [
    KEYPOINT_INDICES.rightElbow,
    KEYPOINT_INDICES.rightShoulder,
    KEYPOINT_INDICES.rightHip,
  ],
  spine: [
    KEYPOINT_INDICES.leftShoulder,
    KEYPOINT_INDICES.rightShoulder,
    KEYPOINT_INDICES.leftHip,
    KEYPOINT_INDICES.rightHip,
  ],
};

export function SkeletonOverlay({
  pose,
  videoWidth,
  videoHeight,
  feedback,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (!pose) return;

    const keypoints = pose.keypoints;

    // Build feedback color map
    const feedbackColors: Record<number, string> = {};
    feedback.forEach((fb) => {
      if (fb.bodyPart && BODY_PART_KEYPOINTS[fb.bodyPart]) {
        const color =
          fb.severity === "good"
            ? "#00ff88"
            : fb.severity === "warning"
            ? "#ffaa00"
            : "#ff4466";
        BODY_PART_KEYPOINTS[fb.bodyPart].forEach((kpIdx) => {
          feedbackColors[kpIdx] = color;
        });
      }
    });

    // Draw skeleton connections
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    SKELETON_CONNECTIONS.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      if (!kp1 || !kp2) return;
      if ((kp1.score && kp1.score < 0.3) || (kp2.score && kp2.score < 0.3))
        return;

      // Mirror the x coordinate
      const x1 = videoWidth - kp1.x;
      const y1 = kp1.y;
      const x2 = videoWidth - kp2.x;
      const y2 = kp2.y;

      // Determine color based on feedback
      const color1 = feedbackColors[i] || "#00d4ff";
      const color2 = feedbackColors[j] || "#00d4ff";

      // Create gradient for line
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw keypoints
    keypoints.forEach((kp, idx) => {
      if (!kp || (kp.score && kp.score < 0.3)) return;

      const x = videoWidth - kp.x;
      const y = kp.y;
      const color = feedbackColors[idx] || "#00d4ff";

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = color + "40";
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });
  }, [pose, videoWidth, videoHeight, feedback]);

  return (
    <canvas
      ref={canvasRef}
      className="skeleton-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
