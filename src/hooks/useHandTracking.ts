import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { detectGesture, GestureType } from '../utils/gestureDetection';

export interface HandTrackingResult {
    landmarks: NormalizedLandmark[] | null;
    gesture: GestureType;
    confidence: number;
    isModelLoading: boolean;
    error: string | null;
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement>) {
    const [result, setResult] = useState<HandTrackingResult>({
        landmarks: null,
        gesture: 'NONE',
        confidence: 0,
        isModelLoading: true,
        error: null,
    });

    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>();
    const gestureBuffer = useRef<GestureType[]>([]);
    const keyboardGesture = useRef<GestureType>('NONE');

    // Keyboard Fallback
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const keyMap: Record<string, GestureType> = {
                '1': 'OPEN_PALM',
                '2': 'FIST',
                '3': 'THUMBS_UP',
                '4': 'PEACE',
                '5': 'POINT',
                '6': 'PINCH'
            };
            if (keyMap[e.key]) {
                keyboardGesture.current = keyMap[e.key];
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const keyMap: Record<string, GestureType> = {
                '1': 'OPEN_PALM',
                '2': 'FIST',
                '3': 'THUMBS_UP',
                '4': 'PEACE',
                '5': 'POINT',
                '6': 'PINCH'
            };
            if (keyMap[e.key] && keyboardGesture.current === keyMap[e.key]) {
                keyboardGesture.current = 'NONE';
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const setupMediaPipe = async () => {
            try {
                console.log("Loading MediaPipe Vision...");
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );

                if (!mounted) return;

                console.log("Creating HandLandmarker...");
                landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                console.log("MediaPipe initialized successfully");
                setResult(prev => ({ ...prev, isModelLoading: false }));
                startLoop();
            } catch (err) {
                console.error("Error initializing MediaPipe:", err);
                if (mounted) {
                    setResult(prev => ({
                        ...prev,
                        isModelLoading: false,
                        error: String(err)
                    }));
                }
            }
        };

        setupMediaPipe();

        return () => {
            mounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            landmarkerRef.current?.close();
        };
    }, []);

    const startLoop = () => {
        const loop = () => {
            if (videoRef.current && videoRef.current.readyState >= 2 && landmarkerRef.current) {
                let currentGesture: GestureType = 'NONE';
                let currentLandmarks: NormalizedLandmark[] | null = null;
                let currentConfidence = 0;

                // 1. Detection
                const detection = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());

                if (detection.landmarks && detection.landmarks.length > 0) {
                    currentLandmarks = detection.landmarks[0];
                    const calculated = detectGesture(currentLandmarks);
                    currentGesture = calculated.gesture;
                    currentConfidence = calculated.confidence;
                }

                // 2. Override with Keyboard
                if (keyboardGesture.current !== 'NONE') {
                    currentGesture = keyboardGesture.current;
                    currentConfidence = 1;
                }

                // 3. Smoothing (require 3 consecutive frames)
                const buffer = gestureBuffer.current;
                buffer.push(currentGesture);
                if (buffer.length > 3) buffer.shift();

                // Check if all in buffer are strictly equal
                const isStable = buffer.length === 3 && buffer.every(g => g === currentGesture);
                const smoothedGesture = isStable ? currentGesture : result.gesture; // hold previous if unstable

                // If buffer has different values, maybe strictly return NONE or keep previous?
                // Let's implement strict transition: simple debounce.
                // Actually, "appear the same for 3 frames" means we only UPDATE the state if 3 frames match.
                // If not matching, we keep the OLD result or transition to NONE? 
                // Best UX: Keep old result until 3 frames of NEW result are seen.

                // But if we lose tracking, we should go to NONE quickly.
                let finalGesture = result.gesture;
                if (buffer.length === 3 && buffer.every(v => v === buffer[0])) {
                    finalGesture = buffer[0];
                }

                setResult(prev => ({
                    ...prev,
                    landmarks: currentLandmarks,
                    gesture: finalGesture,
                    confidence: currentConfidence,
                    error: null
                }));
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        loop();
    };

    return result;
}
