
import $ from 'jquery';

function createTitle(title) {
  var wrapper = document.createElement('h1');
  var textNode = document.createTextNode(title);
  wrapper.appendChild(textNode);
  return wrapper;
}

function updateInfoField(obj) {
  $('#info h1').text(obj.type);
  $('#info pre').text(objToString(obj));
  document.getElementById('info').style.display = 'block';
}

function objToString(obj, type) {
  var s = [];
  if (type) s.push(obj.type);
  s.push('Position: ' + (obj.position ? (obj.position[0] + ' ' + obj.position[1]) : '--'));
  s.push('Duration: ' + (obj.duration ? (obj.duration[0] + ' ' + obj.duration[1]) : '--'));
  var ignore = ['type', 'contents', 'duration', 'pos', 'parent'];
  for (var p in obj) {
    if (obj.hasOwnProperty(p) && (ignore.indexOf(p) < 0)) s.push(p + ': ' + obj[p]);
  }
  return s.join('\n');
}

var hovered;
var selected;

function render(obj) {
  var node = document.createElement('div');
  node.appendChild(createTitle(obj.type));
  node.className = 'object ' + obj.type.toLowerCase();
  node.style.left = (obj.startTime / 10) + 'px';
  node.style.width = ((obj.endTime - obj.startTime) / 10) + 'px';
  node.style.top = (obj.row ? obj.row * 40 : 0) + 'px';
  node.dataset.row = obj.row;
  node.obj = obj;
  node.title = objToString(obj); // JSON.stringify(obj, null, 4);

  node.onclick = function(e) {
    updateInfoField(node.obj);
    if (selected) $(selected).removeClass('selected');
    selected = node;
    $(node).addClass('selected');
    e.stopPropagation();
  };

  node.onmouseover = function(e) {
    if (hovered && (hovered !== node)) $(hovered).removeClass('hovered');
    $(node).addClass('hovered');
    hovered = node;
    e.stopPropagation();
  };

  node.onmouseout = function(e) {
    if (node === hovered) $(node).removeClass('hovered');
    hovered = null;
  };

  var height = 0;
  if (obj.events) {
    var container = document.createElement('div');
    container.className = 'container';
    for (var i = 0; i < obj.events.length; i++) {
      var child = obj.events[i];
      var childNode = this.render(child);
      container.appendChild(childNode);
      var h = parseInt(childNode.style.top) + parseInt(childNode.style.height) + 5;
      if (h > height) height = h;
    }
    height += 25;
    if (height < 30) height = 30;
    container.style.height = height + 'px';
    node.appendChild(container);
    node.style.height = container.style.height;
  } else {
    node.style.height = '20px';
  }

  return node;
}

export default {
  render: render
};

