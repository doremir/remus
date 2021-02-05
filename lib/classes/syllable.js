
import Item from './item';
import misc from '../misc';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;
var isString = _.isString;

/**
 * TODO: documentation
 */
export default class Syllable extends Item {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['text', 'hyphen', 'extender']);
  }

  /**
   * @ignore
   */
  init() {
    super.init();

    /** @type {string} */
    this.text = this.text || '';
    /** @type {boolean} */
    this.hyphen = this.hyphen || false;
    /** @type {boolean} */
    this.extender = this.extender || false;
    return this;
  }

  /**
   * @ignore
   */
  toString() {
    let text = this.text;
    if (this.hyphen) text += '-';
    return 'Syllable: ' + text;
  }

  /**
   * @ignore
   */
  toXML(rootName) {
    return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'syllable'});
  }

  /**
   * @ignore
   */
  toXMLObject() {
    let obj = {text: this.text};
    if (this.hyphen) obj.hyphen = this.hyphen;
    if (this.extender) obj.extender = this.extender;
    return obj;
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    // validator.isString(this, 'text')
    validator.isBoolean(this, 'hyphen');
    validator.isBoolean(this, 'extender');
    return validator;
  }

  /**
  * @ignore
  */
  toJSON() {
    var obj = super.toJSON();
    if (!obj.hyphen) delete obj.hyphen;
    if (!obj.extender) delete obj.extender;
    return obj;
  }
}

Syllable.fromString = function(text, parent) {
  let hyphen = false;
  if (text.substr(-1) === '-') {
    text = text.slice(0, -1);
    hyphen = true;
  }
  return new Syllable({text: text, hyphen: hyphen}, parent);
};

Syllable.coerce = function(source, parent, copy) {
  if (source instanceof Syllable) {
    if (copy) {
      return new Syllable(source, parent);
    } else {
      return source;
    }
  }
  if (isString(source)) {
    return Syllable.fromString(source, parent);
  }
  if (isObject(source)) { return new Syllable(source, parent); }
  throw new Error('Cannot coerce ' + source + ' to a syllable!');
};

Syllable.itemType = 'Syllable';

import ItemHandler from '../item-handler';
ItemHandler.registerItem(Syllable);
