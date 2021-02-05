
import Event from './event';
// import chalk from 'chalk';
import Harmony from '../harmony';

/**
 * A chord event
 *
 * In remus terminology, a Chord is a Harmony in event form. In other words, Chord
 * relate to {@link Harmony} much in the same way as {@link Note} relate to {@link Pitch}.
 *
 */
export default class Chord extends Event {
  /** @ignore */
  static getSlots() {
    return super.getSlots().concat(['harmony']);
  }

  /** @ignore */
  inspect() {
    // var color = chalk.yellow;
    // if (this.harmony) return color('<') + color.bold(this.harmony) + color('>');
    // return color('<chord>');
  }

  /** @ignore */
  init() {
    super.init();
    /** @type {?Harmony} */
    this.harmony = this.initSubObject(this.harmony, Harmony) || null;
    this.isChord = true; // ?
    return this;
  }

  /** @ignore */
  toString() {
    if (this.harmony) return '<' + this.harmony.toString() + '>';
    return '<chord>';
  }

  /** @ignore */
  localResolve() {
    super.localResolve();
    if (this.harmony) {
      this.cache.harmonyKind = this.harmony.kind();
    }
  }
}

Chord.coerce = function(source, parent, copy) {
  if (source instanceof Chord) {
    if (copy) return new Chord(source, parent);
    else return source;
  }
  if (source instanceof Harmony) return new Chord({harmony: source}, parent);
  return new Chord(source, parent);
  // throw new Error('Cannot coerce ' + source + ' to a chord!');
};

Chord.itemType = 'Chord';

import ItemHandler from '../../item-handler';
ItemHandler.registerItem(Chord);
