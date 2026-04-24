import React, { useRef, useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CameraView } from './components/CameraView';
import { HUDPanel } from './components/HUDPanel';
import { useHandTracking } from './hooks/useHandTracking';
import { GameMode } from './modes/GameMode';

export type AppMode = 'DJ' | 'GAME';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { landmarks, gesture, confidence, isModelLoading, error } = useHandTracking(videoRef);
  const [mode, setMode] = useState<AppMode>('DJ');

  // Logic to switch modes with gestures?
  // User req: "Peace (V) => acción NEXT MODE"
  // We need a way to trigger this only once per gesture instance.

  const [lastTrigger, setLastTrigger] = useState<number>(0);

  // Debug logs removed as per V2 requirements

  // Debug logs removed as per V2 requirements

  return (
    <Layout>
      <div className="col-span-1 lg:col-span-8 relative h-full min-h-[500px] flex flex-col">
        {error && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-red-500/90 text-white p-3 text-center text-sm font-bold shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 animate-slide-down">
            <span className="bg-white/20 p-1 rounded-full">⚠</span>
            {error} - Press 1-6 to simulate gestures
          </div>
        )}

        <CameraView
          videoRef={videoRef}
          landmarks={landmarks}
          gesture={gesture}
          mode={mode}
        />

        {/* V3: Game Mode Overridden for Big Screen */}
        {mode === 'GAME' && (
          <div className="absolute inset-0 z-40 bg-slate-950">
            <GameMode gesture={gesture} landmarks={landmarks} videoRef={videoRef} />
          </div>
        )}
      </div>
      <div className="col-span-1 lg:col-span-4 h-full min-h-[500px]">
        <HUDPanel
          gesture={gesture}
          confidence={confidence}
          mode={mode}
          setMode={setMode}
          landmarks={landmarks}
        />
      </div>
    </Layout>
  );
}

export default App;
