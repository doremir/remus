import ScoreItem from './score-item';

export default class ScoreDetail extends ScoreItem {
  constructor(item, score, params) {
    super(item, score, params);
    this.owner = this.owner || null;
  }
}
