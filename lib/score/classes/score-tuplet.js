import ScoreMeta from './score-meta';
import Fraction from 'fraction.js';

export default class ScoreTuplet extends ScoreMeta {
  constructor(item, score, params) {
    super(item, score, params);
    let fraction = new Fraction(1).div(item.scale);
    let text = fraction.n + ':' + fraction.d;
    if (['3:2', '2:3', '3:2', '4:3', '5:4', '6:4', '7:4', '7:6', '7:8', '9:8'].indexOf(text) >= 0) {
      text = text.substr(0, 1);
    }
    this.text = text;
  }

  get floating() {
    return true;
  }

  toSVG(svg) {
    let staffSpace = this.score.staffSize * 0.25;
    // let x = this.x;
    // let y = this.y;
    // let thickness = this.score.engravingDefaults.bracketThickness || 0.5 * staffSpace;
    // let line = svg.line(this.x, this.y - 20, this.x + 10, this.y - 20);
    // svg.smuflGlyph(, this.x + 20, this.y - 20, this.score.staffSize);
    // line.stroke({width: thickness});
    let font = {family: 'Palatino, "Palatino Linotype", "URW Palladio"', size: staffSpace * 1.5, style: 'italic'};
    svg.plain(this.text).x(this.x + 20).attr('y', this.y + 10).font(font);
  }
}
