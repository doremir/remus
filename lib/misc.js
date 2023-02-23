
import _ from 'underscore';
import xml2js from 'xml2js';
import ItemHandler from './item-handler.js';
// import Item from './classes/item';
import Fraction from 'fraction.js';

export default {
  dashToCamel: function(str) {
    return str.replace(/-([a-z])/gi, function(s, group1) {
      return group1.toUpperCase();
    });
  },

  parseXML: function(xml, settings) {
    settings = settings || {};
    if (!settings.hasOwnProperty('tagNameProcessors')) settings.tagNameProcessors = [this.dashToCamel];
    if (!settings.hasOwnProperty('explicitRoot')) settings.explicitRoot = false;
    settings.async = false;
    var parser = xml2js.Parser(settings);
    var result, error;
    parser.parseString(xml, function(err, res) {
      result = res;
      error = err;
    });
    if (error) throw new Error(error);
    return result;
  },

  buildXML: function(obj, settings) {
    settings = settings || {};
    if (!settings.hasOwnProperty('headless')) settings.headless = true;
    var builder = new xml2js.Builder(settings);
    return builder.buildObject(obj);
  },

  extendObject: function(proto, obj) {
    var o = Object.create(proto);
    if (obj) {
      Object.keys(obj).forEach(function(p) {
        o[p] = obj[p];
      });
    }
    return o;
  },

  parseIntOr: function(value, def) {
    let i = parseInt(value);
    return isNaN(i) ? def : value;
  },

  parseFloatOr: function(value, def) {
    let f = parseFloat(value);
    return isNaN(f) ? def : value;
  },

  // extendClass: function(subClass, baseClass, slots, properties) {
  //   subClass.prototype = this.extendObject(baseClass.prototype, properties);
  //   subClass.prototype.constructor = subClass;
  //   //subClass.prototype.super = baseClass.prototype;
  //   subClass.prototype.className = subClass.name;
  //   Object.defineProperty(subClass.prototype, 'slots', {
  //     value: baseClass.prototype.slots.concat(slots),
  //     enumerable: false,
  //     configurable: false
  //   });
  // },

  initSubObject: function(parent, obj, DefaultClass, def) {
    if (!parent) {
      throw new Error('parent is undefined in initSubObject');
    }

    // Undefined => use given default
    if (obj === undefined) return def;

    // Keep null
    if (obj === null) return null;

    // Already an Item
    if (obj.getSlots) { // (instanceof Item) {
      obj.parent = parent;
      return obj;
    }

    // Explicit Item, just not yet initialized
    if (_.isObject(obj) && obj.type) {
      return ItemHandler.createItem(obj.type, obj, parent);
    }

    // If DefaultClass is a name of the object type, like "Pitch", find
    // the constructor before using it below.
    if (_.isString(DefaultClass)) {
      DefaultClass = ItemHandler.getConstructor(DefaultClass);
    }

    // Other object, and there is a default class
    if (DefaultClass && !(obj instanceof DefaultClass)) {
      if (obj === undefined) {
        obj = def;
      }
      return DefaultClass.coerce(obj, parent);
    }

    if (!(typeof obj === "object") && !DefaultClass) {
      throw new Error('initSubObject: non-object found (' + obj + ' [' + (typeof obj) + ']) and no DefaultClass');
    }

    // Other cases, just return the object unchanged
    return obj;
  },

  initSubObjects: function(parent, objArray, DefaultClass, def) {
    if (!parent) {
      throw new Error('parent is undefined in initSubObjects');
    }

    if (objArray && !_.isArray(objArray)) {
      throw new Error('initSubObjects called with non-array');
    }

    return _.filter(_.map(objArray, (item) => {
      return this.initSubObject(parent, item, DefaultClass, def); // TODO: clone def?
    }), _.identity);
  },

  mod: function(num, mod) {
    var remain = num % mod;
    return Math.floor(remain >= 0 ? remain : remain + mod);
  },

  sumArray: function(arr) {
    var total = 0;
    for (var i = 0, n = arr.length; i < n; ++i) {
      total += arr[i];
    }
    return total;
  },

  clone: function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (obj == null || typeof obj !== 'object') return obj;

    // Handle Item
    // (Test for presence of the clone function and the getSlots function,
    // we cannot use instanceof Item because it would require a circular dependency
    // to the Item class)
    if (obj.clone && obj.resolve) {
      return obj.clone();
    }

    // Any other object that supports clone()
    if (obj.clone instanceof Function) {
      return obj.clone();
    }

    // Fractions
    if (obj instanceof Fraction) {
      return new Fraction(obj);
    }

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }

    // Handle generic objects
    // TODO: loops on recursive structures!
    if (obj instanceof Object) {
      if (Object.getPrototypeOf(obj).constructor.name !== 'Object') {
        console.warn('Don\'t know how to clone ' + Object.getPrototypeOf(obj).constructor.name + ' objects');
      }
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  },

  allRotations: function(array) {
    let result = [array.slice()];
    let count = array.length;
    for (let i = 1; i < count; i++) {
      result.push(array.slice(i - count).concat(array.slice(0, i)));
    }
    return result;
  },

  isInteger: function(x) {
    return _.isNumber(x) && ((x % 1) === 0);
  }
};

