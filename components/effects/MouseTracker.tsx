'use client';

import { useEffect, useRef } from 'react';

export const MouseTracker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; life: number; maxLife: number }[] = [];
    let mouseX = -100;
    let mouseY = -100;
    let frame = 0;
    let rafId: number;

    const handleMouse = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, button, select, label, [role="button"]')) {
        mouseX = -100;
        mouseY = -100;
        return;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // spawn 3 particles per frame on mouse move
      if (mouseX > 0 && mouseY > 0) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: mouseX + (Math.random() - 0.5) * 20,
            y: mouseY + (Math.random() - 0.5) * 20,
            life: 0,
            maxLife: 15 + Math.random() * 15,
          });
        }
      }

      if (particles.length > 500) particles.splice(0, particles.length - 500);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        const alpha = (1 - progress) * 0.35;
        const size = (1 - progress) * 3 + 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(154, 100%, 42%, ${alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
