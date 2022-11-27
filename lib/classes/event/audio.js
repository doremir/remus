
import _ from 'underscore';
import Event from './event.js';
import Duration from '../duration.js';

/**
 * An audio event, playing back audio from e.g. an audio file
 */
export default class Audio extends Event {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      file: {
        type: Array,
        default: [1, 1, 1, 1]
      },
      trimLeft: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      trimRight: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      }
    }, super.getSlots());
  }

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.hasTypeOrNull(this, 'trimLeft', Duration);
    validator.hasTypeOrNull(this, 'trimRight', Duration);
    validator.hasTypeOrNull(this, 'file', Duration);
    return validator;
  }
}

Audio.coerce = function(source, parent, copy) {
  if (source instanceof Audio) {
    if (copy) {
      return new Audio(source, parent);
    } else {
      return source;
    }
  }
  if (_.isObject(source)) {
    return new Audio(source, parent);
  }
  throw new Error('Cannot coerce ' + source + ' to an audio object!');
};

Audio.itemType = 'Audio';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Audio);
