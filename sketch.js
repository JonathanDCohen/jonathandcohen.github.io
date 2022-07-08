let gridSizePixels = Math.random() * 60 + 15;
let segmentSize = Math.random() * 5 + 1;
let stepSize = gridSizePixels * segmentSize;
let railThickness = gridSizePixels / 2; 

/**
 * @readonly
 * @enum {number}
 */
const Direction = {
  OVER: 0,
  DOWN: 1,
}

/**
 * A constant-thickness line which can travel horizontally or 45 degrees downwards.
 */
class Rail {
  /**
   * Constructs a new rail colored with the given HSB triplet starting at the given y-height.
   * @param {number} h from 0-255
   * @param {number} s from 0-255
   * @param {number} b from 0-255
   * @param {number} y The height the rail starts at in grid units.
   */
  constructor(h, s, b, y) {
    this.h = h;
    this.s = s;
    this.b = b;
    this.startY = y;
    this.segments = [];
  }

  /**
   * Adds a new point in the rail at the grid point (x, y).  (0,0) is in the top left corner.
   * X values increase to the right, Y values increase going down.
   * @param {Direction} direction Direction.OVER for a straight segment, Direction.DOWN for a downward sloping segment.
   * The length of the segment is `segmentSize` units, or `segmentSize * gridSizePixels` px.
   */
  addSegment(direction) {
    this.segments.push(direction);
  }

  draw() {
    let downCount = 0;
    for (let i = 0; i < this.segments.length; ++i) {
      push();
      fill(this.h, this.s, this.b);

      translate(stepSize * i, stepSize * downCount + this.startY * gridSizePixels);
      if (this.segments[i] === Direction.DOWN) {
        ++downCount;
        rotate(PI / 4);
        // Just doing stepSize * sqrt(2) makes the top right corner of the slanted edge
        // meet the top left corner of the next OVER segment, leaving a kite-shaped hole.
        // joinerSize is the length of the smaller of the sides on the kite.  We extend
        // the slanting edge and insert a small rectangle to fill the gap in.
        const joinerSize = railThickness * tan(PI / 8);
        rect(0, 0, stepSize * sqrt(2) + joinerSize, railThickness);
        // Move the origin to where the gap is
        rotate(-PI/4);
        translate(stepSize - joinerSize, stepSize);
        rect(0, 0, joinerSize, railThickness);
      } else {
        rect(0, 0, stepSize, railThickness);
      }
      pop();
    }
  }
}

/**
 * A group of rails all traveling the same direction.  It can be queried for bounds at any grid point so that
 * its owner can coordinate multiple RailBundles to not intersect
 */
class RailBundle {
  constructor() {
    const numRails = random(5, 15);
    this.rails = [];
    // The distance between the top and bottom rail, in grid units
    const h = random(0,255);
    const s = random(0,255);
    const v = random(0,255);
    // The bundle height in grid units from 1 to 1/4 of the screen
    this.bundleHeight = random(1, floor(windowHeight / gridSizePixels / 4));
    for (let i = 0; i < numRails; ++i) {
      this.rails.push(new Rail(h, s, v, i / numRails * this.bundleHeight + random(-3, 3)));
    }
  }

  /**
   * Adds a new segment to each rail in the bundle.
   * TODO maybe sometimes we'll skip individual rail segments?
   * @param {Direction} direction 
   */
  addSegment(direction) {
    for (const rail of this.rails) {
      rail.addSegment(direction);
    }
  }

  draw() {
    for (const rail of this.rails) {
      rail.draw();
    }
  }
}

let bundles = [];
function reset() {
  gridSizePixels = Math.random() * 60 + 15;
  segmentSize = Math.random() * 5 + 1;
  stepSize = gridSizePixels * segmentSize;
  railThickness = gridSizePixels / 10;
  background(random(0, 255), random(0, 255), random(0, 255));
  const bundle = new RailBundle();
  // The number of segments which fit horizontally on the screen
  for (let i = 0; i < ceil(windowWidth / gridSizePixels / segmentSize); ++i) {
    bundle.addSegment(random() < .5 ? Direction.OVER : Direction.DOWN);
  }
  bundles = [bundle];

}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  noStroke();
  reset();
}

function doSave() {
  save(`${Date.now()}.png`);
}

function draw() {
  for (const bundle of bundles) {
    bundle.draw();
  }
}