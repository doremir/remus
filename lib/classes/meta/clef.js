
import Meta from './meta.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isString = _.isString;
var isObject = _.isObject;

/**
 * Clef change meta-event.
 *
 */
export default class Clef extends Meta {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['kind', 'octave']);
  }

  /**
   * @ignore
   */
  inspect() {
  }

  /**
   * @ignore
   */
  init() {
    super.init();

    /** @type {String} */
    this.kind = this.kind || 'g';
    /** @type {Integer} */
    this.octave = this.octave || 0;

    return this;
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    validator.isOneOf(this, 'kind', ['g', 'c', 'f']);
    validator.isInteger(this, 'octave', -2, 2);
    // validator.isOneOf(this, 'beat', [1, 2, 4, 8, 16, 32, 64, 128, 256]);
    return validator;
  }

  /**
   * @ignore
   */
  toString() {
    let o = '';
    if (this.octave < 0) o += (this.octave * 7 + 1);
    if (this.octave > 0) o += '+' + (this.octave * 7 + 1);
    return o;
  }
}

Clef.coerce = function(source, parent, copy) {
  if (source instanceof Clef) {
    if (copy) return new Clef(source, parent);
    else return source;
  }
  if (isString(source)) return Clef.fromString(source, parent);
  if (isObject(source)) return new Clef(source, parent);
  throw new Error('Cannot coerce ' + source + ' to a clef!');
};

Clef.fromString = function(str, parent) {
  let match = str.match(/^(\w+)([\+\-]\d+)?$/);
  if (match) {
    let octave = {'+8': 1, '+15': 2, '-8': -1, '-15': -2}[match[2]];
    if (match[2] && !octave) {
      throw new Error('Unknown clef transposition: ' + match[2]);
    }
    return new Clef({kind: match[1], octave: octave || 0});
  }
  throw new Error('Cannot create a clef from the string ' + str);
};

Clef.itemType = 'Clef';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Clef);
