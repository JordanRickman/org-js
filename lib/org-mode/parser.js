var Stream = require("./stream.js").Stream;
var Lexer  = require("./lexer.js").Lexer;
var Node   = require("./node.js").Node;
var model = require("./model.js");

/** @class */
function Parser() {
  this.inlineParser = new InlineParser();
}

Parser.prototype = {
  /**
   * @param {string|Stream} stream - The character stream to parse.
   * @param {ParserOptions} options - Parsing options
   */
  initParsing: function (stream, options) {
    if (typeof stream === "string")
      stream = new Stream(stream);
    this.lexer = new Lexer(stream);
    this.nodes = [];
    // Default option values
    this.options = {
      toc: true,
      num: true,
      "^": "{}",
      multilineCell: false
    };
    // Override option values
    if (options && typeof options === "object") {
      for (var key in options) {
        if (options.hasOwnProperty(key) {
          this.options[key] = options[key];
        }
      }
    }
    this.document = new model.ModelDocument(this.options);
  },

  /**
   * @param {string|Stream} stream - The character stream to parse.
   * @param {ParserOptions} options - Parsing options
   * @returns {ModelDocument} The document reprsented by the given stream.
   */
  parse: function (stream, options) {
    this.initParsing(stream, options);
    this.parseNodes();
    this.document.nodes = this.nodes;
    return this.document;
  },

  /** Construct a parsing error with the given message. 
  * @todo Make a custom error class. */
  createErrorReport: function (message) {
    return new Error(message + " at line " + this.lexer.getLineNumber());
  },

  /** Move the lexer forward until the next token is not a blank token. */
  skipBlank: function () {
    var blankToken = null;
    while (this.lexer.peekNextToken().type === Lexer.tokens.blank)
      blankToken = this.lexer.getNextToken();
    return blankToken;
  },

  /** @deprecated
   * @todo replace with new model's line number and cursor position tracking. */
  setNodeOriginFromToken: function (node, token) {
    node.fromLineNumber = token.fromLineNumber;
    return node;
  },

  /**
   * Add a node to the currently parsed document.
   * @param {ModelNode} newNode - The node to add.
   */
  appendNode: function (newNode) {
    this.nodes.push(newNode);
  },

  /** @deprecated We are no longer treating the first line as a title. */
  parseWithFirstLineAsTitle: function () {
    this.initParsing(stream, options);
    this.parseTitle();
    this.parseNodes();
    this.document.nodes = this.nodes;
    return this.document;
  },

  /** @deprecated We are no longer treating the first line as a title. */
  parseTitle: function () {
    this.skipBlank();

    if (this.lexer.hasNext() &&
        this.lexer.peekNextToken().type === Lexer.tokens.line)
      this.document.title = this.createTextNode(this.lexer.getNextToken().content);
    else
      this.document.title = null;

    this.lexer.pushDummyTokenByType(Lexer.tokens.blank);
  },

  /** 
   * Parse all nodes in the stream, adding them to this.nodes 
   *
   * <Document> ::= <Element>*
   */
  parseNodes: function () {
    while (this.lexer.hasNext()) {
      var element = this.parseElement();
      if (element) this.appendNode(element);
    }
  },

  /**
   * Parse the next element, whatever type of element it may be.
   * @returns {ModelNode} The next element found, including all of its sub-elements.
   *
   * <Element> ::= (<Header> | <List>
   *              | <Preformatted> | <Paragraph>
   *              | <Table>)*
   */
  parseElement: function () {
    var element = null;

    switch (this.lexer.peekNextToken().type) {
    case Lexer.tokens.header:
      element = this.parseHeader();
      break;
    case Lexer.tokens.preformatted:
      element = this.parsePreformatted();
      break;
    case Lexer.tokens.orderedListElement:
    case Lexer.tokens.unorderedListElement:
      element = this.parseList();
      break;
    case Lexer.tokens.line:
      element = this.parseText();
      break;
    case Lexer.tokens.tableRow:
    case Lexer.tokens.tableSeparator:
      element = this.parseTable();
      break;
    case Lexer.tokens.blank:
      this.skipBlank();
      if (this.lexer.hasNext()) {
        if (this.lexer.peekNextToken().type === Lexer.tokens.line)
          element = this.parseParagraph();
        else
          element = this.parseElement();
      }
      break;
    case Lexer.tokens.horizontalRule:
      this.lexer.getNextToken();
      element = new model.ModelNode("horizontalRule", []);
      break;
    case Lexer.tokens.directive:
      element = this.parseDirective();
      break;
    case Lexer.tokens.comment:
      /** @todo To prevent data loss converting to/from text, maybe we should save comment elements? */
      this.lexer.getNextToken();
      break;
    default:
      throw this.createErrorReport("Unhandled token: " + this.lexer.peekNextToken().type);
    }

    return element;
  },

  /**
   * Special case of {@link Parser#parseElement} that will exit the enclosing directive when it encounters a directive
   * end token.
   * @returns {ModelNode} The next element found, including all of its sub-elements.
   */
  parseElementBesidesDirectiveEnd: function () {
    try {
      // Temporary, override the definition of `parseElement`
      this.parseElement = this.parseElementBesidesDirectiveEndBody;
      return this.parseElement();
    } finally {
      this.parseElement = this.originalParseElement;
    }
  },

  /**
   * To break at end directives, {@link Parser#parseElementBesidesDirectiveEnd} temporarily replaces
   * {@link Parser#parseElement} with this function (since nested calls will call parseElement(), not
   * parseElementBesidesDirectiveEnd().
   */
  parseElementBesidesDirectiveEndBody: function () {
    if (this.lexer.peekNextToken().type === Lexer.tokens.directive &&
        this.lexer.peekNextToken().endDirective) {
      return null;
    }

    return this.originalParseElement();
  },

  // ------------------------------------------------------------
  // <Header>
  //
  // * Level one header
  // ** Level two header
  // *** Level three header
  // ------------------------------------------------------------

  /**
   * Parse the next element as a header.
   * @returns {HeaderNode} The parsed header node.
   *
   * <Header>
   *
   * * Level one header
   * ** Level two header
   * *** Level three header
   */
  parseHeader: function () {
    var headerToken = this.lexer.getNextToken();
    /** @todo Parse inline markups in headers */
    var headerContents = headerToken.content;
    var childNode = new model.TextNode(headerContents);
    var header = new model.HeaderNode([childNode], headerToken.level);

    return header;
  },

  /**
   * Parse the next element as a preformatted block.
   * @returns {ModelNode} The parsed preformatted block.
   *
   * <Preformatted>
   *
   * : preformatted
   * : block
   */
  parsePreformatted: function () {
    var preformattedFirstToken = this.lexer.peekNextToken();

    var textContents = [];
    while (this.lexer.hasNext()) {
      var token = this.lexer.peekNextToken();
      if (token.type !== Lexer.tokens.preformatted ||
          token.indentation < preformattedFirstToken.indentation)
        break;
      this.lexer.getNextToken();
      textContents.push(token.content);
    }

    var childNode = new model.TextNode(textContents.join("\n"), true /* no emphasis */);
    var preformatted = new model.ModelNode('preformatted', [childNode]);

    return preformatted;
  },

  // ------------------------------------------------------------
  // <List>
  //
  //  - foo
  //    1. bar
  //    2. baz
  // ------------------------------------------------------------

  /** @ignore */
  // XXX: not consider codes (e.g., =Foo::Bar=)
  definitionPattern: /^(.*?) :: *(.*)$/,

  /**
   * Parse the next element as a list.
   * @returns {ModelNode} The parsed list element.
   * 
   * <List>
   *
   *  - foo
   *    1. bar
   *    2. baz
   *      - term :: definition
   */
  parseList: function () {
    var rootToken = this.lexer.peekNextToken();
    var list;
    var isDefinitionList = false;

    if (this.definitionPattern.test(rootToken.content)) {
      list = new model.ModelNode('definitionList', []);
      isDefinitionList = true;
    } else {
      list = rootToken.type === Lexer.tokens.unorderedListElement ?
        new model.ModelNode('unorderedList', []) : new model.ModelNode('orderedList', []);
    }

    while (this.lexer.hasNext()) {
      var nextToken = this.lexer.peekNextToken();
      if (!nextToken.isListElement() || nextToken.indentation !== rootToken.indentation)
        break;
      list.children.push(this.parseListElement(rootToken.indentation, isDefinitionList));
    }

    return list;
  },

  /** @ignore */
  unknownDefinitionTerm: "???",

  /**
   * Parse the next item as a list element.
   * @param {number} rootIndentation - the indentation depth of the surrounding list.
   * @param {boolean} isDefinitionList - whether this is a definition list.
   * @returns {ModelNode} The parsed list element.
   */
  parseListElement: function (rootIndentation, isDefinitionList) {
    var listElementToken = this.lexer.getNextToken();
    var listElement = new model.ModelNode('listElement');

    if (isDefinitionList) {
      var match = this.definitionPattern.exec(listElementToken.content);
      var term = [
        this.createTextNode(match && match[1] ? match[1] : this.unknownDefinitionTerm)
      ];
      listElement.appendChild(this.createTextNode(match ? match[2] : listElementToken.content));
    } else {
      listElement.appendChild(this.createTextNode(listElementToken.content));
    }

    while (this.lexer.hasNext()) {
      var blankToken = this.skipBlank();
      if (!this.lexer.hasNext())
        break;

      var notBlankNextToken = this.lexer.peekNextToken();
      if (blankToken && !notBlankNextToken.isListElement())
        this.lexer.pushToken(blankToken); // Recover blank token only when next line is not listElement.
      if (notBlankNextToken.indentation <= rootIndentation)
        break;                  // end of the list

      var element = this.parseElement(); // recursive
      if (element)
        listElement.appendChild(element);
    }

    return listElement;
  },

  // ------------------------------------------------------------
  // <Table> ::= <TableRow>+
  // ------------------------------------------------------------

  parseTable: function () {
    var nextToken = this.lexer.peekNextToken();
    var table = Node.createTable([]);
    this.setNodeOriginFromToken(table, nextToken);
    var sawSeparator = false;

    var allowMultilineCell = nextToken.type === Lexer.tokens.tableSeparator && this.options.multilineCell;

    while (this.lexer.hasNext() &&
           (nextToken = this.lexer.peekNextToken()).isTableElement()) {
      if (nextToken.type === Lexer.tokens.tableRow) {
        var tableRow = this.parseTableRow(allowMultilineCell);
        table.appendChild(tableRow);
      } else {
        // Lexer.tokens.tableSeparator
        sawSeparator = true;
        this.lexer.getNextToken();
      }
    }

    if (sawSeparator && table.children.length) {
      table.children[0].children.forEach(function (cell) {
        cell.isHeader = true;
      });
    }

    return table;
  },

  // ------------------------------------------------------------
  // <TableRow> ::= <TableCell>+
  // ------------------------------------------------------------

  parseTableRow: function (allowMultilineCell) {
    var tableRowTokens = [];

    while (this.lexer.peekNextToken().type === Lexer.tokens.tableRow) {
      tableRowTokens.push(this.lexer.getNextToken());
      if (!allowMultilineCell) {
        break;
      }
    }

    if (!tableRowTokens.length) {
      throw this.createErrorReport("Expected table row");
    }

    var firstTableRowToken = tableRowTokens.shift();
    var tableCellTexts = firstTableRowToken.content.split("|");

    tableRowTokens.forEach(function (rowToken) {
      rowToken.content.split("|").forEach(function (cellText, cellIdx) {
        tableCellTexts[cellIdx] = (tableCellTexts[cellIdx] || "") + "\n" + cellText;
      });
    });

    // TODO: Prepare two pathes: (1)
    var tableCells = tableCellTexts.map(
      // TODO: consider '|' escape?
      function (text) {
        return Node.createTableCell(Parser.parseStream(text));
      }, this);

    return this.setNodeOriginFromToken(Node.createTableRow(tableCells), firstTableRowToken);
  },

  // ------------------------------------------------------------
  // <Directive> ::= "#+.*"
  // ------------------------------------------------------------

  parseDirective: function () {
    var directiveToken = this.lexer.getNextToken();
    var directiveNode = this.createDirectiveNodeFromToken(directiveToken);

    if (directiveToken.endDirective)
      throw this.createErrorReport("Unmatched 'end' directive for " + directiveNode.directiveName);

    if (directiveToken.oneshotDirective) {
      this.interpretDirective(directiveNode);
      return directiveNode;
    }

    if (!directiveToken.beginDirective)
      throw this.createErrorReport("Invalid directive " + directiveNode.directiveName);

    // Parse begin ~ end
    directiveNode.children = [];
    if (this.isVerbatimDirective(directiveNode))
      return this.parseDirectiveBlockVerbatim(directiveNode);
    else
      return this.parseDirectiveBlock(directiveNode);
  },

  createDirectiveNodeFromToken: function (directiveToken) {
    var matched = /^[ ]*([^ ]*)[ ]*(.*)[ ]*$/.exec(directiveToken.content);

    var directiveNode = Node.createDirective(null);
    this.setNodeOriginFromToken(directiveNode, directiveToken);
    directiveNode.directiveName = matched[1].toLowerCase();
    directiveNode.directiveArguments = this.parseDirectiveArguments(matched[2]);
    directiveNode.directiveOptions = this.parseDirectiveOptions(matched[2]);
    directiveNode.directiveRawValue = matched[2];

    return directiveNode;
  },

  isVerbatimDirective: function (directiveNode) {
    var directiveName = directiveNode.directiveName;
    return directiveName === "src" || directiveName === "example" || directiveName === "html";
  },

  parseDirectiveBlock: function (directiveNode, verbatim) {
    this.lexer.pushDummyTokenByType(Lexer.tokens.blank);

    while (this.lexer.hasNext()) {
      var nextToken = this.lexer.peekNextToken();
      if (nextToken.type === Lexer.tokens.directive &&
          nextToken.endDirective &&
          this.createDirectiveNodeFromToken(nextToken).directiveName === directiveNode.directiveName) {
        // Close directive
        this.lexer.getNextToken();
        return directiveNode;
      }
      var element = this.parseElementBesidesDirectiveEnd();
      if (element)
        directiveNode.appendChild(element);
    }

    throw this.createErrorReport("Unclosed directive " + directiveNode.directiveName);
  },

  parseDirectiveBlockVerbatim: function (directiveNode) {
    var textContent = [];

    while (this.lexer.hasNext()) {
      var nextToken = this.lexer.peekNextToken();
      if (nextToken.type === Lexer.tokens.directive &&
          nextToken.endDirective &&
          this.createDirectiveNodeFromToken(nextToken).directiveName === directiveNode.directiveName) {
        this.lexer.getNextToken();
        directiveNode.appendChild(this.createTextNode(textContent.join("\n"), true));
        return directiveNode;
      }
      textContent.push(this.lexer.stream.getNextLine());
    }

    throw this.createErrorReport("Unclosed directive " + directiveNode.directiveName);
  },

  parseDirectiveArguments: function (parameters) {
    return parameters.split(/[ ]+/).filter(function (param) {
      return param.length && param[0] !== "-";
    });
  },

  parseDirectiveOptions: function (parameters) {
    return parameters.split(/[ ]+/).filter(function (param) {
      return param.length && param[0] === "-";
    });
  },

  interpretDirective: function (directiveNode) {
    // http://orgmode.org/manual/Export-options.html
    switch (directiveNode.directiveName) {
    case "options:":
      this.interpretOptionDirective(directiveNode);
      break;
    case "title:":
      this.document.title = directiveNode.directiveRawValue;
      break;
    case "author:":
      this.document.author = directiveNode.directiveRawValue;
      break;
    case "email:":
      this.document.email = directiveNode.directiveRawValue;
      break;
    default:
      this.document.directiveValues[directiveNode.directiveName] = directiveNode.directiveRawValue;
      break;
    }
  },

  interpretOptionDirective: function (optionDirectiveNode) {
    optionDirectiveNode.directiveArguments.forEach(function (pairString) {
      var pair = pairString.split(":");
      this.options[pair[0]] = this.convertLispyValue(pair[1]);
    }, this);
  },

  convertLispyValue: function (lispyValue) {
    switch (lispyValue) {
    case "t":
      return true;
    case "nil":
      return false;
    default:
      if (/^[0-9]+$/.test(lispyValue))
        return parseInt(lispyValue);
      return lispyValue;
    }
  },

  // ------------------------------------------------------------
  // <Paragraph> ::= <Blank> <Line>*
  // ------------------------------------------------------------

  parseParagraph: function () {
    var paragraphFisrtToken = this.lexer.peekNextToken();
    var paragraph = Node.createParagraph([]);
    this.setNodeOriginFromToken(paragraph, paragraphFisrtToken);

    var textContents = [];

    while (this.lexer.hasNext()) {
      var nextToken = this.lexer.peekNextToken();
      if (nextToken.type !== Lexer.tokens.line
          || nextToken.indentation < paragraphFisrtToken.indentation)
        break;
      this.lexer.getNextToken();
      textContents.push(nextToken.content);
    }

    paragraph.appendChild(this.createTextNode(textContents.join("\n")));

    return paragraph;
  },

  parseText: function (noEmphasis) {
    var lineToken = this.lexer.getNextToken();
    return this.createTextNode(lineToken.content, noEmphasis);
  },

  // ------------------------------------------------------------
  // <Text> (DOM Like)
  // ------------------------------------------------------------

  createTextNode: function (text, noEmphasis) {
    return noEmphasis ? Node.createText(null, { value: text })
      : this.inlineParser.parseEmphasis(text);
  }
};
Parser.prototype.originalParseElement = Parser.prototype.parseElement;

// ------------------------------------------------------------
// Parser for Inline Elements
//
// @refs org-emphasis-regexp-components
// ------------------------------------------------------------

function InlineParser() {
  this.preEmphasis     = " \t\\('\"";
  this.postEmphasis    = "- \t.,:!?;'\"\\)";
  this.borderForbidden = " \t\r\n,\"'";
  this.bodyRegexp      = "[\\s\\S]*?";
  this.markers         = "*/_=~+";

  this.emphasisPattern = this.buildEmphasisPattern();
  this.linkPattern = /\[\[([^\]]*)\](?:\[([^\]]*)\])?\]/g; // \1 => link, \2 => text
}

InlineParser.prototype = {
  parseEmphasis: function (text) {
    var emphasisPattern = this.emphasisPattern;
    emphasisPattern.lastIndex = 0;

    var result = [],
        match,
        previousLast = 0,
        savedLastIndex;

    while ((match = emphasisPattern.exec(text))) {
      var whole  = match[0];
      var pre    = match[1];
      var marker = match[2];
      var body   = match[3];
      var post   = match[4];

      {
        // parse links
        var matchBegin = emphasisPattern.lastIndex - whole.length;
        var beforeContent = text.substring(previousLast, matchBegin + pre.length);
        savedLastIndex = emphasisPattern.lastIndex;
        result.push(this.parseLink(beforeContent));
        emphasisPattern.lastIndex = savedLastIndex;
      }

      var bodyNode = [Node.createText(null, { value: body })];
      var bodyContainer = this.emphasizeElementByMarker(bodyNode, marker);
      result.push(bodyContainer);

      previousLast = emphasisPattern.lastIndex - post.length;
    }

    if (emphasisPattern.lastIndex === 0 ||
        emphasisPattern.lastIndex !== text.length - 1)
      result.push(this.parseLink(text.substring(previousLast)));

    if (result.length === 1) {
      // Avoid duplicated inline container wrapping
      return result[0];
    } else {
      return Node.createInlineContainer(result);
    }
  },

  depth: 0,
  parseLink: function (text) {
    var linkPattern = this.linkPattern;
    linkPattern.lastIndex = 0;

    var match,
        result = [],
        previousLast = 0,
        savedLastIndex;

    while ((match = linkPattern.exec(text))) {
      var whole = match[0];
      var src   = match[1];
      var title = match[2];

      // parse before content
      var matchBegin = linkPattern.lastIndex - whole.length;
      var beforeContent = text.substring(previousLast, matchBegin);
      result.push(Node.createText(null, { value: beforeContent }));

      // parse link
      var link = Node.createLink([]);
      link.src = src;
      if (title) {
        savedLastIndex = linkPattern.lastIndex;
        link.appendChild(this.parseEmphasis(title));
        linkPattern.lastIndex = savedLastIndex;
      } else {
        link.appendChild(Node.createText(null, { value: src }));
      }
      result.push(link);

      previousLast = linkPattern.lastIndex;
    }

    if (linkPattern.lastIndex === 0 ||
        linkPattern.lastIndex !== text.length - 1)
      result.push(Node.createText(null, { value: text.substring(previousLast) }));

    return Node.createInlineContainer(result);
  },

  emphasizeElementByMarker: function (element, marker) {
    switch (marker) {
    case "*":
      return Node.createBold(element);
    case "/":
      return Node.createItalic(element);
    case "_":
      return Node.createUnderline(element);
    case "=":
    case "~":
      return Node.createCode(element);
    case "+":
      return Node.createDashed(element);
    }
  },

  buildEmphasisPattern: function () {
    return new RegExp(
      "([" + this.preEmphasis + "]|^|\r?\n)" +               // \1 => pre
        "([" + this.markers + "])" +                         // \2 => marker
        "([^" + this.borderForbidden + "]|" +                // \3 => body
        "[^" + this.borderForbidden + "]" +
        this.bodyRegexp +
        "[^" + this.borderForbidden + "])" +
        "\\2" +
        "([" + this.postEmphasis +"]|$|\r?\n)",              // \4 => post
        // flags
        "g"
    );
  }
};

if (typeof exports !== "undefined") {
  exports.Parser = Parser;
  exports.InlineParser = InlineParser;
}
