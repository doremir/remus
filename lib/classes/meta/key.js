
import Pitch from '../pitch.js';
import Mode from '../mode.js';
import Meta from './meta.js';
import Interval from '../interval.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;
var isString = _.isString;

/**
 * Represent a musical key, such as A major, G mixolydian or D hijaz
 * Global key changes (usually visible) have level = 0.
 * Local key changes (usually not visible) have level > 0.
 */
export default class Key extends Meta {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      root: {
        type: Pitch,
        coerce: true,
        owned: true
      },
      mode: {
        type: Mode,
        coerce: true,
        owned: true
      },
      level: {
        type: Number,
        default: 0
      }
    }, super.getSlots());
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

  /**
   * Given a MIDI note number, return a {Pitch} with a reasonable "spelling"
   * according to the key.
   * @param midiNoteNumber (integer)
   * @return {Pitch}
   */
  defaultPitchFromMIDI(midiNoteNumber) {
    let rootNoteNumber = this.root.toMIDI();
    let chroma = (((midiNoteNumber - rootNoteNumber) % 12) + 12) % 12;
    let octave = Math.floor((midiNoteNumber - rootNoteNumber) / 12);
    let mode = this.mode;
    let scale = mode.scale || knowledge.scales[mode.name];
    let step = scale.indexOf(chroma);
    let rootCoord = this.root.toCoord();
    if (step >= 0) return new Pitch({coord: [rootCoord[0] + step + octave * 7, midiNoteNumber]});
    return new Pitch.fromMIDI(midiNoteNumber);
  }

  /** @ignore */
  toJSON() {
    let obj = super.toJSON();
    obj.mode = this.mode.getName();
    obj.root = this.root.toTonic();
    return obj;
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
    this.cache.simpleMode = this.simpleMode();
  }

  /**
   * Return "minor" or "major" based on the identified mode
   * and the key profile. Note that this function always returns
   * a string, so if no mode is identified, "major" is returned.
   * @return {string}
   */
  simpleMode() {
    let simpleModeName = this.mode.simple();
    // console.log(simpleModeName);
    if (simpleModeName) return simpleModeName;
    let rootChroma = this.root.chroma() + 3;  // key profile has A=0 instead of C=0
    let minor = (rootChroma + 3) % 12;
    let major = (rootChroma + 4) % 12;
    // console.log(rootChroma, minor, major, this.profile);
    if (this.profile) {
      return (this.profile[minor] > this.profile[major]) ? 'minor' : 'major';
    }
    return 'major';
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

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Key);
