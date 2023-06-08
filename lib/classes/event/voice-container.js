
import VerticalContainer from './vertical-container.js';
// import chalk from 'chalk';

/**
 * Grouping of {@link Voice}s, {@link Audio} events and {@link ChordSequence}s that belong together,
 * e.g. because they represent the same musical fragment.
 */
export default class VoiceContainer extends VerticalContainer {

  toString() {
    return '[VoiceContainer]';
  }
}

VoiceContainer.defaultEventItemType = 'Voice';

VoiceContainer.coerce = function(source, parent, copy) {
  if (source instanceof VoiceContainer) return copy ? new VoiceContainer(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a VoiceContainer!');
};

VoiceContainer.itemType = 'VoiceContainer';

import ItemHandler from '../../item-handler.js';
ItemHandler.registerItem(VoiceContainer);
