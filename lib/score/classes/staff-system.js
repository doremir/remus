export default class StaffSystem {
  constructor(score, num, params = {}) {
    this.score = score;
    this.num = num;
    this.x = 0;
    this.y = 40;
    this.indent = params.indent || 0;
    this.staffSize = params.staffSize || score.staffSize || 28;
    this.staffWidth = params.staffWidth || score.pageWidth;
    this.staffLineWidth = params.staffLineWidth || 0.8;
    this.stemThickness = params.stemThickness || 1.0;
    this.staffDistance = params.staffDistance || score.staffDistance || 80;
    this.staves = params.staves;
  }

  itemAt(x, y) {
    for (let item of this.items) {
      let b = item.bounds;
      if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) return item;
    }
  }

  updateBounds() {
    // We need to separate the items that should affect spacing,
    // and other items which we still need to include for hit testing
    let spacingItems = [];
    let otherItems = [];
    let allItems = this.items;

    // Build two lists during a single pass
    for (let item of allItems) {
      if (item.doesNotAffectSpacing) otherItems.push(item);
      else spacingItems.push(item);

      // TEMP: update bounds of all items. This should not be needed here!
      item.updateBounds();
    }

    let bounds = {};

    // "Spacing Y", only use Y values for items affecting spacing
    bounds.spacingMinY = Math.min(0,           spacingItems.map(i => i.bounds.minY).reduce((a, y) => Math.min(a, y), 0));
    bounds.spacingMaxY = Math.max(this.height, spacingItems.map(i => i.bounds.maxY).reduce((a, y) => Math.max(a, y), 0));
    // For total minY/maxY, include extreme values from other items as well
    bounds.minY = Math.min(bounds.spacingMinY, otherItems.map(i => i.bounds.minY).reduce((a, y) => Math.min(a, y), 0));
    bounds.maxY = Math.max(bounds.spacingMaxY, otherItems.map(i => i.bounds.maxY).reduce((a, y) => Math.max(a, y), 0));
    // For x values, just use all items
    bounds.minX = Math.min(0,                  allItems.map(i => i.bounds.minX).reduce((a, x) => Math.min(a, x), 0));
    bounds.maxX = Math.max(this.staffWidth,    allItems.map(i => i.bounds.maxX).reduce((a, x) => Math.max(a, x), 0));

    this.bounds = bounds;
  }

  draw(ctx) {
    let x1 = this.x + this.indent;
    let x2 = this.staffWidth;
    let y = this.y;
    let delta = this.staffSize * 0.25;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.lineWidth = this.score.staffLineWidth;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(x1, y + (i * delta));
      ctx.lineTo(x2, y + (i * delta));
    }
    ctx.stroke();

    for (let item of this.items) {
      item.draw(ctx);
    }
    // for (let i = 0; i < 5; i++) {
    //   this.items[i].draw(ctx);
    // }

    ctx.restore();
  }

  toSVG(svg) {
    let score = this.score;
    let x1 = this.x + this.indent;
    let x2 = this.staffWidth + this.indent;
    let y = this.y;
    let delta = this.staffSize * 0.25;

    // Create SVG group for the staff system, with a sane ID
    let staffSystem = svg.group().id('staff-system-' + this.num).translate(0, y);

    // Draw staff lines
    for (let staff = 0; staff < this.staves.length; staff++) {
      let staffY = staff * this.staffDistance; // TODO
      let staffLines = staffSystem.group().id('staff-lines');
      let staffLineWidth = (score.engravingDefaults.staffLineWidth || 0.13) * delta;
      staffLines.attr('stroke-width', staffLineWidth);
      let y1 = staffY + delta * (this.staves[staff].staffLines - 1) * -0.5;
      for (let i = 0; i < this.staves[staff].staffLines; i++) {
        staffLines.line(x1, y1 + (i * delta), x2, y1 + (i * delta)).stroke().id(null);
      }
    }

    // Draw score items
    for (let item of this.items) {
      // Wrap every ScoreItem in a SVG group
      let group = staffSystem.group();
      group.addClass('ScoreItem');
      group.addClass(item.constructor.name);
      if (item.item && item.item.className) group.addClass(item.item.className);
      // Call function in sub class for actual SVG generation
      item.toSVG(group);
      // Attach message handlers
      group.on('mouseenter', score.handleMouseEnter.bind(score));
      group.on('mouseleave', score.handleMouseLeave.bind(score));
      group.on('click', score.handleClick.bind(score));
      // Set references from SVG object to ScoreItem and back
      // NB: as we cannot store object references in the SVG,
      //     we use a key in the score as a lookup table
      item.svgElement = group;
      score.itemsBySVGID[group.id()] = item;
    }

    return staffSystem;
  }
}

