import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

export const StartupSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [steps, setSteps] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const bootSteps = [
        "Initializing Core Systems...",
        "Loading Neural Network Models...",
        "Connecting to Global Threat Database...",
        "Calibrating Sensors...",
        "Establishing Secure Link...",
        "AEGIS PROTOCOL: ACTIVE"
    ];

    useEffect(() => {
        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep < bootSteps.length) {
                setSteps(prev => [...prev, bootSteps[currentStep]]);
                setProgress(((currentStep + 1) / bootSteps.length) * 100);
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 800); // Wait a bit before clearing
            }
        }, 600);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#050a14] flex flex-col items-center justify-center font-mono">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

            <div className="w-full max-w-lg p-8 relative z-10">
                <div className="flex items-center justify-center mb-12">
                    <div className="relative">
                        <Shield className="w-16 h-16 text-neon-green animate-pulse" />
                        <div className="absolute inset-0 border-4 border-neon-green/30 rounded-full animate-ping" />
                    </div>
                </div>

                <div className="space-y-3 mb-8 min-h-[200px]">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 text-neon-green/80 animate-slide-right">
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-sm tracking-widest uppercase">{step}</span>
                            {index < steps.length - 1 && <CheckCircle2 className="w-4 h-4 text-neon-green ml-auto" />}
                            {index === steps.length - 1 && <span className="w-2 h-4 bg-neon-green ml-auto animate-blink" />}
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-neon-green/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-neon-green transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-4 flex justify-between text-xs text-muted-foreground uppercase">
                    <span>Boot Sequence</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
        </div>
    );
};
