import ScoreItem from './score-item';

export default class ScoreEvent extends ScoreItem {
  get fixedWidth() {
    return false;
  }
}
