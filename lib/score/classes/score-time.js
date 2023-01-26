import ScoreMeta from './score-meta.js';
// import knowledge from '../knowledge.js';

export default class ScoreTime extends ScoreMeta {
  // constructor(item, score, params) {
  //   super(item, score, params);
  // }

  innerWidth() {
    return 2; // TODO
  }

  minSpace(nextItem) {
    return 1.5;
  }

  toSVG(svg) {
    let staffSpace = this.score.staffSize * 0.25;
    let n = this.item.num;
    let d = this.item.denom;
    // let smufl = knowledge.smuflCodepoints;
    if (this.item.abbreviate && n === 4 && d === 4) {
      svg.smuflGlyph('timeSigCommon', this.x, this.y);
    } else if (this.item.abbreviate && this.num === 2 && this.denom === 2) {
      svg.smuflGlyph('timeSigCutCommon', this.x, this.y);
    } else {
      svg.smuflGlyph('timeSig' + n, this.x, this.y - staffSpace);
      svg.smuflGlyph('timeSig' + d, this.x, this.y + staffSpace);
    }
  }
}
