
import Event from './event.js';
import Duration from '../duration.js';
import misc from '../../misc.js';
// import chalk from 'chalk';
import _ from 'underscore';
var isObject = _.isObject;

/**
 * A Note with no sound
 */
export default class Rest extends Event {
  // inspect() {
  //   return chalk.magenta('<') + chalk.magenta.bold(this.pitch.toString()) + chalk.magenta('>');
  // }

  init() {
    super.init();
    return this;
  }

  toString() {
    return 'Rest';
  }

  toXML(rootName) {
    return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'rest'});
  }

  toXMLObject() {
    return {duration: this.duration.toXMLObject()};
  }

  doValidate() {
    var validator = super.doValidate();
    // validator.hasType(this, 'pitch', Pitch);
    return validator;
  }
}

Rest.coerce = function(source, env, copy) {
  if (source instanceof Rest) {
    if (copy || (source.env !== env)) return new Rest(source, env);
    else return source;
  }
  if (isObject(source)) { return new Rest(source, env); }
  throw new Error('Cannot coerce ' + source + ' to a rest!');
};

Rest.fromXML = function(xml, o) {
  var obj = misc.parseXML(xml, {explicitArray: false, mergeAttrs: true, explicitCharkey: false});
  return Rest.fromXMLObject(obj);
};

Rest.fromXMLObject = function(obj) {
  // var pitch = Pitch.fromXMLObject(obj.pitch);
  var duration = Duration.fromXMLObject(obj.duration);
  return new Rest(duration);
};

Rest.itemType = 'Rest';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Rest);
