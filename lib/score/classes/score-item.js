export default class ScoreItem {
  constructor(item, score, params) {
    this.item = item;
    this.score = score;
    for (let param in params) {
      this[param] = params[param];
    }
    this.leftExtent = 0;  // TEMP
    this.rightExtent = 0;
  }

  get floating() {
    return false;
  }

  get fixedWidth() {
    return true;
  }

  visibleYPos() {
    return 0;
  }

  innerWidth() {
    return 0;
  }

  minSpace(nextItem) {
    return 0.5;
  }

  flexibleSpace(nextItem) {
    return 0;
  }

  updateExtents() {
    this.leftExtent = 0;
    this.rightExtent = 0;
  }

  updatePosition() {
    let staffSpace = this.score.staffSize * 0.25;
    this.x = this.scoreX + staffSpace * (this.xOffset || 0);
    this.y = this.staffY + staffSpace * ((this.yOffset || 0) + this.visibleYPos());
  }

  updateBounds() {
    let staffSpace = this.score.staffSize * 0.25;
    let boundingBox = this.boundingBox();
    let scale = this.scale || 1;
    this.bounds = {
      minX: this.x + staffSpace * scale * boundingBox.left,
      minY: this.y + staffSpace * scale * boundingBox.top,
      maxX: this.x + staffSpace * scale * boundingBox.right,
      maxY: this.y + staffSpace * scale * boundingBox.bottom
    };
  }

  boundingBox() {
    return {
      left: -this.leftExtent,
      top: -2,
      right: this.innerWidth() + this.rightExtent,
      bottom: 2
    };
  }

  defaultColor() {
    if (this.selected) return 'blue';
    if (this.hovered) return 'red';
    return 'black';
  }

  draw(ctx) {
    console.log('Canvas drawing not implemented for ', this);
  }

  toSVG(svg) {
    console.log('SVG drawing not implemented for ', this);
  }
}

