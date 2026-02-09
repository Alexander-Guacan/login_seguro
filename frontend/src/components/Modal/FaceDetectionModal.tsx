import {
  HiOutlineVideoCamera,
  HiOutlineVideoCameraSlash,
} from "react-icons/hi2";
import * as faceapi from "face-api.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { useAlert } from "../../hooks/useAlert";

type LivenessStatus = "idle" | "waiting-face" | "blink" | "success";

const calcDistance = (p1: faceapi.Point, p2: faceapi.Point) =>
  Math.hypot(p1.x - p2.x, p1.y - p2.y);

const getEyeAspectRatio = (eye: faceapi.Point[]) => {
  const dist1 = calcDistance(eye[1], eye[5]);
  const dist2 = calcDistance(eye[2], eye[4]);
  const horizontal = calcDistance(eye[0], eye[3]);

  if (horizontal === 0) return 0;
  return (dist1 + dist2) / (2 * horizontal);
};

interface Props {
  open: boolean;
  disabled?: boolean;
  onDetection?: (descriptor: number[]) => void | Promise<void>;
  onCancel?: () => void;
}

let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
};

export function FaceDetectorModal({
  open,
  disabled,
  onDetection,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>("idle");
  const livenessIntervalRef = useRef<number | null>(null);
  const livenessTimeoutRef = useRef<number | null>(null);
  const hasDetectedRef = useRef(false);
  const { showAlert } = useAlert();

  const handleCancel = () => {
    stopLiveness();
    stopCamera();
    setLivenessStatus("idle");
    onCancel?.();
  };

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });
      setVideoStream(videoStream);
      videoRef.current.srcObject = videoStream;
    } catch {
      showAlert("No se pudo iniciar la camara.", { type: "error" });
    }
  };

  const stopCamera = useCallback(() => {
    if (!videoStream || !videoRef.current) return;

    videoStream.getTracks().forEach((track) => track.stop());
    setVideoStream(null);
    videoRef.current.srcObject = null;
    stopLiveness();
  }, [videoStream]);

  const switchCamera = () => {
    if (videoStream) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startLivenessCheck = async () => {
    hasDetectedRef.current = false;
    stopLiveness();

    if (
      !modelsLoaded ||
      !videoStream ||
      !videoRef.current ||
      !canvasRef.current
    )
      return;

    setSubmitting(true);
    setLivenessStatus("waiting-face");

    livenessTimeoutRef.current = window.setTimeout(() => {
      stopLiveness();
      setSubmitting(false);
      setLivenessStatus("idle");
      showAlert("Tiempo agotado. Intenta nuevamente.", { type: "error" });
    }, 15000);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    faceapi.matchDimensions(canvas, {
      width: rect.width,
      height: rect.height,
    });

    let eyesOpen = true;
    let closedFrames = 0;

    const BLINK_THRESHOLD = 0.32;

    livenessIntervalRef.current = window.setInterval(async () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setLivenessStatus("waiting-face");
        return;
      }

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      if (!detection) {
        setLivenessStatus("waiting-face");
        return;
      }

      const resized = faceapi.resizeResults(detection, {
        width: rect.width,
        height: rect.height,
      });

      faceapi.draw.drawFaceLandmarks(canvas, resized);

      const landmarks = resized.landmarks;
      const leftEAR = getEyeAspectRatio(landmarks.getLeftEye());
      const rightEAR = getEyeAspectRatio(landmarks.getRightEye());
      const avgEAR = (leftEAR + rightEAR) / 2;

      if (avgEAR < BLINK_THRESHOLD) {
        setLivenessStatus("blink");
        if (eyesOpen) closedFrames++;
        if (closedFrames > 1) eyesOpen = false;
      } else {
        if (!eyesOpen) {
          if (hasDetectedRef.current) return;

          hasDetectedRef.current = true;

          stopLiveness();
          setLivenessStatus("success");

          const descriptor = Array.from(detection.descriptor);
          await onDetection?.(descriptor);

          setSubmitting(false);
          return;
        }
        closedFrames = 0;
        eyesOpen = true;
      }
    }, 120);
  };

  const stopLiveness = () => {
    setLivenessStatus("idle");

    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
      livenessIntervalRef.current = null;
    }

    if (livenessTimeoutRef.current) {
      clearTimeout(livenessTimeoutRef.current);
      livenessTimeoutRef.current = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <dialog
      open={open}
      className={`modal-container ${open ? "modal-container--open" : "modal-container--closed"}`}
    >
      <section className="modal md:min-w-100">
        <header className="modal__header">
          <h3 className="modal__title">Reconocimiento Facial</h3>
        </header>
        <div className="relative bg-gray-200 flex flex-col w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={!videoStream ? "hidden" : "block"}
          />
          <canvas ref={canvasRef} className="absolute top-0 left-0" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {livenessStatus === "waiting-face" && "😐 Mira a la cámara"}
            {livenessStatus === "blink" && "👁️ Parpadea"}
            {livenessStatus === "success" && "✅ Rostro detectado."}
          </div>
          {!videoStream && (
            <div className="min-h-60 flex flex-col items-center justify-center p-4 text-center text-gray-500/80">
              <span>
                <HiOutlineVideoCameraSlash />
              </span>
              <p>No se detectó una camara</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full flex justify-center py-2">
            <button
              className="bg-indigo-500 text-white rounded-full p-3"
              onClick={switchCamera}
            >
              {videoStream ? (
                <HiOutlineVideoCameraSlash />
              ) : (
                <HiOutlineVideoCamera />
              )}
            </button>
          </div>
        </div>
        <footer className="modal__actions">
          <button
            className="button-primary"
            type="button"
            disabled={
              disabled ||
              submitting ||
              !videoStream ||
              !modelsLoaded ||
              livenessStatus === "success"
            }
            onClick={startLivenessCheck}
          >
            <span>
              {submitting ? (
                <ImSpinner2 className="animate-spin" />
              ) : (
                "Comenzar"
              )}
            </span>
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={handleCancel}
            disabled={disabled || submitting}
          >
            Cancelar
          </button>
        </footer>
      </section>
    </dialog>
  );
}
