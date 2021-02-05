
import _ from 'underscore';
import Event from './event.js';
import Duration from '../duration.js';

/**
 * An audio event, playing back audio from e.g. an audio file
 */
export default class Audio extends Event {
  /** @ignore */
  static getSlots() {
    return super.getSlots().concat(['file', 'trimLeft', 'trimRight']);
  }

  /** @ignore */
  init() {
    super.init();
    this.trimLeft = this.initSubObject(this.trimLeft, Duration);
    this.trimRight = this.initSubObject(this.trimRight, Duration);
    return this;
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
