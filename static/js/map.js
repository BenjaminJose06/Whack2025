// Map.js - Canvas-based interactive map
document.addEventListener('DOMContentLoaded', () => {
    // Keep cloud and particle ambience
    initAmbient();
    // Initialize canvas map
    initCanvasMap();
});

function initAmbient() {
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach((cloud, index) => {
        cloud.style.animationDelay = (index * 5) + 's';
        cloud.style.animationDuration = (25 + index * 5) + 's';
    });
    createParticleSystem();
}

function initCanvasMap() {
    const canvas = document.getElementById('world-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    // Landmark positions roughly matching the provided image layout
    const landmarks = [
        { key: 'games',   label: 'ARCADE',   type: 'arcade',  pos: { x: 0.22, y: 0.25 } },
        { key: 'learn',   label: 'LIBRARY',  type: 'library', pos: { x: 0.78, y: 0.25 } },
        { key: 'advisor', label: 'ADVISOR',  type: 'bank',    pos: { x: 0.76, y: 0.78 } },
    ];
    const state = { hoverIndex: -1 };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

        // Background is now provided by the static image generated via pygame.
        function drawBackground() {}

    function drawTrees(w, h) {
        const trees = [
            [0.15, 0.55], [0.30, 0.65], [0.60, 0.62], [0.85, 0.60],
            [0.25, 0.85], [0.50, 0.85], [0.70, 0.72], [0.40, 0.50],
        ];
        trees.forEach(([tx, ty]) => {
            const x = w * tx, y = h * ty;
            ctx.fillStyle = '#2e7d32';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1b5e20';
            ctx.fillRect(x - 2, y + 8, 4, 10);
        });
    }

    function drawLandmark(lm, index) {
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        const cx = w * lm.pos.x;
        const cy = h * lm.pos.y;
        const scale = Math.max(0.7, Math.min(w, h) / 900);
        const isHover = index === state.hoverIndex;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(isHover ? 1.05 : 1, isHover ? 1.05 : 1);
        if (lm.type === 'arcade') drawArcade(ctx, scale);
        if (lm.type === 'library') drawLibrary(ctx, scale);
        if (lm.type === 'bank') drawBank(ctx, scale);
        // Label below
        ctx.font = `700 ${Math.floor(16 * (1 + scale))}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(lm.label, 0, 80 * scale);
        ctx.restore();
    }

    function drawRoads() {
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        const TL = { x: w * 0.22, y: h * 0.34 };
        const TR = { x: w * 0.78, y: h * 0.34 };
        const BR = { x: w * 0.75, y: h * 0.78 };
        const BL = { x: w * 0.22, y: h * 0.78 };
        const C  = { x: w * 0.5,  y: h * 0.55 };
        const pathColor = '#d6a55e';
        const edgeColor = '#b3884b';
        const pathWidth = Math.max(18, Math.min(w, h) * 0.06);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        function strokePath(points) {
            // Edge (darker) underlay
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = pathWidth + 6;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();
            // Main path
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = pathWidth;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();
        }

        // Square roads
        strokePath([TL, TR]);
        strokePath([TR, BR]);
        strokePath([BR, BL]);
        strokePath([BL, TL]);
        // X roads
        strokePath([TL, C]);
        strokePath([TR, C]);
        strokePath([BR, C]);
        strokePath([BL, C]);
    }

        function draw() {
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, w, h);
            // Overlay only: optionally draw translucent hit areas or labels if desired
            landmarks.forEach((lm, i) => drawHitDebug(lm, i));
    }

        function drawHitDebug(lm, index) {
            // Optional: show faint rectangles on hover for clarity
            if (index !== state.hoverIndex) return;
            const rect = canvas.getBoundingClientRect();
            const w = rect.width; const h = rect.height;
            const cx = w * lm.pos.x; const cy = h * lm.pos.y;
            const bw = Math.min(w, h) * 0.14; const bh = Math.min(w, h) * 0.14;
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(cx - bw/2, cy - bh/2, bw, bh);
            ctx.restore();
        }

    function hitTest(x, y) {
        const rect = canvas.getBoundingClientRect();
        const px = (x - rect.left);
        const py = (y - rect.top);
        const w = rect.width;
        const h = rect.height;
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const cx = w * lm.pos.x;
            const cy = h * lm.pos.y;
            const bw = Math.min(w, h) * 0.14;
            const bh = Math.min(w, h) * 0.14;
            if (px >= cx - bw/2 && px <= cx + bw/2 && py >= cy - bh/2 && py <= cy + bh/2) return i;
        }
        return -1;
    }

        canvas.addEventListener('mousemove', (e) => {
        const i = hitTest(e.clientX, e.clientY);
        if (i !== state.hoverIndex) {
            state.hoverIndex = i;
            canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
            draw();
        }
    });

    canvas.addEventListener('click', (e) => {
        const i = hitTest(e.clientX, e.clientY);
        if (i >= 0) {
            const key = landmarks[i].key;
            const routes = (window.MAP_ROUTES || {});
            const href = routes[key];
            if (href) window.location.href = href;
        }
    });

    window.addEventListener('resize', resize);
    resize();
}

    // --- Simple building drawings ---
    function drawArcade(ctx, s) {
        const w = 120 * s, h = 90 * s;
        // Base
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(-w/2, -h/2, w, h);
        // Door
        ctx.fillStyle = '#3e2723'; ctx.fillRect(-12*s, -5*s, 24*s, 30*s);
        // Roof
        ctx.fillStyle = '#d32f2f'; ctx.beginPath();
        ctx.moveTo(-w/2 - 6*s, -h/2);
        ctx.lineTo(0, -h/2 - 28*s);
        ctx.lineTo(w/2 + 6*s, -h/2);
        ctx.closePath(); ctx.fill();
        // Sign
        ctx.fillStyle = '#ffeb3b';
        ctx.font = `700 ${Math.floor(16*s)}px Arial`;
        ctx.textAlign = 'center'; ctx.fillText('ARCADE', 0, -h/2 + 22*s);
    }

    function drawLibrary(ctx, s) {
        const w = 140 * s, h = 95 * s;
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(-w/2, -h/2, w, h);
        // Door
        ctx.fillStyle = '#5d4037'; ctx.fillRect(-14*s, -5*s, 28*s, 30*s);
        // Roof
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(-w/2, -h/2 - 18*s, w, 18*s);
        // Sign
        ctx.fillStyle = '#ffe082';
        ctx.font = `700 ${Math.floor(16*s)}px Arial`;
        ctx.textAlign = 'center'; ctx.fillText('LIBRARY', 0, -h/2 + 20*s);
    }

    function drawBank(ctx, s) {
        const w = 130 * s, h = 95 * s;
        // Base
        ctx.fillStyle = '#b0bec5'; ctx.fillRect(-w/2, -h/2, w, h);
        // Columns
        ctx.fillStyle = '#eceff1';
        const colW = 12*s, gap = 10*s;
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i*(colW+gap) - colW/2, -h/2 + 10*s, colW, h - 20*s);
        }
        // Roof
        ctx.fillStyle = '#795548'; ctx.beginPath();
        ctx.moveTo(-w/2 - 6*s, -h/2);
        ctx.lineTo(0, -h/2 - 24*s);
        ctx.lineTo(w/2 + 6*s, -h/2);
        ctx.closePath(); ctx.fill();
        // Dollar sign
        ctx.fillStyle = '#ffca28';
        ctx.font = `700 ${Math.floor(28*s)}px Arial`;
        ctx.textAlign = 'center'; ctx.fillText('$', 0, -5*s);
    }

function createParticleSystem() {
    const container = document.querySelector('.map-container');
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => createParticle(container), i * 200);
    }
    setInterval(() => {
        if (document.querySelectorAll('.particle').length < particleCount) {
            createParticle(container);
        }
    }, 3000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 4 + 2;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: floatUp ${duration}s linear ${delay}s infinite;
        opacity: 0.7;
    `;
    container.appendChild(particle);
    setTimeout(() => {
        if (particle.parentNode) particle.remove();
    }, (duration + delay) * 1000);
}

// CSS animations for ambience (particles and click ripple)
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
        50% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(style);