import _ from 'underscore';
import SVG from 'svg.js';
import Fraction from 'fraction.js';

import misc from '../misc.js';
import knowledge from './knowledge.js';

import Clef from '../classes/meta/clef.js';
import Interval from '../classes/interval.js';
import Key from '../classes/meta/key.js';
import NoteChord from '../classes/event/note-chord.js';
import Rest from '../classes/event/rest.js';
import Tuplet from '../classes/event/tuplet.js';
import Duration from '../classes/duration.js';
import Voice from '../classes/event/voice.js';
import Chord from '../classes/event/chord.js';

import NoteSplit from 'note-split';

import ScoreBar from './classes/score-bar.js';
import ScoreBracket from './classes/score-bracket.js';
import ScoreClef from './classes/score-clef.js';
import ScoreEvent from './classes/score-event.js';
import ScoreKey from './classes/score-key.js';
import ScoreMeta from './classes/score-meta.js';
import ScoreNote from './classes/score-note.js';
import ScoreNoteChord from './classes/score-note-chord.js';
import ScorePageText from './classes/score-page-text.js';
import ScoreRest from './classes/score-rest.js';
import ScoreSyllable from './classes/score-syllable.js';
import ScoreTie from './classes/score-tie.js';
import ScoreTime from './classes/score-time.js';
import ScoreTuplet from './classes/score-tuplet.js';
import StaffSystem from './classes/staff-system.js';
import ScoreChord from './classes/score-chord.js';

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
    let song = params.song;
    let songScoreProperties = song.score || {};
    this.song = song;
    this.staffSystems = [];
    this.staffSize = params.staffSize || songScoreProperties.staffSize || 28;
    this.pageWidth = (songScoreProperties.pageWidth || 210) * 3.833;
    this.pageHeight = (songScoreProperties.pageHeight || 297) * 3.833;
    this.width = params.width || this.pageWidth + 20;
    this.height = params.height || 5000; // this.pageHeight + 20;
    this.margins = params.margins || {left: 20, right: 20, top: 20, bottom: 20};
    this.zoom = 1.0;
    this.musicFont = params.musicFont || 'RemusBravura';
    this.musicFontMetadata = params.musicFontMetadata || { glyphBBoxes: {}, glyphsWithAnchors: {} };
    this.musicFontGlyphs = params.musicFontGlyphs || {};
    this.engravingDefaults = params.engravingDefaults || this.musicFontMetadata.engravingDefaults || {};
    this.staffDistance = params.staffDistance || 80;
    this.firstStaffSystemY = params.firstStaffSystemY || songScoreProperties.topStaffPosition || 40;
    this.staffSystemSpacing = params.staffSystemSpacing || songScoreProperties.staffSystemSpacing || 160;
    this.staffSystemMinSpacing = params.staffSystemMinSpacing || songScoreProperties.staffSystemMinSpacing || 8;
    this.staffSystemExtraSpacing = params.staffSystemExtraSpacing || songScoreProperties.staffSystemExtraSpacing || [];
    this.autoSystemBreaks = params.autoSystemBreaks || false; // TODO: Rename to pageMode or something like that
    this.pageMode = "vertical"; // TODO
    this.hiddenElements = params.hiddenElements || [];
    this.referenceDuration = params.referenceDuration || 0.2;
    this.referenceNoteSpace = params.referenceNoteSpace || 3.0;
    this.horizontalProportionalFactor = params.horizontalProportionalFactor || 0.65;
    this.raggedRight = params.raggedRight || false;  // Don't justify staff systems
    this.raggedLast = params.raggedLast === false ? false : true;     // Don't justify last staff system
    this.measureLayout = params.measureLayout || null;
  }

  splitEventsForScoring() {
    // Iterate through all the voices in the song
    for (let voice of this.song.findEvents('Voice')) {
      // Create a new list to store the processed events
      let newEventList = [];

      // Retrieve the current time signature and measure length, if available
      let time = voice.cache.time;
      if (!time) {
        console.warn('cache.time is not set in splitEventsForScoring, is song resolved?');
      }
      let measureLength = time ? time.getMeasureWn() : new Fraction(1);
      let beatLength = new Fraction(1, 4); // TODO: don't hardcode!

      // Calculate the position of the event within the current measure
      let position = time ? voice.cache.absWn.sub(time.cache.absWn) : voice.cache.absWn;
      position = position || new Fraction(0);

      // Iterate through all events in the voice
      for (let e of voice.events) {
        // Check if the event has a duration, and if it's in 'wn' units (whole notes)
        if (e.duration && e.duration.unit !== 'wn') {
          console.error('splitEventsForScoring does not support this duration unit: ', e.duration);
          throw new Error('splitEventsForScoring can only work with wn durations!');
        }

        // Calculate the duration of the event in whole notes
        let d = e.duration ? e.duration.value : e.cache.endWn.sub(e.cache.absWn);
        if (!d) {
          console.error('Undefined duration: ', e);
          throw new Error('Undefined duration');
        }

        // Skip the event if it's a Tuplet, as we don't want to split it
        if (e instanceof Tuplet || e instanceof Voice) {
          newEventList.push(e);
          continue;
        }

        // Check if the duration is a power of two
        if (Math.log2(d.d) !== Math.round(Math.log2(d.d))) {
          console.error(`Duration denominator of ${d.n}/${d.d} is not a power of two`);
          // throw new Error(`Duration denominator of ${d.n}/${d.d} is not a power of two`);
        }

        // Divide the event's duration based on the measure and beat lengths
        let durations = NoteSplit.divide([d], measureLength, beatLength, position, (e instanceof Rest), 2)[0];

        // If the event doesn't need to be split, add it to the new event list as is
        if (durations.length === 1) {
          newEventList.push(e);
        } else {
          // Otherwise, split the event into multiple events with the calculated durations
          e.duration = new Duration({ value: durations[0], unit: 'wn' });
          newEventList.push(e);
          for (let i = 1; i < durations.length; i++) {
            let e2 = misc.clone(e);
            e2.duration = new Duration({ value: durations[i], unit: 'wn' });
            if (e2 instanceof NoteChord) {
              e2.tiedTo = true;
              newEventList[newEventList.length - 1].tiedFrom = true;
            }
            newEventList.push(e2);
          }
        }

        // Update the position based on the event's duration
        position = position.add(d);
      }

      // Replace the original voice events with the new, split events
      voice.events = newEventList;
      voice.shouldResolve = true;
    }
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

    this.splitEventsForScoring();

    let score = this;
    let song = this.song;
    if (!song) return; // sanity check

    //
    //  Store selection
    //

    let selectedItems = this.sel ? this.sel.map(i => { return i.item; }) : [];
    let newSelection = [];

    createScorePageItems(score);

    //
    //  Step 0:  Decide which voices to "draw"
    //

    song.resolve();
    let parts = song.findEvents('Part');
    score.parts = parts;
    score.partInfo = new WeakMap();
    for (let part of parts) {
      score.partInfo.set(part, {});
    }
    // let voices = song.findEvents('Voice');
    let scoreLists = [];
    let voiceStaves = [];
    // voices = [voices[0]]; // TEMP

    //
    //  Step 1:  Generate a "score list" for each voice
    //

    let staff = 0;
    let staves = [];

    for (let part of parts) {
      let voices = part.findEvents('Voice');
      for (let voice of voices) {
        scoreLists.push(makeScoreList(voice, this, {voice: voice, part: part}));
        voiceStaves[voice.id] = staff + (voice.score.staff || 1) - 1;
      }
      score.partInfo.get(part).firstStaff = staff;
      for (let i = 0; i < part.staves; i++) {
        staves.push({
          id: staff,
          part: part,
          partStaff: i,
          staffLines: part.staffLines
        }); // voice.kind === 'single-drum' ? 1 : 5});
        staff++;
      }
    }

    // let chordSequences = song.findEvents('ChordSequence');
    // for (let chordSequence of chordSequences) {
    //   scoreLists.push(parseChords(chordSequence, this));
    // }

    // for (let voice of voices) {
    //   scoreLists.push(makeScoreList(voice, this, {voice: voice}));
    //   staves.push({id: staff, staffLines: voice.kind === 'single-drum' ? 1 : 5});
    //   voiceStaves[voice.id] = staff++;
    // }
    this.staves = staves;

    //
    //  Step 2:  Combine the score lists "column-wise"
    //

    // Temp: assign staff slot of all items.
    // This should probably be done directly by makeScoreList
    for (let scoreList of scoreLists) {
      for (let item of scoreList) {
        let globalStaff = item.voice ? voiceStaves[item.voice.id] : 0;
        item.staff = staves[globalStaff].partStaff;
        item.globalStaff = globalStaff;
      }
    }

    let scoreListGroups = groupScoreLists(scoreLists);

    //
    //  Step 3:  Calculate stems, beams, accidentals, chord symbols etc
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
      let staffWidth = this.pageWidth - (this.margins.left || 0) - (this.margins.right || 0);
      staffSystems = breakScore(layoutScoreItems(scoreListGroups, this), this, staffWidth);
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
      }
      for (let item of staffSystem.items) {
        if (selectedItems.indexOf(item.item) >= 0) {
          newSelection.push(item);
        }
      }
      if (this.elementVisible('ScoreBracket')) {
        createBrackets(staffSystem, this);
      }
    }

    this.groupBarlines();

    this.updateVerticalSpacing();

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

  groupBarlines() {
    for (let staffSystem of this.staffSystems) {
      staffSystem.items = staffSystem.items.filter(scoreItem => {
        if (!(scoreItem instanceof ScoreBar) || scoreItem.leftBarline) return true; // OR ScoreRepeat OR ScoreRepeatEnding
          // IF REPEAT ENDING (TODO)
          // Normal barline or repeat
        
        if (scoreItem.staff === 0) {
          if (!scoreItem.part) {
            console.log("No part for: ", scoreItem);
          }
          scoreItem.parts = partsInSamePartGroup(scoreItem.part);
          // scoreItem.
          return true;
        }
        scoreItem.parts = null;
        return false;
      });
    }
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

  toSVG(svg, page = "all") {
    this.itemsBySVGID = {};
    svg.on('click', this.handleClick.bind(this));
    svg = svg.group().id('score');
    // svg.attr({'font-family': this.musicFont, 'font-size': this.staffSize + 'px '});
    svg.font({family: this.musicFont, size: this.staffSize});
    if (page === "all") {
      for (let page = 1; page <= this.pages; page++) {
        this.pageToSVG(svg, page);
      }
    } else {
      this.pageToSVG(svg, page);
    }
  }

  pageToSVG(svg, page) {
    let pageSvg = svg.group().id('page-' + page).x(this.screenPageX(page)).y(this.screenPageY(page)).width(this.pageWidth).height(this.pageHeight);
    for (let s = 0; s < this.staffSystems.length; s++) {
      if (this.staffSystems[s].page !== page) continue;
      let staffSystem = this.staffSystems[s].toSVG(pageSvg);
      this.itemsBySVGID[staffSystem.id()] = this.staffSystems[s];
    }
    if (this.scorePageItems) {
      for (let scorePageItem of this.scorePageItems) {
        if (scorePageItem.page !== page) continue;
        scorePageItem.toSVG(pageSvg);
      }
    }
    pageSvg.addClass('Page');
  }

  screenPageX(page) {
    switch (this.pageMode) {
      case "vertical": return 10;
      default: return 0;
    }
  }

  screenPageY(page) {
    let pageSpacing = 10;
    switch (this.pageMode) {
      case "vertical": return pageSpacing + ((page - 1) * (this.pageHeight + (pageSpacing * 2)));
      default: return 0;
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
      svgElem = svgElem.parent('.ScoreNote') || svgElem.parent('.ScoreItem') || svgElem.parent('.ScorePageItem');
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

  // Updates the inner vertical spacing of the score, i.e. values relative to the
  // staff system position. There is no need to call this function when complete
  // staff systems should be moved, use updatePaging for that.
  updateVerticalSpacing() {
    let partSpacing = this.song.score.partSpacing || 80;
    // let globalStaff = 0;
    for (let staffSystem of this.staffSystems) {
      let staffYTable = [];
      let y = 0;
      for (let part of staffSystem.visibleParts) {
        let staffSpacing = part.score.staffSpacing || 80;
        for (let staff = 0; staff < part.staves; staff++) {
          if (staff > 0) y += staffSpacing;
          staffYTable.push(y);
        }
        y += partSpacing;
      }
      staffSystem.staffYTable = staffYTable;
      for (let item of staffSystem.items) {
        item.staffY = staffYTable[item.globalStaff || 0];
        item.updatePosition();
        item.updateBounds();
      }

        // TEMP!!
      staffSystem.height = 100;
      // staffSystem.minY = 0;
      // staffSystem.maxY = 100;
      staffSystem.updateBounds();
    }
    this.updatePaging();
  }


  // Updates the staff systems with new page and y values
  // Assumes that they already have correct height, minY and maxY values
  updatePaging() {
    let minY = this.margins.top || 0;
    let maxY = this.pageHeight - (this.margins.bottom || 0);
    let startY = minY;
    let maxPageItemPage = 1;
  
    // Make room for page text. Only count page-items with avoid-collisions set to :song-title
    // (currently title, composer and instrument/lyricist)
    if (this.scorePageItems) {
      for (let pageItem of this.scorePageItems) {
        // Also store highest page number, counting all page items
        maxPageItemPage = Math.max(maxPageItemPage, pageItem.page);
        if (pageItem.item.avoidCollisions === "songTitle" && pageItem.page === 1) {
          startY = Math.max(startY, pageItem.bounds.maxY + 20);
        }
      }
    }

    let s = 0;
    let page = 1;
    let curOptY = this.firstStaffSystemFixedPosition ? (startY + this.topStaffPosition) : startY;
    let curMinY = startY;
    let systemsInPage = 0;
    let defaultSpacing = getSpacingValue(this, "staffSystemSpacing");
    let minimumSpacing = getSpacingValue(this, "staffSystemMinSpacing");
    let extraSpacing   = getSpacingValue(this, "staffSystemExtraSpacing") || [];
    // console.log("##", minY, curOptY, startY, defaultSpacing, minimumSpacing, extraSpacing);
    while (s < this.staffSystems.length) {
      let staffSystem = this.staffSystems[s];
      let sy = curOptY + (extraSpacing[s] || 0);
      
      // console.log("Staff system " + s + " sy: ", sy, maxY);

      if (typeof minimumSpacing === "number") { // if min-spacing is null, it means we should allow overlaps
        sy = Math.max(sy, (this.firstStaffSystemFixedPosition && s === 0)
          ? curMinY                        // ignore min-y for the first staff-system
          : (curMinY - staffSystem.bounds.spacingMinY)); // for other systems, use min-y
      }

      // The system fits, or is the first system of the page
      if ((sy + staffSystem.bounds.spacingMaxY) <= maxY || systemsInPage === 0) {
        staffSystem.page = page;
        staffSystem.y = sy + 0.5;
        staffSystem.optimalY = (typeof minimumSpacing === "number") ? Math.max(curOptY, curMinY) : curOptY;
        curOptY = sy + staffSystem.height + defaultSpacing;
        curMinY = sy + staffSystem.bounds.spacingMaxY + (minimumSpacing || 0);
        systemsInPage++;
        s++;
      }

      // The system does not fit. Go to next page
      else {
        page++;
        curOptY = minY;
        curMinY = minY;
        systemsInPage = 0;
      }
    }
    this.pages = Math.max(page, maxPageItemPage);
    
    // (when (owner song-context)
    //   (score-paging-updated (owner song-context)))))
  }
}

Score.knowledge = knowledge;

function makeScoreList(container, score, params = {}, eventsOnly) {
  let items = container.events;
  let scoreItems = [];
  let first = true;
  let position = new Fraction(0);
  let voice = params.voice;
  let part = params.part;
  let drumMode = (voice.kind === 'drums' || voice.kind === 'single-drum');
  let measureDuration = new Fraction(container.cache.time.num, container.cache.time.denom);
  let beats = [];
  let totalAtoms = 0;
  for (let beat of container.cache.time.beats.slice(0, -1)) {
    totalAtoms += beat;
    beats.push(new Fraction(totalAtoms, container.cache.time.denom));
  }
  let createClef           = score.elementVisible('ScoreClef');
  let createTime           = score.elementVisible('ScoreTime');
  let createKey            = score.elementVisible('ScoreKey');
  let createBar            = score.elementVisible('ScoreBar');
  let createScoreNoteChord = score.elementVisible('ScoreNoteChord');
  // let timeScale = params.timeScale || 1;

  // Get first clef
  let clef = params.clef || container.metas.find(m => m instanceof Clef && m.cache.absWn.equals(container.cache.absWn));

  if (!eventsOnly) {
    if (drumMode) {
      if (createClefs) {
        scoreItems.push(new ScoreClef(null, score, {position: new Fraction(0), voice: voice, part: part}));
      }
      if (createTime) {
        scoreItems.push(new ScoreTime(container.cache.time, score, {position: new Fraction(0), voice: voice, part: part}));
      }
    } else {
      if (createClef) {
        let clefKind = clef ? clef.kind : 'g';
        let clefOctave = clef ? clef.octave : 0;
        scoreItems.push(new ScoreClef(null, score, {position: new Fraction(0), voice: voice, part: part, kind: clefKind, octave: clefOctave}));
      }
      if (createTime) {
        scoreItems.push(new ScoreTime(container.cache.time, score, {position: new Fraction(0), voice: voice, part: part}));
      }
      let key = container.metas.find(m => m instanceof Key && m.cache.absWn.equals(container.cache.absWn)) || container.cache.key;
      if (key && createKey) {
        scoreItems.push(new ScoreKey(key, score, {position: new Fraction(0), voice: voice, part: part}));
      }
    }
  }

  for (let item of items) {
    // if (item instanceof Note) {
    //   item = new NoteChord({events: [item], duration: item.duration});
    // }
    if (item.cache.absWn.mod(measureDuration).valueOf() === 0) {
      if (createBar && item.cache.absWn > 0) {
        scoreItems.push(new ScoreBar(null, score, {position: item.cache.absWn, voice: voice, part: part}));
      }
    }
    // NoteChord
    if (item instanceof NoteChord && createScoreNoteChord) {
      let scoreItem = new ScoreNoteChord(item, score);
      let dur = knowledge.noteValues[item.cache.duration.value.toFraction()];
      if (!dur) console.log('No duration data for ' + item.cache.duration.value.toFraction());
      scoreItem.voice = voice;
      scoreItem.part = part;
      if (dur) {
        scoreItem.noteValue = dur.noteValue;
        scoreItem.flags = dur.flags;
        scoreItem.dots = dur.dots;
      } else {
        scoreItem.noteValue = "w";
        scoreItem.flags = 0;
        scoreItem.dots = 0;
      } 
      scoreItem.notes = [];
      scoreItem.syllables = [];
      scoreItem.tiedFrom = item.tiedFrom;
      scoreItem.tiedTo = item.tiedTo;
      scoreItem.position = item.cache.absWn;
      scoreItem.duration = item.cache.duration.value;
      for (let note of item.events) {
        let scoreNote = new ScoreNote(note, score, {voice: voice, part: part, clef: clef});
        scoreNote.scoreNoteChord = scoreItem;
        scoreNote.tiedFrom = note.tiedFrom || item.tiedFrom;
        scoreNote.tiedTo = note.tiedTo || item.tiedTo;
        scoreNote.notehead = dur ? dur.notehead : "noteheadWhole";
        // scoreNote.voice = params.voice;
        scoreItem.notes.push(scoreNote);
      }
      scoreItem.notes.sort((a, b) => { return a.staffLine - b.staffLine; });
      // Lyrics
      if (!item.tiedTo) { // TODO!!
        let verse = 0;
        if (item.syllables) {
          for (let syllable of item.syllables) {
            let scoreSyllable = new ScoreSyllable(syllable, score, {verse: verse});
            scoreSyllable.owner = scoreItem;
            scoreItem.syllables.push(scoreSyllable);
            verse++;
          }
        }
      }
      scoreItems.push(scoreItem);
    // Rest
    } else if (item instanceof Rest && score.elementVisible('ScoreRest')) {
      let scoreItem = new ScoreRest(item, score);
      let dur = knowledge.noteValues[item.cache.duration.value.toFraction()];
      if (!dur) console.log('No duration data for ' + item.cache.duration.value.toFraction());
      scoreItem.position = item.cache.absWn;
      scoreItem.duration = item.cache.duration.value;
      scoreItem.voice = voice;
      scoreItem.part = part;
      if (dur) {
        scoreItem.noteValue = dur.noteValue;
        scoreItem.flags = dur.flags;
        scoreItem.dots = dur.dots;
      } else {
        scoreItem.noteValue = "w";
        scoreItem.flags = 0;
        scoreItem.dots = 0;
      }
      scoreItems.push(scoreItem);
    // Tuplet
    } else if (item instanceof Tuplet && score.elementVisible('ScoreTuplet')) {
      let tuplet = new ScoreTuplet(item, score);
      tuplet.voice = voice;
      tuplet.part = part;
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

  if (position.mod(measureDuration).valueOf() === 0 && !first && createBar) {
    scoreItems.push(new ScoreBar(null, score, {position: position, voice: voice, part: part}));
  }

  // Beaming
  let processBeamGroup = function(group) {
    if (group.length > 1) {
      let pitches = [];
      for (let e of group) {
        pitches.push(e.item.cache.absWn.toString());
      }
      group[0].beamType = '[';
      group[group.length - 1].beamType = ']';
      for (let i = 1; i < group.length - 1; i++) {
        group[i].beamType = '=';
      }
    } else {
      group[0].beamType = null;
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

function parseChords(chordSequence, score) {
  let scoreChords = [];
  for (let chord of chordSequence.findEvents('Chord')) {
    let scoreChord = new ScoreChord(chord, score);
    scoreChord.position = chord.cache.absWn;
    scoreChords.push(scoreChord);
  }
  console.log('scoreChords.length', scoreChords.length);
  return scoreChords;
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
    const voicesOnStaff = note.part.findEvents('Voice').reduce((a,v)=>a+(note.voice.score.staff===v.score.staff),0)
    if (note.voice.score.staffVoiceOrder > 1 || voicesOnStaff > 1) {
      // staffVoiceOrder begins at 1
      return ['up', 'down'][(note.voice.score.staffVoiceOrder - 1) % 2];
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

        if (scoreItem.beamType === '[') {
          // Beginning of a beam: save the note objects to a list
          notesPerVoice[voice] = scoreItem.notes;
          eventsPerVoice[voice] = [scoreItem];
        } else if (scoreItem.beamType === '=') {
          // Middle of a beam: save the note objects to a list
          notesPerVoice[voice] = notesPerVoice[voice].concat(scoreItem.notes);
          eventsPerVoice[voice].push(scoreItem);
        } else if (scoreItem.beamType === ']') {
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
            e.beam = beamData;
          }
        } else {
          // Otherwise, this is a non-beamed event. Calculate stem-direction for this event separately
          // scoreItem.stem = {direction: scoreItem.defaultStemDirection()};
          let stemDirection;
          if (scoreItem.item.score && scoreItem.item.score.stemDirection) {
            stemDirection = scoreItem.item.score.stemDirection;
          } else if (scoreItem.voice.score && scoreItem.voice.score.stemDirection) {
            stemDirection = scoreItem.voice.score.stemDirection;
          } else {
            // Homophonic
            stemDirection = calculateStemDirection(scoreItem.notes);
          }
          scoreItem.stem = {direction: stemDirection};
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
  // Iterate through all score items
  for (let scoreItem of scoreItems) {
    // Check if the score item is part of a beam
    if (scoreItem.beam && (scoreItem.beam instanceof Object)) {
      let beamData = scoreItem.beam;
      // Get the first and last note chords of the beam
      let noteChord1 = beamData.events[0];
      let noteChord2 = beamData.events[beamData.events.length - 1];

      // Skip if the current score item is not the first note chord in the beam
      // This ensures that adjustments are done only once for every beam
      if (noteChord1 !== scoreItem) continue;

      // Get the direction of the stem (up or down)
      let stemDir = noteChord1.stem.direction;
      // Select the outermost notes of the first and last note chords based on stem direction
      let note1 = stemDir === 'up' ? noteChord1.notes[0] : noteChord1.notes[noteChord1.notes.length - 1];
      let note2 = stemDir === 'up' ? noteChord2.notes[0] : noteChord2.notes[noteChord2.notes.length - 1];

      // Determine if the beam should be flat (i.e., both outermost notes are on the same staff line)
      let flat = note1.staffLine === note2.staffLine;

      // TODO: check more conditions for flatness (such as repeated pattern, concave shapes, two pitches only)
      // See Gould, p. 22-23

      // If the beam is flat
      if (flat) {
        // Calculate the common Y-coordinate for all stem ends
        let y = (stemDir === 'up' ? Math.min : Math.max)(...beamData.events.map(e => e.stem.end));
        // Set the stem end Y-coordinate for all events in the beam
        for (let event of beamData.events) {
          event.stem.end = y;
        }
      } else {
        // If the beam is not flat, calculate the slope and adjust the stem ends accordingly

        // Get X-coordinates of the first and last note chords
        let x1 = noteChord1.scoreX + (noteChord1.stemX || 0);
        let x2 = noteChord2.scoreX + (noteChord2.stemX || 0);

        // Calculate the minimum/maximum Y-coordinate of stem ends based on stem direction
        let y1 = (stemDir === 'up' ? Math.min : Math.max)(...beamData.events.map(e => e.stem.end));
        let y2 = y1;

        // Determine if the distance between note chords is narrow (less than three staff spaces)
        let narrow = (x2 - x1) < (noteChord1.score.staffSize * 0.25 * 3);

        // Calculate the difference in staff lines between the outermost notes
        let yDelta = note2.staffLine - note1.staffLine;
        let up = stemDir === 'up';

        // Adjust Y-coordinates of stem ends based on the difference in staff lines and narrowness
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

        // Calculate the slope of the beam
        let slope = x1 === x2 ? 0 : (y2 - y1) / (x2 - x1);

        // Adjust the stem end Y-coordinate for all events in the beam based on the calculated slope
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
      } else {
        // Multiple notes, tie direction follows average staff line
        let averageStaffLine = scoreNotes.map(n => n.staffLine).reduce((a, b) => a + b, 0) / scoreNotes.length;
        scoreNote.tieDirection = scoreNote.staffLine > averageStaffLine ? 'down' : 'up';
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
          globalStaff: thisNoteChord.globalStaff,
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
          globalStaff: thisNoteChord.globalStaff,
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
    // Assume up-stem if not specified. TODO: Correct?
    let stemDirection = (scoreNoteChord.stem !== undefined) ? scoreNoteChord.stem.direction : 'up';
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
      globalStaff: 0,
      leftBarline: true,
      parts: score.parts,
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
    staffDistance: score.staffDistance,
    visibleParts: score.parts
  });
  singleSystem.items = systemItems;
  return [singleSystem];
}

function breakScore(scoreListGroups, score, staffWidth) {
  if (!staffWidth) throw new Error('staffWidth is undefined!');
  let indent = score.margins.left || 0;
  if (scoreListGroups.length === 0) return [];
  // Remove spacing from last group
  let lastGroup = scoreListGroups[scoreListGroups.length - 1];
  if (lastGroup) {
    lastGroup.minSpace = 0;
    lastGroup.optimalSpace = 0;
  }

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

    if (lastSystemGroup) {
      let staffSystem = new StaffSystem(score, staffSystemNum++, {
        staffWidth: lastSystemGroup.x + lastSystemGroup.innerWidth - indent,
        indent: indent,
        staves: score.staves,
        staffDistance: score.staffDistance,
        visibleParts: score.parts
      });
      staffSystem.groups = systemGroups;
      staffSystems.push(staffSystem);
    }

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
        globalStaff: 0,
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
        key = g.items.find(item => item.globalStaff === staff);
        if (key) {
          let newKey = new ScoreKey(key.item, score); // TODO: better copying
          newKey.staff = key.staff;
          newKey.globalStaff = key.globalStaff;
          key = newKey;
        }
      } else if (!clef && g.items[0] instanceof ScoreClef) {
        clef = g.items.find(item => item.globalStaff === staff);
        if (clef) {
          let newClef = new ScoreClef(clef.item, score, {kind: clef.kind}); // TODO: better copying
          newClef.staff = clef.staff;
          newClef.globalStaff = clef.globalStaff;
          clef = newClef;
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
  for (let part of staffSystem.visibleParts) {
    if (part.score.bracket) {
      let bracket = new ScoreBracket(null, score, {part: part, staff: 0, globalStaff: 1, kind: part.score.bracket});
      bracket.staffSystem = staffSystem;
      // bracket.updatePosition();
      staffSystem.items.unshift(bracket);
    }
  }  
}




function getPageOrigin (score, originX, originY) {
  let x, y;
  let leftMargin = score.margins.left || 0;
  switch (originX) {
    case "left":         x = 0; break;
    case "leftMargin":   x = leftMargin; break;
    case "right":        x = score.pageWidth; break;
    case "rightMargin":  x = score.pageWidth - (score.margins.right || 0); break;
    case "pageCenter":   x = score.pageWidth / 2; break;
    case "marginCenter": x = leftMargin + ((score.pageWidth - leftMargin - (score.margins.right || 0)) / 2); break;
  }
  let topMargin = score.margins.top || 0;
  switch (originY) {
    case "top":          y = 0; break;
    case "topMargin":    y = topMargin; break;
    case "bottom":       y = score.pageHeight; break;
    case "bottomMargin": y = score.pageHeight - (score.margins.bottom || 0); break;
    case "pageCenter":   y = score.pageHeight / 2; break;
    case "marginCenter": y = topMargin + ((score.pageHeight - topMargin - (score.margins.bottom || 0)) / 2); break;
  }
  return [x, y];
}

function getPageItemOrigin (score, pageItem) {
  return getPageOrigin(score, pageItem.originX, pageItem.originY);
}

function convertPageItemPosition (score, pageItem) {
  let [baseX, baseY] = getPageItemOrigin(score, pageItem);
  return [baseX + pageItem.x, baseY + pageItem.y];
}

function createScorePageItem (score, pageItem, page) {
  let [pageX, pageY] = convertPageItemPosition(score, pageItem);

  // PageText
  let text = pageItem.text;
  return new ScorePageText(pageItem, score, {
    text: pageItem.text,
    boxWidth: pageItem.boxWidth,
    boxHeight: pageItem.boxHeight,
    pageX: pageX,
    pageY: pageY,
    page: page,
    xAlign: pageItem.xAlign,
    yAlign: pageItem.yAlign
  });
}

function createScorePageItems (score) {
  // TODO: (unless (eq (page-mode self) :scroll)

  let scorePageItems = [];
  if (!score.song.score) return scorePageItems;

  if (score.song.score.pageItems) {
    for (let pageItem of score.song.score.pageItems) {
      // if (!(pageItem instanceof PageItem)) continue;
      let pages = pageItem.pages;
      if (!pages) pages = [1];
      else if (typeof pages === 'number') pages = [pages];
      for (let page of pages) {
        scorePageItems.push(createScorePageItem(score, pageItem, page));
      }
    }
  }
  score.scorePageItems = scorePageItems;
  // score.updatePageTextCache(scorePageItems); // TODO. Or is it needed?
  for (let scorePageItem of scorePageItems) {
    scorePageItem.updatePosition();
    scorePageItem.updateBounds();
  }
}

function getSpacingValue (score, param) {
  let lyricsMode = false;    // TODO
  let chordMode = false;     // TODO
  let editPart = null;       // TODO
  if (lyricsMode) {
    let layout = score.song.score.lyricsModeLayout;
    if (layout) return layout[param] || score[param];
    return score[param];
  }
  if (chordMode) {
    let layout = score.song.score.chordSheetLayout;
    if (layout) return layout[param] || score[param];
    return score[param];
  }
  if (editPart) {
    return editPart[param] || score[param];
  }
  return score[param];
}

function partsInSamePartGroup(part) {
  // TODO;
  if (!part) {
    console.warn("no part");
    return [];
  }
  return [part];
}
