
import VerticalContainer from './vertical-container.js';
import Note from './note.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;

/**
 * A group of {@link Note}s, occurring at the same time.
 *
 * All Notes in a NoteChord usually share properties such as duration,
 * while other such as pitch and velocity may differ.
 *
 *
 */
export default class NoteChord extends VerticalContainer {

  static getSlots() {
    return Object.assign({
      tiedFrom: false,
      tiedTo: false,
    }, super.getSlots());
  }

  /** @ignore */
  toString() {
    return '[NoteChord]';
  }

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.isArray(this, 'events', function (obj) { return obj instanceof Note; });
    return validator;
  }
}

NoteChord.defaultEventItemType = 'Note';

NoteChord.coerce = function (source, parent, copy) {
  if (source instanceof NoteChord) {
    return copy ? new NoteChord(source, parent) : source;
  }
  if (isObject(source)) {
    return new NoteChord(source, parent);
  }
  throw new Error('Cannot coerce ' + source + ' to a NoteChord!');
};

NoteChord.itemType = 'NoteChord';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(NoteChord);
