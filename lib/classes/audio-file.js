
import _ from 'underscore';
import Item from './item.js';
import misc from '../misc.js';
// import chalk from 'chalk';

export default class AudioFile extends Item {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      externalId: {
        type: Array,
        default: [1, 1, 1, 1]
      },
      frames: {
        type: Number,
        nullOk: true,
        default: null
      },
      channels: {
        type: Number,
        nullOk: true,
        default: null
      },
      sampleRate: {
        type: Number,
        nullOk: true,
        default: null
      },
      externalUrl: {
        type: String,
        nullOk: true,
        default: null
      },
      fileType: {
        type: String,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
  }

  // inspect() {
  //   return chalk.magenta('<') + chalk.magenta.bold(this.pitch.toString()) + chalk.magenta('>');
  // },

  /** @ignore */
  doValidate() {
    var validator = super.doValidate();
    validator.isInteger(this, 'frames', 1, null);
    validator.isInteger(this, 'channels', 1, 8);
    validator.isNumber(this, 'sampleRate', 22050, 192000);
    return validator;
  }
}

AudioFile.coerce = function(source, parent, copy) {
  if (source instanceof AudioFile) {
    if (copy) return new AudioFile(source, parent);
    else return source;
  }
  if (_.isObject(source)) {
    return new AudioFile(source, parent);
  }
  throw new Error('Cannot coerce ' + source + ' to an audio file!');
};

AudioFile.itemType = 'AudioFile';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(AudioFile);
