const gridSizePixels = 20;
const segmentSize = 6;
const stepSize = gridSizePixels * segmentSize;
const railThickness = gridSizePixels / 2; 

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
    fill(this.h, this.s, this.b);
    let downCount = 0;
    for (let i = 0; i < this.segments.length; ++i) {
      push();

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

let r = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  noStroke();
  r = new Rail(random(0, 255), 255, 255, random(-5, 5));
  
  for (let segment = 0; segment < ceil(windowWidth / gridSizePixels / segmentSize); ++segment) {
    r.addSegment(random() < .5 ? Direction.OVER : Direction.DOWN);
  }
}

function draw() {
  background(0);
  
  r.draw();
}