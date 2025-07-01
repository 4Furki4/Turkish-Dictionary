// src/hooks/use-audio-recorder.ts
import { useState, useRef } from "react";

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        // Ask for microphone permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mpeg" });
                setAudioBlob(audioBlob);
                // Stop all tracks on the stream to turn off the microphone indicator
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);
        } catch (err) {
            console.error("Error starting recording:", err);
            // You should probably show a user-friendly error message here
            // e.g., if the user denies microphone permission.
            alert("Microphone access was denied. Please allow microphone access in your browser settings.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setIsRecording(false);
        audioChunksRef.current = [];
    };

    return { isRecording, audioBlob, startRecording, stopRecording, resetRecording };
};
