import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap, Camera as CameraIcon } from 'lucide-react';
import { Camera } from './Camera';
import type { CameraHandle } from './Camera';
import { SkeletonOverlay } from './SkeletonOverlay';
import { FeedbackPanel } from './FeedbackPanel';
import { ExerciseSelector } from './ExerciseSelector';
import { usePoseDetection } from '../hooks/usePoseDetection';
import type { ExerciseType, ExerciseState } from '../types/pose';
import { extractJointAngles, analyzeForm, detectPhase } from '../utils/formAnalysis';

export function CoachDunn() {
  const cameraRef = useRef<CameraHandle>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat');
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    type: 'squat',
    repCount: 0,
    phase: 'idle',
    formScore: 0,
    feedback: [],
  });

  const previousPhaseRef = useRef<'up' | 'down' | 'hold' | 'idle'>('idle');

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

  // Use pose detection hook
  const { pose, isLoading, error } = usePoseDetection({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    isRunning: isRunning && isActive,
  });

  // Process pose data
  useEffect(() => {
    if (!pose || !isRunning) return;

    const angles = extractJointAngles(pose);
    if (!angles) return;

    // Analyze form
    const { feedback, formScore } = analyzeForm(angles, selectedExercise);
    
    // Detect phase and count reps
    const currentPhase = detectPhase(angles, selectedExercise, previousPhaseRef.current);
    
    let newRepCount = exerciseState.repCount;
    
    // Count rep when transitioning from down to up
    if (previousPhaseRef.current === 'down' && currentPhase === 'up') {
      newRepCount += 1;
    }
    
    previousPhaseRef.current = currentPhase;

    setExerciseState((prev) => ({
      ...prev,
      type: selectedExercise,
      phase: currentPhase,
      formScore,
      feedback,
      repCount: newRepCount,
    }));
  }, [pose, isRunning, selectedExercise]);

  // Reset when exercise changes
  useEffect(() => {
    setExerciseState((prev) => ({
      ...prev,
      type: selectedExercise,
      repCount: 0,
      phase: 'idle',
      formScore: 0,
      feedback: [],
    }));
    previousPhaseRef.current = 'idle';
  }, [selectedExercise]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleToggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setExerciseState((prev) => ({
      ...prev,
      repCount: 0,
      phase: 'idle',
      formScore: 0,
      feedback: [],
    }));
    previousPhaseRef.current = 'idle';
  };

  const handleStop = () => {
    setIsActive(false);
    setIsRunning(false);
    handleReset();
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
          {!isActive ? (
            /* Welcome Screen */
            <motion.div
              key="welcome"
              className="welcome-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <motion.div 
                className="hero-animation"
                animate={{ 
                  rotateY: [0, 360],
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
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
                Perfect Your Form with <span className="highlight">AI</span>
              </h1>
              <p className="welcome-description">
                Real-time pose detection and form analysis to help you exercise safely and effectively.
              </p>

              <ExerciseSelector
                selectedExercise={selectedExercise}
                onSelect={setSelectedExercise}
              />

              <motion.button
                className="start-button"
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CameraIcon size={24} />
                <span>Start Workout</span>
              </motion.button>
            </motion.div>
          ) : (
            /* Workout Screen */
            <motion.div
              key="workout"
              className="workout-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="workout-layout">
                {/* Video Container */}
                <div className="video-container">
                  <Camera
                    ref={cameraRef}
                    isActive={isActive}
                    onStreamReady={handleStreamReady}
                  />
                  
                  {videoRef.current && (
                    <SkeletonOverlay
                      pose={pose}
                      videoWidth={videoDimensions.width}
                      videoHeight={videoDimensions.height}
                      feedback={exerciseState.feedback}
                    />
                  )}

                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner large" />
                      <p>Loading AI Model...</p>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {error && (
                    <div className="error-overlay">
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Exercise Badge */}
                  <div className="exercise-badge">
                    <span className="badge-icon">
                      {selectedExercise === 'squat' && '🏋️'}
                      {selectedExercise === 'pushup' && '💪'}
                      {selectedExercise === 'lunge' && '🦵'}
                      {selectedExercise === 'plank' && '🧘'}
                      {selectedExercise === 'jumpingJack' && '⭐'}
                    </span>
                    <span className="badge-text">
                      {selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="sidebar">
                  <FeedbackPanel
                    exerciseState={exerciseState}
                    isDetecting={isRunning && !!pose}
                  />

                  {/* Controls */}
                  <div className="controls">
                    <motion.button
                      className={`control-button ${isRunning ? 'pause' : 'play'}`}
                      onClick={handleToggleRunning}
                      disabled={isLoading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isRunning ? <Pause size={28} /> : <Play size={28} />}
                    </motion.button>
                    
                    <motion.button
                      className="control-button reset"
                      onClick={handleReset}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RotateCcw size={24} />
                    </motion.button>
                  </div>

                  {/* Exercise Selector (compact) */}
                  <div className="exercise-selector-compact">
                    {(['squat', 'pushup', 'lunge', 'plank', 'jumpingJack'] as ExerciseType[]).map((type) => (
                      <button
                        key={type}
                        className={`exercise-mini ${selectedExercise === type ? 'active' : ''}`}
                        onClick={() => setSelectedExercise(type)}
                      >
                        {type === 'squat' && '🏋️'}
                        {type === 'pushup' && '💪'}
                        {type === 'lunge' && '🦵'}
                        {type === 'plank' && '🧘'}
                        {type === 'jumpingJack' && '⭐'}
                      </button>
                    ))}
                  </div>

                  {/* Back button */}
                  <button className="back-button" onClick={handleStop}>
                    ← Back to Menu
                  </button>
                </div>
              </div>
            </motion.div>
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

