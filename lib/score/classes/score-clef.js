import ScoreMeta from './score-meta.js';
import knowledge from '../knowledge.js';

export default class ScoreClef extends ScoreMeta {
  constructor(item, score, params) {
    super(item, score, params);
    if (this.voice && this.voice.kind && (this.voice.kind === 'drums' || this.voice.kind === 'single-drum')) {
      this.kind = this.kind || 'unpitched1';
      this.glyphName = 'unpitchedPercussionClef1';
    } else {
      this.kind = this.kind || 'g';
      if (this.kind === 'unpitched1') {
        this.glyphName = 'unpitchedPercussionClef1';
      } else {
        this.glyphName = this.kind + 'Clef';
        if (this.octave === 1) this.glyphName += '8va';
        else if (this.octave === -1) this.glyphName += '8vb';
      }
    }
  }

  innerWidth() {
    let glyphData = this.score.musicFontMetadata.glyphBBoxes;
    let glyphName = this.glyphName;
    if (glyphData[glyphName]) {
      return glyphData[glyphName].bBoxNE[0];
    } else {
      console.log('Missing font metrics for ' + glyphName);
      return 3;
    }
  }

  visibleYPos() {
    switch (this.kind) {
      case 'g': return 1;
      case 'f': return -1;
      case 'c': return 0;
      default: return 0;
    }
  }

  toSVG(svg) {
    let smufl = knowledge.smuflCodepoints;
    svg.plain(smufl[this.glyphName]).x(this.x).attr('y', this.y).font({family: null, size: null});
  }
}
