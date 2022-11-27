import makeItemArrayClass from './item-array.js';
var items = {};
export var ArrayOf = {};

/** @ignore */
export function registerItem(Item) {
  var name = Item.itemType;

  if (!name) {
    throw new Error('Item to register must have an itemType value on the constructor.');
  } else if (items[name]) {
    throw new Error('"' + name + '" is already a registered item name.');
  }

  items[name] = Item;
  let arrayClass = makeItemArrayClass(Item);
  ArrayOf[name] = arrayClass;
  Item.arrayOf = arrayClass;
  items[arrayClass.prototype.type] = arrayClass;
}

/** @ignore */
export function getConstructor(name) {
  var C = items[name];

  if (!C) {
    throw new Error('"' + name + '" isn\'t a registered item type');
  }

  return C;
}

/** @ignore */
export function createItem(name, properties, parent) {
  var C = getConstructor(name);
  return new C(properties, parent);
}

// const proxy = {
//   set: function(target, key, value) {
//     if (Number.isInteger(+key)) {
//       // console.log('Setting property ' + key);
//       if (!(value instanceof target.baseType)) {
//         value = target.baseType.coerce(value);
//       }
//       if (target.parent) value.parent = target.parent;
//       target[key] = value;
//     } else {
//       target[key] = value;
//     }
//     return true;
//   }
// };

// export function makeItemArrayClass(baseType) {
//   let arrayClass = class ItemArray extends Array {
//     constructor() {
//       super();
//       // console.log('Created an array of ' + baseType.name);
//       return new Proxy(this, proxy);
//     }

//     static of(...elements) {
//       return super.from(elements.map(e => baseType.coerce(e)));
//     }

//     static from(elements) {
//       return super.from(elements.map(e => baseType.coerce(e)));
//     }
//   };

//   arrayClass.baseType = baseType;
//   arrayClass.prototype.baseType = baseType;

//   arrayClass.coerce = function(param) {
//     if (param instanceof arrayClass) {
//       // console.log('1 Already an array of ' + baseType.name);
//       return param;
//     } else if (param instanceof baseType) {
//       // console.log('A single ' + baseType.name);
//       return arrayClass.of(param);
//     } else if (Array.isArray(param)) {
//       // console.log('A plain array');
//       return arrayClass.from(param);
//     } else {
//       throw new TypeError('Cannot coerce ' + param.toString() + ' to an array of ' + baseType.name);
//     }
//   };

//   return arrayClass;
// }

export default { registerItem, getConstructor, createItem, ArrayOf };
