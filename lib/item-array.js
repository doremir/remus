import misc from './misc.js';

const proxy = {
  set: function(target, key, value) {
    if (Number.isInteger(+key)) {
      // console.log('Setting property ' + key);
      if (!(value instanceof target.baseType)) {
        value = target.baseType.coerce(value);
      }
      if (target.parent) value.parent = target.parent;
      target[key] = value;
    } else {
      target[key] = value;
    }
    return true;
  }
};

export default function makeItemArrayClass(baseType) {
  let arrayClass = class ItemArray extends Array {
    constructor() {
      super();
      // console.log('Created an array of ' + baseType.name);
      return new Proxy(this, proxy);
    }

    static of(...elements) {
      return super.from(elements.map(e => baseType.coerce(e)));
    }

    static from(elements) {
      return super.from(elements.map(e => baseType.coerce(e)));
    }

    clone() {
      return this.constructor.from(this.map(e => misc.clone(e)));
    }
  };

  arrayClass.baseType = baseType;
  arrayClass.prototype.baseType = baseType;
  arrayClass.prototype.type = baseType.name + 'Array';

  arrayClass.coerce = function(param) {
    if (param instanceof arrayClass) {
      // console.log('1 Already an array of ' + baseType.name);
      return param;
    } else if (param instanceof baseType) {
      // console.log('A single ' + baseType.name);
      return arrayClass.of(param);
    } else if (Array.isArray(param)) {
      // console.log('A plain array');
      return arrayClass.from(param);
    } else {
      throw new TypeError('Cannot coerce ' + param.toString() + ' to an array of ' + baseType.name);
    }
  };

  return arrayClass;
}
