
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity, X } from 'lucide-react';
import { SpeechService } from '@/services/SpeechService';
import { toast } from 'sonner';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

interface VoiceWidgetProps {
    onCommandDetected?: (text: string) => void;
}

export const VoiceWidget = ({ onCommandDetected }: VoiceWidgetProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognizerRef = useRef<speechsdk.SpeechRecognizer | null>(null);

    const startListening = async () => {
        try {
            setError(null);
            setIsListening(true);
            setTranscript("Initializing...");

            const recognizer = await SpeechService.getInstance().createRecognizer();
            recognizerRef.current = recognizer;

            setTranscript("Listening...");

            recognizer.recognizeOnceAsync(
                (result) => {
                    if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                        setTranscript(result.text);
                        console.log("Details: ", result); // Log full details as requested
                        console.log("Recognized Text: ", result.text);
                        toast.success(`Recognized: "${result.text}"`);

                        if (onCommandDetected) {
                            onCommandDetected(result.text);
                        }
                    } else if (result.reason === speechsdk.ResultReason.NoMatch) {
                        setTranscript("No speech detected.");
                        toast.info("No speech detected.");
                    } else if (result.reason === speechsdk.ResultReason.Canceled) {
                        const cancellation = speechsdk.CancellationDetails.fromResult(result);
                        setTranscript("Cancelled.");
                        console.error("Speech Canceled: ", cancellation.errorDetails);
                        if (cancellation.reason === speechsdk.CancellationReason.Error) {
                            setError("Connection error. Check console.");
                        }
                    }

                    // Auto-stop after one recognition (Jarvis style command)
                    stopListening();
                },
                (err) => {
                    console.error("Recognition Error: ", err);
                    setError("Recognition failed.");
                    stopListening();
                }
            );

        } catch (err) {
            console.error("Failed to start speech service:", err);
            setError("Failed to start voice service.");
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognizerRef.current) {
            recognizerRef.current.close();
            recognizerRef.current = null;
        }
        setIsListening(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">

            {/* Transcript / Status Bubble */}
            <AnimatePresence>
                {(isListening || transcript) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="mb-2 bg-black/80 backdrop-blur-md border border-neon-cyan/30 text-neon-cyan px-4 py-2 rounded-lg text-sm font-mono shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    >
                        {error ? <span className="text-neon-red">{error}</span> : transcript}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Orb Button */}
            <motion.button
                onClick={toggleListening}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative flex items-center justify-center w-16 h-16 rounded-full 
                    border-2 backdrop-blur-xl transition-all duration-300 outline-none
                    ${isListening
                        ? 'border-neon-red bg-neon-red/10 shadow-[0_0_30px_rgba(255,0,50,0.6)]'
                        : 'border-neon-cyan/50 bg-black/40 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:border-neon-cyan hover:bg-neon-cyan/10'
                    }
                `}
            >
                {isListening ? (
                    <motion.div
                        className="relative w-full h-full flex items-center justify-center"
                        animate={{ opacity: 1 }}
                    >
                        {/* Animated Waveform Visualizer */}
                        <div className="absolute inset-0 flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-neon-red rounded-full"
                                    animate={{
                                        height: [10, 25 + Math.random() * 15, 10],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{
                                        duration: 0.5 + Math.random() * 0.3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.1
                                    }}
                                />
                            ))}
                        </div>
                        {/* Ping Ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full border border-neon-red"
                            animate={{ scale: [1, 2], opacity: [1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                    >
                        <Mic className="w-6 h-6 text-neon-cyan" />
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
};
