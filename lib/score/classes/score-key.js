import ScoreMeta from './score-meta.js';
import ScoreTime from './score-time.js';
import ScoreNoteChord from './score-note-chord.js';
import scoreKnowledge from '../knowledge.js';
// import knowledge from '../../knowledge.js';

export default class ScoreKey extends ScoreMeta {
  constructor(item, score, params) {
    super(item, score, params);
    if (item) {
      this.root = item.root;
      this.mode = item.mode;
      this.fifths = this.root.fifths();
      let modeName = this.mode.getName();
      if (modeName === 'major') {
      } else if (modeName === 'minor') {
        this.fifths -= 3;
      }
    } else {
      this.root = null;
      this.mode = null;
      this.fifths = 0;
    }
    this.accidentals = [0, 0, 0, 0, 0, 0, 0];
    this.positions = [];
    if (this.fifths < 0) {
      this.positions = scoreKnowledge.keySignatures.flat.slice(0, -this.fifths);
      // TODO: don't hardcode, and don't limit to "simple" modes
      for (let n = 0; n < -this.fifths; n++) {
        // this.accidentals[['b', 'e', 'a', 'd', 'g', 'c', 'f'][n]] = -1;
        this.accidentals[[6, 2, 5, 1, 4, 0, 3][n]] = -1;
      }
    } else if (this.fifths > 0) {
      this.positions = scoreKnowledge.keySignatures.sharp.slice(0, this.fifths);
      for (let n = 0; n < this.fifths; n++) {
        // this.accidentals[['f', 'c', 'g', 'd', 'a', 'e', 'b'][n]] = 1;
        this.accidentals[[3, 0, 4, 1, 5, 2, 6][n]] = 1;
      }
    }
  }

  innerWidth() {
    return 1 * Math.abs(this.fifths);
  }

  minSpace(nextItem) {
    if (nextItem instanceof ScoreTime) {
      return 0.5;
    } else if (nextItem instanceof ScoreNoteChord) {
      return 2;
    } else {
      return 1;
    }
  }

  toSVG(svg) {
    let staffSize = this.score.staffSize;
    let staffSpace = staffSize * 0.25;
    if (this.fifths < 0) {
      for (let n = 0; n < -this.fifths; n++) {
        svg.smuflGlyph('accidentalFlat', this.x + n * staffSpace * 1, this.y - this.positions[n] * staffSpace * 0.5, staffSize);
      }
    } else if (this.fifths > 0) {
      for (let n = 0; n < this.fifths; n++) {
        svg.smuflGlyph('accidentalSharp', this.x + n * staffSpace * 1, this.y - this.positions[n] * staffSpace * 0.5, staffSize);
      }
    }
  }
}
