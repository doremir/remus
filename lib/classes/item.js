import _ from 'underscore';
import Env from '../env.js';
import misc from '../misc.js';

function checkType(value, type) {
  // console.log('Checking ', value, 'against ', type);
  switch (type) {
    case Boolean: return (value === true || value === false);
    case Number: return (typeof value === 'number') || value instanceof Number;
    case String: return (typeof value === 'string') || value instanceof String;
    default: return value instanceof type;
  }
}

function validateSlot(value, {type, coerce, nullOk, undefinedOk}, keyName = 'slot') {
  if (!type) {
    // console.warn('validateSlot called with null type', value, type, keyName);
    return value;
  }
  if (coerce === true) {
    if (type === Boolean) {
      coerce = x => !!x;
    } else if (type.coerce) {
      coerce = type.coerce;
    } else {
      throw new Error('Don\'t know how to coerce to type ' + type);
    }
  }
  if (type) {
    if (value === null) {
      if (!nullOk) throw new TypeError(keyName + ' mustn\'t be null');
    } else if (value === undefined) {
      if (!undefinedOk) throw new TypeError(keyName + ' must be defined');
    } else {
      if (!checkType(value, type)) {
        if (coerce) {
          value = coerce(value);
        } else {
          throw new TypeError('Bad type for ' + keyName + ', ' + value + ' isn\'t a ' + type);
        }
      }
    }
  }
  return value;
}

const handler = {
  set: function(target, key, value) {
    switch (key) {
      case 'parent': {
        target.env.setParent(value ? value.env : null);
        break;
      }
      case 'extensible':
      case 'shouldResolve': {
        target[key] = value;
        break;
      }
      default: {
        let slotDefinition = target.constructor.slots[key];
        if (slotDefinition !== undefined) {
          value = validateSlot(value, slotDefinition, key);
          if (value && slotDefinition.owned) {
            // console.log('Setting parent of %o to (proxy of) %o', value, target);
            // value.env.setParent(target.env);
            value.parent = target;
          }
        } else if (!target.extensible) {
          throw new Error('Trying to set non-existent slot ' + key + ' in non-extensible ' + target.type);
        }
        target[key] = value;
      }
    }
    return true;
  }
};

/**
 * Item is the base class for all remus objects ("items").
 */
export default class Item {
  constructor(properties = {}, parent, copy) {
    if (!(properties instanceof Object)) {
      throw new Error('Bad parameter ' + properties + ' passed to constructor. Did you mean to call ' + this.type + '.coerce()?');
    }

    let proxy = new Proxy(this, handler);

    this.shouldResolve = true;
    /** @type {Env} */
    let env = new Env(properties.env);
    this.env = env;
    env.setParent(parent ? parent.env : null);
    env.set('currentItem', proxy);

    if (properties.type && properties.type !== this.constructor.name) {
      console.warn('%s constructor was sent object with specified type %s', this.constructor.name, properties.type);
    }

    let slots = this.constructor.slots;
    for (let key in slots) {
      let value = properties[key];
      let slot = slots[key];
      if (copy) value = misc.clone(value);
      if (value === undefined) value = slot.default;
      value = validateSlot(value, slot, key);
      if (value && slot.owned) {
        // value.env.setParent(env); // this doesn't work for ItemArrays because they have no env
        value.parent = this;
      }
      this[key] = value;
    }

    this.init();

    return proxy;
  }

  /** @type {?Item} */
  get parent() {
    var parentEnv = this.env.getParent();
    if (parentEnv) {
      return parentEnv.get('currentItem');
    }
  }

  /** @type {?Item} */
  set parent(parent) {
    if (parent instanceof Item) {
      this.env.setParent(parent.env);
    } else if (!parent) {
      this.env.setParent(null);
    } else {
      throw new Error('Parent must be an instance of the Item class');
    }
  }

  /** @type {string} */
  get type() {
    // A general solution would be to return this.constructor.name
    // which was what we used to do. However, when using rollup,
    // class names may be rewritten to avoid name collisions which
    // causes strange bugs where items end up having types like
    // "Song$2". Instead, we return the itemType which is a
    // hardcoded string that should be present in all Item classes.
    return this.constructor.itemType;
  }

  /** @protected */
  triggerOnChange(name, value) {
    _.each(this.changeListeners, (listener) => {
      listener(name, value);
    });
  }

  /**
   * Add a change handler
   * @param {function} f
   */
  onChange(f) {
    this.changeListeners.push(f);

    return () => {
      this.removeOnChange(f);
    };
  }

  /**
   * Remove a change handler
   * @param {function} f
   */
  removeOnChange(f) {
    this.changeListeners = _.filter(this.changeListeners, (listener) => {
      return listener !== f;
    });
  }

  /**
   * Deep-copy the object
   */
  clone() {
    return new this.constructor(this, this.parent, true);
  }

  static get slots() {
    return this.getSlots();
  }

  /**
   * @protected
   * @return {Object[]}
   */
  static getSlots() {
    return {
      id: {
        undefinedOk: true,
        nullOk: true
      },
      enabled: {
        type: Boolean,
        default: true
      },
      clientSpecific: {
        type: Object,
        undefinedOk: true
      }
    };
  }

  /**
   * @protected
   * @return {Item}
   */
  init() {
    this.cache = {};
    this.changeListeners = [];

    return this;
  }

  /**
   * @protected
   * @param obj
   * @param {?Item} [DefaultClass]
   * @param [def]
   * @return {Item}
   */
  initSubObject(obj, DefaultClass, def) {
    return misc.initSubObject(this, obj, DefaultClass, def);
  }

  /**
   * @protected
   * @param obj
   * @param {?Item} [DefaultClass]
   * @param [def]
   * @return {Item}
   */
  initSubObjects(obj, DefaultClass, def) {
    return misc.initSubObjects(this, obj, DefaultClass, def);
  }

  /** @ignore */
  toJSON() {
    var obj = _.pick(this, ['type'].concat(Object.keys(this.constructor.slots)));
    obj.env = null;
    if (obj.enabled === true) obj.enabled = undefined;

    _.each(obj, (val, key) => {
      if (val === undefined || val === null) {
        delete obj[key];
      }
    });

    if (this.cache && !_.isEmpty(Item.serializeCache)) {
      obj.cache = _.pick(this.cache, Item.serializeCache);
    }

    obj = _.mapObject(obj, (value, key) => {
      if (_.isObject(value) && value.toJSON) {
        return value.toJSON();
      } else {
        return value;
      }
    });

    return obj;
  }

  enableAutoResolver() {
    if (!this.autoResolveChangeListener) {
      this.autoResolveChangeListener = this.onChange(() => {
        this.resolve();
      });

      this.resolve();
    }
  }

  disableAutoResolver() {
    if (this.autoResolveChangeListener) {
      this.autoResolveChangeListener();
    }
  }

  /** @ignore */
  resolve(force = false) {
    this.localResolve();
    return false;
  }

  /** @ignore */
  localResolve() {
  }
}

Item.prototype.inheritExplitDuration = true;

