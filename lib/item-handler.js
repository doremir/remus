
var items = {};

export function registerItem(Item) {
  var name = Item.itemType;

  if (!name) {
    throw new Error('Item to register must have an itemType value on the constructor.');
  } else if (items[name]) {
    throw new Error('"' + name + '" is already a registered item name.');
  }

  items[name] = Item;
}

export function getConstructor(name) {
  var C = items[name];

  if (!C) {
    throw new Error('"' + name + '" isn\'t a registered item type');
  }

  return C;
}

export function createItem(name, properties, parent) {
  var C = getConstructor(name);
  return new C(properties, parent);
}

export default { registerItem, getConstructor, createItem };
