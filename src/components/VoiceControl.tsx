import { useState, useRef } from 'react';
import { Mic, Activity } from 'lucide-react';
import { toast } from 'sonner';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { supabase } from "@/integrations/supabase/client";

export const VoiceControl = ({ onCommand }: { onCommand: (cmd: string) => void }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognizerRef = useRef<speechsdk.SpeechRecognizer | null>(null);

    const startListening = async () => {
        if (isListening) return;

        try {
            setIsListening(true);
            setTranscript('');
            toast.info("Aegis Listening...", { description: "Say 'Scan System', 'Show Threats', 'Map', or 'Abort'" });

            // Fetch token from Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('speech-token');

            if (error || !data) {
                console.error('Token fetch error:', error);
                toast.error("Failed to initialize voice service.");
                setIsListening(false);
                return;
            }

            const { token, region } = data;
            const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = 'en-US';

            const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

            recognizerRef.current = recognizer;

            recognizer.recognizeOnceAsync(
                (result) => {
                    if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                        const text = result.text;
                        setTranscript(text);
                        const lowerText = text.toLowerCase();

                        // Command Mapping
                        if (lowerText.includes("scan") || lowerText.includes("analyze")) {
                            onCommand("scan");
                        } else if (lowerText.includes("map") || lowerText.includes("global")) {
                            onCommand("map");
                        } else if (lowerText.includes("abort") || lowerText.includes("stop")) {
                            onCommand("stop");
                        } else {
                            // Pass through other recognized text if needed, or just notify
                            onCommand(lowerText);
                        }

                        toast.success(`Recognized: "${text}"`);
                    } else if (result.reason === speechsdk.ResultReason.NoMatch) {
                        toast.info("No speech recognized.");
                    }

                    setIsListening(false);
                    recognizer.close();
                    recognizerRef.current = null;
                },
                (err) => {
                    console.error("Speech recognition error:", err);
                    toast.error("Error recognizing speech.");
                    setIsListening(false);
                    recognizer.close();
                    recognizerRef.current = null;
                }
            );

        } catch (e) {
            console.error("Voice control error:", e);
            toast.error("Failed to start voice control.");
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

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isListening ? 'scale-110' : 'scale-100'}`}>
            <button
                onMouseDown={startListening}
                onMouseUp={() => { /* Optional: Push-to-Talk generic behavior usually stops on release, but recognizedOnceAsync handles one valid utterance. We can keep it simple or implement hold-to-talk. The prompt asked for "Push-to-Talk" and "recognizeOnceAsync", which implies click-to-listen-once usually, or hold. I will use click (onClick) for listen-once to avoid complexity with async start. cancel onMouseUp/Down for now and just use onClick for clarity unless user specified HOLD. User said "When clicked, listen once". So onClick is the way. */ }}
                onClick={isListening ? stopListening : startListening}
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
