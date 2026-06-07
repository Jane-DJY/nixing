const W = 540;
const H = 720;
const DURATION = 18000;
const CROWD_COUNT = 520;

const FLOW = { x: 0.62, y: 0.78 };
const NORMAL = { x: -0.78, y: 0.62 };
const FLOW_ANGLE = Math.atan2(FLOW.y, FLOW.x) - Math.PI / 2;
const RED_ANGLE = FLOW_ANGLE + Math.PI;

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
  const p = ((millis() - startedAt) % DURATION) / DURATION;
  const t = easeInOutCubic(p);

  drawGround();
  drawFlowTexture(p);

  for (const walker of walkers) {
    const pos = walkerPoint(walker, p);
    const walk = sin(TWO_PI * (p * walker.stride + walker.phase));
    drawWalker(pos.x, pos.y, walker.size, FLOW_ANGLE + walker.turn, walk, {
      body: color(19, 22, 23, walker.alpha),
      shadow: color(20, 20, 18, walker.shadowAlpha),
      red: false
    });
  }

  drawRedTrail(t);
  drawRedWalker(t, p);
  drawMiddleCover(t, p);
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
  const clusters = [
    { x: 130, y: 120, sx: 82, sy: 90, n: 112 },
    { x: 285, y: 130, sx: 86, sy: 96, n: 104 },
    { x: 120, y: 285, sx: 82, sy: 118, n: 94 },
    { x: 135, y: 610, sx: 92, sy: 78, n: 112 },
    { x: 355, y: 610, sx: 62, sy: 78, n: 62 },
    { x: 315, y: 355, sx: 120, sy: 170, n: 36 }
  ];

  for (const cluster of clusters) {
    for (let i = 0; i < cluster.n; i++) {
      addWalker(
        cluster.x + randomGaussian() * cluster.sx,
        cluster.y + randomGaussian() * cluster.sy,
        random(0.86, 1.38)
      );
    }
  }

  while (walkers.length < CROWD_COUNT) {
    addWalker(random(-10, W + 10), random(10, H - 10), random(0.72, 1.12));
  }
}

function addWalker(x, y, size) {
  walkers.push({
    baseX: x,
    baseY: y,
    size,
    phase: random(),
    stride: random(5.2, 8.4),
    speed: random(0.55, 1.2),
    laneDrift: random(-12, 12),
    laneSpeed: random(0.6, 1.6),
    turn: random(-0.22, 0.22),
    alpha: random(135, 220),
    shadowAlpha: random(34, 72)
  });
}

function walkerPoint(walker, p) {
  const step = (((p * walker.speed + walker.phase) % 1) - 0.5) * 56;
  const lane = sin(TWO_PI * (p * walker.laneSpeed + walker.phase)) * walker.laneDrift;
  return {
    x: walker.baseX + FLOW.x * step + NORMAL.x * lane,
    y: walker.baseY + FLOW.y * step + NORMAL.y * lane
  };
}

function drawGround() {
  background(231, 229, 222);

  for (let y = 0; y < H; y += 5) {
    stroke(214, 211, 202, 20);
    strokeWeight(1);
    line(0, y + noise(y * 0.03, frameCount * 0.002) * 2, W, y);
  }

  for (let i = 0; i < 240; i++) {
    const x = (i * 47) % W;
    const y = (i * 83) % H;
    stroke(120, 116, 106, 15);
    point(x + noise(i, frameCount * 0.003) * 8, y);
  }

  noStroke();
}

function drawFlowTexture(p) {
  stroke(34, 33, 30, 13);
  strokeWeight(1);

  for (let i = -6; i < 26; i++) {
    const lane = i * 34;
    const offset = (p * 210 + i * 29) % 120;
    for (let s = -120 + offset; s < 900; s += 120) {
      const x = FLOW.x * s + NORMAL.x * lane;
      const y = FLOW.y * s + NORMAL.y * lane - 40;
      line(x, y, x + FLOW.x * 28, y + FLOW.y * 28);
    }
  }

  noStroke();
}

function drawWalker(x, y, s, angle, walk, palette) {
  if (x < -28 || x > W + 28 || y < -28 || y > H + 28) return;

  drawWalkerShadow(x, y, s, palette.shadow, palette.red);

  push();
  translate(x, y);
  rotate(angle);
  scale(s);

  stroke(palette.body);
  strokeWeight(palette.red ? 1.45 : 1.15);
  strokeCap(ROUND);
  fill(palette.body);

  const leg = 3.6;
  const arm = 3.0;
  const swing = walk * 1.9;

  circle(0, -5.2, palette.red ? 2.8 : 2.25);
  line(0, -3.1, 0, 3.4);
  line(0, -0.5, -2.2, 2.5 + swing * 0.45);
  line(0, -0.3, 2.1, 2.5 - swing * 0.45);
  line(0, 3.2, -1.6, 3.2 + leg + swing);
  line(0, 3.2, 1.7, 3.2 + leg - swing);
  line(0, -1.6, -1.6, -1.4 + arm - swing * 0.55);
  line(0, -1.6, 1.7, -1.4 + arm + swing * 0.55);

  pop();
}

function drawWalkerShadow(x, y, s, c, red) {
  push();
  translate(x + 7.5 * s, y + 9.5 * s);
  rotate(Math.PI / 4);
  noStroke();
  fill(c);
  ellipse(0, 0, (red ? 15 : 11) * s, (red ? 3.8 : 2.8) * s);
  pop();
}

function drawRedTrail(t) {
  const steps = 38;
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    if (u > t) break;
    const pt = redPoint(u);
    const a = map(i, 0, steps - 1, 8, 72) * smoothstep(0.05, 0.38, t);
    noStroke();
    fill(207, 45, 35, a);
    ellipse(pt.x + 8, pt.y + 9, 7, 2.2);
  }
}

function drawRedWalker(t, p) {
  const pt = redPoint(t);
  const buried = smoothstep(0.35, 0.5, t) * (1 - smoothstep(0.58, 0.76, t));
  const reveal = smoothstep(0.74, 0.96, t);
  const alpha = 245 - buried * 126 + reveal * 26;
  const walk = sin(TWO_PI * (p * 7.4 + 0.15));
  const size = 1.9 - buried * 0.22 + reveal * 0.1;

  drawWalker(pt.x, pt.y, size, RED_ANGLE, walk, {
    body: color(211, 45, 35, alpha),
    shadow: color(201, 54, 45, 74),
    red: true
  });
}

function drawMiddleCover(t, p) {
  const cover = smoothstep(0.34, 0.48, t) * (1 - smoothstep(0.58, 0.78, t));
  if (cover <= 0.01) return;

  const center = redPoint(t);
  for (let i = 0; i < 86; i++) {
    const lane = map(i % 17, 0, 16, -44, 48);
    const stream = map(floor(i / 17), 0, 5, -64, 64) + sin(p * TWO_PI + i) * 8;
    const x = center.x + FLOW.x * stream + NORMAL.x * lane;
    const y = center.y + FLOW.y * stream + NORMAL.y * lane;
    const walk = sin(TWO_PI * (p * (6 + (i % 5)) + i * 0.07));
    drawWalker(x, y, 1.05 + (i % 4) * 0.08, FLOW_ANGLE + randomFixed(i) * 0.3, walk, {
      body: color(12, 14, 15, 168 * cover),
      shadow: color(13, 13, 12, 56 * cover),
      red: false
    });
  }
}

function redPoint(t) {
  const x0 = W * 0.78;
  const y0 = H * 0.72;
  const x1 = W * 0.62;
  const y1 = H * 0.62;
  const x2 = W * 0.38;
  const y2 = H * 0.43;
  const x3 = W * 0.2;
  const y3 = H * 0.22;

  return {
    x: bezierPoint(x0, x1, x2, x3, t),
    y: bezierPoint(y0, y1, y2, y3, t)
  };
}

function drawVignette() {
  noFill();
  for (let i = 0; i < 54; i++) {
    stroke(26, 24, 20, i * 0.16);
    rect(i, i, W - i * 2, H - i * 2);
  }
  noStroke();
}

function randomFixed(i) {
  return noise(i * 19.19) - 0.5;
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
