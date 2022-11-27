
// import chalk from 'chalk';
import EventContainer from './event-container.js';

/**
 * Generic container for stacked events
 *
 * VerticalContainer inherits from {@link EventContainer}, and overrides
 * `defaultEventTimeMode` to `absolute`. The two classes are otherwise identical.
 *
 * See {@link EventContainer} for more information about relative and absolute time modes.
 */
export default class VerticalContainer extends EventContainer {
  /** @ignore */
  inspect(level, options) {
    // var color = chalk.yellow;
    // return color('<') + color.bold('VerticalContainer') + color(': [') + this.events.join(', ') + color(']>');
    // return color('VerticalContainer\n') + util.inspect(this.getEvents(), options);
  }

  /** @ignore */
  toString() {
    return '[VerticalContainer]';
  }
}

VerticalContainer.coerce = function(source, parent, copy) {
  if (source instanceof VerticalContainer) return copy ? new VerticalContainer(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a VerticalContainer!');
};

VerticalContainer.itemType = 'VerticalContainer';

import ItemHandler from '../../item-handler.js';
VerticalContainer.defaultEventTimeMode = 'absolute';
VerticalContainer.defaultMetaTimeMode = 'relative';

ItemHandler.registerItem(VerticalContainer);
