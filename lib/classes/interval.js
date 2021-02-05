
import Item from './item.js';
import knowledge from '../knowledge.js';
import vector from '../vector.js';
import toCoord from 'interval-coords';
import misc from '../misc.js';

// import chalk from 'chalk';

function negativeCoord(coord) {
  return [-coord[0], coord[1] ? -coord[1] : coord[1]]; // NOTE: works for both 0 and null
}

export default class Interval extends Item {
  static getSlots() {
    return super.getSlots().concat(['coord']);
  }

  inspect() {
    // return chalk.red('<') + chalk.red.bold(this.toString()) + chalk.red('>');
  }

  // Display name ("unison", "second", "third", etc)
  name() {
    return knowledge.intervalsIndex[Math.abs(this.coord[0])];
  }

  // Number of semitones, positive for all intervals except P1
  semitones() {
    return this.coord[1] === null ? null : Math.abs(this.coord[1]);
  }

  // The displayed number, always positive (all seconds return 2, thirds 3, decimas 10, etc)
  number() {
    return Math.abs(this.value());
  }

  // The interval number, positive or negative (2 means second up, -2 second down)
  value() {
    return this.coord[0] < 0 ? this.coord[0] - 1 : this.coord[0] + 1;
  }

  // Internal: can the interval be perfect, or is it a minor/major interval?
  kind() {
    return [0, 3, 4, 7].indexOf(Math.abs(this.coord[0]) % 7) >= 0 ? 'perfect' : 'minor';
  }

  // Returns the "simple part", e.g. "third" for M10 and "second" for m9
  // The global Interval.octaveIsSimple determines if octave is treated as
  // a base interval or not (so P15 can be "octave" + 1 octave, or "unison" + 2 octaves)
  base() {
    if (Interval.octaveIsSimple) {
      return knowledge.intervalsIndex[this.isCompound() ? (this.number() - 2) % 7 + 1 : (this.number() - 1)];
    } else {
      return knowledge.intervalsIndex[(this.number() - 1) % 7];
    }
  }

  // Returns number of octaves for compound intervals.
  // Note that if Interval.octaveIsSimple is set
  octaves() {
    if (Interval.octaveIsSimple) {
      return this.isCompound() ? Math.floor((this.number() - 2) / 7) : 0;
    } else {
      return Math.floor((this.number() - 1) / 7);
    }
  }

  direction(newDirection) {
    if (newDirection) {
      var dir = this.value() >= 1 ? 'up' : 'down';
      if (dir !== newDirection) {
        this.coord = negativeCoord(this.coord);
      }

      return this;
    } else {
      return this.value() >= 1 ? 'up' : 'down';
    }
  }

  simple(ignore) {
    // Get the (upwards) base interval (with quality)
    var octaves = this.octaves();
    var simple = [
      Math.abs(this.coord[0]) - octaves * 7,
      this.coord[1] !== null ? Math.abs(this.coord[1]) - octaves * 12 : null
    ];

    // Turn it around if necessary
    if (!ignore) {
      if (this.direction() === 'down') simple = negativeCoord(simple);
    }

    return new Interval({coord: simple});
  }

  isCompound() {
    return this.number() > (Interval.octaveIsSimple ? 8 : 7);
  }

  isSimple() {
    return !this.isCompound();
  }

  invert() {
    var simple = this.simple();
    // Special: even when octaveIsSimple is false, we want unisons to
    // invert to octaves
    if (this.coord[0] % 7 === 0 && this.coord[0]) {
      if (this.direction() === 'up') {
        return new Interval({coord: [0, simple.coord[1] ? -simple.coord[1] : simple.coord[1]]});
      } else {
        return new Interval({coord: [0, simple.coord[1]]});
      }
    }

    if (this.direction() === 'up') {
      return new Interval({coord: [7 - simple.coord[0], simple.coord[1] ? 12 - simple.coord[1] : simple.coord[1]]});
    } else {
      return new Interval({coord: [-7 - simple.coord[0], simple.coord[1] ? -12 - simple.coord[1] : simple.coord[1]]});
    }
  }

  quality(long) {
    if (this.coord[1] === null) return null;
    var quality = knowledge.alterations[this.kind()][this.qualityValue() + 2];
    return long ? knowledge.qualityLong[quality] : quality;
  }

  qualityValue() {
    if (this.coord[1] === null) return null;
    if (this.direction() === 'down') {
      return (-this.coord[1] % 12) - knowledge.intervals[knowledge.intervalsIndex[(this.number() - 1) % 7]][1];
    } else {
      return (this.coord[1] % 12) - knowledge.intervals[knowledge.intervalsIndex[(this.number() - 1) % 7]][1];
    }
  }

  equal(interval) {
    return this.coord[0] === interval.coord[0] && this.coord[1] === interval.coord[1];
  }

  greater(interval) {
    var semi = this.semitones();
    var isemi = interval.semitones();

    // If equal in absolute size, measure which interval is bigger
    // For example P4 is bigger than A3
    return (semi === isemi) ? (this.number() > interval.number()) : (semi > isemi);
  }

  smaller(interval) {
    return !this.equal(interval) && !this.greater(interval);
  }

  add(interval) {
    if (this.coord[1] === null || interval.coord[1] === null) {
      return new Interval({coord: [this.coord[0] + interval.coord[0]]});
    } else {
      return new Interval({coord: vector.add(this.coord, interval.coord)});
    }
  }

  toString(ignore) {
    // If given true, return the positive value
    var number = ignore ? this.number() : this.value();

    return this.coord[1] === null ? '' + number : this.quality() + number;
  }
}

Interval.fromString = function(simple, parent) {
  var coord = toCoord(simple);
  if (!coord) {
    throw new Error('Invalid simple format interval');
  }

  return new Interval({coord: coord}, parent);
};

Interval.coerce = function(source, parent, copy) {
  if (source instanceof Interval) {
    if (copy) {
      return new Interval(source, parent);
    } else {
      return source;
    }
  }
  // TODO: What makes most sense: 3 meaning "3" => [2, null] (unspecified third), or 3 meaning [3, null] (unsp. fourth)??
  if (misc.isInteger(source)) { return new Interval({coord: [source, null]}); }
  if (typeof source === 'string') { return Interval.fromString(source, parent); }
  if (source instanceof Array && source.length === 2) { return new Interval({coord: source}, parent); }
  throw new Error('Cannot coerce ' + source + ' to an interval!');
};

Interval.from = function(from, to) {   // ???
  return from.interval(to);
};

Interval.between = function(from, to) { // TODO: parameter for explicit key
  return new Interval({coord: vector.sub(to.toCoord(), from.toCoord())});
};

// Interval.invert = function(sInterval) {
//   return Interval.fromString(sInterval).invert().toString();
// };

Interval.octaveIsSimple = false;
Interval.itemType = 'Interval';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(Interval);
