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


var load_counter = 0;
function done(){
  load_counter--;
  if (load_counter == 0) {
    ready();
    done = console.error;
  }
}

var glossary_yaml = null;

load_counter++;
(function(){
  var script = document.createElement("script");
  script.onload = done;
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/js-yaml/3.13.1/js-yaml.min.js";
  document.head.appendChild(script);
})();

load_counter++;
document.addEventListener("DOMContentReady", done);

(function(){
  var req = new XMLHttpRequest();
  req.open("GET", "glossary.yaml");
  req.addEventListener("load", function(e){
    glossary_yaml = req.responseText;
    done();
  });
  req.send();
})();


function ready() {
  var data;
  try {
    data = jsyaml.load(glossary_yaml);
  } catch(err) {
    console.error(err);
    return;
  }

  document.head.appendChild(ce("title",{},data.title||"Glossary"));
  document.body.appendChild(glossary_render(data))

  var dfn_by_id = {};
  Array.from(document.querySelectorAll("dfn > .anchor[id]")).forEach(el=>{
    if (!(el.id in dfn_by_id)) dfn_by_id[el.id] = [];
    dfn_by_id[el.id].push(el);
  });
  Object.keys(dfn_by_id).forEach(id=>{
    if (dfn_by_id[id].length>1) dfn_by_id[id].forEach(el=>{
      el.parentNode.classList.add("error");
      el.parentNode.title = "Duplicate definition!";
    });
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

function glossary_render(data) {
  return ce("div",{className:"glossary"},[
    ce("dl", {className:"words"}, Object.keys(data.words).sort((a,b)=>a.localeCompare(b)).map(word => {
      var info = data.words[word];
      return ce("div", {className:"word"}, [
        ce("dt", {className:"word-terms"}, [dfn_render(word)].concat(
          !info.synonyms   ? [] : ce("span",{className:"word-synonyms"}, info.synonyms.map(syn => dfn_render(syn)).splicejoin(", ")),
        )),
        !info.definition ? [] : ce("dd", {className:"word-definition"}, info.definition),
        !info.examples   ? [] : ce("dd", {className:"word-examples"}, info.examples.map(example => ce("a", {href:example.url}, example.title)).splicejoin(", ")),
        !info.related    ? [] : ce("dd", {className:"word-related"},  info.related .map(related => ce("a", {href:related.url}, related.title)).splicejoin(", ")),
        !info.see_also   ? [] : ce("dd", {className:"word-seealso"},  info.see_also.map(seealso => ce("a", {href:"#"+seealso}, seealso)).splicejoin(", ")),
      ]);
    })),
  ]);
}

function dfn_render(word) {
  return ce("dfn",{},[ce("div",{id:word,className:"anchor"}),ce("a",{href:"#"+word},word)]);
}
