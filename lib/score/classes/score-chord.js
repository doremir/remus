import ScoreDetail from "./score-detail.js";

export default class ScoreChord extends ScoreDetail {
  constructor(item, score, params) {
    super(item, score, params);
    this.lines = this.text ? this.text.split("\n") : "";
  }

  updatePosition() {
    this.x = this.pageX;
    this.y = this.pageY;
    
    // TODO: alignment
  }

  toSVG(svg) {
    // TODO: implement
   }
}
