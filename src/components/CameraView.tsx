import React, { useEffect, useRef } from 'react';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { drawHand } from '../utils/drawingUtils';
import { GestureType } from '../utils/gestureDetection';
import { AppMode } from '../App';

interface CameraViewProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    landmarks: NormalizedLandmark[] | null;
    gesture: GestureType;
    mode: AppMode;
}

export function CameraView({ videoRef, landmarks, gesture, mode }: CameraViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Setup camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720
                    }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                // Handle permission error visually?
            }
        };
        startCamera();
    }, [videoRef]);

    // Draw loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !landmarks) {
            // Clear canvas if no landmarks
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to video render size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        drawHand(ctx, landmarks, canvas.width, canvas.height);

        // Mode specific overlays? 
        // e.g. Cursor for Game Mode
        if (mode === 'GAME' && gesture === 'POINT') {
            // Draw cursor at index finger tip (landmark 8)
            const tip = landmarks[8];
            const x = tip.x * canvas.width;
            const y = tip.y * canvas.height;

            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = '#f472b6'; // pink-400
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

    }, [landmarks, gesture, mode]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40 border border-cyan-900/30 shadow-[0_0_30px_rgba(8,145,178,0.1)]">
            <div className="absolute inset-0 flex items-center justify-center text-cyan-900/50">
                <p>Camera Feed Initializing...</p>
            </div>
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                playsInline
                muted
                autoPlay
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* HUD Overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-2 py-1 bg-black/60 border border-cyan-500/30 rounded text-xs text-cyan-400">
                    CAM: ACTIVE
                </div>
                <div className="px-2 py-1 bg-black/60 border border-red-500/30 rounded text-xs text-red-400">
                    REC
                </div>
                <div className="px-2 py-1 bg-black/60 border border-purple-500/30 rounded text-xs text-purple-400 font-bold">
                    MODE: {mode}
                </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg" />
        </div>
    );
}
