import ScoreEvent from './score-event';

export default class ScoreRest extends ScoreEvent {
  innerWidth() {
    return 1; // TODO
  }

  draw(ctx) {
    ctx.fillStyle = this.defaultColor();
    let staffSpace = this.score.staffSize * 0.25;
    switch (this.noteValue) {
      case 'w':
        ctx.fillText(Math.abs(this.staffLine) > 2 ? '\uE4F4' : '\uE4E3', this.x, this.y - staffSpace);
        break;
      case 'h':
        ctx.fillText(Math.abs(this.staffLine) > 2 ? '\uE4F5' : '\uE4E4', this.x, this.y);
        break;
      case 'q': ctx.fillText('\uE4E5', this.x, this.y); break;
      case '8': ctx.fillText('\uE4E6', this.x, this.y); break;
      case '16': ctx.fillText('\uE4E7', this.x, this.y); break;
      case '32': ctx.fillText('\uE4E8', this.x, this.y); break;
      case '64': ctx.fillText('\uE4E9', this.x, this.y); break;
      case '128': ctx.fillText('\uE4EA', this.x, this.y); break;
      case '256': ctx.fillText('\uE4EB', this.x, this.y); break;
    }

    let dotX = this.x + staffSpace * 1.3; // TODO

    // Draw augmentation dots
    for (let d = 0; d < this.dots; d++) {
      ctx.fillText('\uE1E7', dotX, this.y);
      dotX += staffSpace; // TODO
    }
  }

  toSVG(svg) {
    svg.addClass('voice-' + this.voice.id);
    let staffSpace = this.score.staffSize * 0.25;
    switch (this.noteValue) {
      case 'w':
        svg.plain(Math.abs(this.staffLine) > 2 ? '\uE4F4' : '\uE4E3').x(this.x).attr('y', this.y - staffSpace).font({family: null, size: null});
        break;
      case 'h':
        svg.plain(Math.abs(this.staffLine) > 2 ? '\uE4F5' : '\uE4E4').x(this.x).attr('y', this.y).font({family: null, size: null});
        break;
      case 'q': svg.plain('\uE4E5').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '8': svg.plain('\uE4E6').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '16': svg.plain('\uE4E7').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '32': svg.plain('\uE4E8').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '64': svg.plain('\uE4E9').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '128': svg.plain('\uE4EA').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
      case '256': svg.plain('\uE4EB').x(this.x).attr('y', this.y).font({family: null, size: null}); break;
    }

    let dotX = this.x + staffSpace * 1.3; // TODO

    // Draw augmentation dots
    for (let d = 0; d < this.dots; d++) {
      svg.plain('\uE1E7').x(dotX).attr('y', this.y).font({family: null, size: null});
      dotX += staffSpace; // TODO
    }
  }
}
