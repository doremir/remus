import ScorePageItem from './score-page-item.js';

export default class ScorePageText extends ScorePageItem {
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
    let score = this.score;
    // Wrap in a group
    let group = svg.group();
    group.addClass('ScorePageItem');
    group.addClass('ScorePageText');
    group.x(this.x).y(this.y);
    // Add references
    this.svgElement = group;
    score.itemsBySVGID[group.id()] = this;
    // Attach message handlers
    group.on('mouseenter', score.handleMouseEnter.bind(score));
    group.on('mouseleave', score.handleMouseLeave.bind(score));
    group.on('click', score.handleClick.bind(score));

    // Do actual drawing
    let font = {family: 'Palatino, "Palatino Linotype", "URW Palladio"', size: 14, style: 'italic'}; // TODO
    group.rect(3, 3).x(0).y(0).fill("#FF000088");
    let alignments = {
      'left': 'start',
      'center': 'middle',
      'right': 'end'
    };
    group.text(add => {
      let lineNum = 0;
      for (let line of this.lines) {
        let parStyle = this.item.paragraphStyles[lineNum];
        font.anchor = parStyle ? (alignments[parStyle.align] || 'start') : 'start';
        add.tspan(line).font(font).newLine();
        lineNum++;
      }
    }).x(0).y(0);
  }
}
