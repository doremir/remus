
import EventContainer from './event-container';

/**
 * A tuplet
 *
 * A thin wrapper around the generic {@link EventContainer}.
 *
 */
export default class Tuplet extends EventContainer {

  /** @ignore */
  inspect() {
    // var color = chalk.yellow;
    // return color.bold('Tuplet') + color(' [') + this.getEvents().join(', ') + color(']');
  }
}

Tuplet.coerce = function(source, parent, copy) {
  if (source instanceof Tuplet) return copy ? new Tuplet(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a tuplet!');
};

Tuplet.itemType = 'Tuplet';

import ItemHandler from '../../item-handler';
ItemHandler.registerItem(Tuplet);

Tuplet.prototype.inheritExplitDuration = false;
