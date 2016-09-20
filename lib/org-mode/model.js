/**
 * @module model
 *
 * The model module provides the low-level, JSON-serializable tree structure that represents an org-mode document.
 */

/**
 * @typedef {Object} ModelNode
 * @property {string} type  - The type of node.
     Though we extend ModelNode when additional properties are needed, there are dozens of types of nodes with 
     different roles but the same structure. Thus, we specify the node type with this property.
 * @property {ModelNode[]} children - A (possibly empty) list of sub-nodes.
 * @todo Add properties for line number and cursor position tracking.
 */

/** 
 * 
 * @class {ModelNode}
 * @param {string} type - The type of node.
 * @param {ModelNode[]} children - A list of sub-nodes.
 */
function ModelNode(type, children) {
  this.type = type;
  this.children = [];

  if (children) {
    for (var i = 0, len = children.length; i < len; ++i) {
      this.children.push(children[i]);
    }
  }
}

/**
 * @typedef {Object} ModelDocument
 * @property {ModelNode[]} nodes - A list of nodes in the document.
 * @property {?string} title - The (optional) title of the document.
 * @property {?string} author - The (optional) author of the document.
 * @property {?string} email - The (optional) email of the document's author.
 * @property {Object<string, string>} directiveValues - A mapping of directive names to directive values for all 
    directives that the parser does not otherwise understand.
 * @todo Perhaps we will not need the options property? We will see as the new model evolves.
 * @property {Object} options - Parsing options.
 */

/** @class {ModelDocument} */
function ModelDocument() {
  this.nodes = [];
  this.title = null;
  this.author = null;
  this.email = null;
  this.directiveValues = {};
  this.options = {};
}

/**
 * @typedef {ModelNode} TextNode
 * @property {string} value - The text contents of the node.
 */

/**
 * @class {TextNode}
 * @param {string} value - The text contents of the node.
 */
function TextNode(value) {
  ModelNode.call(this, 'text', []);
  this.value = value;
}

/**
 * @typedef {ModelNode} LinkNode
 * @property {string} src - The URL that the link points to.
 */

/**
 * @class {LinkNode}
 * @property {string} src - The URL that the link points to.
 * @property {ModelNode[]} children - A list of sub-nodes.
 */
function LinkNode(children, src) {
  ModelNode.call(this, 'link', children);
  this.src = src;
}

/**
 * @typedef {ModelNode} HeaderNode
 * @property {number} depth - The depth of the header, starting at 1 for top-level headers.
 */

/**
 * @class {HeaderNode}
 * @param {number} level - The depth of the header, starting at 1 for top-level headers.
 * @param {ModelNode[]} children - A list of sub-nodes.
 */
function HeaderNode(children, level) {
  ModelNode.call(this, 'header', children);
  this.level = level;
}

/**
 * @typedef {ModelNode} DefinitionListElementNode
 * @property {string} term - The term being defined by this defintion.
 */

/**
 * @class {DefinitionListElementNode}
 * @param {string} term - The term being defined by this defintion.
 * @param {ModelNode[]} children - A list of sub-nodes.
 */
function DefinitionListElementNode(children, term) {
  ModelNode.call(this, 'definitionListElement', children);
  this.term = term;
}

/**
 * @typedef {ModelNode} DirectiveNode
 * @property {string} directiveName - The name of the directive used.
 * @property {string[]} directiveArguments - The list of arguments passed to the directive.
 * @property {string[]} directiveOptions - The list of options passed to the directive.
 * @property {string} directiveRawValue - The raw text of the directive.
 * @todo Once we link to the full text with cursor positions, the directiveRawValue property might be redundant.
 */

/**
 * @class {DirectiveNode}
 * @param {string} name - The name of the directive used.
 * @param {string[]} args - The list of arguments passed to the directive.
 * @param {string[]} options - The list of options passed to the directive.
 * @param {string} raw - The raw text of the directive.
 * @param {ModelNode[]} children - A list of sub-nodes.
 */
function DirectiveNode(children, name, args, options, raw) {
  ModelNode.call(this, 'directive', children);
  this.directiveName = name;
  this.directiveArguments = [];
  if (args) {
    for (var i = 0, len = args.length; i < len; ++i) {
      this.directiveArguments.push(args[i]);
    }
  }
  this.directiveOptions = [];
  if (options) {
    for (var i = 0, len = options.length; i < len; ++i) {
      this.directiveOptions.push(options[i]);
    }
  }
}
