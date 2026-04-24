import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureType =
    | 'NONE'
    | 'OPEN_PALM'
    | 'FIST'
    | 'THUMBS_UP'
    | 'PEACE'
    | 'POINT'
    | 'PINCH';

interface FingerState {
    isExtended: boolean;
    isCurled: boolean;
}

// Landmark indices
const TIPS = [4, 8, 12, 16, 20];
const PIP_JOINTS = [2, 6, 10, 14, 18];
const MCP_JOINTS = [1, 5, 9, 13, 17];
const WRIST = 0;

/**
 * Calculates Euclidean distance between two landmarks
 */
function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Detects if a finger is extended based on landmark positions
 */
function isFingerExtended(landmarks: NormalizedLandmark[], fingerIndex: number): boolean {
    const tip = landmarks[TIPS[fingerIndex]];
    const pip = landmarks[PIP_JOINTS[fingerIndex]];
    const mcp = landmarks[MCP_JOINTS[fingerIndex]];
    const wrist = landmarks[WRIST];

    // Thumb special case (check x-distance for side movement)
    if (fingerIndex === 0) {
        // A simple heuristic for thumb extension: tip is further from index MCP than thumb IP
        const thumbIp = landmarks[3];
        const indexMcp = landmarks[5];
        const tipDist = getDistance(tip, indexMcp);
        const ipDist = getDistance(thumbIp, indexMcp);
        return tipDist > ipDist * 1.2;
    }

    // Other fingers: tip should be further from wrist than PIP
    return getDistance(tip, wrist) > getDistance(pip, wrist) &&
        getDistance(tip, wrist) > getDistance(mcp, wrist);
}

export function detectGesture(landmarks: NormalizedLandmark[]): { gesture: GestureType, confidence: number } {
    if (!landmarks || landmarks.length < 21) {
        return { gesture: 'NONE', confidence: 0 };
    }

    const fingers = [0, 1, 2, 3, 4].map(i => isFingerExtended(landmarks, i));
    const [thumb, index, middle, ring, pinky] = fingers;
    const numExtended = fingers.filter(f => f).length;

    // Calculate specific distances for gestures
    const pinchDist = getDistance(landmarks[4], landmarks[8]);
    const isPinching = pinchDist < 0.05; // Threshold may need tuning

    // 1. OPEN PALM implies checks for all fingers
    // However, sometimes thumb is tricky. Relaxed open palm usually has 5.
    if (numExtended === 5 && !isPinching) {
        return { gesture: 'OPEN_PALM', confidence: 0.9 };
    }

    // 2. FIST: No fingers extended (or maybe just thumb tucked in)
    if (numExtended === 0) {
        return { gesture: 'FIST', confidence: 0.9 };
    }

    // 3. THUMBS UP
    if (thumb && !index && !middle && !ring && !pinky) {
        // Check orientation? For now just extended state.
        // Ensure thumb tip is above wrist (y-axis inverted in some coords, but standardized is 0 top?)
        // In MP Normalized, y increases downwards. So tip.y < pip.y
        const isUpright = landmarks[4].y < landmarks[3].y;
        if (isUpright) return { gesture: 'THUMBS_UP', confidence: 0.85 };
    }

    // 4. PEACE (Index + Middle)
    if (!thumb && index && middle && !ring && !pinky) {
        return { gesture: 'PEACE', confidence: 0.85 };
    }

    // 5. POINT (Index only)
    if (!thumb && index && !middle && !ring && !pinky) {
        return { gesture: 'POINT', confidence: 0.85 };
    }

    // 6. PINCH (Thumb + Index close)
    // Pinch can happen with other fingers extended or curled. 
    // Often used for "drag", so maybe check if pinch distance is small.
    if (isPinching) {
        return { gesture: 'PINCH', confidence: 0.9 };
    }

    return { gesture: 'NONE', confidence: 0.5 };
}
