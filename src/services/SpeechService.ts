
import { supabase } from "@/integrations/supabase/client";
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

interface TokenResponse {
    token: string;
    region: string;
    error?: string;
}

export class SpeechService {
    private static instance: SpeechService;
    private recognizer: speechsdk.SpeechRecognizer | null = null;
    private token: string | null = null;
    private region: string | null = null;
    private tokenExpiration: number = 0;

    private constructor() { }

    public static getInstance(): SpeechService {
        if (!SpeechService.instance) {
            SpeechService.instance = new SpeechService();
        }
        return SpeechService.instance;
    }

    private async fetchToken(): Promise<void> {
        // Refresh token if expired or not exists (tokens usually last 10 mins, refresh earlier)
        if (this.token && Date.now() < this.tokenExpiration) {
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('speech-token');

            if (error) {
                console.error("Supabase Edge Function Error:", error);
                throw new Error("Failed to invoke speech-token function");
            }

            if (!data || !data.token || !data.region) {
                console.error("Invalid token response:", data);
                throw new Error("Invalid token response from service");
            }

            this.token = data.token;
            this.region = data.region;
            // Set expiration to 9 minutes from now to be safe
            this.tokenExpiration = Date.now() + 9 * 60 * 1000;
        } catch (error) {
            console.error("Error fetching speech token:", error);
            throw error;
        }
    }

    public async createRecognizer(): Promise<speechsdk.SpeechRecognizer> {
        await this.fetchToken();

        if (!this.token || !this.region) {
            throw new Error("Speech service not initialized successfully.");
        }

        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(this.token, this.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        this.recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        return this.recognizer;
    }

    public async closeRecognizer(): Promise<void> {
        if (this.recognizer) {
            this.recognizer.close();
            this.recognizer = null;
        }
    }
}
