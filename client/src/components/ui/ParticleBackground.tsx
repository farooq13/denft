import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulsePhase: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  // Particle colors that match our theme
  const colors = [
    'rgba(59, 130, 246, 0.6)',   // Blue
    'rgba(147, 51, 234, 0.6)',   // Purple
    'rgba(236, 72, 153, 0.6)',   // Pink
    'rgba(34, 197, 94, 0.4)',    // Green
    'rgba(249, 115, 22, 0.4)',   // Orange
  ];

  // Initialize particles
  const initParticles = (canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = particles;
  };

  // Update particle positions and properties
  const updateParticles = (canvas: HTMLCanvasElement, deltaTime: number) => {
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    particles.forEach((particle) => {
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Bounce off edges
      if (particle.x <= 0 || particle.x >= canvas.width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      }
      if (particle.y <= 0 || particle.y >= canvas.height) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      }

      // Mouse interaction - attract particles to mouse
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        const force = (150 - distance) / 150 * 0.01;
        particle.vx += dx * force * deltaTime;
        particle.vy += dy * force * deltaTime;
        
        // Increase opacity near mouse
        particle.opacity = Math.min(0.8, particle.opacity + 0.02);
      } else {
        // Return to normal opacity
        particle.opacity = Math.max(0.1, particle.opacity - 0.01);
      }

      // Apply velocity damping
      particle.vx *= 0.998;
      particle.vy *= 0.998;

      // Update pulse phase for breathing effect
      particle.pulsePhase += 0.02 * deltaTime;
    });
  };

  // Draw particles and connections
  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const particles = particlesRef.current;

    // Clear canvas with slight trail effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections between nearby particles
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = (120 - distance) / 120 * 0.3;
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((particle) => {
      const pulseFactor = 1 + Math.sin(particle.pulsePhase) * 0.2;
      const currentSize = particle.size * pulseFactor;
      
      // Create radial gradient for each particle
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, currentSize * 2
      );
      
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw core particle
      ctx.fillStyle = particle.color.replace('0.6', String(particle.opacity));
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Animation loop
  const animate = (currentTime: number, lastTime: number = 0) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !isVisible) return;

    const deltaTime = Math.min(currentTime - lastTime, 16.67); // Cap at 60fps

    updateParticles(canvas, deltaTime);
    drawParticles(ctx, canvas);

    animationRef.current = requestAnimationFrame((time) => animate(time, currentTime));
  };

  // Handle canvas resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    initParticles(canvas);
  };

  // Handle mouse movement
  const handleMouseMove = (event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width) / window.devicePixelRatio,
      y: (event.clientY - rect.top) * (canvas.height / rect.height) / window.devicePixelRatio,
    };
  };

  // Handle visibility change to pause animation when tab is not active
  const handleVisibilityChange = () => {
    setIsVisible(!document.hidden);
  };

  // Setup canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start animation
    animationRef.current = requestAnimationFrame((time) => animate(time));

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Restart animation when visibility changes
  useEffect(() => {
    if (isVisible && !animationRef.current) {
      animationRef.current = requestAnimationFrame((time) => animate(time));
    } else if (!isVisible && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
};