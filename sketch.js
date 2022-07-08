let backgroundH = Math.random() * 255;
let backgroundS = Math.random() * 255;
let backgroundB = Math.random() * 255;

let animate = true;

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
   * @param {number} j The height the rail starts at in grid units.
   */
  constructor(h, s, b, j, gridSizePixels, segmentSize, railThickness) {
    this.h = h;
    this.s = s;
    this.b = b;
    /**
     * @type {Array.<{i: number, j: number}>}
     */
    this.verticesGrid = [{i: 0, j}];

    this.gridSizePixels = gridSizePixels;
    this.segmentSize = segmentSize;
    this.stepSize = this.gridSizePixels * this.segmentSize;
    this.railThickness = railThickness;
  }

  /**
   * 
   * @param {number} i Grid coordinate
   * @returns {number} Pixel coordinate
   */
 gridToPixel(i) {
  return i * this.gridSizePixels;
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
      i: lastEndpoint.i + this.segmentSize, 
      j: lastEndpoint.j + (direction === Direction.OVER ? 0: this.segmentSize)});
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
      return max(min(this.gridToPixel(i), ceilingX), floorX);
    }
    
    const firstVertex = floor(floorX / this.gridSizePixels / this.segmentSize);
    const lastVertex = ceil(ceilingX / this.gridSizePixels / this.segmentSize);

    for (let vertex = firstVertex; vertex < lastVertex; ++vertex) {
      const startVertex = this.verticesGrid[vertex];
      const endVertex = this.verticesGrid[vertex + 1];

      const deltaY = this.gridToPixel(endVertex.j) - this.gridToPixel(startVertex.j);

      const startX =  clampedGridToPixel(startVertex.i);
      // The slope is 1
      const startY = this.gridToPixel(startVertex.j) + (startX - this.gridToPixel(startVertex.i)) * deltaY / this.stepSize;
      const endX = clampedGridToPixel(endVertex.i);
      const endY = this.gridToPixel(endVertex.j) - (this.gridToPixel(endVertex.i) - endX) * deltaY / this.stepSize;

      fill(this.h, this.s, this.b);
      quad(
        startX,                                                 startY,
        startX - this.railThickness * tan(PI / 8), startY + this.railThickness,
        endX - this.railThickness * tan(PI / 8),   endY + this.railThickness,
        endX,                                                   endY
      );
    }
  }
}

/**
 * A group of rails all traveling the same direction.  It can be queried for bounds at any grid point so that
 * its owner can coordinate multiple RailBundles to not intersect
 */
class RailBundle {
  constructor(startI, bundleHeight, speed, flipVertical, flipHorizontal, gridSizePixels, segmentSize, railThickness) {
    this.flipVertical = flipVertical;
    this.flipHorizontal = flipHorizontal;
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
      this.rails.push(new Rail(
        h, s, v, 
        startI + i/numRails * this.bundleHeight + randomGaussian(0, 0.05), 
        gridSizePixels, segmentSize, railThickness));
    }
    this.done = false;
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
    if (floor > windowWidth) {
      this.done = true;
    };
    for (const rail of this.rails) {
      push();
      if (this.flipVertical) {
        translate(0, windowHeight);
        scale(1, -1);
      }
      if(this.flipHorizontal) {
        translate(windowWidth, 0);
        scale(-1, 1);
      }
      rail.draw(max(0, floor), min(ceiling, windowWidth));
      pop();
    }
  }
}

function newBundle() {
  const gridSizePixels = Math.random() * 60 + 15;
  const segmentSize = Math.random() * 5 + 1;
  const railThickness = gridSizePixels / random(1.5, 15);
  const speed = random(5, 15);
  const startI = random(0, windowHeight / gridSizePixels * .9);
  const bundleHeight = random(1, floor(windowHeight / gridSizePixels / 4));
  const flipVertical = random(0, 1) < 0.5;
  const flipHorizontal = random(0, 1) < 0.5;
  const bundle = new RailBundle(startI, bundleHeight, speed, flipVertical, flipHorizontal, gridSizePixels, segmentSize, railThickness);
  // The number of segments which fit horizontally on the screen
  for (let i = 0; i < ceil(windowWidth / gridSizePixels / segmentSize); ++i) {
    bundle.addSegment(random() < .5 ? Direction.OVER : Direction.DOWN);
  }
  return bundle;
}

let bundles = [];
setInterval(() => bundles = bundles.filter(b => !b.done), 5000);
let bundleFactoryInterval = null;

function reset() {
  backgroundH = random(0, 255);
  backgroundS = random(0, 255);
  backgroundV = random(0, 255);
  clearInterval(bundleFactoryInterval);
  bundles = [];
  if (animate) { bundleFactoryInterval = setInterval(() => (random(0, 1) < 0.1) && bundles.push(newBundle()), 50);}
  bundles.push(newBundle());
}

function toggleAnimate() {
  animate = !animate;
  if(!animate) reset();
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