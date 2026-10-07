
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
      },
      audio: {
        type: Object,
        nullOk: true,
        default: null
      }
      // scoreProperties: {
      //   type: Object
      // }
    }, super.getSlots());
  }

   /**
   * @ignore
   */
  toString() {
    return `[Part ${this.id}]`;
  }

  init() {
    super.init();
    this.env.set('part', this);
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
