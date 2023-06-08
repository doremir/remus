
import EventContainer from './event-container.js';

/**
 * A tuplet
 *
 * A thin wrapper around the generic {@link EventContainer}.
 *
 */
export default class Tuplet extends EventContainer {
}

Tuplet.coerce = function(source, parent, copy) {
  if (source instanceof Tuplet) return copy ? new Tuplet(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a tuplet!');
};

Tuplet.itemType = 'Tuplet';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(Tuplet);

Tuplet.prototype.inheritExplitDuration = false;
