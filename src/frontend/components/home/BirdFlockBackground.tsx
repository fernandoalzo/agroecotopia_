"use client";

import { useEffect, useRef } from "react";
import logger from "@/utils/logger";

const log = logger.child("src/frontend/components/home/BirdFlockBackground.tsx");

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSpeed: number;
  maxForce: number;
  noiseAngle: number;
  noiseSpeed: number;
  noiseRadius: number;
  colorType: "primary" | "accent";
  opacity: number;
}

interface Attractor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  isMouseActive: boolean;
  angle: number;
}

export default function BirdFlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    log.info("Inicializando lienzo de partículas de colores (Swarm).");

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const parent = canvas.parentElement;
    
    // Stretch canvas to match full parent scrollable height
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = parent ? parent.scrollHeight : document.documentElement.scrollHeight);

    // Initialize particles across the full height
    const particlesCount = 50;
    const particles: Particle[] = [];
    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 5, // Varying sizes for depth perception
        maxSpeed: 1.5 + Math.random() * 1.5,
        maxForce: 0.03 + Math.random() * 0.03,
        noiseAngle: Math.random() * Math.PI * 2,
        noiseSpeed: 0.005 + Math.random() * 0.015,
        noiseRadius: 40 + Math.random() * 90, // Spread around cursor
        colorType: Math.random() > 0.4 ? "primary" : "accent", // Direct match to palette colors
        opacity: 0.2 + Math.random() * 0.35, // Soft opacity blending
      });
    }

    // Initialize attractor
    const attractor: Attractor = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      targetX: width / 2,
      targetY: height / 2,
      isMouseActive: false,
      angle: Math.random() * Math.PI * 2,
    };

    let lastMouseMoveTime = Date.now();
    const mouseIdleThreshold = 4000;

    let currentClientX = width / 2;
    let currentClientY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      currentClientX = e.clientX;
      currentClientY = e.clientY;
      attractor.targetX = currentClientX;
      attractor.targetY = currentClientY + window.scrollY;
      attractor.isMouseActive = true;
      lastMouseMoveTime = Date.now();
    };

    const handleScroll = () => {
      if (attractor.isMouseActive) {
        attractor.targetX = currentClientX;
        attractor.targetY = currentClientY + window.scrollY;
      }
    };

    const handleMouseLeave = () => {
      attractor.isMouseActive = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = parent ? parent.scrollHeight : document.documentElement.scrollHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particles simulation and rendering loop
    const updateSimulation = () => {
      const isDark = document.documentElement.classList.contains("dark");
      
      // Clear viewport area completely to avoid any trailing artifacts
      const clearMargin = 200;
      const clearY = Math.max(0, window.scrollY - clearMargin);
      const clearH = Math.min(height - clearY, window.innerHeight + clearMargin * 2);
      ctx.clearRect(0, clearY, width, clearH);

      // 1. Update Attractor position
      const now = Date.now();
      if (attractor.isMouseActive && now - lastMouseMoveTime > mouseIdleThreshold) {
        attractor.isMouseActive = false;
      }

      if (attractor.isMouseActive) {
        attractor.x += (attractor.targetX - attractor.x) * 0.08;
        attractor.y += (attractor.targetY - attractor.y) * 0.08;
      } else {
        attractor.angle += (Math.random() - 0.5) * 0.22;
        const speed = 1.8;
        attractor.vx = Math.cos(attractor.angle) * speed;
        attractor.vy = Math.sin(attractor.angle) * speed;

        // Boundaries matching scroll viewport
        const minY = window.scrollY + 80;
        const maxY = window.scrollY + window.innerHeight - 80;
        const minX = 80;
        const maxX = width - 80;

        if (attractor.x < minX || attractor.x > maxX || attractor.y < minY || attractor.y > maxY) {
          const centerY = window.scrollY + window.innerHeight / 2;
          const centerX = width / 2;
          const angleToCenter = Math.atan2(centerY - attractor.y, centerX - attractor.x);
          attractor.angle = attractor.angle * 0.75 + angleToCenter * 0.25;
        }

        // Fast catch-up
        const centerY = window.scrollY + window.innerHeight / 2;
        if (Math.abs(attractor.y - centerY) > window.innerHeight * 1.2) {
          attractor.y += (centerY - attractor.y) * 0.05;
        }

        attractor.x += attractor.vx;
        attractor.y += attractor.vy;
      }

      // 2. Physics & Flocking for Swarm Particles
      const separationRadius = 40;
      const neighborRadius = 80;
      const steerCap = 0.08;

      const wSep = 2.4;
      const wAli = 1.0;
      const wCoh = 0.5;
      const wAtt = 1.0;
      const wBound = 1.5;
      const separationRadiusSq = separationRadius * separationRadius;
      const neighborRadiusSq = neighborRadius * neighborRadius;

      // Viewport bounds for culling offscreen drawing operations
      const drawMinY = window.scrollY - 50;
      const drawMaxY = window.scrollY + window.innerHeight + 50;

      // Track if we need to reset canvas shadow parameters at the end of the frame
      let shadowStateActive = false;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0, aliCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;

        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          // Separation check using distance squared
          if (distSq < separationRadiusSq) {
            let dist = Math.sqrt(distSq);
            if (dist === 0) dist = 0.1;
            const force = (separationRadius - dist) / separationRadius;
            sepX += (dx / dist) * force;
            sepY += (dy / dist) * force;
            sepCount++;
          }

          // Neighbor check using distance squared
          if (distSq < neighborRadiusSq) {
            let dist = Math.sqrt(distSq);
            if (dist === 0) dist = 0.1;
            aliX += p2.vx;
            aliY += p2.vy;
            aliCount++;
            cohX += p2.x;
            cohY += p2.y;
            cohCount++;
          }
        }

        // Steer separate (Reynolds: desired velocity - current velocity)
        let steerSepX = 0, steerSepY = 0;
        if (sepCount > 0) {
          const avgX = sepX / sepCount, avgY = sepY / sepCount;
          const mag = Math.sqrt(avgX * avgX + avgY * avgY);
          if (mag > 0) {
            steerSepX = (avgX / mag) * p1.maxSpeed - p1.vx;
            steerSepY = (avgY / mag) * p1.maxSpeed - p1.vy;
          }
        }
        // Inline clamp
        const sepMag = Math.sqrt(steerSepX * steerSepX + steerSepY * steerSepY);
        if (sepMag > steerCap && sepMag > 0) {
          steerSepX = (steerSepX / sepMag) * steerCap;
          steerSepY = (steerSepY / sepMag) * steerCap;
        }

        // Steer align (Reynolds: desired velocity - current velocity)
        let steerAliX = 0, steerAliY = 0;
        if (aliCount > 0) {
          const avgVx = aliX / aliCount, avgVy = aliY / aliCount;
          const mag = Math.sqrt(avgVx * avgVx + avgVy * avgVy);
          if (mag > 0) {
            steerAliX = (avgVx / mag) * p1.maxSpeed - p1.vx;
            steerAliY = (avgVy / mag) * p1.maxSpeed - p1.vy;
          }
        }
        // Inline clamp
        const aliMag = Math.sqrt(steerAliX * steerAliX + steerAliY * steerAliY);
        if (aliMag > steerCap && aliMag > 0) {
          steerAliX = (steerAliX / aliMag) * steerCap;
          steerAliY = (steerAliY / aliMag) * steerCap;
        }

        // Steer cohere (Reynolds: desired velocity - current velocity)
        let steerCohX = 0, steerCohY = 0;
        if (cohCount > 0) {
          const cx = cohX / cohCount, cy = cohY / cohCount;
          const dx = cx - p1.x, dy = cy - p1.y;
          const mag = Math.sqrt(dx * dx + dy * dy);
          if (mag > 0) {
            steerCohX = (dx / mag) * p1.maxSpeed - p1.vx;
            steerCohY = (dy / mag) * p1.maxSpeed - p1.vy;
          }
        }
        // Inline clamp
        const cohMag = Math.sqrt(steerCohX * steerCohX + steerCohY * steerCohY);
        if (cohMag > steerCap && cohMag > 0) {
          steerCohX = (steerCohX / cohMag) * steerCap;
          steerCohY = (steerCohY / cohMag) * steerCap;
        }

        // Attractor steering with dispersion
        p1.noiseAngle += p1.noiseSpeed;
        const offX = Math.cos(p1.noiseAngle) * p1.noiseRadius;
        const offY = Math.sin(p1.noiseAngle) * p1.noiseRadius;

        const tgtX = attractor.x + offX;
        const tgtY = attractor.y + offY;
        const toAX = tgtX - p1.x, toAY = tgtY - p1.y;
        const dA = Math.sqrt(toAX * toAX + toAY * toAY);
        let steerAttX = 0, steerAttY = 0;
        if (dA > 0) {
          steerAttX = (toAX / dA) * p1.maxSpeed - p1.vx;
          steerAttY = (toAY / dA) * p1.maxSpeed - p1.vy;
        }
        // Inline clamp
        const attMag = Math.sqrt(steerAttX * steerAttX + steerAttY * steerAttY);
        if (attMag > steerCap && attMag > 0) {
          steerAttX = (steerAttX / attMag) * steerCap;
          steerAttY = (steerAttY / attMag) * steerCap;
        }

        // Steer boundaries
        let steerBoundX = 0, steerBoundY = 0;
        const screenMargin = 80;
        if (p1.x < screenMargin) steerBoundX = p1.maxSpeed - p1.vx;
        else if (p1.x > width - screenMargin) steerBoundX = -p1.maxSpeed - p1.vx;
        if (p1.y < screenMargin) steerBoundY = p1.maxSpeed - p1.vy;
        else if (p1.y > height - screenMargin) steerBoundY = -p1.maxSpeed - p1.vy;
        // Inline clamp
        const boundMag = Math.sqrt(steerBoundX * steerBoundX + steerBoundY * steerBoundY);
        if (boundMag > steerCap && boundMag > 0) {
          steerBoundX = (steerBoundX / boundMag) * steerCap;
          steerBoundY = (steerBoundY / boundMag) * steerCap;
        }

        // Physics update
        let accX = steerSepX * wSep + steerAliX * wAli + steerCohX * wCoh + steerAttX * wAtt + steerBoundX * wBound;
        let accY = steerSepY * wSep + steerAliY * wAli + steerCohY * wCoh + steerAttY * wAtt + steerBoundY * wBound;

        const accMag = Math.sqrt(accX * accX + accY * accY);
        if (accMag > p1.maxForce) {
          accX = (accX / accMag) * p1.maxForce;
          accY = (accY / accMag) * p1.maxForce;
        }

        p1.vx += accX;
        p1.vy += accY;

        const speed = Math.sqrt(p1.vx * p1.vx + p1.vy * p1.vy);
        if (speed > p1.maxSpeed) {
          p1.vx = (p1.vx / speed) * p1.maxSpeed;
          p1.vy = (p1.vy / speed) * p1.maxSpeed;
        }

        p1.x += p1.vx;
        p1.y += p1.vy;

        // 3. Render Particle (Cull drawing if offscreen to optimize GPU)
        if (p1.y >= drawMinY && p1.y <= drawMaxY) {
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);

          let colorStr = "";
          if (isDark) {
            if (p1.colorType === "primary") {
              colorStr = `rgba(110, 231, 183, ${p1.opacity})`;
              ctx.shadowColor = `rgba(110, 231, 183, 0.45)`;
            } else {
              colorStr = `rgba(253, 186, 116, ${p1.opacity})`;
              ctx.shadowColor = `rgba(253, 186, 116, 0.45)`;
            }
            ctx.shadowBlur = 8;
            shadowStateActive = true;
          } else {
            if (p1.colorType === "primary") {
              colorStr = `rgba(38, 76, 57, ${p1.opacity})`;
            } else {
              colorStr = `rgba(125, 78, 48, ${p1.opacity})`;
            }
            // Disable shadow if clear/light mode
            if (shadowStateActive) {
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              shadowStateActive = false;
            }
          }

          ctx.fillStyle = colorStr;
          ctx.fill();
        }
      }

      // Cleanup context shadow state once at the end of the frame
      if (shadowStateActive) {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(updateSimulation);
    };

    updateSimulation();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ display: "block" }}
    />
  );
}
