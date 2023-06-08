
import Meta from './meta.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isString = _.isString;
var isObject = _.isObject;

/**
 * StaffAssignment change meta-event.
 *
 */
export default class StaffAssignment extends Meta {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      staff: {
        type: Number,
        default: 0
      },
      staffVoiceOrder: {
        type: Number,
        default: 0
      }
    }, super.getSlots());
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    // validator.isOneOf(this, 'kind', ['g', 'c', 'f']);
    // validator.isInteger(this, 'octave', -2, 2);
    // validator.isOneOf(this, 'beat', [1, 2, 4, 8, 16, 32, 64, 128, 256]);
    return validator;
  }

  /**
   * @ignore
   */
  toString() {
    return '<' + this.staff.number() + '>';
  }
}

// StaffAssignment.coerce = function(source, parent, copy) {
//   if (source instanceof StaffAssignment) {
//     if (copy) return new StaffAssignment(source, parent);
//     else return source;
//   }
//   if (isString(source)) return StaffAssignment.fromString(source, parent);
//   if (isObject(source)) return new StaffAssignment(source, parent);
//   throw new Error('Cannot coerce ' + source + ' to a StaffAssignment!');
// };

// StaffAssignment.fromString = function(str, parent) {
//   let match = str.match(/^(\w+)([\+\-]\d+)?$/);
//   if (match) {
//     let octave = {'+8': 1, '+15': 2, '-8': -1, '-15': -2}[match[2]];
//     if (match[2] && !octave) {
//       throw new Error('Unknown StaffAssignment transposition: ' + match[2]);
//     }
//     return new StaffAssignment({kind: match[1], octave: octave || 0});
//   }
//   throw new Error('Cannot create a StaffAssignment from the string ' + str);
// };

StaffAssignment.itemType = 'StaffAssignment';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(StaffAssignment);
