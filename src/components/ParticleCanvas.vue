<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
let ctx = null;
let animationId = null;
let particles = [];
let mouse = { x: -9999, y: -9999 };
let width = 0;
let height = 0;
let isVisible = true;
let time = 0;

const COLORS = [
  { r: 255, g: 45, b: 149 },   // neon-pink
  { r: 0, g: 240, b: 255 },    // neon-cyan
  { r: 176, g: 38, b: 255 },   // neon-purple
  { r: 77, g: 124, b: 255 },   // neon-blue
  { r: 0, g: 255, b: 136 },    // neon-green
];

const MAGNET_RADIUS = 200;
const MAGNET_STRENGTH = 0.04;
const CONNECTION_DIST = 130;

function isMobile() {
  return window.innerWidth <= 768;
}

// Diamond shape target points for magnet mode
function getDiamondTargets(cx, cy, size, count) {
  const targets = [];
  const points = [
    { x: cx, y: cy - size },          // top
    { x: cx + size, y: cy },          // right
    { x: cx, y: cy + size },          // bottom
    { x: cx - size, y: cy },          // left
  ];
  const perSide = Math.floor(count / 4);
  for (let side = 0; side < 4; side++) {
    const a = points[side];
    const b = points[(side + 1) % 4];
    for (let i = 0; i < perSide; i++) {
      const t = i / perSide;
      targets.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
    }
  }
  // Fill center with a few sparkle points
  for (let i = targets.length; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = size * 0.3 * Math.random();
    targets.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  return targets;
}

function createParticles() {
  const count = isMobile() ? 50 : 140;
  particles = [];
  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      homeX: Math.random() * width,
      homeY: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.5 + 0.5,
      color,
      opacity: Math.random() * 0.6 + 0.3,
      phase: Math.random() * Math.PI * 2,  // for twinkle
    });
  }
}

function drawParticle(p) {
  const twinkle = 0.6 + 0.4 * Math.sin(time * 2 + p.phase);
  const alpha = p.opacity * twinkle;
  
  // Core dot
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
  ctx.fill();

  // Glow halo
  const glowR = p.radius * 4;
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
  glow.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.2})`);
  glow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawConnections() {
  const dist = isMobile() ? CONNECTION_DIST * 0.6 : CONNECTION_DIST;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < dist) {
        const alpha = (1 - d / dist) * 0.12;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        // Color the connection based on proximity to mouse
        const midX = (particles[i].x + particles[j].x) / 2;
        const midY = (particles[i].y + particles[j].y) / 2;
        const mouseDist = Math.sqrt((midX - mouse.x) ** 2 + (midY - mouse.y) ** 2);
        if (mouseDist < MAGNET_RADIUS * 1.5) {
          ctx.strokeStyle = `rgba(255, 45, 149, ${alpha * 2})`;
        } else {
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        }
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }
}

function updateParticles() {
  const mouseActive = mouse.x > -999 && mouse.y > -999;
  
  // Generate diamond targets around mouse
  let targets = null;
  if (mouseActive) {
    targets = getDiamondTargets(mouse.x, mouse.y, 80, particles.length);
  }
  
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (mouseActive && dist < MAGNET_RADIUS && targets) {
      // ATTRACT toward diamond shape target
      const target = targets[i % targets.length];
      const tx = target.x - p.x;
      const ty = target.y - p.y;
      const strength = MAGNET_STRENGTH * (1 - dist / MAGNET_RADIUS);
      p.vx += tx * strength;
      p.vy += ty * strength;
      
      // Boost glow near mouse
      p.opacity = Math.min(1, p.opacity + 0.02);
    } else {
      // Drift freely with gentle return to home
      p.vx += (p.homeX - p.x) * 0.0003;
      p.vy += (p.homeY - p.y) * 0.0003;
      
      // Subtle wave motion
      p.vx += Math.sin(time * 0.5 + p.phase) * 0.01;
      p.vy += Math.cos(time * 0.3 + p.phase) * 0.01;
      
      // Restore default opacity
      p.opacity += (0.4 - p.opacity) * 0.02;
    }

    // Damping
    p.vx *= 0.96;
    p.vy *= 0.96;

    p.x += p.vx;
    p.y += p.vy;

    // Wrap edges
    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
    if (p.y < -20) p.y = height + 20;
    if (p.y > height + 20) p.y = -20;
  }
}

function animate() {
  if (!isVisible || !ctx) return;
  time += 0.016;
  ctx.clearRect(0, 0, width, height);
  updateParticles();
  drawConnections();
  for (const p of particles) {
    drawParticle(p);
  }
  animationId = requestAnimationFrame(animate);
}

function handleResize() {
  if (!canvas.value) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.value.width = width;
  canvas.value.height = height;
  createParticles();
}

function handleMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function handleMouseLeave() {
  mouse.x = -9999;
  mouse.y = -9999;
}

function handleVisibility() {
  if (document.hidden) {
    isVisible = false;
    if (animationId) cancelAnimationFrame(animationId);
  } else {
    isVisible = true;
    animate();
  }
}

onMounted(() => {
  if (!canvas.value) return;
  ctx = canvas.value.getContext('2d');
  handleResize();

  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('visibilitychange', handleVisibility);

  animate();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseleave', handleMouseLeave);
  document.removeEventListener('visibilitychange', handleVisibility);
});
</script>

<template>
  <canvas
    ref="canvas"
    class="particle-canvas"
    aria-hidden="true"
  />
</template>
