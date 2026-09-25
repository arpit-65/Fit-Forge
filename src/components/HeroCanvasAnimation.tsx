"use client";

import React, { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  m,
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

export const DESKTOP_FRAMES = 100;
export const MOBILE_FRAMES = 60;
export const DESKTOP_DIR = "/frames/desktop";
export const MOBILE_DIR = "/frames/mobile";
const CONCURRENCY_LIMIT = 6;

// Particle type for emergency fallback mode
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseAlpha: number;
}

/**
 * Modern off-thread image loader.
 * Prioritizes createImageBitmap to decode images entirely off the main thread.
 * Falls back to img.decode() for asynchronous decoding.
 */
async function loadFrameAsset(src: string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await createImageBitmap(blob);
  } else {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  }
}

export default function HeroCanvasAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Frames and progress stored in refs - ZERO React re-renders on scroll or download
  const framesRef = useRef<(ImageBitmap | HTMLImageElement | null)[]>([]);
  const totalFramesRef = useRef<number>(DESKTOP_FRAMES);
  const frameDirRef = useRef<string>(DESKTOP_DIR);

  const lastDrawnIndexRef = useRef<number>(-1);
  const targetIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Direct DOM refs for non-blocking buffering progress indicator
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  // Emergency particle fallback ref
  const particlesRef = useRef<Particle[]>([]);
  const particleRafRef = useRef<number | null>(null);
  const usingParticlesRef = useRef<boolean>(false);

  const prefersReducedMotion = useReducedMotion();

  // ───────────────────────────────────────────────────────────────────────────
  // Bi-Directional Scroll & Spring Physics (Transform-only)
  // ───────────────────────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Anti-gravity float: velocity-driven translateY (strictly transform)
  const scrollVelocity = useVelocity(smoothProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  const rawAntiGravityY = useTransform(smoothVelocity, [-3, 0, 3], [14, 0, -14]);
  const antiGravityY = prefersReducedMotion ? 0 : rawAntiGravityY;

  // ───────────────────────────────────────────────────────────────────────────
  // Contain-fit canvas drawing (no heavy shadow/blur)
  // ───────────────────────────────────────────────────────────────────────────
  const drawOntoCanvas = useCallback((drawable: ImageBitmap | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const dw = (drawable as ImageBitmap).width || (drawable as HTMLImageElement).naturalWidth;
    const dh = (drawable as ImageBitmap).height || (drawable as HTMLImageElement).naturalHeight;
    if (!dw || !dh) return;

    // Contain-fit calculation
    const hRatio = cw / dw;
    const vRatio = ch / dh;
    const ratio = Math.min(hRatio, vRatio);

    const drawWidth = dw * ratio;
    const drawHeight = dh * ratio;
    const shiftX = (cw - drawWidth) / 2;
    const shiftY = (ch - drawHeight) / 2;

    // Fast background clear matching theme
    ctx.fillStyle = "#0B0F14";
    ctx.fillRect(0, 0, cw, ch);

    // Blit image without heavy canvas shadows
    ctx.drawImage(drawable, 0, 0, dw, dh, shiftX, shiftY, drawWidth, drawHeight);
  }, []);

  /**
   * Returns the exact frame if loaded, or the nearest loaded frame.
   * Ensures seamless playback even during initial buffering.
   */
  const getNearestLoadedFrame = useCallback((targetIdx: number): ImageBitmap | HTMLImageElement | null => {
    const frames = framesRef.current;
    const total = totalFramesRef.current;
    if (frames[targetIdx]) return frames[targetIdx];

    // Search outward for the closest loaded frame
    let left = targetIdx - 1;
    let right = targetIdx + 1;
    while (left >= 0 || right < total) {
      if (left >= 0 && frames[left]) return frames[left];
      if (right < total && frames[right]) return frames[right];
      left--;
      right++;
    }
    return frames[0] || null;
  }, []);

  /**
   * Draws frame only when the index changes.
   * Debounced via requestAnimationFrame.
   */
  const requestDraw = useCallback((targetIdx: number) => {
    if (usingParticlesRef.current) return;

    // Draw only if frame changed or not drawn yet
    if (targetIdx === lastDrawnIndexRef.current) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const frame = getNearestLoadedFrame(targetIdx);
      if (frame) {
        drawOntoCanvas(frame);
        lastDrawnIndexRef.current = targetIdx;
      }
      rafIdRef.current = null;
    });
  }, [drawOntoCanvas, getNearestLoadedFrame]);

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas Resize handler (DPR capped at 2 to prevent excessive mobile VRAM)
  // ───────────────────────────────────────────────────────────────────────────
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    if (lastDrawnIndexRef.current >= 0) {
      const frame = getNearestLoadedFrame(lastDrawnIndexRef.current);
      if (frame) drawOntoCanvas(frame);
    }
  }, [drawOntoCanvas, getNearestLoadedFrame]);

  // ───────────────────────────────────────────────────────────────────────────
  // Fallback Particle Loop (Emergency only, no heavy blur/shadows)
  // ───────────────────────────────────────────────────────────────────────────
  const initParticles = useCallback((width: number, height: number) => {
    const count = 60;
    const colors = ["#4F9C8F", "#2ECC71", "#FFD166", "#EAF2F5"];
    const pts: Particle[] = [];

    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.4 + 0.2,
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

    ctx.fillStyle = "#0B0F14";
    ctx.fillRect(0, 0, width, height);

    // Simple geometric grid
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

    // Core Ring without heavy shadowBlur
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const pulse = Math.sin(Date.now() * 0.002) * 5;
    const dynamicRadius = baseRadius + pulse + progress * 40;

    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = "#4F9C8F";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central Brand Shield / Indicator
    ctx.font = `600 ${Math.max(14, Math.round(width * 0.016))}px Inter, sans-serif`;
    ctx.fillStyle = "#EAF2F5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FITFORGE", centerX, centerY - 10);

    const total = totalFramesRef.current;
    ctx.font = `400 ${Math.max(11, Math.round(width * 0.01))}px Inter, sans-serif`;
    ctx.fillStyle = "#8CA0AD";
    const frameNumber = Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
    ctx.fillText(`PHASE ${frameNumber + 1} / ${total}`, centerX, centerY + 14);

    // Particles
    const pts = particlesRef.current;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!prefersReducedMotion) {
        p.x += p.vx + velocity * 1.5;
        p.y += p.vy;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.baseAlpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    particleRafRef.current = requestAnimationFrame(runParticleLoop);
  }, [smoothProgress, smoothVelocity, prefersReducedMotion]);

  // ───────────────────────────────────────────────────────────────────────────
  // Frame Preloading Engine:
  // 1. Show frame 0 immediately.
  // 2. Preload remaining frames in background (6 at a time) with progress bar.
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    // Detect mobile viewport (max 800px, 60 frames) vs desktop (max 1280px, 100 frames)
    const isMobile = window.innerWidth < 800;
    const total = isMobile ? MOBILE_FRAMES : DESKTOP_FRAMES;
    const dir = isMobile ? MOBILE_DIR : DESKTOP_DIR;

    totalFramesRef.current = total;
    frameDirRef.current = dir;
    framesRef.current = new Array(total).fill(null);

    // Update progress bar UI directly without React state re-renders
    const updateProgressUI = (loaded: number, totalCount: number) => {
      const ratio = Math.min(1, loaded / totalCount);
      const pct = Math.round(ratio * 100);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${pct}%`;
      }

      if (loaded >= totalCount && progressContainerRef.current) {
        // Smoothly fade out progress bar when 100% complete
        progressContainerRef.current.style.opacity = "0";
        setTimeout(() => {
          if (progressContainerRef.current) {
            progressContainerRef.current.style.display = "none";
          }
        }, 500);
      }
    };

    // Preload background queue with concurrency limit of 6
    const startBackgroundPreload = () => {
      const queue: number[] = [];
      for (let i = 1; i < total; i++) {
        queue.push(i);
      }

      let activeDownloads = 0;
      let loadedCount = 1; // frame 0 is already counted

      const processQueue = () => {
        if (isCancelled) return;

        while (activeDownloads < CONCURRENCY_LIMIT && queue.length > 0) {
          const frameIdx = queue.shift()!;
          activeDownloads++;

          loadFrameAsset(`${dir}/frame_${frameIdx}.webp`)
            .then((drawable) => {
              if (isCancelled) return;
              framesRef.current[frameIdx] = drawable;
              loadedCount++;
              updateProgressUI(loadedCount, total);

              // If user is currently looking at this frame, draw it immediately!
              const currentTarget = targetIndexRef.current;
              if (currentTarget === frameIdx) {
                lastDrawnIndexRef.current = -1; // force redraw
                requestDraw(currentTarget);
              }
            })
            .catch(() => {
              // If single frame fails, advance count so progress bar doesn't stall
              loadedCount++;
              updateProgressUI(loadedCount, total);
            })
            .finally(() => {
              activeDownloads--;
              processQueue();
            });
        }
      };

      processQueue();
    };

    // 1. SHOW THE FIRST FRAME AT ONCE!
    loadFrameAsset(`${dir}/frame_0.webp`)
      .then((frame0) => {
        if (isCancelled) return;
        framesRef.current[0] = frame0;
        usingParticlesRef.current = false;

        // Immediately render frame 0 onto canvas
        requestDraw(0);
        updateProgressUI(1, total);

        // 2. Preload the rest in the background (6 at a time)
        startBackgroundPreload();
      })
      .catch((err) => {
        console.warn("[HeroCanvas] Initial frame 0 unavailable, engaging fallback:", err);
        // Fallback to particle mode if images cannot be loaded
        usingParticlesRef.current = true;
        if (canvasRef.current) {
          initParticles(canvasRef.current.width, canvasRef.current.height);
          particleRafRef.current = requestAnimationFrame(runParticleLoop);
        }
        if (progressContainerRef.current) {
          progressContainerRef.current.style.display = "none";
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [initParticles, requestDraw, runParticleLoop]);

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas initialization & Resize listener
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (particleRafRef.current !== null) cancelAnimationFrame(particleRafRef.current);
    };
  }, [handleResize]);

  // ───────────────────────────────────────────────────────────────────────────
  // Bi-Directional Scroll Listener: ZERO React state updates on scroll
  // Draw on canvas ONLY when frame index changes
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      const clamped = Math.min(1, Math.max(0, latest));
      const total = totalFramesRef.current;
      const targetIdx = Math.min(
        total - 1,
        Math.max(0, Math.round(clamped * (total - 1)))
      );

      targetIndexRef.current = targetIdx;
      requestDraw(targetIdx);
    });

    return () => {
      unsubscribe();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [smoothProgress, requestDraw]);

  // ───────────────────────────────────────────────────────────────────────────
  // Text Overlay Opacity & Transform Mappings (Transform + Opacity only)
  // ───────────────────────────────────────────────────────────────────────────
  // 1. "Every app rewards who already shows up." (0.03 - 0.23)
  const opacity1 = useTransform(smoothProgress, [0.03, 0.07, 0.19, 0.23], [0, 1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0.03, 0.07, 0.19, 0.23], [24, 0, 0, -24]);

  // 2. "We built the one that catches who's about to quit." (0.26 - 0.46)
  const opacity2 = useTransform(smoothProgress, [0.26, 0.30, 0.42, 0.46], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.26, 0.30, 0.42, 0.46], [24, 0, 0, -24]);

  // 3. "When risk goes up, we make the goal smaller — not bigger." (0.50 - 0.71)
  const opacity3 = useTransform(smoothProgress, [0.50, 0.54, 0.67, 0.71], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.50, 0.54, 0.67, 0.71], [24, 0, 0, -24]);

  // 4. "This is FitForge." + button (0.76 - 1.00)
  const opacity4 = useTransform(smoothProgress, [0.76, 0.81, 0.96, 1.0], [0, 1, 1, 1]);
  const y4 = useTransform(smoothProgress, [0.76, 0.81, 0.96, 1.0], [24, 0, 0, 0]);

  // Scroll indicator fade out (fades out by progress 0.08)
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
      {/* Non-Blocking Background Preload Indicator                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        ref={progressContainerRef}
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/95 px-4 py-1.5 text-xs font-mono text-[var(--ff-text-secondary)] shadow-lg transition-opacity duration-500"
        style={{ opacity: 1 }}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--ff-accent)] animate-pulse" />
        <span className="tracking-wide">PRELOADING FRAMES:</span>
        <span ref={progressTextRef} className="font-bold text-[var(--ff-accent)]">
          1%
        </span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--ff-bg-primary)] border border-[var(--ff-border)]">
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left bg-gradient-to-r from-[var(--ff-accent)] to-[var(--ff-risk-low)] transition-transform duration-150 ease-out"
            style={{ transform: "scaleX(0.01)" }}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Sticky Fullscreen Canvas Viewport                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Anti-gravity float wrapper: strictly transform */}
        <m.div
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
        </m.div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 1: 0.03 - 0.23                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity1} y={y1}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/95 px-4 py-1.5 text-xs text-[var(--ff-accent)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-accent)] animate-pulse" />
            The Fitness Paradigm
          </div>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance text-[var(--ff-text-primary)] max-w-4xl">
            Every app rewards who{" "}
            <span className="italic text-[var(--ff-accent)]">already shows up.</span>
          </h2>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Text Overlay 2: 0.26 - 0.46                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity2} y={y2}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/95 px-4 py-1.5 text-xs text-[var(--ff-risk-mid)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-risk-mid)] animate-pulse" />
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
        {/* Text Overlay 3: 0.50 - 0.71                                      */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity3} y={y3}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/95 px-4 py-1.5 text-xs text-[var(--ff-risk-low)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-risk-low)] animate-pulse" />
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
        {/* Text Overlay 4: 0.76 - 1.00 + CTA button                          */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <OverlaySection opacity={opacity4} y={y4} pointerEvents="auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/95 px-4 py-1.5 text-xs text-[var(--ff-gold)] mb-4">
            <span className="h-2 w-2 rounded-full bg-[var(--ff-gold)] animate-pulse" />
            SIH PS 26196 Platform
          </div>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--ff-text-primary)] mb-6">
            This is <span className="gradient-text italic">FitForge.</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToRiskEngine}
              type="button"
              className="group rounded-full bg-[var(--ff-accent)] hover:brightness-110 px-8 py-4 font-semibold text-[var(--ff-bg-primary)] transition-all flex items-center gap-2 text-base cursor-pointer"
            >
              <span>See Risk Engine</span>
              <span className="transition-transform group-hover:translate-y-1">↓</span>
            </button>

            <Link
              href="/dashboard"
              className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/90 hover:bg-[var(--ff-bg-secondary)] hover:border-[var(--ff-accent)]/50 px-8 py-4 font-semibold text-[var(--ff-text-primary)] transition-all flex items-center gap-2 text-base hover:scale-[1.02]"
            >
              <span>Student Tracking & Streaks →</span>
            </Link>
          </div>
        </OverlaySection>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Scroll Indicator (strictly opacity & transform)                  */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <m.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-[var(--ff-text-secondary)] font-mono"
        >
          <span>SCROLL TO EXPLORE</span>
          <div className="h-10 w-5 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/60 flex items-start justify-center p-1">
            <m.div
              animate={{ y: [0, 16, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="h-2 w-1.5 rounded-full bg-[var(--ff-accent)]"
            />
          </div>
        </m.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Overlay Section Component (transform + opacity only)
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
    <m.div
      style={{ opacity, y }}
      className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 ${
        pointerEvents === "auto" ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center max-w-4xl mx-auto">{children}</div>
    </m.div>
  );
}
