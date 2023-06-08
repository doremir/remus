import Item from '../item.js';

/**
 *  Non-musical graphical items such as page texts
 */
export default class PageItem extends Item {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      pages: {
        default: 1
      },
      originX: {
        type: String,
        default: 'leftMargin',
        nullOk: false
      },
      originY: {
        type: String,
        default: 'topMargin',
        nullOk: false
      },
      adjustX: {
        type: String,
        default: 'left',
        nullOk: false
      },
      adjustY: {
        type: String,
        default: 'baseline',
        nullOk: false
      },
      x: {
        type: Number,
        nullOk: false
      },
      y: {
        type: Number,
        nullOk: false
      },
      movable: {
        type: Boolean,
        default: true,
        nullOk: false
      },
      avoidCollisions: {
        type: String,
        default: null,
        nullOk: true
      },
      tag: {
        nullOk: true,
        undefinedOk: true
      }
    }, super.getSlots());
  }
}

PageItem.coerce = function(source, parent, copy) {
  if (source instanceof PageItem) {
    if (copy) {
      return new PageItem(source, parent);
    } else {
      return source;
    }
  }
  throw new Error('Cannot coerce ' + source + ' to a page item!');
};

PageItem.itemType = 'PageItem';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(PageItem);
