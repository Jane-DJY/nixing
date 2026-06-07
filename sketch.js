const W = 540;
const H = 720;
const DURATION = 17000;
const CROWD_COUNT = 140;

const FLOW = { x: 0.62, y: 0.78 };
const NORMAL = { x: -0.78, y: 0.62 };
const FLOW_ANGLE = Math.atan2(FLOW.y, FLOW.x) - Math.PI / 2;
const SPAN = 2050;
const crowd = [];
const anchors = [];

let startedAt = 0;

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("stage");
  canvas.elt.style.setProperty("width", "100%", "important");
  canvas.elt.style.setProperty("height", "100%", "important");
  pixelDensity(1);
  frameRate(60);
  noStroke();
  startedAt = millis();

  randomSeed(314159);
  noiseSeed(271828);
  buildCrowd();
  buildAnchors();
}

function draw() {
  const elapsed = (millis() - startedAt) % DURATION;
  const p = elapsed / DURATION;
  const t = easeInOutCubic(p);

  drawPaper();
  drawDiagonalFlow(p);
  drawRedTrace(t);

  for (const person of anchors) {
    const drift = sin(TWO_PI * (p * person.wobbleSpeed + person.phase)) * person.wobble;
    drawCloakPerson(person.x + FLOW.x * drift, person.y + FLOW.y * drift, person.size, color(15, 15, 14, person.alpha), {
      angle: FLOW_ANGLE + person.tilt,
      variant: person.variant,
      grain: person.grain,
      glow: false
    });
  }

  for (const person of crowd) {
    const pos = crowdPoint(person, p);
    const depth = constrain(map(pos.y, 20, H - 60, 0.72, 1.36), 0.62, 1.46);
    const midCover = middleCover(pos, t);
    const alpha = 118 + person.depth * 106 + midCover * 26;
    const scale = person.size * depth * (0.96 + 0.035 * sin(TWO_PI * (p * 1.8 + person.phase)));
    drawCloakPerson(pos.x, pos.y, scale, color(16, 16, 15, alpha), {
      angle: FLOW_ANGLE + person.tilt,
      variant: person.variant,
      grain: person.grain,
      glow: false
    });
  }

  drawRedPerson(t, p);
  drawForegroundCrowd(p, t);
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

function buildAnchors() {
  const columns = 8;
  const rows = 10;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const offset = (row % 2) * (W / columns) * 0.45;
      anchors.push({
        x: map(col, 0, columns - 1, -34, W + 34) + offset + random(-20, 20),
        y: map(row, 0, rows - 1, -36, H + 36) + random(-24, 24),
        size: random(0.28, 0.56) * map(row, 0, rows - 1, 0.82, 1.25),
        phase: random(),
        wobble: random(6, 18),
        wobbleSpeed: random(0.32, 0.72),
        tilt: random(-0.06, 0.06),
        variant: floor(random(4)),
        grain: random(1000),
        alpha: random(64, 132)
      });
    }
  }
}

function buildCrowd() {
  for (let i = 0; i < CROWD_COUNT; i++) {
    const columns = 20;
    const col = i % columns;
    const row = floor(i / columns);
    const rows = ceil(CROWD_COUNT / columns);
    crowd.push({
      baseX: map(col, 0, columns - 1, -70, W + 70) + random(-44, 44),
      baseY: map(row, 0, rows - 1, -92, H + 92) + random(-52, 52),
      phase: random(),
      speed: random(0.44, 0.86),
      size: random(0.36, 0.82),
      drift: random(-22, 22),
      wobble: random(3, 16),
      wobbleSpeed: random(0.8, 2.1),
      tilt: random(-0.08, 0.08),
      depth: random(0.15, 1),
      variant: floor(random(4)),
      grain: random(1000)
    });
  }
}

function crowdPoint(person, p) {
  const travel = (((p * person.speed + person.phase) % 1) - 0.5) * 190;
  const drift = sin(TWO_PI * (p * person.wobbleSpeed + person.phase)) * person.wobble;
  return {
    x: person.baseX + FLOW.x * travel + NORMAL.x * drift + person.drift,
    y: person.baseY + FLOW.y * travel + NORMAL.y * drift
  };
}

function drawPaper() {
  background(231, 231, 226);

  for (let y = 0; y < H; y += 6) {
    const shade = 222 + noise(y * 0.008, frameCount * 0.002) * 16;
    stroke(shade, shade, shade - 5, 28);
    line(0, y, W, y);
  }

  noStroke();
  fill(248, 248, 243, 42);
  rect(48, 48, W - 96, H - 96);
}

function drawDiagonalFlow(p) {
  stroke(24, 24, 23, 18);
  strokeWeight(2);

  for (let i = -16; i < 34; i++) {
    const lane = i * 52 + sin(p * TWO_PI + i) * 7;
    const offset = (p * 500 + i * 73) % 190;
    for (let s = -300 + offset; s < SPAN - 120; s += 190) {
      const x1 = -170 + FLOW.x * s + NORMAL.x * lane;
      const y1 = -190 + FLOW.y * s + NORMAL.y * lane;
      const x2 = x1 + FLOW.x * 96;
      const y2 = y1 + FLOW.y * 96;
      line(x1, y1, x2, y2);
    }
  }

  noStroke();
}

function drawRedTrace(t) {
  const steps = 84;
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    if (u > t) break;

    const pt = redPoint(u);
    const local = smoothstep(0.02, 0.35, t) * map(i, 0, steps - 1, 0.1, 1);
    fill(205, 35, 29, 82 * local);
    ellipse(pt.x, pt.y + 16, 22 * local, 8 * local);
  }
}

function drawRedPerson(t, p) {
  const pt = redPoint(t);
  const buried = smoothstep(0.34, 0.51, t) * (1 - smoothstep(0.56, 0.75, t));
  const reveal = smoothstep(0.72, 0.96, t);
  const scale = 1.18 - buried * 0.22 + reveal * 0.16;
  const alpha = 255 - buried * 145 + reveal * 32;

  drawCloakPerson(pt.x, pt.y, scale, color(211, 38, 30, alpha), {
    angle: FLOW_ANGLE + PI + map(sin(p * TWO_PI), -1, 1, -0.035, 0.035),
    variant: 1,
    grain: 999,
    glow: true
  });
}

function drawForegroundCrowd(p, t) {
  const cover = smoothstep(0.34, 0.48, t) * (1 - smoothstep(0.58, 0.78, t));
  if (cover <= 0.01) return;

  const center = redPoint(0.5);
  for (let i = 0; i < 138; i++) {
    const lane = map(i % 23, 0, 22, -215, 215);
    const stream = map(floor(i / 23), 0, 5, -130, 170) + ((p * 520 + i * 17) % 170);
    const x = center.x + FLOW.x * stream + NORMAL.x * lane;
    const y = center.y + FLOW.y * stream + NORMAL.y * lane;
    const sc = 0.72 + (i % 23) * 0.01;
    drawCloakPerson(x, y, sc, color(10, 10, 9, 80 * cover), {
      angle: FLOW_ANGLE + randomFixed(i) * 0.07,
      variant: i % 4,
      grain: i * 7,
      glow: false
    });
  }
}

function drawCloakPerson(x, y, s, c, opts) {
  push();
  translate(x, y);
  rotate(opts.angle);
  scale(s);

  drawShadow(c, opts.glow);
  drawCloakBody(c, opts.variant);
  drawCloakGrain(c, opts.grain);

  pop();
}

function drawShadow(c, glow) {
  noStroke();
  const shadowAlpha = glow ? 72 : 42;
  fill(24, 22, 20, shadowAlpha);
  ellipse(0, 62, glow ? 58 : 48, glow ? 18 : 13);
}

function drawCloakBody(c, variant) {
  const h = [124, 142, 132, 150][variant] || 134;
  const topY = -h * 0.48;
  const baseY = h * 0.46;
  const leftW = [31, 26, 35, 29][variant] || 30;
  const rightW = [28, 33, 27, 38][variant] || 31;
  const neck = [7, 9, 6, 8][variant] || 7;

  noStroke();
  fill(c);

  beginShape();
  vertex(-neck, topY + 14);
  bezierVertex(-leftW * 0.9, topY + 26, -leftW * 1.1, baseY - 42, -leftW, baseY - 8);
  bezierVertex(-leftW * 0.72, baseY - 2, -leftW * 0.34, baseY + 4, -12, baseY + 2);
  bezierVertex(-7, baseY - 12, 7, baseY - 12, 12, baseY + 2);
  bezierVertex(rightW * 0.44, baseY + 5, rightW * 0.8, baseY - 1, rightW, baseY - 9);
  bezierVertex(rightW * 0.8, baseY - 56, rightW * 0.52, topY + 23, neck, topY + 13);
  bezierVertex(4, topY + 2, -3, topY + 2, -neck, topY + 14);
  endShape(CLOSE);

  circle(1, topY - 4, 14);

  if (variant === 2) {
    triangle(-leftW * 0.5, topY + 18, -leftW * 1.35, baseY - 14, -leftW * 0.25, baseY - 4);
  }

  if (variant === 3) {
    triangle(rightW * 0.38, topY + 22, rightW * 1.18, baseY - 5, rightW * 0.22, baseY - 8);
  }

  fill(red(c), green(c), blue(c), alpha(c) * 0.14);
  ellipse(-6, topY + 36, leftW * 0.58, h * 0.48);
}

function drawCloakGrain(c, seed) {
  noStroke();
}

function redPoint(t) {
  const x0 = W * 0.82;
  const y0 = H * 0.8;
  const x1 = W * 0.78;
  const y1 = H * 0.74;
  const x2 = W * 0.34;
  const y2 = H * 0.42;
  const x3 = W * 0.1;
  const y3 = H * 0.08;

  return {
    x: bezierPoint(x0, x1, x2, x3, t),
    y: bezierPoint(y0, y1, y2, y3, t)
  };
}

function middleCover(pos, t) {
  const redMid = redPoint(0.5);
  const band = 1 - constrain(dist(pos.x, pos.y, redMid.x, redMid.y) / 330, 0, 1);
  return band * smoothstep(0.28, 0.46, t) * (1 - smoothstep(0.62, 0.82, t));
}

function drawVignette() {
  noFill();
  for (let i = 0; i < 90; i++) {
    stroke(30, 29, 27, i * 0.28);
    strokeWeight(2);
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
