let gridSizePixels = Math.random() * 60 + 15;
let segmentSize = Math.random() * 5 + 1;
let stepSize = gridSizePixels * segmentSize;
let railThickness = gridSizePixels / 2; 

let backgroundH = Math.random() * 255;
let backgroundS = Math.random() * 255;
let backgroundB = Math.random() * 255;

let animate = true;

function toggleAnimate() {
  animate = !animate;
}

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
   * @param {number} i Grid coordinate
   * @returns {number} Pixel coordinate
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

  /**
   * 
   * @param {number} floorX The furthest left horizontal point to draw
   * @param {number} ceilingX The furthest right horizontal point to draw
   */
  draw(floorX, ceilingX) {
    /**
     * Returns the corresponding pixel value for `i`, but clamped to the range [startX, endX].
     * So if `gridToPixel(i)` < startX, you get startX, if `gridToPixel(i)` > endX you get endX, otherwise you get
     * `gridToPixel(i)`.
     * @param {number} startX 
     * @param {number} endX 
     * @param {number} i
     * @returns {number} Pixel coordinate
     */
    const clampedGridToPixel = (i) => {
      return max(min(gridToPixel(i), ceilingX), floorX);
    }
    
    const firstVertex = floor(floorX / gridSizePixels / segmentSize);
    const lastVertex = ceil(ceilingX / gridSizePixels / segmentSize);

    for (let vertex = firstVertex; vertex < lastVertex; ++vertex) {
      const startVertex = this.verticesGrid[vertex];
      const endVertex = this.verticesGrid[vertex + 1];

      const deltaY = gridToPixel(endVertex.j) - gridToPixel(startVertex.j);

      const startX =  clampedGridToPixel(startVertex.i);
      // The slope is 1
      const startY = gridToPixel(startVertex.j) + (startX - gridToPixel(startVertex.i)) * deltaY / stepSize;
      const endX = clampedGridToPixel(endVertex.i);
      const endY = gridToPixel(endVertex.j) - (gridToPixel(endVertex.i) - endX) * deltaY / stepSize;
      const createJoiner = endX < ceilingX;
      push();

      fill(this.h, this.s, this.b);
      quad(
        startX,                                                 startY,
        startX - railThickness * tan(PI / 8), startY + railThickness,
        endX - railThickness * tan(PI / 8),   endY + railThickness,
        endX,                                                   endY
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
  constructor(startI, bundleHeight, speed) {
    const numRails = random(5, 15);
    this.speed = speed;
    this.startFrame = frameCount;
    this.rails = [];
    // The distance between the top and bottom rail, in grid units
    const h = random(0,255);
    const s = random(0,255);
    const v = random(0,255);
    // The bundle height in grid units from 1 to 1/4 of the screen
    this.bundleHeight = bundleHeight;
    for (let i = 0; i < numRails; ++i) {
      this.rails.push(new Rail(h, s, v, startI + i/numRails * this.bundleHeight + randomGaussian(0, 0.05)));
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
    const frame = frameCount - this.startFrame;
    const ceiling = animate ? frame * this.speed : windowWidth;
    const floor = animate ? ceiling - windowWidth : 0;
    if (floor > windowWidth) return;
    for (const rail of this.rails) {
      rail.draw(max(0, floor), min(ceiling, windowWidth));
    }
  }
}

function newBundle() {
  const speed = random(5, 15);
  const startI = random(0, windowHeight / gridSizePixels * .9);
  const bundleHeight = random(1, floor(windowHeight / gridSizePixels / 4));
  const bundle = new RailBundle(startI, bundleHeight, speed);
  // The number of segments which fit horizontally on the screen
  for (let i = 0; i < ceil(windowWidth / gridSizePixels / segmentSize); ++i) {
    bundle.addSegment(random() < .5 ? Direction.OVER : Direction.DOWN);
  }
  return bundle;
}

let bundles = [];
let bundleFactoryInterval = null;
function reset() {
  backgroundH = random(0, 255);
  backgroundS = random(0, 255);
  backgroundV = random(0, 255);
  gridSizePixels = Math.random() * 60 + 15;
  segmentSize = Math.random() * 5 + 1;
  stepSize = gridSizePixels * segmentSize;
  railThickness = gridSizePixels / 10;
  frameCount = 0;
  clearInterval(bundleFactoryInterval);
  bundles = [];
  bundleFactoryInterval = setInterval(() => (random(0, 1) < 0.01) && bundles.push(newBundle()))
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
  const speed = 10;
  const ceiling = animate ? frameCount * speed : windowWidth;
  const floor = animate ? ceiling - windowWidth : 0;
  clear();
  background(backgroundH, backgroundS, backgroundB);
  for (const bundle of bundles) {
    bundle.draw();
  }
}