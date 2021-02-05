
import Meta from './meta.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isNumber = _.isNumber;
var isObject = _.isObject;
import Fraction from 'fraction.js';

/**
 * Tempo change meta-event.
 *
 * Tempo is expressed in `bpm` and `beat`, where `bpm` is a number
 * and `beat` is a wn Fraction. `beat` is coerced to a Fraction when
 * the item is created, but not if the slot is assigned at a later point.
 */
export default class Tempo extends Meta {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['bpm', 'beat']);
  }

  /**
   * @ignore
   */
  inspect() {
    // var color = chalk.green;
    // return color('<') + color.bold(this.bpm.toString()) + color(' bpm>');
  }

  /**
   * @ignore
   */
  init() {
    super.init();

    /** @type {Fraction} */
    this.bpm = this.bpm || new Fraction(120);
    /** @type {Fraction} */
    this.beat = this.beat ? new Fraction(this.beat) : new Fraction(1, 4);

    // Temporary fix to prevent invalid remus output from JSON.stringify
    this.beat.toJSON = function() { return this.toFraction(); };
    return this;
  }

  /**
   * Return number of seconds per whole note for this tempo.
   * @return {Fraction}
   */
  sPerWn() {
    // return 60 / (this.bpm * this.beat);
    return (new Fraction(60)).div(this.beat.mul(this.bpm));
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    // validator.isOneOf(this, 'beat', [1, 2, 4, 8, 16, 32, 64, 128, 256]);
    return validator;
  }

  /**
   * @ignore
   */
  toString() {
    return '<' + this.bpm.toString() + 'bpm>';
  }
}

Tempo.coerce = function(source, parent, copy) {
  if (source instanceof Tempo) {
    if (copy) return new Tempo(source, parent);
    else return source;
  }
  if (isNumber(source)) return new Tempo({bpm: source}, parent);
  if (isObject(source)) return new Tempo(source, parent);
  throw new Error('Cannot coerce ' + source + ' to a tempo!');
};

Tempo.itemType = 'Tempo';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Tempo);
