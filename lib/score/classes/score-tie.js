import ScoreMeta from './score-meta.js';

export default class ScoreTie extends ScoreMeta {
  updatePosition() {
    let staffSpace = this.score.staffSize * 0.25;
    let note = this.fromNote || this.toNote;
    this.x = this.x1 + (this.xOffset || 0);
    this.y = this.staffY + staffSpace * ((this.yOffset || 0) + note.visibleYPos());
  }

  updateBounds() {
    let staffSpace = this.score.staffSize * 0.25;
    let width = this.x2 - this.x1;
    let thickness = staffSpace * (width < (2 * staffSpace) ? 0.23 : 0.36);
    let height = staffSpace * tieHeight(width / staffSpace) + thickness;
    this.bounds = {
      minX: this.x1,
      minY: this.y + (this.direction === 'up' ? -height : 0),
      maxX: this.x2,
      maxY: this.y + (this.direction === 'up' ? 0 : height)
    };
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.defaultColor();
    let staffSpace = this.score.staffSize * 0.25;
    let width = this.x2 - this.x1;
    let height = staffSpace * tieHeight(width / staffSpace);
    let cw = width * 0.7;
    let cx1 = (width - cw) * 0.5;
    let cx2 = width - cx1;
    let thickness = staffSpace * (width < (2 * staffSpace) ? 0.23 : 0.36);
    let end = 0.043 * staffSpace;
    let endY = end;
    let x = this.x;
    let y = this.y;
    if (this.direction === 'up') {
      y -= staffSpace * 0.5;
      height = -height;
      endY = -endY;
      thickness = -thickness;
    } else {
      y += staffSpace * 0.5;
    }
    ctx.beginPath();
    ctx.moveTo(x + end, y);
    ctx.bezierCurveTo(x + cx1, y + height, x + cx2, y + height, x + width - end, y);
    ctx.lineTo(x + width, y + endY);
    ctx.bezierCurveTo(x + cx2, y + height + thickness, x + cx1, y + height + thickness, x, y + endY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  toSVG(svg) {
    let staffSpace = this.score.staffSize * 0.25;
    let width = this.x2 - this.x1;
    let height = staffSpace * tieHeight(width / staffSpace);
    let cw = width * 0.7;
    let cx1 = (width - cw) * 0.5;
    let cx2 = width - cx1;
    let thickness = staffSpace * (width < (2 * staffSpace) ? 0.23 : 0.36);
    let end = 0.043 * staffSpace;
    let endY = end;
    let x = this.x;
    let y = this.y;
    if (this.direction === 'up') {
      y -= staffSpace * 0.5;
      height = -height;
      endY = -endY;
      thickness = -thickness;
    } else {
      y += staffSpace * 0.5;
    }
//    let path = svg.path(['M' + (x + end) + ' ' + y + ' C' + (x + cx) + (y + height)
    let path = svg.path([
      'M', x + end, y,
      'C', x + cx1, y + height, x + cx2, y + height, x + width - end, y,
      'L', x + width, y + endY,
      'C', x + cx2, y + height + thickness, x + cx1, y + height + thickness, x, y + endY,
      'Z']);
    path.fill();
  }
}

function tieHeight(w) {
  return Math.min(Math.max(0.28, 0.08 * w), 1.71);
}
