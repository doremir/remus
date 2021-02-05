
import Event from '../event/event.js';
// import Duration from '../duration';
// import _ from 'underscore';
// import Fraction from 'fraction.js';

/**
 * Base class for all Metas.
 */
export default class Meta extends Event {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots();
  }

  /**
   * @ignore
   */
  init() {
    super.init();
    return this;
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    return validator;
  }
}

