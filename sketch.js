const W = 540;
const H = 720;
const WALKER_COUNT = 96;
const ESCAPE_PERIOD = 15000;
const RINK = { cx: W * 0.5, cy: H * 0.48, rx: 218, ry: 156 };
const INSIDE_MARGIN = 16;

const walkers = [];
let startedAt = 0;

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("stage");
  canvas.elt.style.setProperty("width", "100%", "important");
  canvas.elt.style.setProperty("height", "100%", "important");
  pixelDensity(1);
  frameRate(60);
  noStroke();

  randomSeed(314159);
  noiseSeed(271828);
  buildWalkers();
  startedAt = millis();
}

function draw() {
  const now = millis() - startedAt;
  const cycle = floor(now / ESCAPE_PERIOD);
  const cycleT = (now % ESCAPE_PERIOD) / ESCAPE_PERIOD;
  const escaperIndex = (cycle * 37 + 11) % walkers.length;

  drawCharcoalGround();
  drawSoftRink();

  for (let i = 0; i < walkers.length; i++) {
    if (i === escaperIndex) continue;
    const walker = walkers[i];
    const pose = trappedPose(walker, now);
    const walk = sin(now * walker.stride + walker.phase);
    drawWalker(pose.x, pose.y, walker.size, pose.angle, walk, {
      body: color(21, 23, 24, walker.alpha),
      shadow: color(11, 12, 12, walker.shadowAlpha),
      bold: false
    });
  }

  drawEscaper(walkers[escaperIndex], now, cycle, cycleT);
  drawRinkDust(now);
  drawVignette();
}

function mousePressed() {
  startedAt = millis();
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveCanvas("nixing-p5js", "png");
  }
}

function buildWalkers() {
  for (let i = 0; i < WALKER_COUNT; i++) {
    const pt = randomPointInRink(INSIDE_MARGIN + 10);
    const modeRoll = random();
    const mode = modeRoll < 0.36 ? "wander" : modeRoll < 0.68 ? "circle" : modeRoll < 0.9 ? "pace" : "pause";
    walkers.push({
      x: pt.x,
      y: pt.y,
      size: random(1.0, 1.55),
      mode,
      phase: random(TWO_PI),
      stride: random(0.007, 0.013),
      alpha: random(138, 215),
      shadowAlpha: random(34, 72),
      orbit: random(9, 32),
      orbitSpeed: random(0.00038, 0.00105) * (random() < 0.5 ? -1 : 1),
      paceAngle: random(TWO_PI),
      paceLength: random(13, 44),
      paceSpeed: random(0.001, 0.0022),
      wanderA: random(8, 30),
      wanderB: random(7, 28),
      turn: random(-0.4, 0.4)
    });
  }
}

function randomPointInRink(margin) {
  const a = random(TWO_PI);
  const r = sqrt(random());
  return {
    x: RINK.cx + cos(a) * (RINK.rx - margin) * r,
    y: RINK.cy + sin(a) * (RINK.ry - margin) * r
  };
}

function trappedPose(walker, now) {
  if (walker.mode === "circle") {
    const theta = walker.phase + now * walker.orbitSpeed;
    return confinePose({
      x: walker.x + cos(theta) * walker.orbit,
      y: walker.y + sin(theta) * walker.orbit,
      angle: theta + HALF_PI + (walker.orbitSpeed < 0 ? PI : 0)
    });
  }

  if (walker.mode === "pace") {
    const u = sin(walker.phase + now * walker.paceSpeed);
    const dir = u >= 0 ? walker.paceAngle : walker.paceAngle + PI;
    return confinePose({
      x: walker.x + cos(walker.paceAngle) * u * walker.paceLength,
      y: walker.y + sin(walker.paceAngle) * u * walker.paceLength,
      angle: dir + HALF_PI
    });
  }

  if (walker.mode === "pause") {
    return confinePose({
      x: walker.x + sin(now * 0.0011 + walker.phase) * 2.2,
      y: walker.y + cos(now * 0.0013 + walker.phase) * 1.8,
      angle: walker.turn
    });
  }

  const ax = sin(now * 0.001 + walker.phase) * walker.wanderA;
  const ay = cos(now * 0.00135 + walker.phase * 1.7) * walker.wanderB;
  const vx = cos(now * 0.001 + walker.phase) * walker.wanderA * 0.001;
  const vy = -sin(now * 0.00135 + walker.phase * 1.7) * walker.wanderB * 0.00135;
  return confinePose({
    x: walker.x + ax,
    y: walker.y + ay,
    angle: atan2(vy, vx) + HALF_PI
  });
}

function confinePose(pose) {
  const rx = RINK.rx - INSIDE_MARGIN;
  const ry = RINK.ry - INSIDE_MARGIN;
  const dx = pose.x - RINK.cx;
  const dy = pose.y - RINK.cy;
  const d = sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
  if (d <= 1) return pose;

  return {
    x: RINK.cx + dx / d,
    y: RINK.cy + dy / d,
    angle: pose.angle + PI * 0.15
  };
}

function drawEscaper(walker, now, cycle, cycleT) {
  const startPose = trappedPose(walker, now);
  const exit = exitTarget(cycle);
  const leave = smoothstep(0.54, 0.92, cycleT);
  const fade = 1 - smoothstep(0.98, 1, cycleT);
  const x = lerp(startPose.x, exit.x, leave);
  const y = lerp(startPose.y, exit.y, leave);
  const angle = atan2(exit.y - startPose.y, exit.x - startPose.x) + HALF_PI;
  const walk = sin(now * 0.013 + walker.phase);
  const alpha = (150 + 48 * smoothstep(0.48, 0.62, cycleT)) * fade;

  drawEscapeTrail(startPose, { x, y }, leave, fade);
  drawWalker(x, y, 1.44, angle, walk, {
    body: color(15, 17, 18, alpha),
    shadow: color(7, 8, 8, 68 * fade),
    bold: true
  });
}

function exitTarget(cycle) {
  const a = [-0.15, -1.5, 2.9, 1.35][cycle % 4];
  return {
    x: RINK.cx + cos(a) * (RINK.rx + 88),
    y: RINK.cy + sin(a) * (RINK.ry + 72)
  };
}

function drawEscapeTrail(from, to, amount, fade) {
  noStroke();
  for (let i = 0; i < 18; i++) {
    const u = i / 17;
    if (u > amount) break;
    const x = lerp(from.x, to.x, u);
    const y = lerp(from.y, to.y, u);
    fill(18, 19, 19, 24 * u * fade);
    ellipse(x + 5, y + 8, 5.5, 1.8);
  }
}

function drawCharcoalGround() {
  background(34, 39, 42);

  for (let y = 0; y < H; y += 4) {
    const n = noise(y * 0.018, frameCount * 0.002);
    stroke(60 + n * 25, 65 + n * 20, 67 + n * 18, 28);
    line(0, y, W, y + n * 2);
  }

  for (let i = 0; i < 420; i++) {
    stroke(235, 235, 225, 14);
    point((i * 37) % W, (i * 91 + frameCount * 0.12) % H);
  }
  noStroke();
}

function drawSoftRink() {
  noStroke();

  for (let i = 28; i >= 0; i--) {
    const k = i / 28;
    fill(222, 224, 219, 5 + (1 - k) * 9);
    ellipse(
      RINK.cx + noise(i * 1.7) * 8 - 4,
      RINK.cy + noise(i * 2.1) * 6 - 3,
      RINK.rx * 2 + i * 10,
      RINK.ry * 2 + i * 7
    );
  }

  fill(225, 226, 221, 232);
  ellipse(RINK.cx, RINK.cy, RINK.rx * 2, RINK.ry * 2);

  for (let i = 0; i < 40; i++) {
    const a = i / 39;
    stroke(10, 12, 14, 17 * (1 - a));
    strokeWeight(5 + i * 0.7);
    noFill();
    ellipse(
      RINK.cx + noise(i * 2.3, frameCount * 0.004) * 10 - 5,
      RINK.cy + noise(i * 3.1, frameCount * 0.004) * 8 - 4,
      RINK.rx * 2 + i * 4.4,
      RINK.ry * 2 + i * 3.2
    );
  }

  for (let i = 0; i < 46; i++) {
    stroke(186, 188, 183, 16);
    strokeWeight(1);
    const y = RINK.cy - RINK.ry + i * ((RINK.ry * 2) / 46);
    const half = RINK.rx * sqrt(max(0, 1 - sq((y - RINK.cy) / RINK.ry)));
    line(RINK.cx - half * 0.92, y, RINK.cx + half * 0.92, y + sin(i) * 1.2);
  }
  noStroke();
}

function drawRinkDust(now) {
  noStroke();
  for (let i = 0; i < 90; i++) {
    const a = i * 1.618 + now * 0.00003;
    const r = sqrt((i * 37) % 100 / 100);
    const x = RINK.cx + cos(a) * RINK.rx * r;
    const y = RINK.cy + sin(a) * RINK.ry * r;
    fill(245, 245, 238, 16);
    ellipse(x, y, 1.2, 0.8);
  }
}

function drawWalker(x, y, s, angle, walk, palette) {
  if (x < -36 || x > W + 36 || y < -36 || y > H + 36) return;

  drawWalkerShadow(x, y, s, palette.shadow, palette.bold);

  push();
  translate(x, y);
  rotate(angle);
  scale(s);

  stroke(palette.body);
  strokeWeight(palette.bold ? 1.5 : 1.05);
  strokeCap(ROUND);
  fill(palette.body);

  const swing = walk * 1.75;
  circle(0, -5.2, palette.bold ? 2.8 : 2.15);
  line(0, -3.1, 0, 3.2);
  line(0, -0.7, -2.0, 2.4 + swing * 0.45);
  line(0, -0.5, 2.0, 2.4 - swing * 0.45);
  line(0, 3.0, -1.55, 6.7 + swing);
  line(0, 3.0, 1.55, 6.7 - swing);
  line(0, -1.4, -1.55, 1.7 - swing * 0.55);
  line(0, -1.4, 1.55, 1.7 + swing * 0.55);

  pop();
}

function drawWalkerShadow(x, y, s, c, bold) {
  push();
  translate(x + 7.4 * s, y + 8.4 * s);
  rotate(Math.PI / 4);
  noStroke();
  fill(c);
  ellipse(0, 0, (bold ? 14 : 10) * s, (bold ? 3.6 : 2.7) * s);
  pop();
}

function drawVignette() {
  noStroke();
  for (let i = 0; i < 220; i++) {
    const x = (i * 31) % W;
    const y = (i * 67) % H;
    fill(0, 0, 0, 8);
    ellipse(x, y, 1.2, 1.2);
  }
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
