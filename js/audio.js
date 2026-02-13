class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
        this.isPlaying = false;
        this.tempo = 100; // BPM
        this.noteLength = 0.5; // seconds
        this.melodyTimeout = null;
        
        // Pachelbel's Canon in D (simplified to C major for code clarity)
        // Melody notes
        this.melody = [
            ['E5', 1], ['D5', 1], ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['A4', 1], ['B4', 1], // Phrase 1
            ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['F4', 1], ['G4', 1]  // Phrase 2
        ];
        
        this.currentNoteIndex = 0;
        
        // Frequencies for notes
        this.frequencies = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    tryAutoStart() {
        // Try to start if we have interaction
        this.init();
        if (localStorage.getItem('musicEnabled') === 'true') {
            this.startMusic();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx || this.isMuted) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Sound Effects
    playClick() {
        this.init();
        // High pitch "ding"
        this.playTone(800, 'sine', 0.1, 0.05);
    }

    playPop() {
        this.init();
        // Short pop
        this.playTone(600, 'triangle', 0.05, 0.05);
    }

    playYay() {
        this.init();
        // Major Arpeggio
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.3, 0.1), i * 100);
        });
    }

    playNo() {
        this.init();
        // Low buzz
        this.playTone(150, 'sawtooth', 0.2, 0.05);
    }

    playSad() {
        this.init();
        // Descending slide
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }

    // Background Music
    startMusic() {
        if (this.isPlaying || this.isMuted) return;
        this.init();
        this.isPlaying = true;
        localStorage.setItem('musicEnabled', 'true');
        this.playNextNote();
    }

    stopMusic() {
        this.isPlaying = false;
        localStorage.setItem('musicEnabled', 'false');
        clearTimeout(this.melodyTimeout);
    }

    playNextNote() {
        if (!this.isPlaying) return;

        const note = this.melody[this.currentNoteIndex];
        const freq = this.frequencies[note[0]];
        const duration = note[1] * 0.5; // Scale duration

        this.playTone(freq, 'triangle', duration, 0.03); // Softer volume for BGM

        this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;
        
        // Schedule next note
        this.melodyTimeout = setTimeout(() => {
            this.playNextNote();
        }, duration * 1000);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.isMuted;
    }
}

// Global instance
window.audioManager = new AudioManager();

// Auto-resume on any click if allowed
document.addEventListener('click', () => {
    window.audioManager.init();
    if (localStorage.getItem('musicEnabled') === 'true' && !window.audioManager.isPlaying) {
        window.audioManager.startMusic();
    }
}, { once: true });

