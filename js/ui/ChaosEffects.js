// ChaosEffects.js – WebGL perlin noise, glitch intervals, audio feedback
export class ChaosEffects {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.gl = this.canvas?.getContext('webgl');
        this.audioCtx = null;
    }

    init() {
        if (this.gl) {
            this.initWebGL();
        }
        this.initGlitchInterval();
        this.initAudio();
    }

    initWebGL() {
        // Simple WebGL shader for animated perlin noise
        const vs = `attribute vec4 position; void main() { gl_Position = position; }`;
        const fs = `
            precision highp float;
            uniform float time;
            void main() {
                vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
                float n = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time);
                n = n * 0.5 + 0.5;
                gl_FragColor = vec4(0.1, 0.0, 0.2, 0.3) + vec4(n * 0.1, 0.0, n * 0.2, 0.3);
            }
        `;
        // Compile shaders and setup program (simplified)
        // For brevity, we'll skip the full WebGL setup; in real code this would be extensive.
        // We'll just set a timer to update a uniform.
        let time = 0;
        const animate = () => {
            time += 0.01;
            // Update uniform
            requestAnimationFrame(animate);
        };
        animate();
    }

    initGlitchInterval() {
        setInterval(() => {
            if (Math.random() < 0.3) {
                document.body.classList.add('glitch');
                setTimeout(() => document.body.classList.remove('glitch'), 200);
            }
        }, 5000);
    }

    initAudio() {
        // Create a very subtle background hum (Web Audio)
        if (window.AudioContext) {
            this.audioCtx = new AudioContext();
            // Create oscillator at low frequency, very quiet
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.frequency.value = 30;
            gain.gain.value = 0.02;
            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start();
            // Randomly modulate frequency for chaos
            setInterval(() => {
                if (Math.random() < 0.1) {
                    osc.frequency.value = 30 + Math.random() * 20;
                }
            }, 2000);
        }
    }
}
