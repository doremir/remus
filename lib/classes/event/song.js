
import _ from 'underscore';
import { ArrayOf } from '../../item-handler.js';
// import chalk from 'chalk';
import VerticalContainer from './vertical-container.js';
import envDefaults from '../../defaults.js';
import Item from '../item.js';
import Fraction from 'fraction.js';

function toSeconds(value, fallback = null) {
  if (_.isNumber(value)) return value;
  if (_.isObject(value) && _.isFunction(value.valueOf)) {
    const n = Number(value.valueOf());
    if (_.isFinite(n)) return n;
  }
  const n = Number(value);
  return _.isFinite(n) ? n : fallback;
}

function expandRepeatTimes(repeats) {
  let times = [0];
  _.each(repeats || [], (repeat) => {
    const count = Math.max(0, parseInt(repeat && repeat.count, 10) || 0);
    const periodTime = toSeconds(repeat && repeat.periodTime, 0);
    if (!count || !_.isFinite(periodTime)) return;

    const nextTimes = [];
    _.each(times, (time) => {
      for (let i = 0; i < count; i++) {
        nextTimes.push(time + (i * periodTime));
      }
    });
    times = nextTimes;
  });
  return times;
}

function isTieContinuation(noteEvent) {
  if (!noteEvent) return false;
  if (noteEvent.tiedTo === true) return true;
  const parentChord = noteEvent.parent;
  return !!(parentChord && parentChord.type === 'NoteChord' && parentChord.tiedTo === true);
}

function tiesForward(noteEvent) {
  if (!noteEvent) return false;
  if (noteEvent.tiedFrom === true) return true;
  const parentChord = noteEvent.parent;
  return !!(parentChord && parentChord.type === 'NoteChord' && parentChord.tiedFrom === true);
}

/**
 * A piece of music.
 */
export default class Song extends VerticalContainer {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      items: {
        type: ArrayOf.Item,
        default: [],
        owned: true
      },
      title: {
        type: String,
        nullOk: true,
        default: null
      },
      remusVersion: {
        type: Number,
        nullOk: true,
        default: null
      },
      audio: {
        type: Object,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
  }

  /** @ignore */
  constructor(properties, parent) {
    if (parent) {
      console.warn('Song should not have a parent');
    }
    properties = _.clone(properties);
    properties.env = _.extend({}, envDefaults, properties.env);
    super(properties, parent);

    this.env.set('root', this);
    this.env.set('song', this);
  }

  // set parent(parent) {
  //   console.warn('Song should not have a parent'); // Just warn, this could change in the future
  //   super(parent); // Hmm, this doesn't work, cannot call super in a setter...
  // }

  childItems(selector) {
    var selectorFunction = null;

    if (_.isFunction(selector)) {
      selectorFunction = selector;
    } else if (_.isString(selector)) {
      selectorFunction = (item) => {
        return item.type === selector;
      };
    } else {
      selectorFunction = v => true;
    }

    return _.filter(this.items, selectorFunction);
  }

  findItems(selector) {
    return this.childItems(selector);
  }

  /** @ignore */
  toString() {
    return '[Song]';
  }

  /** @ignore */
  toJSON() {
    var obj = super.toJSON();

    obj.items = _.map(this.items, (item) => {
      if (_.isObject(item) && item.toJSON) {
        return item.toJSON();
      } else {
        return item;
      }
    });

    return obj;
  }

  /**
   * Resolve the song and serialize it with cache data, suitable for sending
   * to the Modus server or any consumer that needs resolved positions.
   *
   * Handles: resolve, cache serialization, Fraction→string conversion,
   * key sorting, and stripping audio references.
   *
   * @param {Object} [options]
   * @param {boolean|string[]} [options.cache=true] - `true` for all cache keys, or an array of specific keys
   * @param {boolean} [options.sorted=true] - Sort keys for stable output
   * @param {boolean} [options.stripAudio=true] - Remove the `audio` property
   * @returns {Object} Plain JSON object ready for serialization/sending
   */
  toResolvedJSON(options = {}) {
    const {
      cache = ['absWn', 'trimmedStartWn', 'trimmedEndWn'],
      sorted = true,
      stripAudio = false,
    } = options;

    this.resolve();

    const prevCache = Item.serializeCache;
    const prevFractionToJSON = Fraction.prototype.toJSON;
    Item.serializeCache = cache;
    Fraction.prototype.toJSON = function () {
      return this.toFraction(false);
    };

    try {
      const plain = JSON.parse(JSON.stringify(this.toJSON()));
      const json = sorted ? Song.sortKeys(plain) : plain;
      if (stripAudio) delete json.audio;
      return json;
    } finally {
      Item.serializeCache = prevCache;
      Fraction.prototype.toJSON = prevFractionToJSON;
    }
  }

  /**
   * Static convenience: accepts a plain JSON object or a Song instance
   * and returns resolved JSON ready for the server.
   *
   * @param {Object|Song} input - Plain remus JSON or Song instance
   * @param {Object} [options] - Same options as the instance method
   * @returns {Object}
   */
  static toResolvedJSON(input, options) {
    const song = input instanceof Song ? input : new Song(input);
    return song.toResolvedJSON(options);
  }

  /**
   * Recursively sort object keys with remus-friendly ordering.
   * @param {*} value - Any JSON-compatible value
   * @returns {*} The same structure with sorted keys
   */
  static sortKeys(value) {
    if (Array.isArray(value)) {
      return value.map(Song.sortKeys);
    }
    if (value && typeof value === 'object') {
      const sorted = Object.entries(value)
        .sort(([a], [b]) => Song._keyCmp(a, b))
        .map(([k, v]) => [k, Song.sortKeys(v)]);
      return Object.fromEntries(sorted);
    }
    return value;
  }

  /** @ignore */
  static _keyCmp(a, b) {
    const pa = Song._keyOrder[a] != null ? Song._keyOrder[a] : 0;
    const pb = Song._keyOrder[b] != null ? Song._keyOrder[b] : 0;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  }

  /** @ignore */
  resolve(force = false) {
    super.resolve(force);
  }

  /**
   * Return normalized playback events in seconds for audio engines.
   *
   * Shape:
   *   {
   *     events: [{type, sound, note, time, duration, amp, offset, skip, sourceEvent}],
   *     notes: [...],
   *     audio: [...]
   *   }
   */
  getPlaybackEvents() {
    const noteEvents = this.findEvents('Note') || [];
    const audioEvents = this.findEvents('Audio') || [];

    const notes = [];
    const voiceIds = new WeakMap();
    let nextVoiceId = 0;
    const tieStarts = new Map();
    const sortedNoteEvents = noteEvents.slice().sort((a, b) => {
      const aStart = toSeconds(a?.cache?.absTime, 0);
      const bStart = toSeconds(b?.cache?.absTime, 0);
      return aStart - bStart;
    });

    _.each(sortedNoteEvents, (noteEvent) => {
      const voice = noteEvent && noteEvent.env && noteEvent.env.get && noteEvent.env.get('voice');
      const sound = voice && voice.sound;
      if (!sound) return;

      const cache = (noteEvent && noteEvent.cache) || {};
      const start = toSeconds(cache.trimmedStartTime, toSeconds(cache.absTime, 0));
      const end = toSeconds(cache.trimmedEndTime, toSeconds(cache.endTime, start));
      const duration = Math.max(0, end - start);
      const velocity = _.isNumber(noteEvent.velocity) ? noteEvent.velocity : 80;
      const amp = (velocity / 127) * (_.isNumber(cache.amp) ? cache.amp : 1);

      if (!sound || !cache.enabled || !_.isFinite(start) || !_.isFinite(duration)) return;

      if (voice && !voiceIds.has(voice)) {
        voiceIds.set(voice, nextVoiceId++);
      }
      const voiceId = voice ? voiceIds.get(voice) : -1;
      const pitchKey = String(noteEvent.pitch);
      const baseKey = `${voiceId}|${sound}|${pitchKey}`;
      const hasForwardTie = tiesForward(noteEvent);
      const isContinuation = isTieContinuation(noteEvent);

      _.each(expandRepeatTimes(cache.repeats), (relTime) => {
        const key = `${baseKey}|${relTime}`;

        if (isContinuation) {
          const tieStart = tieStarts.get(key);
          if (tieStart) {
            const tieEnd = Math.max(tieStart.time + tieStart.duration, start + relTime + duration);
            tieStart.duration = tieEnd - tieStart.time;
            return;
          }
          // Fall back to playing if tie source is missing.
        }

        const noteOut = {
          type: 'Note',
          sound,
          note: noteEvent.pitch,
          time: start + relTime,
          duration,
          amp,
          sourceEvent: noteEvent,
        };
        notes.push(noteOut);

        if (hasForwardTie) {
          tieStarts.set(key, noteOut);
        } else {
          tieStarts.delete(key);
        }
      });
    });

    const audio = [];
    _.each(audioEvents, (audioEvent) => {
      const cache = (audioEvent && audioEvent.cache) || {};
      const start = toSeconds(cache.trimmedStartTime, toSeconds(cache.absTime, 0));
      const end = toSeconds(cache.trimmedEndTime, toSeconds(cache.endTime, start));
      const duration = Math.max(0, end - start);
      const offset = (audioEvent && audioEvent.offset && _.isFunction(audioEvent.offset.toSeconds)) ? audioEvent.offset.toSeconds() : 0;

      if (!cache.enabled || !_.isFinite(start) || !_.isFinite(duration)) return;

      _.each(expandRepeatTimes(cache.repeats), (relTime) => {
        audio.push({
          type: audioEvent.type,
          id: audioEvent.id,
          sound: audioEvent.id,
          offset,
          time: start + relTime,
          duration,
          skip: _.isNumber(cache.skip) ? cache.skip : 0,
          amp: _.isNumber(cache.amp) ? cache.amp : 1,
          sourceEvent: audioEvent,
        });
      });
    });

    const events = notes.concat(audio).sort((a, b) => a.time - b.time);
    return { events, notes, audio };
  }
}

Song.coerce = function(source, parent, copy) {
  if (source instanceof Song) return copy ? new Song(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a song!');
};

Song.itemType = 'Song';

/** Key sort priority: negative = early, positive = late, 0 = alphabetical middle */
Song._keyOrder = {
  type: -100,
  events: 90,
  metas: 91,
  clientSpecific: 92,
  cache: 99,
};

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Song);
