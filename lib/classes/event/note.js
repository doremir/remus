
import Event from './event.js';
import Pitch from '../pitch.js';
import Duration from '../duration.js';
import misc from '../../misc.js';
// import chalk from 'chalk.js';
import _ from 'underscore';
var isObject = _.isObject;
var isString = _.isString;

/**
 * A Note is essentially an event with a pitch.
 */
export default class Note extends Event {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['pitch', 'sonority', 'category', 'velocity', 'harmonyRelation']);
  }

  // inspect() {
  //   return chalk.magenta('<') + chalk.magenta.bold(this.pitch.toString()) + chalk.magenta('>');
  // }

  /**
   * @ignore
   */
  init() {
    super.init();

    /** @type {Pitch} */
    this.pitch = this.initSubObject(this.pitch, Pitch);
    /** @type {string} */
    this.sonority = this.sonority || this.defaultSonority;
    return this;
  }

  /**
   * Destructively transpose the pitch of the note
   * @param {Interval} interval
   */
  transpose(interval) {
    this.pitch.transpose(interval);
    return this;
  }

  /**
   * @ignore
   */
  toString() {
    return 'Note: ' + this.pitch.toString();
  }

  /**
   * @ignore
   */
  toXML(rootName) {
    return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'note'});
  }

  /**
   * @ignore
   */
  toXMLObject() {
    return {pitch: this.pitch.toXMLObject(), duration: this.duration.toXMLObject()};
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    validator.hasTypeOrNull(this, 'pitch', Pitch);
    validator.isOneOf(this, 'sonority', ['tonal', 'nonPitched']);
    return validator;
  }

  /** @ignore */
  resolveEvents() {
    super.resolveEvents();
    if (this.pitch) {
      this.cache.pitch = {
        midi: this.pitch.toMIDI(),
        scientific: this.pitch.scientific()
      };
    } else {
      this.cache.pitch = {};
    }
  }

  /**
  * @ignore
  */
  get defaultSonority() {
    return 'tonal';
  }

  /**
  * @ignore
  */
  toJSON() {
    var obj = super.toJSON();
    if (obj.sonority === this.defaultSonority) delete obj.sonority;
    return obj;
  }
}

Note.coerce = function(source, parent, copy) {
  if (source instanceof Note) {
    if (copy) {
      return new Note(source, parent);
    } else {
      return source;
    }
  }
  if (source instanceof Pitch) { return new Note({pitch: source}, parent); }
  if (isString(source)) {
    return new Note({pitch: Pitch.fromString(source)}, parent);
  }
  if (isObject(source)) { return new Note(source, parent); }
  throw new Error('Cannot coerce ' + source + ' to a note!');
};

Note.fromXML = function(xml, o) {
  var obj = misc.parseXML(xml, {explicitArray: false, mergeAttrs: true, explicitCharkey: false});
  return Note.fromXMLObject(obj);
};

Note.fromXMLObject = function(obj) {
  var pitch = Pitch.fromXMLObject(obj.pitch);
  var duration = Duration.fromXMLObject(obj.duration);
  return new Note(pitch, duration);
};

Note.itemType = 'Note';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Note);
