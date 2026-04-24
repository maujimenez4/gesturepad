import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export function Layout({ children, className }: LayoutProps) {
    return (
        <div className={clsx("min-h-screen bg-slate-950 text-cyan-500 font-mono p-4 md:p-8", className)}>
            <header className="mb-6 flex items-center justify-between border-b border-cyan-900/50 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse-slow">
                        <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider text-white">GESTURE<span className="text-cyan-400">PAD</span></h1>
                        <p className="text-xs text-cyan-600/80 uppercase tracking-widest">Neural Interface System</p>
                    </div>
                </div>
                <div className="text-xs text-cyan-900 border border-cyan-900/30 px-2 py-1 rounded">
                    v1.0.0-ALPHA
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                {children}
            </main>
        </div>
    );
}
