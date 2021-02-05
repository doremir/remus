
import _ from 'underscore';
import Item from './item';
import misc from '../misc';
// import chalk from 'chalk';

export default class AudioFile extends Item {
  static getSlots() {
    return super.getSlots().concat(['externalId', 'frames', 'channels', 'sampleRate', 'externalUrl', 'fileType']);
  }

  // inspect() {
  //   return chalk.magenta('<') + chalk.magenta.bold(this.pitch.toString()) + chalk.magenta('>');
  // },

  init() {
    super.init();
    this.frames = misc.parseIntOr(this.frames, 0);
    this.channels = misc.parseIntOr(this.channels, null);
    this.sampleRate = misc.parseFloatOr(this.sampleRate, null);
    return this;
  }

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

import ItemHandler from '../item-handler';
ItemHandler.registerItem(AudioFile);
