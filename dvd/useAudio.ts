import { useCallback, useEffect } from 'react';

const audio: {
    music: HTMLAudioElement | null;
    win: HTMLAudioElement | null;
    isInitialized: boolean;
    hasInteracted: boolean;
    isMuted: boolean;
    initPromise: Promise<void> | null;
} = {
    music: null,
    win: null,
    isInitialized: false,
    hasInteracted: false,
    isMuted: false,
    initPromise: null,
};

const initializeAudio = () => {
    if (audio.isInitialized || typeof Audio === 'undefined') return;

    try {
        const music = new Audio('/tune.mp3');
        music.loop = true;
        music.addEventListener('error', (e: any) => {
            console.error('Music file loading error:', e.target?.error);
        });

        const win = new Audio('/win.mp3');
        win.addEventListener('error', (e: any) => {
            console.error('Win sound file loading error:', e.target?.error);
        });

        audio.music = music;
        audio.win = win;
        audio.music.muted = audio.isMuted;
        audio.win.muted = audio.isMuted;
        audio.isInitialized = true;
        
    } catch (e) {
        console.error("Failed to create audio elements:", e);
    }
};

export const audioControls = {
    playMusic: async () => {
        if (!audio.hasInteracted || audio.isMuted) return;
        if (audio.initPromise) await audio.initPromise;
        if (!audio.music) return console.error("Cannot play music, not initialized.");

        audio.win?.pause();
        const playPromise = audio.music.play();
        if (playPromise) playPromise.catch(e => e.name !== 'AbortError' && console.error("Music play failed:", e));
    },
    pauseMusic: () => {
        audio.music?.pause();
    },
    playWinSound: async () => {
        if (!audio.hasInteracted || audio.isMuted) return;
        if (audio.initPromise) await audio.initPromise;
        if (!audio.win) return console.error("Cannot play win sound, not initialized.");

        audio.music?.pause();
        audio.win.currentTime = 0;
        const playPromise = audio.win.play();
        if (playPromise) playPromise.catch(e => e.name !== 'AbortError' && console.error("Win sound play failed:", e));
    }
};

const useAudio = () => {
    useEffect(() => {
        const onFirstInteraction = () => {
            if (audio.hasInteracted) return;
            audio.hasInteracted = true;
            
            if ('serviceWorker' in navigator) {
                audio.initPromise = navigator.serviceWorker.ready.then(() => {
                    initializeAudio();
                }).catch(err => {
                    console.error("Service worker failed to ready, audio will not play.", err);
                });
            } else {
                // No service worker, just initialize directly. Might fail if files aren't available immediately.
                initializeAudio();
            }

            window.removeEventListener('pointerdown', onFirstInteraction, true);
            window.removeEventListener('keydown', onFirstInteraction, true);
        };

        window.addEventListener('pointerdown', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('keydown', onFirstInteraction, { once: true, capture: true });
        
        return () => {
            audio.music?.pause();
            audio.win?.pause();
            // Ensure listeners are cleaned up if component unmounts before interaction
            window.removeEventListener('pointerdown', onFirstInteraction, true);
            window.removeEventListener('keydown', onFirstInteraction, true);
        };
    }, []);

    const setMuted = useCallback((muted: boolean) => {
        audio.isMuted = muted;
        if (audio.music) audio.music.muted = muted;
        if (audio.win) audio.win.muted = muted;
        if (muted) {
            audioControls.pauseMusic();
            audio.win?.pause();
        }
    }, []);
    
    return { setMuted };
};

export default useAudio;
