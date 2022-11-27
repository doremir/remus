
import Item from './item.js';
import misc from '../misc.js';
import Fraction from 'fraction.js';
import _ from 'underscore';
var isNumber = _.isNumber;
var isObject = _.isObject;

/* eslint-disable */
var wnToVexFlow = {
  '7/4':   { duration: 'w',  dots: 2 },  // "noteValue" would be better than "duration",
  '3/2':   { duration: 'w',  dots: 1 },  // but let's follow VexFlow's nomenclature
  '1/1':   { duration: 'w',  dots: 0 },
  '7/8':   { duration: 'h',  dots: 2 },
  '3/4':   { duration: 'h',  dots: 1 },
  '1/2':   { duration: 'h',  dots: 0 },
  '7/16':  { duration: 'q',  dots: 2 },
  '3/8':   { duration: 'q',  dots: 1 },
  '1/4':   { duration: 'q',  dots: 0 },
  '7/32':  { duration: '8',  dots: 2 },
  '3/16':  { duration: '8',  dots: 1 },
  '1/8':   { duration: '8',  dots: 0 },
  '7/64':  { duration: '16', dots: 2 },
  '3/32':  { duration: '16', dots: 1 },
  '1/16':  { duration: '16', dots: 0 },
  '7/128': { duration: '32', dots: 2 },
  '3/64':  { duration: '32', dots: 1 },
  '1/32':  { duration: '32', dots: 0 },
  // '7/256': { duration: '64', dots: 2 },
  '3/128': { duration: '64', dots: 1 },
  '1/64':  { duration: '64', dots: 0 },
  // '7/512': { duration: '128', dots: 2 },
  // '3/256': { duration: '128', dots: 1 },
  '1/128': { duration: '128', dots: 0 },
}
/* eslint-enable */

export default class Duration extends Item {
  /**
   * @ignore
   */
  static getSlots() {
    return Object.assign({
      value: {
        type: Fraction,
        default: 0,
        coerce: Fraction
      },
      unit: {
        type: String,
        default: 'ms'
      }
    }, super.getSlots());
  }

  /**
   * @ignore
   */
  inspect() {
    // return chalk.blue.bold(this.value.toFraction()) + ' ' + chalk.blue(this.unit);
  }

  /**
   * Is this a zero duration?
   * @return {boolean}
   */
  isZero() {
    // eslint-disable-next-line eqeqeq
    return this.value == 0; // N.B: Don't use ===
  }

  /**
   * Returns `true` if the duration is in time units (currently `s` or `ms`), `false` otherwise.
   * @return {boolean}
   */
  isTime() {
    return ['s', 'ms'].indexOf(this.unit) >= 0;
  }

  /**
   * Returns `true` if the duration is in atomic units, `false` otherwise.
   * The inverse of {@link isTime()}
   * @return {boolean}
   */
  isAtom() {
    return !this.isTime();
  }

  /**
   * Returns `true` if the duration has a fixed unit, i.e. unaffected by time signature.
   * Currently, the fixed units are `s`, `ms` and `wn`.
   * @return {boolean}
   */
  isFixed() {
    return ['s', 'ms', 'wn'].indexOf(this.unit) >= 0;
  }

  /**
   * Returns a new duration with same unit and inverted value
   * (positive durations become negative and v.v.)
   * The current object is not changed.
   * @return {Duration}
   */
  inverse() {
    return new Duration({value: this.value.neg(), unit: this.unit});
  }

  /**
   * Return the duration as a number of seconds.
   * Valid only when the duration is expressed in time units (`s` or `ms`)
   * @return {Fraction}
   */
  toSeconds() {
    switch (this.unit) {
      case 's': return this.value;
      case 'ms': return this.value.div(1000);
    }
  }

  /**
   * Return the value of the duration as a floating point number (ignoring the unit).
   * @return {Number}
   */
  toFloat() {
    return this.value.valueOf();
  }

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.hasType(this, 'value', Fraction);
    validator.isOneOf(this, 'unit', ['s', 'ms', 'measures', 'beats', 'atoms', 'wn']);
    return validator;
  }

  /** @ignore */
  toString() {
    return this.value.toFraction() + ' ' + this.unit;
  }

  /** @ignore */
  toJSON() {
    if (this.value.n === 0) return 0;
    if (this.value.d === 1) return [this.value.n * this.value.s, this.unit];
    return [this.value.n * this.value.s, this.value.d, this.unit];
  }

  /** @ignore */
  toXML(rootName) {
    return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'duration'});
  }

  /** @ignore */
  toXMLObject() {
    if (this.unit === '' || this.unit === 'divisions') return {_: this.num / this.denom};
    return {_: this.num / this.denom, '$': {unit: this.unit}};
  }

  /** @ignore */
  toVexFlow() {
    if (this.unit === 'wn') {
      return Duration.wnToVexFlow(this.value);
    }
  }

  /** @ignore */
  static wnToVexFlow(fraction) {
    return wnToVexFlow[fraction.n + '/' + fraction.d];
  }
}

Duration.fromString = function(str, parent) {
  var matches = str.match(/^([0-9\.]+(?:\/[1-9][0-9]*)?)\s*([A-Za-z]*)$/);
  if (matches) {
    return new Duration({value: matches[1], unit: matches[2]}, parent);
  }
};

Duration.coerce = function(source, parent, copy) {
  if (source instanceof Duration) {
    if (copy) return new Duration(source, parent);
    else return source;
  }
  if (typeof source === 'string') return Duration.fromString(source, parent);
  if (isNumber(source)) return new Duration({value: source}, parent);
  if (source instanceof Array && source.length === 2) return new Duration({value: source[0], unit: source[1]}, parent);
  if (source instanceof Array && source.length === 3) return new Duration({value: [source[0], source[1]], unit: source[2]}, parent);
  if (isObject(source)) return new Duration(source, parent);
  throw new Error('Cannot coerce ' + source + ' to a duration!');
};

Duration.fromXML = function(xml) {
  var obj = misc.parseXML(xml, {explicitArray: false, mergeAttrs: true, explicitCharkey: true});
  return Duration.fromXMLObject(obj);
};

Duration.fromXMLObject = function(obj) {
  if (typeof obj === 'string') return new Duration(parseInt(obj), 'divisions');
  return new Duration({num: parseInt(obj._), unit: obj.unit || 'divisions'});
};

Duration.itemType = 'Duration';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(Duration);
