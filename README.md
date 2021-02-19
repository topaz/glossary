# Simple Glossary System

This repo implements a simple method to turn [YAML](https://en.wikipedia.org/wiki/YAML)-formatted glossary data into a webpage; for example, [speedrunning/glossary.yaml](https://github.com/topaz/glossary/blob/master/speedrunning/glossary.yaml) becomes a [speedrunning glossary](https://topaz.github.io/glossary/speedrunning/).  To start a new topic, create a new directory; inside it, symlink `../glossary.htm` as `index.htm` and create a new `glossary.yaml` file. The YAML file should like this:

```
title: Example Glossary
words:
  apple:
    definition: |
      Some definition of an apple. You can also refer to other words like [banana].
    see_also: ["banana"]
  banana:
    synonyms: ["plantain"] # it's just an example :P
    definition: |
      Another definition, this time not of an [apple], but of a banana.
    examples:
      - title: "Some example of \"banana\" being used."
        url: "http://example.com/banana"
    more_info:
      - title: "Further information on \"banana\"."
        url: "http://example.com/banana"
```

Each word is given as a key under the top-level `words` entry. Words must be unique (including synonyms). Each word can have any of the following properties:
- `definition` - A string containing the word's definition. This is most easily done with a multi-line string (by giving a lone `|` and then providing the string content on subsequent, further-indented lines). Square brackets can be used to create links to other words within the glossary.
- `synonyms` - An array of synonyms for this word. Links can be made to synonyms as well as the primary word.
- `see_also` - An array of words related to this word.
- `examples` - Examples of this word being used in the subject domain (for example, a link to a moment in a video when this word is used in a sentence). Given as an array of objects with keys `title` and `url`.
- `more_info` - Pages with more information about this word (for example, a Wikipedia article that covers this word as its subject). Given as an array of objects with keys `title` and `url`.
