import knowledge from '../knowledge';
import ScoreItem from './score-item';

export default class ScoreNote extends ScoreItem {
  constructor(item, score, params) {
    super(item, score, params);
    let coord = item.pitch.toCoord();
    this.coord = coord;
    if (this.voice.kind === 'single-drum') {
      this.staffLine = 0;
    } else if (this.clef) {
      switch (this.clef.kind) {
        case 'g': this.staffLine = 20.5 - (coord[0] * 0.5); break;
        case 'c': this.staffLine = 17.5 - (coord[0] * 0.5); break;
        case 'f': this.staffLine = 14.5 - (coord[0] * 0.5); break;
      }
      this.staffLine += this.clef.octave * 3.5;
    } else {
      // Assume g clef
      this.staffLine = 20.5 - (coord[0] * 0.5);
    }
  }

  visibleYPos() {
    return this.staffLine;
  }

  set notehead(notehead) {
    this._notehead = {
      name: notehead,
      bbox: this.score.musicFontMetadata.glyphBBoxes[notehead],
      anchors: this.score.musicFontMetadata.glyphsWithAnchors[notehead]
    };
  }

  get notehead() {
    return this._notehead.name;
  }

  boundingBox() {
    // TODO: don't hardcode
    let bbox = this._notehead.bbox;
    return {
      left: bbox.bBoxSW[0],
      top: -bbox.bBoxNE[1],
      right: bbox.bBoxNE[0],
      bottom: -bbox.bBoxSW[1]
    };
    //   (let ((metrics (svref *glyph-data* (notehead-to-smufl-index (notehead self)))))
    // (values (- (glyph-left metrics) (glyph-notehead-origin-x metrics))
    //         (glyph-top metrics)
    //         (- (glyph-right metrics) (glyph-notehead-origin-x metrics))
    //         (glyph-bottom metrics)))
  }

  draw(ctx) {
    let snc = this.scoreNoteChord;
    // console.log('Drawing notehead at ' + snc.x + ', ' + snc.y);
    let noteY = snc.y + this.score.staffSize * 0.25 * this.visibleYPos();
    let str = knowledge.smuflCodepoints[this.notehead];
    let x = snc.x + this.noteX;
    ctx.fillText(str, x, noteY);
    let dotX = x + 10; // TODO
    for (let d = 0; d < snc.dots; d++) {
      ctx.fillText('\uE1E7', dotX, noteY);
      dotX += 7; // TODO
    }
  }

  toSVG(svg) {
    let snc = this.scoreNoteChord;
    let staffSize = this.score.staffSize;
    let noteY = snc.y + staffSize * 0.25 * this.visibleYPos();
    let x = snc.x + this.noteX;
    svg.smuflGlyph(this.notehead, x, noteY, staffSize);
    if (snc.dots) {
      let dotW = staffSize * 0.25 * this.score.musicFontMetadata.glyphBBoxes['augmentationDot'].bBoxNE[0];
      let dotX = snc.x + snc.dotX + dotW;
      let dotY = noteY + (this.staffLine % 1 !== 0 ? 0 : staffSize * -0.125);
      for (let d = 0; d < snc.dots; d++) {
        svg.smuflGlyph('augmentationDot', dotX, dotY, staffSize);
        dotX += dotW * 2;
      }
    }

    // Accidental
    if (this.displayedAccidental !== undefined) {
      svg.smuflGlyph(knowledge.accidentals[this.displayedAccidental], x + this.accidentalX, noteY, staffSize);
    }
  }

  toString() {
    return `[ScoreNote ${this.item.pitch.scientific()}]`;
  }
}
