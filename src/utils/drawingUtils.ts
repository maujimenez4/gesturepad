import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const DRAWING_CONFIG = {
    LANDMARK_COLOR: '#22d3ee', // Cyan-400
    CONNECTOR_COLOR: 'rgba(34, 211, 238, 0.4)', // Cyan with opacity
    LANDMARK_RADIUS: 3,
    CONNECTOR_WIDTH: 2,
};

const CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17] // PalmBase
];

export function drawHand(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Draw Connections
    ctx.lineWidth = DRAWING_CONFIG.CONNECTOR_WIDTH;
    ctx.strokeStyle = DRAWING_CONFIG.CONNECTOR_COLOR;

    CONNECTIONS.forEach(([start, end]) => {
        const p1 = landmarks[start];
        const p2 = landmarks[end];

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
    });

    // Draw Landmarks
    ctx.fillStyle = DRAWING_CONFIG.LANDMARK_COLOR;

    landmarks.forEach((landmark) => {
        const x = landmark.x * width;
        const y = landmark.y * height;

        ctx.beginPath();
        ctx.arc(x, y, DRAWING_CONFIG.LANDMARK_RADIUS, 0, 2 * Math.PI);
        ctx.fill();

        // Add glow
        ctx.shadowColor = DRAWING_CONFIG.LANDMARK_COLOR;
        ctx.shadowBlur = 10;
    });

    ctx.restore();
}
