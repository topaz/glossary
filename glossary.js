(function(){

function ce(tagname, attr, children) {
  var el = document.createElement(tagname);
  if (attr) {
    for (var k in attr) {
      if (typeof attr[k] === "object") {
        for (var a in attr[k]) {
          el[k][a] = attr[k][a];
        }
      } else {
        el[k] = attr[k];
      }
    }
  }
  if (children != undefined) {
    var appendChildren = function appendChildren(children) {
      if (Array.isArray(children)) {
        for (var i=0; i<children.length; i++) {
          appendChildren(children[i]);
        }
      } else {
        el.appendChild(typeof children === 'object' ? children : document.createTextNode(children));
      }
    };
    appendChildren(children);
  }
  return el;
}

function dom_clear(parent, keep_prefix) {
  keep_prefix = keep_prefix || 0;
  while (parent.childNodes.length > keep_prefix) parent.removeChild(parent.lastChild);
}

Array.prototype.splicejoin = function splicejoin(sep) {
  if (this.length === 0) return [];
  var rv = [this[0]];
  for (var i=1; i<this.length; i++) {
    rv.push(sep);
    rv.push(this[i]);
  }
  return rv;
};


(function(){
  var link = document.createElement("link");
  link.rel = 'stylesheet';
  link.href = '../glossary.css';
  document.head.appendChild(link);
})();


function init_error(message) {
  dom_clear(document.body);
  document.body.appendChild(ce("p",null,[ce("strong",null,"Error: "),""+message]));
  console.error(message);
}

var load_counter = 0;
function load_start(){
  load_counter++;
}
function load_done(){
  load_counter--;
  if (load_counter == 0) {
    ready();
    load_done = console.error;
  }
}

var glossary_yaml = null;

load_start();
(function(){
  var script = document.createElement("script");
  script.addEventListener('load', load_done);
  script.addEventListener('error', function(){init_error("Failed to load js-yaml library.")});
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/js-yaml/3.13.1/js-yaml.min.js";
  document.head.appendChild(script);
})();

load_start();
document.addEventListener("DOMContentLoaded", load_done);

load_start();
(function(){
  var req = new XMLHttpRequest();
  req.open("GET", "glossary.yaml");
  req.addEventListener("load", function(e){
    glossary_yaml = req.responseText;
    load_done();
  });
  req.addEventListener('error', function(){init_error("Failed to load glossary yaml.")});
  req.send();
})();


function ready() {
  var data;
  try {
    data = jsyaml.load(glossary_yaml);
  } catch(err) {
    init_error(err);
    return;
  }

  var glossary_name = /([^\/]+)\/[^\/]*$/.exec(location.pathname)[1];

  document.head.appendChild(ce("title",{},data.title||"Glossary"));
  document.body.appendChild(ce("header",{},ce("nav",{},[
    ce("a", {href:"https://github.com/topaz/glossary"}, "GitHub Repository"),
    ce("a", {href:"https://github.com/topaz/glossary/blob/master/"+glossary_name+"/glossary.yaml"}, "Glossary Source"),
  ])));
  document.body.appendChild(glossary_render(data))

  // collect all linkable dfns
  var dfn_by_id = {};
  Array.from(document.querySelectorAll("dfn > .anchor[id]")).forEach(el=>{
    if (!(el.id in dfn_by_id)) dfn_by_id[el.id] = [];
    dfn_by_id[el.id].push(el);
  });

  // check that all dfns are unique
  Object.keys(dfn_by_id).forEach(id=>{
    if (dfn_by_id[id].length>1) dfn_by_id[id].forEach(el=>{
      el.parentNode.classList.add("error");
      el.parentNode.title = "Duplicate definition!";
    });
  });

  // check that all internal links point to existing dfns
  Array.from(document.querySelectorAll("a[href^=\"#\"]")).forEach(el=>{
    if (!(el.getAttribute("href").substr(1) in dfn_by_id)) el.classList.add("unknown-href");
  });

  var hash;
  if (location.hash) {
    hash = location.hash;
    location.hash = '';
  }

  window.addEventListener("hashchange", function(e){
    Array.from(document.getElementsByClassName("focus")).forEach(el => el.classList.remove("focus"));

    var el = document.getElementById(location.hash.substr(1));
    while (el && !el.classList.contains("word")) el = el.parentNode;
    if (el) {
      el.offsetWidth; //force update
      el.classList.add("focus");
    }
  });

  if (hash) location.hash = hash;
}

var known_keys = {synonyms:1,definition:1,examples:1,more_info:1,see_also:1};
function glossary_render(data) {
  return ce("div",{className:"glossary"},[
    !data.title ? [] : ce("h1", null, data.title),
    ce("dl", {className:"words"}, Object.keys(data.words).sort((a,b)=>a.localeCompare(b)).map(word => {
      var info = data.words[word] || {};
      var unknown_keys = Object.keys(info).filter(k => !(k in known_keys));
      if (unknown_keys.length) console.error("Unknown keys for word \"%s\": %o", word, unknown_keys);
      return ce("div", {className:"word"}, [
        ce("dt", {className:"word-terms"}, [dfn_render(word)].concat(
          !info.synonyms ? [] : ce("span",{className:"word-synonyms"},  info.synonyms .map(syn       => dfn_render(syn)).splicejoin(", ")),
        )),
        !info.definition ? [] : ce("dd", {className:"word-definition"}, inline_render(info.definition, data)),
        !info.examples   ? [] : ce("dd", {className:"word-examples"},   info.examples .map(example   => ce("a", {href:example.url}, example.title)).splicejoin(", ")),
        !info.more_info  ? [] : ce("dd", {className:"word-moreinfo"},   info.more_info.map(more_info => ce("a", {href:more_info.url}, more_info.title)).splicejoin(", ")),
        !info.see_also   ? [] : ce("dd", {className:"word-seealso"},    info.see_also .map(seealso   => ce("a", {href:"#"+word_anchor(seealso)}, seealso)).splicejoin(", ")),
      ]);
    })),
  ]);
}

function word_anchor(word) {
  return word.toLowerCase().replace(/\s/g,'_');
}

function dfn_render(word) {
  return ce("dfn",{},[ce("div",{id:word_anchor(word),className:"anchor"}),ce("a",{href:"#"+word_anchor(word)},word)]);
}

function inline_render(markup) {
  var parts = markup.split(/\[([^\[\]]+)\]/g);
  var dom = [];
  for (var i=0; i<parts.length; i++) {
    if (i % 2 == 0) {
      if (parts[i].length) dom.push(parts[i]);
    } else {
      dom.push(ce("a", {href:"#"+word_anchor(parts[i])}, parts[i]));
    }
  }
  return dom;
}

})();
