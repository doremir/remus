
import _ from 'underscore';
import { ArrayOf } from '../../item-handler.js';
// import chalk from 'chalk';
import VerticalContainer from './vertical-container.js';
import envDefaults from '../../defaults.js';

/**
 * A piece of music.
 */
export default class Song extends VerticalContainer {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      items: {
        type: ArrayOf.Item,
        default: [],
        owned: true
      },
      title: {
        type: String,
        nullOk: true,
        default: null
      },
      remusVersion: {
        type: Number,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
  }

  /** @ignore */
  constructor(properties, parent) {
    if (parent) {
      console.warn('Song should not have a parent');
    }
    properties = _.clone(properties);
    properties.env = _.extend({}, envDefaults, properties.env);
    super(properties, parent);

    this.env.set('root', this);
    this.env.set('song', this);
  }

  // set parent(parent) {
  //   console.warn('Song should not have a parent'); // Just warn, this could change in the future
  //   super(parent); // Hmm, this doesn't work, cannot call super in a setter...
  // }

  childItems(selector) {
    var selectorFunction = null;

    if (_.isFunction(selector)) {
      selectorFunction = selector;
    } else if (_.isString(selector)) {
      selectorFunction = (item) => {
        return item.type === selector;
      };
    } else {
      selectorFunction = v => true;
    }

    return _.filter(this.items, selectorFunction);
  }

  findItems(selector) {
    return this.childItems(selector);
  }

  // inspect(indent, options) {
  //   var color = chalk.blue;
  //   var lines = [];
  //   Object.keys(this).forEach(function(key) {
  //     lines.push(key + ': ' + util.inspect(this[key], options));
  //   });
  //   return color.bold('Song ') + color('{\n') + lines.join(',\n') + color(' }');
  // },

  /** @ignore */
  toString() {
    return '[Song]';
  }

  /** @ignore */
  toJSON() {
    var obj = super.toJSON();

    obj.items = _.map(this.items, (item) => {
      if (_.isObject(item) && item.toJSON) {
        return item.toJSON();
      } else {
        return item;
      }
    });

    return obj;
  }

  /** @ignore */
  resolve(force = false) {
    super.resolve(force);
  }
}

Song.coerce = function(source, parent, copy) {
  if (source instanceof Song) return copy ? new Song(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a song!');
};

Song.itemType = 'Song';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Song);
