import { useEffect, useRef, useCallback } from 'react';

interface Particle { x: number; y: number; speed: number; opacity: number; char: string; }
interface Cube { x: number; y: number; rotX: number; rotY: number; rotXS: number; rotYS: number; size: number; color: string; }
interface ZZZ { x: number; y: number; vy: number; opacity: number; size: number; char: string; }
interface OrbitalItem { angle: number; radius: number; speed: number; color: string; size: number; type: 'diamond' | 'lock'; }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function CyberMascot3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: 0, y: 0 });
    const isHovering = useRef(false);
    const wake = useRef(0);          // 0 = fully asleep, 1 = fully awake
    const jumpVel = useRef(0);       // for the jump spring
    const jumpY = useRef(0);
    const wasSleeping = useRef(true); // to detect transition edge
    const stretchL = useRef(0);       // left antenna X stretch offset
    const stretchLVel = useRef(0);
    const stretchR = useRef(0);       // right antenna X stretch offset
    const stretchRVel = useRef(0);
    const isDraggingL = useRef(false);
    const isDraggingR = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const particles = useRef<Particle[]>([]);
    const cubes = useRef<Cube[]>([]);
    const zzz = useRef<ZZZ[]>([]);
    const orbitals = useRef<OrbitalItem[]>([]);
    const rafRef = useRef<number>(0);
    const t = useRef(0);

    const initData = useCallback((W: number, H: number) => {
        particles.current = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            speed: Math.random() * 1.2 + 0.4, opacity: Math.random() * 0.35 + 0.08,
            char: Math.random() > 0.5 ? '1' : '0',
        }));
        cubes.current = Array.from({ length: 6 }, (_, i) => ({
            x: (Math.random() - 0.5) * W * 0.7,
            y: (Math.random() - 0.5) * H * 0.5,
            rotX: Math.random() * Math.PI * 2, rotY: Math.random() * Math.PI * 2,
            rotXS: (Math.random() - 0.5) * 0.015, rotYS: (Math.random() - 0.5) * 0.02,
            size: Math.random() * 18 + 10,
            color: i % 2 === 0 ? '#00FF41' : '#00F0FF',
        }));
        orbitals.current = [
            { angle: 0, radius: 165, speed: 0.008, color: '#00F0FF', size: 14, type: 'diamond' },
            { angle: Math.PI, radius: 175, speed: 0.006, color: '#FF6B00', size: 12, type: 'lock' },
            { angle: Math.PI / 2, radius: 155, speed: 0.010, color: '#00FF41', size: 10, type: 'diamond' },
        ];
    }, []);

    const spawnZzz = (cx: number, cy: number) => {
        if (zzz.current.length < 5) {
            zzz.current.push({
                x: cx + 55 + Math.random() * 20,
                y: cy - 80 - Math.random() * 20,
                vy: -(Math.random() * 0.5 + 0.4),
                opacity: 0.9,
                size: Math.random() * 8 + 10,
                char: Math.random() < 0.6 ? 'z' : 'Z',
            });
        }
    };

    const drawCube = useCallback((ctx: CanvasRenderingContext2D, c: Cube, cx: number, cy: number) => {
        const s = c.size;
        const pts: [number, number, number][] = [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]];
        const cosX = Math.cos(c.rotX), sinX = Math.sin(c.rotX), cosY = Math.cos(c.rotY), sinY = Math.sin(c.rotY);
        const r = pts.map(([px, py, pz]) => {
            let rx = px * cosY + pz * sinY, rz = -px * sinY + pz * cosY;
            let ry = py * cosX - rz * sinX; rz = py * sinX + rz * cosX;
            return { sx: cx + c.x + rx * 0.65, sy: cy + c.y + ry * 0.65 };
        });
        const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        ctx.strokeStyle = c.color; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.45;
        edges.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(r[a].sx, r[a].sy); ctx.lineTo(r[b].sx, r[b].sy); ctx.stroke(); });
        ctx.globalAlpha = 1;
    }, []);

    const drawDiamond = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
        ctx.save(); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size, y); ctx.closePath();
        ctx.stroke(); ctx.globalAlpha = 0.4; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    }, []);

    const drawLock = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
        ctx.save(); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y - size * 0.3, size * 0.55, Math.PI, 0, false); ctx.stroke();
        ctx.strokeRect(x - size * 0.6, y - size * 0.05, size * 1.2, size * 0.9);
        ctx.fillStyle = color; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(x, y + size * 0.25, size * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.restore();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        t.current += 0.016;
        const time = t.current;

        /* ── Update wake level ── */
        // Wake up significantly if stretched manually (up to 85%)
        const manualStretchWake = Math.min(0.85, (Math.abs(stretchL.current) + Math.abs(stretchR.current)) / 75);
        const targetWake = isHovering.current ? 1 : manualStretchWake;
        const wakeSpeed = isHovering.current ? 0.045 : 0.025;
        wake.current = lerp(wake.current, targetWake, wakeSpeed);
        const w = wake.current; // shorthand

        /* ── Jump spring on wake edge ── */
        if (isHovering.current && wasSleeping.current && wake.current > 0.15) {
            wasSleeping.current = false;
            jumpVel.current = -18; // kick upward
            // kick antenna signals outward like a STRETCH
            stretchLVel.current = -58;
            stretchRVel.current = 58;
        }
        if (!isHovering.current && wake.current < 0.05) {
            wasSleeping.current = true;
        }
        // jump spring
        jumpVel.current += (0 - jumpY.current) * 0.22;
        jumpVel.current *= 0.72;
        jumpY.current += jumpVel.current;
        // antenna stretch springs (only if not dragging)
        if (!isDraggingL.current) {
            stretchLVel.current += (0 - stretchL.current) * 0.16;
            stretchLVel.current *= 0.65;
            stretchL.current += stretchLVel.current;
        }
        if (!isDraggingR.current) {
            stretchRVel.current += (0 - stretchR.current) * 0.16;
            stretchRVel.current *= 0.65;
            stretchR.current += stretchRVel.current;
        }

        const mx = (mouse.current.x / W) * 2 - 1;
        const my = (mouse.current.y / H) * 2 - 1;

        ctx.clearRect(0, 0, W, H);

        /* BG */
        const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        bg.addColorStop(0, 'rgba(0,30,10,0.25)'); bg.addColorStop(0.5, 'rgba(0,10,20,0.15)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        /* Binary rain — dimmer when asleep */
        ctx.font = '11px "JetBrains Mono",monospace';
        const rainOpacityScale = lerp(0.3, 1.0, w);
        particles.current.forEach(p => {
            p.y += p.speed * lerp(0.4, 1.0, w);
            if (p.y > H) { p.y = -10; p.x = Math.random() * W; p.char = Math.random() > 0.5 ? '1' : '0'; }
            ctx.fillStyle = `rgba(0,255,65,${p.opacity * rainOpacityScale})`; ctx.fillText(p.char, p.x, p.y);
        });

        /* Cubes — slower when asleep */
        cubes.current.forEach(c => {
            c.rotX += c.rotXS * lerp(0.3, 1.0, w);
            c.rotY += c.rotYS * lerp(0.3, 1.0, w);
            drawCube(ctx, c, W / 2, H / 2);
        });

        /* Hex grid */
        const hexR = 22, hexH = Math.sqrt(3) * hexR;
        ctx.strokeStyle = `rgba(0,255,65,${0.04 + Math.sin(time * 0.8) * 0.015})`; ctx.lineWidth = 0.6;
        for (let row = -2; row <= Math.ceil(H / hexH) + 2; row++) {
            for (let col = -2; col <= Math.ceil(W / (hexR * 1.5)) + 2; col++) {
                const hx = col * hexR * 1.5, hy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
                ctx.beginPath();
                for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; k === 0 ? ctx.moveTo(hx + hexR * Math.cos(a), hy + hexR * Math.sin(a)) : ctx.lineTo(hx + hexR * Math.cos(a), hy + hexR * Math.sin(a)); }
                ctx.closePath(); ctx.stroke();
            }
        }

        /* ═══════════════════════════════════ */
        /* ════════  ROBOT  ══════════════════ */
        /* ═══════════════════════════════════ */
        const cx = W / 2, cy = H / 2;

        // Sleepy: slow deep bob. Awake: faster smaller bob
        const bobAmplitude = lerp(11, 7, w);
        const bobSpeed = lerp(0.8, 1.4, w);
        const bob = Math.sin(time * bobSpeed) * bobAmplitude + jumpY.current;

        // Sleepy: slouch forward (positive tiltX), Awake: responds to mouse
        const tiltX = lerp(8, mx * 10, w);
        const tiltY = lerp(4, my * 6, w);

        // Arms: sleepy = hanging down, awake = swinging
        const armLSwing = lerp(-35, Math.sin(time * 1.5) * 12 + 8, w);
        const armRSwing = lerp(35, Math.sin(time * 1.5 + Math.PI) * 12 - 8, w);
        const legSwing = lerp(2, Math.sin(time * 2) * 6, w);

        ctx.save();
        ctx.translate(cx + tiltX * 0.3, cy + bob);

        // Sleepy: lean head/body forward
        const bodySlump = lerp(0.08, 0, w);
        ctx.rotate(bodySlump);

        /* Glow ring */
        const ringG = ctx.createRadialGradient(0, 160, 5, 0, 160, 110);
        ringG.addColorStop(0, 'rgba(0,255,65,0)'); ringG.addColorStop(0.7, `rgba(0,255,65,${lerp(0.05, 0.12, w)})`); ringG.addColorStop(1, 'rgba(0,255,65,0)');
        ctx.fillStyle = ringG; ctx.beginPath(); ctx.ellipse(0, 160, 105, 18, 0, 0, Math.PI * 2); ctx.fill();

        /* Legs */
        [[-28, 1], [28, -1]].forEach(([lx, dir]) => {
            ctx.save(); ctx.translate(lx as number, 120); ctx.rotate(legSwing * (dir as number) * Math.PI / 180);
            ctx.fillStyle = '#1a1a3e'; roundRect(ctx, -8, 0, 16, 35, 6); ctx.fill();
            ctx.fillStyle = '#16213e'; roundRect(ctx, -7, 32, 14, 28, 5); ctx.fill();
            ctx.fillStyle = '#ccccdd'; roundRect(ctx, -12, 56, 26, 12, 5); ctx.fill();
            ctx.restore();
        });

        /* Body */
        ctx.fillStyle = '#16213e'; roundRect(ctx, -55, 60, 110, 75, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(0,240,255,0.25)'; ctx.lineWidth = 1; roundRect(ctx, -55, 60, 110, 75, 10); ctx.stroke();
        ctx.fillStyle = '#0f3460'; roundRect(ctx, -38, 70, 76, 50, 6); ctx.fill();

        // shield — dim when asleep
        ctx.save(); ctx.strokeStyle = `rgba(0,255,65,${lerp(0.2, 1, w)})`; ctx.lineWidth = 2; ctx.shadowColor = '#00FF41'; ctx.shadowBlur = lerp(2, 8, w);
        ctx.beginPath(); ctx.moveTo(0, 76); ctx.lineTo(-14, 83); ctx.lineTo(-14, 99); ctx.quadraticCurveTo(-14, 112, 0, 118); ctx.quadraticCurveTo(14, 112, 14, 99); ctx.lineTo(14, 83); ctx.closePath(); ctx.stroke(); ctx.restore();

        for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(0,255,65,${lerp(0.05, 0.25, w) + Math.sin(time * 2 + i) * 0.1 * w})`; roundRect(ctx, -52, 74 + i * 11, 10, 5, 2); ctx.fill(); }

        ctx.fillStyle = '#333355'; ctx.beginPath(); ctx.arc(40, 80, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#444466'; ctx.beginPath(); ctx.arc(40, 95, 5, 0, Math.PI * 2); ctx.fill();

        const ledPulse = lerp(0.3, 0.6, w) + Math.sin(time * 3) * 0.4 * w;
        [[-22, 127, '#00FF41'], [-10, 127, '#00F0FF'], [2, 127, '#FF0040']].forEach(([lx, ly, lc]) => {
            ctx.fillStyle = lc as string; ctx.shadowColor = lc as string; ctx.shadowBlur = 6 * ledPulse;
            ctx.beginPath(); ctx.arc(lx as number, ly as number, 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;

        /* Arms */
        [[armLSwing, -55, 72], [armRSwing, 55, 72]].forEach(([swing, ax, ay]) => {
            ctx.save(); ctx.translate(ax as number, ay as number); ctx.rotate((swing as number) * Math.PI / 180);
            ctx.fillStyle = '#2a2a4a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1a3e'; roundRect(ctx, -7, 0, 14, 38, 6); ctx.fill();
            ctx.fillStyle = '#2a2a4a'; ctx.beginPath(); ctx.arc(0, 40, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1a3e'; roundRect(ctx, -6, 46, 12, 28, 5); ctx.fill();
            ctx.fillStyle = '#ccccdd'; ctx.beginPath(); ctx.arc(0, 80, 10, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        /* ════ HEAD ════ */
        ctx.save();
        ctx.translate(tiltX * 0.6, tiltY * 0.3);
        // Sleepy: head droops forward
        const headDroop = lerp(0.18, 0, w);
        ctx.rotate(headDroop);

        // neck
        ctx.fillStyle = '#333355'; roundRect(ctx, -10, 42, 20, 24, 4); ctx.fill();

        // monitor casing
        const monG = ctx.createLinearGradient(-70, -80, 70, 60);
        monG.addColorStop(0, '#1e1e3a'); monG.addColorStop(0.5, '#16213e'); monG.addColorStop(1, '#0f1729');
        ctx.fillStyle = monG; roundRect(ctx, -72, -80, 144, 128, 14); ctx.fill();
        ctx.strokeStyle = `rgba(0,240,255,${lerp(0.1, 0.3, w)})`; ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0,240,255,0.4)'; ctx.shadowBlur = lerp(2, 12, w);
        roundRect(ctx, -72, -80, 144, 128, 14); ctx.stroke(); ctx.shadowBlur = 0;

        // screen
        ctx.fillStyle = '#0a0a14'; roundRect(ctx, -60, -68, 120, 100, 8); ctx.fill();
        const scrG = ctx.createRadialGradient(0, -20, 0, 0, -20, 65);
        scrG.addColorStop(0, `rgba(0,${lerp(20, 50, w)},${lerp(10, 20, w)},0.9)`);
        scrG.addColorStop(0.7, 'rgba(0,20,10,0.95)'); scrG.addColorStop(1, 'rgba(0,5,5,1)');
        ctx.fillStyle = scrG; roundRect(ctx, -55, -62, 110, 88, 5); ctx.fill();

        for (let sl = 0; sl < 10; sl++) {
            const slY = -62 + sl * 9 + ((time * 30) % 9);
            ctx.fillStyle = `rgba(0,255,65,${0.02 * w})`; ctx.fillRect(-55, slY, 110, 4);
        }

        /* Screen text — dim when asleep */
        ctx.font = 'bold 9px "JetBrains Mono",monospace'; ctx.textAlign = 'left';
        const textAlpha = lerp(0.08, 1, w);
        const blink = Math.sin(time * 4) > 0;
        ctx.fillStyle = `rgba(0,255,65,${(blink ? 0.95 : 0.5) * textAlpha})`; ctx.fillText('> SYSTEM ACTIVE', -50, -46);
        ctx.fillStyle = `rgba(0,240,255,${0.7 * textAlpha})`; ctx.fillText('THREAT LEVEL: LOW', -50, -32);
        ctx.fillStyle = `rgba(0,255,65,${0.5 * textAlpha})`; ctx.fillText('FIREWALL: [OK]', -50, -18);
        const barW = Math.floor(((Math.sin(time * 0.5) + 1) / 2) * 12);
        ctx.fillStyle = `rgba(0,255,65,${0.4 * textAlpha})`; ctx.fillText(`LOG: ${'█'.repeat(barW)}`, -50, -4);
        ctx.fillStyle = `rgba(0,255,65,${(0.3 + Math.sin(time * 2) * 0.2) * textAlpha})`; ctx.fillText('[MONITORING...]', -50, 10);
        ctx.textAlign = 'center';

        // screen LEDs
        const lp2 = lerp(0.1, 0.5, w) + Math.sin(time * 3) * 0.5 * w;
        [[-36, 36, '#00FF41'], [-20, 36, '#00F0FF'], [-4, 36, '#FF0040']].forEach(([lx, ly, lc]) => {
            ctx.fillStyle = lc as string; ctx.shadowColor = lc as string; ctx.shadowBlur = 5 * lp2;
            ctx.beginPath(); ctx.arc(lx as number, ly as number, 3.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;

        /* ── EYES ── */
        const eyeX = mx * 5 * w, eyeY = my * 3 * w;
        // eyelid droop: 0=fully open, 1=fully closed (half-lidded at 0.6)
        const lidDroop = lerp(0.62, 0.0, w); // sleepy = 62% closed

        [[-22, -25], [22, -25]].forEach(([ex, ey]) => {
            // eye socket
            ctx.fillStyle = '#030310'; ctx.beginPath(); ctx.ellipse(ex, ey, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
            // iris
            const iG = ctx.createRadialGradient(ex, ey, 0, ex, ey, 13);
            iG.addColorStop(0, 'rgba(0,80,0,0.8)'); iG.addColorStop(0.6, 'rgba(0,40,0,0.6)'); iG.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = iG; ctx.beginPath(); ctx.ellipse(ex, ey, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
            // pupil (dim when asleep)
            const px = ex + eyeX, py = ey + eyeY;
            const pupilGlow = lerp(3, 12, w);
            ctx.fillStyle = '#00FF41'; ctx.shadowColor = '#00FF41'; ctx.shadowBlur = pupilGlow;
            ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(100,255,150,${lerp(0.2, 0.8, w)})`; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(px - 1.5, py - 1.5, 2, 0, Math.PI * 2); ctx.fill();
            // eye ring
            ctx.strokeStyle = `rgba(0,255,65,${lerp(0.1, 0.4, w)})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(ex, ey, 15, 13, 0, 0, Math.PI * 2); ctx.stroke();

            // EYELID — drawn as dark rect clipping the top of the eye
            if (lidDroop > 0.02) {
                const lidH = 28 * lidDroop; // height of the drooping lid
                ctx.save();
                ctx.fillStyle = '#16213e'; // match monitor color
                // upper eyelid
                ctx.beginPath();
                ctx.ellipse(ex, ey - 14 + lidH * 0.5, 16, lidH * 0.7 + 2, 0, 0, Math.PI * 2);
                ctx.fill();
                // eyelash line
                ctx.strokeStyle = `rgba(0,255,65,${lerp(0.3, 0, w) * 0.6})`; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(ex - 14, ey - 14 + lidH); ctx.lineTo(ex + 14, ey - 14 + lidH); ctx.stroke();
                ctx.restore();
            }
        });
        ctx.shadowBlur = 0;

        /* Antennas — elastic stretch on wake-up */
        ctx.lineCap = 'round';
        const antWobble = lerp(0.5, 1, w);

        // Left antenna tip position (stretch adds X offset, arcs upward at extremes)
        const aLbx = -42, aLby = -80; // base (where it exits monitor)
        const aLtx = -55 + stretchL.current;
        const aLty = -112 + Math.sin(time * 2.5) * 4 * antWobble - Math.abs(stretchL.current) * 0.25;
        const aLsz = 5 + Math.abs(stretchL.current) * 0.09;

        // Right antenna tip
        const aRbx = 42, aRby = -80;
        const aRtx = 52 + stretchR.current;
        const aRty = -110 + Math.sin(time * 2.8 + 1) * 4 * antWobble - Math.abs(stretchR.current) * 0.25;
        const aRsz = 4 + Math.abs(stretchR.current) * 0.09;

        // Draw wires as bezier curves (they bow when stretched)
        ctx.strokeStyle = '#333355'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(aLbx, aLby);
        ctx.bezierCurveTo(aLbx - 5, aLby - 15, aLtx + 12, aLty + 12, aLtx, aLty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(aRbx, aRby);
        ctx.bezierCurveTo(aRbx + 5, aRby - 15, aRtx - 12, aRty + 12, aRtx, aRty); ctx.stroke();



        // Left tip glowing dot
        ctx.fillStyle = '#00FF41'; ctx.shadowColor = '#00FF41';
        ctx.shadowBlur = lerp(4, 14, w) + Math.abs(stretchL.current) * 0.25;
        ctx.beginPath(); ctx.arc(aLtx, aLty, aLsz, 0, Math.PI * 2); ctx.fill();

        // Right tip glowing dot
        ctx.fillStyle = '#00F0FF'; ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = lerp(4, 14, w) + Math.abs(stretchR.current) * 0.25;
        ctx.beginPath(); ctx.arc(aRtx, aRty, aRsz, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        /* Sticky note */
        ctx.save(); ctx.translate(74, -30); ctx.rotate(0.1);
        ctx.fillStyle = '#FF6B00'; roundRect(ctx, 0, 0, 38, 30, 3); ctx.fill();
        ctx.fillStyle = '#000000'; ctx.font = 'bold 7px "JetBrains Mono",monospace'; ctx.textAlign = 'center';
        ctx.fillText('HACK', 19, 12); ctx.fillText('ME?', 19, 23);
        ctx.restore();

        /* ── ZZZ bubbles (only when asleep) ── */
        if (w < 0.5 && Math.floor(time * 60) % 90 === 0) spawnZzz(0, -80);
        zzz.current = zzz.current.filter(z => z.opacity > 0.05);
        zzz.current.forEach(z => {
            z.y += z.vy; z.x += Math.sin(z.y * 0.08) * 0.4; z.opacity -= 0.006;
            const zAlpha = z.opacity * (1 - w); // fade out as robot wakes
            ctx.font = `bold ${z.size}px "JetBrains Mono",monospace`;
            ctx.textAlign = 'center'; ctx.fillStyle = `rgba(0,240,255,${zAlpha})`;
            ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 8 * zAlpha;
            ctx.fillText(z.char, z.x, z.y); ctx.shadowBlur = 0;
        });

        ctx.restore(); // head
        ctx.restore(); // robot

        /* Orbitals — spin slower when asleep */
        orbitals.current.forEach(orb => {
            orb.angle += orb.speed * lerp(0.2, 1.0, w);
            const ox = cx + Math.cos(orb.angle) * orb.radius + tiltX * 0.2;
            const oy = cy + bob * 0.4 + Math.sin(orb.angle) * orb.radius * 0.35;
            ctx.globalAlpha = lerp(0.2, 1.0, w);
            if (orb.type === 'diamond') drawDiamond(ctx, ox, oy, orb.size, orb.color);
            else drawLock(ctx, ox, oy, orb.size, orb.color);
            ctx.globalAlpha = 1;
        });

        /* Labels — sharp and clear */
        const lp3 = 0.5 + Math.sin(time * 3) * 0.5;
        ctx.font = 'bold 10px "JetBrains Mono",monospace'; ctx.textAlign = 'left'; ctx.globalAlpha = 1;
        [[cx - 95, H - 18, '#00FF41', 'INTERACTIVE'], [cx + 15, H - 18, '#00F0FF', 'TRACKING']].forEach(([bx, by, bc, label]) => {
            // Indicator dot
            ctx.fillStyle = bc as string; ctx.shadowColor = bc as string; ctx.shadowBlur = 6 * lp3;
            ctx.beginPath(); ctx.arc((bx as number) + 4, (by as number) - 4, 4, 0, Math.PI * 2); ctx.fill();

            // Text - bright and sharp
            ctx.shadowBlur = 0; ctx.fillStyle = '#e1e1f0';
            ctx.fillText(label as string, (bx as number) + 14, by as number);
        });
        ctx.globalAlpha = 1;

        rafRef.current = requestAnimationFrame(draw);
    }, [drawCube, drawDiamond, drawLock]);

    const resize = useCallback(() => {
        const c = canvasRef.current; if (!c) return;
        const p = c.parentElement; if (!p) return;
        c.width = p.clientWidth; c.height = p.clientHeight;
        initData(c.width, c.height);
    }, [initData]);

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        rafRef.current = requestAnimationFrame(draw);
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
    }, [resize, draw]);

    const onMouseEnter = useCallback(() => { isHovering.current = true; }, []);
    const onMouseLeave = useCallback(() => {
        isHovering.current = false;
        isDraggingL.current = false;
        isDraggingR.current = false;
        const c = canvasRef.current;
        if (c) mouse.current = { x: c.width / 2, y: c.height / 2 };
    }, []);

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        const W = r.width;
        const H = r.height;

        // Approximate hit detection for antenna tips
        // The tips are roughly at cx +/- 50, cy - 100
        const cx = W / 2;
        const cy = H / 2;
        const dxL = mx - (cx - 55 + stretchL.current);
        const dyL = my - (cy - 110 + jumpY.current); // very rough approximation
        if (Math.sqrt(dxL * dxL + dyL * dyL) < 30) {
            isDraggingL.current = true;
            lastMousePos.current = { x: mx, y: my };
            return;
        }

        const dxR = mx - (cx + 52 + stretchR.current);
        const dyR = my - (cy - 110 + jumpY.current);
        if (Math.sqrt(dxR * dxR + dyR * dyR) < 30) {
            isDraggingR.current = true;
            lastMousePos.current = { x: mx, y: my };
            return;
        }
    }, []);

    const onMouseUp = useCallback(() => {
        isDraggingL.current = false;
        isDraggingR.current = false;
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        mouse.current = { x: mx, y: my };

        if (isDraggingL.current) {
            const dx = mx - lastMousePos.current.x;
            stretchL.current = Math.min(40, Math.max(-150, stretchL.current + dx));
            lastMousePos.current = { x: mx, y: my };
        }
        if (isDraggingR.current) {
            const dx = mx - lastMousePos.current.x;
            stretchR.current = Math.min(150, Math.max(-40, stretchR.current + dx));
            lastMousePos.current = { x: mx, y: my };
        }
    }, []);

    const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        const r = e.currentTarget.getBoundingClientRect();
        const tx = touch.clientX - r.left;
        const ty = touch.clientY - r.top;
        const W = r.width;
        const H = r.height;

        const cx = W / 2;
        const cy = H / 2;

        const dxL = tx - (cx - 55 + stretchL.current);
        const dyL = ty - (cy - 110 + jumpY.current);
        if (Math.sqrt(dxL * dxL + dyL * dyL) < 50) {
            isDraggingL.current = true;
            isHovering.current = true;
            lastMousePos.current = { x: tx, y: ty };
            return;
        }

        const dxR = tx - (cx + 52 + stretchR.current);
        const dyR = ty - (cy - 110 + jumpY.current);
        if (Math.sqrt(dxR * dxR + dyR * dyR) < 50) {
            isDraggingR.current = true;
            isHovering.current = true;
            lastMousePos.current = { x: tx, y: ty };
            return;
        }
        isHovering.current = true;
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        const r = e.currentTarget.getBoundingClientRect();
        const tx = touch.clientX - r.left;
        const ty = touch.clientY - r.top;
        mouse.current = { x: tx, y: ty };

        if (isDraggingL.current) {
            const dx = tx - lastMousePos.current.x;
            stretchL.current = Math.min(40, Math.max(-150, stretchL.current + dx));
            lastMousePos.current = { x: tx, y: ty };
        }
        if (isDraggingR.current) {
            const dx = tx - lastMousePos.current.x;
            stretchR.current = Math.min(150, Math.max(-40, stretchR.current + dx));
            lastMousePos.current = { x: tx, y: ty };
        }
    }, []);

    const onTouchEnd = useCallback(() => {
        isDraggingL.current = false;
        isDraggingR.current = false;
        isHovering.current = false;
    }, []);

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                cursor: (isDraggingL.current || isDraggingR.current) ? 'grabbing' : 'grab'
            }}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,255,65,0.06) 0%, rgba(0,240,255,0.03) 40%, transparent 70%)' }} />
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
}
