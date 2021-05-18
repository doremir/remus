import _ from 'underscore';
import Env from '../env.js';
import misc from '../misc.js';
import Validator from '../validator.js';
// import Fraction from 'fraction.js';

/**
 * Item is the base class for all remus objects ("items").
 */
export default class Item {
  constructor(properties, parent) {
    var slots = {};
    if (!properties) properties = {};

    _.each(_.unique(this.constructor.getSlots()), (key) => {
      slots[key] = properties[key];

      Object.defineProperty(this, key, {
        get: () => { return slots[key]; },
        set: (v) => {
          slots[key] = v;
          this.shouldResolve = true;
          this.triggerOnChange(key, v);
        }
      });
    });

    // For debugging: warn for unknown keys
    if (!(properties instanceof Item)) {      // ... but not when using a "live" object as input
      let s = this.constructor.getSlots().concat('type', 'env', 'metas', 'events'); // TODO: don't hardcode metas and events
      for (let key in properties) {                                     // (why aren't they slots in the first place??)
        if (properties.hasOwnProperty(key) && key !== 'cache' && s.indexOf(key) < 0) {  // explicitly ignore cache
          console.warn('Unknown slot ' + key + ' in item ', properties);                // TODO: Fix the actual problem
        }
      }
    }

    this.shouldResolve = true;
    /** @type {Env} */
    this.env = new Env(properties.env);
    this.env.setParent(parent ? parent.env : null);
    this.env.set('currentItem', this);

    this.init();
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
    var obj = new this.constructor({}, this.parent);
    _.each(_.unique(this.constructor.getSlots()), (key) => {
      if (key !== 'env') {
        obj[key] = misc.clone(this[key]);
      }
    });
    return obj;
  }

  /**
   * @protected
   * @return {string[]}
   */
  static getSlots() {
    return ['id', 'env', 'enabled', 'className'];
  }

  /**
   * @protected
   * @return {Item}
   */
  init() {
    if (this.enabled === undefined) this.enabled = true;

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
    var obj = _.pick(this, this.constructor.getSlots().concat(['type']));
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

  /**
   * Perform validation. Override in subclasses to add additional checks.
   *
   * **Note:** Must return a Validator object!
   * @protected
   * @return {Validator}
   * @example
   * // In an Item subclass
   * doValidate() {
   *   var validator = super.doValidate();
   *   validator.isNumber(this, 'someNumericSlot')
   *   validator.isArrayOfIntegers(this, 'beats');
   *   validator.isOneOf(this, 'denom', [1, 2, 4, 8, 16, 32, 64, 128, 256]);
   *   return validator;
   * }
   */
  doValidate() {
    var validator = new Validator();
    validator.isDefined(this, 'type');
    validator.hasType(this, 'env', Env);
    return validator;
  }

  /**
   * Check for data consistency
   * @param {?boolean} log - Write validation errors to the console
   * @return {boolean}
   */
  validate(log = true) {
    var validator = this.doValidate();
    if (log) validator.log();
    return validator.errors.length === 0;
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
