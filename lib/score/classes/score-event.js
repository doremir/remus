import ScoreItem from './score-item.js';

export default class ScoreEvent extends ScoreItem {
  get fixedWidth() {
    return false;
  }
}

ScoreEvent.itemType = 'ScoreEvent';
