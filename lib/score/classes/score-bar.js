import ScoreMeta from './score-meta.js';
import ScoreClef from './score-clef.js';

export default class ScoreBar extends ScoreMeta {
  updatePosition() {
    super.updatePosition();
    let staffSpace = this.score.staffSize * 0.25;
    let staffSystem = this.score.staffSystems[this.staffSystem];
    this.y1 = this.y - 2 * staffSpace;
    this.y2 = this.y + 2 * staffSpace;
    if (this.leftBarline) {
      this.y2 += (staffSystem.staves.length - 1) * staffSystem.staffDistance;
    }
  }

  minSpace(nextItem) {
    if (nextItem instanceof ScoreClef) {
      return 0.5;
    } else {
      return 1;
    }
  }

  draw(ctx) {
    ctx.save();

    let staffSpace = this.score.staffSize * 0.25;

    ctx.lineCap = 'butt';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 2 * staffSpace);
    ctx.lineTo(this.x, this.y + 2 * staffSpace);
    ctx.stroke();
    ctx.restore();
  }

  toSVG(svg) {
    // let staffSpace = this.score.staffSize * 0.25;
    let barlineThickness = 1;
    let x = this.x + barlineThickness * 0.5;
    svg.line(x, this.y1, x, this.y2).stroke({width: barlineThickness});
  }
}
