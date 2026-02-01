"use client";

import { useEffect, useRef, useCallback } from "react";

interface LiquidBackgroundProps {
    className?: string;
    color1?: string;
    color2?: string;
    color3?: string;
    speed?: number;
    blur?: number;
}

export default function LiquidBackground({
    className = "",
    color1 = "#ff4d00",
    color2 = "#ff0000",
    color3 = "#000000",
    speed = 0.002,
    blur = 60,
}: LiquidBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const timeRef = useRef(0);

    const hexToRgb = useCallback((hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : { r: 0, g: 0, b: 0 };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const rgb3 = hexToRgb(color3);

        // Blob configuration
        const blobs = [
            { x: 0.3, y: 0.3, radius: 0.4, speedX: 0.7, speedY: 0.5, color: rgb1 },
            { x: 0.7, y: 0.5, radius: 0.35, speedX: -0.5, speedY: 0.8, color: rgb2 },
            { x: 0.5, y: 0.7, radius: 0.3, speedX: 0.6, speedY: -0.6, color: rgb1 },
            { x: 0.2, y: 0.6, radius: 0.25, speedX: -0.4, speedY: -0.7, color: rgb2 },
            { x: 0.8, y: 0.2, radius: 0.28, speedX: 0.3, speedY: 0.4, color: rgb1 },
        ];

        const animate = () => {
            timeRef.current += speed;
            const t = timeRef.current;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Clear with background color
            ctx.fillStyle = `rgb(${rgb3.r}, ${rgb3.g}, ${rgb3.b})`;
            ctx.fillRect(0, 0, width, height);

            // Draw blobs with gradients
            blobs.forEach((blob) => {
                const x = width * (0.5 + 0.4 * Math.sin(t * blob.speedX + blob.x * 10));
                const y = height * (0.5 + 0.4 * Math.cos(t * blob.speedY + blob.y * 10));
                const radius = Math.min(width, height) * blob.radius;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.8)`);
                gradient.addColorStop(0.5, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.3)`);
                gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [color1, color2, color3, speed, hexToRgb]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                filter: `blur(${blur}px)`,
            }}
        />
    );
}
