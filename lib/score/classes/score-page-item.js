export default class ScorePageItem {
  constructor(item, score, params) {
    this.item = item;
    this.score = score;
    for (let param in params) {
      this[param] = params[param];
    }
    this.margin || (this.margin = 0);
    this.width  || (this.width  = 0);
    this.height || (this.height = 0);
  }

  updatePosition() {
    this.x = this.pageX;
    this.y = this.pageY;

    // TODO: alignment
  }

  updateBounds() {
    let margin =  this.margin;
    this.bounds = {
      minX: this.x - margin,
      minY: this.y - margin,
      maxX: this.x + this.width + margin,
      maxY: this.y + this.height + margin
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

