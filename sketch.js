const W = 540;
const H = 720;
const WALKER_COUNT = 210;
const ESCAPE_PERIOD = 5600;
const BOX = { x: 66, y: 146, size: 408 };
const INSIDE_PAD = 16;

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
  const escaperIndex = (cycle * 47 + 19) % walkers.length;

  drawGround();
  drawBox();

  for (let i = 0; i < walkers.length; i++) {
    if (i === escaperIndex) continue;
    const walker = walkers[i];
    const pose = trappedPose(walker, now);
    const walk = sin(now * walker.stride + walker.phase);
    drawWalker(pose.x, pose.y, walker.size, pose.angle, walk, {
      body: color(18, 21, 22, walker.alpha),
      shadow: color(18, 18, 16, walker.shadowAlpha),
      red: false
    });
  }

  drawEscaper(walkers[escaperIndex], now, cycle, cycleT);
  drawBoxRim();
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
    const modeRoll = random();
    const mode = modeRoll < 0.42 ? "wander" : modeRoll < 0.72 ? "circle" : modeRoll < 0.9 ? "pace" : "pause";
    walkers.push({
      x: random(BOX.x + 34, BOX.x + BOX.size - 34),
      y: random(BOX.y + 34, BOX.y + BOX.size - 34),
      size: random(0.82, 1.42),
      mode,
      phase: random(TWO_PI),
      stride: random(0.008, 0.014),
      alpha: random(145, 225),
      shadowAlpha: random(28, 62),
      orbit: random(8, 28),
      orbitSpeed: random(0.00045, 0.0012) * (random() < 0.5 ? -1 : 1),
      paceAngle: random(TWO_PI),
      paceLength: random(12, 38),
      paceSpeed: random(0.0012, 0.0024),
      wanderA: random(7, 26),
      wanderB: random(8, 30),
      turn: random(-0.4, 0.4)
    });
  }
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
    const jx = sin(now * 0.0011 + walker.phase) * 2.4;
    const jy = cos(now * 0.0013 + walker.phase) * 2.0;
    return confinePose({
      x: walker.x + jx,
      y: walker.y + jy,
      angle: walker.turn
    });
  }

  const ax = sin(now * 0.0011 + walker.phase) * walker.wanderA;
  const ay = cos(now * 0.0014 + walker.phase * 1.7) * walker.wanderB;
  const vx = cos(now * 0.0011 + walker.phase) * walker.wanderA * 0.0011;
  const vy = -sin(now * 0.0014 + walker.phase * 1.7) * walker.wanderB * 0.0014;
  return confinePose({
    x: walker.x + ax,
    y: walker.y + ay,
    angle: atan2(vy, vx) + HALF_PI
  });
}

function confinePose(pose) {
  return {
    x: constrain(pose.x, BOX.x + INSIDE_PAD, BOX.x + BOX.size - INSIDE_PAD),
    y: constrain(pose.y, BOX.y + INSIDE_PAD, BOX.y + BOX.size - INSIDE_PAD),
    angle: pose.angle
  };
}

function drawEscaper(walker, now, cycle, cycleT) {
  const startPose = trappedPose(walker, now);
  const exit = exitTarget(cycle);
  const hold = smoothstep(0, 0.18, cycleT);
  const leave = smoothstep(0.18, 0.82, cycleT);
  const fade = 1 - smoothstep(0.86, 1, cycleT);
  const x = lerp(startPose.x, exit.x, leave);
  const y = lerp(startPose.y, exit.y, leave);
  const angle = atan2(exit.y - startPose.y, exit.x - startPose.x) + HALF_PI;
  const walk = sin(now * 0.015 + walker.phase);
  const alpha = (170 + hold * 80) * fade;

  drawEscapeTrail(startPose, { x, y }, leave, fade);
  drawWalker(x, y, 1.45, angle, walk, {
    body: color(211, 45, 35, alpha),
    shadow: color(201, 54, 45, 62 * fade),
    red: true
  });
}

function exitTarget(cycle) {
  const edge = cycle % 4;
  if (edge === 0) return { x: BOX.x + BOX.size + 70, y: BOX.y + BOX.size * 0.28 };
  if (edge === 1) return { x: BOX.x + BOX.size * 0.24, y: BOX.y - 68 };
  if (edge === 2) return { x: BOX.x - 68, y: BOX.y + BOX.size * 0.72 };
  return { x: BOX.x + BOX.size * 0.78, y: BOX.y + BOX.size + 72 };
}

function drawEscapeTrail(from, to, amount, fade) {
  const steps = 18;
  noStroke();
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    if (u > amount) break;
    const x = lerp(from.x, to.x, u);
    const y = lerp(from.y, to.y, u);
    fill(210, 56, 46, 44 * u * fade);
    ellipse(x + 5, y + 8, 5.5, 1.8);
  }
}

function drawGround() {
  background(231, 229, 222);

  for (let y = 0; y < H; y += 5) {
    stroke(213, 210, 201, 22);
    strokeWeight(1);
    line(0, y + noise(y * 0.03, frameCount * 0.002) * 2, W, y);
  }

  for (let i = 0; i < 260; i++) {
    const x = (i * 47) % W;
    const y = (i * 83) % H;
    stroke(120, 116, 106, 12);
    point(x + noise(i, frameCount * 0.003) * 8, y);
  }

  noStroke();
}

function drawBox() {
  noStroke();
  fill(246, 244, 237, 142);
  rect(BOX.x, BOX.y, BOX.size, BOX.size);

  stroke(52, 50, 45, 78);
  strokeWeight(1.2);
  noFill();
  rect(BOX.x, BOX.y, BOX.size, BOX.size);

  stroke(52, 50, 45, 20);
  for (let i = 1; i < 7; i++) {
    const x = BOX.x + (BOX.size / 7) * i;
    const y = BOX.y + (BOX.size / 7) * i;
    line(x, BOX.y, x, BOX.y + BOX.size);
    line(BOX.x, y, BOX.x + BOX.size, y);
  }
  noStroke();
}

function drawBoxRim() {
  noFill();
  stroke(22, 20, 18, 112);
  strokeWeight(1.6);
  rect(BOX.x, BOX.y, BOX.size, BOX.size);

  stroke(255, 255, 250, 70);
  strokeWeight(1);
  rect(BOX.x + 3, BOX.y + 3, BOX.size - 6, BOX.size - 6);
  noStroke();
}

function drawWalker(x, y, s, angle, walk, palette) {
  if (x < -36 || x > W + 36 || y < -36 || y > H + 36) return;

  drawWalkerShadow(x, y, s, palette.shadow, palette.red);

  push();
  translate(x, y);
  rotate(angle);
  scale(s);

  stroke(palette.body);
  strokeWeight(palette.red ? 1.55 : 1.1);
  strokeCap(ROUND);
  fill(palette.body);

  const swing = walk * 1.8;
  circle(0, -5.2, palette.red ? 2.9 : 2.2);
  line(0, -3.1, 0, 3.2);
  line(0, -0.7, -2.0, 2.4 + swing * 0.45);
  line(0, -0.5, 2.0, 2.4 - swing * 0.45);
  line(0, 3.0, -1.55, 6.7 + swing);
  line(0, 3.0, 1.55, 6.7 - swing);
  line(0, -1.4, -1.55, 1.7 - swing * 0.55);
  line(0, -1.4, 1.55, 1.7 + swing * 0.55);

  pop();
}

function drawWalkerShadow(x, y, s, c, red) {
  push();
  translate(x + 6.8 * s, y + 8.6 * s);
  rotate(Math.PI / 4);
  noStroke();
  fill(c);
  ellipse(0, 0, (red ? 14 : 10) * s, (red ? 3.7 : 2.8) * s);
  pop();
}

function drawVignette() {
  noFill();
  for (let i = 0; i < 48; i++) {
    stroke(26, 24, 20, i * 0.14);
    rect(i, i, W - i * 2, H - i * 2);
  }
  noStroke();
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
