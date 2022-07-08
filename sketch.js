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
   * 
   * @param {i: number} coords
   * @returns {x: number}
   */
 function gridToPixel(i) {
  return i * gridSizePixels;
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
   * @param {number} j The height the rail starts at in grid units.
   */
  constructor(h, s, b, j) {
    this.h = h;
    this.s = s;
    this.b = b;
    /**
     * @type {Array.<{i: number, j: number}>}
     */
    this.verticesGrid = [{i: 0, j}];
  }

  /**
   * Adds a new point in the rail at the grid point (x, y).  (0,0) is in the top left corner.
   * X values increase to the right, Y values increase going down.
   * @param {Direction} direction Direction.OVER for a straight segment, Direction.DOWN for a downward sloping segment.
   * The length of the segment is `segmentSize` units, or `segmentSize * gridSizePixels` px.
   */
  addSegment(direction) {
    const lastEndpoint = this.verticesGrid[this.verticesGrid.length - 1];
    this.verticesGrid.push({
      i: lastEndpoint.i + segmentSize, 
      j: lastEndpoint.j + (direction === Direction.OVER ? 0: segmentSize)});
  }

  draw() {
    for (let segment = 1; segment < this.verticesGrid.length; ++segment) {
      const startVertex = this.verticesGrid[segment - 1];
      const endVertex = this.verticesGrid[segment];

      push();

      fill(this.h, this.s, this.b);
      // Move each lower corner over to create a pi/8 rad angle between the corners.  This creates a proper join
      // so that the thickness of the downward and horizontal rails are the same
      quad(
        gridToPixel(startVertex.i),                               gridToPixel(startVertex.j),
        gridToPixel(startVertex.i) - railThickness * tan(PI / 8), gridToPixel(startVertex.j) + railThickness,
        gridToPixel(endVertex.i) - railThickness * tan(PI / 8),   gridToPixel(endVertex.j) + railThickness,
        gridToPixel(endVertex.i),                                 gridToPixel(endVertex.j),
      );

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
      this.rails.push(new Rail(h, s, v, i / numRails * this.bundleHeight + randomGaussian(0, .05)));
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