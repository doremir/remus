import ScorePageItem from './score-page-item.js';

export default class ScorePageText extends ScorePageItem {
  constructor(item, score, params) {
    super(item, score, params);
    this.lines = this.text.split("\n");
  }

  updatePosition() {
    this.x = this.pageX;
    this.y = this.pageY;
    
    // TODO: alignment
  }

  toSVG(svg) {
    let font = {family: 'Palatino, "Palatino Linotype", "URW Palladio"', size: 14, style: 'italic'};
    svg.rect(3, 3).x(this.x).attr('y', this.y).fill("#FF000088");
    let alignments = {
      'left': 'start',
      'center': 'middle',
      'right': 'end'
    };
    svg.text(add => {
      let lineNum = 0;
      for (let line of this.lines) {
        let parStyle = this.item.paragraphStyles[lineNum];
        font.anchor = parStyle ? (alignments[parStyle.align] || 'start') : 'start';
        add.tspan(line).font(font).newLine();
        lineNum++;
      }
    }).x(this.x).attr('y', this.y);
  }
}
