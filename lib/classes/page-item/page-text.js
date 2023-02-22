import PageItem from './page-item.js';

/**
 *  Page text
 */
export default class PageText extends PageItem {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      text: {
        type: String,
        nullOk: false,
        undefinedOk: false
      },
      style: {
        type: Object,
        nullOk: true,
        default: null,
        undefinedOk: false
      },
      boxWidth: {
        type: Number,
        nullOk: true,
        default: null,
        undefinedOk: false
      },
      boxHeight: {
        type: Number,
        nullOk: true,
        default: null,
        undefinedOk: false
      },
      styles: {
        type: Array,
        nullOk: true,
        default: null
      },
      paragraphStyles: {
        type: Array,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
  }

  /** @ignore */
  inspect() {
    // return chalk.red('<') + chalk.red.bold(this.toString()) + chalk.red('>');
  }

}

PageText.coerce = function(source, parent, copy) {
  if (source instanceof PageText) {
    if (copy) {
      return new PageText(source, parent);
    } else {
      return source;
    }
  }
  throw new Error('Cannot coerce ' + source + ' to a page text!');
};

PageText.itemType = 'PageText';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(PageText);
