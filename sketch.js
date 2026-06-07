const W = 1080;
const H = 1440;
const DURATION = 16000;
const CROWD_COUNT = 540;
const crowd = [];

let startedAt = 0;

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("stage");
  pixelDensity(1);
  frameRate(60);
  noStroke();
  startedAt = millis();

  randomSeed(314159);
  noiseSeed(271828);
  buildCrowd();
}

function draw() {
  const elapsed = (millis() - startedAt) % DURATION;
  const p = elapsed / DURATION;
  const eased = easeInOutCubic(p);

  drawPaper();
  drawFlowField(p);
  drawRedTrace(eased);

  for (const person of crowd) {
    const crowdPhase = (p + person.phase) % 1;
    const x = ((person.baseX + crowdPhase * person.speed * W) % (W + 260)) - 130;
    const y = person.baseY + sin(TWO_PI * (p * person.wobbleSpeed + person.phase)) * person.wobble;
    const scale = person.size * (0.88 + 0.12 * sin(TWO_PI * (p * 2 + person.phase)));
    const midCover = middleCover(person.baseY, eased);
    const alpha = 128 + person.depth * 96 + midCover * 36;
    drawPerson(x, y, scale, color(15, 15, 13, alpha), 1, p + person.phase);
  }

  drawRedPerson(eased, p);
  drawForegroundCrowd(p, eased);
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

function buildCrowd() {
  for (let i = 0; i < CROWD_COUNT; i++) {
    const band = random();
    const y = map(pow(band, 0.8), 0, 1, 110, H - 130);
    const centerWeight = 1 - abs((y - H * 0.52) / (H * 0.48));
    crowd.push({
      baseX: random(-130, W + 130),
      baseY: y + random(-18, 18),
      speed: random(0.58, 1.18),
      size: random(0.72, 1.24) * map(y, 90, H - 80, 0.8, 1.35),
      phase: random(),
      wobble: random(1, 8) * centerWeight,
      wobbleSpeed: random(0.8, 1.9),
      depth: random(0.15, 1)
    });
  }
}

function drawPaper() {
  background(239, 238, 232);

  for (let y = 0; y < H; y += 3) {
    const shade = 232 + noise(y * 0.008, frameCount * 0.002) * 14;
    stroke(shade, shade - 1, shade - 8, 22);
    line(0, y, W, y);
  }

  noStroke();
  fill(254, 250, 240, 54);
  rect(42, 42, W - 84, H - 84);
}

function drawFlowField(p) {
  stroke(20, 20, 18, 24);
  strokeWeight(2);

  for (let i = 0; i < 34; i++) {
    const y = 96 + i * 37 + sin(p * TWO_PI + i) * 8;
    const offset = (p * 460 + i * 61) % 170;
    for (let x = -180 + offset; x < W + 180; x += 170) {
      line(x - 48, y, x + 54, y);
      line(x + 54, y, x + 34, y - 10);
      line(x + 54, y, x + 34, y + 10);
    }
  }

  noStroke();
}

function drawRedTrace(t) {
  const steps = 70;
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    if (u > t) break;

    const pt = redPoint(u);
    const alpha = map(i, 0, steps - 1, 8, 128) * smoothstep(0.05, 0.95, t);
    fill(202, 28, 35, alpha);
    circle(pt.x, pt.y, map(i, 0, steps - 1, 5, 18));
  }
}

function drawRedPerson(t, p) {
  const pt = redPoint(t);
  const buried = smoothstep(0.32, 0.56, t) * (1 - smoothstep(0.62, 0.78, t));
  const reveal = smoothstep(0.72, 0.96, t);
  const scale = 1.55 - buried * 0.28 + reveal * 0.35;
  const alpha = 245 - buried * 150 + reveal * 84;

  push();
  translate(pt.x, pt.y);
  rotate(map(sin(p * TWO_PI), -1, 1, -0.08, 0.08));
  drawPerson(0, 0, scale, color(206, 26, 35, alpha), -1, p);
  pop();
}

function drawForegroundCrowd(p, t) {
  const cover = smoothstep(0.32, 0.46, t) * (1 - smoothstep(0.58, 0.76, t));
  if (cover <= 0.01) return;

  for (let i = 0; i < 160; i++) {
    const lane = i % 20;
    const row = floor(i / 20);
    const x = ((i * 97 + p * 980) % (W + 180)) - 90;
    const y = H * 0.43 + lane * 15 + sin(row + p * 9) * 8;
    const sc = 1.04 + (lane / 20) * 0.55;
    drawPerson(x, y, sc, color(10, 10, 9, 72 * cover), 1, p + i * 0.01);
  }
}

function drawPerson(x, y, s, c, dir, phase) {
  push();
  translate(x, y);
  scale(s);
  fill(c);
  stroke(c);
  strokeWeight(8);
  strokeCap(ROUND);

  const walk = sin(TWO_PI * phase * 6);
  const lean = dir * 0.09;
  rotate(lean);

  noStroke();
  circle(0, -25, 18);
  stroke(c);
  line(0, -13, dir * 4, 19);
  line(dir * 4, -2, dir * 24, 8 + walk * 3);
  line(dir * 3, 0, -dir * 18, 8 - walk * 3);
  line(dir * 4, 19, dir * 21, 42 + walk * 6);
  line(dir * 4, 19, -dir * 17, 42 - walk * 6);

  pop();
}

function redPoint(t) {
  const x0 = W + 96;
  const y0 = H * 0.28;
  const x1 = W * 0.74;
  const y1 = H * 0.58;
  const x2 = W * 0.31;
  const y2 = H * 0.51;
  const x3 = -84;
  const y3 = H * 0.82;

  return {
    x: bezierPoint(x0, x1, x2, x3, t),
    y: bezierPoint(y0, y1, y2, y3, t)
  };
}

function middleCover(y, t) {
  const center = H * 0.53;
  const band = 1 - constrain(abs(y - center) / 250, 0, 1);
  return band * smoothstep(0.27, 0.48, t) * (1 - smoothstep(0.66, 0.82, t));
}

function drawVignette() {
  noFill();
  for (let i = 0; i < 90; i++) {
    stroke(27, 26, 22, i * 0.34);
    strokeWeight(2);
    rect(i, i, W - i * 2, H - i * 2);
  }
  noStroke();
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
