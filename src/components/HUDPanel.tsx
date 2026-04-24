import React, { useEffect, useState } from 'react';
import { Activity, Radio, SkipForward, Play, Square, ThumbsUp, Hand, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';
import { GestureType } from '../utils/gestureDetection';
import { AppMode } from '../App';
import { DJMode } from '../modes/DJMode';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface HUDPanelProps {
    gesture: GestureType;
    confidence: number;
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    landmarks: NormalizedLandmark[] | null;
}

export function HUDPanel({ gesture, confidence, mode, setMode, landmarks }: HUDPanelProps) {
    const [history, setHistory] = useState<GestureType[]>([]);

    useEffect(() => {
        if (gesture !== 'NONE') {
            setHistory(prev => {
                const last = prev[0];
                if (last !== gesture) {
                    return [gesture, ...prev].slice(0, 8);
                }
                return prev;
            });
        }
    }, [gesture]);

    const renderModeComponent = () => {
        switch (mode) {
            case 'DJ': return <DJMode gesture={gesture} />;
            default: return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <p className="mb-2">Currently in Big Screen Mode</p>
                    <p className="text-xs">Look to the left for the Game!</p>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Control Center Header */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-900/30 backdrop-blur-sm flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    CONTROL CENTER
                </h2>
                <div className="flex gap-2">
                    <div className={`w-2 h-2 rounded-full ${landmarks ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] text-slate-400 tracking-wider">
                        {landmarks ? 'TRACKING' : 'SEARCHING'}
                    </span>
                </div>
            </div>

            {/* Main Status / Mode Content */}
            <div className="flex-1 p-6 rounded-xl bg-slate-900/80 border border-cyan-500/20 shadow-lg relative overflow-hidden flex flex-col gap-4">
                {/* Top: Gesture Info */}
                <div className="relative z-10 grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                    <div>
                        <span className="text-xs font-mono text-cyan-600 uppercase tracking-widest block mb-1">Gesture</span>
                        <div className="text-2xl font-black text-white tracking-tight break-words truncate">
                            {gesture}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-cyan-500 mb-1">
                            <span>CONFIDENCE</span>
                            <span>{Math.round(confidence * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${confidence * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Middle: Mode Specific Content */}
                <div className="flex-1 relative z-10">
                    {renderModeComponent()}
                </div>

                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50 pointer-events-none" />
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
                {(['DJ', 'GAME'] as AppMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={clsx(
                            "p-3 rounded-lg border text-xs font-bold transition-all",
                            mode === m
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                        )}
                    >
                        {m} MODE
                    </button>
                ))}
            </div>

            {/* History Chips */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-900/30">
                <span className="text-xs text-cyan-700 uppercase block mb-3">Recent Gestures</span>
                <div className="flex flex-wrap gap-2 min-h-[30px]">
                    {history.length === 0 && <span className="text-xs text-slate-600">No gestures detected yet...</span>}
                    {history.map((g, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 animate-slide-in-right">
                            {g}
                        </span>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors text-xs"
                    onClick={() => window.location.reload()}
                >
                    RESTART SYSTEM
                </button>
                <button className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors border border-slate-700 text-xs">
                    CALIBRATE
                </button>
            </div>
        </div>
    );
}
