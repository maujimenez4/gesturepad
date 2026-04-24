import React, { useEffect, useState, useRef } from 'react';
import { Music, Play, Pause, SkipForward, ThumbsUp } from 'lucide-react';
import { GestureType } from '../utils/gestureDetection';

interface DJModeProps {
    gesture: GestureType;
}

// -----------------------------------------------------------------------------
// AUDIO FILES CONFIGURATION
// -----------------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Put your .mp3 files in the 'public/music' folder of your project.
// 2. Update the 'url' fields below to match your filenames (e.g., '/music/my-song.mp3').
const PLAYLIST = [
    { title: 'I Just Might', artist: 'Bruno Mars', duration: '3:30', url: '/music/Bruno Mars - I Just Might (Video Oficial)  Sub. Español  Lyrics.mp3' },
    { title: 'Manchild', artist: 'Sabrina Carpenter', duration: '3:33', url: '/music/Sabrina Carpenter - Manchild (Español  Lyrics)  video musical.mp3' },
    { title: 'Golden', artist: 'Huntrix', duration: '3:18', url: '/music/Golden Official Lyric Video  KPop Demon Hunters  Sony Animation.mp3' },
    { title: 'Whats going on', artist: '4 Blonde Girls', duration: '0:54', url: '/music/whats going on.mp3' }, // Fallback example
    { title: 'Love me not', artist: 'Ravyn Lenae', duration: '3:33', url: '/music/Ravyn Lenae - Love Me Not (Lyrics).mp3' }, // Fallback example

];

export function DJMode({ gesture }: DJModeProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bars, setBars] = useState<number[]>(Array(16).fill(10));
    const [liked, setLiked] = useState<number[]>([]);
    const [showLikeEffect, setShowLikeEffect] = useState(false);
    const [audioBlocked, setAudioBlocked] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastGestureRef = useRef<number>(0);
    const activeSourceRef = useRef<string | null>(null); // Track loaded URL exactly as provided

    // 1. Initialize Audio Helper
    const playTrack = async () => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.loop = false;
            // Event Listeners
            audioRef.current.addEventListener('timeupdate', () => setCurrentTime(audioRef.current?.currentTime || 0));
            audioRef.current.addEventListener('durationchange', () => setDuration(audioRef.current?.duration || 0));
            audioRef.current.addEventListener('ended', nextTrack);
        }

        const audio = audioRef.current;
        const targetUrl = PLAYLIST[trackIndex].url;

        try {
            // FIX: Compare against our internal ref, not the browser's encoded active.src
            if (activeSourceRef.current !== targetUrl) {
                audio.src = targetUrl;
                activeSourceRef.current = targetUrl;
            }
            await audio.play();
            setIsPlaying(true);
            setAudioBlocked(false);
        } catch (e) {
            console.error("Playback Failed (likely autoplay blocked):", e);
            setAudioBlocked(true); // Show manual start button if blocked
        }
    };

    const nextTrack = () => {
        setTrackIndex(prev => (prev + 1) % PLAYLIST.length);
    };

    // 2. Sync Audio Effect (Track Change)
    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const targetUrl = PLAYLIST[trackIndex].url;

        // Only change source if the track index actually changed the URL
        if (activeSourceRef.current !== targetUrl) {
            audio.src = targetUrl;
            activeSourceRef.current = targetUrl;
            if (isPlaying) audio.play().catch(console.error);
        }
    }, [trackIndex]);

    // 3. Gesture Control Logic
    useEffect(() => {
        const now = Date.now();

        // Play: OPEN_PALM
        if (gesture === 'OPEN_PALM') {
            // If local state says not playing, try to play
            if (!isPlaying) {
                playTrack();
            }
            // Double check: if local state says playing but audio is paused (desync), force play
            else if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => setAudioBlocked(true));
            }
        }

        // Pause: FIST
        if (gesture === 'FIST') {
            if (isPlaying) {
                setIsPlaying(false);
                if (audioRef.current) audioRef.current.pause();
            }
        }

        // Cooldown actions
        if (now - lastGestureRef.current > 1500) {
            // Next Track: PEACE
            if (gesture === 'PEACE') {
                lastGestureRef.current = now;
                nextTrack();
            }
            // Like: THUMBS_UP
            if (gesture === 'THUMBS_UP') {
                lastGestureRef.current = now;
                setLiked(prev => prev.includes(trackIndex) ? prev : [...prev, trackIndex]);
                setShowLikeEffect(true);
                setTimeout(() => setShowLikeEffect(false), 2000);
            }
        }
    }, [gesture, isPlaying, trackIndex]);

    // 4. Visualizer Animation
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.max(10, Math.random() * 100)));
        }, 100);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const currentTrack = PLAYLIST[trackIndex];

    return (
        <div className="flex flex-col gap-4 h-full relative overflow-hidden">
            {/* Audio Blocked Overlay */}
            {audioBlocked && (
                <div
                    className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => { playTrack(); }}
                >
                    <div className="p-4 bg-cyan-900/50 rounded-full animate-pulse border border-cyan-400">
                        <Play className="w-12 h-12 text-cyan-400" />
                    </div>
                    <p className="mt-4 text-cyan-300 font-bold">CLICK TO ENABLE AUDIO ENGINE</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between text-cyan-400 mb-2 z-10">
                <div className="flex items-center gap-2">
                    <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
                    <span className="font-bold tracking-wider">NEON DJ DECK</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-slate-400">TRACK {trackIndex + 1}/{PLAYLIST.length}</span>
                </div>
            </div>

            {/* Visualizer & Track Info */}
            <div className="relative flex-1 bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden flex flex-col justify-end group">
                {/* Background Art */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-cyan-900/20 opacity-60" />

                {/* Like Effect */}
                {showLikeEffect && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 animate-ping">
                        <ThumbsUp className="w-32 h-32 text-cyan-400 opacity-50" />
                    </div>
                )}

                {/* Bars */}
                <div className="absolute bottom-20 left-0 right-0 h-32 flex items-end justify-between px-4 gap-1 opacity-80">
                    {bars.map((h, i) => (
                        <div
                            key={i}
                            className="w-full bg-cyan-400 rounded-t shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-75"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>

                {/* Track Details */}
                <div className="relative z-20 p-4 bg-black/40 backdrop-blur-sm border-t border-white/5">
                    <h3 className="text-lg font-black text-white truncate">{currentTrack.title}</h3>
                    <p className="text-xs text-cyan-300 uppercase tracking-widest">{currentTrack.artist}</p>

                    {/* Progress Bar */}
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-400 relative"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow" />
                            </div>
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Controls Guide */}
            <div className="grid grid-cols-4 gap-2 mt-2">
                <ControlCard
                    icon={<Play className={isPlaying ? "text-cyan-400" : "text-slate-400"} />}
                    label="PLAY"
                    gesture="PALM"
                    active={isPlaying}
                />
                <ControlCard
                    icon={<Pause className={!isPlaying ? "text-red-400" : "text-slate-400"} />}
                    label="PAUSE"
                    gesture="FIST"
                    active={!isPlaying}
                />
                <ControlCard
                    icon={<SkipForward className="text-purple-400" />}
                    label="NEXT"
                    gesture="PEACE"
                    active={false}
                />
                <ControlCard
                    icon={<ThumbsUp className="text-pink-400" />}
                    label="LIKE"
                    gesture="THUMB"
                    active={showLikeEffect}
                />
            </div>
        </div>
    );
}

function ControlCard({ icon, label, gesture, active }: { icon: React.ReactNode, label: string, gesture: string, active: boolean }) {
    return (
        <div className={`p-2 rounded bg-slate-800 border ${active ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700'} flex flex-col items-center justify-center text-center transition-all`}>
            <div className="scale-75 mb-1">{icon}</div>
            <div className="text-[10px] font-bold text-white leading-none mb-1">{label}</div>
            <div className="text-[8px] text-slate-500 uppercase">{gesture}</div>
        </div>
    );
}

function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
