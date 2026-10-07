
// import chalk from 'chalk';
import EventContainer from './event-container.js';
import Duration from '../duration.js';
import Fraction from 'fraction.js';
import Tuplet from './tuplet.js';
import _ from 'underscore';
import misc from '../../misc.js';
import Rest from './rest.js';

/**
 * A horizontal grouping of {@link Note}s
 */
export default class Voice extends EventContainer {
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
      channel: {
        type: Number,
        nullOk: true,
        default: null
      },
      kind: {
        type: String,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
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

Voice.coerce = function(source, parent, copy) {
  if (source instanceof Voice) return copy ? new Voice(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a voice!');
};

Voice.itemType = 'Voice';
Voice.defaultStepDuration = false;

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Voice);
