
// import chalk from 'chalk';
import VerticalContainer from './vertical-container.js';
import Duration from '../duration.js';
import Fraction from 'fraction.js';
import misc from '../../misc.js';
import Rest from './rest.js';
import Interval from '../interval.js';

/**
 * A collection of voices belonging together, usually representing a single instrument,
   for grouping voices in a score.
 */
export default class Part extends VerticalContainer {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      sound: {
        type: String,
        nullOk: true,
        default: null
      },
      name: {
        type: String,
        nullOk: true,
        default: null
      },
      abbrName: {
        type: String,
        nullOk: true,
        default: null
      },
      role: {
        type: String,
        nullOk: true,
        default: null
      },
      staves: {
        type: Number,
        default: 1
      },
      staffLines: {
        type: Number,
        default: 5
      },
      transposition: {
        type: Interval,
        nullOk: true,
        default: null
      }
      // scoreProperties: {
      //   type: Object
      // }
    }, super.getSlots());
  }

  inspect() {
    // var color = chalk.blue;
    // return color('<Voice>');
  }

   /**
   * @ignore
   */
  toString() {
    return `[Voice ${this.id}]`;
  }

  init() {
    super.init();
    this.env.set('voice', this);
    return this;
  }

  convertOverlapsToSubvoices() {
    this.assignOverlapsToLayers();
    let voices = this.splitByLayers();
    let firstVoice = voices.shift();
    this.events = firstVoice.events;
    _.each(voices, (voice) => {
      if (voice.position) voice.position = Duration.coerce({value: 0, unit: voice.position.unit});
    });
    this.events = voices.concat(this.events);
    this.shouldResolve = true;
  }

  /**
   *   Destructively split notes and rests so that the voice may be scored
   *   (no events crosses barlines etc)
   */
  // splitEventsForScoring() {
  //   let newEventList = [];

  //   // TODO: support for changing time
  //   let time = this.cache.time;
  //   if (!time) {
  //     console.warn('cache.time is not set in splitEventsForScoring, is song resolved?');
  //   }
  //   let measureLength = time ? time.getMeasureWn() : new Fraction(1);
  //   let beatLength = new Fraction(1, 4); // TODO: don't hardcode!
  //   let position = time ? this.cache.absWn.sub(time.cache.absWn) : this.cache.absWn; // position since start of this time signature
  //   position = position || new Fraction(0);
  //   for (let e of this.events) {
  //     if (e.duration && e.duration.unit !== 'wn') {
  //       console.log('splitEventsForScoring does not support this duration unit: ', e.duration);
  //       throw new Error('splitEventsForScoring can only work with wn durations!');
  //     }
  //     let d = e.duration ? e.duration.value : e.cache.endWn.sub(e.cache.absWn);
  //     if (!d) {
  //       console.log('Undefined duration: ', e);
  //       throw new Error('Undefined duration');
  //     }
  //     if (e instanceof Tuplet) {
  //       newEventList.push(e);
  //       continue;
  //     }
  //     let durations = NoteSplit.divide([d], measureLength, beatLength, position, (e instanceof Rest), 2)[0];
  //     if (durations.length === 1) {
  //       newEventList.push(e);
  //     } else {
  //       e.duration = new Duration({value: durations[0], unit: 'wn'});
  //       newEventList.push(e);
  //       for (let i = 1; i < durations.length; i++) {
  //         let e2 = misc.clone(e);
  //         e2.duration = new Duration({value: durations[i], unit: 'wn'});
  //         e2.tiedTo = true;
  //         newEventList[newEventList.length - 1].tiedFrom = true;
  //         newEventList.push(e2);
  //       }
  //     }
  //     position = position.add(d);
  //   }
  //   this.events = newEventList;
  //   this.shouldResolve = true;
  // }

  scorable() {
    if (this.eventTimeMode === 'relative') {
      let events = this.events;
      for (let i = 0; i < events.length; i++) {
        // if (!event.cache) return false;
        // if (event.cache.absWn !== event.cache.endWn) return false;
        let event = events[i];
        if (event.position && !event.position.isZero()) return false;
        if (event.duration.isZero() || event.duration.unit !== 'wn') return false;
      }
    } else {
      // Cannot currently score absolute voices
      return false;
    }
    return true;
  }
}

Part.coerce = function(source, parent, copy) {
  if (source instanceof Part) return copy ? new Part(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a part!');
};

Part.itemType = 'Part';
Part.defaultStepDuration = false;

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Part);
