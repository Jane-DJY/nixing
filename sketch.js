const W = 540;
const H = 720;
const FISH_COUNT = 136;
const ESCAPE_PERIOD = 18000;
const CAVE = { cx: W * 0.52, cy: H * 0.34, rx: 306, ry: 430 };

const fishes = [];
const brushMarks = [];
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
  buildFishes();
  buildBrushMarks();
  startedAt = millis();
}

function draw() {
  const now = millis() - startedAt;
  const cycle = floor(now / ESCAPE_PERIOD);
  const cycleT = (now % ESCAPE_PERIOD) / ESCAPE_PERIOD;
  const escaperIndex = (cycle * 29 + 17) % fishes.length;

  drawWaterGround(now);
  drawCave(now);
  drawVortexBrushes(now);

  for (let i = 0; i < fishes.length; i++) {
    const fish = fishes[i];
    if (i === escaperIndex && cycleT > 0.66) {
      drawEscapingFish(fish, now, cycle, cycleT);
    } else {
      drawFishAt(orbitPose(fish, now), fish, now, 1);
    }
  }

  drawWaterGrain(now);
}

function mousePressed() {
  startedAt = millis();
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveCanvas("nixing-fish", "png");
  }
}

function buildFishes() {
  for (let i = 0; i < FISH_COUNT; i++) {
    const outerBias = pow(random(), 0.32);
    fishes.push({
      radius: lerp(0.26, 1.03, outerBias),
      theta: random(TWO_PI),
      angularSpeed: random(0.00015, 0.00042),
      radialWobble: random(0.004, 0.022),
      wobbleSpeed: random(0.00016, 0.00044),
      size: random(0.82, 1.28),
      bodyLen: random(34, 82),
      bodyWide: random(4.2, 10.4),
      phase: random(TWO_PI),
      alpha: random(42, 152),
      hue: randomBlue(),
      tail: random(0.65, 1.25),
      smear: random(0.45, 1.2),
      seed: random(1000)
    });
  }
}

function buildBrushMarks() {
  for (let i = 0; i < 360; i++) {
    const r = pow(random(), 0.26);
    const radius = random(0.1, 1.1) * r + 0.02;
    const outer = constrain(map(radius, 0.18, 1.1, 0, 1), 0, 1);
    brushMarks.push({
      radius,
      theta: random(TWO_PI),
      speed: random(0.000035, 0.00016),
      len: random(0.08, 0.24) + outer * random(0.16, 0.48),
      weight: random(2.2, 7.5) + outer * random(2, 9),
      alpha: random(8, 34) + outer * random(8, 34),
      offset: random(-0.018, 0.018),
      hue: randomBrushBlue(),
      phase: random(TWO_PI)
    });
  }
}

function randomBlue() {
  const palette = [
    [116, 226, 236],
    [84, 203, 225],
    [55, 168, 211],
    [30, 132, 196],
    [19, 91, 164],
    [170, 240, 244],
    [10, 70, 142]
  ];
  return random(palette);
}

function randomBrushBlue() {
  const palette = [
    [185, 244, 250],
    [130, 226, 242],
    [77, 190, 226],
    [24, 142, 205],
    [9, 79, 161],
    [4, 43, 120]
  ];
  return random(palette);
}

function orbitPose(fish, now) {
  const theta = fish.theta + now * fish.angularSpeed;
  const radius = fish.radius + sin(now * fish.wobbleSpeed + fish.phase) * fish.radialWobble;
  const x = CAVE.cx + cos(theta) * CAVE.rx * radius;
  const y = CAVE.cy + sin(theta) * CAVE.ry * radius;
  const dx = -sin(theta) * CAVE.rx * radius;
  const dy = cos(theta) * CAVE.ry * radius;

  return {
    x,
    y,
    angle: atan2(dy, dx)
  };
}

function drawEscapingFish(fish, now, cycle, cycleT) {
  const start = orbitPose(fish, now);
  const exit = exitTarget(cycle);
  const leave = smoothstep(0.66, 0.96, cycleT);
  const fade = 1 - smoothstep(0.97, 1, cycleT);
  const x = lerp(start.x, exit.x, leave);
  const y = lerp(start.y, exit.y, leave);
  const angle = atan2(exit.y - start.y, exit.x - start.x);

  drawEscapeTrail(start, { x, y }, leave, fade);
  drawFishAt({ x, y, angle }, fish, now, 1.08 + fade * 0.18);
}

function exitTarget(cycle) {
  const a = [-0.15, -1.2, 2.72, 1.4][cycle % 4];
  return {
    x: CAVE.cx + cos(a) * (CAVE.rx + 78),
    y: CAVE.cy + sin(a) * (CAVE.ry + 68)
  };
}

function drawEscapeTrail(from, to, amount, fade) {
  noStroke();
  for (let i = 0; i < 22; i++) {
    const u = i / 21;
    if (u > amount) break;
    fill(132, 230, 238, 10 * u * fade);
    ellipse(lerp(from.x, to.x, u), lerp(from.y, to.y, u), 12, 2.2);
  }
}

function drawWaterGround(now) {
  background(6, 28, 88);

  noStroke();
  for (let i = 92; i >= 0; i--) {
    const k = i / 92;
    fill(
      lerp(210, 10, k),
      lerp(247, 86, k),
      lerp(250, 178, k),
      7.4
    );
    ellipse(
      CAVE.cx + sin(i * 0.28) * 8,
      CAVE.cy + cos(i * 0.23) * 6,
      76 + i * 8.4,
      88 + i * 10.2
    );
  }

  for (let i = 0; i < 70; i++) {
    const k = i / 69;
    fill(1, 15, 68, 2.3 * k);
    ellipse(CAVE.cx, CAVE.cy + 92, 360 + i * 12, 520 + i * 14);
  }

  for (let y = 0; y < H; y += 2) {
    const n = noise(y * 0.014, now * 0.00006);
    stroke(40 + n * 34, 142 + n * 52, 194 + n * 44, 13);
    line(0, y, W, y + n * 2.0);
  }

  noStroke();
}

function drawCave(now) {
  noStroke();

  for (let i = 72; i >= 0; i--) {
    const k = i / 72;
    const wobbleX = noise(i * 0.72, now * 0.00004) * 16 - 8;
    const wobbleY = noise(i * 0.93, now * 0.00004) * 18 - 9;
    fill(0, 20, 82, 0.55 + k * 1.55);
    ellipse(CAVE.cx + wobbleX, CAVE.cy + wobbleY, CAVE.rx * 1.8 + i * 9, CAVE.ry * 1.8 + i * 10);
  }

  for (let i = 64; i >= 0; i--) {
    const k = i / 64;
    fill(127, 222, 238, 3.8 * (1 - k));
    ellipse(
      CAVE.cx + noise(i * 1.31, now * 0.00005) * 12 - 6,
      CAVE.cy + noise(i * 1.77, now * 0.00005) * 16 - 8,
      86 + i * 7.2,
      98 + i * 8.2
    );
  }

  for (let i = 42; i >= 0; i--) {
    const k = i / 42;
    fill(220, 249, 250, 4.8 * (1 - k));
    ellipse(
      CAVE.cx + noise(i * 2.4, now * 0.00005) * 9 - 4.5,
      CAVE.cy + noise(i * 2.9, now * 0.00005) * 12 - 6,
      34 + i * 5.2,
      38 + i * 5.7
    );
  }

  for (let i = 0; i < 96; i++) {
    const a = i * 0.42 + now * 0.000035;
    const r = map(i, 0, 95, 0.18, 1.08);
    noFill();
    stroke(188, 239, 246, 8);
    strokeWeight(map(i, 0, 95, 0.8, 2.4));
    arc(CAVE.cx, CAVE.cy, CAVE.rx * 2 * r, CAVE.ry * 2 * r, a, a + 0.08 + i * 0.002);
  }
  noStroke();
}

function drawVortexBrushes(now) {
  noFill();
  strokeCap(ROUND);

  for (const mark of brushMarks) {
    const t = mark.theta + now * mark.speed + sin(now * 0.00022 + mark.phase) * 0.025;
    const r = mark.radius + sin(now * 0.00012 + mark.phase) * mark.offset;
    const w = CAVE.rx * 2 * r;
    const h = CAVE.ry * 2 * r;
    const c = mark.hue;
    const centerFade = constrain(map(r, 0.12, 0.55, 0.42, 1), 0.42, 1);
    const bottomBoost = constrain(map(CAVE.cy + sin(t) * CAVE.ry * r, H * 0.4, H, 0.75, 1.36), 0.75, 1.36);

    stroke(c[0], c[1], c[2], mark.alpha * centerFade * bottomBoost);
    strokeWeight(mark.weight);
    arc(CAVE.cx, CAVE.cy, w, h, t, t + mark.len);

    stroke(225, 252, 253, mark.alpha * 0.24 * bottomBoost);
    strokeWeight(max(1, mark.weight * 0.32));
    arc(CAVE.cx + mark.weight * 0.14, CAVE.cy - mark.weight * 0.1, w, h, t + mark.len * 0.08, t + mark.len * 0.72);
  }

  strokeCap(SQUARE);
  noStroke();
}

function drawWaterGrain(now) {
  noStroke();
  for (let i = 0; i < 2200; i++) {
    const x = (i * 37 + noise(i, now * 0.0001) * 9) % W;
    const y = (i * 91 + now * 0.012) % H;
    const d = dist(x, y, CAVE.cx, CAVE.cy);
    const centerBoost = constrain(map(d, 230, 0, 0, 13), 0, 13);
    fill(228, 252, 252, (i % 7 === 0 ? 18 : 5) + centerBoost);
    ellipse(x, y, i % 11 === 0 ? 1.6 : 0.8, i % 11 === 0 ? 1.2 : 0.6);
  }

  for (let i = 0; i < 210; i++) {
    const a = i * 2.399;
    const r = sqrt((i * 47) % 100 / 100);
    const x = CAVE.cx + cos(a) * CAVE.rx * 0.72 * r;
    const y = CAVE.cy + sin(a) * CAVE.ry * 0.56 * r;
    fill(241, 255, 252, 14);
    ellipse(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 1.6 : 0.8);
  }

  for (let i = 0; i < 320; i++) {
    const a = i * 2.17 + noise(i * 0.2) * 0.8;
    const r = sqrt((i * 61) % 100 / 100);
    const x = CAVE.cx + cos(a) * 128 * r;
    const y = CAVE.cy + sin(a) * 118 * r;
    fill(239, 254, 252, i % 6 === 0 ? 20 : 9);
    ellipse(x, y, i % 8 === 0 ? 2.1 : 0.9, i % 8 === 0 ? 1.5 : 0.7);
  }
}

function drawFishAt(pose, fish, now, alphaScale) {
  push();
  translate(pose.x, pose.y);
  rotate(pose.angle);
  scale(fish.size);

  const wag = sin(now * 0.011 + fish.phase) * fish.tail;
  const fishAlpha = fish.alpha * alphaScale;
  const len = fish.bodyLen;
  const wide = fish.bodyWide;
  const c = fish.hue;

  noStroke();

  for (let i = 5; i >= 0; i--) {
    const spread = i / 4;
    const jitter = (noise(fish.seed, i, now * 0.00008) - 0.5) * wide * 0.55;
    fill(c[0], c[1], c[2], fishAlpha * (0.085 + i * 0.025));
    beginShape();
    vertex(-len * (0.54 + spread * 0.36), jitter);
    bezierVertex(-len * 0.36, -wide * (0.66 + spread * 0.1), len * 0.16, -wide * (0.62 + spread * 0.08), len * (0.5 + spread * 0.02), jitter * 0.18);
    bezierVertex(len * 0.12, wide * (0.64 + spread * 0.08), -len * 0.34, wide * (0.7 + spread * 0.1), -len * (0.54 + spread * 0.36), jitter);
    endShape(CLOSE);
  }

  fill(min(c[0] + 84, 240), min(c[1] + 46, 255), min(c[2] + 32, 255), fishAlpha * 0.2);
  ellipse(len * 0.02, -wide * 0.14, len * 0.78, wide * 0.58);

  fill(c[0], c[1], c[2], fishAlpha * 0.22);
  beginShape();
  vertex(-len * 0.34, 0);
  bezierVertex(-len * 0.78, -wide * (0.3 + wag * 0.05), -len * (1.0 + fish.smear * 0.22), -wide * 0.08, -len * (1.26 + fish.smear * 0.3), 0);
  bezierVertex(-len * (1.0 + fish.smear * 0.22), wide * 0.1, -len * 0.74, wide * (0.32 - wag * 0.05), -len * 0.34, 0);
  endShape(CLOSE);

  strokeCap(ROUND);
  stroke(min(c[0] + 78, 235), min(c[1] + 52, 255), min(c[2] + 34, 255), fishAlpha * 0.26);
  strokeWeight(max(1.1, wide * 0.18));
  line(-len * 0.24, -wide * 0.16, len * 0.4, -wide * 0.18);
  noStroke();

  pop();
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
