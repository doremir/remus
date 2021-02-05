// import _ from 'underscore';
// import MusicPtr from './music-ptr';

export default {

  splitDurations: function(container) {
    if (container.eventTimeMode !== 'relative') {
      throw new Error('splitDurations can only work with relative events');
    }

    container.resolve();
    // let mp = new MusicPtr(container);
  }
};
