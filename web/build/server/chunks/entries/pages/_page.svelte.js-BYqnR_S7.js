import { aj as attributes, am as clsx$1, ap as bind_props, aq as spread_props, ar as props_id, ad as derived, an as ensure_array_like, a3 as hasContext, a4 as getContext, a1 as setContext, a0 as run, as as clsx, at as ATTACHMENT_KEY, al as attr_class, ao as html, ai as escape_html, ak as stringify, a5 as getAllContexts } from '../../chunks/server.js-Dzkc9wbJ.js';
import { o as on } from '../../chunks/legacy-client.js-BYqIYKJq.js';
import { t as tick, m as mount, u as unmount } from '../../chunks/index-server.js-BPE5KZij.js';
import { c as cn } from '../../chunks/utils2.js-7mvaj0Jt.js';
import { c as createSubscriber, S as SvelteMap } from '../../chunks/index-server2.js-DgXQ8-9Q.js';
import { marked } from 'marked';
import '../../chunks/shared.js-CcLTIra1.js';
import '../../chunks/rolldown-runtime.js-pTpnEGsq.js';

// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
var COMMENT_REGEX = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

var NEWLINE_REGEX = /\n/g;
var WHITESPACE_REGEX = /^\s*/;

// declaration
var PROPERTY_REGEX = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/;
var COLON_REGEX = /^:\s*/;
var VALUE_REGEX = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/;
var SEMICOLON_REGEX = /^[;\s]*/;

// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
var TRIM_REGEX = /^\s+|\s+$/g;

// strings
var NEWLINE = '\n';
var FORWARD_SLASH = '/';
var ASTERISK = '*';
var EMPTY_STRING = '';

// types
var TYPE_COMMENT = 'comment';
var TYPE_DECLARATION = 'declaration';

/**
 * @param {String} style
 * @param {Object} [options]
 * @return {Object[]}
 * @throws {TypeError}
 * @throws {Error}
 */
function index (style, options) {
  if (typeof style !== 'string') {
    throw new TypeError('First argument must be a string');
  }

  if (!style) return [];

  options = options || {};

  /**
   * Positional.
   */
  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   *
   * @param {String} str
   */
  function updatePosition(str) {
    var lines = str.match(NEWLINE_REGEX);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf(NEWLINE);
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   *
   * @return {Function}
   */
  function position() {
    var start = { line: lineno, column: column };
    return function (node) {
      node.position = new Position(start);
      whitespace();
      return node;
    };
  }

  /**
   * Store position information for a node.
   *
   * @constructor
   * @property {Object} start
   * @property {Object} end
   * @property {undefined|String} source
   */
  function Position(start) {
    this.start = start;
    this.end = { line: lineno, column: column };
    this.source = options.source;
  }

  /**
   * Non-enumerable source string.
   */
  Position.prototype.content = style;

  /**
   * Error `msg`.
   *
   * @param {String} msg
   * @throws {Error}
   */
  function error(msg) {
    var err = new Error(
      options.source + ':' + lineno + ':' + column + ': ' + msg
    );
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = style;

    if (options.silent) ; else {
      throw err;
    }
  }

  /**
   * Match `re` and return captures.
   *
   * @param {RegExp} re
   * @return {undefined|Array}
   */
  function match(re) {
    var m = re.exec(style);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    style = style.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */
  function whitespace() {
    match(WHITESPACE_REGEX);
  }

  /**
   * Parse comments.
   *
   * @param {Object[]} [rules]
   * @return {Object[]}
   */
  function comments(rules) {
    var c;
    rules = rules || [];
    while ((c = comment())) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }

  /**
   * Parse comment.
   *
   * @return {Object}
   * @throws {Error}
   */
  function comment() {
    var pos = position();
    if (FORWARD_SLASH != style.charAt(0) || ASTERISK != style.charAt(1)) return;

    var i = 2;
    while (
      EMPTY_STRING != style.charAt(i) &&
      (ASTERISK != style.charAt(i) || FORWARD_SLASH != style.charAt(i + 1))
    ) {
      ++i;
    }
    i += 2;

    if (EMPTY_STRING === style.charAt(i - 1)) {
      return error('End of comment missing');
    }

    var str = style.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    style = style.slice(i);
    column += 2;

    return pos({
      type: TYPE_COMMENT,
      comment: str
    });
  }

  /**
   * Parse declaration.
   *
   * @return {Object}
   * @throws {Error}
   */
  function declaration() {
    var pos = position();

    // prop
    var prop = match(PROPERTY_REGEX);
    if (!prop) return;
    comment();

    // :
    if (!match(COLON_REGEX)) return error("property missing ':'");

    // val
    var val = match(VALUE_REGEX);

    var ret = pos({
      type: TYPE_DECLARATION,
      property: trim(prop[0].replace(COMMENT_REGEX, EMPTY_STRING)),
      value: val
        ? trim(val[0].replace(COMMENT_REGEX, EMPTY_STRING))
        : EMPTY_STRING
    });

    // ;
    match(SEMICOLON_REGEX);

    return ret;
  }

  /**
   * Parse declarations.
   *
   * @return {Object[]}
   */
  function declarations() {
    var decls = [];

    comments(decls);

    // declarations
    var decl;
    while ((decl = declaration())) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }

    return decls;
  }

  whitespace();
  return declarations();
}

/**
 * Trim `str`.
 *
 * @param {String} str
 * @return {String}
 */
function trim(str) {
  return str ? str.replace(TRIM_REGEX, EMPTY_STRING) : EMPTY_STRING;
}

/**
 * Parses inline style to object.
 *
 * @param style - Inline style.
 * @param iterator - Iterator.
 * @returns - Style object or null.
 *
 * @example Parsing inline style to object:
 *
 * ```js
 * import parse from 'style-to-object';
 * parse('line-height: 42;'); // { 'line-height': '42' }
 * ```
 */
function StyleToObject(style, iterator) {
    let styleObject = null;
    if (!style || typeof style !== 'string') {
        return styleObject;
    }
    const declarations = index(style);
    const hasIterator = typeof iterator === 'function';
    declarations.forEach((declaration) => {
        if (declaration.type !== 'declaration') {
            return;
        }
        const { property, value } = declaration;
        if (hasIterator) {
            iterator(property, value, declaration);
        }
        else if (value) {
            styleObject = styleObject || {};
            styleObject[property] = value;
        }
    });
    return styleObject;
}

/*!
* tabbable 6.5.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
// NOTE: separate `:not()` selectors has broader browser support than the newer
//  `:not([inert], [inert] *)` (Feb 2023)
var candidateSelectors = ['input:not([inert]):not([inert] *)', 'select:not([inert]):not([inert] *)', 'textarea:not([inert]):not([inert] *)', 'a[href]:not([inert]):not([inert] *)', 'area[href]:not([inert]):not([inert] *)', 'button:not([inert]):not([inert] *)', '[tabindex]:not(slot):not([inert]):not([inert] *)', 'audio[controls]:not([inert]):not([inert] *)', 'video[controls]:not([inert]):not([inert] *)', '[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)', 'details>summary:first-of-type:not([inert]):not([inert] *)', 'details:not([inert]):not([inert] *)'];
var candidateSelector = /* #__PURE__ */candidateSelectors.join(',');
var NoElement = typeof Element === 'undefined';
var matches = NoElement ? function () {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
var getRootNode = !NoElement && Element.prototype.getRootNode ? function (element) {
  var _element$getRootNode;
  return element === null || element === void 0 ? void 0 : (_element$getRootNode = element.getRootNode) === null || _element$getRootNode === void 0 ? void 0 : _element$getRootNode.call(element);
} : function (element) {
  return element === null || element === void 0 ? void 0 : element.ownerDocument;
};

/**
 * Determines if a node is inert or in an inert ancestor.
 * @param {Node} [node]
 * @param {boolean} [lookUp] If true and `node` is not inert, looks up at ancestors to
 *  see if any of them are inert. If false, only `node` itself is considered.
 * @returns {boolean} True if inert itself or by way of being in an inert ancestor.
 *  False if `node` is falsy.
 */
var _isInert = function isInert(node, lookUp) {
  var _node$getAttribute;
  if (lookUp === void 0) {
    lookUp = true;
  }
  // CAREFUL: JSDom does not support inert at all, so we can't use the `HTMLElement.inert`
  //  JS API property; we have to check the attribute, which can either be empty or 'true';
  //  if it's `null` (not specified) or 'false', it's an active element
  var inertAtt = node === null || node === void 0 ? void 0 : (_node$getAttribute = node.getAttribute) === null || _node$getAttribute === void 0 ? void 0 : _node$getAttribute.call(node, 'inert');
  var inert = inertAtt === '' || inertAtt === 'true';

  // NOTE: this could also be handled with `node.matches('[inert], :is([inert] *)')`
  //  if it weren't for `matches()` not being a function on shadow roots; the following
  //  code works for any kind of node
  var result = inert || lookUp && node && (
  // closest does not exist on shadow roots, so we fall back to a manual
  // lookup upward, in case it is not defined.
  typeof node.closest === 'function' ? node.closest('[inert]') : _isInert(node.parentNode));
  return result;
};

/**
 * Determines if a node's content is editable.
 * @param {Element} [node]
 * @returns True if it's content-editable; false if it's not or `node` is falsy.
 */
var isContentEditable = function isContentEditable(node) {
  var _node$getAttribute2;
  // CAREFUL: JSDom does not support the `HTMLElement.isContentEditable` API so we have
  //  to use the attribute directly to check for this, which can either be empty or 'true';
  //  if it's `null` (not specified) or 'false', it's a non-editable element
  var attValue = node === null || node === void 0 ? void 0 : (_node$getAttribute2 = node.getAttribute) === null || _node$getAttribute2 === void 0 ? void 0 : _node$getAttribute2.call(node, 'contenteditable');
  return attValue === '' || attValue === 'true';
};

/**
 * @param {Element} el container to check in
 * @param {boolean} includeContainer add container to check
 * @param {(node: Element) => boolean} filter filter candidates
 * @returns {Element[]}
 */
var getCandidates = function getCandidates(el, includeContainer, filter) {
  // even if `includeContainer=false`, we still have to check it for inertness because
  //  if it's inert (either by itself or via its parent), then all its children are inert
  if (_isInert(el)) {
    return [];
  }
  var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));
  if (includeContainer && matches.call(el, candidateSelector)) {
    candidates.unshift(el);
  }
  candidates = candidates.filter(filter);
  return candidates;
};

/**
 * @callback GetShadowRoot
 * @param {Element} element to check for shadow root
 * @returns {ShadowRoot|boolean} ShadowRoot if available or boolean indicating if a shadowRoot is attached but not available.
 */

/**
 * @callback ShadowRootFilter
 * @param {Element} shadowHostNode the element which contains shadow content
 * @returns {boolean} true if a shadow root could potentially contain valid candidates.
 */

/**
 * @typedef {Object} CandidateScope
 * @property {Element} scopeParent contains inner candidates
 * @property {Element[]} candidates list of candidates found in the scope parent
 */

/**
 * @typedef {Object} IterativeOptions
 * @property {GetShadowRoot|boolean} getShadowRoot true if shadow support is enabled; falsy if not;
 *  if a function, implies shadow support is enabled and either returns the shadow root of an element
 *  or a boolean stating if it has an undisclosed shadow root
 * @property {(node: Element) => boolean} filter filter candidates
 * @property {boolean} flatten if true then result will flatten any CandidateScope into the returned list
 * @property {ShadowRootFilter} shadowRootFilter filter shadow roots;
 */

/**
 * @param {Element[]} elements list of element containers to match candidates from
 * @param {boolean} includeContainer add container list to check
 * @param {IterativeOptions} options
 * @returns {Array.<Element|CandidateScope>}
 */
var _getCandidatesIteratively = function getCandidatesIteratively(elements, includeContainer, options) {
  var candidates = [];
  var elementsToCheck = Array.from(elements);
  while (elementsToCheck.length) {
    var element = elementsToCheck.shift();
    if (_isInert(element, false)) {
      // no need to look up since we're drilling down
      // anything inside this container will also be inert
      continue;
    }
    if (element.tagName === 'SLOT') {
      // add shadow dom slot scope (slot itself cannot be focusable)
      var assigned = element.assignedElements();
      var content = assigned.length ? assigned : element.children;
      var nestedCandidates = _getCandidatesIteratively(content, true, options);
      if (options.flatten) {
        candidates.push.apply(candidates, nestedCandidates);
      } else {
        candidates.push({
          scopeParent: element,
          candidates: nestedCandidates
        });
      }
    } else {
      // check candidate element
      var validCandidate = matches.call(element, candidateSelector);
      if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
        candidates.push(element);
      }

      // iterate over shadow content if possible
      var shadowRoot = element.shadowRoot ||
      // check for an undisclosed shadow
      typeof options.getShadowRoot === 'function' && options.getShadowRoot(element);

      // no inert look up because we're already drilling down and checking for inertness
      //  on the way down, so all containers to this root node should have already been
      //  vetted as non-inert
      var validShadowRoot = !_isInert(shadowRoot, false) && (!options.shadowRootFilter || options.shadowRootFilter(element));
      if (shadowRoot && validShadowRoot) {
        // add shadow dom scope IIF a shadow root node was given; otherwise, an undisclosed
        //  shadow exists, so look at light dom children as fallback BUT create a scope for any
        //  child candidates found because they're likely slotted elements (elements that are
        //  children of the web component element (which has the shadow), in the light dom, but
        //  slotted somewhere _inside_ the undisclosed shadow) -- the scope is created below,
        //  _after_ we return from this recursive call
        var _nestedCandidates = _getCandidatesIteratively(shadowRoot === true ? element.children : shadowRoot.children, true, options);
        if (options.flatten) {
          candidates.push.apply(candidates, _nestedCandidates);
        } else {
          candidates.push({
            scopeParent: element,
            candidates: _nestedCandidates
          });
        }
      } else {
        // there's not shadow so just dig into the element's (light dom) children
        //  __without__ giving the element special scope treatment
        elementsToCheck.unshift.apply(elementsToCheck, element.children);
      }
    }
  }
  return candidates;
};

/**
 * @private
 * Determines if the node has an explicitly specified `tabindex` attribute.
 * @param {HTMLElement} node
 * @returns {boolean} True if so; false if not.
 */
var hasTabIndex = function hasTabIndex(node) {
  return !isNaN(parseInt(node.getAttribute('tabindex'), 10));
};

/**
 * Determine the tab index of a given node.
 * @param {HTMLElement} node
 * @returns {number} Tab order (negative, 0, or positive number).
 * @throws {Error} If `node` is falsy.
 */
var getTabIndex = function getTabIndex(node) {
  if (!node) {
    throw new Error('No node provided');
  }
  if (node.tabIndex < 0) {
    // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
    // `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
    // yet they are still part of the regular tab order; in FF, they get a default
    // `tabIndex` of 0; since Chrome still puts those elements in the regular tab
    // order, consider their tab index to be 0.
    // Also browsers do not return `tabIndex` correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.
    if ((/^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || isContentEditable(node)) && !hasTabIndex(node)) {
      return 0;
    }
  }
  return node.tabIndex;
};

/**
 * Determine the tab index of a given node __for sort order purposes__.
 * @param {HTMLElement} node
 * @param {boolean} [isScope] True for a custom element with shadow root or slot that, by default,
 *  has tabIndex -1, but needs to be sorted by document order in order for its content to be
 *  inserted into the correct sort position.
 * @returns {number} Tab order (negative, 0, or positive number).
 */
var getSortOrderTabIndex = function getSortOrderTabIndex(node, isScope) {
  var tabIndex = getTabIndex(node);
  if (tabIndex < 0 && isScope && !hasTabIndex(node)) {
    return 0;
  }
  return tabIndex;
};
var sortOrderedTabbables = function sortOrderedTabbables(a, b) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
};
var isInput = function isInput(node) {
  return node.tagName === 'INPUT';
};
var isHiddenInput = function isHiddenInput(node) {
  return isInput(node) && node.type === 'hidden';
};
var isDetailsWithSummary = function isDetailsWithSummary(node) {
  var r = node.tagName === 'DETAILS' && Array.prototype.slice.apply(node.children).some(function (child) {
    return child.tagName === 'SUMMARY';
  });
  return r;
};
var getCheckedRadio = function getCheckedRadio(nodes, form) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].checked && nodes[i].form === form) {
      return nodes[i];
    }
  }
};
var isTabbableRadio = function isTabbableRadio(node) {
  if (!node.name) {
    return true;
  }
  var radioScope = node.form || getRootNode(node);
  var queryRadios = function queryRadios(name) {
    return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
  };
  var radioSet;
  if (typeof window !== 'undefined' && typeof window.CSS !== 'undefined' && typeof window.CSS.escape === 'function') {
    radioSet = queryRadios(window.CSS.escape(node.name));
  } else {
    try {
      radioSet = queryRadios(node.name);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s', err.message);
      return false;
    }
  }
  var checked = getCheckedRadio(radioSet, node.form);
  return !checked || checked === node;
};
var isRadio = function isRadio(node) {
  return isInput(node) && node.type === 'radio';
};
var isNonTabbableRadio = function isNonTabbableRadio(node) {
  return isRadio(node) && !isTabbableRadio(node);
};

// determines if a node is ultimately attached to the window's document
var isNodeAttached = function isNodeAttached(node) {
  var _nodeRoot;
  // The root node is the shadow root if the node is in a shadow DOM; some document otherwise
  //  (but NOT _the_ document; see second 'If' comment below for more).
  // If rootNode is shadow root, it'll have a host, which is the element to which the shadow
  //  is attached, and the one we need to check if it's in the document or not (because the
  //  shadow, and all nodes it contains, is never considered in the document since shadows
  //  behave like self-contained DOMs; but if the shadow's HOST, which is part of the document,
  //  is hidden, or is not in the document itself but is detached, it will affect the shadow's
  //  visibility, including all the nodes it contains). The host could be any normal node,
  //  or a custom element (i.e. web component). Either way, that's the one that is considered
  //  part of the document, not the shadow root, nor any of its children (i.e. the node being
  //  tested).
  // To further complicate things, we have to look all the way up until we find a shadow HOST
  //  that is attached (or find none) because the node might be in nested shadows...
  // If rootNode is not a shadow root, it won't have a host, and so rootNode should be the
  //  document (per the docs) and while it's a Document-type object, that document does not
  //  appear to be the same as the node's `ownerDocument` for some reason, so it's safer
  //  to ignore the rootNode at this point, and use `node.ownerDocument`. Otherwise,
  //  using `rootNode.contains(node)` will _always_ be true we'll get false-positives when
  //  node is actually detached.
  // NOTE: If `nodeRootHost` or `node` happens to be the `document` itself (which is possible
  //  if a tabbable/focusable node was quickly added to the DOM, focused, and then removed
  //  from the DOM as in https://github.com/focus-trap/focus-trap-react/issues/905), then
  //  `ownerDocument` will be `null`, hence the optional chaining on it.
  var nodeRoot = node && getRootNode(node);
  var nodeRootHost = (_nodeRoot = nodeRoot) === null || _nodeRoot === void 0 ? void 0 : _nodeRoot.host;

  // in some cases, a detached node will return itself as the root instead of a document or
  //  shadow root object, in which case, we shouldn't try to look further up the host chain
  var attached = false;
  if (nodeRoot && nodeRoot !== node) {
    var _nodeRootHost, _nodeRootHost$ownerDo, _node$ownerDocument;
    attached = !!((_nodeRootHost = nodeRootHost) !== null && _nodeRootHost !== void 0 && (_nodeRootHost$ownerDo = _nodeRootHost.ownerDocument) !== null && _nodeRootHost$ownerDo !== void 0 && _nodeRootHost$ownerDo.contains(nodeRootHost) || node !== null && node !== void 0 && (_node$ownerDocument = node.ownerDocument) !== null && _node$ownerDocument !== void 0 && _node$ownerDocument.contains(node));
    while (!attached && nodeRootHost) {
      var _nodeRoot2, _nodeRootHost2, _nodeRootHost2$ownerD;
      // since it's not attached and we have a root host, the node MUST be in a nested shadow DOM,
      //  which means we need to get the host's host and check if that parent host is contained
      //  in (i.e. attached to) the document
      nodeRoot = getRootNode(nodeRootHost);
      nodeRootHost = (_nodeRoot2 = nodeRoot) === null || _nodeRoot2 === void 0 ? void 0 : _nodeRoot2.host;
      attached = !!((_nodeRootHost2 = nodeRootHost) !== null && _nodeRootHost2 !== void 0 && (_nodeRootHost2$ownerD = _nodeRootHost2.ownerDocument) !== null && _nodeRootHost2$ownerD !== void 0 && _nodeRootHost2$ownerD.contains(nodeRootHost));
    }
  }
  return attached;
};
var isZeroArea = function isZeroArea(node) {
  var _node$getBoundingClie = node.getBoundingClientRect(),
    width = _node$getBoundingClie.width,
    height = _node$getBoundingClie.height;
  return width === 0 && height === 0;
};
var isHidden = function isHidden(node, _ref) {
  var displayCheck = _ref.displayCheck,
    getShadowRoot = _ref.getShadowRoot;
  if (displayCheck === 'full-native') {
    if ('checkVisibility' in node) {
      // Chrome >= 105, Edge >= 105, Firefox >= 106, Safari >= 17.4
      // @see https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility#browser_compatibility
      var visible = node.checkVisibility({
        // Checking opacity might be desirable for some use cases, but natively,
        // opacity zero elements _are_ focusable and tabbable.
        checkOpacity: false,
        opacityProperty: false,
        contentVisibilityAuto: true,
        visibilityProperty: true,
        // This is an alias for `visibilityProperty`. Contemporary browsers
        // support both. However, this alias has wider browser support (Chrome
        // >= 105 and Firefox >= 106, vs. Chrome >= 121 and Firefox >= 122), so
        // we include it anyway.
        checkVisibilityCSS: true
      });
      return !visible;
    }
    // Fall through to manual visibility checks
  }

  // NOTE: visibility will be `undefined` if node is detached from the document
  //  (see notes about this further down), which means we will consider it visible
  //  (this is legacy behavior from a very long way back)
  // NOTE: we check this regardless of `displayCheck="none"` because this is a
  //  _visibility_ check, not a _display_ check
  var _getComputedStyle = getComputedStyle(node),
    visibility = _getComputedStyle.visibility;
  if (visibility === 'hidden' || visibility === 'collapse') {
    return true;
  }
  var isDirectSummary = matches.call(node, 'details>summary:first-of-type');
  var nodeUnderDetails = isDirectSummary ? node.parentElement : node;
  if (matches.call(nodeUnderDetails, 'details:not([open]) *')) {
    return true;
  }
  if (!displayCheck || displayCheck === 'full' ||
  // full-native can run this branch when it falls through in case
  // Element#checkVisibility is unsupported
  displayCheck === 'full-native' || displayCheck === 'legacy-full') {
    if (typeof getShadowRoot === 'function') {
      // figure out if we should consider the node to be in an undisclosed shadow and use the
      //  'non-zero-area' fallback
      var originalNode = node;
      while (node) {
        var parentElement = node.parentElement;
        var rootNode = getRootNode(node);
        if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true // check if there's an undisclosed shadow
        ) {
          // node has an undisclosed shadow which means we can only treat it as a black box, so we
          //  fall back to a non-zero-area test
          return isZeroArea(node);
        } else if (node.assignedSlot) {
          // iterate up slot
          node = node.assignedSlot;
        } else if (!parentElement && rootNode !== node.ownerDocument) {
          // cross shadow boundary
          node = rootNode.host;
        } else {
          // iterate up normal dom
          node = parentElement;
        }
      }
      node = originalNode;
    }
    // else, `getShadowRoot` might be true, but all that does is enable shadow DOM support
    //  (i.e. it does not also presume that all nodes might have undisclosed shadows); or
    //  it might be a falsy value, which means shadow DOM support is disabled

    // Since we didn't find it sitting in an undisclosed shadow (or shadows are disabled)
    //  now we can just test to see if it would normally be visible or not, provided it's
    //  attached to the main document.
    // NOTE: We must consider case where node is inside a shadow DOM and given directly to
    //  `isTabbable()` or `isFocusable()` -- regardless of `getShadowRoot` option setting.

    if (isNodeAttached(node)) {
      // this works wherever the node is: if there's at least one client rect, it's
      //  somehow displayed; it also covers the CSS 'display: contents' case where the
      //  node itself is hidden in place of its contents; and there's no need to search
      //  up the hierarchy either
      return !node.getClientRects().length;
    }

    // Else, the node isn't attached to the document, which means the `getClientRects()`
    //  API will __always__ return zero rects (this can happen, for example, if React
    //  is used to render nodes onto a detached tree, as confirmed in this thread:
    //  https://github.com/facebook/react/issues/9117#issuecomment-284228870)
    //
    // It also means that even window.getComputedStyle(node).display will return `undefined`
    //  because styles are only computed for nodes that are in the document.
    //
    // NOTE: THIS HAS BEEN THE CASE FOR YEARS. It is not new, nor is it caused by tabbable
    //  somehow. Though it was never stated officially, anyone who has ever used tabbable
    //  APIs on nodes in detached containers has actually implicitly used tabbable in what
    //  was later (as of v5.2.0 on Apr 9, 2021) called `displayCheck="none"` mode -- essentially
    //  considering __everything__ to be visible because of the innability to determine styles.
    //
    // v6.0.0: As of this major release, the default 'full' option __no longer treats detached
    //  nodes as visible with the 'none' fallback.__
    if (displayCheck !== 'legacy-full') {
      return true; // hidden
    }
    // else, fallback to 'none' mode and consider the node visible
  } else if (displayCheck === 'non-zero-area') {
    // NOTE: Even though this tests that the node's client rect is non-zero to determine
    //  whether it's displayed, and that a detached node will __always__ have a zero-area
    //  client rect, we don't special-case for whether the node is attached or not. In
    //  this mode, we do want to consider nodes that have a zero area to be hidden at all
    //  times, and that includes attached or not.
    return isZeroArea(node);
  }

  // visible, as far as we can tell, or per current `displayCheck=none` mode, we assume
  //  it's visible
  return false;
};

// form fields (nested) inside a disabled fieldset are not focusable/tabbable
//  unless they are in the _first_ <legend> element of the top-most disabled
//  fieldset
var isDisabledFromFieldset = function isDisabledFromFieldset(node) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
    var parentNode = node.parentElement;
    // check if `node` is contained in a disabled <fieldset>
    while (parentNode) {
      if (parentNode.tagName === 'FIELDSET' && parentNode.disabled) {
        // look for the first <legend> among the children of the disabled <fieldset>
        for (var i = 0; i < parentNode.children.length; i++) {
          var child = parentNode.children.item(i);
          // when the first <legend> (in document order) is found
          if (child.tagName === 'LEGEND') {
            // if its parent <fieldset> is not nested in another disabled <fieldset>,
            // return whether `node` is a descendant of its first <legend>
            return matches.call(parentNode, 'fieldset[disabled] *') ? true : !child.contains(node);
          }
        }
        // the disabled <fieldset> containing `node` has no <legend>
        return true;
      }
      parentNode = parentNode.parentElement;
    }
  }

  // else, node's tabbable/focusable state should not be affected by a fieldset's
  //  enabled/disabled state
  return false;
};
var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable(options, node) {
  if (node.disabled || isHiddenInput(node) || isHidden(node, options) ||
  // For a details element with a summary, the summary element gets the focus
  isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
    return false;
  }
  return true;
};
var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable(options, node) {
  if (isNonTabbableRadio(node) || getTabIndex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
    return false;
  }
  return true;
};
var isShadowRootTabbable = function isShadowRootTabbable(shadowHostNode) {
  var tabIndex = parseInt(shadowHostNode.getAttribute('tabindex'), 10);
  if (isNaN(tabIndex) || tabIndex >= 0) {
    return true;
  }
  // If a custom element has an explicit negative tabindex,
  // browsers will not allow tab targeting said element's children.
  return false;
};

/**
 * @param {Array.<Element|CandidateScope>} candidates
 * @returns Element[]
 */
var _sortByOrder = function sortByOrder(candidates) {
  var regularTabbables = [];
  var orderedTabbables = [];
  candidates.forEach(function (item, i) {
    var isScope = !!item.scopeParent;
    var element = isScope ? item.scopeParent : item;
    var candidateTabindex = getSortOrderTabIndex(element, isScope);
    var elements = isScope ? _sortByOrder(item.candidates) : element;
    if (candidateTabindex === 0) {
      isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        item: item,
        isScope: isScope,
        content: elements
      });
    }
  });
  return orderedTabbables.sort(sortOrderedTabbables).reduce(function (acc, sortable) {
    sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
    return acc;
  }, []).concat(regularTabbables);
};
var tabbable = function tabbable(container, options) {
  options = options || {};
  var candidates;
  if (options.getShadowRoot) {
    candidates = _getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorTabbable.bind(null, options),
      flatten: false,
      getShadowRoot: options.getShadowRoot,
      shadowRootFilter: isShadowRootTabbable
    });
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
  }
  return _sortByOrder(candidates);
};
var focusable = function focusable(container, options) {
  options = options || {};
  var candidates;
  if (options.getShadowRoot) {
    candidates = _getCandidatesIteratively([container], options.includeContainer, {
      filter: isNodeMatchingSelectorFocusable.bind(null, options),
      flatten: true,
      getShadowRoot: options.getShadowRoot
    });
  } else {
    candidates = getCandidates(container, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
  }
  return candidates;
};
var focusableCandidateSelector = /* #__PURE__ */candidateSelectors.concat('iframe:not([inert]):not([inert] *)').join(',');
var isFocusable = function isFocusable(node, options) {
  options = options || {};
  if (!node) {
    throw new Error('No node provided');
  }
  if (matches.call(node, focusableCandidateSelector) === false) {
    return false;
  }
  return isNodeMatchingSelectorFocusable(options, node);
};

/**
 * Custom positioning reference element.
 * @see https://floating-ui.com/docs/virtual-elements
 */

const sides = ['top', 'right', 'bottom', 'left'];
const min = Math.min;
const max = Math.max;
const round = Math.round;
const createCoords = v => ({
  x: v,
  y: v
});
const oppositeSideMap = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
function clamp$1(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === 'function' ? value(param) : value;
}
function getSide(placement) {
  return placement.split('-')[0];
}
function getAlignment(placement) {
  return placement.split('-')[1];
}
function getOppositeAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}
function getAxisLength(axis) {
  return axis === 'y' ? 'height' : 'width';
}
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === 't' || firstChar === 'b' ? 'y' : 'x';
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.includes('start') ? placement.replace('start', 'end') : placement.replace('end', 'start');
}
const lrPlacement = ['left', 'right'];
const rlPlacement = ['right', 'left'];
const tbPlacement = ['top', 'bottom'];
const btPlacement = ['bottom', 'top'];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case 'top':
    case 'bottom':
      if (rtl) return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case 'left':
    case 'right':
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === 'start', rtl);
  if (alignment) {
    list = list.map(side => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  const side = getSide(placement);
  return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
  var _padding$top, _padding$right, _padding$bottom, _padding$left;
  return {
    top: (_padding$top = padding.top) != null ? _padding$top : 0,
    right: (_padding$right = padding.right) != null ? _padding$right : 0,
    bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
    left: (_padding$left = padding.left) != null ? _padding$left : 0
  };
}
function getPaddingObject(padding) {
  return typeof padding !== 'number' ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === 'y';
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case 'top':
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case 'bottom':
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case 'right':
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case 'left':
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  const alignment = getAlignment(placement);
  if (alignment) {
    coords[alignmentAxis] += commonAlign * (alignment === 'end' ? 1 : -1) * (rtl && isVertical ? -1 : 1);
  }
  return coords;
}

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = 'clippingAncestors',
    rootBoundary = 'viewport',
    elementContext = 'floating',
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === 'floating' ? 'reference' : 'floating';
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform.getClippingRect({
    element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === 'floating' ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
  const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) && (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}

// Maximum number of resets that can occur before bailing to avoid infinite reset loops.
const MAX_RESET_COUNT = 50;

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */
const computePosition$1 = async (reference, floating, config) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform
  } = config;
  const platformWithDetectOverflow = platform.detectOverflow ? platform : {
    ...platform,
    detectOverflow
  };
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
  let rects = await platform.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow$1 = options => ({
  name: 'arrow',
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform,
      elements,
      middlewareData
    } = state;
    // Since `element` is required, we don't Partial<> the type.
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform.getDimensions(element);
    const isYAxis = axis === 'y';
    const minProp = isYAxis ? 'top' : 'left';
    const maxProp = isYAxis ? 'bottom' : 'right';
    const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

    // DOM platform can return `window` as the `offsetParent`.
    if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;

    // If the padding is large enough that it causes the arrow to no longer be
    // centered, modify the padding so that it is centered.
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const max = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = clamp$1(minPadding, center, max);

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. To ensure `shift()` continues to take action,
    // a single reset is performed when this is true.
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < minPadding ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < minPadding ? center - minPadding : center - max : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset - alignmentOffset,
        ...(shouldAddOffset && {
          alignmentOffset
        })
      },
      reset: shouldAddOffset
    };
  }
});

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'flip',
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = 'bestFit',
        fallbackAxisSideDirection = 'none',
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);

      // If a reset by the arrow was caused due to an alignment offset being
      // added, we should skip any logic now since `flip()` has already done its
      // work.
      // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== 'none';
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform.detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides[0]], overflow[sides[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];

      // One or more sides is overflowing.
      if (!overflows.every(side => side <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === 'alignment' ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow ||
          // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every(d => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            // Try next placement and re-run the lifecycle.
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }

        // First, find the candidates that fit on the mainAxis side of overflow,
        // then find the placement that fits the best on the main crossAxis side.
        let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

        // Otherwise fallback.
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case 'bestFit':
              {
                var _overflowsData$filter2;
                const placement = (_overflowsData$filter2 = overflowsData.filter(d => {
                  if (hasFallbackAxisSideDirection) {
                    const currentSideAxis = getSideAxis(d.placement);
                    return currentSideAxis === initialSideAxis ||
                    // Create a bias to the `y` side axis due to horizontal
                    // reading directions favoring greater width.
                    currentSideAxis === 'y';
                  }
                  return true;
                }).map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                if (placement) {
                  resetPlacement = placement;
                }
                break;
              }
            case 'initialPlacement':
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};

function getSideOffsets(overflow, rect) {
  return {
    top: overflow.top - rect.height,
    right: overflow.right - rect.width,
    bottom: overflow.bottom - rect.height,
    left: overflow.left - rect.width
  };
}
function isAnySideFullyClipped(overflow) {
  return sides.some(side => overflow[side] >= 0);
}
/**
 * Provides data to hide the floating element in applicable situations, such as
 * when it is not in the same clipping context as the reference element.
 * @see https://floating-ui.com/docs/hide
 */
const hide$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'hide',
    options,
    async fn(state) {
      const {
        rects,
        platform
      } = state;
      const {
        strategy = 'referenceHidden',
        ...detectOverflowOptions
      } = evaluate(options, state);
      switch (strategy) {
        case 'referenceHidden':
          {
            const overflow = await platform.detectOverflow(state, {
              ...detectOverflowOptions,
              elementContext: 'reference'
            });
            const offsets = getSideOffsets(overflow, rects.reference);
            return {
              data: {
                referenceHiddenOffsets: offsets,
                referenceHidden: isAnySideFullyClipped(offsets)
              }
            };
          }
        case 'escaped':
          {
            const overflow = await platform.detectOverflow(state, {
              ...detectOverflowOptions,
              altBoundary: true
            });
            const offsets = getSideOffsets(overflow, rects.floating);
            return {
              data: {
                escapedOffsets: offsets,
                escaped: isAnySideFullyClipped(offsets)
              }
            };
          }
        default:
          {
            return {};
          }
      }
    }
  };
};

const originSides = /*#__PURE__*/new Set(['left', 'top']);

// For type backwards-compatibility, the `OffsetOptions` type was also
// Derivable.

async function convertValueToCoords(state, options) {
  const {
    placement,
    platform,
    elements
  } = state;
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === 'y';
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);

  // eslint-disable-next-line prefer-const
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === 'number' ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === 'number') {
    crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset$1 = function (options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: 'offset',
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);

      // If the placement is the same and the arrow caused an alignment offset
      // then we don't need to change the positioning coordinates.
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'shift',
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        platform
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: _ref => {
            let {
              x,
              y
            } = _ref;
            return {
              x,
              y
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await platform.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(placement);
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      const clampCoord = (axis, coord) => clamp$1(coord + overflow[axis === 'y' ? 'top' : 'left'], coord, coord - overflow[axis === 'y' ? 'bottom' : 'right']);
      if (checkMainAxis) {
        mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
      }
      if (checkCrossAxis) {
        crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};
/**
 * Built-in `limiter` that will stop `shift()` at a certain point.
 */
const limitShift$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    options,
    fn(state) {
      var _rawOffset$mainAxis, _rawOffset$crossAxis;
      const {
        x,
        y,
        placement,
        rects,
        middlewareData
      } = state;
      const {
        offset = 0,
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const crossAxis = getSideAxis(placement);
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      const rawOffset = evaluate(offset, state);
      const computedOffset = typeof rawOffset === 'number' ? {
        mainAxis: rawOffset,
        crossAxis: 0
      } : {
        mainAxis: (_rawOffset$mainAxis = rawOffset.mainAxis) != null ? _rawOffset$mainAxis : 0,
        crossAxis: (_rawOffset$crossAxis = rawOffset.crossAxis) != null ? _rawOffset$crossAxis : 0
      };
      if (checkMainAxis) {
        const len = mainAxis === 'y' ? 'height' : 'width';
        const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
        const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
        if (mainAxisCoord < limitMin) {
          mainAxisCoord = limitMin;
        } else if (mainAxisCoord > limitMax) {
          mainAxisCoord = limitMax;
        }
      }
      if (checkCrossAxis) {
        var _middlewareData$offse, _middlewareData$offse2;
        const len = mainAxis === 'y' ? 'width' : 'height';
        const isOriginSide = originSides.has(getSide(placement));
        const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
        const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
        if (crossAxisCoord < limitMin) {
          crossAxisCoord = limitMin;
        } else if (crossAxisCoord > limitMax) {
          crossAxisCoord = limitMax;
        }
      }
      return {
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      };
    }
  };
};

// Method syntax keeps callback parameters bivariant, but expressing the
// explicit `| undefined` required by `exactOptionalPropertyTypes` needs
// property syntax, which is contravariant under `strictFunctionTypes`.
// Extracting the function from a method position restores that bivariance so
// consumers can still assign callbacks with narrower parameter types.

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'size',
    options,
    async fn(state) {
      const {
        placement,
        rects,
        platform,
        elements
      } = state;
      const {
        apply = () => {},
        ...detectOverflowOptions
      } = evaluate(options, state);
      const overflow = await platform.detectOverflow(state, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === 'y';
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === 'top' || side === 'bottom') {
        heightSide = side;
        widthSide = alignment === ((await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))) ? 'start' : 'end') ? 'left' : 'right';
      } else {
        widthSide = side;
        heightSide = alignment === 'end' ? 'top' : 'bottom';
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const shiftData = state.middlewareData.shift;
      const noShift = !shiftData;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if (shiftData != null && shiftData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if (shiftData != null && shiftData.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        if (isYAxis) {
          availableWidth = width - 2 * max(overflow.left, overflow.right);
        } else {
          availableHeight = height - 2 * max(overflow.top, overflow.bottom);
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
};

function hasWindow() {
  return typeof window !== 'undefined';
}
function getNodeName(node) {
  if (isNode$1(node)) {
    return (node.nodeName || '').toLowerCase();
  }
  // Mocked nodes in testing environments may not be instances of Node. By
  // returning `#document` an infinite loop won't occur.
  // https://github.com/floating-ui/floating-ui/issues/2317
  return '#document';
}
function getWindow$1(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode$1(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode$1(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow$1(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow$1(value).Element;
}
function isHTMLElement$2(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow$1(value).HTMLElement;
}
function isShadowRoot$1(value) {
  if (!hasWindow() || typeof ShadowRoot === 'undefined') {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow$1(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle$1(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== 'inline' && display !== 'contents';
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
  try {
    if (element.matches(':popover-open')) {
      return true;
    }
  } catch (_e) {
    // no-op
  }
  try {
    return element.matches(':modal');
  } catch (_e) {
    return false;
  }
}
const willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
const containRe = /paint|layout|strict|content/;
const isNotNone = value => !!value && value !== 'none';
let isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  // https://drafts.csswg.org/css-transforms-2/#individual-transforms
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || '') || containRe.test(css.contain || '');
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement$2(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('-webkit-backdrop-filter', 'none');
  }
  return isWebKitValue;
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle$1(element) {
  return getWindow$1(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === 'html') {
    return node;
  }
  const result =
  // Step into the shadow DOM of the parent of a slotted node.
  node.assignedSlot ||
  // DOM Element detected.
  node.parentNode ||
  // ShadowRoot detected.
  isShadowRoot$1(node) && node.host ||
  // Fallback.
  getDocumentElement(node);
  return isShadowRoot$1(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return (node.ownerDocument || node).body;
  }
  if (isHTMLElement$2(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow$1(scrollableAncestor);
  if (isBody) {
    getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, []));
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

function getCssDimensions(element) {
  const css = getComputedStyle$1(element);
  // In testing environments, the `width` and `height` properties are empty
  // strings for SVG elements, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement$2(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}

function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}

function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement$2(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;

  // 0, NaN, or Infinity should always fallback to 1.

  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}

const noOffsets = /*#__PURE__*/createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow$1(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow$1(element);
}

function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement && offsetParent) {
    const win = getWindow$1(domElement);
    const offsetWin = isElement(offsetParent) ? getWindow$1(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle$1(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow$1(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}

// If <html> has a CSS width greater than the viewport, then this will be
// incorrect for RTL.
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}

function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}

function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === 'fixed';
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement$2(offsetParent);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}

function getClientRects(element) {
  return element.getClientRects ? Array.from(element.getClientRects()) : [];
}

// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function getDocumentRect(html) {
  const scroll = getNodeScroll(html);
  const body = html.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(html);
  const y = -scroll.scrollTop;
  if (getComputedStyle$1(body).direction === 'rtl') {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

// Safety check: ensure the scrollbar space is reasonable in case this
// calculation is affected by unusual styles.
// Most scrollbars leave 15-18px of space.
const SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy, rootBoundary) {
  if (rootBoundary === void 0) {
    rootBoundary = 'viewport';
  }
  const isLayoutViewport = rootBoundary === 'layoutViewport';
  const win = getWindow$1(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    // Client coordinates are relative to the layout viewport, except in
    // WebKit with an `absolute` strategy, where they are relative to the
    // visual viewport.
    const layoutRelativeClientCoords = !isWebKit() || strategy === 'fixed';
    if (isLayoutViewport) {
      if (!layoutRelativeClientCoords) {
        x = -visualViewport.offsetLeft;
        y = -visualViewport.offsetTop;
      }
    } else {
      width = visualViewport.width;
      height = visualViewport.height;
      if (layoutRelativeClientCoords) {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  // `scrollbar-gutter: stable` on the <html> reserves gutter space that shrinks
  // the visual width but isn't reflected in `html.clientWidth`, so subtract it.
  // Only the inline-end (right) gutter can hold the scrollbar; `both-edges` also
  // reserves an empty inline-start gutter that clips nothing, so exclude just
  // the one scrollbar-side gutter — halve the measured (two-gutter) total. A
  // left-side scrollbar (`windowScrollbarX > 0`) is already handled by
  // `getHTMLOffset`/`visualViewport.width`; skip it here.
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === 'CSS1Compat' ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    const gutter = getComputedStyle(html).scrollbarGutter === 'stable both-edges' ? reservedWidth / 2 : reservedWidth;
    if (gutter <= SCROLLBAR_MAX) {
      width -= gutter;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}

// Returns the inner client rect, subtracting scrollbars if present.
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = getScale(element);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === 'viewport' || clippingAncestor === 'layoutViewport') {
    rect = getViewportRect(element, strategy, clippingAncestor);
  } else if (clippingAncestor === 'document') {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}

// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, []).filter(el => isElement(el) && getNodeName(el) !== 'body');
  let lastKeptComputedStyle = null;
  const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
  let currentNode = elementIsFixed ? getParentNode(element) : element;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle$1(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    // Position of the containing block chain below the current node. A fixed
    // element whose containing block hasn't been found yet is a fixed chain.
    const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? 'fixed' : '';

    // A non-containing ancestor does not clip the element when the chain
    // below it escapes it: a fixed chain escapes all ancestors up to the
    // next containing block, an absolute chain escapes static ancestors.
    const shouldDropCurrentNode = !currentNodeIsContaining && (lastPosition === 'fixed' || lastPosition === 'absolute' && computedStyle.position === 'static');
    if (shouldDropCurrentNode) {
      // Drop non-containing blocks.
      result = result.filter(ancestor => ancestor !== currentNode);
    } else {
      // The kept node carries the chain position for the next iteration.
      lastKeptComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}

// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === 'clippingAncestors' ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right = firstRect.right;
  let bottom = firstRect.bottom;
  let left = firstRect.left;
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
    top = max(rect.top, top);
    right = min(rect.right, right);
    bottom = min(rect.bottom, bottom);
    left = max(rect.left, left);
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  };
}

function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}

function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement$2(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === 'fixed';
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }

  // If the <body> scrollbar appears on the left (e.g. RTL systems). Use
  // Firefox with layout.scrollbar.side = 3 in about:config to test this.
  if (!isOffsetParentAnElement && documentElement) {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}

function isStaticPositioned(element) {
  return getComputedStyle$1(element).position === 'static';
}

function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement$2(element) || getComputedStyle$1(element).position === 'fixed') {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;

  // Firefox returns the <html> element as the offsetParent if it's non-static,
  // while Chrome and Safari return the <body> element. The <body> element must
  // be used to perform the correct calculations even if the <html> element is
  // non-static.
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}

// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function getOffsetParent(element, polyfill) {
  const win = getWindow$1(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement$2(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}

const getElementRects = async function (data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};

function isRTL(element) {
  return getComputedStyle$1(element).direction === 'rtl';
}

const platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};

/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */
const offset = offset$1;

/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */
const shift = shift$1;

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip = flip$1;

/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */
const size = size$1;

/**
 * Provides data to hide the floating element in applicable situations, such as
 * when it is not in the same clipping context as the reference element.
 * @see https://floating-ui.com/docs/hide
 */
const hide = hide$1;

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow = arrow$1;

/**
 * Built-in `limiter` that will stop `shift()` at a certain point.
 */
const limitShift = limitShift$1;

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 */
const computePosition = (reference, floating, options) => {
  // This caches the expensive `getClippingElementAncestors` function so that
  // multiple lifecycle resets re-use the same result. It only lives for a
  // single call. If other functions become expensive, we can add them as well.
  const cache = new Map();
  const mergedOptions = options != null ? options : {};
  const platformWithCache = {
    ...platform,
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition$1(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// src/internal/join-class-value.ts
var isArray = Array.isArray;
var joinClassValue = (value) => {
  if (!value && value !== 0 && value !== 0n) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    if (value !== value) return "";
    return "" + value;
  }
  if (typeof value === "bigint") return "" + value;
  let result = "";
  if (isArray(value)) {
    const length = value.length;
    for (let index = 0; index < length; index++) {
      const item = value[index];
      if (!item && item !== 0 && item !== 0n) continue;
      const resolved = typeof item === "string" ? item : joinClassValue(item);
      if (resolved) {
        if (result) result += " ";
        result += resolved;
      }
    }
    return result;
  }
  if (typeof value === "object") {
    for (const key in value) {
      if (value[key]) {
        if (result) result += " ";
        result += key;
      }
    }
  }
  return result;
};

// src/utils.ts
var SPACE_REGEX = /\s+/g;
var isArray2 = Array.isArray;
var removeExtraSpaces = (str) => {
  if (typeof str !== "string" || !str) return str;
  return str.replace(SPACE_REGEX, " ").trim();
};
var stringNeedsNormalize = (str) => {
  const len = str.length;
  if (len === 0) return false;
  const first = str.charCodeAt(0);
  const last = str.charCodeAt(len - 1);
  if (first === 32 || last === 32 || first >= 9 && first <= 13 || first === 160 || last >= 9 && last <= 13 || last === 160) {
    return true;
  }
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code >= 9 && code <= 13 || code === 160) return true;
    if (code === 32 && i + 1 < len && str.charCodeAt(i + 1) === 32) return true;
  }
  return false;
};
var cx = (...classnames) => {
  const result = joinClassValue(classnames);
  if (!result) return void 0;
  return stringNeedsNormalize(result) ? removeExtraSpaces(result) : result;
};
var falsyToString = (value) => value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;
var isEmptyObject = (obj) => {
  if (!obj || typeof obj !== "object") return true;
  for (const _ in obj) return false;
  return true;
};
var isEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  const record1 = obj1;
  const record2 = obj2;
  const keys1 = Object.keys(record1);
  const keys2 = Object.keys(record2);
  if (keys1.length !== keys2.length) return false;
  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i];
    if (!keys2.includes(key)) return false;
    if (record1[key] !== record2[key]) return false;
  }
  return true;
};
var joinObjects = (obj1, obj2) => {
  const target = obj1;
  for (const key in obj2) {
    if (Object.hasOwn(obj2, key)) {
      const val2 = obj2[key];
      if (key in target) {
        target[key] = cx(target[key], val2);
      } else {
        target[key] = val2;
      }
    }
  }
  return obj1;
};
var flat = (arr, target) => {
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i];
    if (isArray2(el)) flat(el, target);
    else if (el) target.push(el);
  }
};
var flatMergeArrays = (...arrays) => {
  const result = [];
  flat(arrays, result);
  const filtered = [];
  for (let i = 0; i < result.length; i++) {
    if (result[i]) filtered.push(result[i]);
  }
  return filtered;
};
var mergeObjects = (obj1, obj2) => {
  const record1 = obj1;
  const record2 = obj2;
  const result = {};
  for (const key in record1) {
    const val1 = record1[key];
    if (key in record2) {
      const val2 = record2[key];
      if (isArray2(val1) || isArray2(val2)) {
        result[key] = flatMergeArrays(val2, val1);
      } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
        result[key] = mergeObjects(val1, val2);
      } else {
        result[key] = val2 + " " + val1;
      }
    } else {
      result[key] = val1;
    }
  }
  for (const key in record2) {
    if (!(key in record1)) {
      result[key] = record2[key];
    }
  }
  return result;
};

// src/internal/default-config.ts
var defaultConfig = {
  twMerge: true,
  twMergeConfig: {}
};

// src/internal/cache.ts
var VARIANT_CACHE_LIMIT = 256;
var OVERRIDE_CACHE_LIMIT = 128;
var CACHE_MISS = /* @__PURE__ */ Symbol("tv-cache-miss");
var hasClassOverride = (props) => (props == null ? void 0 : props.class) != null && props.class !== "" || (props == null ? void 0 : props.className) != null && props.className !== "";
var serializeFingerprintValue = (value) => {
  if (value === void 0) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value === 0 ? "0" : String(value);
  if (typeof value === "bigint") return String(value);
  const mapped = falsyToString(value);
  const mappedType = typeof mapped;
  if (mappedType === "string" || mappedType === "number" || mappedType === "boolean" || mappedType === "bigint") {
    return String(mapped);
  }
  if (mappedType === "object") {
    try {
      return JSON.stringify(mapped);
    } catch {
      return null;
    }
  }
  return null;
};
var appendSignatureValue = (out, value) => {
  if (value === void 0) return out;
  if (value === null) return out + "null";
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean" || type === "bigint") {
    return out + String(value);
  }
  if (Array.isArray(value)) {
    return out + value.join("\0");
  }
  try {
    return out + JSON.stringify(value);
  } catch {
    return out + "?";
  }
};
var buildPropsFingerprint = (variantKeys, defaultVariants, props, slotProps) => {
  let fingerprint = "";
  const seen = /* @__PURE__ */ Object.create(null);
  for (let i = 0; i < variantKeys.length; i++) {
    const key = variantKeys[i];
    seen[key] = 1;
    let value = defaultVariants[key];
    if (props && props[key] !== void 0) value = props[key];
    const serialized = serializeFingerprintValue(value);
    if (serialized === null) return null;
    fingerprint += key + ":" + serialized + ";";
  }
  const extras = [];
  for (const key in defaultVariants) {
    if (key === "class" || key === "className" || seen[key]) continue;
    seen[key] = 1;
    extras.push(key);
  }
  if (props) {
    for (const key in props) {
      if (key === "class" || key === "className" || seen[key] || props[key] === void 0) continue;
      seen[key] = 1;
      extras.push(key);
    }
  }
  if (extras.length > 1) extras.sort();
  for (let i = 0; i < extras.length; i++) {
    const key = extras[i];
    let value = defaultVariants[key];
    if (props && props[key] !== void 0) value = props[key];
    const serialized = serializeFingerprintValue(value);
    if (serialized === null) return null;
    fingerprint += key + ":" + serialized + ";";
  }
  return fingerprint;
};
var buildCompoundsSignature = (compoundVariants, compoundSlots) => {
  let signature = "";
  for (let i = 0; i < compoundVariants.length; i++) {
    const { conditionKeys, source } = compoundVariants[i];
    for (let j = 0; j < conditionKeys.length; j++) {
      const key = conditionKeys[j];
      signature += key + "=";
      signature = appendSignatureValue(signature, source[key]);
      signature += ",";
    }
    signature += "c=";
    signature = appendSignatureValue(signature, source.class);
    signature += "|cn=";
    signature = appendSignatureValue(signature, source.className);
    signature += ";";
  }
  for (let i = 0; i < compoundSlots.length; i++) {
    const { conditionKeys, source } = compoundSlots[i];
    for (let j = 0; j < conditionKeys.length; j++) {
      const key = conditionKeys[j];
      signature += key + "=";
      signature = appendSignatureValue(signature, source[key]);
      signature += ",";
    }
    if (Array.isArray(source.slots)) {
      signature += "slots=" + source.slots.join(",") + ",";
    }
    signature += "c=";
    signature = appendSignatureValue(signature, source.class);
    signature += "|cn=";
    signature = appendSignatureValue(signature, source.className);
    signature += ";";
  }
  return signature;
};
var createBoundedCache = (limit = VARIANT_CACHE_LIMIT) => {
  let primary = /* @__PURE__ */ new Map();
  let secondary = null;
  return {
    get(key) {
      if (primary.has(key)) return primary.get(key);
      if (secondary == null ? void 0 : secondary.has(key)) {
        const value = secondary.get(key);
        primary.set(key, value);
        return value;
      }
      return CACHE_MISS;
    },
    set(key, value) {
      if (primary.size >= limit) {
        secondary = primary;
        primary = /* @__PURE__ */ new Map();
      }
      primary.set(key, value);
    }
  };
};
var createResultCache = (limit = VARIANT_CACHE_LIMIT) => {
  const cache = createBoundedCache(limit);
  return {
    get(key) {
      return cache.get(key);
    },
    set(key, value) {
      cache.set(key, value);
    }
  };
};
var createNestedOverrideCache = (limit = OVERRIDE_CACHE_LIMIT) => {
  let primary = /* @__PURE__ */ new Map();
  let secondary = null;
  let size = 0;
  return {
    get(coreKey, overrideKey) {
      const primaryInner = primary.get(coreKey);
      if (primaryInner) {
        const value = primaryInner.get(overrideKey);
        if (value !== void 0 || primaryInner.has(overrideKey)) return value;
      }
      if (secondary) {
        const secondaryInner = secondary.get(coreKey);
        if (secondaryInner) {
          const value = secondaryInner.get(overrideKey);
          if (value !== void 0 || secondaryInner.has(overrideKey)) {
            let promoteInner = primary.get(coreKey);
            if (!promoteInner) {
              promoteInner = /* @__PURE__ */ new Map();
              primary.set(coreKey, promoteInner);
            }
            if (!promoteInner.has(overrideKey)) size++;
            promoteInner.set(overrideKey, value);
            return value;
          }
        }
      }
      return CACHE_MISS;
    },
    set(coreKey, overrideKey, value) {
      if (size >= limit) {
        secondary = primary;
        primary = /* @__PURE__ */ new Map();
        size = 0;
      }
      let inner = primary.get(coreKey);
      if (!inner) {
        inner = /* @__PURE__ */ new Map();
        primary.set(coreKey, inner);
      }
      if (!inner.has(overrideKey)) size++;
      inner.set(overrideKey, value);
    }
  };
};
var createLazyOverrideMerge = (cn, config) => {
  let cache = null;
  return (core, props) => {
    if (!hasClassOverride(props)) return core;
    const classVal = props.class;
    const classNameVal = props.className;
    if (classVal != null && classVal !== "" && typeof classVal !== "string" || classNameVal != null && classNameVal !== "" && typeof classNameVal !== "string") {
      return cn(config, core, classVal, classNameVal);
    }
    cache ??= createNestedOverrideCache();
    const coreKey = core ?? "";
    const overrideKey = (typeof classVal === "string" ? classVal : "") + "\0" + (typeof classNameVal === "string" ? classNameVal : "");
    const cached = cache.get(coreKey, overrideKey);
    if (cached !== CACHE_MISS) return cached;
    const merged = cn(config, core, classVal, classNameVal);
    cache.set(coreKey, overrideKey, merged);
    return merged;
  };
};

// src/internal/state.ts
function createState() {
  let cachedTwMerge = null;
  let cachedTwMergeConfig = {};
  let didTwMergeConfigChange = false;
  return {
    get cachedTwMerge() {
      return cachedTwMerge;
    },
    set cachedTwMerge(value) {
      cachedTwMerge = value;
    },
    get cachedTwMergeConfig() {
      return cachedTwMergeConfig;
    },
    set cachedTwMergeConfig(value) {
      cachedTwMergeConfig = value;
    },
    get didTwMergeConfigChange() {
      return didTwMergeConfigChange;
    },
    set didTwMergeConfigChange(value) {
      didTwMergeConfigChange = value;
    },
    reset() {
      cachedTwMerge = null;
      cachedTwMergeConfig = {};
      didTwMergeConfigChange = false;
    }
  };
}
var state = createState();

// src/internal/resolve-options.ts
var synchronizeTwMergeConfig = (config) => {
  if (!isEmptyObject(config.twMergeConfig) && !isEqual(config.twMergeConfig, state.cachedTwMergeConfig)) {
    state.didTwMergeConfigChange = true;
    state.cachedTwMergeConfig = config.twMergeConfig;
  }
};
var compileVariants = (variants, variantKeys) => {
  const compiledVariants = [];
  for (let i = 0; i < variantKeys.length; i++) {
    const key = variantKeys[i];
    const values = variants[key];
    compiledVariants.push({ key, values, isEmpty: isEmptyObject(values) });
  }
  return compiledVariants;
};
var compileCompoundVariants = (compoundVariants) => {
  if (!Array.isArray(compoundVariants) || compoundVariants.length === 0) return [];
  const result = [];
  for (let i = 0; i < compoundVariants.length; i++) {
    const compoundVariant = compoundVariants[i];
    const conditionKeys = [];
    for (const key in compoundVariant) {
      if (key !== "class" && key !== "className") {
        conditionKeys.push(key);
      }
    }
    result.push({ conditionKeys, source: compoundVariant });
  }
  return result;
};
var compileCompoundSlots = (compoundSlots) => {
  if (!Array.isArray(compoundSlots) || compoundSlots.length === 0) return [];
  const result = [];
  for (let i = 0; i < compoundSlots.length; i++) {
    const compoundSlot = compoundSlots[i];
    const conditionKeys = [];
    for (const key in compoundSlot) {
      if (key !== "slots" && key !== "class" && key !== "className") {
        conditionKeys.push(key);
      }
    }
    result.push({ conditionKeys, source: compoundSlot });
  }
  return result;
};
var indexCompoundSlotsBySlot = (compiledCompoundSlots) => {
  const index = {};
  for (let i = 0; i < compiledCompoundSlots.length; i++) {
    const compoundSlot = compiledCompoundSlots[i];
    const slots = compoundSlot.source.slots;
    if (!Array.isArray(slots)) continue;
    for (let j = 0; j < slots.length; j++) {
      const slotKey = slots[j];
      if (!index[slotKey]) index[slotKey] = [];
      index[slotKey].push(compoundSlot);
    }
  }
  return index;
};
var resolveOptions = (options, configProp) => {
  const {
    extend = null,
    slots: slotProps = {},
    variants: variantsProps = {},
    compoundVariants: compoundVariantsProps = [],
    compoundSlots: compoundSlotsProps = [],
    defaultVariants: defaultVariantsProps = {}
  } = options;
  const config = { ...defaultConfig, ...configProp };
  const hasSlots = options.slots !== void 0;
  const base = (extend == null ? void 0 : extend.base) ? cx(extend.base, options == null ? void 0 : options.base) : options == null ? void 0 : options.base;
  const variants = (extend == null ? void 0 : extend.variants) && !isEmptyObject(extend.variants) ? mergeObjects(variantsProps, extend.variants) : variantsProps;
  const defaultVariants = (extend == null ? void 0 : extend.defaultVariants) && !isEmptyObject(extend.defaultVariants) ? { ...extend.defaultVariants, ...defaultVariantsProps } : defaultVariantsProps;
  synchronizeTwMergeConfig(config);
  const isExtendedSlotsEmpty = !(extend == null ? void 0 : extend.slots) || isEmptyObject(extend.slots);
  const componentBase = hasSlots ? isExtendedSlotsEmpty && (extend == null ? void 0 : extend.base) ? cx(options == null ? void 0 : options.base, extend.base) : typeof (options == null ? void 0 : options.base) === "string" || (options == null ? void 0 : options.base) == null ? options.base : cx(options.base) : void 0;
  const componentSlots = hasSlots ? {
    base: componentBase,
    ...slotProps
  } : {};
  const slots = isExtendedSlotsEmpty ? componentSlots : joinObjects(
    { ...extend == null ? void 0 : extend.slots },
    isEmptyObject(componentSlots) ? { base: options == null ? void 0 : options.base } : componentSlots
  );
  const compoundVariants = !(extend == null ? void 0 : extend.compoundVariants) || isEmptyObject(extend.compoundVariants) ? compoundVariantsProps : flatMergeArrays(extend == null ? void 0 : extend.compoundVariants, compoundVariantsProps);
  const compoundSlots = !(extend == null ? void 0 : extend.compoundSlots) || isEmptyObject(extend.compoundSlots) ? compoundSlotsProps : flatMergeArrays(extend == null ? void 0 : extend.compoundSlots, compoundSlotsProps);
  const variantKeys = Object.keys(variants);
  const deferredError = compoundVariants && !Array.isArray(compoundVariants) ? new TypeError(
    `The "compoundVariants" prop must be an array. Received: ${typeof compoundVariants}`
  ) : compoundSlots && !Array.isArray(compoundSlots) ? new TypeError(
    `The "compoundSlots" prop must be an array. Received: ${typeof compoundSlots}`
  ) : null;
  const mode = hasSlots || !isExtendedSlotsEmpty ? "slots" : variantKeys.length === 0 ? "plain" : "variants";
  return {
    config,
    extend,
    base,
    variants,
    defaultVariants,
    slots,
    compoundVariants,
    compoundSlots,
    compiledVariants: null,
    compiledCompoundVariants: null,
    compiledCompoundSlots: null,
    compiledCompoundSlotsBySlot: null,
    deferredError,
    mode,
    slotKeys: null,
    variantKeys
  };
};
var compileResolvedOptions = (resolved) => {
  if (resolved.compiledVariants !== null) return resolved;
  resolved.compiledVariants = compileVariants(resolved.variants, resolved.variantKeys);
  resolved.compiledCompoundVariants = compileCompoundVariants(resolved.compoundVariants);
  resolved.compiledCompoundSlots = compileCompoundSlots(resolved.compoundSlots);
  resolved.compiledCompoundSlotsBySlot = indexCompoundSlotsBySlot(resolved.compiledCompoundSlots);
  resolved.slotKeys = resolved.slots && typeof resolved.slots === "object" ? Object.keys(resolved.slots) : [];
  return resolved;
};

// src/internal/class-resolver.ts
var EMPTY_ARRAY = [];
var variantClassesScratch = [];
var compoundClassesScratch = [];
var compoundVariantBySlotScratch = [];
var compoundSlotClassesScratch = [];
var getCompleteProps = (defaultVariants, props, slotProps) => {
  const result = {};
  for (const key in defaultVariants) {
    result[key] = defaultVariants[key];
  }
  if (props) {
    for (const key in props) {
      if (props[key] !== void 0) result[key] = props[key];
    }
  }
  if (slotProps) {
    for (const key in slotProps) {
      if (slotProps[key] !== void 0) result[key] = slotProps[key];
    }
  }
  return result;
};
var isNullishOrFalse = (value) => value == null || value === false;
var matchesCompoundValue = (expected, actual) => {
  if (!Array.isArray(expected)) {
    return expected === actual || isNullishOrFalse(expected) && isNullishOrFalse(actual);
  }
  for (let i = 0; i < expected.length; i++) {
    const expectedValue = expected[i];
    if (expectedValue === actual || isNullishOrFalse(expectedValue) && isNullishOrFalse(actual)) {
      return true;
    }
  }
  return false;
};
var getVariantValue = (variant, defaultVariants, props, slotProps) => {
  if (variant.isEmpty) return null;
  const variantProp = (slotProps == null ? void 0 : slotProps[variant.key]) ?? (props == null ? void 0 : props[variant.key]);
  if (variantProp === null) return null;
  const variantKey = falsyToString(variantProp);
  if (typeof variantKey === "object") return null;
  const defaultVariantProp = defaultVariants == null ? void 0 : defaultVariants[variant.key];
  const key = variantKey != null ? variantKey : falsyToString(defaultVariantProp);
  return variant.values[key || "false"];
};
var matchesConditions = (compound, completeProps) => {
  const { conditionKeys, source } = compound;
  for (let i = 0; i < conditionKeys.length; i++) {
    const key = conditionKeys[i];
    if (!matchesCompoundValue(source[key], completeProps[key])) return false;
  }
  return true;
};
var pushCompoundClassForSlot = (result, slotKey, classValue) => {
  if (typeof classValue === "string") {
    if (slotKey === "base") result.push(classValue);
  } else if (classValue && typeof classValue === "object" && classValue[slotKey]) {
    result.push(classValue[slotKey]);
  }
};
var getVariantClassNames = (variants, defaultVariants, props) => {
  const result = variantClassesScratch;
  result.length = 0;
  for (let i = 0; i < variants.length; i++) {
    const value = getVariantValue(variants[i], defaultVariants, props);
    if (value) result.push(value);
  }
  return result;
};
var getVariantClassNamesBySlot = (slotKey, variants, defaultVariants, props, slotProps) => {
  const result = variantClassesScratch;
  result.length = 0;
  for (let i = 0; i < variants.length; i++) {
    const variantValue = getVariantValue(variants[i], defaultVariants, props, slotProps);
    const value = slotKey === "base" && typeof variantValue === "string" ? variantValue : variantValue && variantValue[slotKey];
    if (value) result.push(value);
  }
  return result;
};
var getCompoundVariantClasses = (compoundVariants, completeProps) => {
  const result = compoundClassesScratch;
  result.length = 0;
  for (let i = 0; i < compoundVariants.length; i++) {
    const compoundVariant = compoundVariants[i];
    if (!matchesConditions(compoundVariant, completeProps)) continue;
    if (compoundVariant.source.class) result.push(compoundVariant.source.class);
    if (compoundVariant.source.className) result.push(compoundVariant.source.className);
  }
  return result;
};
var getCompoundVariantClassesBySlot = (slotKey, compoundVariants, completeProps) => {
  const result = compoundVariantBySlotScratch;
  result.length = 0;
  for (let i = 0; i < compoundVariants.length; i++) {
    const compoundVariant = compoundVariants[i];
    if (!matchesConditions(compoundVariant, completeProps)) continue;
    pushCompoundClassForSlot(result, slotKey, compoundVariant.source.class);
    pushCompoundClassForSlot(result, slotKey, compoundVariant.source.className);
  }
  return result;
};
var getCompoundSlotClasses = (compoundSlotsForKey, completeProps) => {
  const result = compoundSlotClassesScratch;
  result.length = 0;
  for (let i = 0; i < compoundSlotsForKey.length; i++) {
    const compoundSlot = compoundSlotsForKey[i];
    if (!matchesConditions(compoundSlot, completeProps)) continue;
    if (compoundSlot.source.class) result.push(compoundSlot.source.class);
    if (compoundSlot.source.className) result.push(compoundSlot.source.className);
  }
  return result;
};
var createPlainResolver = (resolved, cn) => {
  const { base, config } = resolved;
  let core = CACHE_MISS;
  const mergeOverride = createLazyOverrideMerge(cn, config);
  return ((props) => {
    if (core === CACHE_MISS) {
      core = cn(config, base);
    }
    return mergeOverride(core, props);
  });
};
var createVariantResolver = (resolved, cn) => {
  const { base, config, defaultVariants, deferredError, variantKeys } = resolved;
  let compiledCompoundVariants = resolved.compiledCompoundVariants;
  let compiledVariants = resolved.compiledVariants;
  let compiledCompoundSlots = EMPTY_ARRAY;
  let cache = null;
  const mergeOverride = createLazyOverrideMerge(cn, config);
  let coldInvokesRemaining = 1;
  const computeCore = (props) => {
    const compoundClasses = compiledCompoundVariants.length > 0 ? getCompoundVariantClasses(
      compiledCompoundVariants,
      getCompleteProps(defaultVariants, props)
    ) : void 0;
    return cn(
      config,
      base,
      getVariantClassNames(compiledVariants, defaultVariants, props),
      compoundClasses
    );
  };
  return ((props) => {
    if (deferredError) throw deferredError;
    if (compiledVariants === null || compiledCompoundVariants === null) {
      compileResolvedOptions(resolved);
      compiledVariants = resolved.compiledVariants;
      compiledCompoundVariants = resolved.compiledCompoundVariants;
      compiledCompoundSlots = resolved.compiledCompoundSlots ?? EMPTY_ARRAY;
    }
    let core;
    if (coldInvokesRemaining > 0) {
      coldInvokesRemaining--;
      core = computeCore(props);
    } else {
      cache ??= createResultCache();
      const propsFingerprint = buildPropsFingerprint(variantKeys, defaultVariants, props);
      if (propsFingerprint !== null) {
        const compoundsSig = compiledCompoundVariants.length > 0 || compiledCompoundSlots.length > 0 ? buildCompoundsSignature(compiledCompoundVariants, compiledCompoundSlots) : "";
        const cacheKey = propsFingerprint + "#" + compoundsSig;
        const cached = cache.get(cacheKey);
        if (cached !== CACHE_MISS) {
          core = cached;
        } else {
          core = computeCore(props);
          cache.set(cacheKey, core);
        }
      } else {
        core = computeCore(props);
      }
    }
    return mergeOverride(core, props);
  });
};
var createSlotsResolver = (resolved, cn) => {
  const { config, defaultVariants, deferredError, slots, variantKeys } = resolved;
  let compoundVariants = null;
  let compoundSlots = null;
  let keys = null;
  let slotComputers = null;
  let hasCompounds = false;
  let mergeOverride = null;
  let parentCache = null;
  let coldParentInvokesRemaining = 1;
  const ensureCompiled = () => {
    if (keys !== null) return;
    if (resolved.compiledVariants === null || resolved.compiledCompoundVariants === null || resolved.compiledCompoundSlots === null || resolved.compiledCompoundSlotsBySlot === null || resolved.slotKeys === null) {
      compileResolvedOptions(resolved);
    }
    const variants = resolved.compiledVariants;
    compoundVariants = resolved.compiledCompoundVariants;
    compoundSlots = resolved.compiledCompoundSlots;
    const compoundSlotsBySlot = resolved.compiledCompoundSlotsBySlot;
    keys = resolved.slotKeys;
    hasCompounds = compoundVariants.length > 0 || compoundSlots.length > 0;
    mergeOverride = createLazyOverrideMerge(cn, config);
    const computers = new Array(keys.length);
    for (let i = 0; i < keys.length; i++) {
      const slotKey = keys[i];
      const compoundSlotsForKey = compoundSlotsBySlot[slotKey] ?? EMPTY_ARRAY;
      computers[i] = (propsRef, slotProps) => {
        const completeProps = hasCompounds ? getCompleteProps(defaultVariants, propsRef, slotProps) : void 0;
        const compoundVariantClasses = completeProps ? getCompoundVariantClassesBySlot(slotKey, compoundVariants, completeProps) : void 0;
        const compoundSlotClasses = completeProps ? getCompoundSlotClasses(compoundSlotsForKey, completeProps) : void 0;
        return cn(
          config,
          slots[slotKey],
          getVariantClassNamesBySlot(slotKey, variants, defaultVariants, propsRef, slotProps),
          compoundVariantClasses,
          compoundSlotClasses
        );
      };
    }
    slotComputers = computers;
  };
  const createSlotsResult = (props) => {
    const slotKeys = keys;
    const computers = slotComputers;
    const overrideMerge = mergeOverride;
    const result = {};
    for (let i = 0; i < slotKeys.length; i++) {
      const compute = computers[i];
      const core = compute(props);
      result[slotKeys[i]] = (slotProps) => {
        if (slotProps == null) return core;
        let hasVariantOverride = false;
        for (const key in slotProps) {
          if (key === "class" || key === "className") continue;
          if (slotProps[key] !== void 0) {
            hasVariantOverride = true;
            break;
          }
        }
        if (!hasVariantOverride) {
          return overrideMerge(core, slotProps);
        }
        return overrideMerge(compute(props, slotProps), slotProps);
      };
    }
    return result;
  };
  return ((props) => {
    if (deferredError) throw deferredError;
    ensureCompiled();
    if (coldParentInvokesRemaining > 0) {
      coldParentInvokesRemaining--;
      return createSlotsResult(props);
    }
    const propsFingerprint = buildPropsFingerprint(variantKeys, defaultVariants, props);
    if (propsFingerprint === null) {
      return createSlotsResult(props);
    }
    const compoundsSig = hasCompounds ? buildCompoundsSignature(compoundVariants, compoundSlots) : "";
    const cacheKey = propsFingerprint + "#" + compoundsSig;
    parentCache ??= createBoundedCache();
    const cached = parentCache.get(cacheKey);
    if (cached !== CACHE_MISS) return cached;
    const next = createSlotsResult(props);
    parentCache.set(cacheKey, next);
    return next;
  });
};
var createClassResolver = (resolved, cn) => {
  if (resolved.mode === "plain") return createPlainResolver(resolved, cn);
  let resolver;
  return ((props) => {
    resolver ??= resolved.mode === "slots" ? createSlotsResolver(resolved, cn) : createVariantResolver(resolved, cn);
    return resolver(props);
  });
};

// src/internal/tv.ts
var attachComponentMetadata = (component, resolved) => {
  component.variantKeys = resolved.variantKeys;
  component.extend = resolved.extend;
  component.base = resolved.base;
  component.slots = resolved.slots;
  component.variants = resolved.variants;
  component.defaultVariants = resolved.defaultVariants;
  component.compoundSlots = resolved.compoundSlots;
  component.compoundVariants = resolved.compoundVariants;
};
var getTailwindVariants = (cn) => {
  const tv = (options, configProp) => {
    const resolved = resolveOptions(options, configProp);
    const component = createClassResolver(resolved, cn);
    attachComponentMetadata(component, resolved);
    return component;
  };
  const createTV = (configProp) => {
    return (options, config) => tv(options, config ? mergeObjects(configProp, config) : configProp);
  };
  return {
    tv,
    createTV
  };
};

// src/internal/merge/class-group-utils.ts
var concatArrays = (array1, array2) => {
  const length1 = array1.length;
  const length2 = array2.length;
  const combined = new Array(length1 + length2);
  for (let i = 0; i < length1; i++) combined[i] = array1[i];
  for (let i = 0; i < length2; i++) combined[length1 + i] = array2[i];
  return combined;
};
var createClassValidatorObject = (classGroupId, validator) => ({
  classGroupId,
  validator
});
var createClassPartObject = (nextPart = /* @__PURE__ */ new Map(), validators = null, classGroupId) => ({
  nextPart,
  validators,
  classGroupId
});
var CLASS_PART_SEPARATOR = "-";
var EMPTY_CONFLICTS = [];
var ARBITRARY_PROPERTY_PREFIX = "arbitrary..";
var createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const { conflictingClassGroups, conflictingClassGroupModifiers } = config;
  const getClassGroupId = (className) => {
    if (className[0] === "[" && className[className.length - 1] === "]") {
      return getGroupIdForArbitraryProperty(className);
    }
    const classParts = className.split(CLASS_PART_SEPARATOR);
    const startIndex = classParts[0] === "" && classParts.length > 1 ? 1 : 0;
    return getGroupRecursive(classParts, startIndex, classMap);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    if (hasPostfixModifier) {
      const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
      const baseConflicts = conflictingClassGroups[classGroupId];
      if (modifierConflicts) {
        if (baseConflicts) {
          return concatArrays(baseConflicts, modifierConflicts);
        }
        return modifierConflicts;
      }
      return baseConflicts || EMPTY_CONFLICTS;
    }
    return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
var getGroupRecursive = (classParts, startIndex, classPartObject) => {
  const classPathsLength = classParts.length - startIndex;
  if (classPathsLength === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[startIndex];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  if (nextClassPartObject) {
    const result = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
    if (result) return result;
  }
  const validators = classPartObject.validators;
  if (validators === null) {
    return void 0;
  }
  const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
  const validatorsLength = validators.length;
  for (let index = 0; index < validatorsLength; index++) {
    const validatorObject = validators[index];
    if (validatorObject.validator(classRest)) {
      return validatorObject.classGroupId;
    }
  }
  return void 0;
};
var getGroupIdForArbitraryProperty = (className) => {
  const content = className.slice(1, -1);
  const colonIndex = content.indexOf(":");
  if (colonIndex === -1) {
    return void 0;
  }
  const property = content.slice(0, colonIndex);
  return property ? ARBITRARY_PROPERTY_PREFIX + property : void 0;
};
var createClassMap = (config) => {
  const { theme, classGroups } = config;
  return processClassGroups(classGroups, theme);
};
var processClassGroups = (classGroups, theme) => {
  const classMap = createClassPartObject();
  for (const classGroupId in classGroups) {
    const group = classGroups[classGroupId];
    processClassesRecursively(group, classMap, classGroupId, theme);
  }
  return classMap;
};
var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
  const length = classGroup.length;
  for (let index = 0; index < length; index++) {
    const classDefinition = classGroup[index];
    processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
  }
};
var processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (typeof classDefinition === "string") {
    processStringDefinition(classDefinition, classPartObject, classGroupId);
    return;
  }
  if (typeof classDefinition === "function") {
    processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
    return;
  }
  processObjectDefinition(
    classDefinition,
    classPartObject,
    classGroupId,
    theme
  );
};
var processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
  const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
  classPartObjectToEdit.classGroupId = classGroupId;
};
var processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (isThemeGetter(classDefinition)) {
    processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
    return;
  }
  if (classPartObject.validators === null) {
    classPartObject.validators = [];
  }
  classPartObject.validators.push(
    createClassValidatorObject(classGroupId, classDefinition)
  );
};
var processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  const entries = Object.entries(classDefinition);
  const length = entries.length;
  for (let index = 0; index < length; index++) {
    const [key, value] = entries[index];
    processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
  }
};
var getPart = (classPartObject, path) => {
  let current = classPartObject;
  const parts = path.split(CLASS_PART_SEPARATOR);
  const length = parts.length;
  for (let index = 0; index < length; index++) {
    const part = parts[index];
    let next = current.nextPart.get(part);
    if (!next) {
      next = createClassPartObject();
      current.nextPart.set(part, next);
    }
    current = next;
  }
  return current;
};
var isThemeGetter = (classDefinition) => "isThemeGetter" in classDefinition && classDefinition.isThemeGetter === true;

// src/internal/merge/parse-class-name.ts
var IMPORTANT_MODIFIER = "!";
var CHAR_MODIFIER_SEPARATOR = 58;
var CHAR_POSTFIX_SEPARATOR = 47;
var CHAR_OPEN_BRACKET = 91;
var CHAR_CLOSE_BRACKET = 93;
var CHAR_OPEN_PAREN = 40;
var CHAR_CLOSE_PAREN = 41;
var CHAR_IMPORTANT = 33;
var createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition) => ({
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal: void 0
});
var parseClassName = (className) => {
  const modifiers = [];
  let bracketDepth = 0;
  let parenDepth = 0;
  let modifierStart = 0;
  let postfixModifierPosition;
  const len = className.length;
  for (let index = 0; index < len; index++) {
    const charCode = className.charCodeAt(index);
    if (bracketDepth === 0 && parenDepth === 0) {
      if (charCode === CHAR_MODIFIER_SEPARATOR) {
        modifiers.push(className.slice(modifierStart, index));
        modifierStart = index + 1;
        continue;
      }
      if (charCode === CHAR_POSTFIX_SEPARATOR) {
        postfixModifierPosition = index;
        continue;
      }
    }
    if (charCode === CHAR_OPEN_BRACKET) bracketDepth++;
    else if (charCode === CHAR_CLOSE_BRACKET) bracketDepth--;
    else if (charCode === CHAR_OPEN_PAREN) parenDepth++;
    else if (charCode === CHAR_CLOSE_PAREN) parenDepth--;
  }
  const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
  let baseClassName = baseClassNameWithImportantModifier;
  let hasImportantModifier = false;
  const lastIndex = baseClassNameWithImportantModifier.length - 1;
  if (baseClassNameWithImportantModifier.charCodeAt(lastIndex) === CHAR_IMPORTANT) {
    baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
    hasImportantModifier = true;
  } else if (
    // Tailwind CSS v3: important modifier at the start of the base class (legacy).
    baseClassNameWithImportantModifier.charCodeAt(0) === CHAR_IMPORTANT
  ) {
    baseClassName = baseClassNameWithImportantModifier.slice(1);
    hasImportantModifier = true;
  }
  const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
  return createResultObject(
    modifiers,
    hasImportantModifier,
    baseClassName,
    maybePostfixModifierPosition
  );
};

// src/internal/merge/sort-modifiers.ts
var createSortModifiers = (config) => {
  const orderSensitiveModifiers = new Set(config.orderSensitiveModifiers);
  return (modifiers) => {
    const result = [];
    let currentSegment = [];
    for (let index = 0; index < modifiers.length; index++) {
      const modifier = modifiers[index];
      const isArbitrary = modifier[0] === "[";
      const isOrderSensitive = orderSensitiveModifiers.has(modifier);
      if (isArbitrary || isOrderSensitive) {
        if (currentSegment.length > 0) {
          currentSegment.sort();
          for (let segmentIndex = 0; segmentIndex < currentSegment.length; segmentIndex++) {
            result.push(currentSegment[segmentIndex]);
          }
          currentSegment = [];
        }
        result.push(modifier);
      } else {
        currentSegment.push(modifier);
      }
    }
    if (currentSegment.length > 0) {
      currentSegment.sort();
      for (let segmentIndex = 0; segmentIndex < currentSegment.length; segmentIndex++) {
        result.push(currentSegment[segmentIndex]);
      }
    }
    return result;
  };
};

// src/internal/merge/config-utils.ts
var EXTERNAL_DESCRIPTOR = { isExternal: true, classId: -1, conflictIds: [] };
var DESCRIPTOR_CACHE_SIZE = 4096;
var MAX_CONFLICT_KEYS = 16384;
var createConfigUtils = (config) => {
  const sortModifiers = createSortModifiers(config);
  const postfixLookupClassGroupIds = createPostfixLookupClassGroupIds(config);
  const { getClassGroupId, getConflictingClassGroupIds } = createClassGroupUtils(config);
  let descriptorCache = /* @__PURE__ */ Object.create(null);
  let previousDescriptorCache = /* @__PURE__ */ Object.create(null);
  let descriptorCacheSize = 0;
  let claimedGeneration = new Int32Array(256);
  let currentGeneration = 0;
  let keepFlags = new Uint8Array(64);
  let splitSawNonSpaceWhitespace = false;
  const splitClassList = (classList) => {
    const tokens = [];
    const length = classList.length;
    let tokenStart = -1;
    splitSawNonSpaceWhitespace = false;
    for (let index = 0; index < length; index++) {
      const charCode = classList.charCodeAt(index);
      if (charCode === 32) {
        if (tokenStart !== -1) {
          tokens.push(classList.slice(tokenStart, index));
          tokenStart = -1;
        }
      } else if (charCode >= 9 && charCode <= 13) {
        splitSawNonSpaceWhitespace = true;
        if (tokenStart !== -1) {
          tokens.push(classList.slice(tokenStart, index));
          tokenStart = -1;
        }
      } else if (tokenStart === -1) {
        tokenStart = index;
      }
    }
    if (tokenStart !== -1) {
      tokens.push(classList.slice(tokenStart));
    }
    return tokens;
  };
  const conflictKeyIds = /* @__PURE__ */ new Map();
  let nextConflictKeyId = 0;
  const internConflictKey = (conflictKey) => {
    let id = conflictKeyIds.get(conflictKey);
    if (id === void 0) {
      id = nextConflictKeyId++;
      conflictKeyIds.set(conflictKey, id);
      if (id >= claimedGeneration.length) {
        const grown = new Int32Array(claimedGeneration.length * 2);
        grown.set(claimedGeneration);
        claimedGeneration = grown;
      }
    }
    return id;
  };
  const computeClassDescriptor = (originalClassName) => {
    const {
      isExternal,
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    if (isExternal) {
      return EXTERNAL_DESCRIPTOR;
    }
    let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
    let classGroupId;
    if (hasPostfixModifier) {
      const baseClassNameWithoutPostfix = baseClassName.substring(0, maybePostfixModifierPosition);
      classGroupId = getClassGroupId(baseClassNameWithoutPostfix);
      const classGroupIdWithPostfix = classGroupId && postfixLookupClassGroupIds[classGroupId] ? getClassGroupId(baseClassName) : void 0;
      if (classGroupIdWithPostfix && classGroupIdWithPostfix !== classGroupId) {
        classGroupId = classGroupIdWithPostfix;
        hasPostfixModifier = false;
      }
    } else {
      classGroupId = getClassGroupId(baseClassName);
    }
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        return EXTERNAL_DESCRIPTOR;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        return EXTERNAL_DESCRIPTOR;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    const conflictIds = [];
    for (let index = 0; index < conflictGroups.length; index++) {
      conflictIds.push(internConflictKey(modifierId + conflictGroups[index]));
    }
    return {
      isExternal: false,
      classId: internConflictKey(modifierId + classGroupId),
      conflictIds
    };
  };
  const getClassDescriptor = (originalClassName) => {
    let descriptor = descriptorCache[originalClassName];
    if (descriptor !== void 0) {
      return descriptor;
    }
    descriptor = previousDescriptorCache[originalClassName];
    if (descriptor === void 0) {
      descriptor = computeClassDescriptor(originalClassName);
    }
    descriptorCache[originalClassName] = descriptor;
    if (++descriptorCacheSize > DESCRIPTOR_CACHE_SIZE) {
      descriptorCacheSize = 0;
      previousDescriptorCache = descriptorCache;
      descriptorCache = /* @__PURE__ */ Object.create(null);
    }
    return descriptor;
  };
  const mergeClassList = (classList) => {
    const classNames = splitClassList(classList);
    const classCount = classNames.length;
    if (classCount === 1) {
      return classNames[0];
    }
    if (nextConflictKeyId > MAX_CONFLICT_KEYS) {
      conflictKeyIds.clear();
      nextConflictKeyId = 0;
      descriptorCache = /* @__PURE__ */ Object.create(null);
      previousDescriptorCache = /* @__PURE__ */ Object.create(null);
      descriptorCacheSize = 0;
    }
    currentGeneration = currentGeneration + 1 | 0;
    if (currentGeneration === 0) currentGeneration = 1;
    const generation = currentGeneration;
    if (classCount > keepFlags.length) {
      let capacity = keepFlags.length;
      while (capacity < classCount) capacity *= 2;
      keepFlags = new Uint8Array(capacity);
    }
    let didDrop = false;
    let tokenCharCount = 0;
    for (let index = classCount - 1; index >= 0; index -= 1) {
      const className = classNames[index];
      tokenCharCount += className.length;
      const descriptor = getClassDescriptor(className);
      if (descriptor.isExternal) {
        keepFlags[index] = 1;
        continue;
      }
      const classId = descriptor.classId;
      if (claimedGeneration[classId] === generation) {
        keepFlags[index] = 0;
        didDrop = true;
        continue;
      }
      claimedGeneration[classId] = generation;
      const conflictIds = descriptor.conflictIds;
      for (let conflictIndex = 0; conflictIndex < conflictIds.length; conflictIndex++) {
        claimedGeneration[conflictIds[conflictIndex]] = generation;
      }
      keepFlags[index] = 1;
    }
    if (!didDrop && !splitSawNonSpaceWhitespace && classList.length === tokenCharCount + classCount - 1) {
      return classList;
    }
    let result = "";
    for (let index = 0; index < classCount; index++) {
      if (keepFlags[index] === 1) {
        if (result) result += " ";
        result += classNames[index];
      }
    }
    return result;
  };
  return {
    parseClassName,
    sortModifiers,
    postfixLookupClassGroupIds,
    getClassGroupId,
    getConflictingClassGroupIds,
    getClassDescriptor,
    mergeClassList
  };
};
var createPostfixLookupClassGroupIds = (config) => {
  const lookup = /* @__PURE__ */ Object.create(null);
  const classGroupIds = config.postfixLookupClassGroups;
  if (classGroupIds) {
    for (let index = 0; index < classGroupIds.length; index++) {
      lookup[classGroupIds[index]] = true;
    }
  }
  return lookup;
};

// src/internal/merge/create-tailwind-merge.ts
var MERGE_CACHE_SIZE = 500;
var createTailwindMerge = (createConfig) => {
  let configUtils;
  let mergeClassList;
  let cache = /* @__PURE__ */ Object.create(null);
  let previousCache = /* @__PURE__ */ Object.create(null);
  let cacheSize = 0;
  const initTailwindMerge = (classList) => {
    configUtils = createConfigUtils(createConfig());
    mergeClassList = configUtils.mergeClassList;
    merge.mergeString = tailwindMerge;
    return tailwindMerge(classList);
  };
  const tailwindMerge = (classList) => {
    let result = cache[classList];
    if (result !== void 0) {
      return result;
    }
    result = previousCache[classList];
    if (result === void 0) {
      result = mergeClassList(classList);
    }
    cache[classList] = result;
    if (++cacheSize > MERGE_CACHE_SIZE) {
      cacheSize = 0;
      previousCache = cache;
      cache = /* @__PURE__ */ Object.create(null);
    }
    return result;
  };
  const merge = (...args) => merge.mergeString(joinClassValue(args));
  merge.mergeString = initTailwindMerge;
  return merge;
};

// src/internal/merge/from-theme.ts
var fallbackThemeArr = [];
var fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || fallbackThemeArr;
  themeGetter.isThemeGetter = true;
  return themeGetter;
};

// src/internal/merge/validators.ts
var arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
var arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
var fractionRegex = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/;
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var toNumber = Number;
var numberIsNaN = Number.isNaN;
var numberIsInteger = Number.isInteger;
var isFraction = (value) => fractionRegex.test(value);
var isNumber = (value) => Boolean(value) && !numberIsNaN(toNumber(value));
var isInteger = (value) => Boolean(value) && numberIsInteger(toNumber(value));
var isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var isAny = () => true;
var isLengthOnly = (value) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value)
);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var isAnyNonArbitrary = (value) => !isArbitraryValue(value) && !isArbitraryVariable(value);
var isNamedContainerQuery = (value) => value.startsWith("@container") && (value[10] === "/" && value[11] !== void 0 || value[11] === "s" && value[16] !== void 0 && value.startsWith("-size/", 10) || value[11] === "n" && value[18] !== void 0 && value.startsWith("-normal/", 10));
var isArbitrarySize = (value) => getIsArbitraryValue(value, isLabelSize, isNever);
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isArbitraryLength = (value) => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
var isArbitraryNumber = (value) => getIsArbitraryValue(value, isLabelNumber, isNumber);
var isArbitraryWeight = (value) => getIsArbitraryValue(value, isLabelWeight, isAny);
var isArbitraryFamilyName = (value) => getIsArbitraryValue(value, isLabelFamilyName, isNever);
var isArbitraryPosition = (value) => getIsArbitraryValue(value, isLabelPosition, isNever);
var isArbitraryImage = (value) => getIsArbitraryValue(value, isLabelImage, isImage);
var isArbitraryShadow = (value) => getIsArbitraryValue(value, isLabelShadow, isShadow);
var isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
var isArbitraryVariableLength = (value) => getIsArbitraryVariable(value, isLabelLength);
var isArbitraryVariableFamilyName = (value) => getIsArbitraryVariable(value, isLabelFamilyName);
var isArbitraryVariablePosition = (value) => getIsArbitraryVariable(value, isLabelPosition);
var isArbitraryVariableSize = (value) => getIsArbitraryVariable(value, isLabelSize);
var isArbitraryVariableImage = (value) => getIsArbitraryVariable(value, isLabelImage);
var isArbitraryVariableShadow = (value) => getIsArbitraryVariable(value, isLabelShadow, true);
var isArbitraryVariableWeight = (value) => getIsArbitraryVariable(value, isLabelWeight, true);
var getIsArbitraryValue = (value, testLabel, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return testValue(result[2]);
  }
  return false;
};
var getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
  const result = arbitraryVariableRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return shouldMatchNoLabel;
  }
  return false;
};
var isLabelPosition = (label) => label === "position" || label === "percentage";
var isLabelImage = (label) => label === "image" || label === "url";
var isLabelSize = (label) => label === "length" || label === "size" || label === "bg-size";
var isLabelLength = (label) => label === "length";
var isLabelNumber = (label) => label === "number";
var isLabelFamilyName = (label) => label === "family-name";
var isLabelWeight = (label) => label === "number" || label === "weight";
var isLabelShadow = (label) => label === "shadow";

// src/internal/merge/default-config.ts
var getDefaultConfig = () => {
  const themeColor = fromTheme("color");
  const themeFont = fromTheme("font");
  const themeText = fromTheme("text");
  const themeFontWeight = fromTheme("font-weight");
  const themeTracking = fromTheme("tracking");
  const themeLeading = fromTheme("leading");
  const themeBreakpoint = fromTheme("breakpoint");
  const themeContainer = fromTheme("container");
  const themeSpacing = fromTheme("spacing");
  const themeRadius = fromTheme("radius");
  const themeShadow = fromTheme("shadow");
  const themeInsetShadow = fromTheme("inset-shadow");
  const themeTextShadow = fromTheme("text-shadow");
  const themeDropShadow = fromTheme("drop-shadow");
  const themeBlur = fromTheme("blur");
  const themePerspective = fromTheme("perspective");
  const themeAspect = fromTheme("aspect");
  const themeEase = fromTheme("ease");
  const themeAnimate = fromTheme("animate");
  const scaleBreak = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const scalePosition = () => [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-top",
    "top-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-top",
    "bottom-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-bottom",
    "bottom-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-bottom"
  ];
  const scalePositionWithArbitrary = () => [...scalePosition(), isArbitraryVariable, isArbitraryValue];
  const scaleOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const scaleOverscroll = () => ["auto", "contain", "none"];
  const scaleUnambiguousSpacing = () => [isArbitraryVariable, isArbitraryValue, themeSpacing];
  const scaleInset = () => [isFraction, "full", "auto", ...scaleUnambiguousSpacing()];
  const scaleGridTemplateColsRows = () => [isInteger, "none", "subgrid", isArbitraryVariable, isArbitraryValue];
  const scaleGridColRowStartAndEnd = () => [
    "auto",
    { span: ["full", isInteger, isArbitraryVariable, isArbitraryValue] },
    isInteger,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleGridColRowStartOrEnd = () => [isInteger, "auto", isArbitraryVariable, isArbitraryValue];
  const scaleGridAutoColsRows = () => ["auto", "min", "max", "fr", isArbitraryVariable, isArbitraryValue];
  const scaleAlignPrimaryAxis = () => [
    "start",
    "end",
    "center",
    "between",
    "around",
    "evenly",
    "stretch",
    "baseline",
    "center-safe",
    "end-safe"
  ];
  const scaleAlignSecondaryAxis = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
  const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
  const scaleSizing = () => [
    isFraction,
    "auto",
    "full",
    "dvw",
    "dvh",
    "lvw",
    "lvh",
    "svw",
    "svh",
    "min",
    "max",
    "fit",
    ...scaleUnambiguousSpacing()
  ];
  const scaleSizingInline = () => [
    isFraction,
    "screen",
    "full",
    "dvw",
    "lvw",
    "svw",
    "min",
    "max",
    "fit",
    ...scaleUnambiguousSpacing()
  ];
  const scaleSizingBlock = () => [
    isFraction,
    "screen",
    "full",
    "lh",
    "dvh",
    "lvh",
    "svh",
    "min",
    "max",
    "fit",
    ...scaleUnambiguousSpacing()
  ];
  const scaleColor = () => [themeColor, isArbitraryVariable, isArbitraryValue];
  const scaleBgPosition = () => [
    ...scalePosition(),
    isArbitraryVariablePosition,
    isArbitraryPosition,
    { position: [isArbitraryVariable, isArbitraryValue] }
  ];
  const scaleBgRepeat = () => ["no-repeat", { repeat: ["", "x", "y", "space", "round"] }];
  const scaleBgSize = () => [
    "auto",
    "cover",
    "contain",
    isArbitraryVariableSize,
    isArbitrarySize,
    { size: [isArbitraryVariable, isArbitraryValue] }
  ];
  const scaleGradientStopPosition = () => [isPercent, isArbitraryVariableLength, isArbitraryLength];
  const scaleRadius = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    "full",
    themeRadius,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleBorderWidth = () => ["", isNumber, isArbitraryVariableLength, isArbitraryLength];
  const scaleLineStyle = () => ["solid", "dashed", "dotted", "double"];
  const scaleBlendMode = () => [
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity"
  ];
  const scaleMaskImagePosition = () => [isNumber, isPercent, isArbitraryVariablePosition, isArbitraryPosition];
  const scaleBlur = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    themeBlur,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleRotate = () => ["none", isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleScale = () => ["none", isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleSkew = () => [isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleTranslate = () => [isFraction, "full", ...scaleUnambiguousSpacing()];
  return {
    theme: {
      animate: ["spin", "ping", "pulse", "bounce"],
      aspect: ["video"],
      blur: [isTshirtSize],
      breakpoint: [isTshirtSize],
      color: [isAny],
      container: [isTshirtSize],
      "drop-shadow": [isTshirtSize],
      ease: ["in", "out", "in-out"],
      font: [isAnyNonArbitrary],
      "font-weight": [
        "thin",
        "extralight",
        "light",
        "normal",
        "medium",
        "semibold",
        "bold",
        "extrabold",
        "black"
      ],
      "inset-shadow": [isTshirtSize],
      leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
      perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
      radius: [isTshirtSize],
      shadow: [isTshirtSize],
      spacing: ["px", isNumber],
      text: [isTshirtSize],
      "text-shadow": [isTshirtSize],
      tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
    },
    classGroups: {
      // --------------
      // --- Layout ---
      // --------------
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [
        {
          aspect: [
            "auto",
            "square",
            isFraction,
            isArbitraryValue,
            isArbitraryVariable,
            themeAspect
          ]
        }
      ],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       * @deprecated since Tailwind CSS v4.0.0
       */
      container: ["container"],
      /**
       * Container Type
       * @see https://tailwindcss.com/docs/responsive-design#container-queries
       */
      "container-type": [
        { "@container": ["", "normal", "size", isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Container Name
       * @see https://tailwindcss.com/docs/responsive-design#named-containers
       */
      "container-named": [isNamedContainerQuery],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{ columns: [isNumber, isArbitraryValue, isArbitraryVariable, themeContainer] }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{ "break-after": scaleBreak() }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{ "break-before": scaleBreak() }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{ "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"] }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{ "box-decoration": ["slice", "clone"] }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{ box: ["border", "content"] }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: [
        "block",
        "inline-block",
        "inline",
        "flex",
        "inline-flex",
        "table",
        "inline-table",
        "table-caption",
        "table-cell",
        "table-column",
        "table-column-group",
        "table-footer-group",
        "table-header-group",
        "table-row-group",
        "table-row",
        "flow-root",
        "grid",
        "inline-grid",
        "contents",
        "list-item",
        "hidden"
      ],
      /**
       * Screen Reader Only
       * @see https://tailwindcss.com/docs/display#screen-reader-only
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{ float: ["right", "left", "none", "start", "end"] }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{ clear: ["left", "right", "both", "none", "start", "end"] }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{ object: ["contain", "cover", "fill", "none", "scale-down"] }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{ object: scalePositionWithArbitrary() }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{ overflow: scaleOverflow() }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{ "overflow-x": scaleOverflow() }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{ "overflow-y": scaleOverflow() }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{ overscroll: scaleOverscroll() }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{ "overscroll-x": scaleOverscroll() }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{ "overscroll-y": scaleOverscroll() }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Inset
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{ inset: scaleInset() }],
      /**
       * Inset Inline
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{ "inset-x": scaleInset() }],
      /**
       * Inset Block
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{ "inset-y": scaleInset() }],
      /**
       * Inset Inline Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       * @todo class group will be renamed to `inset-s` in next major release
       */
      start: [
        {
          "inset-s": scaleInset(),
          /**
           * @deprecated since Tailwind CSS v4.2.0 in favor of `inset-s-*` utilities.
           * @see https://github.com/tailwindlabs/tailwindcss/pull/19613
           */
          start: scaleInset()
        }
      ],
      /**
       * Inset Inline End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       * @todo class group will be renamed to `inset-e` in next major release
       */
      end: [
        {
          "inset-e": scaleInset(),
          /**
           * @deprecated since Tailwind CSS v4.2.0 in favor of `inset-e-*` utilities.
           * @see https://github.com/tailwindlabs/tailwindcss/pull/19613
           */
          end: scaleInset()
        }
      ],
      /**
       * Inset Block Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-bs": [{ "inset-bs": scaleInset() }],
      /**
       * Inset Block End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-be": [{ "inset-be": scaleInset() }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{ top: scaleInset() }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{ right: scaleInset() }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{ bottom: scaleInset() }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{ left: scaleInset() }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{ z: [isInteger, "auto", isArbitraryVariable, isArbitraryValue] }],
      // ------------------------
      // --- Flexbox and Grid ---
      // ------------------------
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [
        {
          basis: [isFraction, "full", "auto", themeContainer, ...scaleUnambiguousSpacing()]
        }
      ],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{ flex: ["row", "row-reverse", "col", "col-reverse"] }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{ flex: ["nowrap", "wrap", "wrap-reverse"] }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{ flex: [isNumber, isFraction, "auto", "initial", "none", isArbitraryValue] }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{ grow: ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{ shrink: ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [
        {
          order: [isInteger, "first", "last", "none", isArbitraryVariable, isArbitraryValue]
        }
      ],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{ "grid-cols": scaleGridTemplateColsRows() }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{ col: scaleGridColRowStartAndEnd() }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{ "col-start": scaleGridColRowStartOrEnd() }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{ "col-end": scaleGridColRowStartOrEnd() }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{ "grid-rows": scaleGridTemplateColsRows() }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{ row: scaleGridColRowStartAndEnd() }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{ "row-start": scaleGridColRowStartOrEnd() }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{ "row-end": scaleGridColRowStartOrEnd() }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{ "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"] }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{ "auto-cols": scaleGridAutoColsRows() }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{ "auto-rows": scaleGridAutoColsRows() }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{ gap: scaleUnambiguousSpacing() }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{ "gap-x": scaleUnambiguousSpacing() }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{ "gap-y": scaleUnambiguousSpacing() }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{ justify: [...scaleAlignPrimaryAxis(), "normal"] }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{ "justify-items": [...scaleAlignSecondaryAxis(), "normal"] }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{ "justify-self": ["auto", ...scaleAlignSecondaryAxis()] }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{ content: ["normal", ...scaleAlignPrimaryAxis()] }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{ items: [...scaleAlignSecondaryAxis(), { baseline: ["", "last"] }] }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{ self: ["auto", ...scaleAlignSecondaryAxis(), { baseline: ["", "last"] }] }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{ "place-content": scaleAlignPrimaryAxis() }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{ "place-items": [...scaleAlignSecondaryAxis(), "baseline"] }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{ "place-self": ["auto", ...scaleAlignSecondaryAxis()] }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{ p: scaleUnambiguousSpacing() }],
      /**
       * Padding Inline
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{ px: scaleUnambiguousSpacing() }],
      /**
       * Padding Block
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{ py: scaleUnambiguousSpacing() }],
      /**
       * Padding Inline Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{ ps: scaleUnambiguousSpacing() }],
      /**
       * Padding Inline End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{ pe: scaleUnambiguousSpacing() }],
      /**
       * Padding Block Start
       * @see https://tailwindcss.com/docs/padding
       */
      pbs: [{ pbs: scaleUnambiguousSpacing() }],
      /**
       * Padding Block End
       * @see https://tailwindcss.com/docs/padding
       */
      pbe: [{ pbe: scaleUnambiguousSpacing() }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{ pt: scaleUnambiguousSpacing() }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{ pr: scaleUnambiguousSpacing() }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{ pb: scaleUnambiguousSpacing() }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{ pl: scaleUnambiguousSpacing() }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{ m: scaleMargin() }],
      /**
       * Margin Inline
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{ mx: scaleMargin() }],
      /**
       * Margin Block
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{ my: scaleMargin() }],
      /**
       * Margin Inline Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{ ms: scaleMargin() }],
      /**
       * Margin Inline End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{ me: scaleMargin() }],
      /**
       * Margin Block Start
       * @see https://tailwindcss.com/docs/margin
       */
      mbs: [{ mbs: scaleMargin() }],
      /**
       * Margin Block End
       * @see https://tailwindcss.com/docs/margin
       */
      mbe: [{ mbe: scaleMargin() }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{ mt: scaleMargin() }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{ mr: scaleMargin() }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{ mb: scaleMargin() }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{ ml: scaleMargin() }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x": [{ "space-x": scaleUnambiguousSpacing() }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y": [{ "space-y": scaleUnambiguousSpacing() }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y-reverse": ["space-y-reverse"],
      // --------------
      // --- Sizing ---
      // --------------
      /**
       * Size
       * @see https://tailwindcss.com/docs/width#setting-both-width-and-height
       */
      size: [{ size: scaleSizing() }],
      /**
       * Inline Size
       * @see https://tailwindcss.com/docs/width
       */
      "inline-size": [{ inline: ["auto", ...scaleSizingInline()] }],
      /**
       * Min-Inline Size
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-inline-size": [{ "min-inline": ["auto", ...scaleSizingInline()] }],
      /**
       * Max-Inline Size
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-inline-size": [{ "max-inline": ["none", ...scaleSizingInline()] }],
      /**
       * Block Size
       * @see https://tailwindcss.com/docs/height
       */
      "block-size": [{ block: ["auto", ...scaleSizingBlock()] }],
      /**
       * Min-Block Size
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-block-size": [{ "min-block": ["auto", ...scaleSizingBlock()] }],
      /**
       * Max-Block Size
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-block-size": [{ "max-block": ["none", ...scaleSizingBlock()] }],
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{ w: [themeContainer, "screen", ...scaleSizing()] }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [
        {
          "min-w": [
            themeContainer,
            "screen",
            /** Deprecated. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
            "none",
            ...scaleSizing()
          ]
        }
      ],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [
        {
          "max-w": [
            themeContainer,
            "screen",
            "none",
            /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
            "prose",
            /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
            { screen: [themeBreakpoint] },
            ...scaleSizing()
          ]
        }
      ],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{ h: ["screen", "lh", ...scaleSizing()] }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{ "min-h": ["screen", "lh", "none", ...scaleSizing()] }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{ "max-h": ["screen", "lh", ...scaleSizing()] }],
      // ------------------
      // --- Typography ---
      // ------------------
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{ text: ["base", themeText, isArbitraryVariableLength, isArbitraryLength] }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [
        {
          font: [themeFontWeight, isArbitraryVariableWeight, isArbitraryWeight]
        }
      ],
      /**
       * Font Stretch
       * @see https://tailwindcss.com/docs/font-stretch
       */
      "font-stretch": [
        {
          "font-stretch": [
            "ultra-condensed",
            "extra-condensed",
            "condensed",
            "semi-condensed",
            "normal",
            "semi-expanded",
            "expanded",
            "extra-expanded",
            "ultra-expanded",
            isPercent,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{ font: [isArbitraryVariableFamilyName, isArbitraryFamilyName, themeFont] }],
      /**
       * Font Feature Settings
       * @see https://tailwindcss.com/docs/font-feature-settings
       */
      "font-features": [{ "font-features": [isArbitraryValue] }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{ tracking: [themeTracking, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{ "line-clamp": [isNumber, "none", isArbitraryVariable, isArbitraryNumber] }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [
        {
          leading: [
            /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
            themeLeading,
            ...scaleUnambiguousSpacing()
          ]
        }
      ],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{ "list-image": ["none", isArbitraryVariable, isArbitraryValue] }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{ list: ["inside", "outside"] }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [
        { list: ["disc", "decimal", "none", isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{ text: ["left", "center", "right", "justify", "start", "end"] }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://v3.tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{ placeholder: scaleColor() }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{ text: scaleColor() }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{ decoration: [...scaleLineStyle(), "wavy"] }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [
        {
          decoration: [isNumber, "from-font", "auto", isArbitraryVariable, isArbitraryLength]
        }
      ],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{ decoration: scaleColor() }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [
        { "underline-offset": [isNumber, "auto", isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{ text: ["wrap", "nowrap", "balance", "pretty"] }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{ indent: scaleUnambiguousSpacing() }],
      /**
       * Tab Size
       * @see https://tailwindcss.com/docs/tab-size
       */
      "tab-size": [{ tab: [isInteger, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [
        {
          align: [
            "baseline",
            "top",
            "middle",
            "bottom",
            "text-top",
            "text-bottom",
            "sub",
            "super",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [
        { whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"] }
      ],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{ break: ["normal", "words", "all", "keep"] }],
      /**
       * Overflow Wrap
       * @see https://tailwindcss.com/docs/overflow-wrap
       */
      wrap: [{ wrap: ["break-word", "anywhere", "normal"] }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{ hyphens: ["none", "manual", "auto"] }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{ content: ["none", isArbitraryVariable, isArbitraryValue] }],
      // -------------------
      // --- Backgrounds ---
      // -------------------
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{ bg: ["fixed", "local", "scroll"] }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{ "bg-clip": ["border", "padding", "content", "text"] }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{ "bg-origin": ["border", "padding", "content"] }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{ bg: scaleBgPosition() }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{ bg: scaleBgRepeat() }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{ bg: scaleBgSize() }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [
        {
          bg: [
            "none",
            {
              linear: [
                { to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"] },
                isInteger,
                isArbitraryVariable,
                isArbitraryValue
              ],
              radial: ["", isArbitraryVariable, isArbitraryValue],
              conic: [isInteger, isArbitraryVariable, isArbitraryValue]
            },
            isArbitraryVariableImage,
            isArbitraryImage
          ]
        }
      ],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{ bg: scaleColor() }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{ from: scaleGradientStopPosition() }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{ via: scaleGradientStopPosition() }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{ to: scaleGradientStopPosition() }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{ from: scaleColor() }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{ via: scaleColor() }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{ to: scaleColor() }],
      // ---------------
      // --- Borders ---
      // ---------------
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{ rounded: scaleRadius() }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{ "rounded-s": scaleRadius() }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{ "rounded-e": scaleRadius() }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{ "rounded-t": scaleRadius() }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{ "rounded-r": scaleRadius() }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{ "rounded-b": scaleRadius() }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{ "rounded-l": scaleRadius() }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{ "rounded-ss": scaleRadius() }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{ "rounded-se": scaleRadius() }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{ "rounded-ee": scaleRadius() }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{ "rounded-es": scaleRadius() }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{ "rounded-tl": scaleRadius() }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{ "rounded-tr": scaleRadius() }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{ "rounded-br": scaleRadius() }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{ "rounded-bl": scaleRadius() }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{ border: scaleBorderWidth() }],
      /**
       * Border Width Inline
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{ "border-x": scaleBorderWidth() }],
      /**
       * Border Width Block
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{ "border-y": scaleBorderWidth() }],
      /**
       * Border Width Inline Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{ "border-s": scaleBorderWidth() }],
      /**
       * Border Width Inline End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{ "border-e": scaleBorderWidth() }],
      /**
       * Border Width Block Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-bs": [{ "border-bs": scaleBorderWidth() }],
      /**
       * Border Width Block End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-be": [{ "border-be": scaleBorderWidth() }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{ "border-t": scaleBorderWidth() }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{ "border-r": scaleBorderWidth() }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{ "border-b": scaleBorderWidth() }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{ "border-l": scaleBorderWidth() }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x": [{ "divide-x": scaleBorderWidth() }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y": [{ "divide-y": scaleBorderWidth() }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{ border: [...scaleLineStyle(), "hidden", "none"] }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/border-style#setting-the-divider-style
       */
      "divide-style": [{ divide: [...scaleLineStyle(), "hidden", "none"] }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{ border: scaleColor() }],
      /**
       * Border Color Inline
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{ "border-x": scaleColor() }],
      /**
       * Border Color Block
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{ "border-y": scaleColor() }],
      /**
       * Border Color Inline Start
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{ "border-s": scaleColor() }],
      /**
       * Border Color Inline End
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{ "border-e": scaleColor() }],
      /**
       * Border Color Block Start
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-bs": [{ "border-bs": scaleColor() }],
      /**
       * Border Color Block End
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-be": [{ "border-be": scaleColor() }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{ "border-t": scaleColor() }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{ "border-r": scaleColor() }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{ "border-b": scaleColor() }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{ "border-l": scaleColor() }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{ divide: scaleColor() }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{ outline: [...scaleLineStyle(), "none", "hidden"] }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{ "outline-offset": [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{ outline: ["", isNumber, isArbitraryVariableLength, isArbitraryLength] }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{ outline: scaleColor() }],
      // ---------------
      // --- Effects ---
      // ---------------
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [
        {
          shadow: [
            // Deprecated since Tailwind CSS v4.0.0
            "",
            "none",
            themeShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow
          ]
        }
      ],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-shadow-color
       */
      "shadow-color": [{ shadow: scaleColor() }],
      /**
       * Inset Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-shadow
       */
      "inset-shadow": [
        {
          "inset-shadow": ["none", themeInsetShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }
      ],
      /**
       * Inset Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-shadow-color
       */
      "inset-shadow-color": [{ "inset-shadow": scaleColor() }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-a-ring
       */
      "ring-w": [{ ring: scaleBorderWidth() }],
      /**
       * Ring Width Inset
       * @see https://v3.tailwindcss.com/docs/ring-width#inset-rings
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-ring-color
       */
      "ring-color": [{ ring: scaleColor() }],
      /**
       * Ring Offset Width
       * @see https://v3.tailwindcss.com/docs/ring-offset-width
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-w": [{ "ring-offset": [isNumber, isArbitraryLength] }],
      /**
       * Ring Offset Color
       * @see https://v3.tailwindcss.com/docs/ring-offset-color
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-color": [{ "ring-offset": scaleColor() }],
      /**
       * Inset Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-ring
       */
      "inset-ring-w": [{ "inset-ring": scaleBorderWidth() }],
      /**
       * Inset Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-ring-color
       */
      "inset-ring-color": [{ "inset-ring": scaleColor() }],
      /**
       * Text Shadow
       * @see https://tailwindcss.com/docs/text-shadow
       */
      "text-shadow": [
        {
          "text-shadow": ["none", themeTextShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }
      ],
      /**
       * Text Shadow Color
       * @see https://tailwindcss.com/docs/text-shadow#setting-the-shadow-color
       */
      "text-shadow-color": [{ "text-shadow": scaleColor() }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{ opacity: [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{ "mix-blend": [...scaleBlendMode(), "plus-darker", "plus-lighter"] }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{ "bg-blend": scaleBlendMode() }],
      /**
       * Mask Clip
       * @see https://tailwindcss.com/docs/mask-clip
       */
      "mask-clip": [
        { "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"] },
        "mask-no-clip"
      ],
      /**
       * Mask Composite
       * @see https://tailwindcss.com/docs/mask-composite
       */
      "mask-composite": [{ mask: ["add", "subtract", "intersect", "exclude"] }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image-linear-pos": [{ "mask-linear": [isNumber] }],
      "mask-image-linear-from-pos": [{ "mask-linear-from": scaleMaskImagePosition() }],
      "mask-image-linear-to-pos": [{ "mask-linear-to": scaleMaskImagePosition() }],
      "mask-image-linear-from-color": [{ "mask-linear-from": scaleColor() }],
      "mask-image-linear-to-color": [{ "mask-linear-to": scaleColor() }],
      "mask-image-t-from-pos": [{ "mask-t-from": scaleMaskImagePosition() }],
      "mask-image-t-to-pos": [{ "mask-t-to": scaleMaskImagePosition() }],
      "mask-image-t-from-color": [{ "mask-t-from": scaleColor() }],
      "mask-image-t-to-color": [{ "mask-t-to": scaleColor() }],
      "mask-image-r-from-pos": [{ "mask-r-from": scaleMaskImagePosition() }],
      "mask-image-r-to-pos": [{ "mask-r-to": scaleMaskImagePosition() }],
      "mask-image-r-from-color": [{ "mask-r-from": scaleColor() }],
      "mask-image-r-to-color": [{ "mask-r-to": scaleColor() }],
      "mask-image-b-from-pos": [{ "mask-b-from": scaleMaskImagePosition() }],
      "mask-image-b-to-pos": [{ "mask-b-to": scaleMaskImagePosition() }],
      "mask-image-b-from-color": [{ "mask-b-from": scaleColor() }],
      "mask-image-b-to-color": [{ "mask-b-to": scaleColor() }],
      "mask-image-l-from-pos": [{ "mask-l-from": scaleMaskImagePosition() }],
      "mask-image-l-to-pos": [{ "mask-l-to": scaleMaskImagePosition() }],
      "mask-image-l-from-color": [{ "mask-l-from": scaleColor() }],
      "mask-image-l-to-color": [{ "mask-l-to": scaleColor() }],
      "mask-image-x-from-pos": [{ "mask-x-from": scaleMaskImagePosition() }],
      "mask-image-x-to-pos": [{ "mask-x-to": scaleMaskImagePosition() }],
      "mask-image-x-from-color": [{ "mask-x-from": scaleColor() }],
      "mask-image-x-to-color": [{ "mask-x-to": scaleColor() }],
      "mask-image-y-from-pos": [{ "mask-y-from": scaleMaskImagePosition() }],
      "mask-image-y-to-pos": [{ "mask-y-to": scaleMaskImagePosition() }],
      "mask-image-y-from-color": [{ "mask-y-from": scaleColor() }],
      "mask-image-y-to-color": [{ "mask-y-to": scaleColor() }],
      "mask-image-radial": [{ "mask-radial": [isArbitraryVariable, isArbitraryValue] }],
      "mask-image-radial-from-pos": [{ "mask-radial-from": scaleMaskImagePosition() }],
      "mask-image-radial-to-pos": [{ "mask-radial-to": scaleMaskImagePosition() }],
      "mask-image-radial-from-color": [{ "mask-radial-from": scaleColor() }],
      "mask-image-radial-to-color": [{ "mask-radial-to": scaleColor() }],
      "mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
      "mask-image-radial-size": [
        { "mask-radial": [{ closest: ["side", "corner"], farthest: ["side", "corner"] }] }
      ],
      "mask-image-radial-pos": [{ "mask-radial-at": scalePosition() }],
      "mask-image-conic-pos": [{ "mask-conic": [isNumber] }],
      "mask-image-conic-from-pos": [{ "mask-conic-from": scaleMaskImagePosition() }],
      "mask-image-conic-to-pos": [{ "mask-conic-to": scaleMaskImagePosition() }],
      "mask-image-conic-from-color": [{ "mask-conic-from": scaleColor() }],
      "mask-image-conic-to-color": [{ "mask-conic-to": scaleColor() }],
      /**
       * Mask Mode
       * @see https://tailwindcss.com/docs/mask-mode
       */
      "mask-mode": [{ mask: ["alpha", "luminance", "match"] }],
      /**
       * Mask Origin
       * @see https://tailwindcss.com/docs/mask-origin
       */
      "mask-origin": [{ "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"] }],
      /**
       * Mask Position
       * @see https://tailwindcss.com/docs/mask-position
       */
      "mask-position": [{ mask: scaleBgPosition() }],
      /**
       * Mask Repeat
       * @see https://tailwindcss.com/docs/mask-repeat
       */
      "mask-repeat": [{ mask: scaleBgRepeat() }],
      /**
       * Mask Size
       * @see https://tailwindcss.com/docs/mask-size
       */
      "mask-size": [{ mask: scaleBgSize() }],
      /**
       * Mask Type
       * @see https://tailwindcss.com/docs/mask-type
       */
      "mask-type": [{ "mask-type": ["alpha", "luminance"] }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image": [{ mask: ["none", isArbitraryVariable, isArbitraryValue] }],
      // ---------------
      // --- Filters ---
      // ---------------
      /**
       * Filter
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [
        {
          filter: [
            // Deprecated since Tailwind CSS v3.0.0
            "",
            "none",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{ blur: scaleBlur() }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{ brightness: [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{ contrast: [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [
        {
          "drop-shadow": [
            // Deprecated since Tailwind CSS v4.0.0
            "",
            "none",
            themeDropShadow,
            isArbitraryVariableShadow,
            isArbitraryShadow
          ]
        }
      ],
      /**
       * Drop Shadow Color
       * @see https://tailwindcss.com/docs/filter-drop-shadow#setting-the-shadow-color
       */
      "drop-shadow-color": [{ "drop-shadow": scaleColor() }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{ grayscale: ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{ "hue-rotate": [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{ invert: ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{ saturate: [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{ sepia: ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Backdrop Filter
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [
        {
          "backdrop-filter": [
            // Deprecated since Tailwind CSS v3.0.0
            "",
            "none",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{ "backdrop-blur": scaleBlur() }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [
        { "backdrop-brightness": [isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [
        { "backdrop-contrast": [isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [
        { "backdrop-grayscale": ["", isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [
        { "backdrop-hue-rotate": [isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [
        { "backdrop-invert": ["", isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{ "backdrop-opacity": [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [
        { "backdrop-saturate": [isNumber, isArbitraryVariable, isArbitraryValue] }
      ],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{ "backdrop-sepia": ["", isNumber, isArbitraryVariable, isArbitraryValue] }],
      // --------------
      // --- Tables ---
      // --------------
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{ border: ["collapse", "separate"] }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{ "border-spacing": scaleUnambiguousSpacing() }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{ "border-spacing-x": scaleUnambiguousSpacing() }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{ "border-spacing-y": scaleUnambiguousSpacing() }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{ table: ["auto", "fixed"] }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{ caption: ["top", "bottom"] }],
      // ---------------------------------
      // --- Transitions and Animation ---
      // ---------------------------------
      /**
       * Transition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [
        {
          transition: [
            "",
            "all",
            "colors",
            "opacity",
            "shadow",
            "transform",
            "none",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Transition Behavior
       * @see https://tailwindcss.com/docs/transition-behavior
       */
      "transition-behavior": [{ transition: ["normal", "discrete"] }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{ duration: [isNumber, "initial", isArbitraryVariable, isArbitraryValue] }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{ ease: ["linear", "initial", themeEase, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{ delay: [isNumber, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{ animate: ["none", themeAnimate, isArbitraryVariable, isArbitraryValue] }],
      // ------------------
      // --- Transforms ---
      // ------------------
      /**
       * Backface Visibility
       * @see https://tailwindcss.com/docs/backface-visibility
       */
      backface: [{ backface: ["hidden", "visible"] }],
      /**
       * Perspective
       * @see https://tailwindcss.com/docs/perspective
       */
      perspective: [{ perspective: [themePerspective, isArbitraryVariable, isArbitraryValue] }],
      /**
       * Perspective Origin
       * @see https://tailwindcss.com/docs/perspective-origin
       */
      "perspective-origin": [{ "perspective-origin": scalePositionWithArbitrary() }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{ rotate: scaleRotate() }],
      /**
       * Rotate X
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-x": [{ "rotate-x": scaleRotate() }],
      /**
       * Rotate Y
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-y": [{ "rotate-y": scaleRotate() }],
      /**
       * Rotate Z
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-z": [{ "rotate-z": scaleRotate() }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{ scale: scaleScale() }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{ "scale-x": scaleScale() }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{ "scale-y": scaleScale() }],
      /**
       * Scale Z
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-z": [{ "scale-z": scaleScale() }],
      /**
       * Scale 3D
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-3d": ["scale-3d"],
      /**
       * Skew
       * @see https://tailwindcss.com/docs/skew
       */
      skew: [{ skew: scaleSkew() }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{ "skew-x": scaleSkew() }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{ "skew-y": scaleSkew() }],
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{ transform: [isArbitraryVariable, isArbitraryValue, "", "none", "gpu", "cpu"] }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{ origin: scalePositionWithArbitrary() }],
      /**
       * Transform Style
       * @see https://tailwindcss.com/docs/transform-style
       */
      "transform-style": [{ transform: ["3d", "flat"] }],
      /**
       * Translate
       * @see https://tailwindcss.com/docs/translate
       */
      translate: [{ translate: scaleTranslate() }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{ "translate-x": scaleTranslate() }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{ "translate-y": scaleTranslate() }],
      /**
       * Translate Z
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-z": [{ "translate-z": scaleTranslate() }],
      /**
       * Translate None
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-none": ["translate-none"],
      /**
       * Zoom
       * @see https://tailwindcss.com/docs/zoom
       */
      zoom: [{ zoom: [isInteger, isArbitraryVariable, isArbitraryValue] }],
      // ---------------------
      // --- Interactivity ---
      // ---------------------
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{ accent: scaleColor() }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{ appearance: ["none", "auto"] }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{ caret: scaleColor() }],
      /**
       * Color Scheme
       * @see https://tailwindcss.com/docs/color-scheme
       */
      "color-scheme": [
        { scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"] }
      ],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [
        {
          cursor: [
            "auto",
            "default",
            "pointer",
            "wait",
            "text",
            "move",
            "help",
            "not-allowed",
            "none",
            "context-menu",
            "progress",
            "cell",
            "crosshair",
            "vertical-text",
            "alias",
            "copy",
            "no-drop",
            "grab",
            "grabbing",
            "all-scroll",
            "col-resize",
            "row-resize",
            "n-resize",
            "e-resize",
            "s-resize",
            "w-resize",
            "ne-resize",
            "nw-resize",
            "se-resize",
            "sw-resize",
            "ew-resize",
            "ns-resize",
            "nesw-resize",
            "nwse-resize",
            "zoom-in",
            "zoom-out",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      /**
       * Field Sizing
       * @see https://tailwindcss.com/docs/field-sizing
       */
      "field-sizing": [{ "field-sizing": ["fixed", "content"] }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{ "pointer-events": ["auto", "none"] }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{ resize: ["none", "", "y", "x"] }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{ scroll: ["auto", "smooth"] }],
      /**
       * Scrollbar Thumb Color
       * @see https://tailwindcss.com/docs/scrollbar-color
       */
      "scrollbar-thumb-color": [{ "scrollbar-thumb": scaleColor() }],
      /**
       * Scrollbar Track Color
       * @see https://tailwindcss.com/docs/scrollbar-color
       */
      "scrollbar-track-color": [{ "scrollbar-track": scaleColor() }],
      /**
       * Scrollbar Gutter
       * @see https://tailwindcss.com/docs/scrollbar-gutter
       */
      "scrollbar-gutter": [{ "scrollbar-gutter": ["auto", "stable", "both"] }],
      /**
       * Scrollbar Width
       * @see https://tailwindcss.com/docs/scrollbar-width
       */
      "scrollbar-w": [{ scrollbar: ["auto", "thin", "none"] }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{ "scroll-m": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Inline
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{ "scroll-mx": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Block
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{ "scroll-my": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Inline Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{ "scroll-ms": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Inline End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{ "scroll-me": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Block Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mbs": [{ "scroll-mbs": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Block End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mbe": [{ "scroll-mbe": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{ "scroll-mt": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{ "scroll-mr": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{ "scroll-mb": scaleUnambiguousSpacing() }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{ "scroll-ml": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{ "scroll-p": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Inline
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{ "scroll-px": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Block
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{ "scroll-py": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Inline Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{ "scroll-ps": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Inline End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{ "scroll-pe": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Block Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pbs": [{ "scroll-pbs": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Block End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pbe": [{ "scroll-pbe": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{ "scroll-pt": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{ "scroll-pr": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{ "scroll-pb": scaleUnambiguousSpacing() }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{ "scroll-pl": scaleUnambiguousSpacing() }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{ snap: ["start", "end", "center", "align-none"] }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{ snap: ["normal", "always"] }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{ snap: ["none", "x", "y", "both"] }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{ snap: ["mandatory", "proximity"] }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{ touch: ["auto", "none", "manipulation"] }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{ "touch-pan": ["x", "left", "right"] }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{ "touch-pan": ["y", "up", "down"] }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{ select: ["none", "text", "all", "auto"] }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [
        {
          "will-change": [
            "auto",
            "scroll",
            "contents",
            "transform",
            isArbitraryVariable,
            isArbitraryValue
          ]
        }
      ],
      // -----------
      // --- SVG ---
      // -----------
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{ fill: ["none", ...scaleColor()] }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [
        {
          stroke: [isNumber, isArbitraryVariableLength, isArbitraryLength, isArbitraryNumber]
        }
      ],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{ stroke: ["none", ...scaleColor()] }],
      // ---------------------
      // --- Accessibility ---
      // ---------------------
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
    },
    conflictingClassGroups: {
      "container-named": ["container-type"],
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: [
        "inset-x",
        "inset-y",
        "inset-bs",
        "inset-be",
        "start",
        "end",
        "top",
        "right",
        "bottom",
        "left"
      ],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pbs", "pbe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mbs", "mbe", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": [
        "fvn-ordinal",
        "fvn-slashed-zero",
        "fvn-figure",
        "fvn-spacing",
        "fvn-fraction"
      ],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: [
        "rounded-s",
        "rounded-e",
        "rounded-t",
        "rounded-r",
        "rounded-b",
        "rounded-l",
        "rounded-ss",
        "rounded-se",
        "rounded-ee",
        "rounded-es",
        "rounded-tl",
        "rounded-tr",
        "rounded-br",
        "rounded-bl"
      ],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": [
        "border-w-x",
        "border-w-y",
        "border-w-s",
        "border-w-e",
        "border-w-bs",
        "border-w-be",
        "border-w-t",
        "border-w-r",
        "border-w-b",
        "border-w-l"
      ],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": [
        "border-color-x",
        "border-color-y",
        "border-color-s",
        "border-color-e",
        "border-color-bs",
        "border-color-be",
        "border-color-t",
        "border-color-r",
        "border-color-b",
        "border-color-l"
      ],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      translate: ["translate-x", "translate-y", "translate-none"],
      "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
      "scroll-m": [
        "scroll-mx",
        "scroll-my",
        "scroll-ms",
        "scroll-me",
        "scroll-mbs",
        "scroll-mbe",
        "scroll-mt",
        "scroll-mr",
        "scroll-mb",
        "scroll-ml"
      ],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": [
        "scroll-px",
        "scroll-py",
        "scroll-ps",
        "scroll-pe",
        "scroll-pbs",
        "scroll-pbe",
        "scroll-pt",
        "scroll-pr",
        "scroll-pb",
        "scroll-pl"
      ],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    },
    postfixLookupClassGroups: ["container-type"],
    orderSensitiveModifiers: [
      "*",
      "**",
      "after",
      "backdrop",
      "before",
      "details-content",
      "file",
      "first-letter",
      "first-line",
      "marker",
      "placeholder",
      "selection"
    ]
  };
};

// src/internal/merge/merge-configs.ts
var mergeConfigs = (baseConfig, { extend = {}, override = {} }) => {
  overrideConfigProperties(baseConfig.theme, override.theme);
  overrideConfigProperties(baseConfig.classGroups, override.classGroups);
  overrideConfigProperties(baseConfig.conflictingClassGroups, override.conflictingClassGroups);
  overrideConfigProperties(
    baseConfig.conflictingClassGroupModifiers,
    override.conflictingClassGroupModifiers
  );
  overrideProperty(baseConfig, "postfixLookupClassGroups", override.postfixLookupClassGroups);
  overrideProperty(baseConfig, "orderSensitiveModifiers", override.orderSensitiveModifiers);
  mergeConfigProperties(baseConfig.theme, extend.theme);
  mergeConfigProperties(baseConfig.classGroups, extend.classGroups);
  mergeConfigProperties(baseConfig.conflictingClassGroups, extend.conflictingClassGroups);
  mergeConfigProperties(
    baseConfig.conflictingClassGroupModifiers,
    extend.conflictingClassGroupModifiers
  );
  mergeArrayProperties(baseConfig, extend, "postfixLookupClassGroups");
  mergeArrayProperties(baseConfig, extend, "orderSensitiveModifiers");
  return baseConfig;
};
var overrideProperty = (baseObject, overrideKey, overrideValue) => {
  if (overrideValue !== void 0) {
    baseObject[overrideKey] = overrideValue;
  }
};
var overrideConfigProperties = (baseObject, overrideObject) => {
  if (overrideObject) {
    for (const key in overrideObject) {
      overrideProperty(baseObject, key, overrideObject[key]);
    }
  }
};
var mergeConfigProperties = (baseObject, mergeObject) => {
  if (mergeObject) {
    for (const key in mergeObject) {
      mergeArrayProperties(baseObject, mergeObject, key);
    }
  }
};
var mergeArrayProperties = (baseObject, mergeObject, key) => {
  const mergeValue = mergeObject[key];
  if (mergeValue !== void 0) {
    baseObject[key] = baseObject[key] ? baseObject[key].concat(mergeValue) : mergeValue;
  }
};

// src/internal/merge/index.ts
var createMerger = (config) => {
  if (!config) {
    return createTailwindMerge(getDefaultConfig);
  }
  const createConfig = typeof config === "function" ? () => config(getDefaultConfig()) : () => mergeConfigs(getDefaultConfig(), config);
  return createTailwindMerge(createConfig);
};

// src/internal/tw-merge.ts
var toMergerConfig = (config) => {
  if (isEmptyObject(config)) return void 0;
  const source = config;
  const extend = {
    ...source.extend ?? {}
  };
  for (const key of [
    "theme",
    "classGroups",
    "conflictingClassGroups",
    "conflictingClassGroupModifiers",
    "postfixLookupClassGroups",
    "orderSensitiveModifiers",
    "cacheSize",
    "prefix",
    "separator",
    "experimentalParseClassName"
  ]) {
    if (source[key] !== void 0 && extend[key] === void 0) {
      extend[key] = source[key];
    }
  }
  const result = {};
  if (Object.keys(extend).length > 0) {
    result.extend = extend;
  }
  if (source.override != null && !isEmptyObject(source.override)) {
    result.override = source.override;
  }
  if (!result.extend && !result.override) return void 0;
  return result;
};
var createTwMerge = (cachedTwMergeConfig) => {
  const extension = toMergerConfig(cachedTwMergeConfig);
  const merger = createMerger(extension);
  return (classList) => merger.mergeString(classList);
};
var defaultMerger;
var getDefaultMerger = () => {
  if (!defaultMerger) defaultMerger = createMerger();
  return defaultMerger;
};
var ensureConfiguredMerger = () => {
  if (!state.cachedTwMerge || state.didTwMergeConfigChange) {
    state.didTwMergeConfigChange = false;
    state.cachedTwMerge = createTwMerge(state.cachedTwMergeConfig);
  }
  return state.cachedTwMerge;
};
var syncTwMergeConfig = (config) => {
  const next = config == null ? void 0 : config.twMergeConfig;
  if (!next || isEmptyObject(next)) return;
  if (!isEqual(next, state.cachedTwMergeConfig)) {
    state.cachedTwMergeConfig = next;
    state.didTwMergeConfigChange = true;
  }
};
var joinArgs = (classnames) => joinClassValue(classnames);
var originalStateReset = state.reset.bind(state);
state.reset = () => {
  defaultMerger = void 0;
  originalStateReset();
};
var executeMerge = (classnames, config) => {
  const base = joinArgs(classnames);
  if (!base || !((config == null ? void 0 : config.twMerge) ?? true)) return base || void 0;
  if (base.indexOf(" ") === -1) return base;
  syncTwMergeConfig(config);
  const hasCustomConfig = Boolean((config == null ? void 0 : config.twMergeConfig) && !isEmptyObject(config.twMergeConfig));
  const merge = hasCustomConfig ? ensureConfiguredMerger() : getDefaultMerger().mergeString;
  return merge(base) || void 0;
};
var cnAdapter = (config, ...classnames) => executeMerge(classnames, config);

// src/index.ts
var runtime = getTailwindVariants(cnAdapter);
var tv = runtime.tv;

//#region node_modules/svelte-toolbelt/dist/utils/is.js
function isFunction$1(value) {
	return typeof value === "function";
}
function isObject(value) {
	return value !== null && typeof value === "object";
}
var CLASS_VALUE_PRIMITIVE_TYPES = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function isClassValue(value) {
	if (value === null || value === void 0) return true;
	if (CLASS_VALUE_PRIMITIVE_TYPES.includes(typeof value)) return true;
	if (Array.isArray(value)) return value.every((item) => isClassValue(item));
	if (typeof value === "object") {
		if (Object.getPrototypeOf(value) !== Object.prototype) return false;
		return true;
	}
	return false;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var BoxSymbol = Symbol("box");
var isWritableSymbol = Symbol("is-writable");
function boxWith(getter, setter) {
	const derived$1 = derived(getter);
	if (setter) return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return derived$1();
		},
		set current(v) {
			setter(v);
		}
	};
	return {
		[BoxSymbol]: true,
		get current() {
			return getter();
		}
	};
}
/**
* @returns Whether the value is a Box
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isBox(value) {
	return isObject(value) && BoxSymbol in value;
}
function boxFrom(value) {
	if (isBox(value)) return value;
	if (isFunction$1(value)) return boxWith(value);
	return simpleBox(value);
}
function simpleBox(initialValue) {
	let current = initialValue;
	return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return current;
		},
		set current(v) {
			current = v;
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
/**
* Composes event handlers into a single function that can be called with an event.
* If the previous handler cancels the event using `event.preventDefault()`, the handlers
* that follow will not be called.
*/
function composeHandlers(...handlers) {
	return function(e) {
		for (const handler of handlers) {
			if (!handler) continue;
			if (e.defaultPrevented) return;
			if (typeof handler === "function") handler.call(this, e);
			else handler.current?.call(this, e);
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/strings.js
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = [
	"-",
	"_",
	"/",
	"."
];
function isUppercase(char = "") {
	if (NUMBER_CHAR_RE.test(char)) return void 0;
	return char !== char.toLowerCase();
}
function splitByCase(str) {
	const parts = [];
	let buff = "";
	let previousUpper;
	let previousSplitter;
	for (const char of str) {
		const isSplitter = STR_SPLITTERS.includes(char);
		if (isSplitter === true) {
			parts.push(buff);
			buff = "";
			previousUpper = void 0;
			continue;
		}
		const isUpper = isUppercase(char);
		if (previousSplitter === false) {
			if (previousUpper === false && isUpper === true) {
				parts.push(buff);
				buff = char;
				previousUpper = isUpper;
				continue;
			}
			if (previousUpper === true && isUpper === false && buff.length > 1) {
				const lastChar = buff.at(-1);
				parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
				buff = lastChar + char;
				previousUpper = isUpper;
				continue;
			}
		}
		buff += char;
		previousUpper = isUpper;
		previousSplitter = isSplitter;
	}
	parts.push(buff);
	return parts;
}
function pascalCase(str) {
	if (!str) return "";
	return splitByCase(str).map((p) => upperFirst(p)).join("");
}
function camelCase(str) {
	return lowerFirst(pascalCase(str || ""));
}
function upperFirst(str) {
	return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
	return str ? str[0].toLowerCase() + str.slice(1) : "";
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
function cssToStyleObj(css) {
	if (!css) return {};
	const styleObj = {};
	function iterator(name, value) {
		if (name.startsWith("-moz-") || name.startsWith("-webkit-") || name.startsWith("-ms-") || name.startsWith("-o-")) {
			styleObj[pascalCase(name)] = value;
			return;
		}
		if (name.startsWith("--")) {
			styleObj[name] = value;
			return;
		}
		styleObj[camelCase(name)] = value;
	}
	StyleToObject(css, iterator);
	return styleObj;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
/**
* Executes an array of callback functions with the same arguments.
* @template T The types of the arguments that the callback functions take.
* @param callbacks array of callback functions to execute.
* @returns A new function that executes all of the original callback functions with the same arguments.
*/
function executeCallbacks(...callbacks) {
	return (...args) => {
		for (const callback of callbacks) if (typeof callback === "function") callback(...args);
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function createParser(matcher, replacer) {
	const regex = RegExp(matcher, "g");
	return (str) => {
		if (typeof str !== "string") throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
		if (!str.match(regex)) return str;
		return str.replace(regex, replacer);
	};
}
var camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
	if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
	return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style.js
function styleToString(style = {}) {
	return styleToCSS(style).replace("\n", " ");
}
var EVENT_LIST_SET = /* @__PURE__ */ new Set([
	"onabort",
	"onanimationcancel",
	"onanimationend",
	"onanimationiteration",
	"onanimationstart",
	"onauxclick",
	"onbeforeinput",
	"onbeforetoggle",
	"onblur",
	"oncancel",
	"oncanplay",
	"oncanplaythrough",
	"onchange",
	"onclick",
	"onclose",
	"oncompositionend",
	"oncompositionstart",
	"oncompositionupdate",
	"oncontextlost",
	"oncontextmenu",
	"oncontextrestored",
	"oncopy",
	"oncuechange",
	"oncut",
	"ondblclick",
	"ondrag",
	"ondragend",
	"ondragenter",
	"ondragleave",
	"ondragover",
	"ondragstart",
	"ondrop",
	"ondurationchange",
	"onemptied",
	"onended",
	"onerror",
	"onfocus",
	"onfocusin",
	"onfocusout",
	"onformdata",
	"ongotpointercapture",
	"oninput",
	"oninvalid",
	"onkeydown",
	"onkeypress",
	"onkeyup",
	"onload",
	"onloadeddata",
	"onloadedmetadata",
	"onloadstart",
	"onlostpointercapture",
	"onmousedown",
	"onmouseenter",
	"onmouseleave",
	"onmousemove",
	"onmouseout",
	"onmouseover",
	"onmouseup",
	"onpaste",
	"onpause",
	"onplay",
	"onplaying",
	"onpointercancel",
	"onpointerdown",
	"onpointerenter",
	"onpointerleave",
	"onpointermove",
	"onpointerout",
	"onpointerover",
	"onpointerup",
	"onprogress",
	"onratechange",
	"onreset",
	"onresize",
	"onscroll",
	"onscrollend",
	"onsecuritypolicyviolation",
	"onseeked",
	"onseeking",
	"onselect",
	"onselectionchange",
	"onselectstart",
	"onslotchange",
	"onstalled",
	"onsubmit",
	"onsuspend",
	"ontimeupdate",
	"ontoggle",
	"ontouchcancel",
	"ontouchend",
	"ontouchmove",
	"ontouchstart",
	"ontransitioncancel",
	"ontransitionend",
	"ontransitionrun",
	"ontransitionstart",
	"onvolumechange",
	"onwaiting",
	"onwebkitanimationend",
	"onwebkitanimationiteration",
	"onwebkitanimationstart",
	"onwebkittransitionend",
	"onwheel"
]);
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/merge-props.js
/**
* Modified from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/utils/src/mergeProps.ts (see NOTICE.txt for source)
*/
function isEventHandler(key) {
	return EVENT_LIST_SET.has(key);
}
/**
* Given a list of prop objects, merges them into a single object.
* - Automatically composes event handlers (e.g. `onclick`, `oninput`, etc.)
* - Chains regular functions with the same name so they are called in order
* - Merges class strings with `clsx`
* - Merges style objects and converts them to strings
* - Handles a bug with Svelte where setting the `hidden` attribute to `false` doesn't remove it
* - Overrides other values with the last one
*/
function mergeProps(...args) {
	const result = { ...args[0] };
	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		if (!props) continue;
		for (const key of Object.keys(props)) {
			const a = result[key];
			const b = props[key];
			const aIsFunction = typeof a === "function";
			const bIsFunction = typeof b === "function";
			if (aIsFunction && typeof bIsFunction && isEventHandler(key)) result[key] = composeHandlers(a, b);
			else if (aIsFunction && bIsFunction) result[key] = executeCallbacks(a, b);
			else if (key === "class") {
				const aIsClassValue = isClassValue(a);
				const bIsClassValue = isClassValue(b);
				if (aIsClassValue && bIsClassValue) result[key] = clsx(a, b);
				else if (aIsClassValue) result[key] = clsx(a);
				else if (bIsClassValue) result[key] = clsx(b);
			} else if (key === "style") {
				const aIsObject = typeof a === "object";
				const bIsObject = typeof b === "object";
				const aIsString = typeof a === "string";
				const bIsString = typeof b === "string";
				if (aIsObject && bIsObject) result[key] = {
					...a,
					...b
				};
				else if (aIsObject && bIsString) {
					const parsedStyle = cssToStyleObj(b);
					result[key] = {
						...a,
						...parsedStyle
					};
				} else if (aIsString && bIsObject) result[key] = {
					...cssToStyleObj(a),
					...b
				};
				else if (aIsString && bIsString) {
					const parsedStyleA = cssToStyleObj(a);
					const parsedStyleB = cssToStyleObj(b);
					result[key] = {
						...parsedStyleA,
						...parsedStyleB
					};
				} else if (aIsObject) result[key] = a;
				else if (bIsObject) result[key] = b;
				else if (aIsString) result[key] = a;
				else if (bIsString) result[key] = b;
			} else result[key] = b !== void 0 ? b : a;
		}
		for (const key of Object.getOwnPropertySymbols(props)) {
			const a = result[key];
			const b = props[key];
			result[key] = b !== void 0 ? b : a;
		}
	}
	if (typeof result.style === "object") result.style = styleToString(result.style).replaceAll("\n", " ");
	if (result.hidden === false) {
		result.hidden = void 0;
		delete result.hidden;
	}
	if (result.disabled === false) {
		result.disabled = void 0;
		delete result.disabled;
	}
	return result;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/sr-only-styles.js
var srOnlyStyles = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0",
	transform: "translateX(-100%)"
};
styleToString(srOnlyStyles);
//#endregion
//#region node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$1(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber();
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement$1(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/runed/dist/internal/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
//#endregion
//#region node_modules/runed/dist/utilities/extract/extract.svelte.js
function extract(value, defaultValue) {
	if (isFunction(value)) {
		const gotten = value();
		if (gotten === void 0) return defaultValue;
		return gotten;
	}
	return value;
}
//#endregion
//#region node_modules/runed/dist/utilities/context/context.js
var Context = class {
	#name;
	#key;
	/**
	* @param name The name of the context.
	* This is used for generating the context key and error messages.
	*/
	constructor(name) {
		this.#name = name;
		this.#key = Symbol(name);
	}
	/**
	* The key used to get and set the context.
	*
	* It is not recommended to use this value directly.
	* Instead, use the methods provided by this class.
	*/
	get key() {
		return this.#key;
	}
	/**
	* Checks whether this has been set in the context of a parent component.
	*
	* Must be called during component initialisation.
	*/
	exists() {
		return hasContext(this.#key);
	}
	/**
	* Retrieves the context that belongs to the closest parent component.
	*
	* Must be called during component initialisation.
	*
	* @throws An error if the context does not exist.
	*/
	get() {
		const context = getContext(this.#key);
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
		return context;
	}
	/**
	* Retrieves the context that belongs to the closest parent component,
	* or the given fallback value if the context does not exist.
	*
	* Must be called during component initialisation.
	*/
	getOr(fallback) {
		const context = getContext(this.#key);
		if (context === void 0) return fallback;
		return context;
	}
	/**
	* Associates the given value with the current component and returns it.
	*
	* Must be called during component initialisation.
	*/
	set(context) {
		return setContext(this.#key, context);
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/use-debounce/use-debounce.svelte.js
function useDebounce(callback, wait) {
	let context = null;
	const wait$ = derived(() => extract(wait, 250));
	function debounced(...args) {
		if (context) {
			if (context.timeout) clearTimeout(context.timeout);
		} else {
			let resolve;
			let reject;
			context = {
				timeout: null,
				runner: null,
				promise: new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				}),
				resolve,
				reject
			};
		}
		context.runner = async () => {
			if (!context) return;
			const ctx = context;
			context = null;
			try {
				ctx.resolve(await callback.apply(this, args));
			} catch (error) {
				ctx.reject(error);
			}
		};
		context.timeout = setTimeout(context.runner, wait$());
		return context.promise;
	}
	debounced.cancel = async () => {
		if (!context || context.timeout === null) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || context.timeout === null) return;
		}
		clearTimeout(context.timeout);
		context.reject("Cancelled");
		context = null;
	};
	debounced.runScheduledNow = async () => {
		if (!context || !context.timeout) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || !context.timeout) return;
		}
		clearTimeout(context.timeout);
		context.timeout = null;
		await context.runner?.();
	};
	Object.defineProperty(debounced, "pending", {
		enumerable: true,
		get() {
			return !!context?.timeout;
		}
	});
	return debounced;
}
//#endregion
//#region node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch(sources, effect, options) {
	runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
	runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
//#endregion
//#region node_modules/runed/dist/internal/utils/get.js
function get$1(value) {
	if (isFunction(value)) return value();
	return value;
}
//#endregion
//#region node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var ElementSize = class {
	#size = {
		width: 0,
		height: 0
	};
	#observed = false;
	#options;
	#node;
	#window;
	#width = derived(() => {
		this.#subscribe()?.();
		return this.getSize().width;
	});
	#height = derived(() => {
		this.#subscribe()?.();
		return this.getSize().height;
	});
	#subscribe = derived(() => {
		const node$ = get$1(this.#node);
		if (!node$) return;
		return createSubscriber();
	});
	constructor(node, options = { box: "border-box" }) {
		this.#window = options.window ?? defaultWindow;
		this.#options = options;
		this.#node = node;
		this.#size = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		const element = get$1(this.#node);
		if (!element || !this.#window) return;
		const offsetWidth = element.offsetWidth;
		const offsetHeight = element.offsetHeight;
		if (this.#options.box === "border-box") return {
			width: offsetWidth,
			height: offsetHeight
		};
		const style = this.#window.getComputedStyle(element);
		const paddingWidth = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		const paddingHeight = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		const borderWidth = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
		const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
		return {
			width: offsetWidth - paddingWidth - borderWidth,
			height: offsetHeight - paddingHeight - borderHeight
		};
	}
	getSize() {
		return this.#observed ? this.#size : this.calculateSize() ?? this.#size;
	}
	get current() {
		this.#subscribe()?.();
		return this.getSize();
	}
	get width() {
		return this.#width();
	}
	get height() {
		return this.#height();
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/is-mounted/is-mounted.svelte.js
var IsMounted = class {
	#isMounted = false;
	constructor() {}
	get current() {
		return this.#isMounted;
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/previous/previous.svelte.js
var Previous = class {
	#previousCallback = () => void 0;
	#previous = derived(() => this.#previousCallback());
	constructor(getter, initialValue) {
		let actualPrevious = void 0;
		if (initialValue !== void 0) actualPrevious = initialValue;
		this.#previousCallback = () => {
			try {
				return actualPrevious;
			} finally {
				actualPrevious = getter();
			}
		};
	}
	get current() {
		return this.#previous();
	}
};
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/after-sleep.js
/**
* A utility function that executes a callback after a specified number of milliseconds.
*/
function afterSleep(ms, cb) {
	return setTimeout(cb, ms);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/after-tick.js
function afterTick(fn) {
	(/* @__PURE__ */ tick()).then(fn);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom.js
var ELEMENT_NODE = 1;
var DOCUMENT_NODE = 9;
var DOCUMENT_FRAGMENT_NODE = 11;
function isHTMLElement$1(node) {
	return isObject(node) && node.nodeType === ELEMENT_NODE && typeof node.nodeName === "string";
}
function isDocument(node) {
	return isObject(node) && node.nodeType === DOCUMENT_NODE;
}
function isWindow(node) {
	return isObject(node) && node.constructor?.name === "VisualViewport";
}
function isNode(node) {
	return isObject(node) && node.nodeType !== void 0;
}
function isShadowRoot(node) {
	return isNode(node) && node.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in node;
}
function contains(parent, child) {
	if (!parent || !child) return false;
	if (!isHTMLElement$1(parent) || !isHTMLElement$1(child)) return false;
	const rootNode = child.getRootNode?.();
	if (parent === child) return true;
	if (parent.contains(child)) return true;
	if (rootNode && isShadowRoot(rootNode)) {
		let next = child;
		while (next) {
			if (parent === next) return true;
			next = next.parentNode || next.host;
		}
	}
	return false;
}
function getDocument(node) {
	if (isDocument(node)) return node;
	if (isWindow(node)) return node.document;
	return node?.ownerDocument ?? document;
}
function getWindow(node) {
	if (isShadowRoot(node)) return getWindow(node.host);
	if (isDocument(node)) return node.defaultView ?? window;
	if (isHTMLElement$1(node)) return node.ownerDocument?.defaultView ?? window;
	return window;
}
function getActiveElement(rootNode) {
	let activeElement = rootNode.activeElement;
	while (activeElement?.shadowRoot) {
		const el = activeElement.shadowRoot.activeElement;
		if (el === activeElement) break;
		else activeElement = el;
	}
	return activeElement;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var DOMContext = class {
	element;
	#root = derived(() => {
		if (!this.element.current) return document;
		return this.element.current.getRootNode() ?? document;
	});
	get root() {
		return this.#root();
	}
	set root($$value) {
		return this.#root($$value);
	}
	constructor(element) {
		if (typeof element === "function") this.element = boxWith(element);
		else this.element = element;
	}
	getDocument = () => {
		return getDocument(this.root);
	};
	getWindow = () => {
		return this.getDocument().defaultView ?? window;
	};
	getActiveElement = () => {
		return getActiveElement(this.root);
	};
	isActiveElement = (node) => {
		return node === this.getActiveElement();
	};
	getElementById(id) {
		return this.root.getElementById(id);
	}
	querySelector = (selector) => {
		if (!this.root) return null;
		return this.root.querySelector(selector);
	};
	querySelectorAll = (selector) => {
		if (!this.root) return [];
		return this.root.querySelectorAll(selector);
	};
	setTimeout = (callback, delay) => {
		return this.getWindow().setTimeout(callback, delay);
	};
	clearTimeout = (timeoutId) => {
		return this.getWindow().clearTimeout(timeoutId);
	};
};
//#endregion
//#region node_modules/svelte/src/attachments/index.js
/**
* Creates an object key that will be recognised as an attachment when the object is spread onto an element,
* as a programmatic alternative to using `{@attach ...}`. This can be useful for library authors, though
* is generally not needed when building an app.
*
* ```svelte
* <script>
* 	import { createAttachmentKey } from 'svelte/attachments';
*
* 	const props = {
* 		class: 'cool',
* 		onclick: () => alert('clicked'),
* 		[createAttachmentKey()]: (node) => {
* 			node.textContent = 'attached!';
* 		}
* 	};
* <\/script>
*
* <button {...props}>click me</button>
* ```
* @since 5.29
*/
function createAttachmentKey() {
	return Symbol(ATTACHMENT_KEY);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/attach-ref.js
/**
* Creates a Svelte Attachment that attaches a DOM element to a ref.
* The ref can be either a WritableBox or a callback function.
*
* @param ref - Either a WritableBox to store the element in, or a callback function that receives the element
* @param onChange - Optional callback that fires when the ref changes
* @returns An object with a spreadable attachment key that should be spread onto the element
*
* @example
* // Using with WritableBox
* const ref = box<HTMLDivElement | null>(null);
* <div {...attachRef(ref)}>Content</div>
*
* @example
* // Using with callback
* <div {...attachRef((node) => myNode = node)}>Content</div>
*
* @example
* // Using with onChange
* <div {...attachRef(ref, (node) => console.log(node))}>Content</div>
*/
function attachRef(ref, onChange) {
	return { [createAttachmentKey()]: (node) => {
		if (isBox(ref)) {
			ref.current = node;
			run(() => onChange?.(node));
			return () => {
				if ("isConnected" in node && node.isConnected) return;
				ref.current = null;
				onChange?.(null);
			};
		}
		ref(node);
		run(() => onChange?.(node));
		return () => {
			if ("isConnected" in node && node.isConnected) return;
			ref(null);
			onChange?.(null);
		};
	} };
}
//#endregion
//#region node_modules/bits-ui/dist/internal/attrs.js
function boolToStr(condition) {
	return condition ? "true" : "false";
}
function boolToStrTrueOrUndef(condition) {
	return condition ? "true" : void 0;
}
function boolToEmptyStrOrUndef(condition) {
	return condition ? "" : void 0;
}
function boolToTrueOrUndef(condition) {
	return condition ? true : void 0;
}
function getDataOpenClosed(condition) {
	return condition ? "open" : "closed";
}
function getDataTransitionAttrs(state) {
	if (state === "starting") return { "data-starting-style": "" };
	if (state === "ending") return { "data-ending-style": "" };
	return {};
}
var BitsAttrs = class {
	#variant;
	#prefix;
	attrs;
	constructor(config) {
		this.#variant = config.getVariant ? config.getVariant() : null;
		this.#prefix = this.#variant ? `data-${this.#variant}-` : `data-${config.component}-`;
		this.getAttr = this.getAttr.bind(this);
		this.selector = this.selector.bind(this);
		this.attrs = Object.fromEntries(config.parts.map((part) => [part, this.getAttr(part)]));
	}
	getAttr(part, variantOverride) {
		if (variantOverride) return `data-${variantOverride}-${part}`;
		return `${this.#prefix}${part}`;
	}
	selector(part, variantOverride) {
		return `[${this.getAttr(part, variantOverride)}]`;
	}
};
function createBitsAttrs(config) {
	const bitsAttrs = new BitsAttrs(config);
	return {
		...bitsAttrs.attrs,
		selector: bitsAttrs.selector,
		getAttr: bitsAttrs.getAttr
	};
}
var ARROW_DOWN = "ArrowDown";
var ARROW_UP = "ArrowUp";
var HOME = "Home";
var PAGE_DOWN = "PageDown";
var PAGE_UP = "PageUp";
//#endregion
//#region node_modules/bits-ui/dist/internal/is.js
var isBrowser = typeof document !== "undefined";
var isIOS = getIsIOS();
function getIsIOS() {
	return isBrowser && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function isHTMLElement(element) {
	return element instanceof HTMLElement;
}
function isElementOrSVGElement(element) {
	return element instanceof Element || element instanceof SVGElement;
}
function isNotNull(value) {
	return value !== null;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/animations-complete.js
var AnimationsComplete = class {
	#opts;
	#currentFrame = null;
	#observer = null;
	#runId = 0;
	constructor(opts) {
		this.#opts = opts;
	}
	#cleanup() {
		if (this.#currentFrame !== null) {
			window.cancelAnimationFrame(this.#currentFrame);
			this.#currentFrame = null;
		}
		this.#observer?.disconnect();
		this.#observer = null;
		this.#runId++;
	}
	run(fn) {
		this.#cleanup();
		const node = this.#opts.ref.current;
		if (!node) return;
		if (typeof node.getAnimations !== "function") {
			this.#executeCallback(fn);
			return;
		}
		const runId = this.#runId;
		const executeIfCurrent = () => {
			if (runId !== this.#runId) return;
			this.#executeCallback(fn);
		};
		const waitForAnimations = () => {
			if (runId !== this.#runId) return;
			const animations = node.getAnimations();
			if (animations.length === 0) {
				executeIfCurrent();
				return;
			}
			Promise.all(animations.map((animation) => animation.finished)).then(() => {
				executeIfCurrent();
			}).catch(() => {
				if (runId !== this.#runId) return;
				if (node.getAnimations().some((animation) => animation.pending || animation.playState !== "finished")) {
					waitForAnimations();
					return;
				}
				executeIfCurrent();
			});
		};
		const requestWaitForAnimations = () => {
			this.#currentFrame = window.requestAnimationFrame(() => {
				this.#currentFrame = null;
				waitForAnimations();
			});
		};
		if (!this.#opts.afterTick.current) {
			requestWaitForAnimations();
			return;
		}
		this.#currentFrame = window.requestAnimationFrame(() => {
			this.#currentFrame = null;
			const startingStyleAttr = "data-starting-style";
			if (!node.hasAttribute(startingStyleAttr)) {
				requestWaitForAnimations();
				return;
			}
			this.#observer = new MutationObserver(() => {
				if (runId !== this.#runId) return;
				if (node.hasAttribute(startingStyleAttr)) return;
				this.#observer?.disconnect();
				this.#observer = null;
				requestWaitForAnimations();
			});
			this.#observer.observe(node, {
				attributes: true,
				attributeFilter: [startingStyleAttr]
			});
		});
	}
	#executeCallback(fn) {
		const execute = () => {
			fn();
		};
		if (this.#opts.afterTick) afterTick(execute);
		else execute();
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/presence-manager.svelte.js
var PresenceManager = class {
	#opts;
	#enabled;
	#afterAnimations;
	#shouldRender = false;
	#transitionStatus = void 0;
	#hasMounted = false;
	#transitionFrame = null;
	constructor(opts) {
		this.#opts = opts;
		this.#shouldRender = opts.open.current;
		this.#enabled = opts.enabled ?? true;
		this.#afterAnimations = new AnimationsComplete({
			ref: this.#opts.ref,
			afterTick: this.#opts.open
		});
		watch(() => this.#opts.open.current, (isOpen) => {
			if (!this.#hasMounted) {
				this.#hasMounted = true;
				return;
			}
			this.#clearTransitionFrame();
			if (!isOpen && this.#opts.shouldSkipExitAnimation?.()) {
				this.#shouldRender = false;
				this.#transitionStatus = void 0;
				this.#opts.onComplete?.();
				return;
			}
			if (isOpen) this.#shouldRender = true;
			this.#transitionStatus = isOpen ? "starting" : "ending";
			if (isOpen) this.#transitionFrame = window.requestAnimationFrame(() => {
				this.#transitionFrame = null;
				if (this.#opts.open.current) this.#transitionStatus = void 0;
			});
			if (!this.#enabled) {
				if (!isOpen) this.#shouldRender = false;
				this.#transitionStatus = void 0;
				this.#opts.onComplete?.();
				return;
			}
			this.#afterAnimations.run(() => {
				if (isOpen === this.#opts.open.current) {
					if (!this.#opts.open.current) this.#shouldRender = false;
					this.#transitionStatus = void 0;
					this.#opts.onComplete?.();
				}
			});
		});
	}
	get shouldRender() {
		return this.#shouldRender;
	}
	get transitionStatus() {
		return this.#transitionStatus;
	}
	#clearTransitionFrame() {
		if (this.#transitionFrame === null) return;
		window.cancelAnimationFrame(this.#transitionFrame);
		this.#transitionFrame = null;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/noop.js
/**
* A no operation function (does nothing)
*/
function noop() {}
//#endregion
//#region node_modules/bits-ui/dist/internal/create-id.js
function createId(prefixOrUid, uid) {
	return `bits-${prefixOrUid}`;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var BitsConfigContext = new Context("BitsConfig");
/**
* Gets the current Bits UI configuration state from the context.
*
* Returns a default configuration (where all values are `undefined`) if no configuration is found.
*/
function getBitsConfig() {
	const fallback = new BitsConfigState(null, {});
	return BitsConfigContext.getOr(fallback).opts;
}
/**
* Configuration state that inherits from parent configurations.
*
* @example
* Config resolution:
* ```
* Level 1: { defaultPortalTo: "#some-element", theme: "dark" }
* Level 2: { spacing: "large" } // inherits defaultPortalTo="#some-element", theme="dark"
* Level 3: { theme: "light" }   // inherits defaultPortalTo="#some-element", spacing="large", overrides theme="light"
* ```
*/
var BitsConfigState = class {
	opts;
	constructor(parent, opts) {
		const resolveConfigOption = createConfigResolver(parent, opts);
		this.opts = {
			defaultPortalTo: resolveConfigOption((config) => config.defaultPortalTo),
			defaultLocale: resolveConfigOption((config) => config.defaultLocale)
		};
	}
};
/**
* Returns a config resolver that resolves a given config option's value.
*
* The resolver creates reactive boxes that resolve config option values using this priority:
* 1. Current level's value (if defined)
* 2. Parent level's value (if defined and current is undefined)
* 3. `undefined` (if no value is found in either parent or child)
*
* @param parent - Parent configuration state (null if this is root level)
* @param currentOpts - Current level's configuration options
*
* @example
* ```typescript
* // Given this hierarchy:
* // Root: { defaultPortalTo: "#some-element" }
* // Child: { someOtherProp: "value" } // no defaultPortalTo specified
*
* const resolveConfigOption = createConfigResolver(parent, opts);
* const portalTo = resolveConfigOption(config => config.defaultPortalTo);
*
* // portalTo.current === "#some-element" (inherited from parent)
* // even when child didn't specify `defaultPortalTo`
* ```
*/
function createConfigResolver(parent, currentOpts) {
	return (getter) => {
		return boxWith(() => {
			const value = getter(currentOpts)?.current;
			if (value !== void 0) return value;
			if (parent === null) return void 0;
			return getter(parent.opts)?.current;
		});
	};
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
/**
* Creates a generic prop resolver that follows a standard priority chain:
* 1. The getter's prop value (if defined)
* 2. The config default value (if no getter prop value is defined)
* 3. The fallback value (if no config value found)
*/
function createPropResolver(configOption, fallback) {
	return (getProp) => {
		const config = getBitsConfig();
		return boxWith(() => {
			const propValue = getProp();
			if (propValue !== void 0) return propValue;
			const option = configOption(config).current;
			if (option !== void 0) return option;
			return fallback;
		});
	};
}
/**
* Resolves a portal's `to` value using the prop, the config default, or a fallback.
*
* Default value: `"body"`
*/
var resolvePortalToProp = createPropResolver((config) => config.defaultPortalTo, "body");
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function Portal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { to: toProp, children, disabled } = $$props;
		const to = resolvePortalToProp(() => toProp);
		getAllContexts();
		let target = derived(getTarget);
		function getTarget() {
			if (!isBrowser || disabled) return null;
			let localTarget = null;
			if (typeof to.current === "string") localTarget = document.querySelector(to.current);
			else localTarget = to.current;
			return localTarget;
		}
		let instance;
		function unmountInstance() {
			if (instance) {
				unmount();
				instance = null;
			}
		}
		watch([() => target(), () => disabled], ([target, disabled]) => {
			if (!target || disabled) {
				unmountInstance();
				return;
			}
			instance = mount();
			return () => {
				unmountInstance();
			};
		});
		if (disabled) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/debounce.js
function debounce(fn, wait = 500) {
	let timeout = null;
	const debounced = (...args) => {
		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, wait);
	};
	debounced.destroy = () => {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	};
	return debounced;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/elements.js
function isOrContainsTarget(node, target) {
	return node === target || node.contains(target);
}
function getOwnerDocument(el) {
	return el?.ownerDocument ?? document;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/dom.js
/**
* Determines if the click event truly occurred outside the content node.
* This was added to handle password managers and other elements that may be injected
* into the DOM but visually appear inside the content.
*/
function isClickTrulyOutside(event, contentNode) {
	const { clientX, clientY } = event;
	const rect = contentNode.getBoundingClientRect();
	return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/context-menu-attributes.js
var CONTEXT_MENU_TRIGGER_ATTR = "data-context-menu-trigger";
var CONTEXT_MENU_CONTENT_ATTR = "data-context-menu-content";
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
globalThis.bitsDismissableLayers ??= /* @__PURE__ */ new Map();
var DismissibleLayerState = class DismissibleLayerState {
	static create(opts) {
		return new DismissibleLayerState(opts);
	}
	opts;
	#interactOutsideProp;
	#behaviorType;
	#interceptedEvents = { pointerdown: false };
	#isResponsibleLayer = false;
	#capturedPointerDown = null;
	#isFocusInsideDOMTree = false;
	#documentObj = void 0;
	#onFocusOutside;
	#unsubClickListener = noop;
	/**
	* Set once the layer is torn down. Deferred work scheduled before teardown can
	* still run afterwards, so every such callback must short-circuit on this
	* before reading `this.opts.ref.current` — reading a destroyed `$derived`
	* triggers Svelte's `derived_inert` warning. A class field rather than a
	* constructor local so the class-field handlers below can see it too.
	*/
	#destroyed = false;
	constructor(opts) {
		this.opts = opts;
		this.#behaviorType = opts.interactOutsideBehavior;
		this.#interactOutsideProp = opts.onInteractOutside;
		this.#onFocusOutside = opts.onFocusOutside;
		let unsubEvents = noop;
		let registeredNode = null;
		const cleanup = () => {
			registeredNode = null;
			this.#resetState();
			globalThis.bitsDismissableLayers.delete(this);
			this.#handleInteractOutside.destroy();
			this.#unsubClickListener();
			unsubEvents();
		};
		watch([() => this.opts.enabled.current, () => this.opts.ref.current], ([enabled, node]) => {
			const nextNode = enabled ? node : null;
			if (registeredNode === nextNode) return;
			cleanup();
			if (!nextNode) return;
			registeredNode = nextNode;
			this.#documentObj = getOwnerDocument(nextNode);
			globalThis.bitsDismissableLayers.set(this, this.#behaviorType);
			unsubEvents = this.#addEventListeners();
		});
	}
	#handleFocus = (event) => {
		if (event.defaultPrevented) return;
		if (this.#destroyed || !this.opts.ref.current) return;
		afterTick(() => {
			if (this.#destroyed) return;
			if (!this.opts.ref.current || this.#isTargetWithinLayer(event.target)) return;
			if (event.target && !this.#isFocusInsideDOMTree) this.#onFocusOutside.current?.(event);
		});
	};
	#addEventListeners() {
		const document = this.#documentObj;
		const onPointerDownCapture = (event) => {
			run(() => {
				this.#markInterceptedEvent(event);
				this.#markResponsibleLayer(event);
			});
		};
		const onPointerDown = (event) => {
			if (event.cancelBubble || event !== this.#capturedPointerDown) return;
			this.#markNonInterceptedEvent(event);
			this.#handleInteractOutside(event);
		};
		document.addEventListener("pointerdown", onPointerDownCapture, true);
		document.addEventListener("pointerdown", onPointerDown);
		return executeCallbacks(() => document.removeEventListener("pointerdown", onPointerDownCapture, true), () => document.removeEventListener("pointerdown", onPointerDown), on(document, "focusin", this.#handleFocus));
	}
	#handleDismiss = (e) => {
		let event = e;
		if (event.defaultPrevented) event = createWrappedEvent(e);
		this.#interactOutsideProp.current(e);
	};
	#handleInteractOutside = debounce((e) => {
		if (!this.opts.ref.current) {
			this.#unsubClickListener();
			return;
		}
		const isEventValid = this.opts.isValidEvent.current(e, this.opts.ref.current) || isValidEvent(e, this.opts.ref.current);
		if (!this.#isResponsibleLayer || this.#isAnyEventIntercepted() || !isEventValid) {
			this.#unsubClickListener();
			return;
		}
		let event = e;
		if (event.defaultPrevented) event = createWrappedEvent(event);
		if (this.#behaviorType.current !== "close" && this.#behaviorType.current !== "defer-otherwise-close") {
			this.#unsubClickListener();
			return;
		}
		if (e.pointerType === "touch") {
			this.#unsubClickListener();
			this.#unsubClickListener = on(this.#documentObj, "click", this.#handleDismiss, { once: true });
		} else this.#interactOutsideProp.current(event);
	}, 10);
	#markInterceptedEvent = (e) => {
		this.#interceptedEvents[e.type] = true;
	};
	#markNonInterceptedEvent = (e) => {
		this.#interceptedEvents[e.type] = false;
	};
	#markResponsibleLayer = (event) => {
		this.#capturedPointerDown = event;
		if (!this.opts.ref.current) return;
		this.#isResponsibleLayer = isResponsibleLayer(this.opts.ref.current);
	};
	#isTargetWithinLayer = (target) => {
		if (!this.opts.ref.current) return false;
		return isOrContainsTarget(this.opts.ref.current, target);
	};
	/**
	* Resets the per-interaction state. Must stay synchronous.
	*
	* This was a `debounce(..., 20)` from when it was also wired to a capture-phase
	* interaction-end listener and had to land after the 10ms `#handleInteractOutside`
	* debounce. That listener is gone, but the debounce stayed on the `cleanup()` path —
	* and because `watch` runs `cleanup()` once per open (`ref` goes null -> node), every
	* layer scheduled a reset 20ms into its own lifetime. An outside `pointerdown` landing
	* 10-20ms after that cleanup would have its `#isResponsibleLayer` flag cleared by the
	* stale reset in the gap before the debounced `#handleInteractOutside` ran, which then
	* bailed and left the layer open. `cleanup()` destroys `#handleInteractOutside` anyway,
	* so nothing is left in flight that needs to observe the pre-reset state.
	*/
	#resetState = () => {
		for (const eventType in this.#interceptedEvents) this.#interceptedEvents[eventType] = false;
		this.#isResponsibleLayer = false;
		this.#capturedPointerDown = null;
	};
	#isAnyEventIntercepted() {
		return Object.values(this.#interceptedEvents).some(Boolean);
	}
	#onfocuscapture = () => {
		this.#isFocusInsideDOMTree = true;
	};
	#onblurcapture = () => {
		this.#isFocusInsideDOMTree = false;
	};
	props = {
		onfocuscapture: this.#onfocuscapture,
		onblurcapture: this.#onblurcapture
	};
};
function getTopMostDismissableLayer(layersArr = [...globalThis.bitsDismissableLayers]) {
	return layersArr.findLast(([_, { current: behaviorType }]) => behaviorType === "close" || behaviorType === "ignore");
}
function isResponsibleLayer(node) {
	const layersArr = [...globalThis.bitsDismissableLayers];
	/**
	* We first check if we can find a top layer with `close` or `ignore`.
	* If that top layer was found and matches the provided node, then the node is
	* responsible for the outside interaction. Otherwise, we know that all layers defer so
	* the first layer is the responsible one.
	*/
	const topMostLayer = getTopMostDismissableLayer(layersArr);
	if (topMostLayer) return topMostLayer[0].opts.ref.current === node;
	const [firstLayerNode] = layersArr[0];
	return firstLayerNode.opts.ref.current === node;
}
function isValidEvent(e, node) {
	const target = e.target;
	if (!isElementOrSVGElement(target)) return false;
	const targetIsContextMenuTrigger = Boolean(target.closest(`[${CONTEXT_MENU_TRIGGER_ATTR}]`));
	const nodeIsContextMenu = Boolean(node.closest(`[${CONTEXT_MENU_CONTENT_ATTR}]`));
	if ("button" in e && e.button > 0 && !targetIsContextMenuTrigger) return false;
	if ("button" in e && e.button === 0 && targetIsContextMenuTrigger && nodeIsContextMenu) return true;
	if (targetIsContextMenuTrigger && nodeIsContextMenu) return false;
	return getOwnerDocument(target).documentElement.contains(target) && !isOrContainsTarget(node, target) && isClickTrulyOutside(e, node);
}
function createWrappedEvent(e) {
	const capturedCurrentTarget = e.currentTarget;
	const capturedTarget = e.target;
	let newEvent;
	if (e instanceof PointerEvent) newEvent = new PointerEvent(e.type, e);
	else newEvent = new PointerEvent("pointerdown", e);
	let isPrevented = false;
	return new Proxy(newEvent, { get: (target, prop) => {
		if (prop === "currentTarget") return capturedCurrentTarget;
		if (prop === "target") return capturedTarget;
		if (prop === "preventDefault") return () => {
			isPrevented = true;
			if (typeof target.preventDefault === "function") target.preventDefault();
		};
		if (prop === "defaultPrevented") return isPrevented;
		if (prop in target) return target[prop];
		return e[prop];
	} });
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Dismissible_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { interactOutsideBehavior = "close", onInteractOutside = noop, onFocusOutside = noop, id, children, enabled, isValidEvent = () => false, ref } = $$props;
		const dismissibleLayerState = DismissibleLayerState.create({
			id: boxWith(() => id),
			interactOutsideBehavior: boxWith(() => interactOutsideBehavior),
			onInteractOutside: boxWith(() => onInteractOutside),
			enabled: boxWith(() => enabled),
			onFocusOutside: boxWith(() => onFocusOutside),
			isValidEvent: boxWith(() => isValidEvent),
			ref
		});
		children?.($$renderer, { props: dismissibleLayerState.props });
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var EscapeLayerState = class EscapeLayerState {
	static create(opts) {
		return new EscapeLayerState(opts);
	}
	opts;
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.domContext = new DOMContext(this.opts.ref);
		let unsubEvents = noop;
		watch(() => opts.enabled.current, (enabled) => {
			if (enabled) {
				globalThis.bitsEscapeLayers.set(this, opts.escapeKeydownBehavior);
				unsubEvents = this.#addEventListener();
			}
			return () => {
				unsubEvents();
				globalThis.bitsEscapeLayers.delete(this);
			};
		});
	}
	#addEventListener = () => {
		return on(this.domContext.getDocument(), "keydown", this.#onkeydown, { passive: false });
	};
	#onkeydown = (e) => {
		if (e.key !== "Escape" || !isResponsibleEscapeLayer(this)) return;
		const clonedEvent = new KeyboardEvent(e.type, e);
		e.preventDefault();
		const behaviorType = this.opts.escapeKeydownBehavior.current;
		if (behaviorType !== "close" && behaviorType !== "defer-otherwise-close") return;
		this.opts.onEscapeKeydown.current(clonedEvent);
	};
};
function isResponsibleEscapeLayer(instance) {
	const layersArr = [...globalThis.bitsEscapeLayers];
	/**
	* We first check if we can find a top layer with `close` or `ignore`.
	* If that top layer was found and matches the provided node, then the node is
	* responsible for the escape. Otherwise, we know that all layers defer so
	* the first layer is the responsible one.
	*/
	const topMostLayer = layersArr.findLast(([_, { current: behaviorType }]) => behaviorType === "close" || behaviorType === "ignore");
	if (topMostLayer) return topMostLayer[0] === instance;
	const [firstLayerNode] = layersArr[0];
	return firstLayerNode === instance;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function Escape_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { escapeKeydownBehavior = "close", onEscapeKeydown = noop, children, enabled, ref } = $$props;
		EscapeLayerState.create({
			escapeKeydownBehavior: boxWith(() => escapeKeydownBehavior),
			onEscapeKeydown: boxWith(() => onEscapeKeydown),
			enabled: boxWith(() => enabled),
			ref
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var FocusScopeManager = class FocusScopeManager {
	static instance;
	#scopeStack = simpleBox([]);
	#focusHistory = /* @__PURE__ */ new WeakMap();
	#preFocusHistory = /* @__PURE__ */ new WeakMap();
	static getInstance() {
		if (!this.instance) this.instance = new FocusScopeManager();
		return this.instance;
	}
	register(scope) {
		const current = this.getActive();
		if (current && current !== scope) current.pause();
		const activeElement = document.activeElement;
		if (activeElement && activeElement !== document.body) this.#preFocusHistory.set(scope, activeElement);
		this.#scopeStack.current = this.#scopeStack.current.filter((s) => s !== scope);
		this.#scopeStack.current.unshift(scope);
	}
	unregister(scope) {
		this.#scopeStack.current = this.#scopeStack.current.filter((s) => s !== scope);
		const next = this.getActive();
		if (next) next.resume();
	}
	getActive() {
		return this.#scopeStack.current[0];
	}
	setFocusMemory(scope, element) {
		this.#focusHistory.set(scope, element);
	}
	getFocusMemory(scope) {
		return this.#focusHistory.get(scope);
	}
	isActiveScope(scope) {
		return this.getActive() === scope;
	}
	setPreFocusMemory(scope, element) {
		this.#preFocusHistory.set(scope, element);
	}
	getPreFocusMemory(scope) {
		return this.#preFocusHistory.get(scope);
	}
	clearPreFocusMemory(scope) {
		this.#preFocusHistory.delete(scope);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte.js
var FocusScope = class FocusScope {
	#paused = false;
	#container = null;
	#manager = FocusScopeManager.getInstance();
	#cleanupFns = [];
	#opts;
	constructor(opts) {
		this.#opts = opts;
	}
	get paused() {
		return this.#paused;
	}
	pause() {
		this.#paused = true;
	}
	resume() {
		this.#paused = false;
	}
	#cleanup() {
		for (const fn of this.#cleanupFns) fn();
		this.#cleanupFns = [];
	}
	mount(container) {
		if (this.#container) this.unmount();
		this.#container = container;
		this.#manager.register(this);
		this.#setupEventListeners();
		this.#handleOpenAutoFocus();
	}
	unmount() {
		if (!this.#container) return;
		this.#cleanup();
		this.#handleCloseAutoFocus();
		this.#manager.unregister(this);
		this.#manager.clearPreFocusMemory(this);
		this.#container = null;
	}
	#handleOpenAutoFocus() {
		if (!this.#container) return;
		const event = new CustomEvent("focusScope.onOpenAutoFocus", {
			bubbles: false,
			cancelable: true
		});
		this.#opts.onOpenAutoFocus.current(event);
		if (!event.defaultPrevented) requestAnimationFrame(() => {
			if (!this.#container || this.#paused || !this.#manager.isActiveScope(this) || this.#container.contains(this.#container.ownerDocument.activeElement)) return;
			const firstTabbable = this.#getFirstTabbable();
			if (firstTabbable) {
				firstTabbable.focus();
				this.#manager.setFocusMemory(this, firstTabbable);
			} else this.#container.focus();
		});
	}
	#handleCloseAutoFocus() {
		const event = new CustomEvent("focusScope.onCloseAutoFocus", {
			bubbles: false,
			cancelable: true
		});
		this.#opts.onCloseAutoFocus.current?.(event);
		if (!event.defaultPrevented) {
			const preFocusedElement = this.#manager.getPreFocusMemory(this);
			if (preFocusedElement && document.contains(preFocusedElement)) try {
				preFocusedElement.focus();
			} catch {
				document.body.focus();
			}
		}
	}
	#setupEventListeners() {
		if (!this.#container || !this.#opts.trap.current) return;
		const container = this.#container;
		const doc = container.ownerDocument;
		const handleFocus = (e) => {
			if (this.#paused || !this.#manager.isActiveScope(this)) return;
			const target = e.target;
			if (!target) return;
			if (container.contains(target)) this.#manager.setFocusMemory(this, target);
			else {
				const lastFocused = this.#manager.getFocusMemory(this);
				if (lastFocused && container.contains(lastFocused) && isFocusable(lastFocused)) {
					e.preventDefault();
					lastFocused.focus();
				} else {
					const firstTabbable = this.#getFirstTabbable();
					const firstFocusable = this.#getAllFocusables()[0];
					(firstTabbable || firstFocusable || container).focus();
				}
			}
		};
		const handleKeydown = (e) => {
			if (!this.#opts.loop || this.#paused || e.key !== "Tab") return;
			if (!this.#manager.isActiveScope(this)) return;
			const tabbables = this.#getTabbables();
			if (tabbables.length === 0) return;
			const first = tabbables[0];
			const last = tabbables[tabbables.length - 1];
			if (!e.shiftKey && doc.activeElement === last) {
				e.preventDefault();
				first.focus();
			} else if (e.shiftKey && doc.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		};
		this.#cleanupFns.push(on(doc, "focusin", handleFocus, { capture: true }), on(container, "keydown", handleKeydown));
		const observer = new MutationObserver(() => {
			const lastFocused = this.#manager.getFocusMemory(this);
			if (lastFocused && !container.contains(lastFocused)) {
				const firstTabbable = this.#getFirstTabbable();
				const firstFocusable = this.#getAllFocusables()[0];
				const elementToFocus = firstTabbable || firstFocusable;
				if (elementToFocus) {
					elementToFocus.focus();
					this.#manager.setFocusMemory(this, elementToFocus);
				} else container.focus();
			}
		});
		observer.observe(container, {
			childList: true,
			subtree: true
		});
		this.#cleanupFns.push(() => observer.disconnect());
	}
	#getTabbables() {
		if (!this.#container) return [];
		return tabbable(this.#container, {
			includeContainer: false,
			getShadowRoot: true
		});
	}
	#getFirstTabbable() {
		return this.#getTabbables()[0] || null;
	}
	#getAllFocusables() {
		if (!this.#container) return [];
		return focusable(this.#container, {
			includeContainer: false,
			getShadowRoot: true
		});
	}
	static use(opts) {
		let scope = null;
		watch([() => opts.ref.current, () => opts.enabled.current], ([ref, enabled]) => {
			if (ref && enabled) {
				if (!scope) scope = new FocusScope(opts);
				scope.mount(ref);
			} else if (scope) {
				scope.unmount();
				scope = null;
			}
		});
		return { get props() {
			return { tabindex: -1 };
		} };
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function Focus_scope($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { enabled = false, trapFocus = false, loop = false, onCloseAutoFocus = noop, onOpenAutoFocus = noop, focusScope, ref } = $$props;
		const focusScopeState = FocusScope.use({
			enabled: boxWith(() => enabled),
			trap: boxWith(() => trapFocus),
			loop,
			onCloseAutoFocus: boxWith(() => onCloseAutoFocus),
			onOpenAutoFocus: boxWith(() => onOpenAutoFocus),
			ref
		});
		focusScope?.($$renderer, { props: focusScopeState.props });
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
var noopPointer = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var TextSelectionLayerState = class TextSelectionLayerState {
	static create(opts) {
		return new TextSelectionLayerState(opts);
	}
	opts;
	domContext;
	#unsubSelectionLock = noop;
	#enabledSnapshot = false;
	#onPointerDownSnapshot = noopPointer;
	#onPointerUpSnapshot = noopPointer;
	constructor(opts) {
		this.opts = opts;
		this.domContext = new DOMContext(opts.ref);
		let unsubEvents = noop;
		watch(() => [
			this.opts.enabled.current,
			this.opts.onPointerDown.current,
			this.opts.onPointerUp.current
		], ([enabled, onPointerDown, onPointerUp]) => {
			this.#enabledSnapshot = enabled;
			this.#onPointerDownSnapshot = onPointerDown;
			this.#onPointerUpSnapshot = onPointerUp;
			if (enabled) {
				globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled);
				unsubEvents();
				unsubEvents = this.#addEventListeners();
			}
			return () => {
				this.#enabledSnapshot = false;
				unsubEvents();
				this.#resetSelectionLock();
				globalThis.bitsTextSelectionLayers.delete(this);
			};
		});
	}
	#addEventListeners() {
		return executeCallbacks(on(this.domContext.getDocument(), "pointerdown", this.#pointerdown), on(this.domContext.getDocument(), "pointerup", this.#pointerup));
	}
	#pointerup = (e) => {
		this.#resetSelectionLock();
		if (e.defaultPrevented) return;
		this.#onPointerUpSnapshot(e);
	};
	#pointerdown = (e) => {
		if (!this.#enabledSnapshot) return;
		this.#resetSelectionLock();
		const node = this.opts.ref.current;
		const target = e.target;
		if (!isHTMLElement(node) || !isHTMLElement(target)) return;
		/**
		* We only lock user-selection overflow if layer is the top most layer and
		* pointerdown occurred inside the node. You are still allowed to select text
		* outside the node provided pointerdown occurs outside the node.
		*/
		if (!isHighestLayer(this) || !contains(node, target)) return;
		this.#onPointerDownSnapshot(e);
		if (e.defaultPrevented) return;
		this.#unsubSelectionLock = preventTextSelectionOverflow(node, this.domContext.getDocument().body);
	};
	#resetSelectionLock = () => {
		this.#unsubSelectionLock();
		this.#unsubSelectionLock = noop;
	};
};
var getUserSelect = (node) => node.style.userSelect || node.style.webkitUserSelect;
function preventTextSelectionOverflow(node, body) {
	const originalBodyUserSelect = getUserSelect(body);
	const originalNodeUserSelect = getUserSelect(node);
	setUserSelect(body, "none");
	setUserSelect(node, "text");
	return () => {
		setUserSelect(body, originalBodyUserSelect);
		setUserSelect(node, originalNodeUserSelect);
	};
}
function setUserSelect(node, value) {
	node.style.userSelect = value;
	node.style.webkitUserSelect = value;
}
function isHighestLayer(instance) {
	const layersArr = [...globalThis.bitsTextSelectionLayers];
	if (!layersArr.length) return false;
	const highestLayer = layersArr.at(-1);
	if (!highestLayer) return false;
	return highestLayer[0] === instance;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function Text_selection_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventOverflowTextSelection = true, onPointerDown = noop, onPointerUp = noop, id, children, enabled, ref } = $$props;
		TextSelectionLayerState.create({
			id: boxWith(() => id),
			onPointerDown: boxWith(() => onPointerDown),
			onPointerUp: boxWith(() => onPointerUp),
			enabled: boxWith(() => enabled && preventOverflowTextSelection),
			ref
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
/**
* Generates a unique ID based on a global counter.
*/
function useId(prefix = "bits") {
	globalThis.bitsIdCounter.current++;
	return `${prefix}-${globalThis.bitsIdCounter.current}`;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/shared-state.svelte.js
var SharedState = class {
	#factory;
	#subscribers = 0;
	#state;
	#scope;
	constructor(factory) {
		this.#factory = factory;
	}
	#dispose() {
		this.#subscribers -= 1;
		if (this.#scope && this.#subscribers <= 0) {
			this.#scope();
			this.#state = void 0;
			this.#scope = void 0;
		}
	}
	get(...args) {
		this.#subscribers += 1;
		if (this.#state === void 0) this.#scope = () => {};
		return this.#state;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/body-scroll-lock.svelte.js
var lockMap = new SvelteMap();
var initialBodyStyle = null;
var cleanupTimeoutId = null;
var isInCleanupTransition = false;
var anyLocked = boxWith(() => {
	for (const value of lockMap.values()) if (value) return true;
	return false;
});
/**
* We track the time we scheduled the cleanup to prevent race conditions
* when multiple locks are created/destroyed in the same tick, ensuring
* only the last one to schedule the cleanup will run.
*
* reference: https://github.com/huntabyte/bits-ui/issues/1639
*/
var cleanupScheduledAt = null;
var bodyLockStackCount = new SharedState(() => {
	function resetBodyStyle(documentObj) {}
	function cancelPendingCleanup() {
		if (cleanupTimeoutId === null) return;
		window.clearTimeout(cleanupTimeoutId);
		cleanupTimeoutId = null;
	}
	function scheduleCleanupIfNoNewLocks(delay, callback) {
		cancelPendingCleanup();
		isInCleanupTransition = true;
		cleanupScheduledAt = Date.now();
		const currentCleanupId = cleanupScheduledAt;
		/**
		* We schedule the cleanup to run after a delay to allow new locks to register
		* that might have been added in the same tick as the current cleanup.
		*
		* If a new lock is added in the same tick, the cleanup will be cancelled and
		* a new cleanup will be scheduled.
		*
		* This is to prevent the cleanup from running too early and resetting the body
		* style before the new lock has had a chance to apply its styles.
		*/
		const cleanupFn = () => {
			cleanupTimeoutId = null;
			if (cleanupScheduledAt !== currentCleanupId) return;
			if (!isAnyLocked(lockMap)) {
				isInCleanupTransition = false;
				callback();
			} else isInCleanupTransition = false;
		};
		const actualDelay = delay === null ? 24 : delay;
		cleanupTimeoutId = window.setTimeout(cleanupFn, actualDelay);
	}
	function ensureInitialStyleCaptured() {
		if (initialBodyStyle === null && lockMap.size === 0 && !isInCleanupTransition) initialBodyStyle = document.body.getAttribute("style");
	}
	watch(() => anyLocked.current, () => {
		if (!anyLocked.current) return;
		ensureInitialStyleCaptured();
		isInCleanupTransition = false;
		const htmlStyle = getComputedStyle(document.documentElement);
		const bodyStyle = getComputedStyle(document.body);
		const hasStableGutter = htmlStyle.scrollbarGutter?.includes("stable") || bodyStyle.scrollbarGutter?.includes("stable");
		const verticalScrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		const config = {
			padding: Number.parseInt(bodyStyle.paddingRight ?? "0", 10) + verticalScrollbarWidth,
			margin: Number.parseInt(bodyStyle.marginRight ?? "0", 10)
		};
		if (verticalScrollbarWidth > 0 && !hasStableGutter) {
			document.body.style.paddingRight = `${config.padding}px`;
			document.body.style.marginRight = `${config.margin}px`;
			document.body.style.setProperty("--scrollbar-width", `${verticalScrollbarWidth}px`);
		}
		document.body.style.overflow = "hidden";
		if (isIOS) on(document, "touchmove", (e) => {
			if (e.target !== document.documentElement) return;
			if (e.touches.length > 1) return;
			e.preventDefault();
		}, { passive: false });
		/**
		* We ensure pointer-events: none is applied _after_ DOM updates, so that any focus/
		* interaction changes from opening overlays/menus complete _before_ we block pointer
		* events.
		*
		* this avoids race conditions where pointer-events could be set too early and break
		* focus/interaction.
		*/
		afterTick(() => {
			document.body.style.pointerEvents = "none";
			document.body.style.overflow = "hidden";
		});
	});
	return {
		get lockMap() {
			return lockMap;
		},
		resetBodyStyle,
		scheduleCleanupIfNoNewLocks,
		cancelPendingCleanup,
		ensureInitialStyleCaptured
	};
});
var BodyScrollLock = class {
	#id = useId();
	#initialState;
	#restoreScrollDelay = () => null;
	#countState;
	locked;
	constructor(initialState, restoreScrollDelay = () => null) {
		this.#initialState = initialState;
		this.#restoreScrollDelay = restoreScrollDelay;
		this.#countState = bodyLockStackCount.get();
		if (!this.#countState) return;
		/**
		* Since a new lock is being created, we cancel any pending cleanup to
		* prevent the cleanup from running too early and resetting the body style
		* before the new lock has had a chance to apply its styles.
		*
		* reference: https://github.com/huntabyte/bits-ui/issues/1639
		*/
		this.#countState.cancelPendingCleanup();
		this.#countState.ensureInitialStyleCaptured();
		this.#countState.lockMap.set(this.#id, this.#initialState ?? false);
		this.locked = boxWith(() => this.#countState.lockMap.get(this.#id) ?? false, (v) => this.#countState.lockMap.set(this.#id, v));
	}
};
function isAnyLocked(map) {
	for (const [_, value] of map) if (value) return true;
	return false;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function Scroll_lock($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventScroll = true, restoreScrollDelay = null } = $$props;
		if (preventScroll) new BodyScrollLock(preventScroll, () => restoreScrollDelay);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/avatar/avatar.svelte.js
var avatarAttrs = createBitsAttrs({
	component: "avatar",
	parts: [
		"root",
		"image",
		"fallback"
	]
});
var AvatarRootContext = new Context("Avatar.Root");
var AvatarRootState = class AvatarRootState {
	static create(opts) {
		return AvatarRootContext.set(new AvatarRootState(opts));
	}
	opts;
	domContext;
	attachment;
	constructor(opts) {
		this.opts = opts;
		this.domContext = new DOMContext(this.opts.ref);
		this.loadImage = this.loadImage.bind(this);
		this.attachment = attachRef(this.opts.ref);
	}
	loadImage(src, crossorigin, referrerPolicy) {
		if (this.opts.loadingStatus.current === "loaded") return;
		let imageTimerId;
		const image = new Image();
		image.src = src;
		if (crossorigin !== void 0) image.crossOrigin = crossorigin;
		if (referrerPolicy) image.referrerPolicy = referrerPolicy;
		this.opts.loadingStatus.current = "loading";
		image.onload = () => {
			imageTimerId = this.domContext.setTimeout(() => {
				this.opts.loadingStatus.current = "loaded";
			}, this.opts.delayMs.current);
		};
		image.onerror = () => {
			this.opts.loadingStatus.current = "error";
		};
		return () => {
			image.onload = null;
			image.onerror = null;
			if (!imageTimerId) return;
			this.domContext.clearTimeout(imageTimerId);
		};
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		[avatarAttrs.root]: "",
		"data-status": this.opts.loadingStatus.current,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var AvatarFallbackState = class AvatarFallbackState {
	static create(opts) {
		return new AvatarFallbackState(opts, AvatarRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref);
	}
	#style = derived(() => this.root.opts.loadingStatus.current === "loaded" ? { display: "none" } : void 0);
	get style() {
		return this.#style();
	}
	set style($$value) {
		return this.#style($$value);
	}
	#props = derived(() => ({
		style: this.style,
		"data-status": this.root.opts.loadingStatus.current,
		[avatarAttrs.fallback]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/avatar/components/avatar.svelte
function Avatar$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { delayMs = 0, loadingStatus = "loading", onLoadingStatusChange, child, children, id = createId(uid), ref = null, $$slots, $$events, ...restProps } = $$props;
		const rootState = AvatarRootState.create({
			delayMs: boxWith(() => delayMs),
			loadingStatus: boxWith(() => loadingStatus, (v) => {
				if (loadingStatus !== v) {
					loadingStatus = v;
					onLoadingStatusChange?.(v);
				}
			}),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			loadingStatus,
			ref
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/avatar/components/avatar-fallback.svelte
function Avatar_fallback$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, id = createId(uid), ref = null, $$slots, $$events, ...restProps } = $$props;
		const fallbackState = AvatarFallbackState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, fallbackState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/arrays.js
/**
* Returns the array element after the given index, or undefined for out-of-bounds or empty arrays.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the beginning of the array if the next index is out of bounds?
*/
/**
* Returns the array element after the given index, or undefined for out-of-bounds or empty arrays.
* For single-element arrays, returns the element if the index is 0.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the beginning of the array if the next index is out of bounds?
*/
function next(array, index, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	if (array.length === 1 && index === 0) return array[0];
	if (index === array.length - 1) return loop ? array[0] : void 0;
	return array[index + 1];
}
/**
* Returns the array element prior to the given index, or undefined for out-of-bounds or empty arrays.
* For single-element arrays, returns the element if the index is 0.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the end of the array if the previous index is out of bounds?
*/
function prev(array, index, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	if (array.length === 1 && index === 0) return array[0];
	if (index === 0) return loop ? array[array.length - 1] : void 0;
	return array[index - 1];
}
/**
* Returns the element some number after the given index. If the target index is out of bounds:
*   - If looping is disabled, the first or last element will be returned.
*   - If looping is enabled, it will wrap around the array.
* Returns undefined for empty arrays or out-of-bounds initial indices.
* @param array the array.
* @param index the index of the current element.
* @param increment the number of elements to move forward (can be negative).
* @param loop loop around the array if the target index is out of bounds?
*/
function forward(array, index, increment, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	let targetIndex = index + increment;
	if (loop) targetIndex = (targetIndex % array.length + array.length) % array.length;
	else targetIndex = Math.max(0, Math.min(targetIndex, array.length - 1));
	return array[targetIndex];
}
/**
* Returns the element some number before the given index. If the target index is out of bounds:
*   - If looping is disabled, the first or last element will be returned.
*   - If looping is enabled, it will wrap around the array.
* Returns undefined for empty arrays or out-of-bounds initial indices.
* @param array the array.
* @param index the index of the current element.
* @param decrement the number of elements to move backward (can be negative).
* @param loop loop around the array if the target index is out of bounds?
*/
function backward(array, index, decrement, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	let targetIndex = index - decrement;
	if (loop) targetIndex = (targetIndex % array.length + array.length) % array.length;
	else targetIndex = Math.max(0, Math.min(targetIndex, array.length - 1));
	return array[targetIndex];
}
/**
* Finds the next matching item from a list of values based on a search string.
*
* This function handles several special cases in typeahead behavior:
*
* 1. Space handling: When a search string ends with a space, it handles it specially:
*    - If there's only one match for the text before the space, it ignores the space
*    - If there are multiple matches and the current match already starts with the search prefix
*      followed by a space, it keeps the current match (doesn't change selection on space)
*    - Only after typing characters beyond the space will it move to a more specific match
*
* 2. Repeated character handling: If a search consists of repeated characters (e.g., "aaa"),
*    it treats it as a single character for matching purposes
*
* 3. Cycling behavior: The function wraps around the values array starting from the current match
*    to find the next appropriate match, creating a cycling selection behavior
*
* @param values - Array of string values to search through (e.g., the text content of menu items)
* @param search - The current search string typed by the user
* @param currentMatch - The currently selected/matched item, if any
* @returns The next matching value that should be selected, or undefined if no match is found
*/
function getNextMatch(values, search, currentMatch) {
	const lowerSearch = search.toLowerCase();
	if (lowerSearch.endsWith(" ")) {
		const searchWithoutSpace = lowerSearch.slice(0, -1);
		/**
		* If there's only one match for the prefix without space, we don't
		* watch to match with space.
		*/
		if (values.filter((value) => value.toLowerCase().startsWith(searchWithoutSpace)).length <= 1) return getNextMatch(values, searchWithoutSpace, currentMatch);
		const currentMatchLowercase = currentMatch?.toLowerCase();
		/**
		* If the current match already starts with the search prefix and has a space afterward,
		* and the user has only typed up to that space, keep the current match until they
		* disambiguate.
		*/
		if (currentMatchLowercase && currentMatchLowercase.startsWith(searchWithoutSpace) && currentMatchLowercase.charAt(searchWithoutSpace.length) === " " && search.trim() === searchWithoutSpace) return currentMatch;
		/**
		* With multiple matches, find items that match the full search string with space
		*/
		const spacedMatches = values.filter((value) => value.toLowerCase().startsWith(lowerSearch));
		/**
		* If we found matches with the space, use the first one that's not the current match
		*/
		if (spacedMatches.length > 0) {
			const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
			return wrapArray(spacedMatches, Math.max(currentMatchIndex, 0)).find((match) => match !== currentMatch) || currentMatch;
		}
	}
	const normalizedSearch = search.length > 1 && Array.from(search).every((char) => char === search[0]) ? search[0] : search;
	const normalizedLowerSearch = normalizedSearch.toLowerCase();
	const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
	let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
	if (normalizedSearch.length === 1) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) => value?.toLowerCase().startsWith(normalizedLowerSearch));
	return nextMatch !== currentMatch ? nextMatch : void 0;
}
/**
* Wraps an array around itself at a given start index
* Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
*/
function wrapArray(array, startIndex) {
	return array.map((_, index) => array[(startIndex + index) % array.length]);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/hidden-input.svelte
function Hidden_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, $$slots, $$events, ...restProps } = $$props;
		const mergedProps = derived(() => mergeProps(restProps, {
			"aria-hidden": "true",
			tabindex: -1,
			style: {
				...srOnlyStyles,
				position: "absolute",
				top: "0",
				left: "0"
			}
		}));
		if (mergedProps().type === "checkbox") $$renderer.push(`<!--[0--><input${attributes({
			...mergedProps(),
			value
		}, void 0, void 0, void 0, 4)}/>`);
		else $$renderer.push(`<!--[-1--><input${attributes({
			value,
			...mergedProps()
		}, void 0, void 0, void 0, 4)}/>`);
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/floating-root.svelte.js
var FloatingRootContext = new Context("Floating.Root");
var FloatingTooltipRootContext = new Context("Floating.Root");
var FloatingRootState = class FloatingRootState {
	static create(tooltip = false) {
		return tooltip ? FloatingTooltipRootContext.set(new FloatingRootState()) : FloatingRootContext.set(new FloatingRootState());
	}
	anchorNode = simpleBox(null);
	customAnchorNode = simpleBox(null);
	triggerNode = simpleBox(null);
	constructor() {}
};
var FloatingAnchorState = class FloatingAnchorState {
	static create(opts, tooltip = false) {
		return tooltip ? new FloatingAnchorState(opts, FloatingTooltipRootContext.get()) : new FloatingAnchorState(opts, FloatingRootContext.get());
	}
	opts;
	root;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		if (opts.virtualEl && opts.virtualEl.current) root.triggerNode = boxFrom(opts.virtualEl.current);
		else root.triggerNode = opts.ref;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function Floating_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, tooltip = false } = $$props;
		FloatingRootState.create(tooltip);
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
function get(valueOrGetValue) {
	return typeof valueOrGetValue === "function" ? valueOrGetValue() : valueOrGetValue;
}
function getDPR(element) {
	if (typeof window === "undefined") return 1;
	return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function roundByDPR(element, value) {
	const dpr = getDPR(element);
	return Math.round(value * dpr) / dpr;
}
function getFloatingContentCSSVars(name) {
	return {
		[`--bits-${name}-content-transform-origin`]: `var(--bits-floating-transform-origin)`,
		[`--bits-${name}-content-available-width`]: `var(--bits-floating-available-width)`,
		[`--bits-${name}-content-available-height`]: `var(--bits-floating-available-height)`,
		[`--bits-${name}-anchor-width`]: `var(--bits-floating-anchor-width)`,
		[`--bits-${name}-anchor-height`]: `var(--bits-floating-anchor-height)`
	};
}
//#endregion
//#region node_modules/bits-ui/dist/internal/box-auto-reset.svelte.js
var defaultOptions = {
	afterMs: 1e4,
	onChange: noop
};
function boxAutoReset(defaultValue, options) {
	const { afterMs, onChange, getWindow } = {
		...defaultOptions,
		...options
	};
	let timeout = null;
	let value = defaultValue;
	function resetAfter() {
		return getWindow().setTimeout(() => {
			value = defaultValue;
			onChange?.(defaultValue);
		}, afterMs);
	}
	return boxWith(() => value, (v) => {
		value = v;
		onChange?.(v);
		if (timeout) getWindow().clearTimeout(timeout);
		timeout = resetAfter();
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/data-typeahead.svelte.js
var DataTypeahead = class {
	#opts;
	#candidateValues = derived(() => this.#opts.candidateValues());
	#search;
	constructor(opts) {
		this.#opts = opts;
		this.#search = boxAutoReset("", {
			afterMs: 1e3,
			getWindow: this.#opts.getWindow
		});
		this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this);
		this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(key) {
		if (!this.#opts.enabled() || !this.#candidateValues().length) return;
		this.#search.current = this.#search.current + key;
		const currentItem = this.#opts.getCurrentItem();
		const currentMatch = this.#candidateValues().find((item) => item === currentItem) ?? "";
		const nextMatch = getNextMatch(this.#candidateValues().map((item) => item ?? ""), this.#search.current, currentMatch);
		const newItem = this.#candidateValues().find((item) => item === nextMatch);
		if (newItem) this.#opts.onMatch(newItem);
		return newItem;
	}
	resetTypeahead() {
		this.#search.current = "";
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/dom-typeahead.svelte.js
var DOMTypeahead = class {
	#opts;
	#search;
	#onMatch = derived(() => {
		if (this.#opts.onMatch) return this.#opts.onMatch;
		return (node) => node.focus();
	});
	#getCurrentItem = derived(() => {
		if (this.#opts.getCurrentItem) return this.#opts.getCurrentItem;
		return this.#opts.getActiveElement;
	});
	constructor(opts) {
		this.#opts = opts;
		this.#search = boxAutoReset("", {
			afterMs: 1e3,
			getWindow: opts.getWindow
		});
		this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this);
		this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(key, candidates) {
		if (!candidates.length) return;
		this.#search.current = this.#search.current + key;
		const currentItem = this.#getCurrentItem()();
		const currentMatch = candidates.find((item) => item === currentItem)?.textContent?.trim() ?? "";
		const nextMatch = getNextMatch(candidates.map((item) => item.textContent?.trim() ?? ""), this.#search.current, currentMatch);
		const newItem = candidates.find((item) => item.textContent?.trim() === nextMatch);
		if (newItem) this.#onMatch()(newItem);
		return newItem;
	}
	resetTypeahead() {
		this.#search.current = "";
	}
	get search() {
		return this.#search.current;
	}
};
var FIRST_KEYS = [
	ARROW_DOWN,
	PAGE_UP,
	HOME
];
var LAST_KEYS = [
	ARROW_UP,
	PAGE_DOWN,
	"End"
];
var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
var selectAttrs = createBitsAttrs({
	component: "select",
	parts: [
		"trigger",
		"content",
		"item",
		"viewport",
		"scroll-up-button",
		"scroll-down-button",
		"group",
		"group-label",
		"separator",
		"arrow",
		"input",
		"content-wrapper",
		"item-text",
		"value"
	]
});
var SelectRootContext = new Context("Select.Root | Combobox.Root");
var SelectContentContext = new Context("Select.Content | Combobox.Content");
var SelectBaseRootState = class {
	opts;
	touchedInput = false;
	inputNode = null;
	contentNode = null;
	contentPresence;
	viewportNode = null;
	triggerNode = null;
	valueNode = null;
	valueId = "";
	highlightedNode = null;
	#highlightedValue = derived(() => {
		if (!this.highlightedNode) return null;
		return this.highlightedNode.getAttribute("data-value");
	});
	get highlightedValue() {
		return this.#highlightedValue();
	}
	set highlightedValue($$value) {
		return this.#highlightedValue($$value);
	}
	#highlightedId = derived(() => {
		if (!this.highlightedNode) return void 0;
		return this.highlightedNode.id;
	});
	get highlightedId() {
		return this.#highlightedId();
	}
	set highlightedId($$value) {
		return this.#highlightedId($$value);
	}
	#highlightedLabel = derived(() => {
		if (!this.highlightedNode) return null;
		return this.highlightedNode.getAttribute("data-label");
	});
	get highlightedLabel() {
		return this.#highlightedLabel();
	}
	set highlightedLabel($$value) {
		return this.#highlightedLabel($$value);
	}
	contentIsPositioned = false;
	isUsingKeyboard = false;
	isCombobox = false;
	domContext = new DOMContext(() => null);
	constructor(opts) {
		this.opts = opts;
		this.isCombobox = opts.isCombobox;
		this.contentPresence = new PresenceManager({
			ref: boxWith(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		});
	}
	setHighlightedNode(node, initial = false) {
		this.highlightedNode = node;
		if (node && (this.isUsingKeyboard || initial)) this.scrollHighlightedNodeIntoView(node);
	}
	scrollHighlightedNodeIntoView(node) {
		if (!this.viewportNode || !this.contentIsPositioned) return;
		node.scrollIntoView({ block: this.opts.scrollAlignment.current });
	}
	getCandidateNodes() {
		const node = this.contentNode;
		if (!node) return [];
		return Array.from(node.querySelectorAll(`[${this.getBitsAttr("item")}]:not([data-disabled])`));
	}
	setHighlightedToFirstCandidate(initial = false) {
		this.setHighlightedNode(null);
		let nodes = this.getCandidateNodes();
		if (!nodes.length) return;
		if (this.viewportNode) {
			const viewportRect = this.viewportNode.getBoundingClientRect();
			nodes = nodes.filter((node) => {
				if (!this.viewportNode) return false;
				const nodeRect = node.getBoundingClientRect();
				return nodeRect.right <= viewportRect.right && nodeRect.left >= viewportRect.left && nodeRect.bottom <= viewportRect.bottom && nodeRect.top >= viewportRect.top;
			});
		}
		this.setHighlightedNode(nodes[0], initial);
	}
	getNodeByValue(value) {
		return this.getCandidateNodes().find((node) => node.dataset.value === value) ?? null;
	}
	/**
	* Resolves the display label for a value: `items` entry when present, otherwise the
	* mounted item's `data-label` or its text content.
	*/
	getLabelForValue(value) {
		if (value === "") return "";
		const fromItems = this.opts.items.current.find((item) => item.value === value)?.label;
		if (fromItems !== void 0) return fromItems;
		const node = this.getNodeByValue(value);
		if (node) {
			const dataLabel = node.getAttribute("data-label");
			if (dataLabel !== null && dataLabel !== "") return dataLabel;
			return node.textContent?.trim() ?? value;
		}
		return value;
	}
	setOpen(open) {
		this.opts.open.current = open;
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	handleOpen() {
		this.setOpen(true);
	}
	handleClose() {
		this.setHighlightedNode(null);
		this.setOpen(false);
	}
	toggleMenu() {
		this.toggleOpen();
	}
	getBitsAttr = (part) => {
		return selectAttrs.getAttr(part, this.isCombobox ? "combobox" : void 0);
	};
};
var SelectSingleRootState = class extends SelectBaseRootState {
	opts;
	isMulti = false;
	#hasValue = derived(() => this.opts.value.current !== "");
	get hasValue() {
		return this.#hasValue();
	}
	set hasValue($$value) {
		return this.#hasValue($$value);
	}
	#currentLabel = derived(() => {
		if (!this.opts.items.current.length) return "";
		return this.opts.items.current.find((item) => item.value === this.opts.value.current)?.label ?? "";
	});
	get currentLabel() {
		return this.#currentLabel();
	}
	set currentLabel($$value) {
		return this.#currentLabel($$value);
	}
	#candidateLabels = derived(() => {
		if (!this.opts.items.current.length) return [];
		return this.opts.items.current.filter((item) => !item.disabled).map((item) => item.label);
	});
	get candidateLabels() {
		return this.#candidateLabels();
	}
	set candidateLabels($$value) {
		return this.#candidateLabels($$value);
	}
	#dataTypeaheadEnabled = derived(() => {
		if (this.isMulti) return false;
		if (this.opts.items.current.length === 0) return false;
		return true;
	});
	get dataTypeaheadEnabled() {
		return this.#dataTypeaheadEnabled();
	}
	set dataTypeaheadEnabled($$value) {
		return this.#dataTypeaheadEnabled($$value);
	}
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch(() => this.opts.open.current, () => {
			if (!this.opts.open.current) return;
			this.setInitialHighlightedNode();
		});
	}
	includesItem(itemValue) {
		return this.opts.value.current === itemValue;
	}
	toggleItem(itemValue, itemLabel = itemValue) {
		const newValue = this.includesItem(itemValue) ? "" : itemValue;
		this.opts.value.current = newValue;
		if (newValue !== "") this.opts.inputValue.current = itemLabel;
	}
	setInitialHighlightedNode() {
		afterTick(() => {
			if (this.highlightedNode && this.domContext.getDocument().contains(this.highlightedNode)) return;
			if (this.opts.value.current !== "") {
				const node = this.getNodeByValue(this.opts.value.current);
				if (node) {
					this.setHighlightedNode(node, true);
					return;
				}
			}
			this.setHighlightedToFirstCandidate(true);
		});
	}
};
var SelectMultipleRootState = class extends SelectBaseRootState {
	opts;
	isMulti = true;
	#hasValue = derived(() => this.opts.value.current.length > 0);
	get hasValue() {
		return this.#hasValue();
	}
	set hasValue($$value) {
		return this.#hasValue($$value);
	}
	#valueSet = derived(() => new Set(this.opts.value.current));
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch(() => this.opts.open.current, () => {
			if (!this.opts.open.current) return;
			this.setInitialHighlightedNode();
		});
	}
	includesItem(itemValue) {
		return this.#valueSet().has(itemValue);
	}
	toggleItem(itemValue, itemLabel = itemValue) {
		if (this.includesItem(itemValue)) this.opts.value.current = this.opts.value.current.filter((v) => v !== itemValue);
		else this.opts.value.current = [...this.opts.value.current, itemValue];
		this.opts.inputValue.current = itemLabel;
	}
	setInitialHighlightedNode() {
		afterTick(() => {
			if (!this.domContext) return;
			if (this.highlightedNode && this.domContext.getDocument().contains(this.highlightedNode)) return;
			if (this.opts.value.current.length && this.opts.value.current[0] !== "") {
				const node = this.getNodeByValue(this.opts.value.current[0]);
				if (node) {
					this.setHighlightedNode(node, true);
					return;
				}
			}
			this.setHighlightedToFirstCandidate(true);
		});
	}
};
var SelectRootState = class {
	static create(props) {
		const { type, ...rest } = props;
		const rootState = type === "single" ? new SelectSingleRootState(rest) : new SelectMultipleRootState(rest);
		return SelectRootContext.set(rootState);
	}
};
var SelectValueState = class SelectValueState {
	static create(opts) {
		return new SelectValueState(opts, SelectRootContext.get());
	}
	root;
	opts;
	attachment;
	constructor(opts, root) {
		this.root = root;
		this.opts = opts;
		this.attachment = attachRef(opts.ref, (v) => this.root.valueNode = v);
		this.setValue = this.setValue.bind(this);
	}
	setValue(value) {
		if (this.root.isMulti && !Array.isArray(value)) return;
		if (!this.root.isMulti && typeof value !== "string") return;
		this.root.opts.value.current = value;
	}
	#snippetProps = derived(() => {
		if (this.root.isMulti) return {
			selection: {
				type: "multiple",
				selected: this.root.opts.value.current.length > 0 ? this.root.opts.value.current.map((value) => ({
					value,
					label: this.root.getLabelForValue(value)
				})) : [],
				setValue: this.setValue
			},
			placeholder: this.opts.placeholder.current ?? null,
			disabled: this.root.opts.disabled.current
		};
		const value = this.root.opts.value.current;
		return {
			selection: {
				type: "single",
				selected: value !== "" ? {
					value,
					label: value === "" ? "" : this.root.getLabelForValue(value)
				} : void 0,
				setValue: this.setValue
			},
			placeholder: this.opts.placeholder.current ?? null,
			disabled: this.root.opts.disabled.current
		};
	});
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-placeholder": this.root.hasValue ? void 0 : "",
		"data-select-value": "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectTriggerState = class SelectTriggerState {
	static create(opts) {
		return new SelectTriggerState(opts, SelectRootContext.get());
	}
	opts;
	root;
	attachment;
	#domTypeahead;
	#dataTypeahead;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.triggerNode = v);
		this.root.domContext = new DOMContext(opts.ref);
		this.#domTypeahead = new DOMTypeahead({
			getCurrentItem: () => this.root.highlightedNode,
			onMatch: (node) => {
				this.root.setHighlightedNode(node);
			},
			getActiveElement: () => this.root.domContext.getActiveElement(),
			getWindow: () => this.root.domContext.getWindow()
		});
		this.#dataTypeahead = new DataTypeahead({
			getCurrentItem: () => {
				if (this.root.isMulti) return "";
				return this.root.currentLabel;
			},
			onMatch: (label) => {
				if (this.root.isMulti) return;
				if (!this.root.opts.items.current) return;
				const matchedItem = this.root.opts.items.current.find((item) => item.label === label);
				if (!matchedItem) return;
				this.root.opts.value.current = matchedItem.value;
			},
			enabled: () => !this.root.isMulti && this.root.dataTypeaheadEnabled,
			candidateValues: () => this.root.isMulti ? [] : this.root.candidateLabels,
			getWindow: () => this.root.domContext.getWindow()
		});
		this.onkeydown = this.onkeydown.bind(this);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onclick = this.onclick.bind(this);
	}
	#handleOpen() {
		this.root.opts.open.current = true;
		this.#dataTypeahead.resetTypeahead();
		this.#domTypeahead.resetTypeahead();
	}
	#handlePointerOpen(_) {
		this.#handleOpen();
	}
	/**
	* Logic used to handle keyboard selection/deselection.
	*
	* If it returns true, it means the item was selected and whatever is calling
	* this function should return early
	*
	*/
	#handleKeyboardSelection() {
		const isCurrentSelectedValue = this.root.highlightedValue === this.root.opts.value.current;
		if (!this.root.opts.allowDeselect.current && isCurrentSelectedValue && !this.root.isMulti) {
			this.root.handleClose();
			return true;
		}
		if (this.root.highlightedValue !== null) this.root.toggleItem(this.root.highlightedValue, this.root.highlightedLabel ?? void 0);
		if (!this.root.isMulti && !isCurrentSelectedValue) {
			this.root.handleClose();
			return true;
		}
		return false;
	}
	onkeydown(e) {
		this.root.isUsingKeyboard = true;
		if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
		if (!this.root.opts.open.current) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				this.root.handleOpen();
			} else if (!this.root.isMulti && this.root.dataTypeaheadEnabled) {
				this.#dataTypeahead.handleTypeaheadSearch(e.key);
				return;
			}
			if (this.root.hasValue) return;
			const candidateNodes = this.root.getCandidateNodes();
			if (!candidateNodes.length) return;
			if (e.key === "ArrowDown") {
				const firstCandidate = candidateNodes[0];
				this.root.setHighlightedNode(firstCandidate);
			} else if (e.key === "ArrowUp") {
				const lastCandidate = candidateNodes[candidateNodes.length - 1];
				this.root.setHighlightedNode(lastCandidate);
			}
			return;
		}
		if (e.key === "Tab") {
			this.root.handleClose();
			return;
		}
		if ((e.key === "Enter" || e.key === " " && this.#domTypeahead.search === "") && !e.isComposing) {
			e.preventDefault();
			if (this.#handleKeyboardSelection()) return;
		}
		if (e.key === "ArrowUp" && e.altKey) this.root.handleClose();
		if (FIRST_LAST_KEYS.includes(e.key)) {
			e.preventDefault();
			const candidateNodes = this.root.getCandidateNodes();
			const currHighlightedNode = this.root.highlightedNode;
			const currIndex = currHighlightedNode ? candidateNodes.indexOf(currHighlightedNode) : -1;
			const loop = this.root.opts.loop.current;
			let nextItem;
			if (e.key === "ArrowDown") nextItem = next(candidateNodes, currIndex, loop);
			else if (e.key === "ArrowUp") nextItem = prev(candidateNodes, currIndex, loop);
			else if (e.key === "PageDown") nextItem = forward(candidateNodes, currIndex, 10, loop);
			else if (e.key === "PageUp") nextItem = backward(candidateNodes, currIndex, 10, loop);
			else if (e.key === "Home") nextItem = candidateNodes[0];
			else if (e.key === "End") nextItem = candidateNodes[candidateNodes.length - 1];
			if (!nextItem) return;
			this.root.setHighlightedNode(nextItem);
			return;
		}
		const isModifierKey = e.ctrlKey || e.altKey || e.metaKey;
		const isCharacterKey = e.key.length === 1;
		const isSpaceKey = e.key === " ";
		const candidateNodes = this.root.getCandidateNodes();
		if (e.key === "Tab") return;
		if (!isModifierKey && (isCharacterKey || isSpaceKey)) {
			if (!this.#domTypeahead.handleTypeaheadSearch(e.key, candidateNodes) && isSpaceKey) {
				e.preventDefault();
				this.#handleKeyboardSelection();
			}
			return;
		}
		if (!this.root.highlightedNode) this.root.setHighlightedToFirstCandidate();
	}
	onclick(e) {
		e.currentTarget.focus();
	}
	onpointerdown(e) {
		if (this.root.opts.disabled.current) return;
		if (e.pointerType === "touch") return e.preventDefault();
		const target = e.target;
		if (target?.hasPointerCapture(e.pointerId)) target?.releasePointerCapture(e.pointerId);
		if (e.button === 0 && e.ctrlKey === false) {
			if (this.root.opts.open.current === false) this.#handlePointerOpen(e);
			else this.root.handleClose();
		}
	}
	onpointerup(e) {
		if (this.root.opts.disabled.current) return;
		e.preventDefault();
		if (e.pointerType === "touch") {
			if (this.root.opts.open.current === false) this.#handlePointerOpen(e);
			else this.root.handleClose();
		}
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		disabled: this.root.opts.disabled.current ? true : void 0,
		"aria-haspopup": "listbox",
		"aria-expanded": boolToStr(this.root.opts.open.current),
		"aria-activedescendant": this.root.highlightedId,
		"data-state": getDataOpenClosed(this.root.opts.open.current),
		"data-disabled": boolToEmptyStrOrUndef(this.root.opts.disabled.current),
		"data-placeholder": this.root.hasValue ? void 0 : "",
		[this.root.getBitsAttr("trigger")]: "",
		onpointerdown: this.onpointerdown,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		onpointerup: this.onpointerup,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectContentState = class SelectContentState {
	static create(opts) {
		return SelectContentContext.set(new SelectContentState(opts, SelectRootContext.get()));
	}
	opts;
	root;
	attachment;
	isPositioned = false;
	userHasScrolled = false;
	domContext;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.contentNode = v);
		this.domContext = new DOMContext(this.opts.ref);
		if (this.root.domContext === null) this.root.domContext = this.domContext;
		watch(() => this.root.opts.open.current, () => {
			if (this.root.opts.open.current) return;
			this.root.contentIsPositioned = false;
			this.isPositioned = false;
			this.userHasScrolled = false;
		});
		watch([() => this.isPositioned, () => this.root.highlightedNode], () => {
			if (!this.isPositioned || !this.root.highlightedNode) return;
			this.root.scrollHighlightedNodeIntoView(this.root.highlightedNode);
		});
		this.onpointermove = this.onpointermove.bind(this);
	}
	onpointermove(_) {
		this.root.isUsingKeyboard = false;
	}
	#styles = derived(() => {
		return getFloatingContentCSSVars(this.root.isCombobox ? "combobox" : "select");
	});
	onInteractOutside = (e) => {
		if (e.target === this.root.triggerNode || e.target === this.root.inputNode) {
			e.preventDefault();
			return;
		}
		this.opts.onInteractOutside.current(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};
	onEscapeKeydown = (e) => {
		this.opts.onEscapeKeydown.current(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};
	onOpenAutoFocus = (e) => {
		e.preventDefault();
	};
	onCloseAutoFocus = (e) => {
		e.preventDefault();
	};
	get shouldRender() {
		return this.root.contentPresence.shouldRender;
	}
	#snippetProps = derived(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "listbox",
		"aria-multiselectable": this.root.isMulti ? "true" : void 0,
		"data-state": getDataOpenClosed(this.root.opts.open.current),
		...getDataTransitionAttrs(this.root.contentPresence.transitionStatus),
		[this.root.getBitsAttr("content")]: "",
		style: {
			display: "flex",
			flexDirection: "column",
			outline: "none",
			boxSizing: "border-box",
			pointerEvents: "auto",
			...this.#styles()
		},
		onpointermove: this.onpointermove,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onOpenAutoFocus: this.onOpenAutoFocus,
		onCloseAutoFocus: this.onCloseAutoFocus,
		trapFocus: false,
		loop: false,
		onPlaced: () => {
			if (this.root.opts.open.current) {
				this.root.contentIsPositioned = true;
				this.isPositioned = true;
			}
		}
	};
};
var SelectItemState = class SelectItemState {
	static create(opts) {
		return new SelectItemState(opts, SelectRootContext.get());
	}
	opts;
	root;
	attachment;
	#isSelected = derived(() => this.root.includesItem(this.opts.value.current));
	get isSelected() {
		return this.#isSelected();
	}
	set isSelected($$value) {
		return this.#isSelected($$value);
	}
	#isHighlighted = derived(() => this.root.highlightedValue === this.opts.value.current);
	get isHighlighted() {
		return this.#isHighlighted();
	}
	set isHighlighted($$value) {
		return this.#isHighlighted($$value);
	}
	#isHighlightedAndEnabled = derived(() => this.isHighlighted && !this.opts.disabled.current);
	prevHighlighted = new Previous(() => this.isHighlighted);
	mounted = false;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		watch([() => this.isHighlighted, () => this.prevHighlighted.current], () => {
			if (this.isHighlighted) this.opts.onHighlight.current();
			else if (this.prevHighlighted.current) this.opts.onUnhighlight.current();
		});
		watch(() => this.mounted, () => {
			if (!this.mounted) return;
			this.root.setInitialHighlightedNode();
		});
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
	}
	handleSelect() {
		if (this.opts.disabled.current) return;
		const isCurrentSelectedValue = this.opts.value.current === this.root.opts.value.current;
		if (!this.root.opts.allowDeselect.current && isCurrentSelectedValue && !this.root.isMulti) {
			this.root.handleClose();
			return;
		}
		this.root.toggleItem(this.opts.value.current, this.opts.label.current);
		if (!this.root.isMulti && !isCurrentSelectedValue) this.root.handleClose();
	}
	#snippetProps = derived(() => ({
		selected: this.isSelected,
		highlighted: this.isHighlighted
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	onpointerdown(e) {
		e.preventDefault();
	}
	/**
	* Using `pointerup` instead of `click` allows power users to pointerdown
	* the trigger, then release pointerup on an item to select it vs having to do
	* multiple clicks.
	*/
	onpointerup(e) {
		if (e.defaultPrevented || !this.opts.ref.current) return;
		/**
		* For one reason or another, when it's a touch pointer and _not_ on IOS,
		* we need to listen for the immediate click event to handle the selection,
		* otherwise a click event will fire on the element _behind_ the item.
		*/
		if (e.pointerType === "touch" && !isIOS) {
			on(this.opts.ref.current, "click", () => {
				this.handleSelect();
				this.root.setHighlightedNode(this.opts.ref.current);
			}, { once: true });
			return;
		}
		e.preventDefault();
		this.handleSelect();
		if (e.pointerType === "touch") this.root.setHighlightedNode(this.opts.ref.current);
	}
	onpointermove(e) {
		/**
		* We don't want to highlight items on touch devices when scrolling,
		* as this is confusing behavior, so we return here and instead handle
		* the highlighting on the `pointerup` (or following `click`) event for
		* touch devices only.
		*/
		if (e.pointerType === "touch") return;
		if (this.root.highlightedNode !== this.opts.ref.current) this.root.setHighlightedNode(this.opts.ref.current);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "option",
		"aria-selected": this.isSelected ? "true" : void 0,
		"data-value": this.opts.value.current,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		"data-highlighted": boolToEmptyStrOrUndef(this.#isHighlightedAndEnabled()),
		"data-selected": boolToEmptyStrOrUndef(this.isSelected),
		"data-label": this.opts.label.current,
		[this.root.getBitsAttr("item")]: "",
		onpointermove: this.onpointermove,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectHiddenInputState = class SelectHiddenInputState {
	static create(opts) {
		return new SelectHiddenInputState(opts, SelectRootContext.get());
	}
	opts;
	root;
	#shouldRender = derived(() => this.root.opts.name.current !== "");
	get shouldRender() {
		return this.#shouldRender();
	}
	set shouldRender($$value) {
		return this.#shouldRender($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.onfocus = this.onfocus.bind(this);
	}
	onfocus(e) {
		e.preventDefault();
		if (!this.root.isCombobox) this.root.triggerNode?.focus();
		else this.root.inputNode?.focus();
	}
	#props = derived(() => ({
		disabled: boolToTrueOrUndef(this.root.opts.disabled.current),
		required: boolToTrueOrUndef(this.root.opts.required.current),
		name: this.root.opts.name.current,
		value: this.opts.value.current,
		onfocus: this.onfocus
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectViewportState = class SelectViewportState {
	static create(opts) {
		return new SelectViewportState(opts, SelectContentContext.get());
	}
	opts;
	content;
	root;
	attachment;
	prevScrollTop = 0;
	constructor(opts, content) {
		this.opts = opts;
		this.content = content;
		this.root = content.root;
		this.attachment = attachRef(opts.ref, (v) => {
			this.root.viewportNode = v;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "presentation",
		[this.root.getBitsAttr("viewport")]: "",
		style: {
			position: "relative",
			flex: 1,
			overflow: "auto"
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollButtonImplState = class {
	opts;
	content;
	root;
	attachment;
	autoScrollTimer = null;
	userScrollTimer = -1;
	isUserScrolling = false;
	onAutoScroll = noop;
	mounted = false;
	constructor(opts, content) {
		this.opts = opts;
		this.content = content;
		this.root = content.root;
		this.attachment = attachRef(opts.ref);
		watch([() => this.mounted], () => {
			if (this.mounted) return;
			this.isUserScrolling = false;
		});
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
	}
	handleUserScroll() {
		this.content.domContext.clearTimeout(this.userScrollTimer);
		this.isUserScrolling = true;
		this.userScrollTimer = this.content.domContext.setTimeout(() => {
			this.isUserScrolling = false;
		}, 200);
	}
	clearAutoScrollInterval() {
		if (this.autoScrollTimer === null) return;
		this.content.domContext.clearTimeout(this.autoScrollTimer);
		this.autoScrollTimer = null;
	}
	onpointerdown(_) {
		if (this.autoScrollTimer !== null) return;
		this.content.userHasScrolled = true;
		const autoScroll = (tick) => {
			this.onAutoScroll();
			this.autoScrollTimer = this.content.domContext.setTimeout(() => autoScroll(tick + 1), this.opts.delay.current(tick));
		};
		this.autoScrollTimer = this.content.domContext.setTimeout(() => autoScroll(1), this.opts.delay.current(0));
	}
	onpointermove(e) {
		this.onpointerdown(e);
	}
	onpointerleave(_) {
		this.clearAutoScrollInterval();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"aria-hidden": boolToStrTrueOrUndef(true),
		style: { flexShrink: 0 },
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollDownButtonState = class SelectScrollDownButtonState {
	static create(opts) {
		return new SelectScrollDownButtonState(new SelectScrollButtonImplState(opts, SelectContentContext.get()));
	}
	scrollButtonState;
	content;
	root;
	canScrollDown = false;
	scrollIntoViewTimer = null;
	constructor(scrollButtonState) {
		this.scrollButtonState = scrollButtonState;
		this.content = scrollButtonState.content;
		this.root = scrollButtonState.root;
		this.scrollButtonState.onAutoScroll = this.handleAutoScroll;
		watch([() => this.root.viewportNode, () => this.content.isPositioned], () => {
			const viewport = this.root.viewportNode;
			if (!viewport || !this.content.isPositioned) return;
			this.handleScroll(true);
			const onUserScroll = () => {
				this.content.userHasScrolled = true;
			};
			return executeCallbacks(on(viewport, "scroll", () => this.handleScroll()), on(viewport, "wheel", onUserScroll, { passive: true }), on(viewport, "touchmove", onUserScroll, { passive: true }));
		});
		/**
		* If the input value changes, this means that the filtered items may have changed,
		* so we need to re-evaluate the scroll-ability of the list.
		*/
		watch([
			() => this.root.opts.inputValue.current,
			() => this.root.viewportNode,
			() => this.content.isPositioned
		], () => {
			if (!this.root.viewportNode || !this.content.isPositioned) return;
			this.handleScroll(true);
		});
		watch(() => this.scrollButtonState.mounted, () => {
			if (!this.scrollButtonState.mounted) return;
			if (this.scrollIntoViewTimer) clearTimeout(this.scrollIntoViewTimer);
			this.scrollIntoViewTimer = afterSleep(5, () => {
				if (this.content.userHasScrolled) return;
				const activeItem = this.root.highlightedNode;
				if (!activeItem) return;
				this.root.scrollHighlightedNodeIntoView(activeItem);
			});
		});
	}
	/**
	* @param manual - if true, it means the function was invoked manually outside of an event
	* listener, so we don't call `handleUserScroll` to prevent the auto scroll from kicking in.
	*/
	handleScroll = (manual = false) => {
		if (!manual) this.scrollButtonState.handleUserScroll();
		if (!this.root.viewportNode) return;
		const maxScroll = this.root.viewportNode.scrollHeight - this.root.viewportNode.clientHeight;
		const paddingTop = Number.parseInt(getComputedStyle(this.root.viewportNode).paddingTop, 10);
		this.canScrollDown = Math.ceil(this.root.viewportNode.scrollTop) < maxScroll - paddingTop;
	};
	handleAutoScroll = () => {
		const viewport = this.root.viewportNode;
		const selectedItem = this.root.highlightedNode;
		if (!viewport || !selectedItem) return;
		viewport.scrollTop = viewport.scrollTop + selectedItem.offsetHeight;
	};
	#props = derived(() => ({
		...this.scrollButtonState.props,
		[this.root.getBitsAttr("scroll-down-button")]: ""
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollUpButtonState = class SelectScrollUpButtonState {
	static create(opts) {
		return new SelectScrollUpButtonState(new SelectScrollButtonImplState(opts, SelectContentContext.get()));
	}
	scrollButtonState;
	content;
	root;
	canScrollUp = false;
	constructor(scrollButtonState) {
		this.scrollButtonState = scrollButtonState;
		this.content = scrollButtonState.content;
		this.root = scrollButtonState.root;
		this.scrollButtonState.onAutoScroll = this.handleAutoScroll;
		watch([() => this.root.viewportNode, () => this.content.isPositioned], () => {
			if (!this.root.viewportNode || !this.content.isPositioned) return;
			this.handleScroll(true);
			return on(this.root.viewportNode, "scroll", () => this.handleScroll());
		});
	}
	/**
	* @param manual - if true, it means the function was invoked manually outside of an event
	* listener, so we don't call `handleUserScroll` to prevent the auto scroll from kicking in.
	*/
	handleScroll = (manual = false) => {
		if (!manual) this.scrollButtonState.handleUserScroll();
		if (!this.root.viewportNode) return;
		const paddingTop = Number.parseInt(getComputedStyle(this.root.viewportNode).paddingTop, 10);
		this.canScrollUp = this.root.viewportNode.scrollTop - paddingTop > .1;
	};
	handleAutoScroll = () => {
		if (!this.root.viewportNode || !this.root.highlightedNode) return;
		this.root.viewportNode.scrollTop = this.root.viewportNode.scrollTop - this.root.highlightedNode.offsetHeight;
	};
	#props = derived(() => ({
		...this.scrollButtonState.props,
		[this.root.getBitsAttr("scroll-up-button")]: ""
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-hidden-input.svelte
function Select_hidden_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, autocomplete } = $$props;
		const hiddenInputState = SelectHiddenInputState.create({ value: boxWith(() => value) });
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (hiddenInputState.shouldRender) {
				$$renderer.push("<!--[0-->");
				Hidden_input($$renderer, spread_props([hiddenInputState.props, {
					autocomplete,
					get value() {
						return value;
					},
					set value($$value) {
						value = $$value;
						$$settled = false;
					}
				}]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { value });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function Floating_layer_anchor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id, children, virtualEl, ref, tooltip = false } = $$props;
		FloatingAnchorState.create({
			id: boxWith(() => id),
			virtualEl: boxWith(() => virtualEl),
			ref
		}, tooltip);
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function useFloating(options) {
	const openOption = derived(() => get(options.open) ?? true);
	const middlewareOption = derived(() => get(options.middleware));
	const transformOption = derived(() => get(options.transform) ?? true);
	const placementOption = derived(() => get(options.placement) ?? "bottom");
	const strategyOption = derived(() => get(options.strategy) ?? "absolute");
	const sideOffsetOption = derived(() => get(options.sideOffset) ?? 0);
	const alignOffsetOption = derived(() => get(options.alignOffset) ?? 0);
	const reference = options.reference;
	/** State */
	let x = 0;
	let y = 0;
	const floating = simpleBox(null);
	let strategy = strategyOption();
	let placement = placementOption();
	let middlewareData = {};
	let isPositioned = false;
	let updateRequestId = 0;
	const floatingStyles = derived(() => {
		const xVal = floating.current ? roundByDPR(floating.current, x) : x;
		const yVal = floating.current ? roundByDPR(floating.current, y) : y;
		if (transformOption()) return {
			position: strategy,
			left: "0",
			top: "0",
			transform: `translate(${xVal}px, ${yVal}px)`,
			...floating.current && getDPR(floating.current) >= 1.5 && { willChange: "transform" }
		};
		return {
			position: strategy,
			left: `${xVal}px`,
			top: `${yVal}px`
		};
	});
	function update() {
		if (reference.current === null || floating.current === null) return;
		const referenceNode = reference.current;
		const floatingNode = floating.current;
		const requestId = ++updateRequestId;
		computePosition(referenceNode, floatingNode, {
			middleware: middlewareOption(),
			placement: placementOption(),
			strategy: strategyOption()
		}).then((position) => {
			if (requestId !== updateRequestId) return;
			if (reference.current !== referenceNode || floating.current !== floatingNode) return;
			if (isReferenceHidden(referenceNode)) {
				middlewareData = {
					...middlewareData,
					hide: {
						...middlewareData.hide,
						referenceHidden: true
					}
				};
				return;
			}
			if (!openOption() && x !== 0 && y !== 0) {
				const maxExpectedOffset = Math.max(Math.abs(sideOffsetOption()), Math.abs(alignOffsetOption()), 15);
				if (position.x <= maxExpectedOffset && position.y <= maxExpectedOffset) return;
			}
			x = position.x;
			y = position.y;
			strategy = position.strategy;
			placement = position.placement;
			middlewareData = position.middlewareData;
			isPositioned = true;
		});
	}
	return {
		floating,
		reference,
		get strategy() {
			return strategy;
		},
		get placement() {
			return placement;
		},
		get middlewareData() {
			return middlewareData;
		},
		get isPositioned() {
			return isPositioned;
		},
		get floatingStyles() {
			return floatingStyles();
		},
		get update() {
			return update;
		}
	};
}
function isReferenceHidden(node) {
	if (!(node instanceof Element)) return false;
	if (!node.isConnected) return true;
	if (node instanceof HTMLElement && node.hidden) return true;
	return node.getClientRects().length === 0;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
var OPPOSITE_SIDE = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
};
var FloatingContentContext = new Context("Floating.Content");
var FloatingContentState = class FloatingContentState {
	static create(opts, tooltip = false) {
		return tooltip ? FloatingContentContext.set(new FloatingContentState(opts, FloatingTooltipRootContext.get())) : FloatingContentContext.set(new FloatingContentState(opts, FloatingRootContext.get()));
	}
	opts;
	root;
	contentRef = simpleBox(null);
	wrapperRef = simpleBox(null);
	arrowRef = simpleBox(null);
	contentAttachment = attachRef(this.contentRef);
	wrapperAttachment = attachRef(this.wrapperRef);
	arrowAttachment = attachRef(this.arrowRef);
	arrowId = simpleBox(useId());
	#transformedStyle = derived(() => {
		if (typeof this.opts.style === "string") return cssToStyleObj(this.opts.style);
		if (!this.opts.style) return {};
	});
	#updatePositionStrategy = void 0;
	#arrowSize = new ElementSize(() => this.arrowRef.current ?? void 0);
	#arrowWidth = derived(() => this.#arrowSize?.width ?? 0);
	#arrowHeight = derived(() => this.#arrowSize?.height ?? 0);
	#desiredPlacement = derived(() => this.opts.side?.current + (this.opts.align.current !== "center" ? `-${this.opts.align.current}` : ""));
	#boundary = derived(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#hasExplicitBoundaries = derived(() => this.#boundary().length > 0);
	get hasExplicitBoundaries() {
		return this.#hasExplicitBoundaries();
	}
	set hasExplicitBoundaries($$value) {
		return this.#hasExplicitBoundaries($$value);
	}
	#detectOverflowOptions = derived(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: this.#boundary().filter(isNotNull),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return this.#detectOverflowOptions();
	}
	set detectOverflowOptions($$value) {
		return this.#detectOverflowOptions($$value);
	}
	#availableWidth = void 0;
	#availableHeight = void 0;
	#anchorWidth = void 0;
	#anchorHeight = void 0;
	#middleware = derived(() => [
		offset({
			mainAxis: this.opts.sideOffset.current + this.#arrowHeight(),
			alignmentAxis: this.opts.alignOffset.current
		}),
		this.opts.avoidCollisions.current && shift({
			mainAxis: true,
			crossAxis: false,
			limiter: this.opts.sticky.current === "partial" ? limitShift() : void 0,
			...this.detectOverflowOptions
		}),
		this.opts.avoidCollisions.current && flip({ ...this.detectOverflowOptions }),
		size({
			...this.detectOverflowOptions,
			apply: ({ rects, availableWidth, availableHeight }) => {
				const { width: anchorWidth, height: anchorHeight } = rects.reference;
				this.#availableWidth = availableWidth;
				this.#availableHeight = availableHeight;
				this.#anchorWidth = anchorWidth;
				this.#anchorHeight = anchorHeight;
			}
		}),
		this.arrowRef.current && arrow({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		transformOrigin({
			arrowWidth: this.#arrowWidth(),
			arrowHeight: this.#arrowHeight()
		}),
		this.opts.hideWhenDetached.current && hide({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return this.#middleware();
	}
	set middleware($$value) {
		return this.#middleware($$value);
	}
	floating;
	#placedSide = derived(() => getSideFromPlacement(this.floating.placement));
	get placedSide() {
		return this.#placedSide();
	}
	set placedSide($$value) {
		return this.#placedSide($$value);
	}
	#placedAlign = derived(() => getAlignFromPlacement(this.floating.placement));
	get placedAlign() {
		return this.#placedAlign();
	}
	set placedAlign($$value) {
		return this.#placedAlign($$value);
	}
	#arrowX = derived(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return this.#arrowX();
	}
	set arrowX($$value) {
		return this.#arrowX($$value);
	}
	#arrowY = derived(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return this.#arrowY();
	}
	set arrowY($$value) {
		return this.#arrowY($$value);
	}
	#cannotCenterArrow = derived(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return this.#cannotCenterArrow();
	}
	set cannotCenterArrow($$value) {
		return this.#cannotCenterArrow($$value);
	}
	contentZIndex;
	#arrowBaseSide = derived(() => OPPOSITE_SIDE[this.placedSide]);
	get arrowBaseSide() {
		return this.#arrowBaseSide();
	}
	set arrowBaseSide($$value) {
		return this.#arrowBaseSide($$value);
	}
	#wrapperProps = derived(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${this.#availableWidth}px`,
			"--bits-floating-available-height": `${this.#availableHeight}px`,
			"--bits-floating-anchor-width": `${this.#anchorWidth}px`,
			"--bits-floating-anchor-height": `${this.#anchorHeight}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...this.#transformedStyle()
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return this.#wrapperProps();
	}
	set wrapperProps($$value) {
		return this.#wrapperProps($$value);
	}
	#props = derived(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: styleToString({ ...this.#transformedStyle() }),
		...this.contentAttachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	#arrowStyle = derived(() => ({
		position: "absolute",
		left: this.arrowX ? `${this.arrowX}px` : void 0,
		top: this.arrowY ? `${this.arrowY}px` : void 0,
		[this.arrowBaseSide]: 0,
		"transform-origin": {
			top: "",
			right: "0 0",
			bottom: "center 0",
			left: "100% 0"
		}[this.placedSide],
		transform: {
			top: "translateY(100%)",
			right: "translateY(50%) rotate(90deg) translateX(-50%)",
			bottom: "rotate(180deg)",
			left: "translateY(50%) rotate(-90deg) translateX(50%)"
		}[this.placedSide],
		visibility: this.cannotCenterArrow ? "hidden" : void 0
	}));
	get arrowStyle() {
		return this.#arrowStyle();
	}
	set arrowStyle($$value) {
		return this.#arrowStyle($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.#updatePositionStrategy = opts.updatePositionStrategy;
		if (opts.customAnchor) this.root.customAnchorNode.current = opts.customAnchor.current;
		watch(() => opts.customAnchor.current, (customAnchor) => {
			this.root.customAnchorNode.current = customAnchor;
		});
		this.floating = useFloating({
			strategy: () => this.opts.strategy.current,
			placement: () => this.#desiredPlacement(),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		});
		watch(() => this.contentRef.current, (contentNode) => {
			if (!contentNode || !this.opts.enabled.current) return;
			const win = getWindow(contentNode);
			const rafId = win.requestAnimationFrame(() => {
				if (this.contentRef.current !== contentNode || !this.opts.enabled.current) return;
				const zIndex = win.getComputedStyle(contentNode).zIndex;
				if (zIndex !== this.contentZIndex) this.contentZIndex = zIndex;
			});
			return () => {
				win.cancelAnimationFrame(rafId);
			};
		});
	}
};
function transformOrigin(options) {
	return {
		name: "transformOrigin",
		options,
		fn(data) {
			const { placement, rects, middlewareData } = data;
			const isArrowHidden = middlewareData.arrow?.centerOffset !== 0;
			const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
			const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
			const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
			const noArrowAlign = {
				start: "0%",
				center: "50%",
				end: "100%"
			}[placedAlign];
			const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
			const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
			let x = "";
			let y = "";
			if (placedSide === "bottom") {
				x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
				y = `${-arrowHeight}px`;
			} else if (placedSide === "top") {
				x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
				y = `${rects.floating.height + arrowHeight}px`;
			} else if (placedSide === "right") {
				x = `${-arrowHeight}px`;
				y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
			} else if (placedSide === "left") {
				x = `${rects.floating.width + arrowHeight}px`;
				y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
			}
			return { data: {
				x,
				y
			} };
		}
	};
}
function getSideAndAlignFromPlacement(placement) {
	const [side, align = "center"] = placement.split("-");
	return [side, align];
}
function getSideFromPlacement(placement) {
	return getSideAndAlignFromPlacement(placement)[0];
}
function getAlignFromPlacement(placement) {
	return getSideAndAlignFromPlacement(placement)[1];
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function Floating_layer_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content, side = "bottom", sideOffset = 0, align = "center", alignOffset = 0, id, arrowPadding = 0, avoidCollisions = true, collisionBoundary = [], collisionPadding = 0, hideWhenDetached = false, onPlaced = () => {}, sticky = "partial", updatePositionStrategy = "optimized", strategy = "fixed", dir = "ltr", style = {}, wrapperId = useId(), customAnchor = null, enabled, tooltip = false } = $$props;
		const contentState = FloatingContentState.create({
			side: boxWith(() => side),
			sideOffset: boxWith(() => sideOffset),
			align: boxWith(() => align),
			alignOffset: boxWith(() => alignOffset),
			id: boxWith(() => id),
			arrowPadding: boxWith(() => arrowPadding),
			avoidCollisions: boxWith(() => avoidCollisions),
			collisionBoundary: boxWith(() => collisionBoundary),
			collisionPadding: boxWith(() => collisionPadding),
			hideWhenDetached: boxWith(() => hideWhenDetached),
			onPlaced: boxWith(() => onPlaced),
			sticky: boxWith(() => sticky),
			updatePositionStrategy: boxWith(() => updatePositionStrategy),
			strategy: boxWith(() => strategy),
			dir: boxWith(() => dir),
			style: boxWith(() => style),
			enabled: boxWith(() => enabled),
			wrapperId: boxWith(() => wrapperId),
			customAnchor: boxWith(() => customAnchor)
		}, tooltip);
		const mergedProps = derived(() => mergeProps(contentState.wrapperProps, { style: { pointerEvents: "auto" } }));
		content?.($$renderer, {
			props: contentState.props,
			wrapperProps: mergedProps()
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function Floating_layer_content_static($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content} = $$props;
		content?.($$renderer, {
			props: {},
			wrapperProps: {}
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/separator/separator.svelte.js
var separatorAttrs = createBitsAttrs({
	component: "separator",
	parts: ["root"]
});
var SeparatorRootState = class SeparatorRootState {
	static create(opts) {
		return new SeparatorRootState(opts);
	}
	opts;
	attachment;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: this.opts.decorative.current ? "none" : "separator",
		"aria-orientation": this.opts.orientation.current,
		"aria-hidden": boolToStrTrueOrUndef(this.opts.decorative.current),
		"data-orientation": this.opts.orientation.current,
		[separatorAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/separator/components/separator.svelte
function Separator$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, child, children, decorative = false, orientation = "horizontal", $$slots, $$events, ...restProps } = $$props;
		const rootState = SeparatorRootState.create({
			ref: boxWith(() => ref, (v) => ref = v),
			id: boxWith(() => id),
			decorative: boxWith(() => decorative),
			orientation: boxWith(() => orientation)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-content.svelte
function Popper_content($$renderer, $$props) {
	let { content, isStatic = false, onPlaced, $$slots, $$events, ...restProps } = $$props;
	if (isStatic) {
		$$renderer.push("<!--[0-->");
		Floating_layer_content_static($$renderer, {
			content});
	} else {
		$$renderer.push("<!--[-1-->");
		Floating_layer_content($$renderer, spread_props([{
			content,
			onPlaced
		}, restProps]));
	}
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
function Popper_layer_inner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { popper, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, enabled, ref, tooltip = false, contentPointerEvents = "auto", $$slots, $$events, ...restProps } = $$props;
		const resolvedPreventScroll = derived(() => preventScroll ?? true);
		const effectiveStrategy = derived(() => strategy ?? (resolvedPreventScroll() ? "fixed" : "absolute"));
		{
			function content($$renderer, { props: floatingProps, wrapperProps }) {
				if (restProps.forceMount && enabled) {
					$$renderer.push("<!--[0-->");
					Scroll_lock($$renderer, { preventScroll: resolvedPreventScroll() });
				} else if (!restProps.forceMount) {
					$$renderer.push("<!--[1-->");
					Scroll_lock($$renderer, { preventScroll: resolvedPreventScroll() });
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				{
					function focusScope($$renderer, { props: focusScopeProps }) {
						Escape_layer($$renderer, {
							onEscapeKeydown,
							escapeKeydownBehavior,
							enabled,
							ref,
							children: ($$renderer) => {
								{
									function children($$renderer, { props: dismissibleProps }) {
										Text_selection_layer($$renderer, {
											id,
											preventOverflowTextSelection,
											onPointerDown,
											onPointerUp,
											enabled,
											ref,
											children: ($$renderer) => {
												popper?.($$renderer, {
													props: mergeProps(restProps, floatingProps, dismissibleProps, focusScopeProps, {
														id,
														style: { pointerEvents: contentPointerEvents }
													}),
													wrapperProps
												});
												$$renderer.push(`<!---->`);
											}});
									}
									Dismissible_layer($$renderer, {
										id,
										onInteractOutside,
										onFocusOutside,
										interactOutsideBehavior,
										isValidEvent,
										enabled,
										ref,
										children});
								}
							}});
					}
					Focus_scope($$renderer, {
						onOpenAutoFocus,
						onCloseAutoFocus,
						loop,
						enabled,
						trapFocus,
						forceMount: restProps.forceMount,
						ref,
						focusScope});
				}
				$$renderer.push(`<!---->`);
			}
			Popper_content($$renderer, {
				isStatic,
				id,
				side,
				sideOffset,
				align,
				alignOffset,
				arrowPadding,
				avoidCollisions,
				collisionBoundary,
				collisionPadding,
				sticky,
				hideWhenDetached,
				updatePositionStrategy,
				strategy: effectiveStrategy(),
				dir,
				wrapperId,
				style,
				onPlaced,
				customAnchor,
				enabled,
				tooltip,
				content,
				$$slots: { content: true }
			});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
function Popper_layer($$renderer, $$props) {
	let { popper, open, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, ref, shouldRender, $$slots, $$events, ...restProps } = $$props;
	if (shouldRender) {
		$$renderer.push("<!--[0-->");
		Popper_layer_inner($$renderer, spread_props([{
			popper,
			onEscapeKeydown,
			escapeKeydownBehavior,
			preventOverflowTextSelection,
			id,
			onPointerDown,
			onPointerUp,
			side,
			sideOffset,
			align,
			alignOffset,
			arrowPadding,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			updatePositionStrategy,
			strategy,
			dir,
			preventScroll,
			wrapperId,
			style,
			onPlaced,
			customAnchor,
			isStatic,
			enabled: open,
			onInteractOutside,
			onCloseAutoFocus,
			onOpenAutoFocus,
			interactOutsideBehavior,
			loop,
			trapFocus,
			isValidEvent,
			onFocusOutside,
			forceMount: false,
			ref
		}, restProps]));
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
function Popper_layer_force_mount($$renderer, $$props) {
	let { popper, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, enabled, $$slots, $$events, ...restProps } = $$props;
	Popper_layer_inner($$renderer, spread_props([
		{
			popper,
			onEscapeKeydown,
			escapeKeydownBehavior,
			preventOverflowTextSelection,
			id,
			onPointerDown,
			onPointerUp,
			side,
			sideOffset,
			align,
			alignOffset,
			arrowPadding,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			updatePositionStrategy,
			strategy,
			dir,
			preventScroll,
			wrapperId,
			style,
			onPlaced,
			customAnchor,
			isStatic,
			enabled,
			onInteractOutside,
			onCloseAutoFocus,
			onOpenAutoFocus,
			interactOutsideBehavior,
			loop,
			trapFocus,
			isValidEvent,
			onFocusOutside
		},
		restProps,
		{ forceMount: true }
	]));
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-content.svelte
function Select_content$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, forceMount = false, side = "bottom", onInteractOutside = noop, onEscapeKeydown = noop, children, child, preventScroll = false, style, $$slots, $$events, ...restProps } = $$props;
		const contentState = SelectContentState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			onInteractOutside: boxWith(() => onInteractOutside),
			onEscapeKeydown: boxWith(() => onEscapeKeydown)
		});
		const mergedProps = derived(() => mergeProps(restProps, contentState.props));
		if (forceMount) {
			$$renderer.push("<!--[0-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: contentState.props.style }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push(`<!--[-1--><div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer_force_mount($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						ref: contentState.opts.ref,
						side,
						enabled: contentState.root.opts.open.current,
						id,
						preventScroll,
						forceMount: true,
						shouldRender: contentState.shouldRender,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else if (!forceMount) {
			$$renderer.push("<!--[1-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: contentState.props.style }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push(`<!--[-1--><div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						ref: contentState.opts.ref,
						side,
						open: contentState.root.opts.open.current,
						id,
						preventScroll,
						forceMount: false,
						shouldRender: contentState.shouldRender,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/mounted.svelte
function Mounted($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mounted = false, onMountedChange = noop } = $$props;
		bind_props($$props, { mounted });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-item.svelte
function Select_item$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, value, label = value, disabled = false, children, child, onHighlight = noop, onUnhighlight = noop, $$slots, $$events, ...restProps } = $$props;
		const itemState = SelectItemState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			value: boxWith(() => value),
			disabled: boxWith(() => disabled),
			label: boxWith(() => label),
			onHighlight: boxWith(() => onHighlight),
			onUnhighlight: boxWith(() => onUnhighlight)
		});
		const mergedProps = derived(() => mergeProps(restProps, itemState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (child) {
				$$renderer.push("<!--[0-->");
				child($$renderer, {
					props: mergedProps(),
					...itemState.snippetProps
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
				children?.($$renderer, itemState.snippetProps);
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]--> `);
			Mounted($$renderer, {
				get mounted() {
					return itemState.mounted;
				},
				set mounted($$value) {
					itemState.mounted = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-viewport.svelte
function Select_viewport($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, children, child, $$slots, $$events, ...restProps } = $$props;
		const viewportState = SelectViewportState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, viewportState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-scroll-down-button.svelte
function Select_scroll_down_button$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, delay = () => 50, child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollButtonState = SelectScrollDownButtonState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			delay: boxWith(() => delay)
		});
		const mergedProps = derived(() => mergeProps(restProps, scrollButtonState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (scrollButtonState.canScrollDown) {
				$$renderer.push("<!--[0-->");
				Mounted($$renderer, {
					get mounted() {
						return scrollButtonState.scrollButtonState.mounted;
					},
					set mounted($$value) {
						scrollButtonState.scrollButtonState.mounted = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				if (child) {
					$$renderer.push("<!--[0-->");
					child($$renderer, { props: restProps });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
					children?.($$renderer);
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-scroll-up-button.svelte
function Select_scroll_up_button$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, delay = () => 50, child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollButtonState = SelectScrollUpButtonState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			delay: boxWith(() => delay)
		});
		const mergedProps = derived(() => mergeProps(restProps, scrollButtonState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (scrollButtonState.canScrollUp) {
				$$renderer.push("<!--[0-->");
				Mounted($$renderer, {
					get mounted() {
						return scrollButtonState.scrollButtonState.mounted;
					},
					set mounted($$value) {
						scrollButtonState.scrollButtonState.mounted = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				if (child) {
					$$renderer.push("<!--[0-->");
					child($$renderer, { props: restProps });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
					children?.($$renderer);
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/svelte-resize-observer.svelte.js
var sharedObserver = null;
var observedNodes = /* @__PURE__ */ new WeakMap();
function getSharedObserver() {
	sharedObserver ??= new ResizeObserver((entries) => {
		for (const entry of entries) {
			const callbacks = observedNodes.get(entry.target);
			if (!callbacks) continue;
			for (const callback of [...callbacks]) callback();
		}
	});
	return sharedObserver;
}
/**
* Observes `node` for size changes, returning a function that stops observing.
*
* Like a dedicated `ResizeObserver`, the callback fires once shortly after subscribing.
*/
function observeResize(node, callback) {
	let callbacks = observedNodes.get(node);
	if (callbacks === void 0) {
		callbacks = /* @__PURE__ */ new Set();
		observedNodes.set(node, callbacks);
		callbacks.add(callback);
		getSharedObserver().observe(node);
	} else {
		callbacks.add(callback);
		callback();
	}
	return () => {
		const current = observedNodes.get(node);
		if (!current) return;
		current.delete(callback);
		if (current.size) return;
		observedNodes.delete(node);
		sharedObserver?.unobserve(node);
	};
}
var SvelteResizeObserver = class {
	#node;
	#onResize;
	constructor(node, onResize) {
		this.#node = node;
		this.#onResize = onResize;
		this.handler = this.handler.bind(this);
	}
	handler() {
		let rAF = 0;
		const _node = this.#node();
		if (!_node) return;
		const unobserve = observeResize(_node, () => {
			cancelAnimationFrame(rAF);
			rAF = window.requestAnimationFrame(this.#onResize);
		});
		return () => {
			window.cancelAnimationFrame(rAF);
			unobserve();
		};
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/presence-layer/presence.svelte.js
var Presence = class {
	opts;
	present;
	#afterAnimations;
	#isPresent = false;
	#hasMounted = false;
	#transitionStatus = void 0;
	#transitionFrame = null;
	constructor(opts) {
		this.opts = opts;
		this.present = this.opts.open;
		this.#isPresent = opts.open.current;
		this.#afterAnimations = new AnimationsComplete({
			ref: this.opts.ref,
			afterTick: this.opts.open
		});
		watch(() => this.present.current, (isOpen) => {
			if (!this.#hasMounted) {
				this.#hasMounted = true;
				return;
			}
			this.#clearTransitionFrame();
			if (isOpen) this.#isPresent = true;
			this.#transitionStatus = isOpen ? "starting" : "ending";
			if (isOpen) this.#transitionFrame = window.requestAnimationFrame(() => {
				this.#transitionFrame = null;
				if (this.present.current) this.#transitionStatus = void 0;
			});
			this.#afterAnimations.run(() => {
				if (isOpen !== this.present.current) return;
				if (!isOpen) this.#isPresent = false;
				this.#transitionStatus = void 0;
			});
		});
	}
	#_isPresent = derived(() => {
		return this.#isPresent;
	});
	get isPresent() {
		return this.#_isPresent();
	}
	set isPresent($$value) {
		return this.#_isPresent($$value);
	}
	get transitionStatus() {
		return this.#transitionStatus;
	}
	#clearTransitionFrame() {
		if (this.#transitionFrame === null) return;
		window.cancelAnimationFrame(this.#transitionFrame);
		this.#transitionFrame = null;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/presence-layer/presence-layer.svelte
function Presence_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, forceMount, presence, ref } = $$props;
		const presenceState = new Presence({
			open: boxWith(() => open),
			ref
		});
		if (forceMount || open || presenceState.isPresent) {
			$$renderer.push("<!--[0-->");
			presence?.($$renderer, {
				present: presenceState.isPresent,
				transitionStatus: presenceState.transitionStatus
			});
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/clamp.js
/**
* Clamps a number between a minimum and maximum value.
*/
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
//#endregion
//#region node_modules/bits-ui/dist/internal/state-machine.js
var StateMachine = class {
	state;
	#machine;
	constructor(initialState, machine) {
		this.state = simpleBox(initialState);
		this.#machine = machine;
		this.dispatch = this.dispatch.bind(this);
	}
	#reducer(event) {
		return this.#machine[this.state.current][event] ?? this.state.current;
	}
	dispatch(event) {
		this.state.current = this.#reducer(event);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/scroll-area.svelte.js
var scrollAreaAttrs = createBitsAttrs({
	component: "scroll-area",
	parts: [
		"root",
		"viewport",
		"corner",
		"thumb",
		"scrollbar"
	]
});
var ScrollAreaRootContext = new Context("ScrollArea.Root");
var ScrollAreaScrollbarContext = new Context("ScrollArea.Scrollbar");
var ScrollAreaScrollbarVisibleContext = new Context("ScrollArea.ScrollbarVisible");
var ScrollAreaScrollbarAxisContext = new Context("ScrollArea.ScrollbarAxis");
var ScrollAreaScrollbarSharedContext = new Context("ScrollArea.ScrollbarShared");
var ScrollAreaRootState = class ScrollAreaRootState {
	static create(opts) {
		return ScrollAreaRootContext.set(new ScrollAreaRootState(opts));
	}
	opts;
	attachment;
	scrollAreaNode = null;
	viewportNode = null;
	contentNode = null;
	scrollbarXNode = null;
	scrollbarYNode = null;
	cornerWidth = 0;
	cornerHeight = 0;
	scrollbarXEnabled = false;
	scrollbarYEnabled = false;
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref, (v) => this.scrollAreaNode = v);
		this.domContext = new DOMContext(opts.ref);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		dir: this.opts.dir.current,
		style: {
			position: "relative",
			"--bits-scroll-area-corner-height": `${this.cornerHeight}px`,
			"--bits-scroll-area-corner-width": `${this.cornerWidth}px`
		},
		[scrollAreaAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaViewportState = class ScrollAreaViewportState {
	static create(opts) {
		return new ScrollAreaViewportState(opts, ScrollAreaRootContext.get());
	}
	opts;
	root;
	attachment;
	#contentId = simpleBox(useId());
	#contentRef = simpleBox(null);
	contentAttachment = attachRef(this.#contentRef, (v) => this.root.contentNode = v);
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.viewportNode = v);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		style: {
			overflowX: this.root.scrollbarXEnabled ? "scroll" : "hidden",
			overflowY: this.root.scrollbarYEnabled ? "scroll" : "hidden"
		},
		[scrollAreaAttrs.viewport]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	#contentProps = derived(() => ({
		id: this.#contentId.current,
		"data-scroll-area-content": "",
		style: { minWidth: this.root.scrollbarXEnabled ? "fit-content" : void 0 },
		...this.contentAttachment
	}));
	get contentProps() {
		return this.#contentProps();
	}
	set contentProps($$value) {
		return this.#contentProps($$value);
	}
};
var ScrollAreaScrollbarState = class ScrollAreaScrollbarState {
	static create(opts) {
		return ScrollAreaScrollbarContext.set(new ScrollAreaScrollbarState(opts, ScrollAreaRootContext.get()));
	}
	opts;
	root;
	#isHorizontal = derived(() => this.opts.orientation.current === "horizontal");
	get isHorizontal() {
		return this.#isHorizontal();
	}
	set isHorizontal($$value) {
		return this.#isHorizontal($$value);
	}
	hasThumb = false;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		watch(() => this.isHorizontal, (isHorizontal) => {
			if (isHorizontal) {
				this.root.scrollbarXEnabled = true;
				return () => {
					this.root.scrollbarXEnabled = false;
				};
			} else {
				this.root.scrollbarYEnabled = true;
				return () => {
					this.root.scrollbarYEnabled = false;
				};
			}
		});
	}
};
var ScrollAreaScrollbarHoverState = class ScrollAreaScrollbarHoverState {
	static create() {
		return new ScrollAreaScrollbarHoverState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	isVisible = false;
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
	}
	#props = derived(() => ({ "data-state": this.isVisible ? "visible" : "hidden" }));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarScrollState = class ScrollAreaScrollbarScrollState {
	static create() {
		return new ScrollAreaScrollbarScrollState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	machine = new StateMachine("hidden", {
		hidden: { SCROLL: "scrolling" },
		scrolling: {
			SCROLL_END: "idle",
			POINTER_ENTER: "interacting"
		},
		interacting: {
			SCROLL: "interacting",
			POINTER_LEAVE: "idle"
		},
		idle: {
			HIDE: "hidden",
			SCROLL: "scrolling",
			POINTER_ENTER: "interacting"
		}
	});
	#isHidden = derived(() => this.machine.state.current === "hidden");
	get isHidden() {
		return this.#isHidden();
	}
	set isHidden($$value) {
		return this.#isHidden($$value);
	}
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
		useDebounce(() => this.machine.dispatch("SCROLL_END"), 100);
		this.onpointerenter = this.onpointerenter.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
	}
	onpointerenter(_) {
		this.machine.dispatch("POINTER_ENTER");
	}
	onpointerleave(_) {
		this.machine.dispatch("POINTER_LEAVE");
	}
	#props = derived(() => ({
		"data-state": this.machine.state.current === "hidden" ? "hidden" : "visible",
		onpointerenter: this.onpointerenter,
		onpointerleave: this.onpointerleave
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarAutoState = class ScrollAreaScrollbarAutoState {
	static create() {
		return new ScrollAreaScrollbarAutoState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	isVisible = false;
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
		const handleResize = () => {
			const viewportNode = this.root.viewportNode;
			if (!viewportNode) return;
			const isOverflowX = viewportNode.offsetWidth < viewportNode.scrollWidth;
			const isOverflowY = viewportNode.offsetHeight < viewportNode.scrollHeight;
			this.isVisible = this.scrollbar.isHorizontal ? isOverflowX : isOverflowY;
		};
		new SvelteResizeObserver(() => this.root.viewportNode, handleResize);
		new SvelteResizeObserver(() => this.root.contentNode, handleResize);
	}
	#props = derived(() => ({ "data-state": this.isVisible ? "visible" : "hidden" }));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarVisibleState = class ScrollAreaScrollbarVisibleState {
	static create() {
		return ScrollAreaScrollbarVisibleContext.set(new ScrollAreaScrollbarVisibleState(ScrollAreaScrollbarContext.get()));
	}
	scrollbar;
	root;
	thumbNode = null;
	pointerOffset = 0;
	sizes = {
		content: 0,
		viewport: 0,
		scrollbar: {
			size: 0,
			paddingStart: 0,
			paddingEnd: 0
		}
	};
	#thumbRatio = derived(() => getThumbRatio(this.sizes.viewport, this.sizes.content));
	get thumbRatio() {
		return this.#thumbRatio();
	}
	set thumbRatio($$value) {
		return this.#thumbRatio($$value);
	}
	#hasThumb = derived(() => Boolean(this.thumbRatio > 0 && this.thumbRatio < 1));
	get hasThumb() {
		return this.#hasThumb();
	}
	set hasThumb($$value) {
		return this.#hasThumb($$value);
	}
	prevTransformStyle = "";
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
	}
	setSizes(sizes) {
		this.sizes = sizes;
	}
	getScrollPosition(pointerPos, dir) {
		return getScrollPositionFromPointer({
			pointerPos,
			pointerOffset: this.pointerOffset,
			sizes: this.sizes,
			dir
		});
	}
	onThumbPointerUp() {
		this.pointerOffset = 0;
	}
	onThumbPointerDown(pointerPos) {
		this.pointerOffset = pointerPos;
	}
	xOnThumbPositionChange() {
		if (!(this.root.viewportNode && this.thumbNode)) return;
		const scrollPos = this.root.viewportNode.scrollLeft;
		const transformStyle = `translate3d(${getThumbOffsetFromScroll({
			scrollPos,
			sizes: this.sizes,
			dir: this.root.opts.dir.current
		})}px, 0, 0)`;
		this.thumbNode.style.transform = transformStyle;
		this.prevTransformStyle = transformStyle;
	}
	xOnWheelScroll(scrollPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollLeft = scrollPos;
	}
	xOnDragScroll(pointerPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollLeft = this.getScrollPosition(pointerPos, this.root.opts.dir.current);
	}
	yOnThumbPositionChange() {
		if (!(this.root.viewportNode && this.thumbNode)) return;
		const scrollPos = this.root.viewportNode.scrollTop;
		const transformStyle = `translate3d(0, ${getThumbOffsetFromScroll({
			scrollPos,
			sizes: this.sizes
		})}px, 0)`;
		this.thumbNode.style.transform = transformStyle;
		this.prevTransformStyle = transformStyle;
	}
	yOnWheelScroll(scrollPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollTop = scrollPos;
	}
	yOnDragScroll(pointerPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollTop = this.getScrollPosition(pointerPos, this.root.opts.dir.current);
	}
};
var ScrollAreaScrollbarXState = class ScrollAreaScrollbarXState {
	static create(opts) {
		return ScrollAreaScrollbarAxisContext.set(new ScrollAreaScrollbarXState(opts, ScrollAreaScrollbarVisibleContext.get()));
	}
	opts;
	scrollbarVis;
	root;
	scrollbar;
	attachment;
	computedStyle;
	constructor(opts, scrollbarVis) {
		this.opts = opts;
		this.scrollbarVis = scrollbarVis;
		this.root = scrollbarVis.root;
		this.scrollbar = scrollbarVis.scrollbar;
		this.attachment = attachRef(this.scrollbar.opts.ref, (v) => this.root.scrollbarXNode = v);
	}
	onThumbPointerDown = (pointerPos) => {
		this.scrollbarVis.onThumbPointerDown(pointerPos.x);
	};
	onDragScroll = (pointerPos) => {
		this.scrollbarVis.xOnDragScroll(pointerPos.x);
	};
	onThumbPointerUp = () => {
		this.scrollbarVis.onThumbPointerUp();
	};
	onThumbPositionChange = () => {
		this.scrollbarVis.xOnThumbPositionChange();
	};
	onWheelScroll = (e, maxScrollPos) => {
		if (!this.root.viewportNode) return;
		const scrollPos = this.root.viewportNode.scrollLeft + e.deltaX;
		this.scrollbarVis.xOnWheelScroll(scrollPos);
		if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) e.preventDefault();
	};
	onResize = () => {
		if (!(this.scrollbar.opts.ref.current && this.root.viewportNode && this.computedStyle)) return;
		this.scrollbarVis.setSizes({
			content: this.root.viewportNode.scrollWidth,
			viewport: this.root.viewportNode.offsetWidth,
			scrollbar: {
				size: this.scrollbar.opts.ref.current.clientWidth,
				paddingStart: toInt(this.computedStyle.paddingLeft),
				paddingEnd: toInt(this.computedStyle.paddingRight)
			}
		});
	};
	#thumbSize = derived(() => {
		return getThumbSize(this.scrollbarVis.sizes);
	});
	get thumbSize() {
		return this.#thumbSize();
	}
	set thumbSize($$value) {
		return this.#thumbSize($$value);
	}
	#props = derived(() => ({
		id: this.scrollbar.opts.id.current,
		"data-orientation": "horizontal",
		style: {
			bottom: 0,
			left: this.root.opts.dir.current === "rtl" ? "var(--bits-scroll-area-corner-width)" : 0,
			right: this.root.opts.dir.current === "ltr" ? "var(--bits-scroll-area-corner-width)" : 0,
			"--bits-scroll-area-thumb-width": `${this.thumbSize}px`
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarYState = class ScrollAreaScrollbarYState {
	static create(opts) {
		return ScrollAreaScrollbarAxisContext.set(new ScrollAreaScrollbarYState(opts, ScrollAreaScrollbarVisibleContext.get()));
	}
	opts;
	scrollbarVis;
	root;
	scrollbar;
	attachment;
	computedStyle;
	constructor(opts, scrollbarVis) {
		this.opts = opts;
		this.scrollbarVis = scrollbarVis;
		this.root = scrollbarVis.root;
		this.scrollbar = scrollbarVis.scrollbar;
		this.attachment = attachRef(this.scrollbar.opts.ref, (v) => this.root.scrollbarYNode = v);
		this.onThumbPointerDown = this.onThumbPointerDown.bind(this);
		this.onDragScroll = this.onDragScroll.bind(this);
		this.onThumbPointerUp = this.onThumbPointerUp.bind(this);
		this.onThumbPositionChange = this.onThumbPositionChange.bind(this);
		this.onWheelScroll = this.onWheelScroll.bind(this);
		this.onResize = this.onResize.bind(this);
	}
	onThumbPointerDown(pointerPos) {
		this.scrollbarVis.onThumbPointerDown(pointerPos.y);
	}
	onDragScroll(pointerPos) {
		this.scrollbarVis.yOnDragScroll(pointerPos.y);
	}
	onThumbPointerUp() {
		this.scrollbarVis.onThumbPointerUp();
	}
	onThumbPositionChange() {
		this.scrollbarVis.yOnThumbPositionChange();
	}
	onWheelScroll(e, maxScrollPos) {
		if (!this.root.viewportNode) return;
		const scrollPos = this.root.viewportNode.scrollTop + e.deltaY;
		this.scrollbarVis.yOnWheelScroll(scrollPos);
		if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) e.preventDefault();
	}
	onResize() {
		if (!(this.scrollbar.opts.ref.current && this.root.viewportNode && this.computedStyle)) return;
		this.scrollbarVis.setSizes({
			content: this.root.viewportNode.scrollHeight,
			viewport: this.root.viewportNode.offsetHeight,
			scrollbar: {
				size: this.scrollbar.opts.ref.current.clientHeight,
				paddingStart: toInt(this.computedStyle.paddingTop),
				paddingEnd: toInt(this.computedStyle.paddingBottom)
			}
		});
	}
	#thumbSize = derived(() => {
		return getThumbSize(this.scrollbarVis.sizes);
	});
	get thumbSize() {
		return this.#thumbSize();
	}
	set thumbSize($$value) {
		return this.#thumbSize($$value);
	}
	#props = derived(() => ({
		id: this.scrollbar.opts.id.current,
		"data-orientation": "vertical",
		style: {
			top: 0,
			right: this.root.opts.dir.current === "ltr" ? 0 : void 0,
			left: this.root.opts.dir.current === "rtl" ? 0 : void 0,
			bottom: "var(--bits-scroll-area-corner-height)",
			"--bits-scroll-area-thumb-height": `${this.thumbSize}px`
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarSharedState = class ScrollAreaScrollbarSharedState {
	static create() {
		return ScrollAreaScrollbarSharedContext.set(new ScrollAreaScrollbarSharedState(ScrollAreaScrollbarAxisContext.get()));
	}
	scrollbarState;
	root;
	scrollbarVis;
	scrollbar;
	rect = null;
	prevWebkitUserSelect = "";
	handleResize;
	handleThumbPositionChange;
	handleWheelScroll;
	handleThumbPointerDown;
	handleThumbPointerUp;
	#maxScrollPos = derived(() => this.scrollbarVis.sizes.content - this.scrollbarVis.sizes.viewport);
	get maxScrollPos() {
		return this.#maxScrollPos();
	}
	set maxScrollPos($$value) {
		return this.#maxScrollPos($$value);
	}
	constructor(scrollbarState) {
		this.scrollbarState = scrollbarState;
		this.root = scrollbarState.root;
		this.scrollbarVis = scrollbarState.scrollbarVis;
		this.scrollbar = scrollbarState.scrollbarVis.scrollbar;
		this.handleResize = () => this.scrollbarState.onResize();
		this.handleThumbPositionChange = this.scrollbarState.onThumbPositionChange;
		this.handleWheelScroll = this.scrollbarState.onWheelScroll;
		this.handleThumbPointerDown = this.scrollbarState.onThumbPointerDown;
		this.handleThumbPointerUp = this.scrollbarState.onThumbPointerUp;
		new SvelteResizeObserver(() => this.scrollbar.opts.ref.current, this.handleResize);
		new SvelteResizeObserver(() => this.root.contentNode, this.handleResize);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onlostpointercapture = this.onlostpointercapture.bind(this);
	}
	handleDragScroll(e) {
		if (!this.rect) return;
		const x = e.clientX - this.rect.left;
		const y = e.clientY - this.rect.top;
		this.scrollbarState.onDragScroll({
			x,
			y
		});
	}
	#cleanupPointerState() {
		if (this.rect === null) return;
		this.root.domContext.getDocument().body.style.webkitUserSelect = this.prevWebkitUserSelect;
		if (this.root.viewportNode) this.root.viewportNode.style.scrollBehavior = "";
		this.rect = null;
	}
	onpointerdown(e) {
		if (e.button !== 0) return;
		e.target.setPointerCapture(e.pointerId);
		this.rect = this.scrollbar.opts.ref.current?.getBoundingClientRect() ?? null;
		this.prevWebkitUserSelect = this.root.domContext.getDocument().body.style.webkitUserSelect;
		this.root.domContext.getDocument().body.style.webkitUserSelect = "none";
		if (this.root.viewportNode) this.root.viewportNode.style.scrollBehavior = "auto";
		this.handleDragScroll(e);
	}
	onpointermove(e) {
		this.handleDragScroll(e);
	}
	onpointerup(e) {
		const target = e.target;
		if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
		this.#cleanupPointerState();
	}
	onlostpointercapture(_) {
		this.#cleanupPointerState();
	}
	#props = derived(() => mergeProps({
		...this.scrollbarState.props,
		style: {
			position: "absolute",
			...this.scrollbarState.props.style
		},
		[scrollAreaAttrs.scrollbar]: "",
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointerup: this.onpointerup,
		onlostpointercapture: this.onlostpointercapture
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaThumbImplState = class ScrollAreaThumbImplState {
	static create(opts) {
		return new ScrollAreaThumbImplState(opts, ScrollAreaScrollbarSharedContext.get());
	}
	opts;
	scrollbarState;
	attachment;
	#root;
	#removeUnlinkedScrollListener;
	#debounceScrollEnd = useDebounce(() => {
		if (this.#removeUnlinkedScrollListener) {
			this.#removeUnlinkedScrollListener();
			this.#removeUnlinkedScrollListener = void 0;
		}
	}, 100);
	constructor(opts, scrollbarState) {
		this.opts = opts;
		this.scrollbarState = scrollbarState;
		this.#root = scrollbarState.root;
		this.attachment = attachRef(this.opts.ref, (v) => this.scrollbarState.scrollbarVis.thumbNode = v);
		this.onpointerdowncapture = this.onpointerdowncapture.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
	}
	onpointerdowncapture(e) {
		const thumb = e.target;
		if (!thumb) return;
		const thumbRect = thumb.getBoundingClientRect();
		const x = e.clientX - thumbRect.left;
		const y = e.clientY - thumbRect.top;
		this.scrollbarState.handleThumbPointerDown({
			x,
			y
		});
	}
	onpointerup(_) {
		this.scrollbarState.handleThumbPointerUp();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-state": this.scrollbarState.scrollbarVis.hasThumb ? "visible" : "hidden",
		style: {
			width: "var(--bits-scroll-area-thumb-width)",
			height: "var(--bits-scroll-area-thumb-height)",
			transform: this.scrollbarState.scrollbarVis.prevTransformStyle
		},
		onpointerdowncapture: this.onpointerdowncapture,
		onpointerup: this.onpointerup,
		[scrollAreaAttrs.thumb]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaCornerImplState = class ScrollAreaCornerImplState {
	static create(opts) {
		return new ScrollAreaCornerImplState(opts, ScrollAreaRootContext.get());
	}
	opts;
	root;
	attachment;
	#width = 0;
	#height = 0;
	#hasSize = derived(() => Boolean(this.#width && this.#height));
	get hasSize() {
		return this.#hasSize();
	}
	set hasSize($$value) {
		return this.#hasSize($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref);
		new SvelteResizeObserver(() => this.root.scrollbarXNode, () => {
			const height = this.root.scrollbarXNode?.offsetHeight || 0;
			this.root.cornerHeight = height;
			this.#height = height;
		});
		new SvelteResizeObserver(() => this.root.scrollbarYNode, () => {
			const width = this.root.scrollbarYNode?.offsetWidth || 0;
			this.root.cornerWidth = width;
			this.#width = width;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		style: {
			width: this.#width,
			height: this.#height,
			position: "absolute",
			right: this.root.opts.dir.current === "ltr" ? 0 : void 0,
			left: this.root.opts.dir.current === "rtl" ? 0 : void 0,
			bottom: 0
		},
		[scrollAreaAttrs.corner]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
function toInt(value) {
	return value ? Number.parseInt(value, 10) : 0;
}
function getThumbRatio(viewportSize, contentSize) {
	const ratio = viewportSize / contentSize;
	return Number.isNaN(ratio) ? 0 : ratio;
}
function getThumbSize(sizes) {
	const ratio = getThumbRatio(sizes.viewport, sizes.content);
	const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
	const thumbSize = (sizes.scrollbar.size - scrollbarPadding) * ratio;
	return Math.max(thumbSize, 18);
}
function getScrollPositionFromPointer({ pointerPos, pointerOffset, sizes, dir = "ltr" }) {
	const thumbSizePx = getThumbSize(sizes);
	const thumbCenter = thumbSizePx / 2;
	const offset = pointerOffset || thumbCenter;
	const thumbOffsetFromEnd = thumbSizePx - offset;
	const minPointerPos = sizes.scrollbar.paddingStart + offset;
	const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
	const maxScrollPos = sizes.content - sizes.viewport;
	const scrollRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
	return linearScale([minPointerPos, maxPointerPos], scrollRange)(pointerPos);
}
function getThumbOffsetFromScroll({ scrollPos, sizes, dir = "ltr" }) {
	const thumbSizePx = getThumbSize(sizes);
	const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
	const scrollbar = sizes.scrollbar.size - scrollbarPadding;
	const maxScrollPos = sizes.content - sizes.viewport;
	const maxThumbPos = scrollbar - thumbSizePx;
	const scrollClampRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
	const scrollWithoutMomentum = clamp(scrollPos, scrollClampRange[0], scrollClampRange[1]);
	return linearScale([0, maxScrollPos], [0, maxThumbPos])(scrollWithoutMomentum);
}
function linearScale(input, output) {
	return (value) => {
		if (input[0] === input[1] || output[0] === output[1]) return output[0];
		const ratio = (output[1] - output[0]) / (input[1] - input[0]);
		return output[0] + ratio * (value - input[0]);
	};
}
function isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos) {
	return scrollPos > 0 && scrollPos < maxScrollPos;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area.svelte
function Scroll_area$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), type = "hover", dir = "ltr", scrollHideDelay = 600, children, child, $$slots, $$events, ...restProps } = $$props;
		const rootState = ScrollAreaRootState.create({
			type: boxWith(() => type),
			dir: boxWith(() => dir),
			scrollHideDelay: boxWith(() => scrollHideDelay),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-viewport.svelte
function Scroll_area_viewport($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), children, $$slots, $$events, ...restProps } = $$props;
		const viewportState = ScrollAreaViewportState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, viewportState.props));
		const mergedContentProps = derived(() => mergeProps({}, viewportState.contentProps));
		$$renderer.push(`<div${attributes({ ...mergedProps() })}><div${attributes({ ...mergedContentProps() })}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div></div>`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-shared.svelte
function Scroll_area_scrollbar_shared($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollbarSharedState = ScrollAreaScrollbarSharedState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarSharedState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-x.svelte
function Scroll_area_scrollbar_x($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const scrollbarXState = ScrollAreaScrollbarXState.create({ mounted: boxWith(() => isMounted.current) });
		const mergedProps = derived(() => mergeProps(restProps, scrollbarXState.props));
		Scroll_area_scrollbar_shared($$renderer, spread_props([mergedProps()]));
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-y.svelte
function Scroll_area_scrollbar_y($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const scrollbarYState = ScrollAreaScrollbarYState.create({ mounted: boxWith(() => isMounted.current) });
		const mergedProps = derived(() => mergeProps(restProps, scrollbarYState.props));
		Scroll_area_scrollbar_shared($$renderer, spread_props([mergedProps()]));
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-visible.svelte
function Scroll_area_scrollbar_visible($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		if (ScrollAreaScrollbarVisibleState.create().scrollbar.opts.orientation.current === "horizontal") {
			$$renderer.push("<!--[0-->");
			Scroll_area_scrollbar_x($$renderer, spread_props([restProps]));
		} else {
			$$renderer.push("<!--[-1-->");
			Scroll_area_scrollbar_y($$renderer, spread_props([restProps]));
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-auto.svelte
function Scroll_area_scrollbar_auto($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarAutoState = ScrollAreaScrollbarAutoState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarAutoState.props));
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, {
				open: forceMount || scrollbarAutoState.isVisible,
				ref: scrollbarAutoState.scrollbar.opts.ref,
				presence});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-scroll.svelte
function Scroll_area_scrollbar_scroll($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarScrollState = ScrollAreaScrollbarScrollState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarScrollState.props));
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, spread_props([mergedProps(), {
				open: forceMount || !scrollbarScrollState.isHidden,
				ref: scrollbarScrollState.scrollbar.opts.ref,
				presence,
				$$slots: { presence: true }
			}]));
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-hover.svelte
function Scroll_area_scrollbar_hover($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarHoverState = ScrollAreaScrollbarHoverState.create();
		const scrollbarAutoState = ScrollAreaScrollbarAutoState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarHoverState.props, scrollbarAutoState.props, { "data-state": scrollbarHoverState.isVisible ? "visible" : "hidden" }));
		const open = derived(() => forceMount || scrollbarHoverState.isVisible && scrollbarAutoState.isVisible);
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, {
				open: open(),
				ref: scrollbarAutoState.scrollbar.opts.ref,
				presence});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar.svelte
function Scroll_area_scrollbar$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), orientation, $$slots, $$events, ...restProps } = $$props;
		const scrollbarState = ScrollAreaScrollbarState.create({
			orientation: boxWith(() => orientation),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const type = derived(() => scrollbarState.root.opts.type.current);
		if (type() === "hover") {
			$$renderer.push("<!--[0-->");
			Scroll_area_scrollbar_hover($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "scroll") {
			$$renderer.push("<!--[1-->");
			Scroll_area_scrollbar_scroll($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "auto") {
			$$renderer.push("<!--[2-->");
			Scroll_area_scrollbar_auto($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "always") {
			$$renderer.push("<!--[3-->");
			Scroll_area_scrollbar_visible($$renderer, spread_props([restProps, { id }]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-thumb-impl.svelte
function Scroll_area_thumb_impl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, id, child, children, present, $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const thumbState = ScrollAreaThumbImplState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			mounted: boxWith(() => isMounted.current)
		});
		const mergedProps = derived(() => mergeProps(restProps, thumbState.props, { style: { hidden: !present } }));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-thumb.svelte
function Scroll_area_thumb($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarState = ScrollAreaScrollbarVisibleContext.get();
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function presence($$renderer, { present }) {
					Scroll_area_thumb_impl($$renderer, spread_props([restProps, {
						id,
						present,
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}]));
				}
				Presence_layer($$renderer, {
					open: forceMount || scrollbarState.hasThumb,
					ref: scrollbarState.scrollbar.opts.ref,
					presence});
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-corner-impl.svelte
function Scroll_area_corner_impl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, id, children, child, $$slots, $$events, ...restProps } = $$props;
		const cornerState = ScrollAreaCornerImplState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, cornerState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-corner.svelte
function Scroll_area_corner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), $$slots, $$events, ...restProps } = $$props;
		const scrollAreaState = ScrollAreaRootContext.get();
		const hasBothScrollbarsVisible = derived(() => Boolean(scrollAreaState.scrollbarXNode && scrollAreaState.scrollbarYNode));
		const hasCorner = derived(() => scrollAreaState.opts.type.current !== "scroll" && hasBothScrollbarsVisible());
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (hasCorner()) {
				$$renderer.push("<!--[0-->");
				Scroll_area_corner_impl($$renderer, spread_props([restProps, {
					id,
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					}
				}]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select.svelte
function Select$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, onValueChange = noop, name = "", disabled = false, type, open = false, onOpenChange = noop, onOpenChangeComplete = noop, loop = false, scrollAlignment = "nearest", required = false, items = [], allowDeselect = false, autocomplete, children } = $$props;
		function handleDefaultValue() {
			if (value !== void 0) return;
			value = type === "single" ? "" : [];
		}
		handleDefaultValue();
		watch.pre(() => value, () => {
			handleDefaultValue();
		});
		let inputValue = "";
		const rootState = SelectRootState.create({
			type,
			value: boxWith(() => value, (v) => {
				value = v;
				onValueChange(v);
			}),
			disabled: boxWith(() => disabled),
			required: boxWith(() => required),
			open: boxWith(() => open, (v) => {
				open = v;
				onOpenChange(v);
			}),
			loop: boxWith(() => loop),
			scrollAlignment: boxWith(() => scrollAlignment),
			name: boxWith(() => name),
			isCombobox: false,
			items: boxWith(() => items),
			allowDeselect: boxWith(() => allowDeselect),
			inputValue: boxWith(() => inputValue, (v) => inputValue = v),
			onOpenChangeComplete: boxWith(() => onOpenChangeComplete)
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Floating_layer($$renderer, {
				children: ($$renderer) => {
					children?.($$renderer);
					$$renderer.push(`<!---->`);
				}});
			$$renderer.push(`<!----> `);
			if (Array.isArray(rootState.opts.value.current)) {
				$$renderer.push("<!--[0-->");
				if (rootState.opts.value.current.length === 0) {
					$$renderer.push("<!--[0-->");
					Select_hidden_input($$renderer, { autocomplete });
				} else {
					$$renderer.push(`<!--[-1--><!--[-->`);
					const each_array = ensure_array_like(rootState.opts.value.current);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let item = each_array[$$index];
						Select_hidden_input($$renderer, {
							value: item,
							autocomplete
						});
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else {
				$$renderer.push("<!--[-1-->");
				Select_hidden_input($$renderer, {
					autocomplete,
					get value() {
						return rootState.opts.value.current;
					},
					set value($$value) {
						rootState.opts.value.current = $$value;
						$$settled = false;
					}
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			value,
			open
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-value.svelte
function Select_value$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), placeholder, child, children, $$slots, $$events, ...restProps } = $$props;
		const valueState = SelectValueState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			placeholder: boxWith(() => placeholder)
		});
		const mergedProps = derived(() => mergeProps(restProps, valueState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				props: mergedProps(),
				...valueState.snippetProps
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><span${attributes({ ...mergedProps() })}>`);
			if (children) {
				$$renderer.push("<!--[0-->");
				children?.($$renderer, valueState.snippetProps);
				$$renderer.push(`<!---->`);
			} else if (valueState.snippetProps.selection.type === "single") $$renderer.push(`<!--[1-->${escape_html(valueState.snippetProps.selection.selected?.label ?? placeholder)}`);
			else if (valueState.snippetProps.selection.type === "multiple" && valueState.snippetProps.selection.selected) $$renderer.push(`<!--[2-->${escape_html(valueState.snippetProps.selection.selected.length > 0 ? valueState.snippetProps.selection.selected.map((selected) => selected.label).join(", ") : placeholder)}`);
			else $$renderer.push(`<!--[-1-->${escape_html(placeholder)}`);
			$$renderer.push(`<!--]--></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-trigger.svelte
function Select_trigger$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, child, children, type = "button", $$slots, $$events, ...restProps } = $$props;
		const triggerState = SelectTriggerState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { type }));
		if (Floating_layer_anchor) {
			$$renderer.push("<!--[-->");
			Floating_layer_anchor($$renderer, {
				id,
				ref: triggerState.opts.ref,
				children: ($$renderer) => {
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, { props: mergedProps() });
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push(`<!--[-1--><button${attributes({ ...mergedProps() })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></button>`);
					}
					$$renderer.push(`<!--]-->`);
				}});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/avatar/avatar-fallback.svelte
function Avatar_fallback($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Avatar_fallback$1) {
				$$renderer.push("<!--[-->");
				Avatar_fallback$1($$renderer, spread_props([
					{
						"data-slot": "avatar-fallback",
						class: cn("bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/avatar/avatar.svelte
function Avatar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, loadingStatus = "loading", size = "default", class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Avatar$1) {
				$$renderer.push("<!--[-->");
				Avatar$1($$renderer, spread_props([
					{
						"data-slot": "avatar",
						"data-size": size,
						class: cn("size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						get loadingStatus() {
							return loadingStatus;
						},
						set loadingStatus($$value) {
							loadingStatus = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			loadingStatus
		});
	});
}
//#endregion
//#region src/lib/components/ui/button/button.svelte
var buttonVariants = tv({
	base: "focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-2xl border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-background dark:bg-transparent hover:bg-muted hover:text-foreground dark:hover:bg-input/30 aria-expanded:bg-muted aria-expanded:text-foreground",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
			destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
			xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			lg: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
			icon: "size-8",
			"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { class: className, variant = "default", size = "default", ref = null, href = void 0, type = "button", disabled, children, $$slots, $$events, ...restProps } = $$props;
		if (href) {
			$$renderer.push(`<!--[0--><a${attributes({
				"data-slot": "button",
				class: clsx$1(cn(buttonVariants({
					variant,
					size
				}), className)),
				href: disabled ? void 0 : href,
				"aria-disabled": disabled,
				role: disabled ? "link" : void 0,
				tabindex: disabled ? -1 : void 0,
				...restProps
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></a>`);
		} else {
			$$renderer.push(`<!--[-1--><button${attributes({
				"data-slot": "button",
				class: clsx$1(cn(buttonVariants({
					variant,
					size
				}), className)),
				type,
				disabled,
				...restProps
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></button>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/card/card.svelte
function Card($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, children, size = "default", $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			"data-slot": "card",
			"data-size": size,
			class: clsx$1(cn("bg-card text-card-foreground ring-foreground/5 dark:ring-foreground/10 gap-(--card-spacing) overflow-hidden rounded-[min(var(--radius-4xl),24px)] py-(--card-spacing) text-sm shadow-sm ring-1 [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-[min(var(--radius-4xl),24px)] *:[img:last-child]:rounded-b-[min(var(--radius-4xl),24px)] group/card flex flex-col", className)),
			...restProps
		})}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/input/input.svelte
function Input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, value = void 0, type, files = void 0, class: className, "data-slot": dataSlot = "input", $$slots, $$events, ...restProps } = $$props;
		if (type === "file") $$renderer.push(`<!--[0--><input${attributes({
			"data-slot": dataSlot,
			class: clsx$1(cn("bg-input/50 border-transparent focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-8 rounded-2xl border px-2.5 py-1 text-base transition-[color,box-shadow] duration-200 file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)),
			type: "file",
			...restProps
		}, void 0, void 0, void 0, 4)}/>`);
		else $$renderer.push(`<!--[-1--><input${attributes({
			"data-slot": dataSlot,
			class: clsx$1(cn("bg-input/50 border-transparent focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-8 rounded-2xl border px-2.5 py-1 text-base transition-[color,box-shadow] duration-200 file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)),
			type,
			value,
			...restProps
		}, void 0, void 0, void 0, 4)}/>`);
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			value,
			files
		});
	});
}
//#endregion
//#region src/lib/components/ui/scroll-area/scroll-area-scrollbar.svelte
function Scroll_area_scrollbar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, orientation = "vertical", children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Scroll_area_scrollbar$1) {
				$$renderer.push("<!--[-->");
				Scroll_area_scrollbar$1($$renderer, spread_props([
					{
						"data-slot": "scroll-area-scrollbar",
						"data-orientation": orientation,
						orientation,
						class: cn("data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px transition-colors select-none", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							children?.($$renderer);
							$$renderer.push(`<!----> `);
							if (Scroll_area_thumb) {
								$$renderer.push("<!--[-->");
								Scroll_area_thumb($$renderer, {
									"data-slot": "scroll-area-thumb",
									class: "rounded-full relative flex-1 bg-border"
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/scroll-area/scroll-area.svelte
function Scroll_area($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, viewportRef = null, class: className, orientation = "vertical", scrollbarXClasses = "", scrollbarYClasses = "", children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Scroll_area$1) {
				$$renderer.push("<!--[-->");
				Scroll_area$1($$renderer, spread_props([
					{
						"data-slot": "scroll-area",
						class: cn("relative", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							if (Scroll_area_viewport) {
								$$renderer.push("<!--[-->");
								Scroll_area_viewport($$renderer, {
									"data-slot": "scroll-area-viewport",
									class: "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
									get ref() {
										return viewportRef;
									},
									set ref($$value) {
										viewportRef = $$value;
										$$settled = false;
									},
									children: ($$renderer) => {
										children?.($$renderer);
										$$renderer.push(`<!---->`);
									},
									$$slots: { default: true }
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
							$$renderer.push(` `);
							if (orientation === "vertical" || orientation === "both") {
								$$renderer.push("<!--[0-->");
								Scroll_area_scrollbar($$renderer, {
									orientation: "vertical",
									class: scrollbarYClasses
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (orientation === "horizontal" || orientation === "both") {
								$$renderer.push("<!--[0-->");
								Scroll_area_scrollbar($$renderer, {
									orientation: "horizontal",
									class: scrollbarXClasses
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (Scroll_area_corner) {
								$$renderer.push("<!--[-->");
								Scroll_area_corner($$renderer, {});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			viewportRef
		});
	});
}
//#endregion
//#region src/lib/components/ui/select/select-portal.svelte
function Select_portal($$renderer, $$props) {
	let { $$slots, $$events, ...restProps } = $$props;
	if (Portal) {
		$$renderer.push("<!--[-->");
		Portal($$renderer, spread_props([restProps]));
		$$renderer.push("<!--]-->");
	} else {
		$$renderer.push("<!--[!-->");
		$$renderer.push("<!--]-->");
	}
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/arrow-down-s-line.svelte
function Arrow_down_s_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-down-s-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/ui/select/select-scroll-down-button.svelte
function Select_scroll_down_button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_scroll_down_button$1) {
				$$renderer.push("<!--[-->");
				Select_scroll_down_button$1($$renderer, spread_props([
					{
						"data-slot": "select-scroll-down-button",
						class: cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							Arrow_down_s_line($$renderer, {});
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/arrow-up-s-line.svelte
function Arrow_up_s_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-arrow-up-s-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M11.9999 10.8284L7.0502 15.7782L5.63599 14.364L11.9999 8L18.3639 14.364L16.9497 15.7782L11.9999 10.8284Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/ui/select/select-scroll-up-button.svelte
function Select_scroll_up_button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_scroll_up_button$1) {
				$$renderer.push("<!--[-->");
				Select_scroll_up_button$1($$renderer, spread_props([
					{
						"data-slot": "select-scroll-up-button",
						class: cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							Arrow_up_s_line($$renderer, {});
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/select/select-content.svelte
function Select_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, sideOffset = 4, portalProps, children, preventScroll = true, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Select_portal($$renderer, spread_props([portalProps, {
				children: ($$renderer) => {
					if (Select_content$1) {
						$$renderer.push("<!--[-->");
						Select_content$1($$renderer, spread_props([
							{
								sideOffset,
								preventScroll,
								"data-slot": "select-content",
								class: cn("text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 dark:ring-foreground/10 min-w-36 rounded-2xl shadow-lg ring-1 duration-100 dark z-50 max-h-(--bits-select-content-available-height) origin-(--bits-select-content-transform-origin) overflow-x-hidden overflow-y-auto animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!", className)
							},
							restProps,
							{
								get ref() {
									return ref;
								},
								set ref($$value) {
									ref = $$value;
									$$settled = false;
								},
								children: ($$renderer) => {
									Select_scroll_up_button($$renderer, {});
									$$renderer.push(`<!----> `);
									if (Select_viewport) {
										$$renderer.push("<!--[-->");
										Select_viewport($$renderer, {
											class: cn("h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1"),
											children: ($$renderer) => {
												children?.($$renderer);
												$$renderer.push(`<!---->`);
											},
											$$slots: { default: true }
										});
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
									$$renderer.push(` `);
									Select_scroll_down_button($$renderer, {});
									$$renderer.push(`<!---->`);
								},
								$$slots: { default: true }
							}
						]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				},
				$$slots: { default: true }
			}]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/remixicon-svelte/dist/icons/check-line.svelte
function Check_line($$renderer, $$props) {
	let { fill = "currentColor", class: className, $$slots, $$events, ...restProps } = $$props;
	$$renderer.push(`<svg${attributes({
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: "0 0 24 24",
		fill,
		class: `remixicon ri-check-line ${stringify(className)}`,
		...restProps
	}, void 0, void 0, void 0, 3)}><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path></svg>`);
}
//#endregion
//#region src/lib/components/ui/select/select-item.svelte
function Select_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, value, label, children: childrenProp, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { selected, highlighted }) {
					$$renderer.push(`<span class="pointer-events-none absolute right-2 flex size-4 items-center justify-center">`);
					if (selected) {
						$$renderer.push("<!--[0-->");
						Check_line($$renderer, { class: "pointer-events-none" });
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></span> <span class="flex flex-1 gap-2 shrink-0 whitespace-nowrap">`);
					if (childrenProp) {
						$$renderer.push("<!--[0-->");
						childrenProp($$renderer, {
							selected,
							highlighted
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push(`<!--[-1-->${escape_html(label || value)}`);
					$$renderer.push(`<!--]--></span>`);
				}
				if (Select_item$1) {
					$$renderer.push("<!--[-->");
					Select_item$1($$renderer, spread_props([
						{
							value,
							label,
							"data-slot": "select-item",
							class: cn("focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2 min-h-7 rounded-xl py-1.5 pr-8 pl-2 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", "data-highlighted:bg-accent data-highlighted:text-accent-foreground", className)
						},
						restProps,
						{
							get ref() {
								return ref;
							},
							set ref($$value) {
								ref = $$value;
								$$settled = false;
							},
							children,
							$$slots: { default: true }
						}
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/separator/separator.svelte
function Separator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, "data-slot": dataSlot = "separator", $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Separator$1) {
				$$renderer.push("<!--[-->");
				Separator$1($$renderer, spread_props([
					{
						"data-slot": dataSlot,
						class: cn("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/select/select-trigger.svelte
function Select_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, children, size = "default", $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_trigger$1) {
				$$renderer.push("<!--[-->");
				Select_trigger$1($$renderer, spread_props([
					{
						"data-slot": "select-trigger",
						"data-size": size,
						class: cn("bg-input/50 border-transparent data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-2xl border py-2 px-3 text-sm transition-[color,box-shadow] duration-200 focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							children?.($$renderer);
							$$renderer.push(`<!----> `);
							Arrow_down_s_line($$renderer, { class: "text-muted-foreground size-4 pointer-events-none" });
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/select/select-value.svelte
function Select_value($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_value$1) {
				$$renderer.push("<!--[-->");
				Select_value$1($$renderer, spread_props([
					{ "data-slot": "select-value" },
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/components/ui/select/select.svelte
function Select($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, value = void 0, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select$1) {
				$$renderer.push("<!--[-->");
				Select$1($$renderer, spread_props([restProps, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					},
					get value() {
						return value;
					},
					set value($$value) {
						value = $$value;
						$$settled = false;
					}
				}]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			open,
			value
		});
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let messages = [];
		let query = "";
		let selectedDepartment = "";
		let isLoading = false;
		const departments = [
			"All",
			"HCM",
			"MIS"
		];
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">`);
			Card($$renderer, {
				class: "flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden shadow-lg",
				children: ($$renderer) => {
					$$renderer.push(`<header class="flex items-center justify-between gap-4 p-4"><div class="flex items-center gap-3">`);
					Avatar($$renderer, {
						children: ($$renderer) => {
							Avatar_fallback($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!---->AI`);
								},
								$$slots: { default: true }
							});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> <div><h1 class="text-lg font-semibold">Asisten SOP &amp; IK</h1> <p class="text-sm text-muted-foreground">Knowledge Base</p></div></div> <div class="w-40">`);
					Select($$renderer, {
						type: "single",
						disabled: isLoading,
						get value() {
							return selectedDepartment;
						},
						set value($$value) {
							selectedDepartment = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							Select_trigger($$renderer, {
								children: ($$renderer) => {
									Select_value($$renderer, { placeholder: "Departemen" });
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Select_content($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array = ensure_array_like(departments);
									for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
										let department = each_array[$$index];
										Select_item($$renderer, {
											value: department === "All" ? "" : department,
											children: ($$renderer) => {
												$$renderer.push(`<!---->${escape_html(department)}`);
											},
											$$slots: { default: true }
										});
									}
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div></header> `);
					Separator($$renderer, {});
					$$renderer.push(`<!----> `);
					Scroll_area($$renderer, {
						class: "min-h-0 flex-1",
						children: ($$renderer) => {
							$$renderer.push(`<main class="flex flex-col gap-6 p-6">`);
							if (messages.length === 0) {
								$$renderer.push(`<!--[0--><div class="flex flex-1 items-center justify-center py-32 text-center"><div class="max-w-md space-y-3">`);
								Avatar($$renderer, {
									class: "mx-auto h-14 w-14",
									children: ($$renderer) => {
										Avatar_fallback($$renderer, {
											class: "text-lg",
											children: ($$renderer) => {
												$$renderer.push(`<!---->AI`);
											},
											$$slots: { default: true }
										});
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!----> <h2 class="text-xl font-semibold">Ada yang bisa saya bantu?</h2> <p class="text-sm text-muted-foreground">Silakan tanyakan sesuatu terkait SOP atau
								Instruksi Kerja (IK).</p></div></div>`);
							} else {
								$$renderer.push(`<!--[-1--><!--[-->`);
								const each_array_1 = ensure_array_like(messages);
								for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
									let msg = each_array_1[$$index_1];
									$$renderer.push(`<div${attr_class(clsx$1(["flex w-full gap-3", msg.role === "user" ? "justify-end" : "justify-start"]))}>`);
									if (msg.role === "assistant") {
										$$renderer.push("<!--[0-->");
										Avatar($$renderer, {
											class: "mt-1 shrink-0",
											children: ($$renderer) => {
												Avatar_fallback($$renderer, {
													children: ($$renderer) => {
														$$renderer.push(`<!---->AI`);
													},
													$$slots: { default: true }
												});
											},
											$$slots: { default: true }
										});
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> <div${attr_class(clsx$1(["max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"]))}>`);
									if (msg.content) {
										$$renderer.push("<!--[0-->");
										if (msg.role === "assistant") $$renderer.push(`<!--[0--><div class="prose prose-sm max-w-none dark:prose-invert">${html(marked.parse(msg.content))}</div>`);
										else $$renderer.push(`<!--[-1--><div class="whitespace-pre-wrap">${escape_html(msg.content)}</div>`);
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--></div> `);
									if (msg.role === "user") {
										$$renderer.push("<!--[0-->");
										Avatar($$renderer, {
											class: "mt-1 shrink-0",
											children: ($$renderer) => {
												Avatar_fallback($$renderer, {
													children: ($$renderer) => {
														$$renderer.push(`<!---->U`);
													},
													$$slots: { default: true }
												});
											},
											$$slots: { default: true }
										});
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--></div>`);
								}
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]--></main>`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Separator($$renderer, {});
					$$renderer.push(`<!----> <form class="flex gap-2 p-4">`);
					Input($$renderer, {
						placeholder: "Ketik pertanyaan SOP/IK di sini...",
						disabled: isLoading,
						class: "flex-1",
						get value() {
							return query;
						},
						set value($$value) {
							query = $$value;
							$$settled = false;
						}
					});
					$$renderer.push(`<!----> `);
					Button($$renderer, {
						type: "submit",
						disabled: !query.trim(),
						children: ($$renderer) => {
							$$renderer.push(`<!--[-1-->Kirim`);
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></form>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-BYqnR_S7.js.map
