
import { useEffect, useRef } from 'react';

const CyberHexGrid = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        const hexSize = 30;
        const hexHeight = hexSize * 2;
        const hexWidth = Math.sqrt(3) * hexSize;
        const vertDist = hexHeight * 3 / 4;

        let tick = 0;

        const drawHex = (x: number, y: number, opacity: number) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = 2 * Math.PI / 6 * i;
                const x_i = x + hexSize * Math.cos(angle);
                const y_i = y + hexSize * Math.sin(angle);
                if (i === 0) ctx.moveTo(x_i, y_i);
                else ctx.lineTo(x_i, y_i);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`; // Tech Blue
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            tick += 0.005;

            // Draw Grid
            for (let r = -1; r < height / vertDist + 1; r++) {
                for (let c = -1; c < width / hexWidth + 1; c++) {
                    const xOffset = (r % 2) * (hexWidth / 2);
                    const x = c * hexWidth + xOffset;
                    const y = r * vertDist;

                    // Dynamic Opacity Wave
                    const distCheck = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
                    const wave = Math.sin(distCheck * 0.005 - tick * 2);
                    const opacity = Math.max(0.05, wave * 0.2); // Subtle glow

                    drawHex(x, y, opacity);

                    // Random active highlights
                    if (Math.random() > 0.999 && wave > 0.5) {
                        ctx.fillStyle = `rgba(56, 189, 248, 0.3)`;
                        ctx.fill();
                    }
                }
            }
            requestAnimationFrame(render);
        };

        const animationId = requestAnimationFrame(render);

        const handleResize = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};

export default CyberHexGrid;
