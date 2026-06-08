const W = 540;
const H = 720;
const FISH_COUNT = 88;
const ESCAPE_PERIOD = 18000;
const CAVE = { cx: W * 0.5, cy: H * 0.52, rx: 238, ry: 318 };

const fishes = [];
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
  startedAt = millis();
}

function draw() {
  const now = millis() - startedAt;
  const cycle = floor(now / ESCAPE_PERIOD);
  const cycleT = (now % ESCAPE_PERIOD) / ESCAPE_PERIOD;
  const escaperIndex = (cycle * 29 + 17) % fishes.length;

  drawWaterGround(now);
  drawCave(now);
  drawCurrentLines(now);

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
    fishes.push({
      radius: random(0.16, 0.9),
      theta: random(TWO_PI),
      angularSpeed: random(0.00023, 0.00072),
      radialWobble: random(0.006, 0.028),
      wobbleSpeed: random(0.00022, 0.00062),
      size: random(0.82, 1.7),
      bodyLen: random(18, 36),
      bodyWide: random(3.3, 7.2),
      phase: random(TWO_PI),
      alpha: random(112, 220),
      hue: randomBlue(),
      tail: random(0.75, 1.25)
    });
  }
}

function randomBlue() {
  const palette = [
    [8, 55, 112],
    [11, 82, 145],
    [16, 111, 174],
    [34, 147, 190],
    [65, 188, 202],
    [91, 211, 212],
    [4, 44, 96]
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
  const a = [-0.2, -1.35, 2.75, 1.35][cycle % 4];
  return {
    x: CAVE.cx + cos(a) * (CAVE.rx + 46),
    y: CAVE.cy + sin(a) * (CAVE.ry + 38)
  };
}

function drawEscapeTrail(from, to, amount, fade) {
  noStroke();
  for (let i = 0; i < 22; i++) {
    const u = i / 21;
    if (u > amount) break;
    fill(42, 108, 139, 14 * u * fade);
    ellipse(lerp(from.x, to.x, u), lerp(from.y, to.y, u), 5, 1.4);
  }
}

function drawWaterGround(now) {
  background(9, 43, 91);

  noStroke();
  for (let i = 0; i < 52; i++) {
    const k = i / 51;
    fill(82, 204, 225, 3.2 * (1 - k));
    ellipse(CAVE.cx, CAVE.cy, 150 + i * 18, 190 + i * 25);
  }

  for (let i = 0; i < 42; i++) {
    const k = i / 41;
    fill(3, 23, 72, 5 * k);
    ellipse(W * 0.08, H * 0.42, 200 + i * 18, 420 + i * 18);
  }

  for (let y = 0; y < H; y += 3) {
    const n = noise(y * 0.014, now * 0.00006);
    stroke(22 + n * 28, 91 + n * 42, 143 + n * 35, 24);
    line(0, y, W, y + n * 2.2);
  }

  noStroke();
}

function drawCave(now) {
  noStroke();

  for (let i = 60; i >= 0; i--) {
    const k = i / 60;
    const wobbleX = noise(i * 0.72, now * 0.00004) * 16 - 8;
    const wobbleY = noise(i * 0.93, now * 0.00004) * 18 - 9;
    fill(2, 31, 86, 2.6 + k * 3.4);
    ellipse(CAVE.cx + wobbleX, CAVE.cy + wobbleY, CAVE.rx * 2 + i * 8, CAVE.ry * 2 + i * 8);
  }

  for (let i = 56; i >= 0; i--) {
    const k = i / 56;
    fill(112, 204, 226, 3.1 * (1 - k));
    ellipse(
      CAVE.cx + noise(i * 1.31, now * 0.00005) * 12 - 6,
      CAVE.cy + noise(i * 1.77, now * 0.00005) * 16 - 8,
      96 + i * 8.6,
      132 + i * 9.4
    );
  }

  for (let i = 34; i >= 0; i--) {
    const k = i / 34;
    fill(229, 248, 238, 3.8 * (1 - k));
    ellipse(
      CAVE.cx + noise(i * 2.4, now * 0.00005) * 9 - 4.5,
      CAVE.cy + noise(i * 2.9, now * 0.00005) * 12 - 6,
      42 + i * 6.8,
      56 + i * 7.4
    );
  }

  for (let i = 0; i < 68; i++) {
    const y = CAVE.cy - CAVE.ry + i * ((CAVE.ry * 2) / 68);
    const half = CAVE.rx * sqrt(max(0, 1 - sq((y - CAVE.cy) / CAVE.ry)));
    stroke(95, 178, 198, 8);
    strokeWeight(1);
    line(CAVE.cx - half * 0.86, y, CAVE.cx + half * 0.9, y + sin(i * 0.9) * 1.4);
  }
  noStroke();
}

function drawCurrentLines(now) {
  noFill();
  for (let i = 0; i < 16; i++) {
    const r = map(i, 0, 15, 0.18, 0.94);
    stroke(70, 176, 204, 4);
    strokeWeight(1.6);
    arc(
      CAVE.cx,
      CAVE.cy,
      CAVE.rx * 2 * r,
      CAVE.ry * 2 * r,
      now * 0.00008 + i * 0.22,
      now * 0.00008 + i * 0.22 + 0.8
    );
  }
  noStroke();
}

function drawWaterGrain(now) {
  noStroke();
  for (let i = 0; i < 1600; i++) {
    const x = (i * 37 + noise(i, now * 0.0001) * 9) % W;
    const y = (i * 91 + now * 0.012) % H;
    const d = dist(x, y, CAVE.cx, CAVE.cy);
    const centerBoost = constrain(map(d, 260, 0, 0, 15), 0, 15);
    fill(230, 252, 244, (i % 7 === 0 ? 21 : 7) + centerBoost);
    ellipse(x, y, i % 11 === 0 ? 1.8 : 0.9, i % 11 === 0 ? 1.3 : 0.7);
  }

  for (let i = 0; i < 160; i++) {
    const a = i * 2.399;
    const r = sqrt((i * 47) % 100 / 100);
    const x = CAVE.cx + cos(a) * CAVE.rx * 0.82 * r;
    const y = CAVE.cy + sin(a) * CAVE.ry * 0.72 * r;
    fill(245, 252, 238, 18);
    ellipse(x, y, i % 5 === 0 ? 2.2 : 1.1, i % 5 === 0 ? 1.8 : 0.9);
  }

  for (let i = 0; i < 220; i++) {
    const a = i * 2.17 + noise(i * 0.2) * 0.8;
    const r = sqrt((i * 61) % 100 / 100);
    const x = CAVE.cx + cos(a) * 112 * r;
    const y = CAVE.cy + sin(a) * 135 * r;
    fill(240, 252, 238, i % 6 === 0 ? 28 : 13);
    ellipse(x, y, i % 8 === 0 ? 2.4 : 1.1, i % 8 === 0 ? 1.8 : 0.9);
  }
}

function drawFishAt(pose, fish, now, alphaScale) {
  push();
  translate(pose.x, pose.y);
  rotate(pose.angle);
  scale(fish.size);

  const wag = sin(now * 0.011 + fish.phase) * fish.tail;
  const fishAlpha = fish.alpha * alphaScale;
  const c = color(fish.hue[0], fish.hue[1], fish.hue[2], fishAlpha);
  const light = color(fish.hue[0] + 36, fish.hue[1] + 28, fish.hue[2] + 20, fishAlpha * 0.28);

  noStroke();
  fill(c);
  beginShape();
  vertex(-fish.bodyLen * 0.52, 0);
  bezierVertex(-fish.bodyLen * 0.25, -fish.bodyWide, fish.bodyLen * 0.26, -fish.bodyWide * 0.82, fish.bodyLen * 0.52, 0);
  bezierVertex(fish.bodyLen * 0.26, fish.bodyWide * 0.82, -fish.bodyLen * 0.25, fish.bodyWide, -fish.bodyLen * 0.52, 0);
  endShape(CLOSE);

  fill(light);
  ellipse(fish.bodyLen * 0.08, -fish.bodyWide * 0.18, fish.bodyLen * 0.48, fish.bodyWide * 0.42);

  fill(2, 21, 48, fishAlpha * 0.78);
  circle(fish.bodyLen * 0.31, -fish.bodyWide * 0.18, max(1.2, fish.bodyWide * 0.28));

  fill(fish.hue[0], fish.hue[1], fish.hue[2], fishAlpha * 0.74);
  triangle(
    -fish.bodyLen * 0.5,
    0,
    -fish.bodyLen * 0.84,
    -fish.bodyWide * (0.9 + wag * 0.18),
    -fish.bodyLen * 0.76,
    fish.bodyWide * (0.88 - wag * 0.18)
  );

  fill(fish.hue[0], fish.hue[1], fish.hue[2], fishAlpha * 0.28);
  triangle(-fish.bodyLen * 0.05, 0, fish.bodyLen * 0.15, -fish.bodyWide * 1.15, fish.bodyLen * 0.26, -fish.bodyWide * 0.15);
  triangle(-fish.bodyLen * 0.12, fish.bodyWide * 0.12, fish.bodyLen * 0.08, fish.bodyWide * 1.0, fish.bodyLen * 0.18, fish.bodyWide * 0.18);

  pop();
}

function smoothstep(edge0, edge1, x) {
  const n = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return n * n * (3 - 2 * n);
}
