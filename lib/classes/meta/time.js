
import Meta from './meta.js';
import misc from '../../misc.js';
import Fraction from 'fraction.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;

/**
 * Time signature meta-event.
 *
 * Time signature Tempo is expressed in `bpm` and `beat`, where `bpm` is a number
 * and `beat` is a wn Fraction. `beat` is coerced to a Fraction when
 * the item is created, but not if the slot is assigned at a later point.
 */
export default class Time extends Meta {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      beats: {
        type: Array,
        default: [1, 1, 1, 1]
      },
      denom: {
        type: Number,
        default: 4
      },
      abbreviate: {
        type: Boolean,
        default: false
      }
    }, super.getSlots());
  }

  /** @ignore */
  init() {
    super.init();

    if (_.isNumber(this.beats) && this.beats % 1 === 0 && this.beats > 0) {
      this.beats = Time.defaultBeatPattern(this.beats, this.denom);
      if (!this.beats) throw new Error('Could not find default beat pattern for ' + this.beats);
    }

    return this;
  }

  getMeasureWn() {
    return new Fraction(this.num, this.denom);
  }

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.isArrayOfIntegers(this, 'beats');
    validator.isOneOf(this, 'denom', [1, 2, 4, 8, 16, 32, 64, 128, 256]);
    return validator;
  }

  /** @type {number} */
  get num() {
    return misc.sumArray(this.beats);
  }

  /** @ignore */
  toString() {
    return '<' + this.num + '/' + this.denom + '>';
  }

  /** @ignore */
  toVexFlow() {
    let str;
    if (this.abbreviate && this.num === 4 && this.denom === 4) {
      str = new String('C'); // eslint-disable-line no-new-wrappers
    } else if (this.abbreviate && this.num === 2 && this.denom === 2) {
      str = new String('C|'); // eslint-disable-line no-new-wrappers
    } else {
      str = new String(this.num + '/' + this.denom); // eslint-disable-line no-new-wrappers
    }
    str.id = this.id;
    return str;
  }

  /**
   * Get default beat pattern for a given numerator and denominator.
   * @param {number} num
   * @param {number} denom
   * @return {number[]}
   *
   * @example
   * Time.defaultBeatPattern(4, 4)  => [1, 1, 1, 1]
   * Time.defaultBeatPattern(6, 8)  => [3, 3]
   */
  static defaultBeatPattern(num, denom) {
    if (denom >= 8 && num >= 6 && num % 3 === 0) {
      let beats = Array(num / 3);
      for (let i = 0; i < beats.length; i++) beats[i] = 3;
      return beats;
    } else {
      let beats = Array(num);
      for (let i = 0; i < beats.length; i++) beats[i] = 1;
      return beats;
    }
  }
}

Time.coerce = function(source, parent, copy) {
  if (source instanceof Time) {
    if (copy) return new Time(source, parent);
    else return source;
  }
  if (isObject(source)) return new Time(source, parent);
  throw new Error('Cannot coerce ' + source + ' to a time!');
};

Time.itemType = 'Time';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Time);
