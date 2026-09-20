"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useVelocity,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Total number of frame images in /public/frames/
 * Files should be named: frame_0.webp ... frame_{TOTAL_FRAMES - 1}.webp
 */
export const TOTAL_FRAMES = 60;

// Particle type for fallback mode
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseAlpha: number;
}

export default function HeroCanvasAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasFrames, setHasFrames] = useState<boolean>(true);

  const prefersReducedMotion = useReducedMotion();

  // ───────────────────────────────────────────────────────────────────────────
  // Bi-Directional Scroll & Spring Physics
  // ───────────────────────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth scroll progress (bi-directional: scrolling up reverses naturally)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Anti-gravity float: use velocity of scroll to create subtle translateY
  const scrollVelocity = useVelocity(smoothProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  // Transform velocity into subtle anti-gravity float (-14px to +14px)
  const rawAntiGravityY = useTransform(smoothVelocity, [-3, 0, 3], [14, 0, -14]);
  const antiGravityY = prefersReducedMotion ? 0 : rawAntiGravityY;

  // Track drawn frame to prevent unnecessary requestAnimationFrame calls
  const lastRenderedIndexRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // Particles state for fallback mode
  const particlesRef = useRef<Particle[]>([]);
  const particleRafRef = useRef<number | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Contain-fit canvas drawing function
  // ───────────────────────────────────────────────────────────────────────────
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = images[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Contain-fit calculation with devicePixelRatio
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);

      const drawWidth = img.width * ratio;
      const drawHeight = img.height * ratio;
      const shiftX = (canvas.width - drawWidth) / 2;
      const shiftY = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, 0, 0, img.width, img.height, shiftX, shiftY, drawWidth, drawHeight);
      lastRenderedIndexRef.current = frameIndex;
    },
    [images]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Resize handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    if (hasFrames && images.length > 0 && lastRenderedIndexRef.current >= 0) {
      drawFrame(lastRenderedIndexRef.current);
    }
  }, [drawFrame, hasFrames, images.length]);

  // ───────────────────────────────────────────────────────────────────────────
  // Particle Fallback Animation Loop
  // ───────────────────────────────────────────────────────────────────────────
  const initParticles = useCallback((width: number, height: number) => {
    const count = 90;
    const colors = ["#4F9C8F", "#2ECC71", "#FFD166", "#EAF2F5"];
    const pts: Particle[] = [];

    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.5 + 0.3,
      });
    }
    particlesRef.current = pts;
  }, []);

  const runParticleLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const progress = smoothProgress.get();
    const velocity = smoothVelocity.get();

    ctx.clearRect(0, 0, width, height);

    // Dynamic background grid
    ctx.strokeStyle = "rgba(34, 48, 64, 0.25)";
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Interactive Core Ring (Visual indicator of progress 0 -> 1)
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const pulse = Math.sin(Date.now() * 0.002) * 6;
    const dynamicRadius = baseRadius + pulse + progress * 40;

    // Glowing Core Arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = "#4F9C8F";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#4F9C8F";
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Secondary Track
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(79, 156, 143, 0.15)";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Central Brand Shield / Icon Indicator
    ctx.save();
    ctx.font = `600 ${Math.max(14, Math.round(width * 0.016))}px Inter, sans-serif`;
    ctx.fillStyle = "#EAF2F5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FITFORGE", centerX, centerY - 12);

    ctx.font = `400 ${Math.max(11, Math.round(width * 0.01))}px Inter, sans-serif`;
    ctx.fillStyle = "#8CA0AD";
    const frameNumber = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1))));
    ctx.fillText(`PHASE ${frameNumber + 1} / ${TOTAL_FRAMES}`, centerX, centerY + 14);
    ctx.restore();

    // Render & Move Particles
    const pts = particlesRef.current;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      // Influence by scroll velocity
      if (!prefersReducedMotion) {
        p.x += p.vx + velocity * 2;
        p.y += p.vy;
      }

      // Wrap around bounds
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.baseAlpha;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < pts.length; j++) {
        const p2 = pts[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - dist / 110) * 0.18;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0;

    particleRafRef.current = requestAnimationFrame(runParticleLoop);
  }, [smoothProgress, smoothVelocity, prefersReducedMotion]);

  // ───────────────────────────────────────────────────────────────────────────
  // Frame Preloading Effect
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    // Test first frame availability
    const testImg = new Image();
    testImg.src = "/frames/frame_0.webp";

    testImg.onload = () => {
      if (!isMounted) return;
      // Directory has frames! Preload all
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = `/frames/frame_${i}.webp`;

        img.onload = () => {
          if (!isMounted) return;
          loadedCount++;
          loadedImages[i] = img;
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          setLoadProgress(pct);

          if (loadedCount === TOTAL_FRAMES) {
            setImages(loadedImages);
            setIsLoaded(true);
            setHasFrames(true);
          }
        };

        img.onerror = () => {
          if (!isMounted) return;
          loadedCount++;
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          setLoadProgress(pct);
          if (loadedCount === TOTAL_FRAMES) {
            setImages(loadedImages);
            setIsLoaded(true);
            setHasFrames(false);
          }
        };
      }
    };

    testImg.onerror = () => {
      // /public/frames is empty or not found: smoothly switch to interactive particle mode
      if (!isMounted) return;
      let fakeProgress = 0;
      const interval = setInterval(() => {
        fakeProgress += 20;
        setLoadProgress(Math.min(100, fakeProgress));
        if (fakeProgress >= 100) {
          clearInterval(interval);
          setHasFrames(false);
          setIsLoaded(true);
        }
      }, 50);
    };

    return () => {
      isMounted = false;
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas initialization & Resize listener
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    const canvas = canvasRef.current;
    if (canvas) {
      initParticles(canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (particleRafRef.current) cancelAnimationFrame(particleRafRef.current);
    };
  }, [handleResize, initParticles]);

  // ───────────────────────────────────────────────────────────────────────────
  // Animation Loop Trigger
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (!hasFrames) {
      // Start particle loop
      particleRafRef.current = requestAnimationFrame(runParticleLoop);
      return () => {
        if (particleRafRef.current) cancelAnimationFrame(particleRafRef.current);
      };
    }

    // When real frames exist, listen to smoothProgress changes
    const unsubscribe = smoothProgress.on("change", (latest) => {
      const clamped = Math.min(1, Math.max(0, latest));
      const targetIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(clamped * (TOTAL_FRAMES - 1)))
      );

      if (targetIndex !== lastRenderedIndexRef.current) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => drawFrame(targetIndex));
      }
    });

    // Initial render
    drawFrame(0);

    return () => {
      unsubscribe();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isLoaded, hasFrames, smoothProgress, drawFrame, runParticleLoop]);

  // ───────────────────────────────────────────────────────────────────────────
  // Text Overlay Opacity & Transform Mappings
  // ───────────────────────────────────────────────────────────────────────────
  // 1. "Every app rewards who already shows up." (0.05 - 0.22)
  const opacity1 = useTransform(smoothProgress, [0.03, 0.07, 0.19, 0.23], [0, 1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0.03, 0.07, 0.19, 0.23], [24, 0, 0, -24]);

  // 2. "We built the one that catches who's about to quit." (0.28 - 0.45)
  const opacity2 = useTransform(smoothProgress, [0.26, 0.30, 0.42, 0.46], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.26, 0.30, 0.42, 0.46], [24, 0, 0, -24]);

  // 3. "When risk goes up, we make the goal smaller — not bigger." (0.52 - 0.70)
  const opacity3 = useTransform(smoothProgress, [0.50, 0.54, 0.67, 0.71], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.50, 0.54, 0.67, 0.71], [24, 0, 0, -24]);

  // 4. "This is FitForge." + button (0.78 - 1.00)
  const opacity4 = useTransform(smoothProgress, [0.76, 0.81, 0.96, 1.0], [0, 1, 1, 1]);
  const y4 = useTransform(smoothProgress, [0.76, 0.81, 0.96, 1.0], [24, 0, 0, 0]);

  // Scroll indicator fade out (fades out by progress 0.10)
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);

  const scrollToRiskEngine = () => {
    const target = document.getElementById("risk-engine");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[500vh] w-full bg-[var(--ff-bg-primary)] text-[var(--ff-text-primary)]"
      id="hero-canvas-container"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Preloader overlay (shows until ALL frames loaded)                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--ff-bg-primary)] px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-3 w-3 rounded-full bg-[var(--ff-accent)] animate-glow" />
            <span className="text-xl font-bold tracking-wider text-[var(--ff-text-primary)]">
              FITFORGE
            </span>
          </div>

          <div className="w-full max-w-md">
            <div className="flex justify-between text-xs text-[var(--ff-text-secondary)] mb-2 font-mono">
              <span>Loading sequence frames</span>
              <span>{loadProgress}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-bg-secondary)] border border-[var(--ff-border)] p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--ff-accent)] to-[var(--ff-risk-low)]"
                style={{ width: `${loadProgress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>

            <p className="mt-4 text-center text-xs text-[var(--ff-text-secondary)]">
              Preparing dynamic campus fitness timeline...
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Sticky Fullscreen Canvas Viewport                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Anti-gravity float wrapper */}
        <motion.div
          style={{ y: antiGravityY }}
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block object-contain"
            aria-label="FitForge interactive canvas animation"
          />

          {/* Subtle vignette gradient on edges */}
          <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[var(--ff-bg-primary)]/80" />
        </motion.div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 1: 0.05 - 0.22                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity1} y={y1}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 backdrop-blur-md px-4 py-1.5 text-xs text-[var(--ff-accent)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-accent)] animate-glow" />
            The Fitness Paradigm
          </div>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance text-[var(--ff-text-primary)] max-w-4xl">
            Every app rewards who{" "}
            <span className="italic text-[var(--ff-accent)]">already shows up.</span>
          </h2>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 2: 0.28 - 0.45                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity2} y={y2}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 backdrop-blur-md px-4 py-1.5 text-xs text-[var(--ff-risk-mid)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-risk-mid)] animate-glow" />
            Dropout Prevention
          </div>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance text-[var(--ff-text-primary)] max-w-4xl">
            We built the one that{" "}
            <span className="italic text-[var(--ff-risk-mid)]">
              catches who&apos;s about to quit.
            </span>
          </h2>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 3: 0.52 - 0.70                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity3} y={y3}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 backdrop-blur-md px-4 py-1.5 text-xs text-[var(--ff-risk-low)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-risk-low)] animate-glow" />
            Empathetic Scaling
          </div>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance text-[var(--ff-text-primary)] max-w-4xl">
            When risk goes up, we make the goal{" "}
            <span className="italic text-[var(--ff-risk-low)]">
              smaller — not bigger.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--ff-text-secondary)] max-w-xl font-sans">
            Lower friction, rebuild consistency, and re-engage with campus peers.
          </p>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 4: 0.78 - 1.00 + CTA button                          */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity4} y={y4} pointerEvents="auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 backdrop-blur-md px-4 py-1.5 text-xs text-[var(--ff-gold)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-gold)] animate-glow" />
            SIH PS 26196 Platform
          </div>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--ff-text-primary)] mb-6">
            This is <span className="gradient-text italic">FitForge.</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToRiskEngine}
              type="button"
              className="group rounded-full bg-[var(--ff-accent)] hover:brightness-110 px-8 py-4 font-semibold text-[var(--ff-bg-primary)] transition-all glow-accent flex items-center gap-2 text-base cursor-pointer"
            >
              <span>See it work</span>
              <span className="transition-transform group-hover:translate-y-1">↓</span>
            </button>
          </div>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Scroll Indicator (fades out after initial section)               */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-[var(--ff-text-secondary)] font-mono"
        >
          <span>SCROLL TO EXPLORE</span>
          <div className="h-10 w-5 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/60 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="h-2 w-1.5 rounded-full bg-[var(--ff-accent)]"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Overlay Section Component
// ─────────────────────────────────────────────────────────────────────────────

interface OverlaySectionProps {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  children: React.ReactNode;
  pointerEvents?: "none" | "auto";
}

function OverlaySection({
  opacity,
  y,
  children,
  pointerEvents = "none",
}: OverlaySectionProps) {
  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 ${
        pointerEvents === "auto" ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center max-w-4xl mx-auto">{children}</div>
    </motion.div>
  );
}
