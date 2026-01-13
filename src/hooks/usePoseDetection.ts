import { useEffect, useRef, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import type { Pose, Keypoint } from "../types/pose";

interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isRunning: boolean;
}

export function usePoseDetection({
  videoRef,
  isRunning,
}: UsePoseDetectionProps) {
  const [pose, setPose] = useState<Pose | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize TensorFlow and detector
  useEffect(() => {
    async function initDetector() {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize TensorFlow.js
        await tf.ready();
        await tf.setBackend("webgl");

        // Create MoveNet detector
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25,
        };

        detectorRef.current = await poseDetection.createDetector(
          model,
          detectorConfig
        );
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize pose detector:", err);
        setError("Failed to load pose detection model");
        setIsLoading(false);
      }
    }

    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  // Run pose detection loop
  const detectPose = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !isRunning) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    try {
      const poses = await detectorRef.current.estimatePoses(video, {
        flipHorizontal: true,
      });

      if (poses.length > 0) {
        const detectedPose = poses[0];
        const keypoints: Keypoint[] = detectedPose.keypoints.map((kp) => ({
          x: kp.x,
          y: kp.y,
          score: kp.score,
          name: kp.name,
        }));

        setPose({
          keypoints,
          score: detectedPose.score,
        });
      } else {
        setPose(null);
      }
    } catch (err) {
      console.error("Pose detection error:", err);
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  }, [videoRef, isRunning]);

  useEffect(() => {
    if (isRunning && !isLoading) {
      detectPose();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isLoading, detectPose]);

  return { pose, isLoading, error };
}

// Keypoint indices for MoveNet
export const KEYPOINT_INDICES = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
};
