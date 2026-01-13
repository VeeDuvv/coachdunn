import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { motion } from "framer-motion";

interface CameraProps {
  onStreamReady?: () => void;
  isActive: boolean;
}

export interface CameraHandle {
  getVideo: () => HTMLVideoElement | null;
}

export const Camera = forwardRef<CameraHandle, CameraProps>(
  ({ onStreamReady, isActive }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getVideo: () => videoRef.current,
    }));

    useEffect(() => {
      async function startCamera() {
        if (!isActive) {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });

          streamRef.current = stream;
          setHasPermission(true);
          setError(null);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              onStreamReady?.();
            };
          }
        } catch (err) {
          console.error("Camera error:", err);
          setHasPermission(false);
          setError("Camera access denied or unavailable");
        }
      }

      startCamera();

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, [isActive, onStreamReady]);

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="camera-error"
        >
          <div className="error-icon">📷</div>
          <p>{error}</p>
          <p className="error-hint">
            Please allow camera access to use CoachDunn
          </p>
        </motion.div>
      );
    }

    if (hasPermission === null && isActive) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="camera-loading"
        >
          <div className="loading-spinner"></div>
          <p>Requesting camera access...</p>
        </motion.div>
      );
    }

    return (
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        style={{
          transform: "scaleX(-1)", // Mirror the video
          display: isActive ? "block" : "none",
        }}
      />
    );
  }
);

Camera.displayName = "Camera";
