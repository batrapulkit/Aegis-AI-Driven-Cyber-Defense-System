import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';
import { toast } from 'sonner';

// Define SpeechRecognition types as they might not be in the global scope
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export const VoiceControl = ({ onCommand }: { onCommand: (cmd: string) => void }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionApi = SpeechRecognition || webkitSpeechRecognition;

        if (SpeechRecognitionApi) {
            const recognition = new SpeechRecognitionApi();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
                toast.info("Aegis Listening...", { description: "Say 'Scan System', 'Show Threats', or 'Clear Console'" });
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const last = event.results.length - 1;
                const text = event.results[last][0].transcript;
                setTranscript(text);
                onCommand(text.toLowerCase());

                // Visual feedback
                toast.success(`Command Recognized: "${text}"`);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    toast.error("Microphone access denied");
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }
    }, [onCommand]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.start();
            } else {
                toast.error("Voice control not supported in this browser");
            }
        }
    };

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isListening ? 'scale-110' : 'scale-100'}`}>
            <button
                onClick={toggleListening}
                className={`relative group flex items-center justify-center w-16 h-16 rounded-full border-2 backdrop-blur-md transition-all duration-300 ${isListening
                        ? 'bg-neon-red/10 border-neon-red shadow-[0_0_30px_rgba(255,0,0,0.4)]'
                        : 'bg-background/80 border-primary/50 hover:border-primary shadow-lg'
                    }`}
            >
                {isListening ? (
                    <>
                        <div className="absolute inset-0 rounded-full border border-neon-red animate-ping opacity-20" />
                        <Activity className="w-8 h-8 text-neon-red animate-pulse" />
                    </>
                ) : (
                    <Mic className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                )}
            </button>

            {/* Transcript feedback */}
            {isListening && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-neon-red px-4 py-1 rounded-full text-xs font-mono border border-neon-red/30">
                    LISTENING...
                </div>
            )}
        </div>
    );
};
