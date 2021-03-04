
import _ from 'underscore';
import Item from './item.js';
import misc from '../misc.js';
// import chalk from 'chalk';

export default class AudioFile extends Item {
  /** @ignore */
  static getSlots() {
    return super.getSlots().concat(['externalId', 'frames', 'channels', 'sampleRate', 'externalUrl', 'fileType']);
  }

  // inspect() {
  //   return chalk.magenta('<') + chalk.magenta.bold(this.pitch.toString()) + chalk.magenta('>');
  // },

  /** @ignore */
  init() {
    super.init();
    /** @type {Number} */
    this.frames = misc.parseIntOr(this.frames, 0);
    /** @type {Number} */
    this.channels = misc.parseIntOr(this.channels, null);
    /** @type {Number} */
    this.sampleRate = misc.parseFloatOr(this.sampleRate, null);
    return this;
  }

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
