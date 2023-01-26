import ScorePageItem from './score-page-item.js';

export default class ScorePageText extends ScorePageItem {
  constructor(item, score, params) {
    super(item, score, params);
  }

  toSVG(svg) {
    let font = {family: 'Palatino, "Palatino Linotype", "URW Palladio"', size: staffSpace * 1.5, style: 'italic'};
    svg.plain(this.text).x(this.x).attr('y', this.y).font(font);
  }
}
