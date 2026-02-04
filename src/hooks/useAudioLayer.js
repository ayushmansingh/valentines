import { useState, useEffect, useRef, useCallback } from "react";
import { useMusic } from "./useMusic";
import { useCities } from "./useCities";

/**
 * Advanced Audio Layer Hook (HTML5 Audio Version)
 * Uses standard Audio objects to bypass Web Audio API CORS strictness.
 * Implements smooth crossfading via manual volume manipulation.
 */
export function useAudioLayer(activeChapterId) {
    const { library } = useMusic();
    const { cities } = useCities();

    // Audio Objects (Decks)
    const deckARef = useRef(new Audio());
    const deckBRef = useRef(new Audio());
    const activeDeckRef = useRef("A"); // 'A' or 'B' tracks which deck is CURRENTLY playing/fading in

    // Interval Ref for crossfading
    const fadeIntervalRef = useRef(null);

    // State
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const currentGroupIdRef = useRef(null);

    // Initialize (User Interaction)
    const initAudio = useCallback(() => {
        setIsReady(true);
        // Optional: Play silence to unlock audio on iOS/Safari if needed, 
        // but simple state change allowing next play() is usually enough after click.
        console.log("Audio Engine Initialized (HTML5 Mode) 🎵");
    }, []);

    // Toggle Mute
    const toggleMute = useCallback(() => {
        const newMute = !isMuted;
        setIsMuted(newMute);

        // Apply immediately to both decks
        deckARef.current.muted = newMute;
        deckBRef.current.muted = newMute;
    }, [isMuted]);

    // Crossfade Logic
    const loadAndCrossfade = useCallback(async (track) => {
        if (!track) return;

        // Prevent reloading the same track if already playing
        if (currentTrack && currentTrack.id === track.id) return;

        console.log(`▶️ Loading track: ${track.title}`);

        // Identify decks
        const nextDeckChar = activeDeckRef.current === "A" ? "B" : "A";
        const currentDeck = activeDeckRef.current === "A" ? deckARef.current : deckBRef.current;
        const nextDeck = activeDeckRef.current === "A" ? deckBRef.current : deckARef.current;

        // Setup Next Deck
        nextDeck.src = track.url;
        nextDeck.volume = 0;
        nextDeck.muted = isMuted;

        try {
            await nextDeck.play();
        } catch (err) {
            console.error("Playback failed:", err);
            return;
        }

        // Start Crossfade Loop
        const FADE_TIME = 1500; // ms
        const STEPS = 30;
        const INTERVAL = FADE_TIME / STEPS;
        const volStep = 1 / STEPS;

        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

        let step = 0;
        fadeIntervalRef.current = setInterval(() => {
            step++;

            // Ramp Up Next
            const newNextVol = Math.min(1, step * volStep);
            nextDeck.volume = newNextVol;

            // Ramp Down Current
            const newCurrentVol = Math.max(0, 1 - (step * volStep));
            currentDeck.volume = newCurrentVol;

            if (step >= STEPS) {
                // Done
                clearInterval(fadeIntervalRef.current);
                currentDeck.pause();
                currentDeck.currentTime = 0; // Reset
                activeDeckRef.current = nextDeckChar;
            }
        }, INTERVAL);

        setCurrentTrack(track);
    }, [isMuted, currentTrack]);

    const fadeOut = useCallback(() => {
        const currentDeck = activeDeckRef.current === "A" ? deckARef.current : deckBRef.current;

        // Simple fade out
        let vol = currentDeck.volume;
        const interval = setInterval(() => {
            vol -= 0.05;
            if (vol <= 0) {
                vol = 0;
                currentDeck.pause();
                clearInterval(interval);
                setCurrentTrack(null);
            }
            currentDeck.volume = vol;
        }, 50);

    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            deckARef.current.pause();
            deckBRef.current.pause();
        };
    }, []);


    // React to Chapter Change
    useEffect(() => {
        if (!isReady || !cities.length || !library.length) return;

        const currentCity = cities.find(c => c.id === activeChapterId);
        const groupId = currentCity ? currentCity.musicGroupId : null;

        console.log(`🎧 Audio Check | Chapter: ${activeChapterId} | Group: ${groupId || 'None'}`);

        if (groupId !== currentGroupIdRef.current) {
            currentGroupIdRef.current = groupId;

            if (groupId) {
                const groupTracks = library.filter(t => t.musicGroupId === groupId);
                if (groupTracks.length > 0) {
                    const randomTrack = groupTracks[Math.floor(Math.random() * groupTracks.length)];
                    loadAndCrossfade(randomTrack);
                } else {
                    console.log(`⚠️ Group Empty. Fading out.`);
                    fadeOut();
                }
            } else {
                console.log(`Silence. Fading out.`);
                fadeOut();
            }
        }
    }, [activeChapterId, isReady, cities, library, loadAndCrossfade, fadeOut]);

    return {
        initAudio,
        isReady,
        isMuted,
        toggleMute,
        currentTrack
    };
}
