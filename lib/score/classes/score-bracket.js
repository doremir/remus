import ScoreItem from './score-item';

export default class ScoreBracket extends ScoreItem {
  constructor(item, score, params) {
    super(item, score, params);
    this.kind = this.kind || 'bracket';
    this.thickness = score.engravingDefaults.bracketThickness || 0.5;
  }

  updatePosition() {
    let staffSpace = this.score.staffSize * 0.25;
    let staffSystem = this.staffSystem;

    this.y1 = -2.5 * staffSpace;
    this.y2 = (staffSystem.staves.length - 1) * staffSystem.staffDistance + (staffSpace * 2.5);

    this.x = staffSystem.indent + staffSpace * ((this.xOffset || 0) - this.thickness + -0.25);
    this.y = this.y1 + staffSpace * (this.yOffset || 0);
  }

  toSVG(svg) {
    switch (this.kind) {
      case 'brace':
        svg.plain('\ue000').x(this.x).attr('y', this.y).font({family: null, size: null});
        break;
      case 'bracket':
        // let halfLineWidth = 0.5 * this.staffSystem.staffLineWidth;
        let thickness = this.thickness * this.score.staffSize * 0.25;
        let line = svg.line(this.x, this.y1, this.x, this.y2);
        line.stroke({width: thickness});
        let hookX = this.x - thickness * 0.5;
        svg.plain('\ue003').x(hookX).attr('y', this.y1).font({family: null, size: null});
        svg.plain('\ue004').x(hookX).attr('y', this.y2).font({family: null, size: null});
        break;
    }
  }
}
