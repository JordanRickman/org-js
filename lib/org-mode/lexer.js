/**
 * @module lexer
 */

var Stream = require("./stream.js").Stream;

/** @todo Write tests for the regular expressions */
var tokenRegExps = {
  // In order of precedence (most specific -> least specific)

  // m[1] => level, m[2] => keyword, m[3] => priority, m[4] => content, m[5] tags
  "todo": /^(\*+)\s+(?:(\w+)\s*)(?:\s+\[#([ABCabc])\]\s*)?(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/,
  "header": /^(\*+)\s*(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/, // m[1] => level, m[2] => content, m[3] tags

  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => term, m[5] => content
  "dictionaryListElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:\s+\[( |X|-)\])?(?:\s+(.*?))?\s+::\s+(.*)$/,
  
  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => content 
  "listElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:(?:\s+(?:\[( |X|-)\])?\s*(.*)$)|$)/,

  "beginDrawer": /^(\s*):([\w-]*):\s*$/, // m[1] => indentation, m[2] => content
  "endDrawer": /^(\s*):END:\s*$/, // m[1] => indentation

  /** @todo Unit test the block, dynamic block, and directive patterns. */
  "beginBlock": /^(\s*)#\+BEGIN_(\S*)(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)
  "endBlock": /^(\s*)#\+END_(\S*)\s*$/, // m[1] => indentation, m[2] => name

  "beginDynamicBlock": /^(\s*)#\+BEGIN:\s+(\S*)(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)
  "endDynamicBlock": /^(\s*)#\+END:\s*$/, // m[1] => indendation

  "directive": /^(\s*)#\+(\S*):(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)

  "preformatted": /^(\s*):(?:\s(.*)$|$)/, // m[1] => indentation, m[2] => content
  "blank": /^\s*$/,
  "horizontalRule": /^(\s*)-{5,}\s*$/, // m[1] => indentation
  "comment": /^(\s*)#(?:([^\+].*)$|$)/, // m[1] => indentation, m[2] => content
  "line": /^(\s*)(.*)$/, // m[1] => indentation, m[2] => content
}


if (exports) {
  exports.tokenRegExps = tokenRegExps;
}