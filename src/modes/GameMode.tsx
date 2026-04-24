import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, Target, Trophy, Heart } from 'lucide-react';
import { GestureType } from '../utils/gestureDetection';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface GameModeProps {
    gesture: GestureType;
    landmarks: NormalizedLandmark[] | null;
    videoRef: React.RefObject<HTMLVideoElement>;
}

// Game Constants
const SHIP_SIZE = 40;
const BULLET_RADIUS = 3;
const ENEMY_SIZE = 30;
const CANVAS_WIDTH = 400; // Virtual width for logic
const CANVAS_HEIGHT = 500;

interface Entity {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    active: boolean;
}

export function GameMode({ gesture, landmarks, videoRef }: GameModeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [highScore, setHighScore] = useState(0);

    // Game Mutable State Ref
    const gameRef = useRef({
        playerX: CANVAS_WIDTH / 2,
        playerY: CANVAS_HEIGHT - 60,
        bullets: [] as Entity[],
        enemies: [] as Entity[],
        lastFireTime: 0,
        lastEnemySpawn: 0,
        frameCount: 0,
        isPinchActive: false,
        score: 0,
        lives: 3,
        shake: 0
    });

    const startGame = () => {
        setGameState('PLAYING');
        setScore(0);
        setLives(3);
        gameRef.current = {
            playerX: CANVAS_WIDTH / 2,
            playerY: CANVAS_HEIGHT - 60,
            bullets: [],
            enemies: [],
            lastFireTime: 0,
            lastEnemySpawn: 0,
            frameCount: 0,
            isPinchActive: false,
            score: 0,
            lives: 3,
            shake: 0
        };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        const render = () => {
            const state = gameRef.current;
            const now = Date.now();

            // --- DRAW BACKGROUND & SHAKE ---
            ctx.fillStyle = '#0f172a'; // Slate 900

            // Screen Shake Logic
            let shakeX = 0;
            let shakeY = 0;
            if (state.shake > 0) {
                shakeX = (Math.random() - 0.5) * 10;
                shakeY = (Math.random() - 0.5) * 10;
                state.shake--;
            }

            // Save context for shake translation
            ctx.save();
            ctx.translate(shakeX, shakeY);

            // Clear screen (with buffer for shake)
            ctx.fillRect(-20, -20, CANVAS_WIDTH + 40, CANVAS_HEIGHT + 40);

            // --- UPDATE LOGIC (Only if Playing) ---
            if (gameState === 'PLAYING') {
                // 1. Player Movement (Follow Hand)
                if (landmarks && landmarks.length > 0) {
                    const landmarker = landmarks[9]; // Middle finger MCP
                    const targetX = (1 - landmarker.x) * CANVAS_WIDTH; // Mirror
                    const targetY = landmarker.y * CANVAS_HEIGHT;

                    // Smooth Lerp
                    state.playerX = state.playerX + (targetX - state.playerX) * 0.2;
                    state.playerY = state.playerY + (targetY - state.playerY) * 0.2;
                }

                // 2. Firing (Pinch)
                const isPinchNow = gesture === 'PINCH';
                if (isPinchNow && !state.isPinchActive && now - state.lastFireTime > 250) {
                    state.bullets.push({
                        id: Math.random(),
                        x: state.playerX,
                        y: state.playerY - 20,
                        w: BULLET_RADIUS * 2,
                        h: BULLET_RADIUS * 2,
                        active: true
                    });
                    state.lastFireTime = now;
                }
                state.isPinchActive = isPinchNow;

                // 3. Spawning Enemies (INSANE DIFFICULTY)
                // Spawn Delay: Decreases aggressively. 
                // Starts at 1200ms. Drops by 20ms per point.
                // At 20 pts: ~800ms. At 50 pts: ~200ms (Cap 150ms).
                const spawnDelay = Math.max(150, 1200 - (state.score * 20));

                if (now - state.lastEnemySpawn > spawnDelay) {

                    const spawnEnemyAt = (overrideX?: number) => {
                        let ex = overrideX ?? Math.random() * (CANVAS_WIDTH - ENEMY_SIZE);
                        // Clamp
                        ex = Math.max(0, Math.min(CANVAS_WIDTH - ENEMY_SIZE, ex));

                        // Check overlap with existing recent spawns to avoid physics glitches
                        const overlap = state.enemies.some(e => Math.abs(e.y - (-ENEMY_SIZE)) < 10 && Math.abs(e.x - ex) < ENEMY_SIZE + 5);
                        if (!overlap) {
                            state.enemies.push({
                                id: Math.random(),
                                x: ex,
                                y: -ENEMY_SIZE,
                                w: ENEMY_SIZE,
                                h: ENEMY_SIZE,
                                active: true
                            });
                        }
                    };

                    // WALL LOGIC (Corrected thresholds: 20 and 60)
                    const roll = Math.random();
                    spawnEnemyAt(); // Always spawn one

                    // Level 1: Double Spawn (Score > 20)
                    if (state.score > 20 && roll < 0.6) {
                        spawnEnemyAt(Math.random() * CANVAS_WIDTH);
                    }

                    // Level 2: Triple Spawn / Wall (Score > 60)
                    if (state.score > 60 && roll < 0.5) {
                        spawnEnemyAt(Math.random() * CANVAS_WIDTH);
                    }

                    state.lastEnemySpawn = now;
                }

                // 4. Update Physics
                // Bullets
                state.bullets.forEach(b => b.y -= 7);
                state.bullets = state.bullets.filter(b => b.y > -10 && b.active);

                // Enemies - Insane Speed Ramp (Points / 10)
                const enemySpeed = 2 + (state.score / 10);
                state.enemies.forEach(e => e.y += enemySpeed);

                // Collisions: Bullet vs Enemy
                state.bullets.forEach(b => {
                    if (!b.active) return;
                    state.enemies.forEach(e => {
                        if (!e.active) return;
                        if (rectIntersect(b, e)) {
                            b.active = false;
                            e.active = false;
                            state.score += 5; // Kill Score
                            setScore(state.score);
                        }
                    });
                });

                // Collisions: Enemy vs Player & Scoring
                state.enemies.forEach(e => {
                    if (!e.active) return;

                    // Simple Hitbox for Player
                    const pBox = {
                        x: state.playerX - SHIP_SIZE / 2 + 5, // Slightly smaller hitbox
                        y: state.playerY - SHIP_SIZE / 2 + 5,
                        w: SHIP_SIZE - 10,
                        h: SHIP_SIZE - 10
                    };

                    if (rectIntersect(e, pBox)) {
                        e.active = false;
                        state.lives -= 1;
                        setLives(state.lives);
                        state.shake = 15; // Trigger Shake

                        if (state.lives <= 0) {
                            setGameState('GAME_OVER');
                            if (state.score > highScore) setHighScore(state.score);
                        }
                    }

                    // PASSIVE SCORING (DODGE)
                    if (e.y > CANVAS_HEIGHT) {
                        e.active = false;
                        // Only award point if player is still alive
                        if (state.lives > 0) {
                            state.score += 1;
                            setScore(state.score);
                        }
                    }
                });

                state.enemies = state.enemies.filter(e => e.active);
            }

            // --- DRAW OBJECTS ---

            // PIP Camera (Visual Assist)
            if (videoRef.current) {
                const pipW = 120;
                const pipH = 90;
                const pipX = CANVAS_WIDTH - pipW - 10;
                const pipY = 10;

                ctx.save();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 1;
                ctx.strokeRect(pipX, pipY, pipW, pipH);
                ctx.beginPath();
                ctx.rect(pipX, pipY, pipW, pipH);
                ctx.clip();
                ctx.drawImage(videoRef.current, pipX, pipY, pipW, pipH);
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(pipX, pipY + pipH - 15, pipW, 15);
                ctx.fillStyle = "#fff";
                ctx.font = "8px monospace";
                ctx.fillText("VISUAL ASSIST", pipX + 5, pipY + pipH - 5);
                ctx.restore();
            }

            // Player Ship
            if (gesture === 'FIST' || gameState === 'IDLE' || gameState === 'GAME_OVER') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#06b6d4';
                ctx.fillStyle = gesture === 'FIST' ? '#06b6d4' : '#475569';

                const px = state.playerX;
                const py = state.playerY;

                ctx.beginPath();
                ctx.moveTo(px, py - SHIP_SIZE / 2);
                ctx.lineTo(px - SHIP_SIZE / 2, py + SHIP_SIZE / 2);
                ctx.lineTo(px + SHIP_SIZE / 2, py + SHIP_SIZE / 2);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Bullets
            ctx.fillStyle = '#f472b6';
            state.bullets.forEach(b => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Enemies
            ctx.fillStyle = '#ef4444';
            state.enemies.forEach(e => {
                ctx.fillRect(e.x, e.y, e.w, e.h);
                // Eyes
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(e.x + 5, e.y + 10, 5, 5);
                ctx.fillRect(e.x + 20, e.y + 10, 5, 5);
                ctx.fillStyle = '#ef4444';
            });

            // RESTORE CONTEXT (End Shake)
            ctx.restore();

            // Next Frame
            animId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [gameState, gesture, landmarks, highScore]);

    // Collision Helper
    const rectIntersect = (r1: any, r2: any) => {
        return !(r2.x > r1.x + r1.w ||
            r2.x + r2.w < r1.x ||
            r2.y > r1.y + r1.h ||
            r2.y + r2.h < r1.y);
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            {/* Header */}
            <div className="flex items-center justify-between text-purple-400 mb-2">
                <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    <span className="font-bold">ASTRO DEFENDER HARDCORE</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1 text-white font-bold">
                        <span>{score}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                        <Trophy className="w-3 h-3" /> {highScore}
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                        <Heart className="w-3 h-3" /> {lives}
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-950 rounded-xl border border-purple-500/30 relative overflow-hidden flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-full object-contain"
                />

                {/* Overlays */}
                {gameState === 'IDLE' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-10">
                        <h2 className="text-3xl font-black text-white mb-2 italic transform -skew-x-12">ASTRO DEFENDER</h2>
                        <p className="text-sm text-purple-300 mb-6 font-mono">PILOT: FIST | FIRE: PINCH</p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded uppercase tracking-widest border border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all hover:scale-110 active:scale-95"
                        >
                            START MISSION
                        </button>
                    </div>
                )}

                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-10">
                        <h2 className="text-4xl font-black text-white mb-1">MISSION FAILED</h2>
                        <div className="text-xl text-yellow-400 font-mono mb-6">SCORE: {score}</div>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-white text-red-900 font-black rounded uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            RETRY
                        </button>
                    </div>
                )}
            </div>

            {/* Controls Info */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-3 bg-slate-800 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-xs text-white">PILOT SHIP</div>
                        <div className="text-[10px] text-slate-400">MAKE A FIST</div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-cyan-500 bg-cyan-900/50 flex items-center justify-center">
                        <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
                    </div>
                </div>
                <div className="p-3 bg-slate-800 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-xs text-white">FIRE LASERS</div>
                        <div className="text-[10px] text-slate-400">PINCH</div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-pink-500 bg-pink-900/50 flex items-center justify-center">
                        <Target className="w-4 h-4 text-pink-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}
