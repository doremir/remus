
import VerticalContainer from './vertical-container.js';
import Note from './note.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;

/**
 * A group of {@link Note}s, occurring at the same time.
 *
 * All Notes in a NoteChord usually share properties such as duration,
 * while other such as pitch and velocity differ.
 *
 *
 */
export default class NoteChord extends VerticalContainer {
  // inspect(level, options) {
  //   var color = chalk.green;
  //   return color('<') + color.bold('NoteChord') + color(': [') + this.events.join(', ') + color(']>');
  // }

  get defaultEventItemType() {
    return 'Note';
  }

  toString() {
    return '[NoteChord]';
  }

  doValidate() {
    var validator = super.doValidate();
    validator.isArray(this, 'events', function(obj) { return obj instanceof Note; });
    return validator;
  }
}

NoteChord.coerce = function(source, parent, copy) {
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
