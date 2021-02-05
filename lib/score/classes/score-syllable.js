import ScoreDetail from './score-detail.js';

export default class ScoreSyllable extends ScoreDetail {
  constructor(item, score, params) {
    super(item, score, params);
    this.verse = this.verse || 0;
    this.text = item.text;
    this.hyphen = item.hyphen;
    this.extender = item.extender;
  }

  visibleYPos() {
    return 6 + this.verse * 3;
  }

  toSVG(svg) {
    let staffSize = this.score.staffSize;
    let staffSpace = staffSize * 0.25;
    let owner = this.owner;
    let y = owner.y + staffSpace * this.visibleYPos();
    let text = this.text;
    let font = {family: 'Times New Roman', size: 13};
    let x = owner.x;

    if (owner.tiedFrom) {
      font.anchor = 'start';
    } else {
      x += staffSpace * owner.innerWidth() * 0.5;
      font.anchor = 'middle';
    }
    svg.plain(text).x(x).attr('y', y).font(font);

    if (this.hyphen) {
      svg.plain('-').x(x + 5).attr('y', y).font({family: 'Times New Roman', size: 13, anchor: 'start'});
    }
  }
}

