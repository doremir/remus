
import _ from 'underscore';

import Item from './item.js';
import defaults from '../defaults.js';
import knowledge from '../knowledge.js';
import Interval from './interval.js';
// import misc from '../misc';
// import chalk from 'chalk';

/**
 * Musical modes.
 *
 */
export default class Mode extends Item {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      name: {
        type: String
      },
      scale: {
        type: Array
      },
      stepsPerOctave: {
        type: Number,
        default: defaults.stepsPerOctave
      },
      tcuPerOctave: {
        type: Number,
        default: defaults.tcuPerOctave
      }
    }, super.getSlots());
  }

  /**
   * The name of the mode
   * @return {string}
   */
  getName() {
    if (this.name) return this.name;
    for (let scale in knowledge.scales) {
      if (_.isEqual(knowledge.scales[scale], this.scale)) return scale;
    }
    return ''; // TODO
  }

  /**
   * Simple mode, i.e. "major" or "minor" or null if unknown
   * @return {string?}
   */
  simple() {
    let scale = this.scale || knowledge.scales[this.name];
    if (scale) {
      if (scale[2] === 3) return 'minor';
      if (scale[2] === 4) return 'major';
    }
    return null;
  }

  /**
   * Given a diatonic step, return a corresponding qualified interval
   * NOTE that step is "zero-based" (a unison is 0, a fourth is 3 etc)
   * @return {Interval}
   */
  stepInterval(step) {
    let spo = this.stepsPerOctave;
    let tpo = this.tcuPerOctave;
    let simpleStep = ((step % spo) + spo) % spo; // Positive remainder
    let octaves = Math.floor(step / spo);
    return new Interval({coord: [step, octaves * tpo + this.scale[simpleStep]]});
  }

  /**
   * Returns a string representation of the mode.
   * @return {string}
   *
   * **NOTE:** This is currently *not* the inverse of {@link Mode.fromString}, it is just for
   * creating a human-readable string.
   */
  toString() {
    return '<' + this.getName() + '>';
  }

  /**
   * @ignore
   */
  // toXML(rootName) {
  //   return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'mode'});
  // }

  /**
   * @ignore
   */
  // toXMLObject() {
  //   return { step: this.name().toUpperCase(), alter: this.accidentalValue(), octave: this.octave() };
  // }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    return validator;
  }
}

Mode.coerce = function(source, parent, copy) {
  if (source instanceof Mode) {
    if (copy || (source.parent !== parent)) return new Mode(source, parent);
    else return source;
  }
  if (_.isString(source)) { return Mode.fromString(source, parent); }
  if (source instanceof Array) {
    return new Mode({scale: source}, parent);
  }
  if (_.isObject(source)) { return new Mode(source, parent); }

  throw new Error('Cannot coerce ' + source + ' to a mode!');
};

Mode.fromString = function(name, parent) {
  let scale = knowledge.scales[name];
  // if (scale) {
  return new Mode({name: name, scale: scale}, parent);
  // }
  // throw new Error(name + ' is not a known mode');
};

// Mode.fromXML = function(xml, parent) {
//   var obj = misc.parseXML(xml, {explicitArray: false, mergeAttrs: true, explicitCharkey: false}, parent);
//   return Mode.fromXMLObject(obj, parent);
// };

// Mode.fromXMLObject = function(obj, parent) {
//   return new Mode({coord: coord}, parent);
// };

Mode.itemType = 'Mode';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(Mode);
