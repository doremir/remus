
// import _ from 'underscore';
// import Item from './item.js';
// import chalk from 'chalk';

import Fraction from 'fraction.js';
import EventContainer from './classes/event/event-container.js';

export default class MusicPtr {
  constructor(container) {
    if (!(container instanceof EventContainer)) throw new Error('MusicPtr must be initialized with an event container');
    // container.resolve(); // or is it caller's responsibility?
    this.container = container;
    this.reset();
  }

  reset() {
    this.eventStatus = 'head';
    this.metaStatus = 'head';
    this.absWn = new Fraction(0);
    this.prevBar = new Fraction(0);
    this.globals = this.container.cache.globals;
    this.setTime(this.container.cache.time);
    this.tempo = this.container.cache.tempo;
    this.nextTime = this.getNextGlobal('Time');
    this.nextTempo = this.getNextGlobal('Tempo');
    this.currentBeat = 1;
  }

  setTime(time) {
    if (!time) throw new Error('No Time event present in container (or the container is not resolved)');
    this.time = time;
    this.measureLength = time.getMeasureWn();
    this.beatOffsets = Array(time.beats.length);
    let totalAtoms = 0;
    for (let i = 0; i < time.beats.length; i++) {
      let atoms = time.beats[i];
      totalAtoms += atoms;
      this.beatOffsets[i] = new Fraction(totalAtoms, time.denom);
    }
    this.updateOffsets();
  }

  updateOffsets() {
    this.barOffset = this.absWn.sub(this.time.cache.absWn).mod(this.measureLength);
    this.prevBar = this.absWn.sub(this.barOffset);
    let lastBeat = 0;
    for (let i = 0; i < this.beatOffsets.length; i++) {
      if (this.barOffset < this.beatOffsets[i]) {
        this.beatOffset = this.barOffset.sub(lastBeat);
        this.currentBeat = i + 1;
        break;
      }
      lastBeat = this.beatOffsets[i];
    }
  }

  atHead() {
    return this.eventStatus === 'head' && this.metaStatus === 'head';
  }

  atTail() {
    return this.eventStatus === 'tail' && this.metaStatus === 'tail';
  }

  atBar() {
    return this.barOffset.n === 0;
  }

  atBeat() {
    return this.beatOffset.n === 0;
  }

  atEvent() {
    return this.event;
  }

  atMeta() {
    return this.meta;
  }

  get offset() {
    return this.absWn;
  }

  get eventOffset() {
    return this.event ? this.absWn.sub(this.event.cache.absWn) : null;
  }

  stepBeat() {
    let step = this.currentBeatLength.sub(this.beatOffset);
    this.absWn = this.absWn.add(step);
    this.updateOffsets();
    this.updateCurrentEvent(this.eventIndex);
    return step;
  }

  stepEvent() {
    if (this.eventStatus === 'head') {
      this.eventIndex = 0;
      this.eventStatus = 'event';
    } else if (this.eventStatus === 'tail') {
      console.warn('stepEvent: Cannot step past event tail');
      return null;
    } else {
      this.eventIndex++;
    }
    if (this.eventIndex < this.container.events.length) {
      this.event = this.container.events[this.eventIndex];
      this.absWn = this.event.cache.absWn;
      this.updateOffsets();
    } else {
      if (this.event) {
        this.absWn = this.event.cache.endWn;
        this.updateOffsets();
      }
      this.eventStatus = 'tail';
      this.eventIndex = null;
      this.event = null;
    }
  }

  stepWn(wn) {
    this.absWn = this.absWn.add(wn);
    this.updateOffsets();
    this.updateCurrentEvent(this.eventIndex);
    return wn;
  }

  get currentBeatLength() {
    let i = this.currentBeat;
    return this.beatOffsets[i - 1].sub(this.beatOffsets[i - 2] || 0);
  }

  updateCurrentEvent(fromIndex) {
    let index = this.getEventIndexAtWn(this.absWn, fromIndex);
    this.eventIndex = index;
    this.event = index ? this.container.events[index] : null;
  }

  getEventIndexAtWn(wn, fromIndex) {
    let events = this.container.events;
    let eventCount = events.length;
    for (let i = fromIndex || 0; i < eventCount; i++) {
      if (events[i].cache.absWn <= wn && events[i].cache.endWn > wn) {
        return i;
      }
    }
    console.log('Could not find any event at ' + wn.toFraction());
  }

  copy() {
    throw new Error('Not implemented');
  }

  getNextGlobal(type) {
    var pos = 0;
    while (this.globals[pos] && ((this.globals[pos].cache.absWn <= this.absWn) || (type && !(this.globals[pos].type === type)))) pos++;
    return this.globals[pos];
  }

  getPrevGlobal(type) {
    var pos = this.globals.length - 1;
    while (this.globals[pos] && ((this.globals[pos].cache.absWn >= this.absWn) || (type && !(this.globals[pos].type === type)))) pos--;
    return this.globals[pos];
  }
}
