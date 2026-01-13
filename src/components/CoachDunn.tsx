import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Circle } from "lucide-react";
import { Camera } from "./Camera";
import type { CameraHandle } from "./Camera";
import { SkeletonOverlay } from "./SkeletonOverlay";
import { RecordingOverlay } from "./RecordingOverlay";
import { SetAnalysisView } from "./SetAnalysisView";
import { ExerciseSelector } from "./ExerciseSelector";
import { usePoseDetection } from "../hooks/usePoseDetection";
import type {
  ExerciseType,
  SetRecording,
  SetAnalysis as SetAnalysisType,
  RepData,
  FormIssue,
  JointAngles,
} from "../types/pose";
import {
  extractJointAngles,
  analyzeForm,
  detectPhase,
  EXERCISE_CONFIGS,
} from "../utils/formAnalysis";
import { analyzeSet } from "../utils/setAnalysis";

type AppScreen = "welcome" | "recording" | "analysis";

export function CoachDunn() {
  const cameraRef = useRef<CameraHandle>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Screen state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("welcome");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("squat");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });

  // Recording state
  const [recording, setRecording] = useState<SetRecording | null>(null);
  const [analysis, setAnalysis] = useState<SetAnalysisType | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Rep tracking (internal, not shown during recording)
  const [repCount, setRepCount] = useState(0);
  const previousPhaseRef = useRef<"up" | "down" | "hold" | "idle">("idle");
  const currentRepDataRef = useRef<Partial<RepData>>({});

  // Get video reference when camera is ready
  const handleStreamReady = useCallback(() => {
    if (cameraRef.current) {
      videoRef.current = cameraRef.current.getVideo();
      if (videoRef.current) {
        setVideoDimensions({
          width: videoRef.current.videoWidth || 640,
          height: videoRef.current.videoHeight || 480,
        });
      }
    }
  }, []);

  // Pose detection
  const { pose, isLoading, error } = usePoseDetection({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    isRunning: currentScreen === "recording" && isCameraActive,
  });

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (currentScreen === "recording" && recording) {
      interval = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentScreen, recording]);

  // Process pose data during recording
  useEffect(() => {
    if (!pose || currentScreen !== "recording" || !recording) return;

    const angles = extractJointAngles(pose);
    if (!angles) return;

    // Get form analysis (but don't display it - just track it)
    const { feedback, formScore } = analyzeForm(angles, selectedExercise);

    // Detect phase for rep counting
    const currentPhase = detectPhase(angles, selectedExercise, previousPhaseRef.current);

    // Track form issues for current rep
    const issues: FormIssue[] = feedback
      .filter((f) => f.severity !== "good" && f.bodyPart)
      .map((f) => {
        const bodyPart = f.bodyPart as keyof JointAngles;
        const config = EXERCISE_CONFIGS[selectedExercise];
        const targetAngle = config.targetAngles[bodyPart] || 0;
        return {
          bodyPart,
          severity: f.severity as "warning" | "error",
          actualAngle: angles[bodyPart],
          targetAngle,
          deviation: Math.abs(angles[bodyPart] - targetAngle),
        };
      });

    // Update current rep tracking
    if (!currentRepDataRef.current.formScore || formScore < currentRepDataRef.current.formScore) {
      // Track worst form score during the rep (most representative of issues)
      currentRepDataRef.current = {
        formScore,
        issues,
        angles: { ...angles },
      };
    }

    // Count rep when transitioning from down to up
    if (previousPhaseRef.current === "down" && currentPhase === "up") {
      const newRepCount = repCount + 1;
      setRepCount(newRepCount);

      // Save completed rep data
      const repData: RepData = {
        repNumber: newRepCount,
        timestamp: Date.now(),
        formScore: currentRepDataRef.current.formScore || formScore,
        issues: currentRepDataRef.current.issues || issues,
        angles: currentRepDataRef.current.angles || angles,
      };

      setRecording((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reps: [...prev.reps, repData],
        };
      });

      // Reset for next rep
      currentRepDataRef.current = {};
    }

    previousPhaseRef.current = currentPhase;
  }, [pose, currentScreen, recording, selectedExercise, repCount]);

  // Start workout
  const handleStartWorkout = () => {
    setIsCameraActive(true);
    setCurrentScreen("recording");
    setRepCount(0);
    setRecordingDuration(0);
    previousPhaseRef.current = "idle";
    currentRepDataRef.current = {};

    // Initialize new recording
    setRecording({
      id: `set-${Date.now()}`,
      exerciseType: selectedExercise,
      startTime: Date.now(),
      reps: [],
      status: "recording",
    });
  };

  // Stop recording and analyze
  const handleStopRecording = () => {
    if (!recording) return;

    const finalRecording: SetRecording = {
      ...recording,
      endTime: Date.now(),
      status: "complete",
    };

    setRecording(finalRecording);

    // Analyze the set
    const analysisResult = analyzeSet(finalRecording);
    setAnalysis(analysisResult);

    setCurrentScreen("analysis");
    setIsCameraActive(false);
  };

  // Start new set (same exercise)
  const handleNewSet = () => {
    setRepCount(0);
    setRecordingDuration(0);
    setAnalysis(null);
    previousPhaseRef.current = "idle";
    currentRepDataRef.current = {};

    setRecording({
      id: `set-${Date.now()}`,
      exerciseType: selectedExercise,
      startTime: Date.now(),
      reps: [],
      status: "recording",
    });

    setIsCameraActive(true);
    setCurrentScreen("recording");
  };

  // Back to menu
  const handleBackToMenu = () => {
    setIsCameraActive(false);
    setCurrentScreen("welcome");
    setRecording(null);
    setAnalysis(null);
    setRepCount(0);
    setRecordingDuration(0);
    previousPhaseRef.current = "idle";
  };

  return (
    <div className="coachdunn">
      {/* Background effects */}
      <div className="bg-gradient" />
      <div className="bg-grid" />

      {/* Header */}
      <header className="header">
        <motion.div
          className="logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Zap className="logo-icon" />
          <span className="logo-text">CoachDunn</span>
        </motion.div>
        <p className="tagline">Your AI Exercise Buddy</p>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {currentScreen === "welcome" && (
            <motion.div
              key="welcome"
              className="welcome-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <motion.div
                className="hero-animation"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="hero-figure">
                  <div className="figure-head" />
                  <div className="figure-body" />
                  <div className="figure-arm left" />
                  <div className="figure-arm right" />
                  <div className="figure-leg left" />
                  <div className="figure-leg right" />
                </div>
              </motion.div>

              <h1 className="welcome-title">
                Record. Analyze. <span className="highlight">Improve.</span>
              </h1>
              <p className="welcome-description">
                Record your exercise set, get detailed form analysis, and receive personalized recommendations to improve your technique.
              </p>

              <ExerciseSelector
                selectedExercise={selectedExercise}
                onSelect={setSelectedExercise}
              />

              <motion.button
                className="start-button"
                onClick={handleStartWorkout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Circle size={24} fill="currentColor" />
                <span>Start Recording</span>
              </motion.button>

              <p className="start-hint">
                We'll track your reps and analyze your form after you finish
              </p>
            </motion.div>
          )}

          {/* Recording Screen */}
          {currentScreen === "recording" && (
            <motion.div
              key="recording"
              className="recording-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="video-container recording-mode">
                <Camera
                  ref={cameraRef}
                  isActive={isCameraActive}
                  onStreamReady={handleStreamReady}
                />

                {/* Skeleton overlay - subtle, just for visual feedback */}
                {videoRef.current && pose && (
                  <SkeletonOverlay
                    pose={pose}
                    videoWidth={videoDimensions.width}
                    videoHeight={videoDimensions.height}
                    feedback={[]} // No feedback colors during recording
                  />
                )}

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="loading-overlay">
                    <div className="loading-spinner large" />
                    <p>Loading AI Model...</p>
                  </div>
                )}

                {/* Recording UI Overlay */}
                {!isLoading && !error && (
                  <RecordingOverlay
                    exerciseType={selectedExercise}
                    repCount={repCount}
                    isRecording={true}
                    duration={recordingDuration}
                    onStop={handleStopRecording}
                  />
                )}

                {/* Error Overlay */}
                {error && (
                  <div className="error-overlay">
                    <p>{error}</p>
                    <button onClick={handleBackToMenu}>Back to Menu</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Analysis Screen */}
          {currentScreen === "analysis" && recording && analysis && (
            <SetAnalysisView
              key="analysis"
              recording={recording}
              analysis={analysis}
              onNewSet={handleNewSet}
              onBackToMenu={handleBackToMenu}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built with TensorFlow.js MoveNet • Real-time Pose Detection</p>
      </footer>
    </div>
  );
}
