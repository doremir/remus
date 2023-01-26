import StaffSystem from './classes/staff-system.js';
import ScoreEvent from './classes/score-event.js';
import ScoreMeta from './classes/score-meta.js';
import ScoreBar from './classes/score-bar.js';
import ScoreBracket from './classes/score-bracket.js';
import ScoreClef from './classes/score-clef.js';
import ScoreKey from './classes/score-key.js';
import ScoreNoteChord from './classes/score-note-chord.js';
import ScoreNote from './classes/score-note.js';
import ScoreRest from './classes/score-rest.js';
import ScoreTie from './classes/score-tie.js';
import ScoreTime from './classes/score-time.js';
import ScoreTuplet from './classes/score-tuplet.js';
import ScoreSyllable from './classes/score-syllable.js';
import ScorePageText from './classes/score-page-text.js';
import NoteChord from '../classes/event/note-chord.js';
// import Note from '../classes/event/note.js';
import Rest from '../classes/event/rest.js';
import Key from '../classes/meta/key.js';
import Clef from '../classes/meta/clef.js';
import Tuplet from '../classes/event/tuplet.js';
import Interval from '../classes/interval.js';
import knowledge from './knowledge.js';
import Fraction from 'fraction.js';

import SVG from 'svg.js';
import _ from 'underscore';

let scoreMetaOrdering = [
  ScoreClef,
  // ScoreSlur,
  ScoreBar,
  ScoreKey,
  ScoreTime,
  // ScoreTempo,
  ScoreTuplet
];

export default class Score {
  constructor(params) {
    this.song = params.song;
    this.staffSystems = [];
    this.staffSize = params.staffSize || 28;
    this.width = params.width || 700;
    this.height = params.height || 1200;
    this.staffWidth = params.staffWidth || 600; // TODO
    this.zoom = 1.0;
    this.musicFont = params.musicFont || 'RemusBravura';
    this.musicFontMetadata = params.musicFontMetadata || { glyphBBoxes: {}, glyphsWithAnchors: {} };
    this.musicFontGlyphs = params.musicFontGlyphs || {};
    this.engravingDefaults = params.engravingDefaults || this.musicFontMetadata.engravingDefaults || {};
    this.staffDistance = params.staffDistance || 80;
    this.firstStaffSystemY = params.firstStaffSystemY || 40;
    this.staffSystemDistance = params.staffSystemDistance || 160;
    this.autoSystemBreaks = params.autoSystemBreaks || false; // TODO: Rename to pageMode or something like that
    this.hiddenElements = params.hiddenElements || [];
    this.referenceDuration = params.referenceDuration || 0.2;
    this.referenceNoteSpace = params.referenceNoteSpace || 3.0;
    this.horizontalProportionalFactor = params.horizontalProportionalFactor || 0.65;
    this.raggedRight = params.raggedRight || false;  // Don't justify staff systems
    this.raggedLast = params.raggedLast === false ? false : true;     // Don't justify last staff system
    this.measureLayout = params.measureLayout || null;
  }

  updateScore() {
    //
    // This is the main entry point for creating a Score.
    //
    // Score creation consists of a couple of phases:
    //
    // 0)  Decide which voices to "draw"
    //
    // 1)  Generate a "score list" for each voice, i.e. a list of ScoreItems corresponding
    //     to the Items in the voice
    //     Main function: makeScoreList()
    //
    // 2)  Combine the score lists "column-wise", grouping score items that happen at the same time and
    //     can be aligned horizontally
    //     Main function: groupScoreLists()
    //
    // 3)  Calculate stems, beams, accidentals etc
    //     Functions: calculateStemsAndBeams(), shiftSecondIntervalsAndSetDeltas()
    //
    // 4)  Distribute score items horizontally, effectively creating one long staff system
    //     Main function: layoutScoreItems()
    //
    // 5)  Break the score into multiple staff systems if needed and required
    //     Functions: breakScore(), dontBreakScore()
    //
    // 6)  Create additional score items (ties, slurs, brackets etc)
    //     Functions: createTies(), createBrackets(), ...
    //
    // 7)  Calculate vertical spacing (esp. if more than one staff system)
    //     and let each ScoreItem store its own position
    //
    // 8)  Make final adjustments to some ScoreItems
    //     Functions: adjustBeams()
    //
    //  (In reality, step 5-8 are somewhat interleaved for simplicity and performance reasons)
    //
    //  Additionally, the current selection is stored in the beginning of the function and
    //  restored (if possible) in the end, after score creating is finished.
    //
    //  Finally, call onScoreUpdated callback (if set).
    //

    let song = this.song;
    if (!song) return; // sanity check

    //
    //  Store selection
    //

    let selectedItems = this.sel ? this.sel.map(i => { return i.item; }) : [];
    let newSelection = [];

    //
    //  Step 0:  Decide which voices to "draw"
    //

    song.resolve();
    let voices = song.findEvents('Voice');
    let scoreLists = [];
    let voiceStaves = [];
    // voices = [voices[0]]; // TEMP

    //
    //  Step 1:  Generate a "score list" for each voice
    //

    let staff = 0;
    let staves = [];
    for (let voice of voices) {
      scoreLists.push(makeScoreList(voice, this, {voice: voice}));
      staves.push({id: staff, staffLines: voice.kind === 'single-drum' ? 1 : 5});
      voiceStaves[voice.id] = staff++;
    }
    this.staves = staves;

    //
    //  Step 2:  Combine the score lists "column-wise"
    //

    // Temp: assign staff slot of all items.
    // This should probably be done directly by makeScoreList
    for (let scoreList of scoreLists) {
      for (let item of scoreList) {
        item.staff = item.voice ? voiceStaves[item.voice.id] : 0;
      }
    }

    let scoreListGroups = groupScoreLists(scoreLists);

    //
    //  Step 3:  Calculate stems, beams, accidentals etc
    //

    createAccidentals(scoreListGroups);
    calculateStemsAndBeams(scoreListGroups);
    shiftSecondIntervalsAndSetDeltas(scoreListGroups, this);

    //
    //  Step 4:  Distribute score items horizontally
    //  Step 5:  Break the score into multiple staff systems if needed
    //

    let staffSystems;
    if (this.autoSystemBreaks) { // TODO: what to call this parameter?
      staffSystems = breakScore(layoutScoreItems(scoreListGroups, this), this); // TODO: width
    } else {
      staffSystems = dontBreakScore(layoutScoreItems(scoreListGroups, this), this);
    }
    this.staffSystems = staffSystems;

    //
    //  Step 6:  Create additional score items (ties, slurs, brackets etc)
    //  Step 7:  Calculate vertical spacing and let each ScoreItem store its own position
    //  Step 8:  Make final adjustments to some ScoreItems
    //

    for (let staffSystem of staffSystems) {
      adjustBeams(staffSystem.items);
      if (this.elementVisible('ScoreTie')) {
        staffSystem.items = staffSystem.items.concat(createTies(staffSystem.items, this));
        for (let item of staffSystem.items) {
          // item.staff = item.voice ? voiceStaves[item.voice.id] : 0; // TEMP!!
          item.staffY = this.staffDistance * item.staff; // TEMP!!
          item.updatePosition();
          item.updateBounds();
          if (selectedItems.indexOf(item.item) >= 0) {
            newSelection.push(item);
          }
        }
      }
      if (this.elementVisible('ScoreBracket')) {
        createBrackets(staffSystem, this);
      }
    }

    //
    //  Restore selection
    //

    this.sel = newSelection;

    //
    //  Finished! Now call callback if set
    //

    if (this.onScoreUpdated instanceof Function) this.onScoreUpdated();
    console.log(this.staffSystems);
  }

  itemAt(x, y) {
    return this.staffSystems[0].itemAt(x, y);
  }

  draw(ctx, x = 0, y = 0, w = this.width, h = this.height) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.font = this.staffSize + 'px ' + this.musicFont;
    for (let s = 0; s < this.staffSystems.length; s++) {
      this.staffSystems[s].draw(ctx);
    }
    ctx.restore();
  }

  hideElements(elementClasses) {
    this.hiddenElements = elementClasses;
    this.updateScore();
  }

  elementVisible(elementClass) {
    return _.all(this.hiddenElements, (el) => el !== elementClass);
  }

  toSVG(svg) {
    this.itemsBySVGID = {};
    svg.on('click', this.handleClick.bind(this));
    svg = svg.group().id('score');
    // svg.attr({'font-family': this.musicFont, 'font-size': this.staffSize + 'px '});
    svg.font({family: this.musicFont, size: this.staffSize});
    for (let s = 0; s < this.staffSystems.length; s++) {
      let staffSystem = this.staffSystems[s].toSVG(svg);
      this.itemsBySVGID[staffSystem.id()] = this.staffSystems[s];
    }
  }

  toString() {
    return '[Score]';
  }

  handleClick(e) {
    let svgElem = e.target;
    let svgID = null;
    if (svgElem) {
      svgElem = SVG.adopt(svgElem);
      svgElem = svgElem.parent('.ScoreNote') || svgElem.parent('.ScoreItem');
      if (svgElem) {
        svgID = svgElem.id instanceof Function ? svgElem.id() : svgElem.id;
      }
    }
    let item = svgID ? this.itemsBySVGID[svgID] : null;
    if (item) {
      // Clicked an item
      if (e.shiftKey) {
        // ... with shift key = add to selection
        if (this.sel) {
          this.sel.push(item);
        } else {
          this.sel = [item];
        }
      } else {
        // ... without shift key = set new selection
        if (this.sel) {
          for (let i of this.sel) {
            if (i !== item && i.svgElement) i.svgElement.removeClass('selected');
          }
        }
        this.sel = [item];
      }
      svgElem.addClass('selected');
    } else {
      // No item clicked
      if (this.sel) {
        for (let item of this.sel) {
          if (item.svgElement) item.svgElement.removeClass('selected');
        }
      }
      this.sel = null;
    }
    e.stopPropagation();
    // Call handler if bound
    if (this.onSelectionChanged instanceof Function) {
      this.onSelectionChanged(this);
    }
  }

  handleMouseEnter(e) {
    let element = SVG.adopt(e.target);
    element.addClass('hovered');
    if (element.hasClass('ScoreNote')) {
      element.parent().addClass('hovered-note');
    }
  }

  handleMouseLeave(e) {
    let element = SVG.adopt(e.target);
    element.removeClass('hovered');
    if (element.hasClass('ScoreNote')) {
      element.parent().removeClass('hovered-note');
    }
  }

  handleKeyDown(e) {
    if (e.keyCode === 38) {
      if (this.sel) {
        let changed = false;
        for (let item of this.sel) {
          if (item instanceof ScoreNoteChord) {
            for (let scoreNote of item.notes) {
              scoreNote.item.pitch.transpose(Interval.fromString('M2'));
              changed = true;
            }
          }
        }
        if (changed) {
          this.updateScore();
        }
      }
    } else if (e.keyCode === 40) {
      if (this.sel) {
        let changed = false;
        for (let item of this.sel) {
          if (item instanceof ScoreNoteChord) {
            for (let scoreNote of item.notes) {
              scoreNote.item.pitch.transpose(Interval.fromString('M-2'));
              changed = true;
            }
          }
        }
        if (changed) {
          this.updateScore();
        }
      }
    } else if (e.keyCode === 37) {
      // left arrow
    } else if (e.keyCode === 39) {
      // right arrow
    }
    e.stopPropagation();
    e.preventDefault();
  }

  handleKeyUp(e) {
    e.stopPropagation();
    e.preventDefault();
  }
}

Score.knowledge = knowledge;

function makeScoreList(container, score, params = {}, eventsOnly) {
  let items = container.events;
  let scoreItems = [];
  let first = true;
  let position = new Fraction(0);
  let voice = params.voice;
  let drumMode = (voice.kind === 'drums' || voice.kind === 'single-drum');
  let measureDuration = new Fraction(container.cache.time.num, container.cache.time.denom);
  let beats = [];
  let totalAtoms = 0;
  for (let beat of container.cache.time.beats.slice(0, -1)) {
    totalAtoms += beat;
    beats.push(new Fraction(totalAtoms, container.cache.time.denom));
  }
  // let timeScale = params.timeScale || 1;

  // Get first clef
  let clef = params.clef || container.metas.find(m => m instanceof Clef && m.cache.absWn.equals(container.cache.absWn));

  if (!eventsOnly) {
    if (drumMode) {
      if (score.elementVisible('ScoreClef')) {
        scoreItems.push(new ScoreClef(null, score, {position: new Fraction(0), voice: params.voice}));
      }
      if (score.elementVisible('ScoreTime')) {
        scoreItems.push(new ScoreTime(container.cache.time, score, {position: new Fraction(0), voice: params.voice}));
      }
    } else {
      if (score.elementVisible('ScoreClef')) {
        let clefKind = clef ? clef.kind : 'g';
        let clefOctave = clef ? clef.octave : 0;
        scoreItems.push(new ScoreClef(null, score, {position: new Fraction(0), voice: params.voice, kind: clefKind, octave: clefOctave}));
      }
      if (score.elementVisible('ScoreTime')) {
        scoreItems.push(new ScoreTime(container.cache.time, score, {position: new Fraction(0), voice: params.voice}));
      }
      let key = container.metas.find(m => m instanceof Key && m.cache.absWn.equals(container.cache.absWn)) || container.cache.key;
      if (key && score.elementVisible('ScoreKey')) {
        scoreItems.push(new ScoreKey(key, score, {position: new Fraction(0), voice: params.voice}));
      }
    }
  }

  for (let item of items) {
    // if (item instanceof Note) {
    //   item = new NoteChord({events: [item], duration: item.duration});
    // }
    if (item.cache.absWn.mod(measureDuration).valueOf() === 0) {
      if (first) {
        first = false;
      } else if (score.elementVisible('ScoreBar')) {
        scoreItems.push(new ScoreBar(null, score, {position: item.cache.absWn, voice: params.voice}));
      }
    }
    // NoteChord
    if (item instanceof NoteChord && score.elementVisible('ScoreNoteChord')) {
      let scoreItem = new ScoreNoteChord(item, score);
      let dur = knowledge.noteValues[item.cache.duration.value.toFraction()];
      if (!dur) console.log('No duration data for ' + item.cache.duration.value.toFraction());
      scoreItem.voice = params.voice;
      scoreItem.noteValue = dur.noteValue;
      scoreItem.flags = dur.flags;
      scoreItem.dots = dur.dots;
      scoreItem.notes = [];
      scoreItem.syllables = [];
      scoreItem.tiedFrom = item.tiedFrom;
      scoreItem.tiedTo = item.tiedTo;
      scoreItem.position = item.cache.absWn;
      scoreItem.duration = item.cache.duration.value;
      for (let note of item.events) {
        let scoreNote = new ScoreNote(note, score, {voice: params.voice, clef: clef});
        scoreNote.scoreNoteChord = scoreItem;
        scoreNote.tiedFrom = note.tiedFrom || item.tiedFrom;
        scoreNote.tiedTo = note.tiedTo || item.tiedTo;
        scoreNote.notehead = dur.notehead;
        // scoreNote.voice = params.voice;
        scoreItem.notes.push(scoreNote);
      }
      scoreItem.notes.sort((a, b) => { return a.staffLine - b.staffLine; });
      // Lyrics
      if (!item.tiedTo) { // TODO!!
        let verse = 0;
        for (let syllable of item.syllables) {
          let scoreSyllable = new ScoreSyllable(syllable, score, {verse: verse});
          scoreSyllable.owner = scoreItem;
          scoreItem.syllables.push(scoreSyllable);
          verse++;
        }
      }
      scoreItems.push(scoreItem);
    // Rest
    } else if (item instanceof Rest && score.elementVisible('ScoreRest')) {
      let scoreItem = new ScoreRest(item, score);
      let dur = knowledge.noteValues[item.cache.duration.value.toFraction()];
      scoreItem.position = item.cache.absWn;
      scoreItem.duration = item.cache.duration.value;
      scoreItem.voice = params.voice;
      scoreItem.noteValue = dur.noteValue;
      scoreItem.flags = dur.flags;
      scoreItem.dots = dur.dots;
      scoreItems.push(scoreItem);
    // Tuplet
    } else if (item instanceof Tuplet && score.elementVisible('ScoreTuplet')) {
      let tuplet = new ScoreTuplet(item, score);
      tuplet.voice = params.voice;
      tuplet.position = item.cache.absWn;
      let tupletItems = makeScoreList(item, score, Object.assign({clef: clef}, params), true);
      tuplet.items = tupletItems;
      scoreItems.push(tuplet);
      for (let tupletItem of tupletItems) {
        scoreItems.push(tupletItem);
      }
    } else {
      console.log('Skipping event ', item);
    }

    position = item.cache.endWn;
  }

  if (position.mod(measureDuration).valueOf() === 0 && !first && score.elementVisible('ScoreBar')) {
    scoreItems.push(new ScoreBar(null, score, {position: position, voice: params.voice}));
  }

  // Beaming
  let processBeamGroup = function(group) {
    if (group.length > 1) {
      let pitches = [];
      for (let e of group) {
        pitches.push(e.item.cache.absWn.toString());
      }
      group[0].beam = '[';
      group[group.length - 1].beam = ']';
      for (let i = 1; i < group.length - 1; i++) {
        group[i].beam = '=';
      }
    } else {
      group[0].beam = null;
    }
  };
  let beamGroup = [];
  for (let item of scoreItems) {
    if (item instanceof ScoreEvent && score.elementVisible(item.constructor.name)) {
      let beamable = (item instanceof ScoreNoteChord) && item.flags;
      // let atBeat = item.item.cache.absWn.mod(new Fraction(1, 4)).valueOf() === 0; // TODO!!
      let measureOffset = item.item.cache.absWn.mod(measureDuration);
      let atBeat = measureOffset.valueOf() === 0 || beats.some(x => x.equals(measureOffset));
      if (beamGroup.length && (!beamable || atBeat)) {
        processBeamGroup(beamGroup);
        beamGroup = [];
      }
      if (beamable) {
        beamGroup.push(item);
      }
    }
  }
  if (beamGroup.length) processBeamGroup(beamGroup);

  return scoreItems;
}

function createAccidentals(scoreListGroups) {
  // let currentKey = null;
  let keyAccidentals = {};
  let curAccidentals = {};
  const makeRepeated = (arr, repeats) => [].concat(...Array.from({ length: repeats }, () => arr));
  const copyKeyToStaff = function(staff) {
    curAccidentals[staff] = makeRepeated(keyAccidentals[staff] || [0, 0, 0, 0, 0, 0, 0], 12);
  };
  for (let group of scoreListGroups) {
    if (group.items[0] instanceof ScoreKey) {
      for (let scoreKey of group.items) {
        keyAccidentals[scoreKey.staff] = group.items[0].accidentals;
        copyKeyToStaff(scoreKey.staff);
        // console.log('new key:', keyAccidentals, curAccidentals);
      }
      // console.log('Key', keyAccidentals, curAccidentals);
    } else if (group.items[0] instanceof ScoreBar) {
      curAccidentals = {};
    } else {
      for (let item of group.items) {
        if (item instanceof ScoreNoteChord && item.voice.kind !== 'single-drum') {
          let staff = item.staff;
          if (curAccidentals[staff] === undefined) {
            copyKeyToStaff(staff);
          }
          for (let note of item.notes) {
            let step = note.coord[0];
            let accVal = note.item.pitch.accidentalValue();
            if (accVal !== curAccidentals[staff][step] && !note.tiedTo) {
              note.displayedAccidental = accVal;
              curAccidentals[staff][step] = accVal;
            }
          }
        }
      }
    }
  }
}

function calculateStemDirection(scoreNoteList) {
  let maxDistance = 0;
  let direction = 'down';
  for (let note of scoreNoteList) {
    if (note.voice.kind === 'single-drum') {
      return 'up';
    }
    let distanceFromMiddle = Math.abs(note.staffLine);
    if (distanceFromMiddle === maxDistance) {
      if (note.staffLine <= 0) direction = 'down';
    } else if (distanceFromMiddle > maxDistance) {
      direction = note.staffLine > 0 ? 'up' : 'down';
      maxDistance = distanceFromMiddle;
    }
  }
  return direction;
}

/**
 *  Helper function for calculate-stems-and-beams
 */
function getBeamList(scoreEvents) {
  let beamList = [];
  let currentBeamLevel = [];
  let currentBeam = [];
  for (let flag = 1; flag <= 5; flag++) {
    for (let n = 0; n < scoreEvents.length; n++) {
      let thisNoteChord = scoreEvents[n];
      // let nextNoteChord = scoreEvents[n + 1];
      if (thisNoteChord.flags >= flag) currentBeam.push(thisNoteChord);
      if (currentBeam.length && (thisNoteChord.flags < flag)) { // TODO: check for tuplets
        currentBeamLevel.push(currentBeam);
        currentBeam = [];
      }
    }
    if (currentBeam.length) {
      currentBeamLevel.push(currentBeam);
      currentBeam = [];
    }
    if (!currentBeamLevel.length) break;
    beamList.push(currentBeamLevel);
    currentBeamLevel = [];
  }
  return beamList;
}

/**
 *  Calculate stem directions and default stem lengths,
 *  and set beaming data. Stems are *not* adjusted to
 *  match the beam, use adjustBeams for that after this
 *  function has finished.
 */
function calculateStemsAndBeams(itemGroups) {
  let notesPerVoice = {};
  let eventsPerVoice = {};
  for (let group of itemGroups) {
    for (let scoreItem of group.items) {
      // let staffSpace = 0.25 * scoreItem.score.staffSize;
      if (scoreItem instanceof ScoreNoteChord) {
        let voice = scoreItem.voice.id;
        // console.log('voice: ', voice);

        if (scoreItem.beam === '[') {
          // Beginning of a beam: save the note objects to a list
          notesPerVoice[voice] = scoreItem.notes;
          eventsPerVoice[voice] = [scoreItem];
        } else if (scoreItem.beam === '=') {
          // Middle of a beam: save the note objects to a list
          notesPerVoice[voice] = notesPerVoice[voice].concat(scoreItem.notes);
          eventsPerVoice[voice].push(scoreItem);
        } else if (scoreItem.beam === ']') {
          // Beam end: calculate stem directions for the saved note list
          let scoreNotes = notesPerVoice[voice].concat(scoreItem.notes);
          let scoreEvents = eventsPerVoice[voice];
          let stemDirection;
          // let tieDirection;
          scoreEvents.push(scoreItem);
          if (false) {
            // TODO: non-homophonic
          } else {
            // Homophonic
            stemDirection = calculateStemDirection(scoreNotes);
          }

          let beamData = {events: scoreEvents, beams: getBeamList(scoreEvents)};

          for (let e of scoreEvents) {
            e.stem = {direction: stemDirection};
            let stemStart = e.getStemStart();
            let stemEnd = e.getStemEnd();
            e.stem.start = stemStart.start;
            e.stem.extent = stemStart.extent;
            e.stem.end = stemEnd;
            e.beamType = e.beam;
            e.beam = beamData;
          }
        } else {
          // Otherwise, this is a non-beamed event. Calculate stem-direction for this event separately
          // scoreItem.stem = {direction: scoreItem.defaultStemDirection()};
          scoreItem.stem = {direction: calculateStemDirection(scoreItem.notes)};
          let stemStart = scoreItem.getStemStart();
          let stemEnd = scoreItem.getStemEnd();
          scoreItem.stem.start = stemStart.start;
          scoreItem.stem.extent = stemStart.extent;
          scoreItem.stem.end = stemEnd;
          scoreItem.beam = null;
        }
      }
    }
  }
}

/**
 *  Calculates beam slopes and adjusts stem lengths in beams so that all
 *  stems in the beam are connected to the beam. scoreX has to be set
 *  for all ScoreNoteChords before adjustBeams is called.
 */
function adjustBeams(scoreItems) {
  for (let scoreItem of scoreItems) {
    if (scoreItem.beam) {
      let beamData = scoreItem.beam;
      let noteChord1 = beamData.events[0];
      let noteChord2 = beamData.events[beamData.events.length - 1];
      if (noteChord1 !== scoreItem) continue; // Only do this once for every beam
      let stemDir = noteChord1.stem.direction;
      let note1 = stemDir === 'up' ? noteChord1.notes[0] : noteChord1.notes[noteChord1.notes.length - 1];
      let note2 = stemDir === 'up' ? noteChord2.notes[0] : noteChord2.notes[noteChord2.notes.length - 1];
      let flat = note1.staffLine === note2.staffLine;
      // TODO: check more conditions for flatness (such as repeated pattern, concave shapes, two pitches only)
      // See Gould, p. 22-23
      if (flat) {
        let y = (stemDir === 'up' ? Math.min : Math.max)(...beamData.events.map(e => e.stem.end));
        for (let event of beamData.events) {
          event.stem.end = y;
        }
      } else {
        let x1 = noteChord1.scoreX + (noteChord1.stemX || 0);
        let x2 = noteChord2.scoreX + (noteChord2.stemX || 0);
        let y1 = (stemDir === 'up' ? Math.min : Math.max)(...beamData.events.map(e => e.stem.end));
        let y2 = y1;
        let narrow = (x2 - x1) < (noteChord1.score.staffSize * 0.25 * 3); // width less than three staff spaces
        let yDelta = note2.staffLine - note1.staffLine;
        let up = stemDir === 'up';
        if (yDelta < -3.5 && !narrow) {
          if (up) y1 += 1; else y2 -= 1;
        } else if (yDelta <= -2) {
          if (up) y1 += 0.5; else y2 -= 0.5;
        } else if (yDelta < 0) {
          if (up) y1 += 0.25; else y2 -= 0.25;
        } else if (yDelta > 3.5 && !narrow) {
          if (up) y2 += 1; else y1 -= 1;
        } else if (yDelta >= 2) {
          if (up) y2 += 0.5; else y1 -= 0.5;
        } else {
          if (up) y2 += 0.25; else y1 -= 0.25;
        }
        let slope = x1 === x2 ? 0 : (y2 - y1) / (x2 - x1);
        for (let event of beamData.events) {
          event.stem.end = y1 + slope * ((event.scoreX + (event.stemX || 0)) - x1);
        }
      }
    }
  }
}

/**
 *  Create ties for the passed ScoreItems.
 *  NOTE: createTies can be called both StaffSystem-wise or with a complete song-wide SongItems list
 */
function createTies(scoreItems, score) {
  let staffSpace = score.staffSize * 0.25;
  let tiesPerVoice = {};

  // First, collect tied notes
  let ties = [];
  for (let i = 0; i < scoreItems.length; i++) {
    let scoreItem = scoreItems[i];
    if (!(scoreItem instanceof ScoreNoteChord)) continue;
    let voice = scoreItem.voice;
    if (scoreItem.tiedTo) {
      let prevEvent = tiesPerVoice[voice];
      ties.push({
        thisEvent: prevEvent,
        thisNotes: prevEvent ? prevEvent.notes : null,
        nextEvent: scoreItem,
        nextNotes: scoreItem.notes
      });
      tiesPerVoice[voice] = null;
    }
    if (scoreItem.tiedFrom) {
      tiesPerVoice[voice] = scoreItem;
    }
  }
  // Add unfinished ties
  for (let voice in tiesPerVoice) {
    let event = tiesPerVoice[voice];
    if (event) {
      ties.push({
        thisEvent: event,
        thisNotes: event.notes,
        nextEvent: null,
        nextNotes: null
      });
    }
  }

  // Calculate tie directions
  for (let tie of ties) {
    let scoreNotes = tie.thisNotes ? tie.thisNotes : tie.nextNotes;
    let scoreEvent = tie.thisEvent || tie.nextEvent;
    let stemDirection = scoreEvent.stem.direction;
    let i = 0;
    for (let scoreNote of scoreNotes) {
      if (false) { // TODO
        // Polyphony: tie follows stem direction
        scoreNote.tieDirection = stemDirection;
      } else if (scoreNotes.length === 1) {
        // Single note: opposite of stem direction
        scoreNote.tieDirection = stemDirection === 'up' ? 'down' : 'up';
      } else if (stemDirection === 'up') {
        // Multiple notes, stem up: divide evenly. For odd number of ties, middle tie goes down.
        scoreNote.tieDirection = (2 * i + 1) < scoreNotes.length ? 'up' : 'down';
      } else {
        // Multiple notes, stem down: divide evenly. For odd number of ties, middle tie goes up.
        scoreNote.tieDirection = (2 * i + 1) < scoreNotes.length ? 'down' : 'up';
      }
      i++;
    }
  }

  // Create ScoreTies
  let scoreTies = [];
  for (let tie of ties) {
    if (tie.thisEvent && tie.nextEvent && tie.thisEvent.staffSystem === tie.nextEvent.staffSystem) {
      // Begins and ends on the same staff system
      for (let note of tie.thisNotes) {
        let thisNoteChord = tie.thisEvent; // TODO: will not work for draw-by-parent-voice
        let nextNote = tie.nextEvent instanceof ScoreNoteChord
          ? (tie.nextNotes || tie.nextEvent.notes).find(n => {
            return n.voice === note.voice && n.staffLine === note.staffLine;
          })
          : null;
        let nextEvent = nextNote ? nextNote.scoreNoteChord : 0;
        let x1 = thisNoteChord.scoreX + (thisNoteChord.dotX || 0) + 2; // TODO
        let x2 = nextEvent ? nextEvent.scoreX - 2 : x1 + 15; // TODO
        // Very short ties
        if (x2 - x1 < staffSpace * 1.5) {
          // TODO
        }
        let scoreTie = new ScoreTie(null, score, {
          owner: note,
          fromNote: note,
          toNote: nextNote,
          scoreX: x1, // Check if this is correct
          voice: thisNoteChord.voice,
          staff: thisNoteChord.staff,
          staffY: thisNoteChord.staffY,
          staffSystem: thisNoteChord.staffSystem,
          x1: x1,
          x2: x2,
          direction: note.tieDirection // TODO
        });
        if (nextNote) nextNote.tiedTo = scoreTie;
        scoreTies.push(scoreTie);
      }
    } else if (tie.thisEvent) {
      // Begins on a note
      for (let note of tie.thisNotes) {
        let thisNoteChord = tie.thisEvent;
        let x1 = thisNoteChord.scoreX + (thisNoteChord.dotX || 0) + 2; // TODO
        let x2 = x1 + staffSpace * 2;
        let scoreTie = new ScoreTie(null, score, {
          owner: note,
          fromNote: note,
          toNote: null,
          scoreX: x1, // Check if this is correct
          voice: thisNoteChord.voice,
          staff: thisNoteChord.staff,
          staffY: thisNoteChord.staffY,
          staffSystem: thisNoteChord.staffSystem,
          x1: x1,
          x2: x2,
          direction: note.tieDirection // TODO
        });
        scoreTies.push(scoreTie);
      }
    } else if (tie.nextEvent) {
      // Ends on a note
      for (let note of tie.nextNotes) {
        let thisNoteChord = tie.nextEvent;
        let x2 = thisNoteChord.scoreX; // TODO
        let x1 = x2 - staffSpace * 2;
        let scoreTie = new ScoreTie(null, score, {
          owner: note,
          fromNote: null,
          toNote: note,
          scoreX: x1, // Check if this is correct
          voice: thisNoteChord.voice,
          staff: thisNoteChord.staff,
          staffY: thisNoteChord.staffY,
          staffSystem: thisNoteChord.staffSystem,
          x1: x1,
          x2: x2,
          direction: note.tieDirection // TODO
        });
        scoreTies.push(scoreTie);
      }
    }
  }
  // (No need to call update-bounds, this is done later anyway)
  return scoreTies;
}

/**
 *  Takes an array of scoreLists and generates a list of objects, where each object contains
 *  one or more ScoreItems which are to be drawn at the same "logical" x-position in
 *  the score. Actual x-positions are calculated later with regard to spacing etc.
 *
 *  The result list is sorted, so that metas appearing on the same time position are
 *  added in the correct score order.
 *
 *  If a sublist contains a ScoreMeta, it is guaranteed to contain only ScoreMetas
 *  of the same type. Sublists containing ScoreEvents can hold both ScoreNoteChords,
 *  ScoreRests and ScoreDetails (which are not technically ScoreEvents).
 *
 *  NOTE: the scoreLists passed as argument to groupScoreLists are clobbered!
 */
function groupScoreLists(scoreLists) {
  let result = [];

  let lastEventGroup = null;
  scoreLists = scoreLists.filter(a => a.length > 0); // Remove empty lists
  while (scoreLists.length > 0) {
    // let pos = Math.max(...scoreLists.map(sl => sl[0].item.cache.absWn));
    // Find next position to collect. Can't use Math.max, as it clobbers the Fractions
    let pos = Infinity;
    for (let scoreList of scoreLists) {
      // if (!scoreList[0].item) {
      //   console.log('No item for ', scoreList[0]);
      // }
      let p = scoreList[0].position;
      if (p === undefined) {
        console.log('Undefined position for ', scoreList[0]);
      }
      if (p < pos) pos = p;
    }

    if (pos === Infinity) {
      console.warn('No position found at all!', scoreLists);
      break;
    }

    // console.log('pos: ' + pos.valueOf());

    if (!(pos instanceof Fraction)) {
      console.warn('Position is not a Fraction at ', pos);
    }

    // Collect metas at pos
    let currentItems = [];
    for (let scoreList of scoreLists) {
      while (scoreList[0] instanceof ScoreMeta && scoreList[0].position.equals(pos)) {
        // console.log('  first: ', scoreList[0]);
        currentItems.push(scoreList.shift());
      }
    }

    // for (let x = 0; x < scoreLists.length; x++) {
    //   while (scoreLists[x][0] instanceof ScoreMeta && scoreLists[x][0].position.equals(pos)) {
    //     // console.log('  first: ', scoreList[0]);
    //     currentItems.push(scoreLists[x].shift());
    //   }
    // }

    // console.log('  metas collected: ', currentItems);

    // Group metas by type and add them in pre-specified order
    for (let type of scoreMetaOrdering) {
      let itemsOfType = currentItems.filter(item => item instanceof type);
      if (itemsOfType.length > 0) {
        let group = {
          position: pos,
          items: itemsOfType,
          floating: itemsOfType[0].floating,
          fixed: itemsOfType[0].fixedWidth
        };
        result.push(group);
        for (let item of itemsOfType) {
          item.group = group;
        }
      }
    }

    // console.log('  result is now: ', result);
    // console.log('  scoreLists: ', scoreLists);

    // Collect events at pos
    currentItems = [];
    for (let scoreList of scoreLists) {
      while (scoreList.length > 0 && scoreList[0] instanceof ScoreEvent && scoreList[0].position.equals(pos)) {
        currentItems.push(scoreList.shift());
      }
    }

    // Set duration of last group
    if (lastEventGroup) {
      let dur = pos.sub(lastEventGroup.position);
      if (dur < 0) {
        console.warn('Negative group duration at ' + lastEventGroup.position.toString());
        dur = new Fraction(0);
      }
      lastEventGroup.duration = dur;
      lastEventGroup = null;
    }

    if (currentItems.length > 0) {
      let group = {
        position: pos,
        items: currentItems,
        fixed: currentItems[0].fixedWidth
      };
      result.push(group);
      for (let item of currentItems) {
        item.group = group;
      }
      lastEventGroup = group;
    }

    scoreLists = scoreLists.filter(a => a.length > 0); // Remove empty lists
  }

  // for (let scoreItem of scoreLists[0]) {
  //   let group = {items: [scoreItem], duration: scoreItem.duration};
  //   result.push(group);
  //   scoreItem.group = group; // DEBUG
  // }
  return result;
}

function shiftSecondIntervalsAndSetDeltas(scoreListGroups, score) {
  for (let group of scoreListGroups) {
    let scoreNoteChords = group.items.filter(x => { return x instanceof ScoreNoteChord; });
    if (scoreNoteChords.length === 0) {
      // No note chords: skip
      continue;
    } else if (scoreNoteChords.length === 1) {
      // Only one ScoreNoteChord: no need to deal with staff separation
      let scoreNotes = scoreNoteChords[0].notes;
      scoreNoteShift(scoreNotes, score);
      updateScoreNoteDeltas(scoreNotes, score);
    } else {
      // Multiple ScoreNoteChords: group them staff-wise and update deltas
      let staves = {};
      for (let scoreNoteChord of scoreNoteChords) {
        let key = scoreNoteChord.staff; // + ' ' + scoreNoteChord.part
        staves[key] = staves[key] || [];
        staves[key].push(scoreNoteChord);
      }
      for (let staff in staves) {
        let scoreNoteChords = staves[staff];
        for (let scoreNoteChord of scoreNoteChords) {
          scoreNoteShift(scoreNoteChord.notes, score);
        }
        scoreNoteChordsXAdjust(scoreNoteChords, score);
        for (let scoreNoteChord of scoreNoteChords) {
          updateScoreNoteDeltas(scoreNoteChord.notes, score);
        }
      }
    }
  }
}

function scoreNoteShift(scoreNotes, score) {
  if (scoreNotes.length === 0) return;
  // When only one note, make it quick
  if (scoreNotes.length === 1) {
    scoreNotes[0].shifted = false;
    return;
  }

  let clusters = [];
  // Find blocks of notes in second intervals and save them to the clusters variable
  let lastNote;
  let currentCluster;
  for (let scoreNote of scoreNotes.slice().sort((a, b) => { b.staffLine - a.staffLine; })) {
    scoreNote.shifted = false;
    if (lastNote && (scoreNote.staffLine === (lastNote.staffLine + 0.5))) {
      if (!currentCluster) currentCluster = [lastNote];
      currentCluster.push(scoreNote);
    } else if (currentCluster) {
      clusters.push(currentCluster);
      currentCluster = null;
    }
    lastNote = scoreNote;
  }
  if (currentCluster) clusters.push(currentCluster);

  // clusters is now a list of lists of ScoreNotes
  for (let cluster of clusters) {
    let currentShift = cluster[0].scoreNoteChord.stem.direction === 'up'; // ??
    let shifted = 0;
    // loop through the notes in the current cluster, shifting every second note
    for (let scoreNote of cluster) {
      scoreNote.shifted = currentShift;
      if (currentShift) shifted++;
      currentShift = !currentShift;
    }
    // if there are more shifted than normal notes in the cluster, reverse the shift
    if (shifted > (cluster.length - shifted)) {
      for (let scoreNote of cluster) {
        scoreNote.shifted = !scoreNote.shifted;
      }
    }
  }
}

function noteheadStemUpX(notehead) {
  return notehead.anchors.stemUpSE ? notehead.anchors.stemUpSE[0] : notehead.bbox.bBoxNE[0];
}

function noteheadStemDownX(notehead) {
  return notehead.anchors.stemDown ? notehead.anchors.stemUpNW[0] : notehead.bbox.bBoxSW[0];
}

function updateScoreNoteDeltas(scoreNotes, score) {
  if (scoreNotes.length === 0) return;

  let staffSpace = score.staffSize * 0.25;

  // When only one note, make it quick
  if (scoreNotes.length === 1) {
    // console.log('quick');
    let scoreNote = scoreNotes[0];
    let scoreNoteChord = scoreNote.scoreNoteChord;
    let stemDirection = scoreNoteChord.stem.direction;
    let noteheadWidth = scoreNote._notehead.bbox.bBoxNE[0] * staffSpace;
    let noteChordNoteX = scoreNoteChord.noteX || 0;
    let halfStemThickness = staffSpace * (score.engravingDefaults.stemThickness || 0.12) * 0.5;
    // let anchors = scoreNote._notehead.anchors;
    let stemX = stemDirection === 'up'
      ? (staffSpace * noteheadStemUpX(scoreNote._notehead)) - halfStemThickness
      : (staffSpace * noteheadStemDownX(scoreNote._notehead)) + halfStemThickness;
    // TODO: accidental parentheses
    scoreNote.noteX = noteChordNoteX;
    scoreNoteChord.dotX = noteChordNoteX + noteheadWidth;
    scoreNoteChord.stemX = noteChordNoteX + stemX;
    if (scoreNote.displayedAccidental !== undefined) {
      let acc = score.musicFontMetadata.glyphBBoxes[knowledge.accidentals[scoreNote.displayedAccidental]];
      if (acc) {
        let accWidth = acc.bBoxNE[0] * staffSpace;
        let accidentalX = -(accWidth + 0.25 * staffSpace); // TODO: scale
        scoreNoteChord.accidentalX = accidentalX;
        scoreNote.accidentalX = accidentalX;
      }
    }
    scoreNoteChord.updateExtents();
    return;
  }

  // So, we're dealing with multiple notes (chord and/or multiple voices)
  // console.log('multiple');
  let dotX = 0;
  let notesWithAccidentals = [];
  let leftmostPosition = 0;
  let scoreNoteChords = new Set();
  for (let scoreNote of scoreNotes) {
    let scoreNoteChord = scoreNote.scoreNoteChord;
    let noteChordNoteX = scoreNoteChord.noteX || 0;
    let halfStemThickness = staffSpace * (score.engravingDefaults.stemThickness || 0.12) * 0.5;
    let noteheadWidth = 1.0 * staffSpace; // TODO
    scoreNoteChords.add(scoreNoteChord); // save for later
    // STEP 1: Note head and dots
    if (!scoreNoteChord.stem) {
      console.warn('Undefined stem for ', scoreNoteChord);
    } else if (scoreNote.shifted) {
      if (scoreNoteChord.stem.direction === 'up') {
        // Shifted and stem up = shift right
        scoreNote.noteX = noteChordNoteX + noteheadWidth;
        dotX = Math.max(dotX, noteChordNoteX + noteheadWidth * 2);
      } else {
        // Shifted and stem down = shift left
        scoreNote.noteX = noteChordNoteX - noteheadWidth;
        leftmostPosition = Math.min(leftmostPosition, -noteheadWidth);
      }
    } else {
      // Not shifted
      scoreNote.noteX = noteChordNoteX;
      dotX = Math.max(dotX, noteChordNoteX + noteheadWidth);
      scoreNoteChord.stemX = Math.max(scoreNoteChord.stemX || 0,
        noteChordNoteX + (scoreNoteChord.stem.direction === 'up'
        ? (staffSpace * noteheadStemUpX(scoreNote._notehead)) - halfStemThickness
        : (staffSpace * noteheadStemDownX(scoreNote._notehead)) + halfStemThickness));
    }
    // STEP 2: Collect accidentals
    if (scoreNote.displayedAccidental !== undefined) {
      notesWithAccidentals.push(scoreNote);
    }
  }

  // Distribute accidentals
  let accidentalOrigin = leftmostPosition - (0.15 * staffSpace);
  let x = accidentalOrigin;
  let lastStaffLine = 0;
  for (let scoreNote of notesWithAccidentals) {
    if (scoreNote.staffLine > lastStaffLine + 3) {
      x = accidentalOrigin;
    }
    lastStaffLine = scoreNote.staffLine;
    let acc = score.musicFontMetadata.glyphBBoxes[knowledge.accidentals[scoreNote.displayedAccidental]];
    let accWidth = acc.bBoxNE[0] * staffSpace;
    x -= accWidth + 0.1 * staffSpace; // TODO: scale
    scoreNote.accidentalX = x - scoreNote.noteX;
  }

  // Set dots delta
  scoreNoteChords.forEach(scoreNoteChord => {
    scoreNoteChord.dotX = dotX;
    scoreNoteChord.accidentalX = Math.min(...scoreNoteChord.notes.map(n => n.noteX + n.accidentalX || 0));
    // TODO: set stem delta
    scoreNoteChord.updateExtents();
  });
}

/**
 *  Sets the note-delta slot of score-notes, to avoid note overlap of noteheads.
 *  This is different from shifting (which only works with single chords/clusters).
 *  A common case is second intervals in polyphonic notation.
 */
function scoreNoteChordsXAdjust(scoreNoteChords) {
  // TODO
}

/**
 *  Takes as argument a grouped list of ScoreItems, as generated by GroupScoreLists
 *
 *  Updates that list and sets the following keys for each object:
 *    innerWidth
 *    minSpace
 *    optimalSpace
 */
function layoutScoreItems(scoreListGroups, score, followingGroup) {
  let staffSpace = score.staffSize * 0.25;
  let referenceDuration = score.referenceDuration; // TODO
  let horizontalProportionalFactor = score.horizontalProportionalFactor; // TODO
  let referenceNoteSpace = score.referenceNoteSpace; // TODO
  let quotas = {};

  for (let group of scoreListGroups.filter(g => g.floating)) {
    group.innerWidth = 0;
    group.minSpace = 0;
    group.optimalSpace = 0;
  }

  let nonFloatingGroups = scoreListGroups.filter(g => !g.floating);
  for (let g = 0; g < nonFloatingGroups.length; g++) {
    let thisGroup = nonFloatingGroups[g];
    let nextGroup = nonFloatingGroups[g + 1] || followingGroup;

    // Inner width of group is the widest inner width of its items
    thisGroup.innerWidth = Math.max(...thisGroup.items.map(i => { return i.innerWidth(); })) * staffSpace;

    // Get left extent of next group
    // Do it staff-wise, so that e.g. an accidental in a low-density voice
    // doesn't add space to a voice with higher density.
    let nextLeftExtentPerStaff = {};
    let nextExtraSpacePerStaff = {};
    if (nextGroup) {
      for (let item of nextGroup.items) {
        let staff = item.staff;
        nextLeftExtentPerStaff[staff] = Math.min(nextLeftExtentPerStaff[staff] || 0, item.leftExtent || 0);
        nextExtraSpacePerStaff[staff] = Math.min(nextExtraSpacePerStaff[staff] || 0, item.extraSpaceLeft || 0);
      }
    }

    // Minimum spacing to next group
    let minSpace = 0;
    if (nextGroup) {
      for (let item of thisGroup.items) {
        let itemMinSpace = item.minSpace(nextGroup.items[0]) * staffSpace;
        minSpace = Math.max(minSpace, (item.rightExtent || 0) + itemMinSpace - (nextLeftExtentPerStaff[item.staff] || 0));
      }
    }
    thisGroup.minSpace = minSpace;

    // Optimal spacing to next group
    if (thisGroup.duration > 0) {
      let dur = thisGroup.duration.valueOf();
      let quota = quotas[dur];
      if (!quota) {
        quota = Math.pow(dur / referenceDuration, horizontalProportionalFactor);
        quotas[quota] = quota;
      }
      thisGroup.optimalSpace = Math.max(minSpace, referenceNoteSpace * staffSpace * quota);
      // TODO: add extra spacing from nextExtraSpacePerStaff if we are in the voice with the highest density
    } else {
      thisGroup.optimalSpace = minSpace;
    }
  }
  return scoreListGroups;
}

function dontBreakScore(scoreListGroups, score) {
  let systemItems = [];
  let indent = 10; // TODO
  // Remove spacing from last group
  let lastGroup = scoreListGroups[scoreListGroups.length - 1];
  lastGroup.minSpace = 0;
  lastGroup.optimalSpace = 0;
  let x = indent;
  // Add left barline
  if (score.staves.length > 1 && score.elementVisible('ScoreBar')) {
    systemItems.push(new ScoreBar(null, score, {
      position: new Fraction(0),
      voice: null,
      staff: 0,
      leftBarline: true,
      scoreX: x,
      staffSystem: 0
    }));
    x += score.staffSize * 0.2; // TODO: indent + left padding
  } else {
    x += score.staffSize * 0.2;
  }
  // Add all items
  for (let group of scoreListGroups) {
    for (let item of group.items) {
      item.staffSystem = 0;
      // TODO: Spanning metas
      //     (when (typep item 'spanning-score-meta)
      // (setf (from-staff-system item) staff-system
      //       (to-staff-system item) staff-system))
      item.scoreX = x;
      if (item instanceof ScoreNoteChord) {
        // TODO: add grace notes before

      }
      systemItems.push(item);
      if (item instanceof ScoreNoteChord) {
        // TODO: add grace notes after

      }
    }
    x += (group.innerWidth + Math.max(group.optimalSpace, group.minSpace)) || 0;
  }
  let singleSystem = new StaffSystem(score, 0, {
    staffWidth: x,
    indent: indent,
    staves: score.staves,
    staffDistance: score.staffDistance
  });
  singleSystem.items = systemItems;
  return [singleSystem];
}

function breakScore(scoreListGroups, score, staffWidth = score.width) {
  let indent = 10; // TODO
  // Remove spacing from last group
  let lastGroup = scoreListGroups[scoreListGroups.length - 1];
  lastGroup.minSpace = 0;
  lastGroup.optimalSpace = 0;

  let measureLayout = score.measureLayout;
  if (_.isArray(measureLayout)) {
    measureLayout = measureLayout.slice();
  } else {
    measureLayout = [measureLayout];
  }

  let staffSystems = [];

  let iCurrent = 0;
  let iSystemStart = 0;
  let iLastBar = 0;
  let staffSystemNum = 0;
  let measureNum = 1;
  while (iCurrent < scoreListGroups.length) {
    let staffSystemStartMeasure = measureNum;
    let staffSystemMeasures = (measureLayout.length > 1) ? measureLayout.shift() : measureLayout[0];
    // console.log(staffSystemStartMeasure, staffSystemMeasures);
    let systemGroups = [];
    let x = indent + score.staffSize * 0.2;
    iCurrent = iSystemStart;

    if (iCurrent > 0) {
      let newGroups = makeSystemBreak(scoreListGroups, score, iCurrent);
      for (let group of newGroups) {
        group.x = x;
        x += (group.innerWidth + Math.max(group.optimalSpace, group.minSpace)) || 0;
      }
      systemGroups = systemGroups.concat(newGroups);
    }

    while (staffSystemMeasures ? true : x < staffWidth) {
      let group = scoreListGroups[iCurrent];
      if (!group) break;
      group.x = x;
      x += (group.innerWidth + Math.max(group.optimalSpace, group.minSpace)) || 0;
      if (group.items[0] instanceof ScoreBar) {
        iLastBar = iCurrent;
        measureNum++;
        if (staffSystemMeasures && staffSystemMeasures === (measureNum - staffSystemStartMeasure)) {
          iCurrent++;
          break;
        }
      }
      iCurrent++;
    }
    let iSystemEnd = iLastBar > iSystemStart ? iLastBar : (iCurrent - 1);
    systemGroups = systemGroups.concat(scoreListGroups.slice(iSystemStart, (iSystemEnd + 1)));
    let lastSystemGroup = systemGroups[systemGroups.length - 1];

    let staffSystem = new StaffSystem(score, staffSystemNum++, {
      staffWidth: lastSystemGroup.x + lastSystemGroup.innerWidth,
      indent: indent,
      staves: score.staves,
      staffDistance: score.staffDistance
    });
    staffSystem.groups = systemGroups;
    staffSystems.push(staffSystem);

    // console.log(iSystemStart + ' - ' + iSystemEnd);
    // console.log('Added staff system: ', staffSystem);

    iSystemStart = (iSystemEnd + 1);
    if (iCurrent < iSystemStart) {
      console.log('No progress!', iSystemStart, iCurrent);
      break;
    }
  }

  let createLeftBarlines = (score.staves.length > 1 && score.elementVisible('ScoreBar'));

  for (let staffSystem of staffSystems) {
    let num = staffSystem.num;
    let systemItems = [];

    // Create left barline
    if (createLeftBarlines) {
      systemItems.push(new ScoreBar(null, score, {
        position: new Fraction(0),
        voice: null,
        staff: 0,
        leftBarline: true,
        scoreX: staffSystem.indent,
        staffSystem: num
      }));
    }

    // Justify system
    if (num === staffSystems.length - 1) {
      if (!score.raggedLast || staffSystem.staffWidth > staffWidth) justifyStaffSystem(staffSystem, score, staffWidth);
    } else {
      if (!score.raggedRight || staffSystem.staffWidth > staffWidth) justifyStaffSystem(staffSystem, score, staffWidth);
    }

    // Set y value of staffSystem
    // TODO: move out of this function
    staffSystem.y = score.firstStaffSystemY + score.staffSystemDistance * num;

    // Set scoreX of all staffSystem items
    for (let group of staffSystem.groups) {
      for (let item of group.items) {
        item.scoreX = group.x;
        item.staffSystem = num;
        systemItems.push(item);
      }
    }
    staffSystem.items = systemItems;
  }

  return staffSystems;
}

// Helper for breakScore
function makeSystemBreak(scoreListGroups, score, breakpoint) {
  let newGroups = [];
  let keys = [];
  let clefs = [];
  for (let staff = 0; staff < score.staves.length; staff++) {
    let key;
    let clef;
    for (let i = breakpoint; i >= 0; i--) {
      let g = scoreListGroups[i];
      if (!key && g.items[0] instanceof ScoreKey) {
        key = g.items.find(item => item.staff === staff);
        if (key) {
          key = new ScoreKey(key.item, score); // TODO: better copying
          key.staff = staff;
        }
      } else if (!clef && g.items[0] instanceof ScoreClef) {
        clef = g.items.find(item => item.staff === staff);
        if (clef) {
          clef = new ScoreClef(clef.item, score, {kind: clef.kind}); // TODO: better copying
          clef.staff = staff;
        }
      }
      if (key && clef) break;
    }
    if (key) keys.push(key);
    if (clef) clefs.push(clef);
  }
  if (clefs.length) {
    newGroups.push({
      items: clefs,
      fixed: true
    });
  }
  if (keys.length) {
    newGroups.push({
      items: keys,
      fixed: true
    });
  }
  // TODO: check that next groups is non-floating
  if (newGroups.length) layoutScoreItems(newGroups, score, scoreListGroups[breakpoint]);
  return newGroups;
}

// Helper for breakScore
function justifyStaffSystem(staffSystem, score, width) {
  let space = width - staffSystem.staffWidth;
  let count = staffSystem.groups.filter(group => !group.fixed).length;
  let offset = 0;
  let num = 0;
  for (let group of staffSystem.groups) {
    if (group.fixed) {
      group.x += offset;
    } else {
      group.x += offset;
      offset += space / count;
      num++;
    }
  }
  staffSystem.staffWidth = width;
}

function createBrackets(staffSystem, score) {
  let bracket = new ScoreBracket(null, score);
  bracket.staffSystem = staffSystem;

  bracket.updatePosition();
  staffSystem.items.unshift(bracket);
}
