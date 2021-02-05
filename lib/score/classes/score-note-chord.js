import ScoreEvent from './score-event.js';

export default class ScoreNoteChord extends ScoreEvent {

  //  Calculates the default stem direction, the rule are the same
  //  regardles of if the notes are on the same stem or in the same beam:
  //  The note farthest away from the middle line determines the stem direction.
  //  in case of a tie, down is favoured.
  defaultStemDirection() {
    let min = this.notes[0].staffLine;
    let max = this.notes[this.notes.length - 1].staffLine;
    // for (let note of this.notes) {
    //   min = Math.min(min, note.staffLine);
    //   max = Math.max(max, note.staffLine);
    // }
    let furthest = (Math.abs(min) > Math.abs(max)) ? min : max;
    return furthest > 0 ? 'up' : 'down';
  }

  innerWidth() {
    return Math.max(...this.notes.map(n => n._notehead.bbox.bBoxNE[0]));
  }

  boundingBox() {
    return {
      left: -this.leftExtent,
      top: this.stem.direction === 'up' ? this.stem.end : this.stem.extent,
      right: this.innerWidth() + this.rightExtent,
      bottom: this.stem.direction === 'up' ? this.stem.extent : this.stem.end
    };
  }

  updateExtents() {
    let staffSpace = this.score.staffSize * 0.25;
    this.leftExtent = this.accidentalX || 0;
    let flagExtent = this.flags && !this.beam ? 1 * staffSpace : 0;
    let dotExtent = this.dots * staffSpace * this.score.musicFontMetadata.glyphBBoxes['augmentationDot'].bBoxNE[0] * 2;
    this.rightExtent = Math.max(flagExtent, dotExtent);
  }

/**
 *  Returns the y coordinate (in staff spaces) of the stem start (at a note head)
 *  > 1 notes and stem direction are taken into account
 *
 *  As a secondary value, returns the y coordinate of the outermost edge of the outermost notehead
 *  (usable for calculating the bounding box)
*/
  getStemStart() {
    let notes = this.notes;
    // TODO: use notehead metrics
    if (this.stem.direction === 'up') {
      let note = notes[notes.length - 1];
      let y = note.visibleYPos();
      return {
        start: y,
        extent: y + 0.5
      };
    } else {
      let note = notes[0];
      let y = note.visibleYPos();
      return {
        start: y,
        extent: y - 0.5
      };
    }
  }

 /**
  *  Returns the y coordinate of the stem end (in staff spaces), as if the event is not beamed
  *  > 1 notes and stem direction are taken into account
  */
  getStemEnd() {
    let notes = this.notes;
    let note;
    let spacePerFlag = 1;

    if (notes.length > 1) {
      note = this.stem.direction === 'up' ? notes[0] : notes[notes.length - 1];
    } else {
      note = notes[0];
    }

    // Special case: whole notes don't have a stem
    if (this.noteValue === 'w') {
      return note.visibleYPos() + this.stem.direction === 'up' ? -0.5 : 0.5;
    }

    // Manual stem length
    // if () {
    //
    // }

    // Stem up
    if (this.stem.direction === 'up') {
      // Default is one octave = 3.5 spaces, but shorter stem when note is above the middle staff line
      let result = note.visibleYPos() + (note.staffLine < 0 ? -2.7 : -3.5);
      // Add space for each flag/beam after the first two
      if (this.flags > 2) {
        result -= (this.flags - 2) * spacePerFlag;
      }
      // Stem goes at least to the middle staff line
      if (note.staffLine > 0) {
        result = Math.min(result, 0);
      }
      return result;
    } else {
      // Stem down
      // Default is one octave = 3.5 spaces, but shorter stem when note is below the middle staff line
      let result = note.visibleYPos() + (note.staffLine > 0 ? 2.7 : 3.5);
      // Add space for each flag/beam after the first two
      if (this.flags > 2) {
        result += (this.flags - 2) * spacePerFlag;
      }
      // Stem goes at least to the middle staff line
      if (note.staffLine < 0) {
        result = Math.max(result, 0);
      }
      return result;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.fillStyle = this.defaultColor();

    let staffSpace = this.score.staffSize * 0.25;
    let stemThickness = staffSpace * (this.score.engravingDefaults.stemThickness || 0.12);
    let beamThickness = staffSpace * (this.score.engravingDefaults.beamThickness || 0.5);
    let beamSpacing = staffSpace * (this.score.engravingDefaults.beamSpacing || 0.25);
    let xAdjust = stemThickness * 0.5;

    // Draw notes and collect info about y positions
    let min = this.notes[0].staffLine;
    let max = this.notes[0].staffLine;
    for (let note of this.notes) {
      min = Math.min(min, note.staffLine);
      max = Math.max(max, note.staffLine);
      note.draw(ctx);
    }

    // Draw leger lines if needed
    if (min <= -3) {
      min = Math.ceil(min);
      ctx.beginPath();
      for (let i = -3; i >= min; i--) {
        ctx.moveTo(this.scoreX - 2, this.staffY + i * staffSpace);
        ctx.lineTo(this.scoreX + 10, this.staffY + i * staffSpace);
      }
      ctx.lineWidth = staffSpace * (this.score.engravingDefaults.legerLineThickness || 0.16);
      ctx.stroke();
    }
    if (max >= 3) {
      max = Math.floor(max);
      ctx.beginPath();
      for (let i = 3; i <= max; i++) {
        ctx.moveTo(this.scoreX - 2, this.staffY + i * staffSpace);
        ctx.lineTo(this.scoreX + 10, this.staffY + i * staffSpace);
      }
      ctx.lineWidth = staffSpace * (this.score.engravingDefaults.legerLineThickness || 0.16);
      ctx.stroke();
    }

    // Draw stem and flags
    ctx.lineWidth = stemThickness;
    if (this.noteValue === 'w') {
      // No stem
    } else if (this.stem.direction === 'up') {
      let x = this.scoreX + (this.stemX || 0);
      // Stem
      // Small adjustment: if there is a beam and it is sloped, the outermost stem will be a little too long.
      // We compensate by shortening the stem. Instead of calculating an exact amount,
      // we trust that the stem end will be covered by the beam anyway.
      let stemEnd = this.stem.end + (this.beam ? 0.25 : 0);
      ctx.beginPath();
      ctx.moveTo(x, this.staffY + staffSpace * this.stem.start);
      ctx.lineTo(x, this.staffY + staffSpace * stemEnd);
      ctx.stroke();
      // Flag
      if (!this.beam) {
        x -= xAdjust; // correct?
        switch (this.noteValue) {
          case '8': ctx.fillText('\uE240', x, this.staffY + staffSpace * this.stem.end); break;
          case '16': ctx.fillText('\uE242', x, this.staffY + staffSpace * this.stem.end); break;
          case '32': ctx.fillText('\uE244', x, this.staffY + staffSpace * this.stem.end); break;
          case '64': ctx.fillText('\uE246', x, this.staffY + staffSpace * this.stem.end); break;
        }
      }
    } else {
      let x = this.scoreX + (this.stemX || 0);
      // Stem
      let stemEnd = this.stem.end - (this.beam ? 0.25 : 0);
      ctx.beginPath();
      ctx.moveTo(x, this.staffY + staffSpace * this.stem.start);
      ctx.lineTo(x, this.staffY + staffSpace * stemEnd);
      ctx.stroke();
      // Flag
      if (!this.beam) {
        x -= xAdjust; // correct?
        switch (this.noteValue) {
          case '8': ctx.fillText('\uE241', x, this.staffY + staffSpace * this.stem.end); break;
          case '16': ctx.fillText('\uE243', x, this.staffY + staffSpace * this.stem.end); break;
          case '32': ctx.fillText('\uE245', x, this.staffY + staffSpace * this.stem.end); break;
          case '64': ctx.fillText('\uE247', x, this.staffY + staffSpace * this.stem.end); break;
        }
      }
    }

    // Draw beams
    if (this.beam && this.beam.events[0] === this) {
      let beamEvents = this.beam.events;
      let firstEvent = beamEvents[0];
      let lastEvent = beamEvents[beamEvents.length - 1];
      let firstX = firstEvent.x + (firstEvent.stemX || 0);
      let lastX = lastEvent.x + (lastEvent.stemX || 0);
      let firstY = this.staffY + staffSpace * firstEvent.stem.end;
      let lastY = this.staffY + staffSpace * lastEvent.stem.end;
      let slope = (lastY - firstY) / (lastX - firstX);

      if (this.stem.direction === 'down') firstY -= beamThickness;

      // console.log('Drawing beam: ', this.beam, firstY, lastY, this.staffY, slope, firstX, lastX);
      for (let level of this.beam.beams) {
        // console.log('  Level: ', level);
        for (let beam of level) {
          let event1 = beam[0];
          let event2 = beam[beam.length - 1];
          let x1 = event1.x + (event1.stemX || 0) - xAdjust;
          let x2 = event2.x + (event2.stemX || 0) + xAdjust;

          // Beamlet
          // TODO: make sure they always point in the correct direction
          if (event1 === event2) {
            if (event1 === firstEvent) {
              x2 = x1 + staffSpace * 1.1;
            } else {
              x1 = x2 - staffSpace * 1.1;
            }
          }

          let y1 = firstY + (x1 - firstX) * slope;
          let y2 = firstY + (x2 - firstX) * slope;

          // console.log('  Drawing [' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ']');

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y2 + beamThickness);
          ctx.lineTo(x1, y1 + beamThickness);
          ctx.closePath();
          ctx.fill();
        }
        if (this.stem.direction === 'up') {
          firstY += beamThickness + beamSpacing;
        } else {
          firstY -= beamThickness + beamSpacing;
        }
      }
    }
    ctx.restore();
  }

  toSVG(svg) {
    svg.fill(this.defaultColor());
    svg.addClass('ScoreNoteChord');
    svg.addClass('voice-' + this.voice.id);
    // lineCap = 'butt';

    let score = this.score;
    let staffSpace = score.staffSize * 0.25;
    let stemThickness = staffSpace * (score.engravingDefaults.stemThickness || 0.12);
    let beamThickness = staffSpace * (score.engravingDefaults.beamThickness || 0.5);
    let beamSpacing = staffSpace * (score.engravingDefaults.beamSpacing || 0.25);
    let xAdjust = stemThickness * 0.5;

    // Draw notes and collect info about y positions
    let min = this.notes[0].staffLine;
    let max = this.notes[0].staffLine;
    for (let note of this.notes) {
      min = Math.min(min, note.staffLine);
      max = Math.max(max, note.staffLine);
      let group = svg.group();
      note.toSVG(group);
      group.addClass('ScoreNote');
      group.addClass('voice-' + this.voice.id);
      // Add references
      note.svgElement = group;
      score.itemsBySVGID[group.id()] = note;
      // Attach message handlers
      group.on('mouseenter', score.handleMouseEnter.bind(score));
      group.on('mouseleave', score.handleMouseLeave.bind(score));
      group.on('click', score.handleClick.bind(score));
    }

    // Draw syllables
    for (let syllable of this.syllables) {
      let group = svg.group();
      syllable.toSVG(group);
      group.addClass('ScoreSyllable');
      group.addClass('ScoreItem');
      // Add references
      syllable.svgElement = group;
      score.itemsBySVGID[group.id()] = syllable;
      // Attach message handlers
      group.on('mouseenter', score.handleMouseEnter.bind(score));
      group.on('mouseleave', score.handleMouseLeave.bind(score));
      group.on('click', score.handleClick.bind(score));
    }

    // Draw leger lines if needed
    if (min <= -3) {
      min = Math.ceil(min);
      let legerLines = svg.group().stroke({width: staffSpace * (this.score.engravingDefaults.legerLineThickness || 0.16)});
      let ext = staffSpace * (this.score.engravingDefaults.legerLineExtension || 0.4);
      for (let i = -3; i >= min; i--) {
        legerLines.line(this.scoreX - ext, this.staffY + i * staffSpace, this.scoreX + this.innerWidth() * staffSpace + ext, this.staffY + i * staffSpace);
      }
    }
    if (max >= 3) {
      max = Math.floor(max);
      let legerLines = svg.group().stroke({width: staffSpace * (this.score.engravingDefaults.legerLineThickness || 0.16)});
      let ext = staffSpace * (this.score.engravingDefaults.legerLineExtension || 0.4);
      for (let i = 3; i <= max; i++) {
        legerLines.line(this.scoreX - ext, this.staffY + i * staffSpace, this.scoreX + this.innerWidth() * staffSpace + ext, this.staffY + i * staffSpace);
      }
    }

    // Draw stem and flags
    if (this.noteValue === 'w') {
      // No stem for whole notes
    } else if (this.stem.direction === 'up') {
      let x = this.scoreX + (this.stemX || 0);
      // Stem
      // Small adjustment: if there is a beam and it is sloped, the outermost stem will be a little too long.
      // We compensate by shortening the stem. Instead of calculating an exact amount,
      // we trust that the stem end will be covered by the beam anyway.
      let stemEnd = this.stem.end + (this.beam ? 0.25 : 0);
      let line = svg.line(x, this.staffY + staffSpace * this.stem.start, x, this.staffY + staffSpace * stemEnd).addClass('stem');
      line.stroke({width: stemThickness});
      // Flag
      if (!this.beam) {
        x -= xAdjust; // correct?
        let y = this.staffY + staffSpace * this.stem.end;
        switch (this.noteValue) {
          case '8': svg.plain('\uE240').x(x).attr('y', y).font({family: null, size: null}); break;
          case '16': svg.plain('\uE242').x(x).attr('y', y).font({family: null, size: null}); break;
          case '32': svg.plain('\uE244').x(x).attr('y', y).font({family: null, size: null}); break;
          case '64': svg.plain('\uE246').x(x).attr('y', y).font({family: null, size: null}); break;
          case '128': svg.plain('\uE248').x(x).attr('y', y).font({family: null, size: null}); break;
          case '256': svg.plain('\uE24A').x(x).attr('y', y).font({family: null, size: null}); break;
        }
      }
    } else {
      let x = this.scoreX + (this.stemX || 0);
      // Stem
      let stemEnd = this.stem.end - (this.beam ? 0.25 : 0);
      let line = svg.line(x, this.staffY + staffSpace * this.stem.start, x, this.staffY + staffSpace * stemEnd).addClass('stem');
      line.stroke({width: stemThickness});
      // // Flag
      if (!this.beam) {
        x -= xAdjust; // correct?
        let y = this.staffY + staffSpace * this.stem.end;
        switch (this.noteValue) {
          case '8': svg.plain('\uE241').x(x).attr('y', y).font({family: null, size: null}); break;
          case '16': svg.plain('\uE243').x(x).attr('y', y).font({family: null, size: null}); break;
          case '32': svg.plain('\uE245').x(x).attr('y', y).font({family: null, size: null}); break;
          case '64': svg.plain('\uE247').x(x).attr('y', y).font({family: null, size: null}); break;
          case '128': svg.plain('\uE249').x(x).attr('y', y).font({family: null, size: null}); break;
          case '256': svg.plain('\uE24B').x(x).attr('y', y).font({family: null, size: null}); break;
        }
      }
    }

    // Draw beams
    if (this.beam && this.beam.events[0] === this) {
      let beamEvents = this.beam.events;
      let firstEvent = beamEvents[0];
      let lastEvent = beamEvents[beamEvents.length - 1];
      let firstX = firstEvent.x + (firstEvent.stemX || 0);
      let lastX = lastEvent.x + (lastEvent.stemX || 0);
      let firstY = this.staffY + staffSpace * firstEvent.stem.end;
      let lastY = this.staffY + staffSpace * lastEvent.stem.end;
      let slope = (lastY - firstY) / (lastX - firstX);

      if (this.stem.direction === 'down') firstY -= beamThickness;

      // console.log('Drawing beam: ', this.beam, firstY, lastY, this.staffY, slope, firstX, lastX);
      for (let level of this.beam.beams) {
        // console.log('  Level: ', level);
        for (let beam of level) {
          let event1 = beam[0];
          let event2 = beam[beam.length - 1];
          let x1 = event1.x + (event1.stemX || 0) - xAdjust;
          let x2 = event2.x + (event2.stemX || 0) + xAdjust;

          // Beamlet
          // TODO: make sure they always point in the correct direction
          if (event1 === event2) {
            if (event1 === firstEvent) {
              x2 = x1 + staffSpace * 1.1;
            } else {
              x1 = x2 - staffSpace * 1.1;
            }
          }

          let y1 = firstY + (x1 - firstX) * slope;
          let y2 = firstY + (x2 - firstX) * slope;

          // console.log('  Drawing [' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ']');

          svg.path([
            'M', x1, y1,
            'L', x2, y2,
            'L', x2, y2 + beamThickness,
            'L', x1, y1 + beamThickness,
            'Z']).fill();
        }
        if (this.stem.direction === 'up') {
          firstY += beamThickness + beamSpacing;
        } else {
          firstY -= beamThickness + beamSpacing;
        }
      }
    }
  }

  toString() {
    return `[ScoreNoteChord (${this.notes.length})]`;
  }
}
