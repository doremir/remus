
import Pitch from '../pitch';
import Mode from '../mode';
import Meta from './meta';
import Interval from '../interval';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;
var isString = _.isString;

/**
 * Represent a musical key, such as A major, G mixolydian or D hijaz
 */
export default class Key extends Meta {
  /** @ignore */
  static getSlots() {
    return super.getSlots().concat(['root', 'mode', 'level', 'profile']);
  }

  /** @ignore */
  inspect() {
    // var color = chalk.green;
    // if (this.beats.every(function(x) { return x === 1 })) {
    //  return color('<') + color.bold(this.beats.length + '/' + this.denom) + color('>');
    // } else {
    // return color('<') + color.bold(this.root.join('+') + this.mode) + color('>');
    // }
  }

  /** @ignore */
  init() {
    super.init();
    /** @type {Pitch} */
    this.root = this.initSubObject(this.root || 'C', Pitch);
    /** @type {Mode} */
    this.mode = this.initSubObject(this.mode || 'major', Mode);
    /** @type {number} */
    this.level = this.level || 0;
    /** @type {number[]} */
    this.profile = this.profile || null;
    return this;
  }

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.hasType(this, 'root', Pitch);
    validator.hasTypeOrNull(this, 'mode', Mode);
    validator.isInteger(this, 'level', 0);
    validator.isArrayOfIntegers(this, 'profile', true);
    return validator;
  }

  /**
   * Given a diatonic step, return a corresponding pitch
   * NOTE that step is "zero-based" (a unison is 0, a fourth is 3 etc)
   * @return {Pitch}
   */
  step(step) {
    return this.root.interval(this.mode.stepInterval(step));
  }

  /**
   * Given a pitch, return a list of corresponding step and alteration
   * NOTE that step is "zero-based" (a unison is 0, a fourth is 3 etc)
   * Example: Key.fromString('G major').pitchStep(Pitch.fromString('Eb')) => [5, -1]
   * @return {Array}
   */
  pitchStep(pitch, simple = true) {
    // TODO: More efficient implementation
    //       Maybe improve Interval.simple() so that it can return upwards intervals only
    let interval = Interval.between(this.root, pitch).simple();
    if (interval.direction() === 'down') interval = interval.add(Interval.fromString('P8'));
    let diff = Interval.between(this.step(interval.coord[0]), pitch).simple();
    if (diff.direction() === 'down') diff = diff.add(Interval.fromString('P8'));
    return [interval.coord[0], diff.qualityValue()];
  }

  /** @ignore */
  toString() {
    return '<' + this.root.name().toUpperCase() + this.root.accidental() + ' ' + this.mode.getName() + '>';
  }

  /** @ignore */
  localResolve() {
    super.localResolve();
    this.cache.key = this;
    this.cache.modeName = this.mode.getName();
  }
}

Key.coerce = function(source, parent, copy) {
  if (source instanceof Key) {
    if (copy) return new Key(source, parent);
    else return source;
  }
  if (isString(source)) { return Key.fromString(source, parent); }
  if (source instanceof Array && source.length === 2) {
    return new Key({root: source[0], mode: source[1]}, parent);
  }
  if (isObject(source)) return new Key(source, parent);
  throw new Error('Cannot coerce ' + source + ' to a key!');
};

Key.fromString = function(str, parent) {
  var match = str.match(/^(\S+)\s+(\S.*)$/);
  if (match) return new Key({root: match[1], mode: match[2]}, parent);
  throw new Error('Cannot coerce ' + str + ' to a key');
};

Key.itemType = 'Key';

import ItemHandler from '../../item-handler';
ItemHandler.registerItem(Key);
