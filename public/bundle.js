(function () {
  'use strict';

  /*! (c) Andrea Giammarchi - ISC */
  var self$1 = undefined || /* istanbul ignore next */ {};
  try { self$1.WeakMap = WeakMap; }
  catch (WeakMap) {
    // this could be better but 90% of the time
    // it's everything developers need as fallback
    self$1.WeakMap = (function (id, Object) {    var dP = Object.defineProperty;
      var hOP = Object.hasOwnProperty;
      var proto = WeakMap.prototype;
      proto.delete = function (key) {
        return this.has(key) && delete key[this._];
      };
      proto.get = function (key) {
        return this.has(key) ? key[this._] : void 0;
      };
      proto.has = function (key) {
        return hOP.call(key, this._);
      };
      proto.set = function (key, value) {
        dP(key, this._, {configurable: true, value: value});
        return this;
      };
      return WeakMap;
      function WeakMap(iterable) {
        dP(this, '_', {value: '_@ungap/weakmap' + id++});
        if (iterable)
          iterable.forEach(add, this);
      }
      function add(pair) {
        this.set(pair[0], pair[1]);
      }
    }(Math.random(), Object));
  }
  var WeakMap$1 = self$1.WeakMap;

  /*! (c) Andrea Giammarchi - ISC */
  var self$2 = undefined || /* istanbul ignore next */ {};
  try { self$2.WeakSet = WeakSet; }
  catch (WeakSet) {
    (function (id, dP) {
      var proto = WeakSet.prototype;
      proto.add = function (object) {
        if (!this.has(object))
          dP(object, this._, {value: true, configurable: true});
        return this;
      };
      proto.has = function (object) {
        return this.hasOwnProperty.call(object, this._);
      };
      proto.delete = function (object) {
        return this.has(object) && delete object[this._];
      };
      self$2.WeakSet = WeakSet;
      function WeakSet() {      dP(this, '_', {value: '_@ungap/weakmap' + id++});
      }
    }(Math.random(), Object.defineProperty));
  }
  var WeakSet$1 = self$2.WeakSet;

  /*! (c) Andrea Giammarchi - ISC */
  var self$3 = undefined || /* istanbul ignore next */ {};
  try { self$3.Map = Map; }
  catch (Map) {
    self$3.Map = function Map() {
      var i = 0;
      var k = [];
      var v = [];
      return {
        delete: function (key) {
          var had = contains(key);
          if (had) {
            k.splice(i, 1);
            v.splice(i, 1);
          }
          return had;
        },
        get: function get(key) {
          return contains(key) ? v[i] : void 0;
        },
        has: function has(key) {
          return contains(key);
        },
        set: function set(key, value) {
          v[contains(key) ? i : (k.push(key) - 1)] = value;
          return this;
        }
      };
      function contains(v) {
        i = k.indexOf(v);
        return -1 < i;
      }
    };
  }
  var Map$1 = self$3.Map;

  const append = (get, parent, children, start, end, before) => {
    if ((end - start) < 2)
      parent.insertBefore(get(children[start], 1), before);
    else {
      const fragment = parent.ownerDocument.createDocumentFragment();
      while (start < end)
        fragment.appendChild(get(children[start++], 1));
      parent.insertBefore(fragment, before);
    }
  };

  const eqeq = (a, b) => a == b;

  const identity = O => O;

  const indexOf = (
    moreNodes,
    moreStart,
    moreEnd,
    lessNodes,
    lessStart,
    lessEnd,
    compare
  ) => {
    const length = lessEnd - lessStart;
    /* istanbul ignore if */
    if (length < 1)
      return -1;
    while ((moreEnd - moreStart) >= length) {
      let m = moreStart;
      let l = lessStart;
      while (
        m < moreEnd &&
        l < lessEnd &&
        compare(moreNodes[m], lessNodes[l])
      ) {
        m++;
        l++;
      }
      if (l === lessEnd)
        return moreStart;
      moreStart = m + 1;
    }
    return -1;
  };

  const isReversed = (
    futureNodes,
    futureEnd,
    currentNodes,
    currentStart,
    currentEnd,
    compare
  ) => {
    while (
      currentStart < currentEnd &&
      compare(
        currentNodes[currentStart],
        futureNodes[futureEnd - 1]
      )) {
        currentStart++;
        futureEnd--;
      }  return futureEnd === 0;
  };

  const next = (get, list, i, length, before) => i < length ?
                get(list[i], 0) :
                (0 < i ?
                  get(list[i - 1], -0).nextSibling :
                  before);

  const remove = (get, parent, children, start, end) => {
    if ((end - start) < 2)
      parent.removeChild(get(children[start], -1));
    else {
      const range = parent.ownerDocument.createRange();
      range.setStartBefore(get(children[start], -1));
      range.setEndAfter(get(children[end - 1], -1));
      range.deleteContents();
    }
  };

  // - - - - - - - - - - - - - - - - - - -
  // diff related constants and utilities
  // - - - - - - - - - - - - - - - - - - -

  const DELETION = -1;
  const INSERTION = 1;
  const SKIP = 0;
  const SKIP_OND = 50;

  const HS = (
    futureNodes,
    futureStart,
    futureEnd,
    futureChanges,
    currentNodes,
    currentStart,
    currentEnd,
    currentChanges
  ) => {

    let k = 0;
    /* istanbul ignore next */
    let minLen = futureChanges < currentChanges ? futureChanges : currentChanges;
    const link = Array(minLen++);
    const tresh = Array(minLen);
    tresh[0] = -1;

    for (let i = 1; i < minLen; i++)
      tresh[i] = currentEnd;

    const keymap = new Map$1;
    for (let i = currentStart; i < currentEnd; i++)
      keymap.set(currentNodes[i], i);

    for (let i = futureStart; i < futureEnd; i++) {
      const idxInOld = keymap.get(futureNodes[i]);
      if (idxInOld != null) {
        k = findK(tresh, minLen, idxInOld);
        /* istanbul ignore else */
        if (-1 < k) {
          tresh[k] = idxInOld;
          link[k] = {
            newi: i,
            oldi: idxInOld,
            prev: link[k - 1]
          };
        }
      }
    }

    k = --minLen;
    --currentEnd;
    while (tresh[k] > currentEnd) --k;

    minLen = currentChanges + futureChanges - k;
    const diff = Array(minLen);
    let ptr = link[k];
    --futureEnd;
    while (ptr) {
      const {newi, oldi} = ptr;
      while (futureEnd > newi) {
        diff[--minLen] = INSERTION;
        --futureEnd;
      }
      while (currentEnd > oldi) {
        diff[--minLen] = DELETION;
        --currentEnd;
      }
      diff[--minLen] = SKIP;
      --futureEnd;
      --currentEnd;
      ptr = ptr.prev;
    }
    while (futureEnd >= futureStart) {
      diff[--minLen] = INSERTION;
      --futureEnd;
    }
    while (currentEnd >= currentStart) {
      diff[--minLen] = DELETION;
      --currentEnd;
    }
    return diff;
  };

  // this is pretty much the same petit-dom code without the delete map part
  // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L556-L561
  const OND = (
    futureNodes,
    futureStart,
    rows,
    currentNodes,
    currentStart,
    cols,
    compare
  ) => {
    const length = rows + cols;
    const v = [];
    let d, k, r, c, pv, cv, pd;
    outer: for (d = 0; d <= length; d++) {
      /* istanbul ignore if */
      if (d > SKIP_OND)
        return null;
      pd = d - 1;
      /* istanbul ignore next */
      pv = d ? v[d - 1] : [0, 0];
      cv = v[d] = [];
      for (k = -d; k <= d; k += 2) {
        if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
          c = pv[pd + k + 1];
        } else {
          c = pv[pd + k - 1] + 1;
        }
        r = c - k;
        while (
          c < cols &&
          r < rows &&
          compare(
            currentNodes[currentStart + c],
            futureNodes[futureStart + r]
          )
        ) {
          c++;
          r++;
        }
        if (c === cols && r === rows) {
          break outer;
        }
        cv[d + k] = c;
      }
    }

    const diff = Array(d / 2 + length / 2);
    let diffIdx = diff.length - 1;
    for (d = v.length - 1; d >= 0; d--) {
      while (
        c > 0 &&
        r > 0 &&
        compare(
          currentNodes[currentStart + c - 1],
          futureNodes[futureStart + r - 1]
        )
      ) {
        // diagonal edge = equality
        diff[diffIdx--] = SKIP;
        c--;
        r--;
      }
      if (!d)
        break;
      pd = d - 1;
      /* istanbul ignore next */
      pv = d ? v[d - 1] : [0, 0];
      k = c - r;
      if (k === -d || (k !== d && pv[pd + k - 1] < pv[pd + k + 1])) {
        // vertical edge = insertion
        r--;
        diff[diffIdx--] = INSERTION;
      } else {
        // horizontal edge = deletion
        c--;
        diff[diffIdx--] = DELETION;
      }
    }
    return diff;
  };

  const applyDiff = (
    diff,
    get,
    parentNode,
    futureNodes,
    futureStart,
    currentNodes,
    currentStart,
    currentLength,
    before
  ) => {
    const live = new Map$1;
    const length = diff.length;
    let currentIndex = currentStart;
    let i = 0;
    while (i < length) {
      switch (diff[i++]) {
        case SKIP:
          futureStart++;
          currentIndex++;
          break;
        case INSERTION:
          // TODO: bulk appends for sequential nodes
          live.set(futureNodes[futureStart], 1);
          append(
            get,
            parentNode,
            futureNodes,
            futureStart++,
            futureStart,
            currentIndex < currentLength ?
              get(currentNodes[currentIndex], 0) :
              before
          );
          break;
        case DELETION:
          currentIndex++;
          break;
      }
    }
    i = 0;
    while (i < length) {
      switch (diff[i++]) {
        case SKIP:
          currentStart++;
          break;
        case DELETION:
          // TODO: bulk removes for sequential nodes
          if (live.has(currentNodes[currentStart]))
            currentStart++;
          else
            remove(
              get,
              parentNode,
              currentNodes,
              currentStart++,
              currentStart
            );
          break;
      }
    }
  };

  const findK = (ktr, length, j) => {
    let lo = 1;
    let hi = length;
    while (lo < hi) {
      const mid = ((lo + hi) / 2) >>> 0;
      if (j < ktr[mid])
        hi = mid;
      else
        lo = mid + 1;
    }
    return lo;
  };

  const smartDiff = (
    get,
    parentNode,
    futureNodes,
    futureStart,
    futureEnd,
    futureChanges,
    currentNodes,
    currentStart,
    currentEnd,
    currentChanges,
    currentLength,
    compare,
    before
  ) => {
    applyDiff(
      OND(
        futureNodes,
        futureStart,
        futureChanges,
        currentNodes,
        currentStart,
        currentChanges,
        compare
      ) ||
      HS(
        futureNodes,
        futureStart,
        futureEnd,
        futureChanges,
        currentNodes,
        currentStart,
        currentEnd,
        currentChanges
      ),
      get,
      parentNode,
      futureNodes,
      futureStart,
      currentNodes,
      currentStart,
      currentLength,
      before
    );
  };

  /*! (c) 2018 Andrea Giammarchi (ISC) */

  const domdiff = (
    parentNode,     // where changes happen
    currentNodes,   // Array of current items/nodes
    futureNodes,    // Array of future items/nodes
    options         // optional object with one of the following properties
                    //  before: domNode
                    //  compare(generic, generic) => true if same generic
                    //  node(generic) => Node
  ) => {
    if (!options)
      options = {};

    const compare = options.compare || eqeq;
    const get = options.node || identity;
    const before = options.before == null ? null : get(options.before, 0);

    const currentLength = currentNodes.length;
    let currentEnd = currentLength;
    let currentStart = 0;

    let futureEnd = futureNodes.length;
    let futureStart = 0;

    // common prefix
    while (
      currentStart < currentEnd &&
      futureStart < futureEnd &&
      compare(currentNodes[currentStart], futureNodes[futureStart])
    ) {
      currentStart++;
      futureStart++;
    }

    // common suffix
    while (
      currentStart < currentEnd &&
      futureStart < futureEnd &&
      compare(currentNodes[currentEnd - 1], futureNodes[futureEnd - 1])
    ) {
      currentEnd--;
      futureEnd--;
    }

    const currentSame = currentStart === currentEnd;
    const futureSame = futureStart === futureEnd;

    // same list
    if (currentSame && futureSame)
      return futureNodes;

    // only stuff to add
    if (currentSame && futureStart < futureEnd) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        next(get, currentNodes, currentStart, currentLength, before)
      );
      return futureNodes;
    }

    // only stuff to remove
    if (futureSame && currentStart < currentEnd) {
      remove(
        get,
        parentNode,
        currentNodes,
        currentStart,
        currentEnd
      );
      return futureNodes;
    }

    const currentChanges = currentEnd - currentStart;
    const futureChanges = futureEnd - futureStart;
    let i = -1;

    // 2 simple indels: the shortest sequence is a subsequence of the longest
    if (currentChanges < futureChanges) {
      i = indexOf(
        futureNodes,
        futureStart,
        futureEnd,
        currentNodes,
        currentStart,
        currentEnd,
        compare
      );
      // inner diff
      if (-1 < i) {
        append(
          get,
          parentNode,
          futureNodes,
          futureStart,
          i,
          get(currentNodes[currentStart], 0)
        );
        append(
          get,
          parentNode,
          futureNodes,
          i + currentChanges,
          futureEnd,
          next(get, currentNodes, currentEnd, currentLength, before)
        );
        return futureNodes;
      }
    }
    /* istanbul ignore else */
    else if (futureChanges < currentChanges) {
      i = indexOf(
        currentNodes,
        currentStart,
        currentEnd,
        futureNodes,
        futureStart,
        futureEnd,
        compare
      );
      // outer diff
      if (-1 < i) {
        remove(
          get,
          parentNode,
          currentNodes,
          currentStart,
          i
        );
        remove(
          get,
          parentNode,
          currentNodes,
          i + futureChanges,
          currentEnd
        );
        return futureNodes;
      }
    }

    // common case with one replacement for many nodes
    // or many nodes replaced for a single one
    /* istanbul ignore else */
    if ((currentChanges < 2 || futureChanges < 2)) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        get(currentNodes[currentStart], 0)
      );
      remove(
        get,
        parentNode,
        currentNodes,
        currentStart,
        currentEnd
      );
      return futureNodes;
    }

    // the half match diff part has been skipped in petit-dom
    // https://github.com/yelouafi/petit-dom/blob/bd6f5c919b5ae5297be01612c524c40be45f14a7/src/vdom.js#L391-L397
    // accordingly, I think it's safe to skip in here too
    // if one day it'll come out like the speediest thing ever to do
    // then I might add it in here too

    // Extra: before going too fancy, what about reversed lists ?
    //        This should bail out pretty quickly if that's not the case.
    if (
      currentChanges === futureChanges &&
      isReversed(
        futureNodes,
        futureEnd,
        currentNodes,
        currentStart,
        currentEnd,
        compare
      )
    ) {
      append(
        get,
        parentNode,
        futureNodes,
        futureStart,
        futureEnd,
        next(get, currentNodes, currentEnd, currentLength, before)
      );
      return futureNodes;
    }

    // last resort through a smart diff
    smartDiff(
      get,
      parentNode,
      futureNodes,
      futureStart,
      futureEnd,
      futureChanges,
      currentNodes,
      currentStart,
      currentEnd,
      currentChanges,
      currentLength,
      compare,
      before
    );

    return futureNodes;
  };

  /*! (c) Andrea Giammarchi - ISC */
  var self$4 = undefined || /* istanbul ignore next */ {};
  self$4.CustomEvent = typeof CustomEvent === 'function' ?
    CustomEvent :
    (function (__p__) {
      CustomEvent[__p__] = new CustomEvent('').constructor[__p__];
      return CustomEvent;
      function CustomEvent(type, init) {
        if (!init) init = {};
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, !!init.bubbles, !!init.cancelable, init.detail);
        return e;
      }
    }('prototype'));
  var CustomEvent$1 = self$4.CustomEvent;

  // hyperHTML.Component is a very basic class
  // able to create Custom Elements like components
  // including the ability to listen to connect/disconnect
  // events via onconnect/ondisconnect attributes
  // Components can be created imperatively or declaratively.
  // The main difference is that declared components
  // will not automatically render on setState(...)
  // to simplify state handling on render.
  function Component() {
    return this; // this is needed in Edge !!!
  }

  // Component is lazily setup because it needs
  // wire mechanism as lazy content
  function setup(content) {
    // there are various weakly referenced variables in here
    // and mostly are to use Component.for(...) static method.
    const children = new WeakMap$1;
    const create = Object.create;
    const createEntry = (wm, id, component) => {
      wm.set(id, component);
      return component;
    };
    const get = (Class, info, context, id) => {
      const relation = info.get(Class) || relate(Class, info);
      switch (typeof id) {
        case 'object':
        case 'function':
          const wm = relation.w || (relation.w = new WeakMap$1);
          return wm.get(id) || createEntry(wm, id, new Class(context));
        default:
          const sm = relation.p || (relation.p = create(null));
          return sm[id] || (sm[id] = new Class(context));
      }
    };
    const relate = (Class, info) => {
      const relation = {w: null, p: null};
      info.set(Class, relation);
      return relation;
    };
    const set = context => {
      const info = new Map$1;
      children.set(context, info);
      return info;
    };
    // The Component Class
    Object.defineProperties(
      Component,
      {
        // Component.for(context[, id]) is a convenient way
        // to automatically relate data/context to children components
        // If not created yet, the new Component(context) is weakly stored
        // and after that same instance would always be returned.
        for: {
          configurable: true,
          value(context, id) {
            return get(
              this,
              children.get(context) || set(context),
              context,
              id == null ?
                'default' : id
            );
          }
        }
      }
    );
    Object.defineProperties(
      Component.prototype,
      {
        // all events are handled with the component as context
        handleEvent: {value(e) {
          const ct = e.currentTarget;
          this[
            ('getAttribute' in ct && ct.getAttribute('data-call')) ||
            ('on' + e.type)
          ](e);
        }},
        // components will lazily define html or svg properties
        // as soon as these are invoked within the .render() method
        // Such render() method is not provided by the base class
        // but it must be available through the Component extend.
        // Declared components could implement a
        // render(props) method too and use props as needed.
        html: lazyGetter('html', content),
        svg: lazyGetter('svg', content),
        // the state is a very basic/simple mechanism inspired by Preact
        state: lazyGetter('state', function () { return this.defaultState; }),
        // it is possible to define a default state that'd be always an object otherwise
        defaultState: {get() { return {}; }},
        // dispatch a bubbling, cancelable, custom event
        // through the first known/available node
        dispatch: {value(type, detail) {
          const {_wire$} = this;
          if (_wire$) {
            const event = new CustomEvent$1(type, {
              bubbles: true,
              cancelable: true,
              detail
            });
            event.component = this;
            return (_wire$.dispatchEvent ?
                      _wire$ :
                      _wire$.firstChild
                    ).dispatchEvent(event);
          }
          return false;
        }},
        // setting some property state through a new object
        // or a callback, triggers also automatically a render
        // unless explicitly specified to not do so (render === false)
        setState: {value(state, render) {
          const target = this.state;
          const source = typeof state === 'function' ? state.call(this, target) : state;
          for (const key in source) target[key] = source[key];
          if (render !== false)
            this.render();
          return this;
        }}
      }
    );
  }

  // instead of a secret key I could've used a WeakMap
  // However, attaching a property directly will result
  // into better performance with thousands of components
  // hanging around, and less memory pressure caused by the WeakMap
  const lazyGetter = (type, fn) => {
    const secret = '_' + type + '$';
    return {
      get() {
        return this[secret] || setValue(this, secret, fn.call(this, type));
      },
      set(value) {
        setValue(this, secret, value);
      }
    };
  };

  // shortcut to set value on get or set(value)
  const setValue = (self, secret, value) =>
    Object.defineProperty(self, secret, {
      configurable: true,
      value: typeof value === 'function' ?
        function () {
          return (self._wire$ = value.apply(this, arguments));
        } :
        value
    })[secret]
  ;

  Object.defineProperties(
    Component.prototype,
    {
      // used to distinguish better than instanceof
      ELEMENT_NODE: {value: 1},
      nodeType: {value: -1}
    }
  );

  const attributes = {};
  const intents = {};
  const keys = [];
  const hasOwnProperty = intents.hasOwnProperty;

  let length = 0;

  var Intent = {

    // used to invoke right away hyper:attributes
    attributes,

    // hyperHTML.define('intent', (object, update) => {...})
    // can be used to define a third parts update mechanism
    // when every other known mechanism failed.
    // hyper.define('user', info => info.name);
    // hyper(node)`<p>${{user}}</p>`;
    define: (intent, callback) => {
      if (intent.indexOf('-') < 0) {
        if (!(intent in intents)) {
          length = keys.push(intent);
        }
        intents[intent] = callback;
      } else {
        attributes[intent] = callback;
      }
    },

    // this method is used internally as last resort
    // to retrieve a value out of an object
    invoke: (object, callback) => {
      for (let i = 0; i < length; i++) {
        let key = keys[i];
        if (hasOwnProperty.call(object, key)) {
          return intents[key](object[key], callback);
        }
      }
    }
  };

  var isArray = Array.isArray || (function (toString) {
    var $ = toString.call([]);
    return function isArray(object) {
      return toString.call(object) === $;
    };
  }({}.toString));

  /*! (c) Andrea Giammarchi - ISC */
  var createContent = (function (document) {  var FRAGMENT = 'fragment';
    var TEMPLATE = 'template';
    var HAS_CONTENT = 'content' in create(TEMPLATE);

    var createHTML = HAS_CONTENT ?
      function (html) {
        var template = create(TEMPLATE);
        template.innerHTML = html;
        return template.content;
      } :
      function (html) {
        var content = create(FRAGMENT);
        var template = create(TEMPLATE);
        var childNodes = null;
        if (/^[^\S]*?<(col(?:group)?|t(?:head|body|foot|r|d|h))/i.test(html)) {
          var selector = RegExp.$1;
          template.innerHTML = '<table>' + html + '</table>';
          childNodes = template.querySelectorAll(selector);
        } else {
          template.innerHTML = html;
          childNodes = template.childNodes;
        }
        append(content, childNodes);
        return content;
      };

    return function createContent(markup, type) {
      return (type === 'svg' ? createSVG : createHTML)(markup);
    };

    function append(root, childNodes) {
      var length = childNodes.length;
      while (length--)
        root.appendChild(childNodes[0]);
    }

    function create(element) {
      return element === FRAGMENT ?
        document.createDocumentFragment() :
        document.createElementNS('http://www.w3.org/1999/xhtml', element);
    }

    // it could use createElementNS when hasNode is there
    // but this fallback is equally fast and easier to maintain
    // it is also battle tested already in all IE
    function createSVG(svg) {
      var content = create(FRAGMENT);
      var template = create('div');
      template.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
      append(content, template.firstChild.childNodes);
      return content;
    }

  }(document));

  /*! (c) Andrea Giammarchi */
  function disconnected(poly) {  var CONNECTED = 'connected';
    var DISCONNECTED = 'dis' + CONNECTED;
    var Event = poly.Event;
    var WeakSet = poly.WeakSet;
    var notObserving = true;
    var observer = new WeakSet;
    return function observe(node) {
      if (notObserving) {
        notObserving = !notObserving;
        startObserving(node.ownerDocument);
      }
      observer.add(node);
      return node;
    };
    function startObserving(document) {
      var dispatched = null;
      try {
        (new MutationObserver(changes)).observe(
          document,
          {subtree: true, childList: true}
        );
      }
      catch(o_O) {
        var timer = 0;
        var records = [];
        var reschedule = function (record) {
          records.push(record);
          clearTimeout(timer);
          timer = setTimeout(
            function () {
              changes(records.splice(timer = 0, records.length));
            },
            0
          );
        };
        document.addEventListener(
          'DOMNodeRemoved',
          function (event) {
            reschedule({addedNodes: [], removedNodes: [event.target]});
          },
          true
        );
        document.addEventListener(
          'DOMNodeInserted',
          function (event) {
            reschedule({addedNodes: [event.target], removedNodes: []});
          },
          true
        );
      }
      function changes(records) {
        dispatched = new Tracker;
        for (var
          record,
          length = records.length,
          i = 0; i < length; i++
        ) {
          record = records[i];
          dispatchAll(record.removedNodes, DISCONNECTED, CONNECTED);
          dispatchAll(record.addedNodes, CONNECTED, DISCONNECTED);
        }
        dispatched = null;
      }
      function dispatchAll(nodes, type, counter) {
        for (var
          node,
          event = new Event(type),
          length = nodes.length,
          i = 0; i < length;
          (node = nodes[i++]).nodeType === 1 &&
          dispatchTarget(node, event, type, counter)
        );
      }
      function dispatchTarget(node, event, type, counter) {
        if (observer.has(node) && !dispatched[type].has(node)) {
          dispatched[counter].delete(node);
          dispatched[type].add(node);
          node.dispatchEvent(event);
          /*
          // The event is not bubbling (perf reason: should it?),
          // hence there's no way to know if
          // stop/Immediate/Propagation() was called.
          // Should DOM Level 0 work at all?
          // I say it's a YAGNI case for the time being,
          // and easy to implement in user-land.
          if (!event.cancelBubble) {
            var fn = node['on' + type];
            if (fn)
              fn.call(node, event);
          }
          */
        }
        for (var
          // apparently is node.children || IE11 ... ^_^;;
          // https://github.com/WebReflection/disconnected/issues/1
          children = node.children || [],
          length = children.length,
          i = 0; i < length;
          dispatchTarget(children[i++], event, type, counter)
        );
      }
      function Tracker() {
        this[CONNECTED] = new WeakSet;
        this[DISCONNECTED] = new WeakSet;
      }
    }
  }

  /*! (c) Andrea Giammarchi - ISC */
  var importNode = (function (
    document,
    appendChild,
    cloneNode,
    createTextNode,
    importNode
  ) {
    var native = importNode in document;
    // IE 11 has problems with cloning templates:
    // it "forgets" empty childNodes. This feature-detects that.
    var fragment = document.createDocumentFragment();
    fragment[appendChild](document[createTextNode]('g'));
    fragment[appendChild](document[createTextNode](''));
    var content = native ?
      document[importNode](fragment, true) :
      fragment[cloneNode](true);
    return content.childNodes.length < 2 ?
      function importNode(node, deep) {
        var clone = node[cloneNode]();
        for (var
          childNodes = node.childNodes || [],
          length = childNodes.length,
          i = 0; deep && i < length; i++
        ) {
          clone[appendChild](importNode(childNodes[i], deep));
        }
        return clone;
      } :
      (native ?
        document[importNode] :
        function (node, deep) {
          return node[cloneNode](!!deep);
        }
      );
  }(
    document,
    'appendChild',
    'cloneNode',
    'createTextNode',
    'importNode'
  ));

  var trim = ''.trim || function () {
    return String(this).replace(/^\s+|\s+/g, '');
  };

  // Custom
  var UID = '-' + Math.random().toFixed(6) + '%';
  //                           Edge issue!
  if (!(function (template, content, tabindex) {
    return content in template && (
      (template.innerHTML = '<p ' + tabindex + '="' + UID + '"></p>'),
      template[content].childNodes[0].getAttribute(tabindex) == UID
    );
  }(document.createElement('template'), 'content', 'tabindex'))) {
    UID = '_dt: ' + UID.slice(1, -1) + ';';
  }
  var UIDC = '<!--' + UID + '-->';

  // DOM
  var COMMENT_NODE = 8;
  var ELEMENT_NODE = 1;
  var TEXT_NODE = 3;

  var SHOULD_USE_TEXT_CONTENT = /^(?:style|textarea)$/i;
  var VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;

  function sanitize (template) {
    return template.join(UIDC)
            .replace(selfClosing, fullClosing)
            .replace(attrSeeker, attrReplacer);
  }

  var spaces = ' \\f\\n\\r\\t';
  var almostEverything = '[^ ' + spaces + '\\/>"\'=]+';
  var attrName = '[ ' + spaces + ']+' + almostEverything;
  var tagName = '<([A-Za-z]+[A-Za-z0-9:_-]*)((?:';
  var attrPartials = '(?:\\s*=\\s*(?:\'[^\']*?\'|"[^"]*?"|<[^>]*?>|' + almostEverything + '))?)';

  var attrSeeker = new RegExp(tagName + attrName + attrPartials + '+)([ ' + spaces + ']*/?>)', 'g');
  var selfClosing = new RegExp(tagName + attrName + attrPartials + '*)([ ' + spaces + ']*/>)', 'g');
  var findAttributes = new RegExp('(' + attrName + '\\s*=\\s*)([\'"]?)' + UIDC + '\\2', 'gi');

  function attrReplacer($0, $1, $2, $3) {
    return '<' + $1 + $2.replace(findAttributes, replaceAttributes) + $3;
  }

  function replaceAttributes($0, $1, $2) {
    return $1 + ($2 || '"') + UID + ($2 || '"');
  }

  function fullClosing($0, $1, $2) {
    return VOID_ELEMENTS.test($1) ? $0 : ('<' + $1 + $2 + '></' + $1 + '>');
  }

  function create(type, node, path, name) {
    return {name: name, node: node, path: path, type: type};
  }

  function find(node, path) {
    var length = path.length;
    var i = 0;
    while (i < length)
      node = node.childNodes[path[i++]];
    return node;
  }

  function parse(node, holes, parts, path) {
    var childNodes = node.childNodes;
    var length = childNodes.length;
    var i = 0;
    while (i < length) {
      var child = childNodes[i];
      switch (child.nodeType) {
        case ELEMENT_NODE:
          var childPath = path.concat(i);
          parseAttributes(child, holes, parts, childPath);
          parse(child, holes, parts, childPath);
          break;
        case COMMENT_NODE:
          if (child.textContent === UID) {
            parts.shift();
            holes.push(
              // basicHTML or other non standard engines
              // might end up having comments in nodes
              // where they shouldn't, hence this check.
              SHOULD_USE_TEXT_CONTENT.test(node.nodeName) ?
                create('text', node, path) :
                create('any', child, path.concat(i))
            );
          }
          break;
        case TEXT_NODE:
          // the following ignore is actually covered by browsers
          // only basicHTML ends up on previous COMMENT_NODE case
          // instead of TEXT_NODE because it knows nothing about
          // special style or textarea behavior
          /* istanbul ignore if */
          if (
            SHOULD_USE_TEXT_CONTENT.test(node.nodeName) &&
            trim.call(child.textContent) === UIDC
          ) {
            parts.shift();
            holes.push(create('text', node, path));
          }
          break;
      }
      i++;
    }
  }

  function parseAttributes(node, holes, parts, path) {
    var cache = new Map$1;
    var attributes = node.attributes;
    var remove = [];
    var array = remove.slice.call(attributes, 0);
    var length = array.length;
    var i = 0;
    while (i < length) {
      var attribute = array[i++];
      if (attribute.value === UID) {
        var name = attribute.name;
        // the following ignore is covered by IE
        // and the IE9 double viewBox test
        /* istanbul ignore else */
        if (!cache.has(name)) {
          var realName = parts.shift().replace(/^(?:|[\S\s]*?\s)(\S+?)\s*=\s*['"]?$/, '$1');
          var value = attributes[realName] ||
                        // the following ignore is covered by browsers
                        // while basicHTML is already case-sensitive
                        /* istanbul ignore next */
                        attributes[realName.toLowerCase()];
          cache.set(name, value);
          holes.push(create('attr', value, path, realName));
        }
        remove.push(attribute);
      }
    }
    length = remove.length;
    i = 0;
    while (i < length) {
      // Edge HTML bug #16878726
      var attr = remove[i++];
      if (/^id$/i.test(attr.name))
        node.removeAttribute(attr.name);
      // standard browsers would work just fine here
      else
        node.removeAttributeNode(attr);
    }

    // This is a very specific Firefox/Safari issue
    // but since it should be a not so common pattern,
    // it's probably worth patching regardless.
    // Basically, scripts created through strings are death.
    // You need to create fresh new scripts instead.
    // TODO: is there any other node that needs such nonsense?
    var nodeName = node.nodeName;
    if (/^script$/i.test(nodeName)) {
      // this used to be like that
      // var script = createElement(node, nodeName);
      // then Edge arrived and decided that scripts created
      // through template documents aren't worth executing
      // so it became this ... hopefully it won't hurt in the wild
      var script = document.createElement(nodeName);
      length = attributes.length;
      i = 0;
      while (i < length)
        script.setAttributeNode(attributes[i++].cloneNode(true));
      script.textContent = node.textContent;
      node.parentNode.replaceChild(script, node);
    }
  }

  // globals

  var parsed = new WeakMap$1;
  var referenced = new WeakMap$1;

  function createInfo(options, template) {
    var markup = sanitize(template);
    var transform = options.transform;
    if (transform)
      markup = transform(markup);
    var content = createContent(markup, options.type);
    cleanContent(content);
    var holes = [];
    parse(content, holes, template.slice(0), []);
    var info = {
      content: content,
      updates: function (content) {
        var callbacks = [];
        var len = holes.length;
        var i = 0;
        while (i < len) {
          var info = holes[i++];
          var node = find(content, info.path);
          switch (info.type) {
            case 'any':
              callbacks.push(options.any(node, []));
              break;
            case 'attr':
              callbacks.push(options.attribute(node, info.name, info.node));
              break;
            case 'text':
              callbacks.push(options.text(node));
              node.textContent = '';
              break;
          }
        }
        return function () {
          var length = arguments.length;
          var values = length - 1;
          var i = 1;
          if (len !== values) {
            throw new Error(
              values + ' values instead of ' + len + '\n' +
              template.join(', ')
            );
          }
          while (i < length)
            callbacks[i - 1](arguments[i++]);
          return content;
        };
      }
    };
    parsed.set(template, info);
    return info;
  }

  function createDetails(options, template) {
    var info = parsed.get(template) || createInfo(options, template);
    var content = importNode.call(document, info.content, true);
    var details = {
      content: content,
      template: template,
      updates: info.updates(content)
    };
    referenced.set(options, details);
    return details;
  }

  function domtagger(options) {
    return function (template) {
      var details = referenced.get(options);
      if (details == null || details.template !== template)
        details = createDetails(options, template);
      details.updates.apply(null, arguments);
      return details.content;
    };
  }

  function cleanContent(fragment) {
    var childNodes = fragment.childNodes;
    var i = childNodes.length;
    while (i--) {
      var child = childNodes[i];
      if (
        child.nodeType !== 1 &&
        trim.call(child.textContent).length === 0
      ) {
        fragment.removeChild(child);
      }
    }
  }

  /*! (c) Andrea Giammarchi - ISC */
  var hyperStyle = (function (){  // from https://github.com/developit/preact/blob/33fc697ac11762a1cb6e71e9847670d047af7ce5/src/varants.js
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var hyphen = /([^A-Z])([A-Z]+)/g;
    return function hyperStyle(node, original) {
      return 'ownerSVGElement' in node ? svg(node, original) : update(node.style, false);
    };
    function ized($0, $1, $2) {
      return $1 + '-' + $2.toLowerCase();
    }
    function svg(node, original) {
      var style;
      if (original)
        style = original.cloneNode(true);
      else {
        node.setAttribute('style', '--hyper:style;');
        style = node.getAttributeNode('style');
      }
      style.value = '';
      node.setAttributeNode(style);
      return update(style, true);
    }
    function toStyle(object) {
      var key, css = [];
      for (key in object)
        css.push(key.replace(hyphen, ized), ':', object[key], ';');
      return css.join('');
    }
    function update(style, isSVG) {
      var oldType, oldValue;
      return function (newValue) {
        var info, key, styleValue, value;
        switch (typeof newValue) {
          case 'object':
            if (newValue) {
              if (oldType === 'object') {
                if (!isSVG) {
                  if (oldValue !== newValue) {
                    for (key in oldValue) {
                      if (!(key in newValue)) {
                        style[key] = '';
                      }
                    }
                  }
                }
              } else {
                if (isSVG)
                  style.value = '';
                else
                  style.cssText = '';
              }
              info = isSVG ? {} : style;
              for (key in newValue) {
                value = newValue[key];
                styleValue = typeof value === 'number' &&
                                    !IS_NON_DIMENSIONAL.test(key) ?
                                    (value + 'px') : value;
                if (!isSVG && /^--/.test(key))
                  info.setProperty(key, styleValue);
                else
                  info[key] = styleValue;
              }
              oldType = 'object';
              if (isSVG)
                style.value = toStyle((oldValue = info));
              else
                oldValue = newValue;
              break;
            }
          default:
            if (oldValue != newValue) {
              oldType = 'string';
              oldValue = newValue;
              if (isSVG)
                style.value = newValue || '';
              else
                style.cssText = newValue || '';
            }
            break;
        }
      };
    }
  }());

  /*! (c) Andrea Giammarchi - ISC */
  var Wire = (function (slice, proto) {

    proto = Wire.prototype;

    proto.ELEMENT_NODE = 1;
    proto.nodeType = 111;

    proto.remove = function (keepFirst) {
      var childNodes = this.childNodes;
      var first = this.firstChild;
      var last = this.lastChild;
      this._ = null;
      if (keepFirst && childNodes.length === 2) {
        last.parentNode.removeChild(last);
      } else {
        var range = this.ownerDocument.createRange();
        range.setStartBefore(keepFirst ? childNodes[1] : first);
        range.setEndAfter(last);
        range.deleteContents();
      }
      return first;
    };

    proto.valueOf = function (forceAppend) {
      var fragment = this._;
      var noFragment = fragment == null;
      if (noFragment)
        fragment = (this._ = this.ownerDocument.createDocumentFragment());
      if (noFragment || forceAppend) {
        for (var n = this.childNodes, i = 0, l = n.length; i < l; i++)
          fragment.appendChild(n[i]);
      }
      return fragment;
    };

    return Wire;

    function Wire(childNodes) {
      var nodes = (this.childNodes = slice.call(childNodes, 0));
      this.firstChild = nodes[0];
      this.lastChild = nodes[nodes.length - 1];
      this.ownerDocument = nodes[0].ownerDocument;
      this._ = null;
    }

  }([].slice));

  // Node.CONSTANTS
  const DOCUMENT_FRAGMENT_NODE$1 = 11;

  // SVG related constants
  const OWNER_SVG_ELEMENT = 'ownerSVGElement';

  // Custom Elements / MutationObserver constants
  const CONNECTED = 'connected';
  const DISCONNECTED = 'dis' + CONNECTED;

  const componentType = Component.prototype.nodeType;
  const wireType = Wire.prototype.nodeType;

  const observe = disconnected({Event: CustomEvent$1, WeakSet: WeakSet$1});

  // returns an intent to explicitly inject content as html
  const asHTML = html => ({html});

  // returns nodes from wires and components
  const asNode = (item, i) => {
    switch (item.nodeType) {
      case wireType:
        // in the Wire case, the content can be
        // removed, post-pended, inserted, or pre-pended and
        // all these cases are handled by domdiff already
        /* istanbul ignore next */
        return (1 / i) < 0 ?
          (i ? item.remove(true) : item.lastChild) :
          (i ? item.valueOf(true) : item.firstChild);
      case componentType:
        return asNode(item.render(), i);
      default:
        return item;
    }
  };

  // returns true if domdiff can handle the value
  const canDiff = value => 'ELEMENT_NODE' in value;

  // when a Promise is used as interpolation value
  // its result must be parsed once resolved.
  // This callback is in charge of understanding what to do
  // with a returned value once the promise is resolved.
  const invokeAtDistance = (value, callback) => {
    callback(value.placeholder);
    if ('text' in value) {
      Promise.resolve(value.text).then(String).then(callback);
    } else if ('any' in value) {
      Promise.resolve(value.any).then(callback);
    } else if ('html' in value) {
      Promise.resolve(value.html).then(asHTML).then(callback);
    } else {
      Promise.resolve(Intent.invoke(value, callback)).then(callback);
    }
  };

  // quick and dirty way to check for Promise/ish values
  const isPromise_ish = value => value != null && 'then' in value;

  // list of attributes that should not be directly assigned
  const readOnly = /^(?:form|list)$/i;

  // reused every slice time
  const slice = [].slice;

  // simplifies text node creation
  const text = (node, text) => node.ownerDocument.createTextNode(text);

  function Tagger(type) {
    this.type = type;
    return domtagger(this);
  }

  Tagger.prototype = {

    // there are four kind of attributes, and related behavior:
    //  * events, with a name starting with `on`, to add/remove event listeners
    //  * special, with a name present in their inherited prototype, accessed directly
    //  * regular, accessed through get/setAttribute standard DOM methods
    //  * style, the only regular attribute that also accepts an object as value
    //    so that you can style=${{width: 120}}. In this case, the behavior has been
    //    fully inspired by Preact library and its simplicity.
    attribute(node, name, original) {
      const isSVG = OWNER_SVG_ELEMENT in node;
      let oldValue;
      // if the attribute is the style one
      // handle it differently from others
      if (name === 'style')
        return hyperStyle(node, original, isSVG);
      // the name is an event one,
      // add/remove event listeners accordingly
      else if (/^on/.test(name)) {
        let type = name.slice(2);
        if (type === CONNECTED || type === DISCONNECTED) {
          observe(node);
        }
        else if (name.toLowerCase()
          in node) {
          type = type.toLowerCase();
        }
        return newValue => {
          if (oldValue !== newValue) {
            if (oldValue)
              node.removeEventListener(type, oldValue, false);
            oldValue = newValue;
            if (newValue)
              node.addEventListener(type, newValue, false);
          }
        };
      }
      // the attribute is special ('value' in input)
      // and it's not SVG *or* the name is exactly data,
      // in this case assign the value directly
      else if (
        name === 'data' ||
        (!isSVG && name in node && !readOnly.test(name))
      ) {
        return newValue => {
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (node[name] !== newValue) {
              node[name] = newValue;
              if (newValue == null) {
                node.removeAttribute(name);
              }
            }
          }
        };
      }
      else if (name in Intent.attributes) {
        return any => {
          const newValue = Intent.attributes[name](node, any);
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (newValue == null)
              node.removeAttribute(name);
            else
              node.setAttribute(name, newValue);
          }
        };
      }
      // in every other case, use the attribute node as it is
      // update only the value, set it as node only when/if needed
      else {
        let owner = false;
        const attribute = original.cloneNode(true);
        return newValue => {
          if (oldValue !== newValue) {
            oldValue = newValue;
            if (attribute.value !== newValue) {
              if (newValue == null) {
                if (owner) {
                  owner = false;
                  node.removeAttributeNode(attribute);
                }
                attribute.value = newValue;
              } else {
                attribute.value = newValue;
                if (!owner) {
                  owner = true;
                  node.setAttributeNode(attribute);
                }
              }
            }
          }
        };
      }
    },

    // in a hyper(node)`<div>${content}</div>` case
    // everything could happen:
    //  * it's a JS primitive, stored as text
    //  * it's null or undefined, the node should be cleaned
    //  * it's a component, update the content by rendering it
    //  * it's a promise, update the content once resolved
    //  * it's an explicit intent, perform the desired operation
    //  * it's an Array, resolve all values if Promises and/or
    //    update the node with the resulting list of content
    any(node, childNodes) {
      const diffOptions = {node: asNode, before: node};
      const nodeType = OWNER_SVG_ELEMENT in node ? /* istanbul ignore next */ 'svg' : 'html';
      let fastPath = false;
      let oldValue;
      const anyContent = value => {
        switch (typeof value) {
          case 'string':
          case 'number':
          case 'boolean':
            if (fastPath) {
              if (oldValue !== value) {
                oldValue = value;
                childNodes[0].textContent = value;
              }
            } else {
              fastPath = true;
              oldValue = value;
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                [text(node, value)],
                diffOptions
              );
            }
            break;
          case 'function':
            anyContent(value(node));
            break;
          case 'object':
          case 'undefined':
            if (value == null) {
              fastPath = false;
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                [],
                diffOptions
              );
              break;
            }
          default:
            fastPath = false;
            oldValue = value;
            if (isArray(value)) {
              if (value.length === 0) {
                if (childNodes.length) {
                  childNodes = domdiff(
                    node.parentNode,
                    childNodes,
                    [],
                    diffOptions
                  );
                }
              } else {
                switch (typeof value[0]) {
                  case 'string':
                  case 'number':
                  case 'boolean':
                    anyContent({html: value});
                    break;
                  case 'object':
                    if (isArray(value[0])) {
                      value = value.concat.apply([], value);
                    }
                    if (isPromise_ish(value[0])) {
                      Promise.all(value).then(anyContent);
                      break;
                    }
                  default:
                    childNodes = domdiff(
                      node.parentNode,
                      childNodes,
                      value,
                      diffOptions
                    );
                    break;
                }
              }
            } else if (canDiff(value)) {
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                value.nodeType === DOCUMENT_FRAGMENT_NODE$1 ?
                  slice.call(value.childNodes) :
                  [value],
                diffOptions
              );
            } else if (isPromise_ish(value)) {
              value.then(anyContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, anyContent);
            } else if ('text' in value) {
              anyContent(String(value.text));
            } else if ('any' in value) {
              anyContent(value.any);
            } else if ('html' in value) {
              childNodes = domdiff(
                node.parentNode,
                childNodes,
                slice.call(
                  createContent(
                    [].concat(value.html).join(''),
                    nodeType
                  ).childNodes
                ),
                diffOptions
              );
            } else if ('length' in value) {
              anyContent(slice.call(value));
            } else {
              anyContent(Intent.invoke(value, anyContent));
            }
            break;
        }
      };
      return anyContent;
    },

    // style or textareas don't accept HTML as content
    // it's pointless to transform or analyze anything
    // different from text there but it's worth checking
    // for possible defined intents.
    text(node) {
      let oldValue;
      const textContent = value => {
        if (oldValue !== value) {
          oldValue = value;
          const type = typeof value;
          if (type === 'object' && value) {
            if (isPromise_ish(value)) {
              value.then(textContent);
            } else if ('placeholder' in value) {
              invokeAtDistance(value, textContent);
            } else if ('text' in value) {
              textContent(String(value.text));
            } else if ('any' in value) {
              textContent(value.any);
            } else if ('html' in value) {
              textContent([].concat(value.html).join(''));
            } else if ('length' in value) {
              textContent(slice.call(value).join(''));
            } else {
              textContent(Intent.invoke(value, textContent));
            }
          } else if (type === 'function') {
            textContent(value(node));
          } else {
            node.textContent = value == null ? '' : value;
          }
        }
      };
      return textContent;
    }
  };

  /*! (c) Andrea Giammarchi - ISC */
  var templateLiteral = (function () {  var RAW = 'raw';
    var isNoOp = typeof document !== 'object';
    var templateLiteral = function (tl) {
      if (
        // for badly transpiled literals
        !(RAW in tl) ||
        // for some version of TypeScript
        tl.propertyIsEnumerable(RAW) ||
        // and some other version of TypeScript
        !Object.isFrozen(tl[RAW]) ||
        (
          // or for Firefox < 55
          /Firefox\/(\d+)/.test(
            (document.defaultView.navigator || {}).userAgent
          ) &&
          parseFloat(RegExp.$1) < 55
        )
      ) {
        var forever = {};
        templateLiteral = function (tl) {
          for (var key = '.', i = 0; i < tl.length; i++)
            key += tl[i].length + '.' + tl[i];
          return forever[key] || (forever[key] = tl);
        };
      } else {
        isNoOp = true;
      }
      return TL(tl);
    };
    return TL;
    function TL(tl) {
      return isNoOp ? tl : templateLiteral(tl);
    }
  }());

  function tta (template) {
    var length = arguments.length;
    var args = [templateLiteral(template)];
    var i = 1;
    while (i < length)
      args.push(arguments[i++]);
    return args;
  }

  // all wires used per each context
  const wires = new WeakMap$1;

  // A wire is a callback used as tag function
  // to lazily relate a generic object to a template literal.
  // hyper.wire(user)`<div id=user>${user.name}</div>`; => the div#user
  // This provides the ability to have a unique DOM structure
  // related to a unique JS object through a reusable template literal.
  // A wire can specify a type, as svg or html, and also an id
  // via html:id or :id convention. Such :id allows same JS objects
  // to be associated to different DOM structures accordingly with
  // the used template literal without losing previously rendered parts.
  const wire = (obj, type) => obj == null ?
    content(type || 'html') :
    weakly(obj, type || 'html');

  // A wire content is a virtual reference to one or more nodes.
  // It's represented by either a DOM node, or an Array.
  // In both cases, the wire content role is to simply update
  // all nodes through the list of related callbacks.
  // In few words, a wire content is like an invisible parent node
  // in charge of updating its content like a bound element would do.
  const content = type => {
    let wire, tagger, template;
    return function () {
      const args = tta.apply(null, arguments);
      if (template !== args[0]) {
        template = args[0];
        tagger = new Tagger(type);
        wire = wireContent(tagger.apply(tagger, args));
      } else {
        tagger.apply(tagger, args);
      }
      return wire;
    };
  };

  // wires are weakly created through objects.
  // Each object can have multiple wires associated
  // and this is thanks to the type + :id feature.
  const weakly = (obj, type) => {
    const i = type.indexOf(':');
    let wire = wires.get(obj);
    let id = type;
    if (-1 < i) {
      id = type.slice(i + 1);
      type = type.slice(0, i) || 'html';
    }
    if (!wire)
      wires.set(obj, wire = {});
    return wire[id] || (wire[id] = content(type));
  };

  // A document fragment loses its nodes 
  // as soon as it is appended into another node.
  // This has the undesired effect of losing wired content
  // on a second render call, because (by then) the fragment would be empty:
  // no longer providing access to those sub-nodes that ultimately need to
  // stay associated with the original interpolation.
  // To prevent hyperHTML from forgetting about a fragment's sub-nodes,
  // fragments are instead returned as an Array of nodes or, if there's only one entry,
  // as a single referenced node which, unlike fragments, will indeed persist
  // wire content throughout multiple renderings.
  // The initial fragment, at this point, would be used as unique reference to this
  // array of nodes or to this single referenced node.
  const wireContent = node => {
    const childNodes = node.childNodes;
    const {length} = childNodes;
    return length === 1 ?
      childNodes[0] :
      (length ? new Wire(childNodes) : node);
  };

  // a weak collection of contexts that
  // are already known to hyperHTML
  const bewitched = new WeakMap$1;

  // better known as hyper.bind(node), the render is
  // the main tag function in charge of fully upgrading
  // or simply updating, contexts used as hyperHTML targets.
  // The `this` context is either a regular DOM node or a fragment.
  function render() {
    const wicked = bewitched.get(this);
    const args = tta.apply(null, arguments);
    if (wicked && wicked.template === args[0]) {
      wicked.tagger.apply(null, args);
    } else {
      upgrade.apply(this, args);
    }
    return this;
  }

  // an upgrade is in charge of collecting template info,
  // parse it once, if unknown, to map all interpolations
  // as single DOM callbacks, relate such template
  // to the current context, and render it after cleaning the context up
  function upgrade(template) {
    const type = OWNER_SVG_ELEMENT in this ? 'svg' : 'html';
    const tagger = new Tagger(type);
    bewitched.set(this, {tagger, template: template});
    this.textContent = '';
    this.appendChild(tagger.apply(null, arguments));
  }

  /*! (c) Andrea Giammarchi (ISC) */

  // all functions are self bound to the right context
  // you can do the following
  // const {bind, wire} = hyperHTML;
  // and use them right away: bind(node)`hello!`;
  const bind = context => render.bind(context);

  // the wire content is the lazy defined
  // html or svg property of each hyper.Component
  setup(content);

  /*jshint browser:true, node:true*/

  var delegate = Delegate;

  /**
   * DOM event delegator
   *
   * The delegator will listen
   * for events that bubble up
   * to the root node.
   *
   * @constructor
   * @param {Node|string} [root] The root node or a selector string matching the root node
   */
  function Delegate(root) {

    /**
     * Maintain a map of listener
     * lists, keyed by event name.
     *
     * @type Object
     */
    this.listenerMap = [{}, {}];
    if (root) {
      this.root(root);
    }

    /** @type function() */
    this.handle = Delegate.prototype.handle.bind(this);
  }

  /**
   * Start listening for events
   * on the provided DOM element
   *
   * @param  {Node|string} [root] The root node or a selector string matching the root node
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.root = function(root) {
    var listenerMap = this.listenerMap;
    var eventType;

    // Remove master event listeners
    if (this.rootElement) {
      for (eventType in listenerMap[1]) {
        if (listenerMap[1].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, true);
        }
      }
      for (eventType in listenerMap[0]) {
        if (listenerMap[0].hasOwnProperty(eventType)) {
          this.rootElement.removeEventListener(eventType, this.handle, false);
        }
      }
    }

    // If no root or root is not
    // a dom node, then remove internal
    // root reference and exit here
    if (!root || !root.addEventListener) {
      if (this.rootElement) {
        delete this.rootElement;
      }
      return this;
    }

    /**
     * The root node at which
     * listeners are attached.
     *
     * @type Node
     */
    this.rootElement = root;

    // Set up master event listeners
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.addEventListener(eventType, this.handle, false);
      }
    }

    return this;
  };

  /**
   * @param {string} eventType
   * @returns boolean
   */
  Delegate.prototype.captureForType = function(eventType) {
    return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
  };

  /**
   * Attach a handler to one
   * event for all elements
   * that match the selector,
   * now or in the future
   *
   * The handler function receives
   * three arguments: the DOM event
   * object, the node that matched
   * the selector while the event
   * was bubbling and a reference
   * to itself. Within the handler,
   * 'this' is equal to the second
   * argument.
   *
   * The node that actually received
   * the event can be accessed via
   * 'event.target'.
   *
   * @param {string} eventType Listen for these events
   * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
   * @param {function()} handler Handler function - event data passed here will be in event.data
   * @param {boolean} [useCapture] see 'useCapture' in <https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener>
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
    var root, listenerMap, matcher, matcherParam;

    if (!eventType) {
      throw new TypeError('Invalid event type: ' + eventType);
    }

    // handler can be passed as
    // the second or third argument
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // Fallback to sensible defaults
    // if useCapture not set
    if (useCapture === undefined) {
      useCapture = this.captureForType(eventType);
    }

    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a type of Function');
    }

    root = this.rootElement;
    listenerMap = this.listenerMap[useCapture ? 1 : 0];

    // Add master handler for type if not created yet
    if (!listenerMap[eventType]) {
      if (root) {
        root.addEventListener(eventType, this.handle, useCapture);
      }
      listenerMap[eventType] = [];
    }

    if (!selector) {
      matcherParam = null;

      // COMPLEX - matchesRoot needs to have access to
      // this.rootElement, so bind the function to this.
      matcher = matchesRoot.bind(this);

    // Compile a matcher for the given selector
    } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = matchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = matches;
    }

    // Add to the list of listeners
    listenerMap[eventType].push({
      selector: selector,
      handler: handler,
      matcher: matcher,
      matcherParam: matcherParam
    });

    return this;
  };

  /**
   * Remove an event handler
   * for elements that match
   * the selector, forever
   *
   * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
   * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
   * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
   * @returns {Delegate} This method is chainable
   */
  Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
    var i, listener, listenerMap, listenerList, singleEventType;

    // Handler can be passed as
    // the second or third argument
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // If useCapture not set, remove
    // all event listeners
    if (useCapture === undefined) {
      this.off(eventType, selector, handler, true);
      this.off(eventType, selector, handler, false);
      return this;
    }

    listenerMap = this.listenerMap[useCapture ? 1 : 0];
    if (!eventType) {
      for (singleEventType in listenerMap) {
        if (listenerMap.hasOwnProperty(singleEventType)) {
          this.off(singleEventType, selector, handler);
        }
      }

      return this;
    }

    listenerList = listenerMap[eventType];
    if (!listenerList || !listenerList.length) {
      return this;
    }

    // Remove only parameter matches
    // if specified
    for (i = listenerList.length - 1; i >= 0; i--) {
      listener = listenerList[i];

      if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
        listenerList.splice(i, 1);
      }
    }

    // All listeners removed
    if (!listenerList.length) {
      delete listenerMap[eventType];

      // Remove the main handler
      if (this.rootElement) {
        this.rootElement.removeEventListener(eventType, this.handle, useCapture);
      }
    }

    return this;
  };


  /**
   * Handle an arbitrary event.
   *
   * @param {Event} event
   */
  Delegate.prototype.handle = function(event) {
    var i, l, type = event.type, root, phase, listener, returned, listenerList = [], target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

    if (event[EVENTIGNORE] === true) {
      return;
    }

    target = event.target;

    // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8
    if (target.nodeType === 3) {
      target = target.parentNode;
    }

    root = this.rootElement;

    phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );
    
    switch (phase) {
      case 1: //Event.CAPTURING_PHASE:
        listenerList = this.listenerMap[1][type];
      break;
      case 2: //Event.AT_TARGET:
        if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
        if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
      break;
      case 3: //Event.BUBBLING_PHASE:
        listenerList = this.listenerMap[0][type];
      break;
    }

    // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.
    l = listenerList.length;
    while (target && l) {
      for (i = 0; i < l; i++) {
        listener = listenerList[i];

        // Bail from this loop if
        // the length changed and
        // no more listeners are
        // defined between i and l.
        if (!listener) {
          break;
        }

        // Check for match and fire
        // the event if there's one
        //
        // TODO:MCG:20120117: Need a way
        // to check if event#stopImmediatePropagation
        // was called. If so, break both loops.
        if (listener.matcher.call(target, listener.matcherParam, target)) {
          returned = this.fire(event, target, listener);
        }

        // Stop propagation to subsequent
        // callbacks if the callback returned
        // false
        if (returned === false) {
          event[EVENTIGNORE] = true;
          event.preventDefault();
          return;
        }
      }

      // TODO:MCG:20120117: Need a way to
      // check if event#stopPropagation
      // was called. If so, break looping
      // through the DOM. Stop if the
      // delegation root has been reached
      if (target === root) {
        break;
      }

      l = listenerList.length;
      target = target.parentElement;
    }
  };

  /**
   * Fire a listener on a target.
   *
   * @param {Event} event
   * @param {Node} target
   * @param {Object} listener
   * @returns {boolean}
   */
  Delegate.prototype.fire = function(event, target, listener) {
    return listener.handler.call(target, event, target);
  };

  /**
   * Check whether an element
   * matches a generic selector.
   *
   * @type function()
   * @param {string} selector A CSS selector
   */
  var matches = (function(el) {
    if (!el) return;
    var p = el.prototype;
    return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
  }(Element));

  /**
   * Check whether an element
   * matches a tag selector.
   *
   * Tags are NOT case-sensitive,
   * except in XML (and XML-based
   * languages such as XHTML).
   *
   * @param {string} tagName The tag name to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesTag(tagName, element) {
    return tagName.toLowerCase() === element.tagName.toLowerCase();
  }

  /**
   * Check whether an element
   * matches the root.
   *
   * @param {?String} selector In this case this is always passed through as null and not used
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesRoot(selector, element) {
    /*jshint validthis:true*/
    if (this.rootElement === window) return element === document;
    return this.rootElement === element;
  }

  /**
   * Check whether the ID of
   * the element in 'this'
   * matches the given ID.
   *
   * IDs are case-sensitive.
   *
   * @param {string} id The ID to test against
   * @param {Element} element The element to test with
   * @returns boolean
   */
  function matchesId(id, element) {
    return id === element.id;
  }

  /**
   * Short hand for off()
   * and root(), ie both
   * with no parameters
   *
   * @return void
   */
  Delegate.prototype.destroy = function() {
    this.off();
    this.root();
  };

  /**
   * @preserve Create and manage a DOM event delegator.
   *
   * @codingstandard ftlabs-jsv2
   * @copyright The Financial Times Limited [All Rights Reserved]
   * @license MIT License (see LICENSE.txt)
   */


  var lib = function(root) {
    return new delegate(root);
  };

  var Delegate_1 = delegate;
  lib.Delegate = Delegate_1;

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css = "trivia-game {\n    font-family: 'Montserrat', sans-serif;\n    font-weight: 200;\n    color: #333;\n    height: 100%;\n    display: block;\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    right: 0;\n    left: 0;\n    padding-left: 10px;\n    padding-right: 10px;\n}\ntrivia-game .trivia-game__title {\n    text-transform: capitalize;\n    font-size: 32px;\n    font-weight: 200;\n    color: rgb(36, 178, 213);\n}\ntrivia-game .trivia-game__score {\n    text-transform: capitalize;\n    font-size: 32px;\n    font-weight: 200;\n    color: rgb(36, 178, 213);\n}\n\n.trivia-game__question-container {\n    display: block;\n    position: absolute;\n    bottom: 0;\n    right: 0;\n    left: 0;\n    padding: 0 10px;\n}\n\ntrivia-game .answer-message {\n    margin-bottom: 300px;\n}\n\ntrivia-game .answer-message p {\n    font-size: 22px;\n    font-family: inherit;\n    font-weight: 700;\n    padding: 20px;\n    text-align: center;\n}\n\ntrivia-game p.is-correct {\n    color: green;\n}\ntrivia-game p.is-incorrect {\n    color: red;\n}\n\ntrivia-game .next-question-button {\n    padding: 18px;\n    width: 100%;\n    background-color: rgb(36, 178, 213);\n    font-size: 18px;\n    font-family: inherit;\n    font-weight: 400;\n    color: white;\n    border: 0;\n}\n\n@media screen and (min-width: 768px) {\n    trivia-game {\n        max-width: 50%;\n    }\n    trivia-game .trivia-game__question-container {\n        position: relative;\n    }\n}";
  styleInject(css);

  var css$1 = "trivia-question {\n    font-family: inherit;\n    color: currentColor;\n    font-size: 18px;\n}\n\ntrivia-question ul,\ntrivia-question li {\n    list-style-type: none;\n    margin: 0;\n    padding: 0;\n}\n\ntrivia-question button {\n    font-family: inherit;\n    font-size: 18px;\n    font-weight: 400;\n    color: white;\n    padding: 20px;\n    background-color: rgb(36, 178, 213);\n    width: 100%;\n    margin-bottom: 30px;\n    border: 0;\n}";
  styleInject(css$1);

  class TriviaQuestion extends HTMLElement {
      static get observedAttributes() { return ['data']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.data = this.data || this.getAttribute('data');
          this.render(this.html);
          this.addEventListeners();
      }

      disconnectedCallback() {
          this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          console.log("attr: ", attr);
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render(this.html);
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          console.log("prop: ", prop);
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render(this.html);
          }
      }

      emitEvent(msg, detail) {
          var event = new CustomEvent(msg, {bubbles: true, detail});
          this.dispatchEvent(event);
      }

      addEventListeners() {
          this.delegateEl = lib(this);
          this.delegateEl.on('click', '.trivia-question__choice', e => {

              if (this.data.status.isAnswered) { return; }

              const choice = parseInt(e.target.getAttribute('data-choice'));
              const isCorrect = choice === this.data.question.answer;
              this.emitEvent('trivia-question:answered', {answerIsCorrect: isCorrect});
          });
      }

      render(html) {
          if (!this.connected) { return '';}
          return html`
            <div class="trivia-question">
                <h2 class="trivia-question">${this.data.question.question}</h2>

                <ul>
                    ${this.data.question.choices.map((choice,idx) => {
                        return `
                            <li>
                                <button
                                    class="trivia-question__choice"
                                    data-choice="${idx}"
                                    type="button"
                                    >
                                    ${choice}
                                </button>
                            </li>
                        `;
                    })}
                </ul>
            </div>
        `;
      }
  }

  customElements.define('trivia-question', TriviaQuestion);

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n.default || n;
  }

  var Observable_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  // === Symbol Support ===

  var hasSymbols = function () {
    return typeof Symbol === 'function';
  };
  var hasSymbol = function (name) {
    return hasSymbols() && Boolean(Symbol[name]);
  };
  var getSymbol = function (name) {
    return hasSymbol(name) ? Symbol[name] : '@@' + name;
  };

  if (hasSymbols() && !hasSymbol('observable')) {
    Symbol.observable = Symbol('observable');
  }

  var SymbolIterator = getSymbol('iterator');
  var SymbolObservable = getSymbol('observable');
  var SymbolSpecies = getSymbol('species');

  // === Abstract Operations ===

  function getMethod(obj, key) {
    var value = obj[key];

    if (value == null) return undefined;

    if (typeof value !== 'function') throw new TypeError(value + ' is not a function');

    return value;
  }

  function getSpecies(obj) {
    var ctor = obj.constructor;
    if (ctor !== undefined) {
      ctor = ctor[SymbolSpecies];
      if (ctor === null) {
        ctor = undefined;
      }
    }
    return ctor !== undefined ? ctor : Observable;
  }

  function isObservable(x) {
    return x instanceof Observable; // SPEC: Brand check
  }

  function hostReportError(e) {
    if (hostReportError.log) {
      hostReportError.log(e);
    } else {
      setTimeout(function () {
        throw e;
      });
    }
  }

  function enqueue(fn) {
    Promise.resolve().then(function () {
      try {
        fn();
      } catch (e) {
        hostReportError(e);
      }
    });
  }

  function cleanupSubscription(subscription) {
    var cleanup = subscription._cleanup;
    if (cleanup === undefined) return;

    subscription._cleanup = undefined;

    if (!cleanup) {
      return;
    }

    try {
      if (typeof cleanup === 'function') {
        cleanup();
      } else {
        var unsubscribe = getMethod(cleanup, 'unsubscribe');
        if (unsubscribe) {
          unsubscribe.call(cleanup);
        }
      }
    } catch (e) {
      hostReportError(e);
    }
  }

  function closeSubscription(subscription) {
    subscription._observer = undefined;
    subscription._queue = undefined;
    subscription._state = 'closed';
  }

  function flushSubscription(subscription) {
    var queue = subscription._queue;
    if (!queue) {
      return;
    }
    subscription._queue = undefined;
    subscription._state = 'ready';
    for (var i = 0; i < queue.length; ++i) {
      notifySubscription(subscription, queue[i].type, queue[i].value);
      if (subscription._state === 'closed') break;
    }
  }

  function notifySubscription(subscription, type, value) {
    subscription._state = 'running';

    var observer = subscription._observer;

    try {
      var m = getMethod(observer, type);
      switch (type) {
        case 'next':
          if (m) m.call(observer, value);
          break;
        case 'error':
          closeSubscription(subscription);
          if (m) m.call(observer, value);else throw value;
          break;
        case 'complete':
          closeSubscription(subscription);
          if (m) m.call(observer);
          break;
      }
    } catch (e) {
      hostReportError(e);
    }

    if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
  }

  function onNotify(subscription, type, value) {
    if (subscription._state === 'closed') return;

    if (subscription._state === 'buffering') {
      subscription._queue.push({ type: type, value: value });
      return;
    }

    if (subscription._state !== 'ready') {
      subscription._state = 'buffering';
      subscription._queue = [{ type: type, value: value }];
      enqueue(function () {
        return flushSubscription(subscription);
      });
      return;
    }

    notifySubscription(subscription, type, value);
  }

  var Subscription = function () {
    function Subscription(observer, subscriber) {
      _classCallCheck(this, Subscription);

      // ASSERT: observer is an object
      // ASSERT: subscriber is callable

      this._cleanup = undefined;
      this._observer = observer;
      this._queue = undefined;
      this._state = 'initializing';

      var subscriptionObserver = new SubscriptionObserver(this);

      try {
        this._cleanup = subscriber.call(undefined, subscriptionObserver);
      } catch (e) {
        subscriptionObserver.error(e);
      }

      if (this._state === 'initializing') this._state = 'ready';
    }

    _createClass(Subscription, [{
      key: 'unsubscribe',
      value: function unsubscribe() {
        if (this._state !== 'closed') {
          closeSubscription(this);
          cleanupSubscription(this);
        }
      }
    }, {
      key: 'closed',
      get: function () {
        return this._state === 'closed';
      }
    }]);

    return Subscription;
  }();

  var SubscriptionObserver = function () {
    function SubscriptionObserver(subscription) {
      _classCallCheck(this, SubscriptionObserver);

      this._subscription = subscription;
    }

    _createClass(SubscriptionObserver, [{
      key: 'next',
      value: function next(value) {
        onNotify(this._subscription, 'next', value);
      }
    }, {
      key: 'error',
      value: function error(value) {
        onNotify(this._subscription, 'error', value);
      }
    }, {
      key: 'complete',
      value: function complete() {
        onNotify(this._subscription, 'complete');
      }
    }, {
      key: 'closed',
      get: function () {
        return this._subscription._state === 'closed';
      }
    }]);

    return SubscriptionObserver;
  }();

  var Observable = exports.Observable = function () {
    function Observable(subscriber) {
      _classCallCheck(this, Observable);

      if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');

      if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');

      this._subscriber = subscriber;
    }

    _createClass(Observable, [{
      key: 'subscribe',
      value: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          observer = {
            next: observer,
            error: arguments[1],
            complete: arguments[2]
          };
        }
        return new Subscription(observer, this._subscriber);
      }
    }, {
      key: 'forEach',
      value: function forEach(fn) {
        var _this = this;

        return new Promise(function (resolve, reject) {
          if (typeof fn !== 'function') {
            reject(new TypeError(fn + ' is not a function'));
            return;
          }

          function done() {
            subscription.unsubscribe();
            resolve();
          }

          var subscription = _this.subscribe({
            next: function (value) {
              try {
                fn(value, done);
              } catch (e) {
                reject(e);
                subscription.unsubscribe();
              }
            },

            error: reject,
            complete: resolve
          });
        });
      }
    }, {
      key: 'map',
      value: function map(fn) {
        var _this2 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          return _this2.subscribe({
            next: function (value) {
              try {
                value = fn(value);
              } catch (e) {
                return observer.error(e);
              }
              observer.next(value);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'filter',
      value: function filter(fn) {
        var _this3 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          return _this3.subscribe({
            next: function (value) {
              try {
                if (!fn(value)) return;
              } catch (e) {
                return observer.error(e);
              }
              observer.next(value);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'reduce',
      value: function reduce(fn) {
        var _this4 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);
        var hasSeed = arguments.length > 1;
        var hasValue = false;
        var seed = arguments[1];
        var acc = seed;

        return new C(function (observer) {
          return _this4.subscribe({
            next: function (value) {
              var first = !hasValue;
              hasValue = true;

              if (!first || hasSeed) {
                try {
                  acc = fn(acc, value);
                } catch (e) {
                  return observer.error(e);
                }
              } else {
                acc = value;
              }
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));

              observer.next(acc);
              observer.complete();
            }
          });
        });
      }
    }, {
      key: 'concat',
      value: function concat() {
        var _this5 = this;

        for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
          sources[_key] = arguments[_key];
        }

        var C = getSpecies(this);

        return new C(function (observer) {
          var subscription = void 0;
          var index = 0;

          function startNext(next) {
            subscription = next.subscribe({
              next: function (v) {
                observer.next(v);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (index === sources.length) {
                  subscription = undefined;
                  observer.complete();
                } else {
                  startNext(C.from(sources[index++]));
                }
              }
            });
          }

          startNext(_this5);

          return function () {
            if (subscription) {
              subscription.unsubscribe();
              subscription = undefined;
            }
          };
        });
      }
    }, {
      key: 'flatMap',
      value: function flatMap(fn) {
        var _this6 = this;

        if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

        var C = getSpecies(this);

        return new C(function (observer) {
          var subscriptions = [];

          var outer = _this6.subscribe({
            next: function (value) {
              if (fn) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }
              }

              var inner = C.from(value).subscribe({
                next: function (value) {
                  observer.next(value);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  var i = subscriptions.indexOf(inner);
                  if (i >= 0) subscriptions.splice(i, 1);
                  completeIfDone();
                }
              });

              subscriptions.push(inner);
            },
            error: function (e) {
              observer.error(e);
            },
            complete: function () {
              completeIfDone();
            }
          });

          function completeIfDone() {
            if (outer.closed && subscriptions.length === 0) observer.complete();
          }

          return function () {
            subscriptions.forEach(function (s) {
              return s.unsubscribe();
            });
            outer.unsubscribe();
          };
        });
      }
    }, {
      key: SymbolObservable,
      value: function () {
        return this;
      }
    }], [{
      key: 'from',
      value: function from(x) {
        var C = typeof this === 'function' ? this : Observable;

        if (x == null) throw new TypeError(x + ' is not an object');

        var method = getMethod(x, SymbolObservable);
        if (method) {
          var observable = method.call(x);

          if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');

          if (isObservable(observable) && observable.constructor === C) return observable;

          return new C(function (observer) {
            return observable.subscribe(observer);
          });
        }

        if (hasSymbol('iterator')) {
          method = getMethod(x, SymbolIterator);
          if (method) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                  for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    observer.next(item);
                    if (observer.closed) return;
                  }
                } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                      _iterator.return();
                    }
                  } finally {
                    if (_didIteratorError) {
                      throw _iteratorError;
                    }
                  }
                }

                observer.complete();
              });
            });
          }
        }

        if (Array.isArray(x)) {
          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;
              for (var i = 0; i < x.length; ++i) {
                observer.next(x[i]);
                if (observer.closed) return;
              }
              observer.complete();
            });
          });
        }

        throw new TypeError(x + ' is not observable');
      }
    }, {
      key: 'of',
      value: function of() {
        for (var _len2 = arguments.length, items = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          items[_key2] = arguments[_key2];
        }

        var C = typeof this === 'function' ? this : Observable;

        return new C(function (observer) {
          enqueue(function () {
            if (observer.closed) return;
            for (var i = 0; i < items.length; ++i) {
              observer.next(items[i]);
              if (observer.closed) return;
            }
            observer.complete();
          });
        });
      }
    }, {
      key: SymbolSpecies,
      get: function () {
        return this;
      }
    }]);

    return Observable;
  }();

  if (hasSymbols()) {
    Object.defineProperty(Observable, Symbol('extensions'), {
      value: {
        symbol: SymbolObservable,
        hostReportError: hostReportError
      },
      configurable: true
    });
  }
  });

  unwrapExports(Observable_1);
  var Observable_2 = Observable_1.Observable;

  var zenObservable = Observable_1.Observable;

  /* tslint:disable */
  var Observable$1 = zenObservable;

  /**
   * Copyright (c) 2018-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  var nodejsCustomInspectSymbol = typeof Symbol === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
  /**
   * Used to print values in error messages.
   */

  function inspect(value) {
    switch (_typeof(value)) {
      case 'string':
        return JSON.stringify(value);

      case 'function':
        return value.name ? "[function ".concat(value.name, "]") : '[function]';

      case 'object':
        if (value) {
          var customInspectFn = getCustomFn(value);

          if (customInspectFn) {
            // $FlowFixMe(>=0.90.0)
            var customValue = customInspectFn.call(value);
            return typeof customValue === 'string' ? customValue : inspect(customValue);
          } else if (Array.isArray(value)) {
            return '[' + value.map(inspect).join(', ') + ']';
          }

          var properties = Object.keys(value).map(function (k) {
            return "".concat(k, ": ").concat(inspect(value[k]));
          }).join(', ');
          return properties ? '{ ' + properties + ' }' : '{}';
        }

        return String(value);

      default:
        return String(value);
    }
  }

  function getCustomFn(object) {
    var customInspectFn = object[String(nodejsCustomInspectSymbol)];

    if (typeof customInspectFn === 'function') {
      return customInspectFn;
    }

    if (typeof object.inspect === 'function') {
      return object.inspect;
    }
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  var QueryDocumentKeys = {
    Name: [],
    Document: ['definitions'],
    OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
    VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
    Variable: ['name'],
    SelectionSet: ['selections'],
    Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
    Argument: ['name', 'value'],
    FragmentSpread: ['name', 'directives'],
    InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
    FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
    // or removed in the future.
    'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
    IntValue: [],
    FloatValue: [],
    StringValue: [],
    BooleanValue: [],
    NullValue: [],
    EnumValue: [],
    ListValue: ['values'],
    ObjectValue: ['fields'],
    ObjectField: ['name', 'value'],
    Directive: ['name', 'arguments'],
    NamedType: ['name'],
    ListType: ['type'],
    NonNullType: ['type'],
    SchemaDefinition: ['directives', 'operationTypes'],
    OperationTypeDefinition: ['type'],
    ScalarTypeDefinition: ['description', 'name', 'directives'],
    ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
    FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
    InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
    InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
    UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
    EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
    EnumValueDefinition: ['description', 'name', 'directives'],
    InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
    DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
    SchemaExtension: ['directives', 'operationTypes'],
    ScalarTypeExtension: ['name', 'directives'],
    ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
    InterfaceTypeExtension: ['name', 'directives', 'fields'],
    UnionTypeExtension: ['name', 'directives', 'types'],
    EnumTypeExtension: ['name', 'directives', 'values'],
    InputObjectTypeExtension: ['name', 'directives', 'fields']
  };
  var BREAK = {};
  /**
   * visit() will walk through an AST using a depth first traversal, calling
   * the visitor's enter function at each node in the traversal, and calling the
   * leave function after visiting that node and all of its child nodes.
   *
   * By returning different values from the enter and leave functions, the
   * behavior of the visitor can be altered, including skipping over a sub-tree of
   * the AST (by returning false), editing the AST by returning a value or null
   * to remove the value, or to stop the whole traversal by returning BREAK.
   *
   * When using visit() to edit an AST, the original AST will not be modified, and
   * a new version of the AST with the changes applied will be returned from the
   * visit function.
   *
   *     const editedAST = visit(ast, {
   *       enter(node, key, parent, path, ancestors) {
   *         // @return
   *         //   undefined: no action
   *         //   false: skip visiting this node
   *         //   visitor.BREAK: stop visiting altogether
   *         //   null: delete this node
   *         //   any value: replace this node with the returned value
   *       },
   *       leave(node, key, parent, path, ancestors) {
   *         // @return
   *         //   undefined: no action
   *         //   false: no action
   *         //   visitor.BREAK: stop visiting altogether
   *         //   null: delete this node
   *         //   any value: replace this node with the returned value
   *       }
   *     });
   *
   * Alternatively to providing enter() and leave() functions, a visitor can
   * instead provide functions named the same as the kinds of AST nodes, or
   * enter/leave visitors at a named key, leading to four permutations of
   * visitor API:
   *
   * 1) Named visitors triggered when entering a node a specific kind.
   *
   *     visit(ast, {
   *       Kind(node) {
   *         // enter the "Kind" node
   *       }
   *     })
   *
   * 2) Named visitors that trigger upon entering and leaving a node of
   *    a specific kind.
   *
   *     visit(ast, {
   *       Kind: {
   *         enter(node) {
   *           // enter the "Kind" node
   *         }
   *         leave(node) {
   *           // leave the "Kind" node
   *         }
   *       }
   *     })
   *
   * 3) Generic visitors that trigger upon entering and leaving any node.
   *
   *     visit(ast, {
   *       enter(node) {
   *         // enter any node
   *       },
   *       leave(node) {
   *         // leave any node
   *       }
   *     })
   *
   * 4) Parallel visitors for entering and leaving nodes of a specific kind.
   *
   *     visit(ast, {
   *       enter: {
   *         Kind(node) {
   *           // enter the "Kind" node
   *         }
   *       },
   *       leave: {
   *         Kind(node) {
   *           // leave the "Kind" node
   *         }
   *       }
   *     })
   */

  function visit(root, visitor) {
    var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

    /* eslint-disable no-undef-init */
    var stack = undefined;
    var inArray = Array.isArray(root);
    var keys = [root];
    var index = -1;
    var edits = [];
    var node = undefined;
    var key = undefined;
    var parent = undefined;
    var path = [];
    var ancestors = [];
    var newRoot = root;
    /* eslint-enable no-undef-init */

    do {
      index++;
      var isLeaving = index === keys.length;
      var isEdited = isLeaving && edits.length !== 0;

      if (isLeaving) {
        key = ancestors.length === 0 ? undefined : path[path.length - 1];
        node = parent;
        parent = ancestors.pop();

        if (isEdited) {
          if (inArray) {
            node = node.slice();
          } else {
            var clone = {};

            var _arr = Object.keys(node);

            for (var _i = 0; _i < _arr.length; _i++) {
              var k = _arr[_i];
              clone[k] = node[k];
            }

            node = clone;
          }

          var editOffset = 0;

          for (var ii = 0; ii < edits.length; ii++) {
            var editKey = edits[ii][0];
            var editValue = edits[ii][1];

            if (inArray) {
              editKey -= editOffset;
            }

            if (inArray && editValue === null) {
              node.splice(editKey, 1);
              editOffset++;
            } else {
              node[editKey] = editValue;
            }
          }
        }

        index = stack.index;
        keys = stack.keys;
        edits = stack.edits;
        inArray = stack.inArray;
        stack = stack.prev;
      } else {
        key = parent ? inArray ? index : keys[index] : undefined;
        node = parent ? parent[key] : newRoot;

        if (node === null || node === undefined) {
          continue;
        }

        if (parent) {
          path.push(key);
        }
      }

      var result = void 0;

      if (!Array.isArray(node)) {
        if (!isNode(node)) {
          throw new Error('Invalid AST Node: ' + inspect(node));
        }

        var visitFn = getVisitFn(visitor, node.kind, isLeaving);

        if (visitFn) {
          result = visitFn.call(visitor, node, key, parent, path, ancestors);

          if (result === BREAK) {
            break;
          }

          if (result === false) {
            if (!isLeaving) {
              path.pop();
              continue;
            }
          } else if (result !== undefined) {
            edits.push([key, result]);

            if (!isLeaving) {
              if (isNode(result)) {
                node = result;
              } else {
                path.pop();
                continue;
              }
            }
          }
        }
      }

      if (result === undefined && isEdited) {
        edits.push([key, node]);
      }

      if (isLeaving) {
        path.pop();
      } else {
        stack = {
          inArray: inArray,
          index: index,
          keys: keys,
          edits: edits,
          prev: stack
        };
        inArray = Array.isArray(node);
        keys = inArray ? node : visitorKeys[node.kind] || [];
        index = -1;
        edits = [];

        if (parent) {
          ancestors.push(parent);
        }

        parent = node;
      }
    } while (stack !== undefined);

    if (edits.length !== 0) {
      newRoot = edits[edits.length - 1][1];
    }

    return newRoot;
  }

  function isNode(maybeNode) {
    return Boolean(maybeNode && typeof maybeNode.kind === 'string');
  }
  /**
   * Given a visitor instance, if it is leaving or not, and a node kind, return
   * the function the visitor runtime should call.
   */

  function getVisitFn(visitor, kind, isLeaving) {
    var kindVisitor = visitor[kind];

    if (kindVisitor) {
      if (!isLeaving && typeof kindVisitor === 'function') {
        // { Kind() {} }
        return kindVisitor;
      }

      var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

      if (typeof kindSpecificVisitor === 'function') {
        // { Kind: { enter() {}, leave() {} } }
        return kindSpecificVisitor;
      }
    } else {
      var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

      if (specificVisitor) {
        if (typeof specificVisitor === 'function') {
          // { enter() {}, leave() {} }
          return specificVisitor;
        }

        var specificKindVisitor = specificVisitor[kind];

        if (typeof specificKindVisitor === 'function') {
          // { enter: { Kind() {} }, leave: { Kind() {} } }
          return specificKindVisitor;
        }
      }
    }
  }

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  var fastJsonStableStringify = function (data, opts) {
      if (!opts) opts = {};
      if (typeof opts === 'function') opts = { cmp: opts };
      var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

      var cmp = opts.cmp && (function (f) {
          return function (node) {
              return function (a, b) {
                  var aobj = { key: a, value: node[a] };
                  var bobj = { key: b, value: node[b] };
                  return f(aobj, bobj);
              };
          };
      })(opts.cmp);

      var seen = [];
      return (function stringify (node) {
          if (node && node.toJSON && typeof node.toJSON === 'function') {
              node = node.toJSON();
          }

          if (node === undefined) return;
          if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
          if (typeof node !== 'object') return JSON.stringify(node);

          var i, out;
          if (Array.isArray(node)) {
              out = '[';
              for (i = 0; i < node.length; i++) {
                  if (i) out += ',';
                  out += stringify(node[i]) || 'null';
              }
              return out + ']';
          }

          if (node === null) return 'null';

          if (seen.indexOf(node) !== -1) {
              if (cycles) return JSON.stringify('__cycle__');
              throw new TypeError('Converting circular structure to JSON');
          }

          var seenIndex = seen.push(node) - 1;
          var keys = Object.keys(node).sort(cmp && cmp(node));
          out = '';
          for (i = 0; i < keys.length; i++) {
              var key = keys[i];
              var value = stringify(node[key]);

              if (!value) continue;
              if (out) out += ',';
              out += JSON.stringify(key) + ':' + value;
          }
          seen.splice(seenIndex, 1);
          return '{' + out + '}';
      })(data);
  };

  function isStringValue(value) {
      return value.kind === 'StringValue';
  }
  function isBooleanValue(value) {
      return value.kind === 'BooleanValue';
  }
  function isIntValue(value) {
      return value.kind === 'IntValue';
  }
  function isFloatValue(value) {
      return value.kind === 'FloatValue';
  }
  function isVariable(value) {
      return value.kind === 'Variable';
  }
  function isObjectValue(value) {
      return value.kind === 'ObjectValue';
  }
  function isListValue(value) {
      return value.kind === 'ListValue';
  }
  function isEnumValue(value) {
      return value.kind === 'EnumValue';
  }
  function isNullValue(value) {
      return value.kind === 'NullValue';
  }
  function valueToObjectRepresentation(argObj, name, value, variables) {
      if (isIntValue(value) || isFloatValue(value)) {
          argObj[name.value] = Number(value.value);
      }
      else if (isBooleanValue(value) || isStringValue(value)) {
          argObj[name.value] = value.value;
      }
      else if (isObjectValue(value)) {
          var nestedArgObj_1 = {};
          value.fields.map(function (obj) {
              return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
          });
          argObj[name.value] = nestedArgObj_1;
      }
      else if (isVariable(value)) {
          var variableValue = (variables || {})[value.name.value];
          argObj[name.value] = variableValue;
      }
      else if (isListValue(value)) {
          argObj[name.value] = value.values.map(function (listValue) {
              var nestedArgArrayObj = {};
              valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
              return nestedArgArrayObj[name.value];
          });
      }
      else if (isEnumValue(value)) {
          argObj[name.value] = value.value;
      }
      else if (isNullValue(value)) {
          argObj[name.value] = null;
      }
      else {
          throw new Error("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\"" +
              'is not supported. Use variables instead of inline arguments to ' +
              'overcome this limitation.');
      }
  }
  function storeKeyNameFromField(field, variables) {
      var directivesObj = null;
      if (field.directives) {
          directivesObj = {};
          field.directives.forEach(function (directive) {
              directivesObj[directive.name.value] = {};
              if (directive.arguments) {
                  directive.arguments.forEach(function (_a) {
                      var name = _a.name, value = _a.value;
                      return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                  });
              }
          });
      }
      var argObj = null;
      if (field.arguments && field.arguments.length) {
          argObj = {};
          field.arguments.forEach(function (_a) {
              var name = _a.name, value = _a.value;
              return valueToObjectRepresentation(argObj, name, value, variables);
          });
      }
      return getStoreKeyName(field.name.value, argObj, directivesObj);
  }
  var KNOWN_DIRECTIVES = [
      'connection',
      'include',
      'skip',
      'client',
      'rest',
      'export',
  ];
  function getStoreKeyName(fieldName, args, directives) {
      if (directives &&
          directives['connection'] &&
          directives['connection']['key']) {
          if (directives['connection']['filter'] &&
              directives['connection']['filter'].length > 0) {
              var filterKeys = directives['connection']['filter']
                  ? directives['connection']['filter']
                  : [];
              filterKeys.sort();
              var queryArgs_1 = args;
              var filteredArgs_1 = {};
              filterKeys.forEach(function (key) {
                  filteredArgs_1[key] = queryArgs_1[key];
              });
              return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
          }
          else {
              return directives['connection']['key'];
          }
      }
      var completeFieldName = fieldName;
      if (args) {
          var stringifiedArgs = fastJsonStableStringify(args);
          completeFieldName += "(" + stringifiedArgs + ")";
      }
      if (directives) {
          Object.keys(directives).forEach(function (key) {
              if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                  return;
              if (directives[key] && Object.keys(directives[key]).length) {
                  completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
              }
              else {
                  completeFieldName += "@" + key;
              }
          });
      }
      return completeFieldName;
  }
  function argumentsObjectFromField(field, variables) {
      if (field.arguments && field.arguments.length) {
          var argObj_1 = {};
          field.arguments.forEach(function (_a) {
              var name = _a.name, value = _a.value;
              return valueToObjectRepresentation(argObj_1, name, value, variables);
          });
          return argObj_1;
      }
      return null;
  }
  function resultKeyNameFromField(field) {
      return field.alias ? field.alias.value : field.name.value;
  }
  function isField(selection) {
      return selection.kind === 'Field';
  }
  function isInlineFragment(selection) {
      return selection.kind === 'InlineFragment';
  }
  function isIdValue(idObject) {
      return idObject &&
          idObject.type === 'id' &&
          typeof idObject.generated === 'boolean';
  }
  function toIdValue(idConfig, generated) {
      if (generated === void 0) { generated = false; }
      return __assign({ type: 'id', generated: generated }, (typeof idConfig === 'string'
          ? { id: idConfig, typename: undefined }
          : idConfig));
  }
  function isJsonValue(jsonObject) {
      return (jsonObject != null &&
          typeof jsonObject === 'object' &&
          jsonObject.type === 'json');
  }

  function getDirectiveInfoFromField(field, variables) {
      if (field.directives && field.directives.length) {
          var directiveObj_1 = {};
          field.directives.forEach(function (directive) {
              directiveObj_1[directive.name.value] = argumentsObjectFromField(directive, variables);
          });
          return directiveObj_1;
      }
      return null;
  }
  function shouldInclude(selection, variables) {
      if (variables === void 0) { variables = {}; }
      if (!selection.directives) {
          return true;
      }
      var res = true;
      selection.directives.forEach(function (directive) {
          if (directive.name.value !== 'skip' && directive.name.value !== 'include') {
              return;
          }
          var directiveArguments = directive.arguments || [];
          var directiveName = directive.name.value;
          if (directiveArguments.length !== 1) {
              throw new Error("Incorrect number of arguments for the @" + directiveName + " directive.");
          }
          var ifArgument = directiveArguments[0];
          if (!ifArgument.name || ifArgument.name.value !== 'if') {
              throw new Error("Invalid argument for the @" + directiveName + " directive.");
          }
          var ifValue = directiveArguments[0].value;
          var evaledValue = false;
          if (!ifValue || ifValue.kind !== 'BooleanValue') {
              if (ifValue.kind !== 'Variable') {
                  throw new Error("Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
              }
              else {
                  evaledValue = variables[ifValue.name.value];
                  if (evaledValue === undefined) {
                      throw new Error("Invalid variable referenced in @" + directiveName + " directive.");
                  }
              }
          }
          else {
              evaledValue = ifValue.value;
          }
          if (directiveName === 'skip') {
              evaledValue = !evaledValue;
          }
          if (!evaledValue) {
              res = false;
          }
      });
      return res;
  }
  function getDirectiveNames(doc) {
      var names = [];
      visit(doc, {
          Directive: function (node) {
              names.push(node.name.value);
          },
      });
      return names;
  }
  function hasDirectives(names, doc) {
      return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
  }

  function getFragmentQueryDocument(document, fragmentName) {
      var actualFragmentName = fragmentName;
      var fragments = [];
      document.definitions.forEach(function (definition) {
          if (definition.kind === 'OperationDefinition') {
              throw new Error("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " +
                  'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
          }
          if (definition.kind === 'FragmentDefinition') {
              fragments.push(definition);
          }
      });
      if (typeof actualFragmentName === 'undefined') {
          if (fragments.length !== 1) {
              throw new Error("Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
          }
          actualFragmentName = fragments[0].name.value;
      }
      var query = __assign({}, document, { definitions: [
              {
                  kind: 'OperationDefinition',
                  operation: 'query',
                  selectionSet: {
                      kind: 'SelectionSet',
                      selections: [
                          {
                              kind: 'FragmentSpread',
                              name: {
                                  kind: 'Name',
                                  value: actualFragmentName,
                              },
                          },
                      ],
                  },
              }
          ].concat(document.definitions) });
      return query;
  }

  function assign(target) {
      var sources = [];
      for (var _i = 1; _i < arguments.length; _i++) {
          sources[_i - 1] = arguments[_i];
      }
      sources.forEach(function (source) {
          if (typeof source === 'undefined' || source === null) {
              return;
          }
          Object.keys(source).forEach(function (key) {
              target[key] = source[key];
          });
      });
      return target;
  }

  function getMutationDefinition(doc) {
      checkDocument(doc);
      var mutationDef = doc.definitions.filter(function (definition) {
          return definition.kind === 'OperationDefinition' &&
              definition.operation === 'mutation';
      })[0];
      if (!mutationDef) {
          throw new Error('Must contain a mutation definition.');
      }
      return mutationDef;
  }
  function checkDocument(doc) {
      if (doc.kind !== 'Document') {
          throw new Error("Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
      }
      var operations = doc.definitions
          .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
          .map(function (definition) {
          if (definition.kind !== 'OperationDefinition') {
              throw new Error("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
          }
          return definition;
      });
      if (operations.length > 1) {
          throw new Error("Ambiguous GraphQL document: contains " + operations.length + " operations");
      }
      return doc;
  }
  function getOperationDefinition(doc) {
      checkDocument(doc);
      return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
  }
  function getOperationDefinitionOrDie(document) {
      var def = getOperationDefinition(document);
      if (!def) {
          throw new Error("GraphQL document is missing an operation");
      }
      return def;
  }
  function getOperationName(doc) {
      return (doc.definitions
          .filter(function (definition) {
          return definition.kind === 'OperationDefinition' && definition.name;
      })
          .map(function (x) { return x.name.value; })[0] || null);
  }
  function getFragmentDefinitions(doc) {
      return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
  }
  function getQueryDefinition(doc) {
      var queryDef = getOperationDefinition(doc);
      if (!queryDef || queryDef.operation !== 'query') {
          throw new Error('Must contain a query definition.');
      }
      return queryDef;
  }
  function getMainDefinition(queryDoc) {
      checkDocument(queryDoc);
      var fragmentDefinition;
      for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
          var definition = _a[_i];
          if (definition.kind === 'OperationDefinition') {
              var operation = definition.operation;
              if (operation === 'query' ||
                  operation === 'mutation' ||
                  operation === 'subscription') {
                  return definition;
              }
          }
          if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
              fragmentDefinition = definition;
          }
      }
      if (fragmentDefinition) {
          return fragmentDefinition;
      }
      throw new Error('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
  }
  function createFragmentMap(fragments) {
      if (fragments === void 0) { fragments = []; }
      var symTable = {};
      fragments.forEach(function (fragment) {
          symTable[fragment.name.value] = fragment;
      });
      return symTable;
  }
  function getDefaultValues(definition) {
      if (definition &&
          definition.variableDefinitions &&
          definition.variableDefinitions.length) {
          var defaultValues = definition.variableDefinitions
              .filter(function (_a) {
              var defaultValue = _a.defaultValue;
              return defaultValue;
          })
              .map(function (_a) {
              var variable = _a.variable, defaultValue = _a.defaultValue;
              var defaultValueObj = {};
              valueToObjectRepresentation(defaultValueObj, variable.name, defaultValue);
              return defaultValueObj;
          });
          return assign.apply(void 0, [{}].concat(defaultValues));
      }
      return {};
  }

  function filterInPlace(array, test, context) {
      var target = 0;
      array.forEach(function (elem, i) {
          if (test.call(this, elem, i, array)) {
              array[target++] = elem;
          }
      }, context);
      array.length = target;
      return array;
  }

  var TYPENAME_FIELD = {
      kind: 'Field',
      name: {
          kind: 'Name',
          value: '__typename',
      },
  };
  function isEmpty(op, fragments) {
      return op.selectionSet.selections.every(function (selection) {
          return selection.kind === 'FragmentSpread' &&
              isEmpty(fragments[selection.name.value], fragments);
      });
  }
  function nullIfDocIsEmpty(doc) {
      return isEmpty(getOperationDefinitionOrDie(doc), createFragmentMap(getFragmentDefinitions(doc))) ? null : doc;
  }
  function getDirectiveMatcher(directives) {
      return function directiveMatcher(directive) {
          return directives.some(function (dir) {
              return (dir.name && dir.name === directive.name.value) ||
                  (dir.test && dir.test(directive));
          });
      };
  }
  function removeDirectivesFromDocument(directives, doc) {
      var variablesInUse = Object.create(null);
      var variablesToRemove = [];
      var fragmentSpreadsInUse = Object.create(null);
      var fragmentSpreadsToRemove = [];
      var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
          Variable: {
              enter: function (node, _key, parent) {
                  if (parent.kind !== 'VariableDefinition') {
                      variablesInUse[node.name.value] = true;
                  }
              },
          },
          Field: {
              enter: function (node) {
                  var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                  if (shouldRemoveField &&
                      node.directives &&
                      node.directives.some(getDirectiveMatcher(directives))) {
                      if (node.arguments) {
                          node.arguments.forEach(function (arg) {
                              if (arg.value.kind === 'Variable') {
                                  variablesToRemove.push({
                                      name: arg.value.name.value,
                                  });
                              }
                          });
                      }
                      if (node.selectionSet) {
                          getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                              fragmentSpreadsToRemove.push({
                                  name: frag.name.value,
                              });
                          });
                      }
                      return null;
                  }
              },
          },
          FragmentSpread: {
              enter: function (node) {
                  fragmentSpreadsInUse[node.name.value] = true;
              },
          },
          Directive: {
              enter: function (node) {
                  if (getDirectiveMatcher(directives)(node)) {
                      return null;
                  }
              },
          },
      }));
      if (modifiedDoc &&
          filterInPlace(variablesToRemove, function (v) { return !variablesInUse[v.name]; }).length) {
          modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
      }
      if (modifiedDoc &&
          filterInPlace(fragmentSpreadsToRemove, function (fs) { return !fragmentSpreadsInUse[fs.name]; }).length) {
          modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
      }
      return modifiedDoc;
  }
  function addTypenameToDocument(doc) {
      return visit(checkDocument(doc), {
          SelectionSet: {
              enter: function (node, _key, parent) {
                  if (parent &&
                      parent.kind === 'OperationDefinition') {
                      return;
                  }
                  var selections = node.selections;
                  if (!selections) {
                      return;
                  }
                  var skip = selections.some(function (selection) {
                      return (selection.kind === 'Field' &&
                          (selection.name.value === '__typename' ||
                              selection.name.value.lastIndexOf('__', 0) === 0));
                  });
                  if (skip) {
                      return;
                  }
                  return __assign({}, node, { selections: selections.concat([TYPENAME_FIELD]) });
              },
          },
      });
  }
  var connectionRemoveConfig = {
      test: function (directive) {
          var willRemove = directive.name.value === 'connection';
          if (willRemove) {
              if (!directive.arguments ||
                  !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                  console.warn('Removing an @connection directive even though it does not have a key. ' +
                      'You may want to use the key parameter to specify a store key.');
              }
          }
          return willRemove;
      },
  };
  function removeConnectionDirectiveFromDocument(doc) {
      return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
  }
  function getArgumentMatcher(config) {
      return function argumentMatcher(argument) {
          return config.some(function (aConfig) {
              return argument.value &&
                  argument.value.kind === 'Variable' &&
                  argument.value.name &&
                  (aConfig.name === argument.value.name.value ||
                      (aConfig.test && aConfig.test(argument)));
          });
      };
  }
  function removeArgumentsFromDocument(config, doc) {
      var argMatcher = getArgumentMatcher(config);
      return nullIfDocIsEmpty(visit(doc, {
          OperationDefinition: {
              enter: function (node) {
                  return __assign({}, node, { variableDefinitions: node.variableDefinitions.filter(function (varDef) { return !config.some(function (arg) { return arg.name === varDef.variable.name.value; }); }) });
              },
          },
          Field: {
              enter: function (node) {
                  var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                  if (shouldRemoveField) {
                      var argMatchCount_1 = 0;
                      node.arguments.forEach(function (arg) {
                          if (argMatcher(arg)) {
                              argMatchCount_1 += 1;
                          }
                      });
                      if (argMatchCount_1 === 1) {
                          return null;
                      }
                  }
              },
          },
          Argument: {
              enter: function (node) {
                  if (argMatcher(node)) {
                      return null;
                  }
              },
          },
      }));
  }
  function removeFragmentSpreadFromDocument(config, doc) {
      function enter(node) {
          if (config.some(function (def) { return def.name === node.name.value; })) {
              return null;
          }
      }
      return nullIfDocIsEmpty(visit(doc, {
          FragmentSpread: { enter: enter },
          FragmentDefinition: { enter: enter },
      }));
  }
  function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
      var allFragments = [];
      selectionSet.selections.forEach(function (selection) {
          if ((selection.kind === 'Field' ||
              selection.kind === 'InlineFragment') &&
              selection.selectionSet) {
              getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
          }
          else if (selection.kind === 'FragmentSpread') {
              allFragments.push(selection);
          }
      });
      return allFragments;
  }

  var toString = Object.prototype.toString;
  function cloneDeep(value) {
      return cloneDeepHelper(value, new Map());
  }
  function cloneDeepHelper(val, seen) {
      switch (toString.call(val)) {
          case "[object Array]": {
              if (seen.has(val))
                  return seen.get(val);
              var copy_1 = val.slice(0);
              seen.set(val, copy_1);
              copy_1.forEach(function (child, i) {
                  copy_1[i] = cloneDeepHelper(child, seen);
              });
              return copy_1;
          }
          case "[object Object]": {
              if (seen.has(val))
                  return seen.get(val);
              var copy_2 = Object.create(Object.getPrototypeOf(val));
              seen.set(val, copy_2);
              Object.keys(val).forEach(function (key) {
                  copy_2[key] = cloneDeepHelper(val[key], seen);
              });
              return copy_2;
          }
          default:
              return val;
      }
  }

  function getEnv() {
      if (typeof process !== 'undefined' && process.env.NODE_ENV) {
          return process.env.NODE_ENV;
      }
      return 'development';
  }
  function isEnv(env) {
      return getEnv() === env;
  }
  function isProduction() {
      return isEnv('production') === true;
  }
  function isTest() {
      return isEnv('test') === true;
  }

  function tryFunctionOrLogError(f) {
      try {
          return f();
      }
      catch (e) {
          if (console.error) {
              console.error(e);
          }
      }
  }
  function graphQLResultHasError(result) {
      return result.errors && result.errors.length;
  }

  function isEqual(a, b) {
      if (a === b) {
          return true;
      }
      if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime();
      }
      if (a != null &&
          typeof a === 'object' &&
          b != null &&
          typeof b === 'object') {
          for (var key in a) {
              if (Object.prototype.hasOwnProperty.call(a, key)) {
                  if (!Object.prototype.hasOwnProperty.call(b, key)) {
                      return false;
                  }
                  if (!isEqual(a[key], b[key])) {
                      return false;
                  }
              }
          }
          for (var key in b) {
              if (Object.prototype.hasOwnProperty.call(b, key) &&
                  !Object.prototype.hasOwnProperty.call(a, key)) {
                  return false;
              }
          }
          return true;
      }
      return false;
  }

  var haveWarned = Object.create({});
  function warnOnceInDevelopment(msg, type) {
      if (type === void 0) { type = 'warn'; }
      if (isProduction()) {
          return;
      }
      if (!haveWarned[msg]) {
          if (!isTest()) {
              haveWarned[msg] = true;
          }
          switch (type) {
              case 'error':
                  console.error(msg);
                  break;
              default:
                  console.warn(msg);
          }
      }
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Converts an AST into a string, using one set of reasonable
   * formatting rules.
   */

  function print(ast) {
    return visit(ast, {
      leave: printDocASTReducer
    });
  }
  var printDocASTReducer = {
    Name: function Name(node) {
      return node.value;
    },
    Variable: function Variable(node) {
      return '$' + node.name;
    },
    // Document
    Document: function Document(node) {
      return join(node.definitions, '\n\n') + '\n';
    },
    OperationDefinition: function OperationDefinition(node) {
      var op = node.operation;
      var name = node.name;
      var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
      var directives = join(node.directives, ' ');
      var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
      // the query short form.

      return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
    },
    VariableDefinition: function VariableDefinition(_ref) {
      var variable = _ref.variable,
          type = _ref.type,
          defaultValue = _ref.defaultValue,
          directives = _ref.directives;
      return variable + ': ' + type + wrap(' = ', defaultValue) + wrap(' ', join(directives, ' '));
    },
    SelectionSet: function SelectionSet(_ref2) {
      var selections = _ref2.selections;
      return block(selections);
    },
    Field: function Field(_ref3) {
      var alias = _ref3.alias,
          name = _ref3.name,
          args = _ref3.arguments,
          directives = _ref3.directives,
          selectionSet = _ref3.selectionSet;
      return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
    },
    Argument: function Argument(_ref4) {
      var name = _ref4.name,
          value = _ref4.value;
      return name + ': ' + value;
    },
    // Fragments
    FragmentSpread: function FragmentSpread(_ref5) {
      var name = _ref5.name,
          directives = _ref5.directives;
      return '...' + name + wrap(' ', join(directives, ' '));
    },
    InlineFragment: function InlineFragment(_ref6) {
      var typeCondition = _ref6.typeCondition,
          directives = _ref6.directives,
          selectionSet = _ref6.selectionSet;
      return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
    },
    FragmentDefinition: function FragmentDefinition(_ref7) {
      var name = _ref7.name,
          typeCondition = _ref7.typeCondition,
          variableDefinitions = _ref7.variableDefinitions,
          directives = _ref7.directives,
          selectionSet = _ref7.selectionSet;
      return (// Note: fragment variable definitions are experimental and may be changed
        // or removed in the future.
        "fragment ".concat(name).concat(wrap('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap('', join(directives, ' '), ' ')) + selectionSet
      );
    },
    // Value
    IntValue: function IntValue(_ref8) {
      var value = _ref8.value;
      return value;
    },
    FloatValue: function FloatValue(_ref9) {
      var value = _ref9.value;
      return value;
    },
    StringValue: function StringValue(_ref10, key) {
      var value = _ref10.value,
          isBlockString = _ref10.block;
      return isBlockString ? printBlockString(value, key === 'description') : JSON.stringify(value);
    },
    BooleanValue: function BooleanValue(_ref11) {
      var value = _ref11.value;
      return value ? 'true' : 'false';
    },
    NullValue: function NullValue() {
      return 'null';
    },
    EnumValue: function EnumValue(_ref12) {
      var value = _ref12.value;
      return value;
    },
    ListValue: function ListValue(_ref13) {
      var values = _ref13.values;
      return '[' + join(values, ', ') + ']';
    },
    ObjectValue: function ObjectValue(_ref14) {
      var fields = _ref14.fields;
      return '{' + join(fields, ', ') + '}';
    },
    ObjectField: function ObjectField(_ref15) {
      var name = _ref15.name,
          value = _ref15.value;
      return name + ': ' + value;
    },
    // Directive
    Directive: function Directive(_ref16) {
      var name = _ref16.name,
          args = _ref16.arguments;
      return '@' + name + wrap('(', join(args, ', '), ')');
    },
    // Type
    NamedType: function NamedType(_ref17) {
      var name = _ref17.name;
      return name;
    },
    ListType: function ListType(_ref18) {
      var type = _ref18.type;
      return '[' + type + ']';
    },
    NonNullType: function NonNullType(_ref19) {
      var type = _ref19.type;
      return type + '!';
    },
    // Type System Definitions
    SchemaDefinition: function SchemaDefinition(_ref20) {
      var directives = _ref20.directives,
          operationTypes = _ref20.operationTypes;
      return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
    },
    OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
      var operation = _ref21.operation,
          type = _ref21.type;
      return operation + ': ' + type;
    },
    ScalarTypeDefinition: addDescription(function (_ref22) {
      var name = _ref22.name,
          directives = _ref22.directives;
      return join(['scalar', name, join(directives, ' ')], ' ');
    }),
    ObjectTypeDefinition: addDescription(function (_ref23) {
      var name = _ref23.name,
          interfaces = _ref23.interfaces,
          directives = _ref23.directives,
          fields = _ref23.fields;
      return join(['type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
    }),
    FieldDefinition: addDescription(function (_ref24) {
      var name = _ref24.name,
          args = _ref24.arguments,
          type = _ref24.type,
          directives = _ref24.directives;
      return name + (hasMultilineItems(args) ? wrap('(\n', indent(join(args, '\n')), '\n)') : wrap('(', join(args, ', '), ')')) + ': ' + type + wrap(' ', join(directives, ' '));
    }),
    InputValueDefinition: addDescription(function (_ref25) {
      var name = _ref25.name,
          type = _ref25.type,
          defaultValue = _ref25.defaultValue,
          directives = _ref25.directives;
      return join([name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')], ' ');
    }),
    InterfaceTypeDefinition: addDescription(function (_ref26) {
      var name = _ref26.name,
          directives = _ref26.directives,
          fields = _ref26.fields;
      return join(['interface', name, join(directives, ' '), block(fields)], ' ');
    }),
    UnionTypeDefinition: addDescription(function (_ref27) {
      var name = _ref27.name,
          directives = _ref27.directives,
          types = _ref27.types;
      return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
    }),
    EnumTypeDefinition: addDescription(function (_ref28) {
      var name = _ref28.name,
          directives = _ref28.directives,
          values = _ref28.values;
      return join(['enum', name, join(directives, ' '), block(values)], ' ');
    }),
    EnumValueDefinition: addDescription(function (_ref29) {
      var name = _ref29.name,
          directives = _ref29.directives;
      return join([name, join(directives, ' ')], ' ');
    }),
    InputObjectTypeDefinition: addDescription(function (_ref30) {
      var name = _ref30.name,
          directives = _ref30.directives,
          fields = _ref30.fields;
      return join(['input', name, join(directives, ' '), block(fields)], ' ');
    }),
    DirectiveDefinition: addDescription(function (_ref31) {
      var name = _ref31.name,
          args = _ref31.arguments,
          locations = _ref31.locations;
      return 'directive @' + name + (hasMultilineItems(args) ? wrap('(\n', indent(join(args, '\n')), '\n)') : wrap('(', join(args, ', '), ')')) + ' on ' + join(locations, ' | ');
    }),
    SchemaExtension: function SchemaExtension(_ref32) {
      var directives = _ref32.directives,
          operationTypes = _ref32.operationTypes;
      return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
    },
    ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
      var name = _ref33.name,
          directives = _ref33.directives;
      return join(['extend scalar', name, join(directives, ' ')], ' ');
    },
    ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
      var name = _ref34.name,
          interfaces = _ref34.interfaces,
          directives = _ref34.directives,
          fields = _ref34.fields;
      return join(['extend type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
    },
    InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
      var name = _ref35.name,
          directives = _ref35.directives,
          fields = _ref35.fields;
      return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
    },
    UnionTypeExtension: function UnionTypeExtension(_ref36) {
      var name = _ref36.name,
          directives = _ref36.directives,
          types = _ref36.types;
      return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
    },
    EnumTypeExtension: function EnumTypeExtension(_ref37) {
      var name = _ref37.name,
          directives = _ref37.directives,
          values = _ref37.values;
      return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
    },
    InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
      var name = _ref38.name,
          directives = _ref38.directives,
          fields = _ref38.fields;
      return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
    }
  };

  function addDescription(cb) {
    return function (node) {
      return join([node.description, cb(node)], '\n');
    };
  }
  /**
   * Given maybeArray, print an empty string if it is null or empty, otherwise
   * print all items together separated by separator if provided
   */


  function join(maybeArray, separator) {
    return maybeArray ? maybeArray.filter(function (x) {
      return x;
    }).join(separator || '') : '';
  }
  /**
   * Given array, print each item on its own line, wrapped in an
   * indented "{ }" block.
   */


  function block(array) {
    return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
  }
  /**
   * If maybeString is not null or empty, then wrap with start and end, otherwise
   * print an empty string.
   */


  function wrap(start, maybeString, end) {
    return maybeString ? start + maybeString + (end || '') : '';
  }

  function indent(maybeString) {
    return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
  }

  function isMultiline(string) {
    return string.indexOf('\n') !== -1;
  }

  function hasMultilineItems(maybeArray) {
    return maybeArray && maybeArray.some(isMultiline);
  }
  /**
   * Print a block string in the indented block form by adding a leading and
   * trailing blank line. However, if a block string starts with whitespace and is
   * a single-line, adding a leading blank line would strip that whitespace.
   */


  function printBlockString(value, isDescription) {
    var escaped = value.replace(/"""/g, '\\"""');
    return isMultiline(value) || value[0] !== ' ' && value[0] !== '\t' ? "\"\"\"\n".concat(isDescription ? escaped : indent(escaped), "\n\"\"\"") : "\"\"\"".concat(escaped.replace(/"$/, '"\n'), "\"\"\"");
  }

  var __extends$1 = (undefined && undefined.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  var __assign$1 = (undefined && undefined.__assign) || function () {
      __assign$1 = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign$1.apply(this, arguments);
  };
  function validateOperation(operation) {
      var OPERATION_FIELDS = [
          'query',
          'operationName',
          'variables',
          'extensions',
          'context',
      ];
      for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
          var key = _a[_i];
          if (OPERATION_FIELDS.indexOf(key) < 0) {
              throw new Error("illegal argument: " + key);
          }
      }
      return operation;
  }
  var LinkError = /** @class */ (function (_super) {
      __extends$1(LinkError, _super);
      function LinkError(message, link) {
          var _this = _super.call(this, message) || this;
          _this.link = link;
          return _this;
      }
      return LinkError;
  }(Error));
  function isTerminating(link) {
      return link.request.length <= 1;
  }
  function fromError(errorValue) {
      return new Observable$1(function (observer) {
          observer.error(errorValue);
      });
  }
  function transformOperation(operation) {
      var transformedOperation = {
          variables: operation.variables || {},
          extensions: operation.extensions || {},
          operationName: operation.operationName,
          query: operation.query,
      };
      // best guess at an operation name
      if (!transformedOperation.operationName) {
          transformedOperation.operationName =
              typeof transformedOperation.query !== 'string'
                  ? getOperationName(transformedOperation.query)
                  : '';
      }
      return transformedOperation;
  }
  function createOperation(starting, operation) {
      var context = __assign$1({}, starting);
      var setContext = function (next) {
          if (typeof next === 'function') {
              context = __assign$1({}, context, next(context));
          }
          else {
              context = __assign$1({}, context, next);
          }
      };
      var getContext = function () { return (__assign$1({}, context)); };
      Object.defineProperty(operation, 'setContext', {
          enumerable: false,
          value: setContext,
      });
      Object.defineProperty(operation, 'getContext', {
          enumerable: false,
          value: getContext,
      });
      Object.defineProperty(operation, 'toKey', {
          enumerable: false,
          value: function () { return getKey(operation); },
      });
      return operation;
  }
  function getKey(operation) {
      // XXX we're assuming here that variables will be serialized in the same order.
      // that might not always be true
      return print(operation.query) + "|" + JSON.stringify(operation.variables) + "|" + operation.operationName;
  }

  var passthrough = function (op, forward) { return (forward ? forward(op) : Observable$1.of()); };
  var toLink = function (handler) {
      return typeof handler === 'function' ? new ApolloLink(handler) : handler;
  };
  var empty = function () {
      return new ApolloLink(function (op, forward) { return Observable$1.of(); });
  };
  var from = function (links) {
      if (links.length === 0)
          return empty();
      return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
  };
  var split = function (test, left, right) {
      if (right === void 0) { right = new ApolloLink(passthrough); }
      var leftLink = toLink(left);
      var rightLink = toLink(right);
      if (isTerminating(leftLink) && isTerminating(rightLink)) {
          return new ApolloLink(function (operation) {
              return test(operation)
                  ? leftLink.request(operation) || Observable$1.of()
                  : rightLink.request(operation) || Observable$1.of();
          });
      }
      else {
          return new ApolloLink(function (operation, forward) {
              return test(operation)
                  ? leftLink.request(operation, forward) || Observable$1.of()
                  : rightLink.request(operation, forward) || Observable$1.of();
          });
      }
  };
  // join two Links together
  var concat = function (first, second) {
      var firstLink = toLink(first);
      if (isTerminating(firstLink)) {
          console.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
          return firstLink;
      }
      var nextLink = toLink(second);
      if (isTerminating(nextLink)) {
          return new ApolloLink(function (operation) {
              return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable$1.of(); }) || Observable$1.of();
          });
      }
      else {
          return new ApolloLink(function (operation, forward) {
              return (firstLink.request(operation, function (op) {
                  return nextLink.request(op, forward) || Observable$1.of();
              }) || Observable$1.of());
          });
      }
  };
  var ApolloLink = /** @class */ (function () {
      function ApolloLink(request) {
          if (request)
              this.request = request;
      }
      ApolloLink.prototype.split = function (test, left, right) {
          if (right === void 0) { right = new ApolloLink(passthrough); }
          return this.concat(split(test, left, right));
      };
      ApolloLink.prototype.concat = function (next) {
          return concat(this, next);
      };
      ApolloLink.prototype.request = function (operation, forward) {
          throw new Error('request is not implemented');
      };
      ApolloLink.empty = empty;
      ApolloLink.from = from;
      ApolloLink.split = split;
      ApolloLink.execute = execute;
      return ApolloLink;
  }());
  function execute(link, operation) {
      return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable$1.of());
  }

  var NetworkStatus;
  (function (NetworkStatus) {
      NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
      NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
      NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
      NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
      NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
      NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
      NetworkStatus[NetworkStatus["error"] = 8] = "error";
  })(NetworkStatus || (NetworkStatus = {}));
  function isNetworkRequestInFlight(networkStatus) {
      return networkStatus < 7;
  }

  function symbolObservablePonyfill(root) {
  	var result;
  	var Symbol = root.Symbol;

  	if (typeof Symbol === 'function') {
  		if (Symbol.observable) {
  			result = Symbol.observable;
  		} else {
  			result = Symbol('observable');
  			Symbol.observable = result;
  		}
  	} else {
  		result = '@@observable';
  	}

  	return result;
  }

  /* global window */

  var root;

  if (typeof self !== 'undefined') {
    root = self;
  } else if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof global !== 'undefined') {
    root = global;
  } else if (typeof module !== 'undefined') {
    root = module;
  } else {
    root = Function('return this')();
  }

  var result = symbolObservablePonyfill(root);

  var Observable$2 = (function (_super) {
      __extends(Observable$$1, _super);
      function Observable$$1() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      Observable$$1.prototype[result] = function () {
          return this;
      };
      Observable$$1.prototype['@@observable'] = function () {
          return this;
      };
      return Observable$$1;
  }(Observable$1));

  function isApolloError(err) {
      return err.hasOwnProperty('graphQLErrors');
  }
  var generateErrorMessage = function (err) {
      var message = '';
      if (Array.isArray(err.graphQLErrors) && err.graphQLErrors.length !== 0) {
          err.graphQLErrors.forEach(function (graphQLError) {
              var errorMessage = graphQLError
                  ? graphQLError.message
                  : 'Error message not found.';
              message += "GraphQL error: " + errorMessage + "\n";
          });
      }
      if (err.networkError) {
          message += 'Network error: ' + err.networkError.message + '\n';
      }
      message = message.replace(/\n$/, '');
      return message;
  };
  var ApolloError = (function (_super) {
      __extends(ApolloError, _super);
      function ApolloError(_a) {
          var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
          var _this = _super.call(this, errorMessage) || this;
          _this.graphQLErrors = graphQLErrors || [];
          _this.networkError = networkError || null;
          if (!errorMessage) {
              _this.message = generateErrorMessage(_this);
          }
          else {
              _this.message = errorMessage;
          }
          _this.extraInfo = extraInfo;
          _this.__proto__ = ApolloError.prototype;
          return _this;
      }
      return ApolloError;
  }(Error));

  var FetchType;
  (function (FetchType) {
      FetchType[FetchType["normal"] = 1] = "normal";
      FetchType[FetchType["refetch"] = 2] = "refetch";
      FetchType[FetchType["poll"] = 3] = "poll";
  })(FetchType || (FetchType = {}));

  var hasError = function (storeValue, policy) {
      if (policy === void 0) { policy = 'none'; }
      return storeValue &&
          ((storeValue.graphQLErrors &&
              storeValue.graphQLErrors.length > 0 &&
              policy === 'none') ||
              storeValue.networkError);
  };
  var ObservableQuery = (function (_super) {
      __extends(ObservableQuery, _super);
      function ObservableQuery(_a) {
          var scheduler = _a.scheduler, options = _a.options, _b = _a.shouldSubscribe, shouldSubscribe = _b === void 0 ? true : _b;
          var _this = _super.call(this, function (observer) {
              return _this.onSubscribe(observer);
          }) || this;
          _this.isCurrentlyPolling = false;
          _this.isTornDown = false;
          _this.options = options;
          _this.variables = options.variables || {};
          _this.queryId = scheduler.queryManager.generateQueryId();
          _this.shouldSubscribe = shouldSubscribe;
          _this.scheduler = scheduler;
          _this.queryManager = scheduler.queryManager;
          _this.observers = [];
          _this.subscriptionHandles = [];
          return _this;
      }
      ObservableQuery.prototype.result = function () {
          var that = this;
          return new Promise(function (resolve, reject) {
              var subscription;
              var observer = {
                  next: function (result) {
                      resolve(result);
                      if (!that.observers.some(function (obs) { return obs !== observer; })) {
                          that.queryManager.removeQuery(that.queryId);
                      }
                      setTimeout(function () {
                          subscription.unsubscribe();
                      }, 0);
                  },
                  error: function (error) {
                      reject(error);
                  },
              };
              subscription = that.subscribe(observer);
          });
      };
      ObservableQuery.prototype.currentResult = function () {
          if (this.isTornDown) {
              return {
                  data: this.lastError ? {} : this.lastResult ? this.lastResult.data : {},
                  error: this.lastError,
                  loading: false,
                  networkStatus: NetworkStatus.error,
              };
          }
          var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
          if (hasError(queryStoreValue, this.options.errorPolicy)) {
              return {
                  data: {},
                  loading: false,
                  networkStatus: queryStoreValue.networkStatus,
                  error: new ApolloError({
                      graphQLErrors: queryStoreValue.graphQLErrors,
                      networkError: queryStoreValue.networkError,
                  }),
              };
          }
          var _a = this.queryManager.getCurrentQueryResult(this), data = _a.data, partial = _a.partial;
          var queryLoading = !queryStoreValue ||
              queryStoreValue.networkStatus === NetworkStatus.loading;
          var loading = (this.options.fetchPolicy === 'network-only' && queryLoading) ||
              (partial && this.options.fetchPolicy !== 'cache-only');
          var networkStatus;
          if (queryStoreValue) {
              networkStatus = queryStoreValue.networkStatus;
          }
          else {
              networkStatus = loading ? NetworkStatus.loading : NetworkStatus.ready;
          }
          var result = {
              data: data,
              loading: isNetworkRequestInFlight(networkStatus),
              networkStatus: networkStatus,
          };
          if (queryStoreValue &&
              queryStoreValue.graphQLErrors &&
              this.options.errorPolicy === 'all') {
              result.errors = queryStoreValue.graphQLErrors;
          }
          if (!partial) {
              this.lastResult = __assign({}, result, { stale: false });
              this.lastResultSnapshot = cloneDeep(this.lastResult);
          }
          return __assign({}, result, { partial: partial });
      };
      ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
          var snapshot = this.lastResultSnapshot;
          return !(snapshot &&
              newResult &&
              snapshot.networkStatus === newResult.networkStatus &&
              snapshot.stale === newResult.stale &&
              isEqual(snapshot.data, newResult.data));
      };
      ObservableQuery.prototype.getLastResult = function () {
          return this.lastResult;
      };
      ObservableQuery.prototype.getLastError = function () {
          return this.lastError;
      };
      ObservableQuery.prototype.resetLastResults = function () {
          delete this.lastResult;
          delete this.lastResultSnapshot;
          delete this.lastError;
          this.isTornDown = false;
      };
      ObservableQuery.prototype.refetch = function (variables) {
          var fetchPolicy = this.options.fetchPolicy;
          if (fetchPolicy === 'cache-only') {
              return Promise.reject(new Error('cache-only fetchPolicy option should not be used together with query refetch.'));
          }
          if (!isEqual(this.variables, variables)) {
              this.variables = Object.assign({}, this.variables, variables);
          }
          if (!isEqual(this.options.variables, this.variables)) {
              this.options.variables = Object.assign({}, this.options.variables, this.variables);
          }
          var isNetworkFetchPolicy = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
          var combinedOptions = __assign({}, this.options, { fetchPolicy: isNetworkFetchPolicy ? fetchPolicy : 'network-only' });
          return this.queryManager
              .fetchQuery(this.queryId, combinedOptions, FetchType.refetch)
              .then(function (result) { return result; });
      };
      ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
          var _this = this;
          if (!fetchMoreOptions.updateQuery) {
              throw new Error('updateQuery option is required. This function defines how to update the query data with the new results.');
          }
          var combinedOptions;
          return Promise.resolve()
              .then(function () {
              var qid = _this.queryManager.generateQueryId();
              if (fetchMoreOptions.query) {
                  combinedOptions = fetchMoreOptions;
              }
              else {
                  combinedOptions = __assign({}, _this.options, fetchMoreOptions, { variables: Object.assign({}, _this.variables, fetchMoreOptions.variables) });
              }
              combinedOptions.fetchPolicy = 'network-only';
              return _this.queryManager.fetchQuery(qid, combinedOptions, FetchType.normal, _this.queryId);
          })
              .then(function (fetchMoreResult) {
              _this.updateQuery(function (previousResult) {
                  return fetchMoreOptions.updateQuery(previousResult, {
                      fetchMoreResult: fetchMoreResult.data,
                      variables: combinedOptions.variables,
                  });
              });
              return fetchMoreResult;
          });
      };
      ObservableQuery.prototype.subscribeToMore = function (options) {
          var _this = this;
          var subscription = this.queryManager
              .startGraphQLSubscription({
              query: options.document,
              variables: options.variables,
          })
              .subscribe({
              next: function (subscriptionData) {
                  if (options.updateQuery) {
                      _this.updateQuery(function (previous, _a) {
                          var variables = _a.variables;
                          return options.updateQuery(previous, {
                              subscriptionData: subscriptionData,
                              variables: variables,
                          });
                      });
                  }
              },
              error: function (err) {
                  if (options.onError) {
                      options.onError(err);
                      return;
                  }
                  console.error('Unhandled GraphQL subscription error', err);
              },
          });
          this.subscriptionHandles.push(subscription);
          return function () {
              var i = _this.subscriptionHandles.indexOf(subscription);
              if (i >= 0) {
                  _this.subscriptionHandles.splice(i, 1);
                  subscription.unsubscribe();
              }
          };
      };
      ObservableQuery.prototype.setOptions = function (opts) {
          var oldOptions = this.options;
          this.options = Object.assign({}, this.options, opts);
          if (opts.pollInterval) {
              this.startPolling(opts.pollInterval);
          }
          else if (opts.pollInterval === 0) {
              this.stopPolling();
          }
          var tryFetch = (oldOptions.fetchPolicy !== 'network-only' &&
              opts.fetchPolicy === 'network-only') ||
              (oldOptions.fetchPolicy === 'cache-only' &&
                  opts.fetchPolicy !== 'cache-only') ||
              (oldOptions.fetchPolicy === 'standby' &&
                  opts.fetchPolicy !== 'standby') ||
              false;
          return this.setVariables(this.options.variables, tryFetch, opts.fetchResults);
      };
      ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
          if (tryFetch === void 0) { tryFetch = false; }
          if (fetchResults === void 0) { fetchResults = true; }
          this.isTornDown = false;
          var newVariables = variables ? variables : this.variables;
          if (isEqual(newVariables, this.variables) && !tryFetch) {
              if (this.observers.length === 0 || !fetchResults) {
                  return new Promise(function (resolve) { return resolve(); });
              }
              return this.result();
          }
          else {
              this.variables = newVariables;
              this.options.variables = newVariables;
              if (this.observers.length === 0) {
                  return new Promise(function (resolve) { return resolve(); });
              }
              return this.queryManager
                  .fetchQuery(this.queryId, __assign({}, this.options, { variables: this.variables }))
                  .then(function (result) { return result; });
          }
      };
      ObservableQuery.prototype.updateQuery = function (mapFn) {
          var _a = this.queryManager.getQueryWithPreviousResult(this.queryId), previousResult = _a.previousResult, variables = _a.variables, document = _a.document;
          var newResult = tryFunctionOrLogError(function () {
              return mapFn(previousResult, { variables: variables });
          });
          if (newResult) {
              this.queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
              this.queryManager.broadcastQueries();
          }
      };
      ObservableQuery.prototype.stopPolling = function () {
          if (this.isCurrentlyPolling) {
              this.scheduler.stopPollingQuery(this.queryId);
              this.options.pollInterval = undefined;
              this.isCurrentlyPolling = false;
          }
      };
      ObservableQuery.prototype.startPolling = function (pollInterval) {
          if (this.options.fetchPolicy === 'cache-first' ||
              this.options.fetchPolicy === 'cache-only') {
              throw new Error('Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
          }
          if (this.isCurrentlyPolling) {
              this.scheduler.stopPollingQuery(this.queryId);
              this.isCurrentlyPolling = false;
          }
          this.options.pollInterval = pollInterval;
          this.isCurrentlyPolling = true;
          this.scheduler.startPollingQuery(this.options, this.queryId);
      };
      ObservableQuery.prototype.onSubscribe = function (observer) {
          var _this = this;
          if (observer._subscription &&
              observer._subscription._observer &&
              !observer._subscription._observer.error) {
              observer._subscription._observer.error = function (error) {
                  console.error('Unhandled error', error.message, error.stack);
              };
          }
          this.observers.push(observer);
          if (observer.next && this.lastResult)
              observer.next(this.lastResult);
          if (observer.error && this.lastError)
              observer.error(this.lastError);
          if (this.observers.length === 1)
              this.setUpQuery();
          return function () {
              _this.observers = _this.observers.filter(function (obs) { return obs !== observer; });
              if (_this.observers.length === 0) {
                  _this.tearDownQuery();
              }
          };
      };
      ObservableQuery.prototype.setUpQuery = function () {
          var _this = this;
          if (this.shouldSubscribe) {
              this.queryManager.addObservableQuery(this.queryId, this);
          }
          if (!!this.options.pollInterval) {
              if (this.options.fetchPolicy === 'cache-first' ||
                  this.options.fetchPolicy === 'cache-only') {
                  throw new Error('Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
              }
              this.isCurrentlyPolling = true;
              this.scheduler.startPollingQuery(this.options, this.queryId);
          }
          var observer = {
              next: function (result) {
                  _this.lastResult = result;
                  _this.lastResultSnapshot = cloneDeep(result);
                  _this.observers.forEach(function (obs) { return obs.next && obs.next(result); });
              },
              error: function (error) {
                  _this.lastError = error;
                  _this.observers.forEach(function (obs) { return obs.error && obs.error(error); });
              },
          };
          this.queryManager.startQuery(this.queryId, this.options, this.queryManager.queryListenerForObserver(this.queryId, this.options, observer));
      };
      ObservableQuery.prototype.tearDownQuery = function () {
          this.isTornDown = true;
          if (this.isCurrentlyPolling) {
              this.scheduler.stopPollingQuery(this.queryId);
              this.isCurrentlyPolling = false;
          }
          this.subscriptionHandles.forEach(function (sub) { return sub.unsubscribe(); });
          this.subscriptionHandles = [];
          this.queryManager.removeObservableQuery(this.queryId);
          this.queryManager.stopQuery(this.queryId);
          this.observers = [];
      };
      return ObservableQuery;
  }(Observable$2));

  var __extends$2 = (undefined && undefined.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  /*
   * Expects context to contain the forceFetch field if no dedup
   */
  var DedupLink = /** @class */ (function (_super) {
      __extends$2(DedupLink, _super);
      function DedupLink() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.inFlightRequestObservables = new Map();
          _this.subscribers = new Map();
          return _this;
      }
      DedupLink.prototype.request = function (operation, forward) {
          var _this = this;
          // sometimes we might not want to deduplicate a request, for example when we want to force fetch it.
          if (operation.getContext().forceFetch) {
              return forward(operation);
          }
          var key = operation.toKey();
          var cleanup = function (operationKey) {
              _this.inFlightRequestObservables.delete(operationKey);
              var prev = _this.subscribers.get(operationKey);
              return prev;
          };
          if (!this.inFlightRequestObservables.get(key)) {
              // this is a new request, i.e. we haven't deduplicated it yet
              // call the next link
              var singleObserver_1 = forward(operation);
              var subscription_1;
              var sharedObserver = new Observable$1(function (observer) {
                  // this will still be called by each subscriber regardless of
                  // deduplication status
                  var prev = _this.subscribers.get(key);
                  if (!prev)
                      prev = { next: [], error: [], complete: [] };
                  _this.subscribers.set(key, {
                      next: prev.next.concat([observer.next.bind(observer)]),
                      error: prev.error.concat([observer.error.bind(observer)]),
                      complete: prev.complete.concat([observer.complete.bind(observer)]),
                  });
                  if (!subscription_1) {
                      subscription_1 = singleObserver_1.subscribe({
                          next: function (result) {
                              var previous = cleanup(key);
                              _this.subscribers.delete(key);
                              if (previous) {
                                  previous.next.forEach(function (next) { return next(result); });
                                  previous.complete.forEach(function (complete) { return complete(); });
                              }
                          },
                          error: function (error) {
                              var previous = cleanup(key);
                              _this.subscribers.delete(key);
                              if (previous)
                                  previous.error.forEach(function (err) { return err(error); });
                          },
                      });
                  }
                  return function () {
                      if (subscription_1)
                          subscription_1.unsubscribe();
                      _this.inFlightRequestObservables.delete(key);
                  };
              });
              this.inFlightRequestObservables.set(key, sharedObserver);
          }
          // return shared Observable
          return this.inFlightRequestObservables.get(key);
      };
      return DedupLink;
  }(ApolloLink));

  var QueryScheduler = (function () {
      function QueryScheduler(_a) {
          var queryManager = _a.queryManager, ssrMode = _a.ssrMode;
          this.inFlightQueries = {};
          this.registeredQueries = {};
          this.intervalQueries = {};
          this.pollingTimers = {};
          this.ssrMode = false;
          this.queryManager = queryManager;
          this.ssrMode = ssrMode || false;
      }
      QueryScheduler.prototype.stop = function () {
          var _this = this;
          Object.keys(this.registeredQueries).forEach(function (queryId) {
              _this.stopPollingQuery(queryId);
          });
          Object.keys(this.intervalQueries).forEach(function (interval) {
              _this.fetchQueriesOnInterval(+interval);
          });
      };
      QueryScheduler.prototype.checkInFlight = function (queryId) {
          var query = this.queryManager.queryStore.get(queryId);
          return (query &&
              query.networkStatus !== NetworkStatus.ready &&
              query.networkStatus !== NetworkStatus.error);
      };
      QueryScheduler.prototype.fetchQuery = function (queryId, options, fetchType) {
          var _this = this;
          return new Promise(function (resolve, reject) {
              _this.queryManager
                  .fetchQuery(queryId, options, fetchType)
                  .then(function (result) {
                  resolve(result);
              })
                  .catch(function (error) {
                  reject(error);
              });
          });
      };
      QueryScheduler.prototype.startPollingQuery = function (options, queryId, listener) {
          if (!options.pollInterval) {
              throw new Error('Attempted to start a polling query without a polling interval.');
          }
          if (this.ssrMode)
              return queryId;
          this.registeredQueries[queryId] = options;
          if (listener) {
              this.queryManager.addQueryListener(queryId, listener);
          }
          this.addQueryOnInterval(queryId, options);
          return queryId;
      };
      QueryScheduler.prototype.stopPollingQuery = function (queryId) {
          delete this.registeredQueries[queryId];
      };
      QueryScheduler.prototype.fetchQueriesOnInterval = function (interval) {
          var _this = this;
          this.intervalQueries[interval] = this.intervalQueries[interval].filter(function (queryId) {
              if (!(_this.registeredQueries.hasOwnProperty(queryId) &&
                  _this.registeredQueries[queryId].pollInterval === interval)) {
                  return false;
              }
              if (_this.checkInFlight(queryId)) {
                  return true;
              }
              var queryOptions = _this.registeredQueries[queryId];
              var pollingOptions = __assign({}, queryOptions);
              pollingOptions.fetchPolicy = 'network-only';
              _this.fetchQuery(queryId, pollingOptions, FetchType.poll).catch(function () { });
              return true;
          });
          if (this.intervalQueries[interval].length === 0) {
              clearInterval(this.pollingTimers[interval]);
              delete this.intervalQueries[interval];
          }
      };
      QueryScheduler.prototype.addQueryOnInterval = function (queryId, queryOptions) {
          var _this = this;
          var interval = queryOptions.pollInterval;
          if (!interval) {
              throw new Error("A poll interval is required to start polling query with id '" + queryId + "'.");
          }
          if (this.intervalQueries.hasOwnProperty(interval.toString()) &&
              this.intervalQueries[interval].length > 0) {
              this.intervalQueries[interval].push(queryId);
          }
          else {
              this.intervalQueries[interval] = [queryId];
              this.pollingTimers[interval] = setInterval(function () {
                  _this.fetchQueriesOnInterval(interval);
              }, interval);
          }
      };
      QueryScheduler.prototype.registerPollingQuery = function (queryOptions) {
          if (!queryOptions.pollInterval) {
              throw new Error('Attempted to register a non-polling query with the scheduler.');
          }
          return new ObservableQuery({
              scheduler: this,
              options: queryOptions,
          });
      };
      return QueryScheduler;
  }());

  var MutationStore = (function () {
      function MutationStore() {
          this.store = {};
      }
      MutationStore.prototype.getStore = function () {
          return this.store;
      };
      MutationStore.prototype.get = function (mutationId) {
          return this.store[mutationId];
      };
      MutationStore.prototype.initMutation = function (mutationId, mutation, variables) {
          this.store[mutationId] = {
              mutation: mutation,
              variables: variables || {},
              loading: true,
              error: null,
          };
      };
      MutationStore.prototype.markMutationError = function (mutationId, error) {
          var mutation = this.store[mutationId];
          if (!mutation) {
              return;
          }
          mutation.loading = false;
          mutation.error = error;
      };
      MutationStore.prototype.markMutationResult = function (mutationId) {
          var mutation = this.store[mutationId];
          if (!mutation) {
              return;
          }
          mutation.loading = false;
          mutation.error = null;
      };
      MutationStore.prototype.reset = function () {
          this.store = {};
      };
      return MutationStore;
  }());

  var QueryStore = (function () {
      function QueryStore() {
          this.store = {};
      }
      QueryStore.prototype.getStore = function () {
          return this.store;
      };
      QueryStore.prototype.get = function (queryId) {
          return this.store[queryId];
      };
      QueryStore.prototype.initQuery = function (query) {
          var previousQuery = this.store[query.queryId];
          if (previousQuery &&
              previousQuery.document !== query.document &&
              !isEqual(previousQuery.document, query.document)) {
              throw new Error('Internal Error: may not update existing query string in store');
          }
          var isSetVariables = false;
          var previousVariables = null;
          if (query.storePreviousVariables &&
              previousQuery &&
              previousQuery.networkStatus !== NetworkStatus.loading) {
              if (!isEqual(previousQuery.variables, query.variables)) {
                  isSetVariables = true;
                  previousVariables = previousQuery.variables;
              }
          }
          var networkStatus;
          if (isSetVariables) {
              networkStatus = NetworkStatus.setVariables;
          }
          else if (query.isPoll) {
              networkStatus = NetworkStatus.poll;
          }
          else if (query.isRefetch) {
              networkStatus = NetworkStatus.refetch;
          }
          else {
              networkStatus = NetworkStatus.loading;
          }
          var graphQLErrors = [];
          if (previousQuery && previousQuery.graphQLErrors) {
              graphQLErrors = previousQuery.graphQLErrors;
          }
          this.store[query.queryId] = {
              document: query.document,
              variables: query.variables,
              previousVariables: previousVariables,
              networkError: null,
              graphQLErrors: graphQLErrors,
              networkStatus: networkStatus,
              metadata: query.metadata,
          };
          if (typeof query.fetchMoreForQueryId === 'string' &&
              this.store[query.fetchMoreForQueryId]) {
              this.store[query.fetchMoreForQueryId].networkStatus =
                  NetworkStatus.fetchMore;
          }
      };
      QueryStore.prototype.markQueryResult = function (queryId, result, fetchMoreForQueryId) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = null;
          this.store[queryId].graphQLErrors =
              result.errors && result.errors.length ? result.errors : [];
          this.store[queryId].previousVariables = null;
          this.store[queryId].networkStatus = NetworkStatus.ready;
          if (typeof fetchMoreForQueryId === 'string' &&
              this.store[fetchMoreForQueryId]) {
              this.store[fetchMoreForQueryId].networkStatus = NetworkStatus.ready;
          }
      };
      QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = error;
          this.store[queryId].networkStatus = NetworkStatus.error;
          if (typeof fetchMoreForQueryId === 'string') {
              this.markQueryResultClient(fetchMoreForQueryId, true);
          }
      };
      QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
          if (!this.store || !this.store[queryId])
              return;
          this.store[queryId].networkError = null;
          this.store[queryId].previousVariables = null;
          this.store[queryId].networkStatus = complete
              ? NetworkStatus.ready
              : NetworkStatus.loading;
      };
      QueryStore.prototype.stopQuery = function (queryId) {
          delete this.store[queryId];
      };
      QueryStore.prototype.reset = function (observableQueryIds) {
          var _this = this;
          this.store = Object.keys(this.store)
              .filter(function (queryId) {
              return observableQueryIds.indexOf(queryId) > -1;
          })
              .reduce(function (res, key) {
              res[key] = __assign({}, _this.store[key], { networkStatus: NetworkStatus.loading });
              return res;
          }, {});
      };
      return QueryStore;
  }());

  var QueryManager = (function () {
      function QueryManager(_a) {
          var link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, store = _a.store, _c = _a.onBroadcast, onBroadcast = _c === void 0 ? function () { return undefined; } : _c, _d = _a.ssrMode, ssrMode = _d === void 0 ? false : _d, _e = _a.clientAwareness, clientAwareness = _e === void 0 ? {} : _e;
          this.mutationStore = new MutationStore();
          this.queryStore = new QueryStore();
          this.clientAwareness = {};
          this.idCounter = 1;
          this.queries = new Map();
          this.fetchQueryRejectFns = new Set();
          this.queryIdsByName = {};
          this.link = link;
          this.deduplicator = ApolloLink.from([new DedupLink(), link]);
          this.queryDeduplication = queryDeduplication;
          this.dataStore = store;
          this.onBroadcast = onBroadcast;
          this.clientAwareness = clientAwareness;
          this.scheduler = new QueryScheduler({ queryManager: this, ssrMode: ssrMode });
      }
      QueryManager.prototype.stop = function () {
          this.scheduler.stop();
          this.fetchQueryRejectFns.forEach(function (reject) {
              reject(new Error('QueryManager stopped while query was in flight'));
          });
      };
      QueryManager.prototype.mutate = function (_a) {
          var _this = this;
          var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueriesByName = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
          if (!mutation) {
              throw new Error('mutation option is required. You must specify your GraphQL document in the mutation option.');
          }
          if (fetchPolicy && fetchPolicy !== 'no-cache') {
              throw new Error("fetchPolicy for mutations currently only supports the 'no-cache' policy");
          }
          var mutationId = this.generateQueryId();
          var cache = this.dataStore.getCache();
          (mutation = cache.transformDocument(mutation)),
              (variables = assign({}, getDefaultValues(getMutationDefinition(mutation)), variables));
          this.setQuery(mutationId, function () { return ({ document: mutation }); });
          var generateUpdateQueriesInfo = function () {
              var ret = {};
              if (updateQueriesByName) {
                  Object.keys(updateQueriesByName).forEach(function (queryName) {
                      return (_this.queryIdsByName[queryName] || []).forEach(function (queryId) {
                          ret[queryId] = {
                              updater: updateQueriesByName[queryName],
                              query: _this.queryStore.get(queryId),
                          };
                      });
                  });
              }
              return ret;
          };
          this.mutationStore.initMutation(mutationId, mutation, variables);
          this.dataStore.markMutationInit({
              mutationId: mutationId,
              document: mutation,
              variables: variables || {},
              updateQueries: generateUpdateQueriesInfo(),
              update: updateWithProxyFn,
              optimisticResponse: optimisticResponse,
          });
          this.broadcastQueries();
          return new Promise(function (resolve, reject) {
              var storeResult;
              var error;
              var operation = _this.buildOperationForLink(mutation, variables, __assign({}, context, { optimisticResponse: optimisticResponse }));
              var completeMutation = function () {
                  if (error) {
                      _this.mutationStore.markMutationError(mutationId, error);
                  }
                  _this.dataStore.markMutationComplete({
                      mutationId: mutationId,
                      optimisticResponse: optimisticResponse,
                  });
                  _this.broadcastQueries();
                  if (error) {
                      return Promise.reject(error);
                  }
                  if (typeof refetchQueries === 'function') {
                      refetchQueries = refetchQueries(storeResult);
                  }
                  var refetchQueryPromises = [];
                  for (var _i = 0, refetchQueries_1 = refetchQueries; _i < refetchQueries_1.length; _i++) {
                      var refetchQuery = refetchQueries_1[_i];
                      if (typeof refetchQuery === 'string') {
                          var promise = _this.refetchQueryByName(refetchQuery);
                          if (promise) {
                              refetchQueryPromises.push(promise);
                          }
                          continue;
                      }
                      var queryOptions = {
                          query: refetchQuery.query,
                          variables: refetchQuery.variables,
                          fetchPolicy: 'network-only',
                      };
                      if (refetchQuery.context) {
                          queryOptions.context = refetchQuery.context;
                      }
                      refetchQueryPromises.push(_this.query(queryOptions));
                  }
                  return Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                      _this.setQuery(mutationId, function () { return ({ document: undefined }); });
                      if (errorPolicy === 'ignore' &&
                          storeResult &&
                          graphQLResultHasError(storeResult)) {
                          delete storeResult.errors;
                      }
                      return storeResult;
                  });
              };
              execute(_this.link, operation).subscribe({
                  next: function (result) {
                      if (graphQLResultHasError(result) && errorPolicy === 'none') {
                          error = new ApolloError({
                              graphQLErrors: result.errors,
                          });
                          return;
                      }
                      _this.mutationStore.markMutationResult(mutationId);
                      if (fetchPolicy !== 'no-cache') {
                          _this.dataStore.markMutationResult({
                              mutationId: mutationId,
                              result: result,
                              document: mutation,
                              variables: variables || {},
                              updateQueries: generateUpdateQueriesInfo(),
                              update: updateWithProxyFn,
                          });
                      }
                      storeResult = result;
                  },
                  error: function (err) {
                      _this.mutationStore.markMutationError(mutationId, err);
                      _this.dataStore.markMutationComplete({
                          mutationId: mutationId,
                          optimisticResponse: optimisticResponse,
                      });
                      _this.broadcastQueries();
                      _this.setQuery(mutationId, function () { return ({ document: undefined }); });
                      reject(new ApolloError({
                          networkError: err,
                      }));
                  },
                  complete: function () { return completeMutation().then(resolve, reject); },
              });
          });
      };
      QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
          var _this = this;
          var _a = options.variables, variables = _a === void 0 ? {} : _a, _b = options.metadata, metadata = _b === void 0 ? null : _b, _c = options.fetchPolicy, fetchPolicy = _c === void 0 ? 'cache-first' : _c;
          var cache = this.dataStore.getCache();
          var query = cache.transformDocument(options.query);
          var storeResult;
          var needToFetch = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
          if (fetchType !== FetchType.refetch &&
              fetchPolicy !== 'network-only' &&
              fetchPolicy !== 'no-cache') {
              var _d = this.dataStore.getCache().diff({
                  query: query,
                  variables: variables,
                  returnPartialData: true,
                  optimistic: false,
              }), complete = _d.complete, result = _d.result;
              needToFetch = !complete || fetchPolicy === 'cache-and-network';
              storeResult = result;
          }
          var shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
          if (hasDirectives(['live'], query))
              shouldFetch = true;
          var requestId = this.generateRequestId();
          var cancel = this.updateQueryWatch(queryId, query, options);
          this.setQuery(queryId, function () { return ({
              document: query,
              lastRequestId: requestId,
              invalidated: true,
              cancel: cancel,
          }); });
          this.invalidate(true, fetchMoreForQueryId);
          this.queryStore.initQuery({
              queryId: queryId,
              document: query,
              storePreviousVariables: shouldFetch,
              variables: variables,
              isPoll: fetchType === FetchType.poll,
              isRefetch: fetchType === FetchType.refetch,
              metadata: metadata,
              fetchMoreForQueryId: fetchMoreForQueryId,
          });
          this.broadcastQueries();
          var shouldDispatchClientResult = !shouldFetch || fetchPolicy === 'cache-and-network';
          if (shouldDispatchClientResult) {
              this.queryStore.markQueryResultClient(queryId, !shouldFetch);
              this.invalidate(true, queryId, fetchMoreForQueryId);
              this.broadcastQueries();
          }
          if (shouldFetch) {
              var networkResult = this.fetchRequest({
                  requestId: requestId,
                  queryId: queryId,
                  document: query,
                  options: options,
                  fetchMoreForQueryId: fetchMoreForQueryId,
              }).catch(function (error) {
                  if (isApolloError(error)) {
                      throw error;
                  }
                  else {
                      var lastRequestId = _this.getQuery(queryId).lastRequestId;
                      if (requestId >= (lastRequestId || 1)) {
                          _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
                          _this.invalidate(true, queryId, fetchMoreForQueryId);
                          _this.broadcastQueries();
                      }
                      throw new ApolloError({ networkError: error });
                  }
              });
              if (fetchPolicy !== 'cache-and-network') {
                  return networkResult;
              }
              else {
                  networkResult.catch(function () { });
              }
          }
          return Promise.resolve({ data: storeResult });
      };
      QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
          var _this = this;
          var previouslyHadError = false;
          return function (queryStoreValue, newData) {
              _this.invalidate(false, queryId);
              if (!queryStoreValue)
                  return;
              var observableQuery = _this.getQuery(queryId).observableQuery;
              var fetchPolicy = observableQuery
                  ? observableQuery.options.fetchPolicy
                  : options.fetchPolicy;
              if (fetchPolicy === 'standby')
                  return;
              var errorPolicy = observableQuery
                  ? observableQuery.options.errorPolicy
                  : options.errorPolicy;
              var lastResult = observableQuery
                  ? observableQuery.getLastResult()
                  : null;
              var lastError = observableQuery ? observableQuery.getLastError() : null;
              var shouldNotifyIfLoading = (!newData && queryStoreValue.previousVariables != null) ||
                  fetchPolicy === 'cache-only' ||
                  fetchPolicy === 'cache-and-network';
              var networkStatusChanged = Boolean(lastResult &&
                  queryStoreValue.networkStatus !== lastResult.networkStatus);
              var errorStatusChanged = errorPolicy &&
                  (lastError && lastError.graphQLErrors) !==
                      queryStoreValue.graphQLErrors &&
                  errorPolicy !== 'none';
              if (!isNetworkRequestInFlight(queryStoreValue.networkStatus) ||
                  (networkStatusChanged && options.notifyOnNetworkStatusChange) ||
                  shouldNotifyIfLoading) {
                  if (((!errorPolicy || errorPolicy === 'none') &&
                      queryStoreValue.graphQLErrors &&
                      queryStoreValue.graphQLErrors.length > 0) ||
                      queryStoreValue.networkError) {
                      var apolloError_1 = new ApolloError({
                          graphQLErrors: queryStoreValue.graphQLErrors,
                          networkError: queryStoreValue.networkError,
                      });
                      previouslyHadError = true;
                      if (observer.error) {
                          try {
                              observer.error(apolloError_1);
                          }
                          catch (e) {
                              setTimeout(function () {
                                  throw e;
                              }, 0);
                          }
                      }
                      else {
                          setTimeout(function () {
                              throw apolloError_1;
                          }, 0);
                          if (!isProduction()) {
                              console.info('An unhandled error was thrown because no error handler is registered ' +
                                  'for the query ' +
                                  JSON.stringify(queryStoreValue.document));
                          }
                      }
                      return;
                  }
                  try {
                      var data = void 0;
                      var isMissing = void 0;
                      if (newData) {
                          if (fetchPolicy !== 'no-cache') {
                              _this.setQuery(queryId, function () { return ({ newData: null }); });
                          }
                          data = newData.result;
                          isMissing = !newData.complete || false;
                      }
                      else {
                          if (lastResult && lastResult.data && !errorStatusChanged) {
                              data = lastResult.data;
                              isMissing = false;
                          }
                          else {
                              var document_1 = _this.getQuery(queryId).document;
                              var readResult = _this.dataStore.getCache().diff({
                                  query: document_1,
                                  variables: queryStoreValue.previousVariables ||
                                      queryStoreValue.variables,
                                  optimistic: true,
                              });
                              data = readResult.result;
                              isMissing = !readResult.complete;
                          }
                      }
                      var resultFromStore = void 0;
                      if (isMissing && fetchPolicy !== 'cache-only') {
                          resultFromStore = {
                              data: lastResult && lastResult.data,
                              loading: isNetworkRequestInFlight(queryStoreValue.networkStatus),
                              networkStatus: queryStoreValue.networkStatus,
                              stale: true,
                          };
                      }
                      else {
                          resultFromStore = {
                              data: data,
                              loading: isNetworkRequestInFlight(queryStoreValue.networkStatus),
                              networkStatus: queryStoreValue.networkStatus,
                              stale: false,
                          };
                      }
                      if (errorPolicy === 'all' &&
                          queryStoreValue.graphQLErrors &&
                          queryStoreValue.graphQLErrors.length > 0) {
                          resultFromStore.errors = queryStoreValue.graphQLErrors;
                      }
                      if (observer.next) {
                          if (previouslyHadError ||
                              !observableQuery ||
                              observableQuery.isDifferentFromLastResult(resultFromStore)) {
                              try {
                                  observer.next(resultFromStore);
                              }
                              catch (e) {
                                  setTimeout(function () {
                                      throw e;
                                  }, 0);
                              }
                          }
                      }
                      previouslyHadError = false;
                  }
                  catch (error) {
                      previouslyHadError = true;
                      if (observer.error)
                          observer.error(new ApolloError({ networkError: error }));
                      return;
                  }
              }
          };
      };
      QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
          if (shouldSubscribe === void 0) { shouldSubscribe = true; }
          if (options.fetchPolicy === 'standby') {
              throw new Error('client.watchQuery cannot be called with fetchPolicy set to "standby"');
          }
          var queryDefinition = getQueryDefinition(options.query);
          if (queryDefinition.variableDefinitions &&
              queryDefinition.variableDefinitions.length) {
              var defaultValues = getDefaultValues(queryDefinition);
              options.variables = assign({}, defaultValues, options.variables);
          }
          if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
              options.notifyOnNetworkStatusChange = false;
          }
          var transformedOptions = __assign({}, options);
          return new ObservableQuery({
              scheduler: this.scheduler,
              options: transformedOptions,
              shouldSubscribe: shouldSubscribe,
          });
      };
      QueryManager.prototype.query = function (options) {
          var _this = this;
          if (!options.query) {
              throw new Error('query option is required. You must specify your GraphQL document ' +
                  'in the query option.');
          }
          if (options.query.kind !== 'Document') {
              throw new Error('You must wrap the query string in a "gql" tag.');
          }
          if (options.returnPartialData) {
              throw new Error('returnPartialData option only supported on watchQuery.');
          }
          if (options.pollInterval) {
              throw new Error('pollInterval option only supported on watchQuery.');
          }
          return new Promise(function (resolve, reject) {
              _this.fetchQueryRejectFns.add(reject);
              _this.watchQuery(options, false)
                  .result()
                  .then(resolve, reject)
                  .then(function () { return _this.fetchQueryRejectFns.delete(reject); });
          });
      };
      QueryManager.prototype.generateQueryId = function () {
          var queryId = this.idCounter.toString();
          this.idCounter++;
          return queryId;
      };
      QueryManager.prototype.stopQueryInStore = function (queryId) {
          this.queryStore.stopQuery(queryId);
          this.invalidate(true, queryId);
          this.broadcastQueries();
      };
      QueryManager.prototype.addQueryListener = function (queryId, listener) {
          this.setQuery(queryId, function (_a) {
              var _b = _a.listeners, listeners = _b === void 0 ? [] : _b;
              return ({
                  listeners: listeners.concat([listener]),
                  invalidate: false,
              });
          });
      };
      QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
          var _this = this;
          var cancel = this.getQuery(queryId).cancel;
          if (cancel)
              cancel();
          var previousResult = function () {
              var previousResult = null;
              var observableQuery = _this.getQuery(queryId).observableQuery;
              if (observableQuery) {
                  var lastResult = observableQuery.getLastResult();
                  if (lastResult) {
                      previousResult = lastResult.data;
                  }
              }
              return previousResult;
          };
          return this.dataStore.getCache().watch({
              query: document,
              variables: options.variables,
              optimistic: true,
              previousResult: previousResult,
              callback: function (newData) {
                  _this.setQuery(queryId, function () { return ({ invalidated: true, newData: newData }); });
              },
          });
      };
      QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
          this.setQuery(queryId, function () { return ({ observableQuery: observableQuery }); });
          var queryDef = getQueryDefinition(observableQuery.options.query);
          if (queryDef.name && queryDef.name.value) {
              var queryName = queryDef.name.value;
              this.queryIdsByName[queryName] = this.queryIdsByName[queryName] || [];
              this.queryIdsByName[queryName].push(observableQuery.queryId);
          }
      };
      QueryManager.prototype.removeObservableQuery = function (queryId) {
          var _a = this.getQuery(queryId), observableQuery = _a.observableQuery, cancel = _a.cancel;
          if (cancel)
              cancel();
          if (!observableQuery)
              return;
          var definition = getQueryDefinition(observableQuery.options.query);
          var queryName = definition.name ? definition.name.value : null;
          this.setQuery(queryId, function () { return ({ observableQuery: null }); });
          if (queryName) {
              this.queryIdsByName[queryName] = this.queryIdsByName[queryName].filter(function (val) {
                  return !(observableQuery.queryId === val);
              });
          }
      };
      QueryManager.prototype.clearStore = function () {
          this.fetchQueryRejectFns.forEach(function (reject) {
              reject(new Error('Store reset while query was in flight(not completed in link chain)'));
          });
          var resetIds = [];
          this.queries.forEach(function (_a, queryId) {
              var observableQuery = _a.observableQuery;
              if (observableQuery)
                  resetIds.push(queryId);
          });
          this.queryStore.reset(resetIds);
          this.mutationStore.reset();
          var reset = this.dataStore.reset();
          return reset;
      };
      QueryManager.prototype.resetStore = function () {
          var _this = this;
          return this.clearStore().then(function () {
              return _this.reFetchObservableQueries();
          });
      };
      QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
          var observableQueryPromises = this.getObservableQueryPromises(includeStandby);
          this.broadcastQueries();
          return Promise.all(observableQueryPromises);
      };
      QueryManager.prototype.startQuery = function (queryId, options, listener) {
          this.addQueryListener(queryId, listener);
          this.fetchQuery(queryId, options)
              .catch(function () { return undefined; });
          return queryId;
      };
      QueryManager.prototype.startGraphQLSubscription = function (options) {
          var _this = this;
          var query = options.query;
          var isCacheEnabled = !(options.fetchPolicy && options.fetchPolicy === 'no-cache');
          var cache = this.dataStore.getCache();
          var transformedDoc = cache.transformDocument(query);
          var variables = assign({}, getDefaultValues(getOperationDefinition(query)), options.variables);
          var sub;
          var observers = [];
          return new Observable$2(function (observer) {
              observers.push(observer);
              if (observers.length === 1) {
                  var handler = {
                      next: function (result) {
                          if (isCacheEnabled) {
                              _this.dataStore.markSubscriptionResult(result, transformedDoc, variables);
                              _this.broadcastQueries();
                          }
                          observers.forEach(function (obs) {
                              if (graphQLResultHasError(result) && obs.error) {
                                  obs.error(new ApolloError({
                                      graphQLErrors: result.errors,
                                  }));
                              }
                              else if (obs.next) {
                                  obs.next(result);
                              }
                          });
                      },
                      error: function (error) {
                          observers.forEach(function (obs) {
                              if (obs.error) {
                                  obs.error(error);
                              }
                          });
                      },
                      complete: function () {
                          observers.forEach(function (obs) {
                              if (obs.complete) {
                                  obs.complete();
                              }
                          });
                      }
                  };
                  var operation = _this.buildOperationForLink(transformedDoc, variables);
                  sub = execute(_this.link, operation).subscribe(handler);
              }
              return function () {
                  observers = observers.filter(function (obs) { return obs !== observer; });
                  if (observers.length === 0 && sub) {
                      sub.unsubscribe();
                  }
              };
          });
      };
      QueryManager.prototype.stopQuery = function (queryId) {
          this.stopQueryInStore(queryId);
          this.removeQuery(queryId);
      };
      QueryManager.prototype.removeQuery = function (queryId) {
          var subscriptions = this.getQuery(queryId).subscriptions;
          subscriptions.forEach(function (x) { return x.unsubscribe(); });
          this.queries.delete(queryId);
      };
      QueryManager.prototype.getCurrentQueryResult = function (observableQuery, optimistic) {
          if (optimistic === void 0) { optimistic = true; }
          var _a = observableQuery.options, variables = _a.variables, query = _a.query;
          var lastResult = observableQuery.getLastResult();
          var newData = this.getQuery(observableQuery.queryId).newData;
          if (newData && newData.complete) {
              return { data: newData.result, partial: false };
          }
          else {
              try {
                  var data = this.dataStore.getCache().read({
                      query: query,
                      variables: variables,
                      previousResult: lastResult ? lastResult.data : undefined,
                      optimistic: optimistic,
                  });
                  return { data: data, partial: false };
              }
              catch (e) {
                  return { data: {}, partial: true };
              }
          }
      };
      QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
          var observableQuery;
          if (typeof queryIdOrObservable === 'string') {
              var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
              if (!foundObserveableQuery) {
                  throw new Error("ObservableQuery with this id doesn't exist: " + queryIdOrObservable);
              }
              observableQuery = foundObserveableQuery;
          }
          else {
              observableQuery = queryIdOrObservable;
          }
          var _a = observableQuery.options, variables = _a.variables, query = _a.query;
          var data = this.getCurrentQueryResult(observableQuery, false).data;
          return {
              previousResult: data,
              variables: variables,
              document: query,
          };
      };
      QueryManager.prototype.broadcastQueries = function () {
          var _this = this;
          this.onBroadcast();
          this.queries.forEach(function (info, id) {
              if (!info.invalidated || !info.listeners)
                  return;
              info.listeners
                  .filter(function (x) { return !!x; })
                  .forEach(function (listener) {
                  listener(_this.queryStore.get(id), info.newData);
              });
          });
      };
      QueryManager.prototype.getObservableQueryPromises = function (includeStandby) {
          var _this = this;
          var observableQueryPromises = [];
          this.queries.forEach(function (_a, queryId) {
              var observableQuery = _a.observableQuery;
              if (!observableQuery)
                  return;
              var fetchPolicy = observableQuery.options.fetchPolicy;
              observableQuery.resetLastResults();
              if (fetchPolicy !== 'cache-only' &&
                  (includeStandby || fetchPolicy !== 'standby')) {
                  observableQueryPromises.push(observableQuery.refetch());
              }
              _this.setQuery(queryId, function () { return ({ newData: null }); });
              _this.invalidate(true, queryId);
          });
          return observableQueryPromises;
      };
      QueryManager.prototype.fetchRequest = function (_a) {
          var _this = this;
          var requestId = _a.requestId, queryId = _a.queryId, document = _a.document, options = _a.options, fetchMoreForQueryId = _a.fetchMoreForQueryId;
          var variables = options.variables, context = options.context, _b = options.errorPolicy, errorPolicy = _b === void 0 ? 'none' : _b, fetchPolicy = options.fetchPolicy;
          var operation = this.buildOperationForLink(document, variables, __assign({}, context, { forceFetch: !this.queryDeduplication }));
          var resultFromStore;
          var errorsFromStore;
          var rejectFetchPromise;
          return new Promise(function (resolve, reject) {
              _this.fetchQueryRejectFns.add(rejectFetchPromise = reject);
              var subscription = execute(_this.deduplicator, operation).subscribe({
                  next: function (result) {
                      var lastRequestId = _this.getQuery(queryId).lastRequestId;
                      if (requestId >= (lastRequestId || 1)) {
                          if (fetchPolicy !== 'no-cache') {
                              try {
                                  _this.dataStore.markQueryResult(result, document, variables, fetchMoreForQueryId, errorPolicy === 'ignore' || errorPolicy === 'all');
                              }
                              catch (e) {
                                  reject(e);
                                  return;
                              }
                          }
                          else {
                              _this.setQuery(queryId, function () { return ({
                                  newData: { result: result.data, complete: true },
                              }); });
                          }
                          _this.queryStore.markQueryResult(queryId, result, fetchMoreForQueryId);
                          _this.invalidate(true, queryId, fetchMoreForQueryId);
                          _this.broadcastQueries();
                      }
                      if (result.errors && errorPolicy === 'none') {
                          reject(new ApolloError({
                              graphQLErrors: result.errors,
                          }));
                          return;
                      }
                      else if (errorPolicy === 'all') {
                          errorsFromStore = result.errors;
                      }
                      if (fetchMoreForQueryId || fetchPolicy === 'no-cache') {
                          resultFromStore = result.data;
                      }
                      else {
                          try {
                              resultFromStore = _this.dataStore.getCache().read({
                                  variables: variables,
                                  query: document,
                                  optimistic: false,
                              });
                          }
                          catch (e) { }
                      }
                  },
                  error: function (error) {
                      _this.fetchQueryRejectFns.delete(reject);
                      _this.setQuery(queryId, function (_a) {
                          var subscriptions = _a.subscriptions;
                          return ({
                              subscriptions: subscriptions.filter(function (x) { return x !== subscription; }),
                          });
                      });
                      reject(error);
                  },
                  complete: function () {
                      _this.fetchQueryRejectFns.delete(reject);
                      _this.setQuery(queryId, function (_a) {
                          var subscriptions = _a.subscriptions;
                          return ({
                              subscriptions: subscriptions.filter(function (x) { return x !== subscription; }),
                          });
                      });
                      resolve({
                          data: resultFromStore,
                          errors: errorsFromStore,
                          loading: false,
                          networkStatus: NetworkStatus.ready,
                          stale: false,
                      });
                  },
              });
              _this.setQuery(queryId, function (_a) {
                  var subscriptions = _a.subscriptions;
                  return ({
                      subscriptions: subscriptions.concat([subscription]),
                  });
              });
          }).catch(function (error) {
              _this.fetchQueryRejectFns.delete(rejectFetchPromise);
              throw error;
          });
      };
      QueryManager.prototype.refetchQueryByName = function (queryName) {
          var _this = this;
          var refetchedQueries = this.queryIdsByName[queryName];
          if (refetchedQueries === undefined)
              return;
          return Promise.all(refetchedQueries
              .map(function (id) { return _this.getQuery(id).observableQuery; })
              .filter(function (x) { return !!x; })
              .map(function (x) { return x.refetch(); }));
      };
      QueryManager.prototype.generateRequestId = function () {
          var requestId = this.idCounter;
          this.idCounter++;
          return requestId;
      };
      QueryManager.prototype.getQuery = function (queryId) {
          return (this.queries.get(queryId) || {
              listeners: [],
              invalidated: false,
              document: null,
              newData: null,
              lastRequestId: null,
              observableQuery: null,
              subscriptions: [],
          });
      };
      QueryManager.prototype.setQuery = function (queryId, updater) {
          var prev = this.getQuery(queryId);
          var newInfo = __assign({}, prev, updater(prev));
          this.queries.set(queryId, newInfo);
      };
      QueryManager.prototype.invalidate = function (invalidated, queryId, fetchMoreForQueryId) {
          if (queryId)
              this.setQuery(queryId, function () { return ({ invalidated: invalidated }); });
          if (fetchMoreForQueryId) {
              this.setQuery(fetchMoreForQueryId, function () { return ({ invalidated: invalidated }); });
          }
      };
      QueryManager.prototype.buildOperationForLink = function (document, variables, extraContext) {
          var cache = this.dataStore.getCache();
          return {
              query: cache.transformForLink
                  ? cache.transformForLink(document)
                  : document,
              variables: variables,
              operationName: getOperationName(document) || undefined,
              context: __assign({}, extraContext, { cache: cache, getCacheKey: function (obj) {
                      if (cache.config) {
                          return cache.config.dataIdFromObject(obj);
                      }
                      else {
                          throw new Error('To use context.getCacheKey, you need to use a cache that has a configurable dataIdFromObject, like apollo-cache-inmemory.');
                      }
                  }, clientAwareness: this.clientAwareness }),
          };
      };
      return QueryManager;
  }());

  var DataStore = (function () {
      function DataStore(initialCache) {
          this.cache = initialCache;
      }
      DataStore.prototype.getCache = function () {
          return this.cache;
      };
      DataStore.prototype.markQueryResult = function (result, document, variables, fetchMoreForQueryId, ignoreErrors) {
          if (ignoreErrors === void 0) { ignoreErrors = false; }
          var writeWithErrors = !graphQLResultHasError(result);
          if (ignoreErrors && graphQLResultHasError(result) && result.data) {
              writeWithErrors = true;
          }
          if (!fetchMoreForQueryId && writeWithErrors) {
              this.cache.write({
                  result: result.data,
                  dataId: 'ROOT_QUERY',
                  query: document,
                  variables: variables,
              });
          }
      };
      DataStore.prototype.markSubscriptionResult = function (result, document, variables) {
          if (!graphQLResultHasError(result)) {
              this.cache.write({
                  result: result.data,
                  dataId: 'ROOT_SUBSCRIPTION',
                  query: document,
                  variables: variables,
              });
          }
      };
      DataStore.prototype.markMutationInit = function (mutation) {
          var _this = this;
          if (mutation.optimisticResponse) {
              var optimistic_1;
              if (typeof mutation.optimisticResponse === 'function') {
                  optimistic_1 = mutation.optimisticResponse(mutation.variables);
              }
              else {
                  optimistic_1 = mutation.optimisticResponse;
              }
              var changeFn_1 = function () {
                  _this.markMutationResult({
                      mutationId: mutation.mutationId,
                      result: { data: optimistic_1 },
                      document: mutation.document,
                      variables: mutation.variables,
                      updateQueries: mutation.updateQueries,
                      update: mutation.update,
                  });
              };
              this.cache.recordOptimisticTransaction(function (c) {
                  var orig = _this.cache;
                  _this.cache = c;
                  try {
                      changeFn_1();
                  }
                  finally {
                      _this.cache = orig;
                  }
              }, mutation.mutationId);
          }
      };
      DataStore.prototype.markMutationResult = function (mutation) {
          var _this = this;
          if (!graphQLResultHasError(mutation.result)) {
              var cacheWrites_1 = [];
              cacheWrites_1.push({
                  result: mutation.result.data,
                  dataId: 'ROOT_MUTATION',
                  query: mutation.document,
                  variables: mutation.variables,
              });
              if (mutation.updateQueries) {
                  Object.keys(mutation.updateQueries)
                      .filter(function (id) { return mutation.updateQueries[id]; })
                      .forEach(function (queryId) {
                      var _a = mutation.updateQueries[queryId], query = _a.query, updater = _a.updater;
                      var _b = _this.cache.diff({
                          query: query.document,
                          variables: query.variables,
                          returnPartialData: true,
                          optimistic: false,
                      }), currentQueryResult = _b.result, complete = _b.complete;
                      if (!complete) {
                          return;
                      }
                      var nextQueryResult = tryFunctionOrLogError(function () {
                          return updater(currentQueryResult, {
                              mutationResult: mutation.result,
                              queryName: getOperationName(query.document) || undefined,
                              queryVariables: query.variables,
                          });
                      });
                      if (nextQueryResult) {
                          cacheWrites_1.push({
                              result: nextQueryResult,
                              dataId: 'ROOT_QUERY',
                              query: query.document,
                              variables: query.variables,
                          });
                      }
                  });
              }
              this.cache.performTransaction(function (c) {
                  cacheWrites_1.forEach(function (write) { return c.write(write); });
              });
              var update_1 = mutation.update;
              if (update_1) {
                  this.cache.performTransaction(function (c) {
                      tryFunctionOrLogError(function () { return update_1(c, mutation.result); });
                  });
              }
          }
      };
      DataStore.prototype.markMutationComplete = function (_a) {
          var mutationId = _a.mutationId, optimisticResponse = _a.optimisticResponse;
          if (!optimisticResponse)
              return;
          this.cache.removeOptimistic(mutationId);
      };
      DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
          this.cache.write({
              result: newResult,
              dataId: 'ROOT_QUERY',
              variables: variables,
              query: document,
          });
      };
      DataStore.prototype.reset = function () {
          return this.cache.reset();
      };
      return DataStore;
  }());

  var version_1 = "2.4.12";

  var hasSuggestedDevtools = false;
  var ApolloClient = (function () {
      function ApolloClient(options) {
          var _this = this;
          this.defaultOptions = {};
          this.resetStoreCallbacks = [];
          this.clearStoreCallbacks = [];
          this.clientAwareness = {};
          var link = options.link, cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, connectToDevTools = options.connectToDevTools, _c = options.queryDeduplication, queryDeduplication = _c === void 0 ? true : _c, defaultOptions = options.defaultOptions, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
          if (!link || !cache) {
              throw new Error("\n        In order to initialize Apollo Client, you must specify link & cache properties on the config object.\n        This is part of the required upgrade when migrating from Apollo Client 1.0 to Apollo Client 2.0.\n        For more information, please visit:\n          https://www.apollographql.com/docs/react/basics/setup.html\n        to help you get started.\n      ");
          }
          var supportedCache = new Map();
          var supportedDirectives = new ApolloLink(function (operation, forward) {
              var result = supportedCache.get(operation.query);
              if (!result) {
                  result = removeConnectionDirectiveFromDocument(operation.query);
                  supportedCache.set(operation.query, result);
                  supportedCache.set(result, result);
              }
              operation.query = result;
              return forward(operation);
          });
          this.link = supportedDirectives.concat(link);
          this.cache = cache;
          this.store = new DataStore(cache);
          this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
          this.queryDeduplication = queryDeduplication;
          this.ssrMode = ssrMode;
          this.defaultOptions = defaultOptions || {};
          if (ssrForceFetchDelay) {
              setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
          }
          this.watchQuery = this.watchQuery.bind(this);
          this.query = this.query.bind(this);
          this.mutate = this.mutate.bind(this);
          this.resetStore = this.resetStore.bind(this);
          this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
          var defaultConnectToDevTools = !isProduction() &&
              typeof window !== 'undefined' &&
              !window.__APOLLO_CLIENT__;
          if (typeof connectToDevTools === 'undefined'
              ? defaultConnectToDevTools
              : connectToDevTools && typeof window !== 'undefined') {
              window.__APOLLO_CLIENT__ = this;
          }
          if (!hasSuggestedDevtools && !isProduction()) {
              hasSuggestedDevtools = true;
              if (typeof window !== 'undefined' &&
                  window.document &&
                  window.top === window.self) {
                  if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
                      if (window.navigator &&
                          window.navigator.userAgent &&
                          window.navigator.userAgent.indexOf('Chrome') > -1) {
                          console.debug('Download the Apollo DevTools ' +
                              'for a better development experience: ' +
                              'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
                      }
                  }
              }
          }
          this.version = version_1;
          if (clientAwarenessName) {
              this.clientAwareness.name = clientAwarenessName;
          }
          if (clientAwarenessVersion) {
              this.clientAwareness.version = clientAwarenessVersion;
          }
      }
      ApolloClient.prototype.stop = function () {
          if (this.queryManager) {
              this.queryManager.stop();
          }
      };
      ApolloClient.prototype.watchQuery = function (options) {
          if (this.defaultOptions.watchQuery) {
              options = __assign({}, this.defaultOptions.watchQuery, options);
          }
          if (this.disableNetworkFetches &&
              (options.fetchPolicy === 'network-only' ||
                  options.fetchPolicy === 'cache-and-network')) {
              options = __assign({}, options, { fetchPolicy: 'cache-first' });
          }
          return this.initQueryManager().watchQuery(options);
      };
      ApolloClient.prototype.query = function (options) {
          if (this.defaultOptions.query) {
              options = __assign({}, this.defaultOptions.query, options);
          }
          if (options.fetchPolicy === 'cache-and-network') {
              throw new Error('cache-and-network fetchPolicy can only be used with watchQuery');
          }
          if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
              options = __assign({}, options, { fetchPolicy: 'cache-first' });
          }
          return this.initQueryManager().query(options);
      };
      ApolloClient.prototype.mutate = function (options) {
          if (this.defaultOptions.mutate) {
              options = __assign({}, this.defaultOptions.mutate, options);
          }
          return this.initQueryManager().mutate(options);
      };
      ApolloClient.prototype.subscribe = function (options) {
          return this.initQueryManager().startGraphQLSubscription(options);
      };
      ApolloClient.prototype.readQuery = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.initProxy().readQuery(options, optimistic);
      };
      ApolloClient.prototype.readFragment = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.initProxy().readFragment(options, optimistic);
      };
      ApolloClient.prototype.writeQuery = function (options) {
          var result = this.initProxy().writeQuery(options);
          this.initQueryManager().broadcastQueries();
          return result;
      };
      ApolloClient.prototype.writeFragment = function (options) {
          var result = this.initProxy().writeFragment(options);
          this.initQueryManager().broadcastQueries();
          return result;
      };
      ApolloClient.prototype.writeData = function (options) {
          var result = this.initProxy().writeData(options);
          this.initQueryManager().broadcastQueries();
          return result;
      };
      ApolloClient.prototype.__actionHookForDevTools = function (cb) {
          this.devToolsHookCb = cb;
      };
      ApolloClient.prototype.__requestRaw = function (payload) {
          return execute(this.link, payload);
      };
      ApolloClient.prototype.initQueryManager = function () {
          var _this = this;
          if (!this.queryManager) {
              this.queryManager = new QueryManager({
                  link: this.link,
                  store: this.store,
                  queryDeduplication: this.queryDeduplication,
                  ssrMode: this.ssrMode,
                  clientAwareness: this.clientAwareness,
                  onBroadcast: function () {
                      if (_this.devToolsHookCb) {
                          _this.devToolsHookCb({
                              action: {},
                              state: {
                                  queries: _this.queryManager
                                      ? _this.queryManager.queryStore.getStore()
                                      : {},
                                  mutations: _this.queryManager
                                      ? _this.queryManager.mutationStore.getStore()
                                      : {},
                              },
                              dataWithOptimisticResults: _this.cache.extract(true),
                          });
                      }
                  },
              });
          }
          return this.queryManager;
      };
      ApolloClient.prototype.resetStore = function () {
          var _this = this;
          return Promise.resolve()
              .then(function () {
              return _this.queryManager
                  ? _this.queryManager.clearStore()
                  : Promise.resolve(null);
          })
              .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
              .then(function () {
              return _this.queryManager && _this.queryManager.reFetchObservableQueries
                  ? _this.queryManager.reFetchObservableQueries()
                  : Promise.resolve(null);
          });
      };
      ApolloClient.prototype.clearStore = function () {
          var _this = this;
          var queryManager = this.queryManager;
          return Promise.resolve()
              .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); })
              .then(function () {
              return queryManager ? queryManager.clearStore() : Promise.resolve(null);
          });
      };
      ApolloClient.prototype.onResetStore = function (cb) {
          var _this = this;
          this.resetStoreCallbacks.push(cb);
          return function () {
              _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
          };
      };
      ApolloClient.prototype.onClearStore = function (cb) {
          var _this = this;
          this.clearStoreCallbacks.push(cb);
          return function () {
              _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
          };
      };
      ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
          return this.queryManager
              ? this.queryManager.reFetchObservableQueries(includeStandby)
              : Promise.resolve(null);
      };
      ApolloClient.prototype.extract = function (optimistic) {
          return this.initProxy().extract(optimistic);
      };
      ApolloClient.prototype.restore = function (serializedState) {
          return this.initProxy().restore(serializedState);
      };
      ApolloClient.prototype.initProxy = function () {
          if (!this.proxy) {
              this.initQueryManager();
              this.proxy = this.cache;
          }
          return this.proxy;
      };
      return ApolloClient;
  }());

  var testMap = new Map();
  if (testMap.set(1, 2) !== testMap) {
      var set_1 = testMap.set;
      Map.prototype.set = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          set_1.apply(this, args);
          return this;
      };
  }
  var testSet = new Set();
  if (testSet.add(3) !== testSet) {
      var add_1 = testSet.add;
      Set.prototype.add = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          add_1.apply(this, args);
          return this;
      };
  }
  var frozen = {};
  if (typeof Object.freeze === 'function') {
      Object.freeze(frozen);
  }
  try {
      testMap.set(frozen, frozen).delete(frozen);
  }
  catch (_a) {
      var wrap$1 = function (method) {
          return method && (function (obj) {
              try {
                  testMap.set(obj, obj).delete(obj);
              }
              finally {
                  return method.call(Object, obj);
              }
          });
      };
      Object.freeze = wrap$1(Object.freeze);
      Object.seal = wrap$1(Object.seal);
      Object.preventExtensions = wrap$1(Object.preventExtensions);
  }

  function queryFromPojo(obj) {
      var op = {
          kind: 'OperationDefinition',
          operation: 'query',
          name: {
              kind: 'Name',
              value: 'GeneratedClientQuery',
          },
          selectionSet: selectionSetFromObj(obj),
      };
      var out = {
          kind: 'Document',
          definitions: [op],
      };
      return out;
  }
  function fragmentFromPojo(obj, typename) {
      var frag = {
          kind: 'FragmentDefinition',
          typeCondition: {
              kind: 'NamedType',
              name: {
                  kind: 'Name',
                  value: typename || '__FakeType',
              },
          },
          name: {
              kind: 'Name',
              value: 'GeneratedClientQuery',
          },
          selectionSet: selectionSetFromObj(obj),
      };
      var out = {
          kind: 'Document',
          definitions: [frag],
      };
      return out;
  }
  function selectionSetFromObj(obj) {
      if (typeof obj === 'number' ||
          typeof obj === 'boolean' ||
          typeof obj === 'string' ||
          typeof obj === 'undefined' ||
          obj === null) {
          return null;
      }
      if (Array.isArray(obj)) {
          return selectionSetFromObj(obj[0]);
      }
      var selections = [];
      Object.keys(obj).forEach(function (key) {
          var nestedSelSet = selectionSetFromObj(obj[key]);
          var field = {
              kind: 'Field',
              name: {
                  kind: 'Name',
                  value: key,
              },
              selectionSet: nestedSelSet || undefined,
          };
          selections.push(field);
      });
      var selectionSet = {
          kind: 'SelectionSet',
          selections: selections,
      };
      return selectionSet;
  }
  var justTypenameQuery = {
      kind: 'Document',
      definitions: [
          {
              kind: 'OperationDefinition',
              operation: 'query',
              name: null,
              variableDefinitions: null,
              directives: [],
              selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                      {
                          kind: 'Field',
                          alias: null,
                          name: {
                              kind: 'Name',
                              value: '__typename',
                          },
                          arguments: [],
                          directives: [],
                          selectionSet: null,
                      },
                  ],
              },
          },
      ],
  };

  var ApolloCache = (function () {
      function ApolloCache() {
      }
      ApolloCache.prototype.transformDocument = function (document) {
          return document;
      };
      ApolloCache.prototype.transformForLink = function (document) {
          return document;
      };
      ApolloCache.prototype.readQuery = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.read({
              query: options.query,
              variables: options.variables,
              optimistic: optimistic,
          });
      };
      ApolloCache.prototype.readFragment = function (options, optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return this.read({
              query: getFragmentQueryDocument(options.fragment, options.fragmentName),
              variables: options.variables,
              rootId: options.id,
              optimistic: optimistic,
          });
      };
      ApolloCache.prototype.writeQuery = function (options) {
          this.write({
              dataId: 'ROOT_QUERY',
              result: options.data,
              query: options.query,
              variables: options.variables,
          });
      };
      ApolloCache.prototype.writeFragment = function (options) {
          this.write({
              dataId: options.id,
              result: options.data,
              variables: options.variables,
              query: getFragmentQueryDocument(options.fragment, options.fragmentName),
          });
      };
      ApolloCache.prototype.writeData = function (_a) {
          var id = _a.id, data = _a.data;
          if (typeof id !== 'undefined') {
              var typenameResult = null;
              try {
                  typenameResult = this.read({
                      rootId: id,
                      optimistic: false,
                      query: justTypenameQuery,
                  });
              }
              catch (e) {
              }
              var __typename = (typenameResult && typenameResult.__typename) || '__ClientData';
              var dataToWrite = Object.assign({ __typename: __typename }, data);
              this.writeFragment({
                  id: id,
                  fragment: fragmentFromPojo(dataToWrite, __typename),
                  data: dataToWrite,
              });
          }
          else {
              this.writeQuery({ query: queryFromPojo(data), data: data });
          }
      };
      return ApolloCache;
  }());

  function Cache$1(options) {
    this.map = new Map;
    this.newest = null;
    this.oldest = null;
    this.max = options && options.max;
    this.dispose = options && options.dispose;
  }

  var Cache_1 = Cache$1;

  var Cp = Cache$1.prototype;

  Cp.has = function (key) {
    return this.map.has(key);
  };

  Cp.get = function (key) {
    var entry = getEntry(this, key);
    return entry && entry.value;
  };

  function getEntry(cache, key) {
    var entry = cache.map.get(key);
    if (entry &&
        entry !== cache.newest) {
      var older = entry.older;
      var newer = entry.newer;

      if (newer) {
        newer.older = older;
      }

      if (older) {
        older.newer = newer;
      }

      entry.older = cache.newest;
      entry.older.newer = entry;

      entry.newer = null;
      cache.newest = entry;

      if (entry === cache.oldest) {
        cache.oldest = newer;
      }
    }

    return entry;
  }

  Cp.set = function (key, value) {
    var entry = getEntry(this, key);
    if (entry) {
      return entry.value = value;
    }

    entry = {
      key: key,
      value: value,
      newer: null,
      older: this.newest
    };

    if (this.newest) {
      this.newest.newer = entry;
    }

    this.newest = entry;
    this.oldest = this.oldest || entry;

    this.map.set(key, entry);

    return entry.value;
  };

  Cp.clean = function () {
    if (typeof this.max === "number") {
      while (this.oldest &&
             this.map.size > this.max) {
        this.delete(this.oldest.key);
      }
    }
  };

  Cp.delete = function (key) {
    var entry = this.map.get(key);
    if (entry) {
      if (entry === this.newest) {
        this.newest = entry.older;
      }

      if (entry === this.oldest) {
        this.oldest = entry.newer;
      }

      if (entry.newer) {
        entry.newer.older = entry.older;
      }

      if (entry.older) {
        entry.older.newer = entry.newer;
      }

      this.map.delete(key);

      if (typeof this.dispose === "function") {
        this.dispose(key, entry.value);
      }

      return true;
    }

    return false;
  };

  var cache = {
  	Cache: Cache_1
  };

  // Although `Symbol` is widely supported these days, we can safely fall
  // back to using a non-enumerable string property without violating any
  // assumptions elsewhere in the implementation.
  var useSymbol =
    typeof Symbol === "function" &&
    typeof Symbol.for === "function";

  // Used to mark `tuple.prototype` so that all objects that inherit from
  // any `tuple.prototype` object (there could be more than one) will test
  // positive according to `tuple.isTuple`.
  var brand = useSymbol
    ? Symbol.for("immutable-tuple")
    : "@@__IMMUTABLE_TUPLE__@@";

  // Used to save a reference to the globally shared `UniversalWeakMap` that
  // stores all known `tuple` objects.
  var globalKey = useSymbol
    ? Symbol.for("immutable-tuple-root")
    : "@@__IMMUTABLE_TUPLE_ROOT__@@";

  // Convenient helper for defining hidden immutable properties.
  function def(obj, name, value, enumerable) {
    Object.defineProperty(obj, name, {
      value: value,
      enumerable: !! enumerable,
      writable: false,
      configurable: false
    });
    return value;
  }

  var freeze = Object.freeze || function (obj) {
    return obj;
  };

  function isObjRef(value) {
    switch (typeof value) {
    case "object":
      if (value === null) {
        return false;
      }
    case "function":
      return true;
    default:
      return false;
    }
  }

  // The `mustConvertThisToArray` value is true when the corresponding
  // `Array` method does not attempt to modify `this`, which means we can
  // pass a `tuple` object as `this` without first converting it to an
  // `Array`.
  function forEachArrayMethod(fn) {
    function call(name, mustConvertThisToArray) {
      var desc = Object.getOwnPropertyDescriptor(Array.prototype, name);
      fn(name, desc, !! mustConvertThisToArray);
    }

    call("every");
    call("filter");
    call("find");
    call("findIndex");
    call("forEach");
    call("includes");
    call("indexOf");
    call("join");
    call("lastIndexOf");
    call("map");
    call("reduce");
    call("reduceRight");
    call("slice");
    call("some");
    call("toLocaleString");
    call("toString");

    // The `reverse` and `sort` methods are usually destructive, but for
    // `tuple` objects they return a new `tuple` object that has been
    // appropriately reversed/sorted.
    call("reverse", true);
    call("sort", true);

    // Make `[...someTuple]` work.
    call(useSymbol && Symbol.iterator || "@@iterator");
  }

  // A map data structure that holds object keys weakly, yet can also hold
  // non-object keys, unlike the native `WeakMap`.
  var UniversalWeakMap = function UniversalWeakMap() {
    // Since a `WeakMap` cannot hold primitive values as keys, we need a
    // backup `Map` instance to hold primitive keys. Both `this._weakMap`
    // and `this._strongMap` are lazily initialized.
    this._weakMap = null;
    this._strongMap = null;
    this.data = null;
  };

  // Since `get` and `set` are the only methods used, that's all I've
  // implemented here.

  UniversalWeakMap.prototype.get = function get (key) {
    var map = this._getMap(key, false);
    if (map) {
      return map.get(key);
    }
  };

  UniversalWeakMap.prototype.set = function set (key, value) {
    this._getMap(key, true).set(key, value);
    // An actual `Map` or `WeakMap` would return `this` here, but
    // returning the `value` is more convenient for the `tuple`
    // implementation.
    return value;
  };

  UniversalWeakMap.prototype._getMap = function _getMap (key, canCreate) {
    if (! canCreate) {
      return isObjRef(key) ? this._weakMap : this._strongMap;
    }
    if (isObjRef(key)) {
      return this._weakMap || (this._weakMap = new WeakMap);
    }
    return this._strongMap || (this._strongMap = new Map);
  };

  // See [`universal-weak-map.js`](universal-weak-map.html).
  // See [`util.js`](util.html).
  // If this package is installed multiple times, there could be mutiple
  // implementations of the `tuple` function with distinct `tuple.prototype`
  // objects, but the shared pool of `tuple` objects must be the same across
  // all implementations. While it would be ideal to use the `global`
  // object, there's no reliable way to get the global object across all JS
  // environments without using the `Function` constructor, so instead we
  // use the global `Array` constructor as a shared namespace.
  var root$1 = Array[globalKey] || def(Array, globalKey, new UniversalWeakMap, false);

  function lookup() {
    return lookupArray(arguments);
  }

  function lookupArray(array) {
    var node = root$1;

    // Because we are building a tree of *weak* maps, the tree will not
    // prevent objects in tuples from being garbage collected, since the
    // tree itself will be pruned over time when the corresponding `tuple`
    // objects become unreachable. In addition to internalization, this
    // property is a key advantage of the `immutable-tuple` package.
    var len = array.length;
    for (var i = 0; i < len; ++i) {
      var item = array[i];
      node = node.get(item) || node.set(item, new UniversalWeakMap);
    }

    // Return node.data rather than node itself to prevent tampering with
    // the UniversalWeakMap tree.
    return node.data || (node.data = Object.create(null));
  }

  // See [`lookup.js`](lookup.html).
  // See [`util.js`](util.html).
  // When called with any number of arguments, this function returns an
  // object that inherits from `tuple.prototype` and is guaranteed to be
  // `===` any other `tuple` object that has exactly the same items. In
  // computer science jargon, `tuple` instances are "internalized" or just
  // "interned," which allows for constant-time equality checking, and makes
  // it possible for tuple objects to be used as `Map` or `WeakMap` keys, or
  // stored in a `Set`.
  function tuple() {
    var arguments$1 = arguments;

    var node = lookup.apply(null, arguments);

    if (node.tuple) {
      return node.tuple;
    }

    var t = Object.create(tuple.prototype);

    // Define immutable items with numeric indexes, and permanently fix the
    // `.length` property.
    var argc = arguments.length;
    for (var i = 0; i < argc; ++i) {
      t[i] = arguments$1[i];
    }

    def(t, "length", argc, false);

    // Remember this new `tuple` object so that we can return the same object
    // earlier next time.
    return freeze(node.tuple = t);
  }

  // Since the `immutable-tuple` package could be installed multiple times
  // in an application, there is no guarantee that the `tuple` constructor
  // or `tuple.prototype` will be unique, so `value instanceof tuple` is
  // unreliable. Instead, to test if a value is a tuple, you should use
  // `tuple.isTuple(value)`.
  def(tuple.prototype, brand, true, false);
  function isTuple(that) {
    return !! (that && that[brand] === true);
  }

  tuple.isTuple = isTuple;

  function toArray(tuple) {
    var array = [];
    var i = tuple.length;
    while (i--) { array[i] = tuple[i]; }
    return array;
  }

  // Copy all generic non-destructive Array methods to `tuple.prototype`.
  // This works because (for example) `Array.prototype.slice` can be invoked
  // against any `Array`-like object.
  forEachArrayMethod(function (name, desc, mustConvertThisToArray) {
    var method = desc && desc.value;
    if (typeof method === "function") {
      desc.value = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var result = method.apply(
          mustConvertThisToArray ? toArray(this) : this,
          args
        );
        // Of course, `tuple.prototype.slice` should return a `tuple` object,
        // not a new `Array`.
        return Array.isArray(result) ? tuple.apply(void 0, result) : result;
      };
      Object.defineProperty(tuple.prototype, name, desc);
    }
  });

  // Like `Array.prototype.concat`, except for the extra effort required to
  // convert any tuple arguments to arrays, so that
  // ```
  // tuple(1).concat(tuple(2), 3) === tuple(1, 2, 3)
  // ```
  var ref = Array.prototype;
  var concat$1 = ref.concat;
  tuple.prototype.concat = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return tuple.apply(void 0, concat$1.apply(toArray(this), args.map(
      function (item) { return isTuple(item) ? toArray(item) : item; }
    )));
  };

  var tuple$1 = /*#__PURE__*/Object.freeze({
    default: tuple,
    tuple: tuple,
    lookup: lookup,
    lookupArray: lookupArray
  });

  var local = createCommonjsModule(function (module, exports) {

  var fakeNullFiber = new (function Fiber(){});
  var localKey = "_optimism_local";

  function getCurrentFiber() {
    return fakeNullFiber;
  }

  {
    try {
      var Fiber = module["eriuqer".split("").reverse().join("")]("fibers");
      // If we were able to require fibers, redefine the getCurrentFiber
      // function so that it has a chance to return Fiber.current.
      getCurrentFiber = function () {
        return Fiber.current || fakeNullFiber;
      };
    } catch (e) {}
  }

  // Returns an object unique to Fiber.current, if fibers are enabled.
  // This object is used for Fiber-local storage in ./entry.js.
  exports.get = function () {
    var fiber = getCurrentFiber();
    return fiber[localKey] || (fiber[localKey] = Object.create(null));
  };
  });
  var local_1 = local.get;

  var entry = createCommonjsModule(function (module, exports) {

  var getLocal = local.get;
  var UNKNOWN_VALUE = Object.create(null);
  var emptySetPool = [];
  var entryPool = [];

  // Don't let the emptySetPool or entryPool grow larger than this size,
  // since unconstrained pool growth could lead to memory leaks.
  exports.POOL_TARGET_SIZE = 100;

  // Since this package might be used browsers, we should avoid using the
  // Node built-in assert module.
  function assert(condition, optionalMessage) {
    if (! condition) {
      throw new Error(optionalMessage || "assertion failure");
    }
  }

  function Entry(fn, key, args) {
    this.parents = new Set;
    this.childValues = new Map;

    // When this Entry has children that are dirty, this property becomes
    // a Set containing other Entry objects, borrowed from emptySetPool.
    // When the set becomes empty, it gets recycled back to emptySetPool.
    this.dirtyChildren = null;

    reset(this, fn, key, args);

    ++Entry.count;
  }

  Entry.count = 0;

  function reset(entry, fn, key, args) {
    entry.fn = fn;
    entry.key = key;
    entry.args = args;
    entry.value = UNKNOWN_VALUE;
    entry.dirty = true;
    entry.subscribe = null;
    entry.unsubscribe = null;
    entry.recomputing = false;
    // Optional callback that will be invoked when entry.parents becomes
    // empty. The Entry object is given as the first parameter. If the
    // callback returns true, then this entry can be removed from the graph
    // and safely recycled into the entryPool.
    entry.reportOrphan = null;
  }

  Entry.acquire = function (fn, key, args) {
    var entry = entryPool.pop();
    if (entry) {
      reset(entry, fn, key, args);
      return entry;
    }
    return new Entry(fn, key, args);
  };

  function release(entry) {
    assert(entry.parents.size === 0);
    assert(entry.childValues.size === 0);
    assert(entry.dirtyChildren === null);
    if (entryPool.length < exports.POOL_TARGET_SIZE) {
      entryPool.push(entry);
    }
  }

  exports.Entry = Entry;

  var Ep = Entry.prototype;

  // The public API of Entry objects consists of the Entry constructor,
  // along with the recompute, setDirty, and dispose methods.

  Ep.recompute = function recompute() {
    if (! rememberParent(this) &&
        maybeReportOrphan(this)) {
      // The recipient of the entry.reportOrphan callback decided to dispose
      // of this orphan entry by calling entry.dispos(), which recycles it
      // into the entryPool, so we don't need to (and should not) proceed
      // with the recomputation.
      return;
    }

    return recomputeIfDirty(this);
  };

  // If the given entry has a reportOrphan method, and no remaining parents,
  // call entry.reportOrphan and return true iff it returns true. The
  // reportOrphan function should return true to indicate entry.dispose()
  // has been called, and the entry has been removed from any other caches
  // (see index.js for the only current example).
  function maybeReportOrphan(entry) {
    var report = entry.reportOrphan;
    return typeof report === "function" &&
      entry.parents.size === 0 &&
      report(entry) === true;
  }

  Ep.setDirty = function setDirty() {
    if (this.dirty) return;
    this.dirty = true;
    this.value = UNKNOWN_VALUE;
    reportDirty(this);
    // We can go ahead and unsubscribe here, since any further dirty
    // notifications we receive will be redundant, and unsubscribing may
    // free up some resources, e.g. file watchers.
    unsubscribe(this);
  };

  Ep.dispose = function dispose() {
    var entry = this;
    forgetChildren(entry).forEach(maybeReportOrphan);
    unsubscribe(entry);

    // Because this entry has been kicked out of the cache (in index.js),
    // we've lost the ability to find out if/when this entry becomes dirty,
    // whether that happens through a subscription, because of a direct call
    // to entry.setDirty(), or because one of its children becomes dirty.
    // Because of this loss of future information, we have to assume the
    // worst (that this entry might have become dirty very soon), so we must
    // immediately mark this entry's parents as dirty. Normally we could
    // just call entry.setDirty() rather than calling parent.setDirty() for
    // each parent, but that would leave this entry in parent.childValues
    // and parent.dirtyChildren, which would prevent the child from being
    // truly forgotten.
    entry.parents.forEach(function (parent) {
      parent.setDirty();
      forgetChild(parent, entry);
    });

    // Since this entry has no parents and no children anymore, and the
    // caller of Entry#dispose has indicated that entry.value no longer
    // matters, we can safely recycle this Entry object for later use.
    release(entry);
  };

  function setClean(entry) {
    entry.dirty = false;

    if (mightBeDirty(entry)) {
      // This Entry may still have dirty children, in which case we can't
      // let our parents know we're clean just yet.
      return;
    }

    reportClean(entry);
  }

  function reportDirty(entry) {
    entry.parents.forEach(function (parent) {
      reportDirtyChild(parent, entry);
    });
  }

  function reportClean(entry) {
    entry.parents.forEach(function (parent) {
      reportCleanChild(parent, entry);
    });
  }

  function mightBeDirty(entry) {
    return entry.dirty ||
      (entry.dirtyChildren &&
       entry.dirtyChildren.size);
  }

  // Let a parent Entry know that one of its children may be dirty.
  function reportDirtyChild(entry, child) {
    // Must have called rememberParent(child) before calling
    // reportDirtyChild(parent, child).
    assert(entry.childValues.has(child));
    assert(mightBeDirty(child));

    if (! entry.dirtyChildren) {
      entry.dirtyChildren = emptySetPool.pop() || new Set;

    } else if (entry.dirtyChildren.has(child)) {
      // If we already know this child is dirty, then we must have already
      // informed our own parents that we are dirty, so we can terminate
      // the recursion early.
      return;
    }

    entry.dirtyChildren.add(child);
    reportDirty(entry);
  }

  // Let a parent Entry know that one of its children is no longer dirty.
  function reportCleanChild(entry, child) {
    var cv = entry.childValues;

    // Must have called rememberChild(child) before calling
    // reportCleanChild(parent, child).
    assert(cv.has(child));
    assert(! mightBeDirty(child));

    var childValue = cv.get(child);
    if (childValue === UNKNOWN_VALUE) {
      cv.set(child, child.value);
    } else if (childValue !== child.value) {
      entry.setDirty();
    }

    removeDirtyChild(entry, child);

    if (mightBeDirty(entry)) {
      return;
    }

    reportClean(entry);
  }

  function removeDirtyChild(entry, child) {
    var dc = entry.dirtyChildren;
    if (dc) {
      dc.delete(child);
      if (dc.size === 0) {
        if (emptySetPool.length < exports.POOL_TARGET_SIZE) {
          emptySetPool.push(dc);
        }
        entry.dirtyChildren = null;
      }
    }
  }

  function rememberParent(entry) {
    var local$$1 = getLocal();
    var parent = local$$1.currentParentEntry;
    if (parent) {
      entry.parents.add(parent);

      if (! parent.childValues.has(entry)) {
        parent.childValues.set(entry, UNKNOWN_VALUE);
      }

      if (mightBeDirty(entry)) {
        reportDirtyChild(parent, entry);
      } else {
        reportCleanChild(parent, entry);
      }

      return parent;
    }
  }

  // This is the most important method of the Entry API, because it
  // determines whether the cached entry.value can be returned immediately,
  // or must be recomputed. The overall performance of the caching system
  // depends on the truth of the following observations: (1) this.dirty is
  // usually false, (2) this.dirtyChildren is usually null/empty, and thus
  // (3) this.value is usally returned very quickly, without recomputation.
  function recomputeIfDirty(entry) {
    if (entry.dirty) {
      // If this Entry is explicitly dirty because someone called
      // entry.setDirty(), recompute.
      return reallyRecompute(entry);
    }

    if (mightBeDirty(entry)) {
      // Get fresh values for any dirty children, and if those values
      // disagree with this.childValues, mark this Entry explicitly dirty.
      entry.dirtyChildren.forEach(function (child) {
        assert(entry.childValues.has(child));
        try {
          recomputeIfDirty(child);
        } catch (e) {
          entry.setDirty();
        }
      });

      if (entry.dirty) {
        // If this Entry has become explicitly dirty after comparing the fresh
        // values of its dirty children against this.childValues, recompute.
        return reallyRecompute(entry);
      }
    }

    assert(entry.value !== UNKNOWN_VALUE);

    return entry.value;
  }

  function reallyRecompute(entry) {
    assert(! entry.recomputing, "already recomputing");
    entry.recomputing = true;

    // Since this recomputation is likely to re-remember some of this
    // entry's children, we forget our children here but do not call
    // maybeReportOrphan until after the recomputation finishes.
    var originalChildren = forgetChildren(entry);

    var local$$1 = getLocal();
    var parent = local$$1.currentParentEntry;
    local$$1.currentParentEntry = entry;

    var threw = true;
    try {
      entry.value = entry.fn.apply(null, entry.args);
      threw = false;

    } finally {
      entry.recomputing = false;

      assert(local$$1.currentParentEntry === entry);
      local$$1.currentParentEntry = parent;

      if (threw || ! subscribe(entry)) {
        // Mark this Entry dirty if entry.fn threw or we failed to
        // resubscribe. This is important because, if we have a subscribe
        // function and it failed, then we're going to miss important
        // notifications about the potential dirtiness of entry.value.
        entry.setDirty();
      } else {
        // If we successfully recomputed entry.value and did not fail to
        // (re)subscribe, then this Entry is no longer explicitly dirty.
        setClean(entry);
      }
    }

    // Now that we've had a chance to re-remember any children that were
    // involved in the recomputation, we can safely report any orphan
    // children that remain.
    originalChildren.forEach(maybeReportOrphan);

    return entry.value;
  }

  var reusableEmptyArray = [];

  // Removes all children from this entry and returns an array of the
  // removed children.
  function forgetChildren(entry) {
    var children = reusableEmptyArray;

    if (entry.childValues.size > 0) {
      children = [];
      entry.childValues.forEach(function (value, child) {
        forgetChild(entry, child);
        children.push(child);
      });
    }

    // After we forget all our children, this.dirtyChildren must be empty
    // and therefor must have been reset to null.
    assert(entry.dirtyChildren === null);

    return children;
  }

  function forgetChild(entry, child) {
    child.parents.delete(entry);
    entry.childValues.delete(child);
    removeDirtyChild(entry, child);
  }

  function subscribe(entry) {
    if (typeof entry.subscribe === "function") {
      try {
        unsubscribe(entry); // Prevent double subscriptions.
        entry.unsubscribe = entry.subscribe.apply(null, entry.args);
      } catch (e) {
        // If this Entry has a subscribe function and it threw an exception
        // (or an unsubscribe function it previously returned now throws),
        // return false to indicate that we were not able to subscribe (or
        // unsubscribe), and this Entry should remain dirty.
        entry.setDirty();
        return false;
      }
    }

    // Returning true indicates either that there was no entry.subscribe
    // function or that it succeeded.
    return true;
  }

  function unsubscribe(entry) {
    var unsub = entry.unsubscribe;
    if (typeof unsub === "function") {
      entry.unsubscribe = null;
      unsub();
    }
  }
  });
  var entry_1 = entry.POOL_TARGET_SIZE;
  var entry_2 = entry.Entry;

  var require$$1 = getCjsExportFromNamespace(tuple$1);

  var Cache$2 = cache.Cache;
  var tuple$2 = require$$1.tuple;
  var Entry = entry.Entry;
  var getLocal = local.get;

  function normalizeOptions(options) {
    options = options || Object.create(null);

    if (typeof options.makeCacheKey !== "function") {
      options.makeCacheKey = tuple$2;
    }

    if (typeof options.max !== "number") {
      options.max = Math.pow(2, 16);
    }

    return options;
  }

  function wrap$2(fn, options) {
    options = normalizeOptions(options);

    // If this wrapped function is disposable, then its creator does not
    // care about its return value, and it should be removed from the cache
    // immediately when it no longer has any parents that depend on it.
    var disposable = !! options.disposable;

    var cache$$1 = new Cache$2({
      max: options.max,
      dispose: function (key, entry$$1) {
        entry$$1.dispose();
      }
    });

    function reportOrphan(entry$$1) {
      if (disposable) {
        // Triggers the entry.dispose() call above.
        cache$$1.delete(entry$$1.key);
        return true;
      }
    }

    function optimistic() {
      if (disposable && ! getLocal().currentParentEntry) {
        // If there's no current parent computation, and this wrapped
        // function is disposable (meaning we don't care about entry.value,
        // just dependency tracking), then we can short-cut everything else
        // in this function, because entry.recompute() is going to recycle
        // the entry object without recomputing anything, anyway.
        return;
      }

      var key = options.makeCacheKey.apply(null, arguments);
      if (! key) {
        return fn.apply(null, arguments);
      }

      var args = [], len = arguments.length;
      while (len--) args[len] = arguments[len];

      var entry$$1 = cache$$1.get(key);
      if (entry$$1) {
        entry$$1.args = args;
      } else {
        cache$$1.set(key, entry$$1 = Entry.acquire(fn, key, args));
        entry$$1.subscribe = options.subscribe;
        if (disposable) {
          entry$$1.reportOrphan = reportOrphan;
        }
      }

      var value = entry$$1.recompute();

      // Move this entry to the front of the least-recently used queue,
      // since we just finished computing its value.
      cache$$1.set(key, entry$$1);

      // Clean up any excess entries in the cache, but only if this entry
      // has no parents, which means we're not in the middle of a larger
      // computation that might be flummoxed by the cleaning.
      if (entry$$1.parents.size === 0) {
        cache$$1.clean();
      }

      // If options.disposable is truthy, the caller of wrap is telling us
      // they don't care about the result of entry.recompute(), so we should
      // avoid returning the value, so it won't be accidentally used.
      if (! disposable) {
        return value;
      }
    }

    optimistic.dirty = function () {
      var key = options.makeCacheKey.apply(null, arguments);
      if (! key) {
        return;
      }

      if (! cache$$1.has(key)) {
        return;
      }

      cache$$1.get(key).setDirty();
    };

    return optimistic;
  }

  var wrap_1 = wrap$2;

  var haveWarned$1 = false;
  var HeuristicFragmentMatcher = (function () {
      function HeuristicFragmentMatcher() {
      }
      HeuristicFragmentMatcher.prototype.ensureReady = function () {
          return Promise.resolve();
      };
      HeuristicFragmentMatcher.prototype.canBypassInit = function () {
          return true;
      };
      HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
          var obj = context.store.get(idValue.id);
          if (!obj && idValue.id === 'ROOT_QUERY') {
              return true;
          }
          if (!obj) {
              return false;
          }
          if (!obj.__typename) {
              if (!haveWarned$1) {
                  console.warn("You're using fragments in your queries, but either don't have the addTypename:\n  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.\n   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client\n   can accurately match fragments.");
                  console.warn('Could not find __typename on Fragment ', typeCondition, obj);
                  console.warn("DEPRECATION WARNING: using fragments without __typename is unsupported behavior " +
                      "and will be removed in future versions of Apollo client. You should fix this and set addTypename to true now.");
                  if (!isTest()) {
                      haveWarned$1 = true;
                  }
              }
              return 'heuristic';
          }
          if (obj.__typename === typeCondition) {
              return true;
          }
          warnOnceInDevelopment('You are using the simple (heuristic) fragment matcher, but your ' +
              'queries contain union or interface types. Apollo Client will not be ' +
              'able to accurately map fragments. To make this error go away, use ' +
              'the `IntrospectionFragmentMatcher` as described in the docs: ' +
              'https://www.apollographql.com/docs/react/advanced/fragments.html#fragment-matcher', 'error');
          return 'heuristic';
      };
      return HeuristicFragmentMatcher;
  }());

  var CacheKeyNode = (function () {
      function CacheKeyNode() {
          this.children = null;
          this.key = null;
      }
      CacheKeyNode.prototype.lookup = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return this.lookupArray(args);
      };
      CacheKeyNode.prototype.lookupArray = function (array) {
          var node = this;
          array.forEach(function (value) {
              node = node.getOrCreate(value);
          });
          return node.key || (node.key = Object.create(null));
      };
      CacheKeyNode.prototype.getOrCreate = function (value) {
          var map = this.children || (this.children = new Map());
          var node = map.get(value);
          if (!node) {
              map.set(value, (node = new CacheKeyNode()));
          }
          return node;
      };
      return CacheKeyNode;
  }());

  var hasOwn = Object.prototype.hasOwnProperty;
  var DepTrackingCache = (function () {
      function DepTrackingCache(data) {
          if (data === void 0) { data = Object.create(null); }
          var _this = this;
          this.data = data;
          this.depend = wrap_1(function (dataId) { return _this.data[dataId]; }, {
              disposable: true,
              makeCacheKey: function (dataId) {
                  return dataId;
              }
          });
      }
      DepTrackingCache.prototype.toObject = function () {
          return this.data;
      };
      DepTrackingCache.prototype.get = function (dataId) {
          this.depend(dataId);
          return this.data[dataId];
      };
      DepTrackingCache.prototype.set = function (dataId, value) {
          var oldValue = this.data[dataId];
          if (value !== oldValue) {
              this.data[dataId] = value;
              this.depend.dirty(dataId);
          }
      };
      DepTrackingCache.prototype.delete = function (dataId) {
          if (hasOwn.call(this.data, dataId)) {
              delete this.data[dataId];
              this.depend.dirty(dataId);
          }
      };
      DepTrackingCache.prototype.clear = function () {
          this.replace(null);
      };
      DepTrackingCache.prototype.replace = function (newData) {
          var _this = this;
          if (newData) {
              Object.keys(newData).forEach(function (dataId) {
                  _this.set(dataId, newData[dataId]);
              });
              Object.keys(this.data).forEach(function (dataId) {
                  if (!hasOwn.call(newData, dataId)) {
                      _this.delete(dataId);
                  }
              });
          }
          else {
              Object.keys(this.data).forEach(function (dataId) {
                  _this.delete(dataId);
              });
          }
      };
      return DepTrackingCache;
  }());
  function defaultNormalizedCacheFactory(seed) {
      return new DepTrackingCache(seed);
  }

  var StoreReader = (function () {
      function StoreReader(cacheKeyRoot) {
          if (cacheKeyRoot === void 0) { cacheKeyRoot = new CacheKeyNode; }
          var _this = this;
          this.cacheKeyRoot = cacheKeyRoot;
          var reader = this;
          var executeStoreQuery = reader.executeStoreQuery, executeSelectionSet = reader.executeSelectionSet;
          this.executeStoreQuery = wrap_1(function (options) {
              return executeStoreQuery.call(_this, options);
          }, {
              makeCacheKey: function (_a) {
                  var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, fragmentMatcher = _a.fragmentMatcher;
                  if (contextValue.store instanceof DepTrackingCache) {
                      return reader.cacheKeyRoot.lookup(query, contextValue.store, fragmentMatcher, JSON.stringify(variableValues), rootValue.id);
                  }
                  return;
              }
          });
          this.executeSelectionSet = wrap_1(function (options) {
              return executeSelectionSet.call(_this, options);
          }, {
              makeCacheKey: function (_a) {
                  var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
                  if (execContext.contextValue.store instanceof DepTrackingCache) {
                      return reader.cacheKeyRoot.lookup(selectionSet, execContext.contextValue.store, execContext.fragmentMatcher, JSON.stringify(execContext.variableValues), rootValue.id);
                  }
                  return;
              }
          });
      }
      StoreReader.prototype.readQueryFromStore = function (options) {
          var optsPatch = { returnPartialData: false };
          return this.diffQueryAgainstStore(__assign({}, options, optsPatch)).result;
      };
      StoreReader.prototype.diffQueryAgainstStore = function (_a) {
          var store = _a.store, query = _a.query, variables = _a.variables, previousResult = _a.previousResult, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, _c = _a.rootId, rootId = _c === void 0 ? 'ROOT_QUERY' : _c, fragmentMatcherFunction = _a.fragmentMatcherFunction, config = _a.config;
          var queryDefinition = getQueryDefinition(query);
          variables = assign({}, getDefaultValues(queryDefinition), variables);
          var context = {
              store: store,
              dataIdFromObject: (config && config.dataIdFromObject) || null,
              cacheRedirects: (config && config.cacheRedirects) || {},
          };
          var execResult = this.executeStoreQuery({
              query: query,
              rootValue: {
                  type: 'id',
                  id: rootId,
                  generated: true,
                  typename: 'Query',
              },
              contextValue: context,
              variableValues: variables,
              fragmentMatcher: fragmentMatcherFunction,
          });
          var hasMissingFields = execResult.missing && execResult.missing.length > 0;
          if (hasMissingFields && !returnPartialData) {
              execResult.missing.forEach(function (info) {
                  if (info.tolerable)
                      return;
                  throw new Error("Can't find field " + info.fieldName + " on object " + JSON.stringify(info.object, null, 2) + ".");
              });
          }
          if (previousResult) {
              if (isEqual(previousResult, execResult.result)) {
                  execResult.result = previousResult;
              }
          }
          return {
              result: execResult.result,
              complete: !hasMissingFields,
          };
      };
      StoreReader.prototype.executeStoreQuery = function (_a) {
          var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, _b = _a.fragmentMatcher, fragmentMatcher = _b === void 0 ? defaultFragmentMatcher : _b;
          var mainDefinition = getMainDefinition(query);
          var fragments = getFragmentDefinitions(query);
          var fragmentMap = createFragmentMap(fragments);
          var execContext = {
              query: query,
              fragmentMap: fragmentMap,
              contextValue: contextValue,
              variableValues: variableValues,
              fragmentMatcher: fragmentMatcher,
          };
          return this.executeSelectionSet({
              selectionSet: mainDefinition.selectionSet,
              rootValue: rootValue,
              execContext: execContext,
          });
      };
      StoreReader.prototype.executeSelectionSet = function (_a) {
          var _this = this;
          var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
          var fragmentMap = execContext.fragmentMap, contextValue = execContext.contextValue, variables = execContext.variableValues;
          var finalResult = {
              result: {},
          };
          var objectsToMerge = [];
          var object = contextValue.store.get(rootValue.id);
          var typename = (object && object.__typename) ||
              (rootValue.id === 'ROOT_QUERY' && 'Query') ||
              void 0;
          function handleMissing(result) {
              var _a;
              if (result.missing) {
                  finalResult.missing = finalResult.missing || [];
                  (_a = finalResult.missing).push.apply(_a, result.missing);
              }
              return result.result;
          }
          selectionSet.selections.forEach(function (selection) {
              var _a;
              if (!shouldInclude(selection, variables)) {
                  return;
              }
              if (isField(selection)) {
                  var fieldResult = handleMissing(_this.executeField(object, typename, selection, execContext));
                  if (typeof fieldResult !== 'undefined') {
                      objectsToMerge.push((_a = {},
                          _a[resultKeyNameFromField(selection)] = fieldResult,
                          _a));
                  }
              }
              else {
                  var fragment = void 0;
                  if (isInlineFragment(selection)) {
                      fragment = selection;
                  }
                  else {
                      fragment = fragmentMap[selection.name.value];
                      if (!fragment) {
                          throw new Error("No fragment named " + selection.name.value);
                      }
                  }
                  var typeCondition = fragment.typeCondition.name.value;
                  var match = execContext.fragmentMatcher(rootValue, typeCondition, contextValue);
                  if (match) {
                      var fragmentExecResult = _this.executeSelectionSet({
                          selectionSet: fragment.selectionSet,
                          rootValue: rootValue,
                          execContext: execContext,
                      });
                      if (match === 'heuristic' && fragmentExecResult.missing) {
                          fragmentExecResult = __assign({}, fragmentExecResult, { missing: fragmentExecResult.missing.map(function (info) {
                                  return __assign({}, info, { tolerable: true });
                              }) });
                      }
                      objectsToMerge.push(handleMissing(fragmentExecResult));
                  }
              }
          });
          merge(finalResult.result, objectsToMerge);
          return finalResult;
      };
      StoreReader.prototype.executeField = function (object, typename, field, execContext) {
          var variables = execContext.variableValues, contextValue = execContext.contextValue;
          var fieldName = field.name.value;
          var args = argumentsObjectFromField(field, variables);
          var info = {
              resultKey: resultKeyNameFromField(field),
              directives: getDirectiveInfoFromField(field, variables),
          };
          var readStoreResult = readStoreResolver(object, typename, fieldName, args, contextValue, info);
          if (Array.isArray(readStoreResult.result)) {
              return this.combineExecResults(readStoreResult, this.executeSubSelectedArray(field, readStoreResult.result, execContext));
          }
          if (!field.selectionSet) {
              assertSelectionSetForIdValue(field, readStoreResult.result);
              return readStoreResult;
          }
          if (readStoreResult.result == null) {
              return readStoreResult;
          }
          return this.combineExecResults(readStoreResult, this.executeSelectionSet({
              selectionSet: field.selectionSet,
              rootValue: readStoreResult.result,
              execContext: execContext,
          }));
      };
      StoreReader.prototype.combineExecResults = function () {
          var execResults = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              execResults[_i] = arguments[_i];
          }
          var missing = null;
          execResults.forEach(function (execResult) {
              if (execResult.missing) {
                  missing = missing || [];
                  missing.push.apply(missing, execResult.missing);
              }
          });
          return {
              result: execResults.pop().result,
              missing: missing,
          };
      };
      StoreReader.prototype.executeSubSelectedArray = function (field, result, execContext) {
          var _this = this;
          var missing = null;
          function handleMissing(childResult) {
              if (childResult.missing) {
                  missing = missing || [];
                  missing.push.apply(missing, childResult.missing);
              }
              return childResult.result;
          }
          result = result.map(function (item) {
              if (item === null) {
                  return null;
              }
              if (Array.isArray(item)) {
                  return handleMissing(_this.executeSubSelectedArray(field, item, execContext));
              }
              if (field.selectionSet) {
                  return handleMissing(_this.executeSelectionSet({
                      selectionSet: field.selectionSet,
                      rootValue: item,
                      execContext: execContext,
                  }));
              }
              assertSelectionSetForIdValue(field, item);
              return item;
          });
          return { result: result, missing: missing };
      };
      return StoreReader;
  }());
  function assertSelectionSetForIdValue(field, value) {
      if (!field.selectionSet && isIdValue(value)) {
          throw new Error("Missing selection set for object of type " + value.typename + " returned for query field " + field.name.value);
      }
  }
  function defaultFragmentMatcher() {
      return true;
  }
  function readStoreResolver(object, typename, fieldName, args, context, _a) {
      var resultKey = _a.resultKey, directives = _a.directives;
      var storeKeyName = fieldName;
      if (args || directives) {
          storeKeyName = getStoreKeyName(storeKeyName, args, directives);
      }
      var fieldValue = void 0;
      if (object) {
          fieldValue = object[storeKeyName];
          if (typeof fieldValue === 'undefined' &&
              context.cacheRedirects &&
              typeof typename === 'string') {
              var type = context.cacheRedirects[typename];
              if (type) {
                  var resolver = type[fieldName];
                  if (resolver) {
                      fieldValue = resolver(object, args, {
                          getCacheKey: function (storeObj) {
                              return toIdValue({
                                  id: context.dataIdFromObject(storeObj),
                                  typename: storeObj.__typename,
                              });
                          },
                      });
                  }
              }
          }
      }
      if (typeof fieldValue === 'undefined') {
          return {
              result: fieldValue,
              missing: [{
                      object: object,
                      fieldName: storeKeyName,
                      tolerable: false,
                  }],
          };
      }
      if (isJsonValue(fieldValue)) {
          fieldValue = fieldValue.json;
      }
      return {
          result: fieldValue,
      };
  }
  var hasOwn$1 = Object.prototype.hasOwnProperty;
  function merge(target, sources) {
      var pastCopies = [];
      sources.forEach(function (source) {
          mergeHelper(target, source, pastCopies);
      });
      return target;
  }
  function mergeHelper(target, source, pastCopies) {
      if (source !== null && typeof source === 'object') {
          if (Object.isExtensible && !Object.isExtensible(target)) {
              target = shallowCopyForMerge(target, pastCopies);
          }
          Object.keys(source).forEach(function (sourceKey) {
              var sourceValue = source[sourceKey];
              if (hasOwn$1.call(target, sourceKey)) {
                  var targetValue = target[sourceKey];
                  if (sourceValue !== targetValue) {
                      target[sourceKey] = mergeHelper(shallowCopyForMerge(targetValue, pastCopies), sourceValue, pastCopies);
                  }
              }
              else {
                  target[sourceKey] = sourceValue;
              }
          });
      }
      return target;
  }
  function shallowCopyForMerge(value, pastCopies) {
      if (value !== null &&
          typeof value === 'object' &&
          pastCopies.indexOf(value) < 0) {
          if (Array.isArray(value)) {
              value = value.slice(0);
          }
          else {
              value = __assign({}, value);
          }
          pastCopies.push(value);
      }
      return value;
  }

  var ObjectCache = (function () {
      function ObjectCache(data) {
          if (data === void 0) { data = Object.create(null); }
          this.data = data;
      }
      ObjectCache.prototype.toObject = function () {
          return this.data;
      };
      ObjectCache.prototype.get = function (dataId) {
          return this.data[dataId];
      };
      ObjectCache.prototype.set = function (dataId, value) {
          this.data[dataId] = value;
      };
      ObjectCache.prototype.delete = function (dataId) {
          this.data[dataId] = void 0;
      };
      ObjectCache.prototype.clear = function () {
          this.data = Object.create(null);
      };
      ObjectCache.prototype.replace = function (newData) {
          this.data = newData || Object.create(null);
      };
      return ObjectCache;
  }());

  var WriteError = (function (_super) {
      __extends(WriteError, _super);
      function WriteError() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.type = 'WriteError';
          return _this;
      }
      return WriteError;
  }(Error));
  function enhanceErrorWithDocument(error, document) {
      var enhancedError = new WriteError("Error writing result to store for query:\n " + JSON.stringify(document));
      enhancedError.message += '\n' + error.message;
      enhancedError.stack = error.stack;
      return enhancedError;
  }
  var StoreWriter = (function () {
      function StoreWriter() {
      }
      StoreWriter.prototype.writeQueryToStore = function (_a) {
          var query = _a.query, result = _a.result, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
          return this.writeResultToStore({
              dataId: 'ROOT_QUERY',
              result: result,
              document: query,
              store: store,
              variables: variables,
              dataIdFromObject: dataIdFromObject,
              fragmentMatcherFunction: fragmentMatcherFunction,
          });
      };
      StoreWriter.prototype.writeResultToStore = function (_a) {
          var dataId = _a.dataId, result = _a.result, document = _a.document, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
          var operationDefinition = getOperationDefinition(document);
          try {
              return this.writeSelectionSetToStore({
                  result: result,
                  dataId: dataId,
                  selectionSet: operationDefinition.selectionSet,
                  context: {
                      store: store,
                      processedData: {},
                      variables: assign({}, getDefaultValues(operationDefinition), variables),
                      dataIdFromObject: dataIdFromObject,
                      fragmentMap: createFragmentMap(getFragmentDefinitions(document)),
                      fragmentMatcherFunction: fragmentMatcherFunction,
                  },
              });
          }
          catch (e) {
              throw enhanceErrorWithDocument(e, document);
          }
      };
      StoreWriter.prototype.writeSelectionSetToStore = function (_a) {
          var _this = this;
          var result = _a.result, dataId = _a.dataId, selectionSet = _a.selectionSet, context = _a.context;
          var variables = context.variables, store = context.store, fragmentMap = context.fragmentMap;
          selectionSet.selections.forEach(function (selection) {
              if (!shouldInclude(selection, variables)) {
                  return;
              }
              if (isField(selection)) {
                  var resultFieldKey = resultKeyNameFromField(selection);
                  var value = result[resultFieldKey];
                  if (typeof value !== 'undefined') {
                      _this.writeFieldToStore({
                          dataId: dataId,
                          value: value,
                          field: selection,
                          context: context,
                      });
                  }
                  else {
                      var isDefered = selection.directives &&
                          selection.directives.length &&
                          selection.directives.some(function (directive) { return directive.name && directive.name.value === 'defer'; });
                      if (!isDefered && context.fragmentMatcherFunction) {
                          if (!isProduction()) {
                              console.warn("Missing field " + resultFieldKey + " in " + JSON.stringify(result, null, 2).substring(0, 100));
                          }
                      }
                  }
              }
              else {
                  var fragment = void 0;
                  if (isInlineFragment(selection)) {
                      fragment = selection;
                  }
                  else {
                      fragment = (fragmentMap || {})[selection.name.value];
                      if (!fragment) {
                          throw new Error("No fragment named " + selection.name.value + ".");
                      }
                  }
                  var matches = true;
                  if (context.fragmentMatcherFunction && fragment.typeCondition) {
                      var idValue = toIdValue({ id: 'self', typename: undefined });
                      var fakeContext = {
                          store: new ObjectCache({ self: result }),
                          cacheRedirects: {},
                      };
                      var match = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
                      if (!isProduction() && match === 'heuristic') {
                          console.error('WARNING: heuristic fragment matching going on!');
                      }
                      matches = !!match;
                  }
                  if (matches) {
                      _this.writeSelectionSetToStore({
                          result: result,
                          selectionSet: fragment.selectionSet,
                          dataId: dataId,
                          context: context,
                      });
                  }
              }
          });
          return store;
      };
      StoreWriter.prototype.writeFieldToStore = function (_a) {
          var field = _a.field, value = _a.value, dataId = _a.dataId, context = _a.context;
          var _b;
          var variables = context.variables, dataIdFromObject = context.dataIdFromObject, store = context.store;
          var storeValue;
          var storeObject;
          var storeFieldName = storeKeyNameFromField(field, variables);
          if (!field.selectionSet || value === null) {
              storeValue =
                  value != null && typeof value === 'object'
                      ?
                          { type: 'json', json: value }
                      :
                          value;
          }
          else if (Array.isArray(value)) {
              var generatedId = dataId + "." + storeFieldName;
              storeValue = this.processArrayValue(value, generatedId, field.selectionSet, context);
          }
          else {
              var valueDataId = dataId + "." + storeFieldName;
              var generated = true;
              if (!isGeneratedId(valueDataId)) {
                  valueDataId = '$' + valueDataId;
              }
              if (dataIdFromObject) {
                  var semanticId = dataIdFromObject(value);
                  if (semanticId && isGeneratedId(semanticId)) {
                      throw new Error('IDs returned by dataIdFromObject cannot begin with the "$" character.');
                  }
                  if (semanticId ||
                      (typeof semanticId === 'number' && semanticId === 0)) {
                      valueDataId = semanticId;
                      generated = false;
                  }
              }
              if (!isDataProcessed(valueDataId, field, context.processedData)) {
                  this.writeSelectionSetToStore({
                      dataId: valueDataId,
                      result: value,
                      selectionSet: field.selectionSet,
                      context: context,
                  });
              }
              var typename = value.__typename;
              storeValue = toIdValue({ id: valueDataId, typename: typename }, generated);
              storeObject = store.get(dataId);
              var escapedId = storeObject && storeObject[storeFieldName];
              if (escapedId !== storeValue && isIdValue(escapedId)) {
                  var hadTypename = escapedId.typename !== undefined;
                  var hasTypename = typename !== undefined;
                  var typenameChanged = hadTypename && hasTypename && escapedId.typename !== typename;
                  if (generated && !escapedId.generated && !typenameChanged) {
                      throw new Error("Store error: the application attempted to write an object with no provided id" +
                          (" but the store already contains an id of " + escapedId.id + " for this object. The selectionSet") +
                          " that was trying to be written is:\n" +
                          JSON.stringify(field));
                  }
                  if (hadTypename && !hasTypename) {
                      throw new Error("Store error: the application attempted to write an object with no provided typename" +
                          (" but the store already contains an object with typename of " + escapedId.typename + " for the object of id " + escapedId.id + ". The selectionSet") +
                          " that was trying to be written is:\n" +
                          JSON.stringify(field));
                  }
                  if (escapedId.generated) {
                      if (typenameChanged) {
                          if (!generated) {
                              store.delete(escapedId.id);
                          }
                      }
                      else {
                          mergeWithGenerated(escapedId.id, storeValue.id, store);
                      }
                  }
              }
          }
          storeObject = store.get(dataId);
          if (!storeObject || !isEqual(storeValue, storeObject[storeFieldName])) {
              store.set(dataId, __assign({}, storeObject, (_b = {}, _b[storeFieldName] = storeValue, _b)));
          }
      };
      StoreWriter.prototype.processArrayValue = function (value, generatedId, selectionSet, context) {
          var _this = this;
          return value.map(function (item, index) {
              if (item === null) {
                  return null;
              }
              var itemDataId = generatedId + "." + index;
              if (Array.isArray(item)) {
                  return _this.processArrayValue(item, itemDataId, selectionSet, context);
              }
              var generated = true;
              if (context.dataIdFromObject) {
                  var semanticId = context.dataIdFromObject(item);
                  if (semanticId) {
                      itemDataId = semanticId;
                      generated = false;
                  }
              }
              if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
                  _this.writeSelectionSetToStore({
                      dataId: itemDataId,
                      result: item,
                      selectionSet: selectionSet,
                      context: context,
                  });
              }
              return toIdValue({ id: itemDataId, typename: item.__typename }, generated);
          });
      };
      return StoreWriter;
  }());
  function isGeneratedId(id) {
      return id[0] === '$';
  }
  function mergeWithGenerated(generatedKey, realKey, cache) {
      if (generatedKey === realKey) {
          return false;
      }
      var generated = cache.get(generatedKey);
      var real = cache.get(realKey);
      var madeChanges = false;
      Object.keys(generated).forEach(function (key) {
          var value = generated[key];
          var realValue = real[key];
          if (isIdValue(value) &&
              isGeneratedId(value.id) &&
              isIdValue(realValue) &&
              !isEqual(value, realValue) &&
              mergeWithGenerated(value.id, realValue.id, cache)) {
              madeChanges = true;
          }
      });
      cache.delete(generatedKey);
      var newRealValue = __assign({}, generated, real);
      if (isEqual(newRealValue, real)) {
          return madeChanges;
      }
      cache.set(realKey, newRealValue);
      return true;
  }
  function isDataProcessed(dataId, field, processedData) {
      if (!processedData) {
          return false;
      }
      if (processedData[dataId]) {
          if (processedData[dataId].indexOf(field) >= 0) {
              return true;
          }
          else {
              processedData[dataId].push(field);
          }
      }
      else {
          processedData[dataId] = [field];
      }
      return false;
  }

  var defaultConfig = {
      fragmentMatcher: new HeuristicFragmentMatcher(),
      dataIdFromObject: defaultDataIdFromObject,
      addTypename: true,
      resultCaching: true,
  };
  function defaultDataIdFromObject(result) {
      if (result.__typename) {
          if (result.id !== undefined) {
              return result.__typename + ":" + result.id;
          }
          if (result._id !== undefined) {
              return result.__typename + ":" + result._id;
          }
      }
      return null;
  }
  var hasOwn$2 = Object.prototype.hasOwnProperty;
  var OptimisticCacheLayer = (function (_super) {
      __extends(OptimisticCacheLayer, _super);
      function OptimisticCacheLayer(optimisticId, parent, transaction) {
          var _this = _super.call(this, Object.create(null)) || this;
          _this.optimisticId = optimisticId;
          _this.parent = parent;
          _this.transaction = transaction;
          return _this;
      }
      OptimisticCacheLayer.prototype.toObject = function () {
          return __assign({}, this.parent.toObject(), this.data);
      };
      OptimisticCacheLayer.prototype.get = function (dataId) {
          return hasOwn$2.call(this.data, dataId)
              ? this.data[dataId]
              : this.parent.get(dataId);
      };
      return OptimisticCacheLayer;
  }(ObjectCache));
  var InMemoryCache = (function (_super) {
      __extends(InMemoryCache, _super);
      function InMemoryCache(config) {
          if (config === void 0) { config = {}; }
          var _this = _super.call(this) || this;
          _this.watches = new Set();
          _this.typenameDocumentCache = new Map();
          _this.cacheKeyRoot = new CacheKeyNode();
          _this.silenceBroadcast = false;
          _this.config = __assign({}, defaultConfig, config);
          if (_this.config.customResolvers) {
              console.warn('customResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating customResolvers in the next major version.');
              _this.config.cacheRedirects = _this.config.customResolvers;
          }
          if (_this.config.cacheResolvers) {
              console.warn('cacheResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating cacheResolvers in the next major version.');
              _this.config.cacheRedirects = _this.config.cacheResolvers;
          }
          _this.addTypename = _this.config.addTypename;
          _this.data = _this.config.resultCaching
              ? new DepTrackingCache()
              : new ObjectCache();
          _this.optimisticData = _this.data;
          _this.storeReader = new StoreReader(_this.cacheKeyRoot);
          _this.storeWriter = new StoreWriter();
          var cache = _this;
          var maybeBroadcastWatch = cache.maybeBroadcastWatch;
          _this.maybeBroadcastWatch = wrap_1(function (c) {
              return maybeBroadcastWatch.call(_this, c);
          }, {
              makeCacheKey: function (c) {
                  if (c.optimistic) {
                      return;
                  }
                  if (c.previousResult) {
                      return;
                  }
                  if (cache.data instanceof DepTrackingCache) {
                      return cache.cacheKeyRoot.lookup(c.query, JSON.stringify(c.variables));
                  }
              }
          });
          return _this;
      }
      InMemoryCache.prototype.restore = function (data) {
          if (data)
              this.data.replace(data);
          return this;
      };
      InMemoryCache.prototype.extract = function (optimistic) {
          if (optimistic === void 0) { optimistic = false; }
          return (optimistic ? this.optimisticData : this.data).toObject();
      };
      InMemoryCache.prototype.read = function (options) {
          if (typeof options.rootId === 'string' &&
              typeof this.data.get(options.rootId) === 'undefined') {
              return null;
          }
          return this.storeReader.readQueryFromStore({
              store: options.optimistic ? this.optimisticData : this.data,
              query: this.transformDocument(options.query),
              variables: options.variables,
              rootId: options.rootId,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
              previousResult: options.previousResult,
              config: this.config,
          });
      };
      InMemoryCache.prototype.write = function (write) {
          this.storeWriter.writeResultToStore({
              dataId: write.dataId,
              result: write.result,
              variables: write.variables,
              document: this.transformDocument(write.query),
              store: this.data,
              dataIdFromObject: this.config.dataIdFromObject,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
          });
          this.broadcastWatches();
      };
      InMemoryCache.prototype.diff = function (query) {
          return this.storeReader.diffQueryAgainstStore({
              store: query.optimistic ? this.optimisticData : this.data,
              query: this.transformDocument(query.query),
              variables: query.variables,
              returnPartialData: query.returnPartialData,
              previousResult: query.previousResult,
              fragmentMatcherFunction: this.config.fragmentMatcher.match,
              config: this.config,
          });
      };
      InMemoryCache.prototype.watch = function (watch) {
          var _this = this;
          this.watches.add(watch);
          return function () {
              _this.watches.delete(watch);
          };
      };
      InMemoryCache.prototype.evict = function (query) {
          throw new Error("eviction is not implemented on InMemory Cache");
      };
      InMemoryCache.prototype.reset = function () {
          this.data.clear();
          this.broadcastWatches();
          return Promise.resolve();
      };
      InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
          var toReapply = [];
          var removedCount = 0;
          var layer = this.optimisticData;
          while (layer instanceof OptimisticCacheLayer) {
              if (layer.optimisticId === idToRemove) {
                  ++removedCount;
              }
              else {
                  toReapply.push(layer);
              }
              layer = layer.parent;
          }
          if (removedCount > 0) {
              this.optimisticData = layer;
              while (toReapply.length > 0) {
                  var layer_1 = toReapply.pop();
                  this.performTransaction(layer_1.transaction, layer_1.optimisticId);
              }
              this.broadcastWatches();
          }
      };
      InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
          var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
          this.silenceBroadcast = true;
          if (typeof optimisticId === 'string') {
              this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
          }
          try {
              transaction(this);
          }
          finally {
              this.silenceBroadcast = silenceBroadcast;
              this.data = data;
          }
          this.broadcastWatches();
      };
      InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
          return this.performTransaction(transaction, id);
      };
      InMemoryCache.prototype.transformDocument = function (document) {
          if (this.addTypename) {
              var result = this.typenameDocumentCache.get(document);
              if (!result) {
                  result = addTypenameToDocument(document);
                  this.typenameDocumentCache.set(document, result);
                  this.typenameDocumentCache.set(result, result);
              }
              return result;
          }
          return document;
      };
      InMemoryCache.prototype.broadcastWatches = function () {
          var _this = this;
          if (!this.silenceBroadcast) {
              this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c); });
          }
      };
      InMemoryCache.prototype.maybeBroadcastWatch = function (c) {
          c.callback(this.diff({
              query: c.query,
              variables: c.variables,
              previousResult: c.previousResult && c.previousResult(),
              optimistic: c.optimistic,
          }));
      };
      return InMemoryCache;
  }(ApolloCache));

  var __assign$2 = (undefined && undefined.__assign) || function () {
      __assign$2 = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign$2.apply(this, arguments);
  };
  var defaultHttpOptions = {
      includeQuery: true,
      includeExtensions: false,
  };
  var defaultHeaders = {
      // headers are case insensitive (https://stackoverflow.com/a/5259004)
      accept: '*/*',
      'content-type': 'application/json',
  };
  var defaultOptions = {
      method: 'POST',
  };
  var fallbackHttpConfig = {
      http: defaultHttpOptions,
      headers: defaultHeaders,
      options: defaultOptions,
  };
  var throwServerError = function (response, result, message) {
      var error = new Error(message);
      error.name = 'ServerError';
      error.response = response;
      error.statusCode = response.status;
      error.result = result;
      throw error;
  };
  //TODO: when conditional types come in ts 2.8, operations should be a generic type that extends Operation | Array<Operation>
  var parseAndCheckHttpResponse = function (operations) { return function (response) {
      return (response
          .text()
          .then(function (bodyText) {
          try {
              return JSON.parse(bodyText);
          }
          catch (err) {
              var parseError = err;
              parseError.name = 'ServerParseError';
              parseError.response = response;
              parseError.statusCode = response.status;
              parseError.bodyText = bodyText;
              return Promise.reject(parseError);
          }
      })
          //TODO: when conditional types come out then result should be T extends Array ? Array<FetchResult> : FetchResult
          .then(function (result) {
          if (response.status >= 300) {
              //Network error
              throwServerError(response, result, "Response not successful: Received status code " + response.status);
          }
          //TODO should really error per response in a Batch based on properties
          //    - could be done in a validation link
          if (!Array.isArray(result) &&
              !result.hasOwnProperty('data') &&
              !result.hasOwnProperty('errors')) {
              //Data error
              throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                  ? operations.map(function (op) { return op.operationName; })
                  : operations.operationName) + "'.");
          }
          return result;
      }));
  }; };
  var checkFetcher = function (fetcher) {
      if (!fetcher && typeof fetch === 'undefined') {
          var library = 'unfetch';
          if (typeof window === 'undefined')
              library = 'node-fetch';
          throw new Error("\nfetch is not found globally and no fetcher passed, to fix pass a fetch for\nyour environment like https://www.npmjs.com/package/" + library + ".\n\nFor example:\nimport fetch from '" + library + "';\nimport { createHttpLink } from 'apollo-link-http';\n\nconst link = createHttpLink({ uri: '/graphql', fetch: fetch });");
      }
  };
  var createSignalIfSupported = function () {
      if (typeof AbortController === 'undefined')
          return { controller: false, signal: false };
      var controller = new AbortController();
      var signal = controller.signal;
      return { controller: controller, signal: signal };
  };
  var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
      var configs = [];
      for (var _i = 2; _i < arguments.length; _i++) {
          configs[_i - 2] = arguments[_i];
      }
      var options = __assign$2({}, fallbackConfig.options, { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
      var http = fallbackConfig.http;
      /*
       * use the rest of the configs to populate the options
       * configs later in the list will overwrite earlier fields
       */
      configs.forEach(function (config) {
          options = __assign$2({}, options, config.options, { headers: __assign$2({}, options.headers, config.headers) });
          if (config.credentials)
              options.credentials = config.credentials;
          http = __assign$2({}, http, config.http);
      });
      //The body depends on the http options
      var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
      var body = { operationName: operationName, variables: variables };
      if (http.includeExtensions)
          body.extensions = extensions;
      // not sending the query (i.e persisted queries)
      if (http.includeQuery)
          body.query = print(query);
      return {
          options: options,
          body: body,
      };
  };
  var serializeFetchParameter = function (p, label) {
      var serialized;
      try {
          serialized = JSON.stringify(p);
      }
      catch (e) {
          var parseError = new Error("Network request failed. " + label + " is not serializable: " + e.message);
          parseError.parseError = e;
          throw parseError;
      }
      return serialized;
  };
  //selects "/graphql" by default
  var selectURI = function (operation, fallbackURI) {
      var context = operation.getContext();
      var contextURI = context.uri;
      if (contextURI) {
          return contextURI;
      }
      else if (typeof fallbackURI === 'function') {
          return fallbackURI(operation);
      }
      else {
          return fallbackURI || '/graphql';
      }
  };

  /* tslint:disable */
  var __extends$3 = (undefined && undefined.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  var __assign$3 = (undefined && undefined.__assign) || function () {
      __assign$3 = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                  t[p] = s[p];
          }
          return t;
      };
      return __assign$3.apply(this, arguments);
  };
  var __rest$1 = (undefined && undefined.__rest) || function (s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
              t[p[i]] = s[p[i]];
      return t;
  };
  var createHttpLink = function (linkOptions) {
      if (linkOptions === void 0) { linkOptions = {}; }
      var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, 
      // use default global fetch is nothing passed in
      fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, requestOptions = __rest$1(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries"]);
      // dev warnings to ensure fetch is present
      checkFetcher(fetcher);
      //fetcher is set here rather than the destructuring to ensure fetch is
      //declared before referencing it. Reference in the destructuring would cause
      //a ReferenceError
      if (!fetcher) {
          fetcher = fetch;
      }
      var linkConfig = {
          http: { includeExtensions: includeExtensions },
          options: requestOptions.fetchOptions,
          credentials: requestOptions.credentials,
          headers: requestOptions.headers,
      };
      return new ApolloLink(function (operation) {
          var chosenURI = selectURI(operation, uri);
          var context = operation.getContext();
          // `apollographql-client-*` headers are automatically set if a
          // `clientAwareness` object is found in the context. These headers are
          // set first, followed by the rest of the headers pulled from
          // `context.headers`. If desired, `apollographql-client-*` headers set by
          // the `clientAwareness` object can be overridden by
          // `apollographql-client-*` headers set in `context.headers`.
          var clientAwarenessHeaders = {};
          if (context.clientAwareness) {
              var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
              if (name_1) {
                  clientAwarenessHeaders['apollographql-client-name'] = name_1;
              }
              if (version) {
                  clientAwarenessHeaders['apollographql-client-version'] = version;
              }
          }
          var contextHeaders = __assign$3({}, clientAwarenessHeaders, context.headers);
          var contextConfig = {
              http: context.http,
              options: context.fetchOptions,
              credentials: context.credentials,
              headers: contextHeaders,
          };
          //uses fallback, link, and then context to build options
          var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
          var controller;
          if (!options.signal) {
              var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
              controller = _controller;
              if (controller)
                  options.signal = signal;
          }
          // If requested, set method to GET if there are no mutations.
          var definitionIsMutation = function (d) {
              return d.kind === 'OperationDefinition' && d.operation === 'mutation';
          };
          if (useGETForQueries &&
              !operation.query.definitions.some(definitionIsMutation)) {
              options.method = 'GET';
          }
          if (options.method === 'GET') {
              var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
              if (parseError) {
                  return fromError(parseError);
              }
              chosenURI = newURI;
          }
          else {
              try {
                  options.body = serializeFetchParameter(body, 'Payload');
              }
              catch (parseError) {
                  return fromError(parseError);
              }
          }
          return new Observable$1(function (observer) {
              fetcher(chosenURI, options)
                  .then(function (response) {
                  operation.setContext({ response: response });
                  return response;
              })
                  .then(parseAndCheckHttpResponse(operation))
                  .then(function (result) {
                  // we have data and can send it to back up the link chain
                  observer.next(result);
                  observer.complete();
                  return result;
              })
                  .catch(function (err) {
                  // fetch was cancelled so its already been cleaned up in the unsubscribe
                  if (err.name === 'AbortError')
                      return;
                  // if it is a network error, BUT there is graphql result info
                  // fire the next observer before calling error
                  // this gives apollo-client (and react-apollo) the `graphqlErrors` and `networErrors`
                  // to pass to UI
                  // this should only happen if we *also* have data as part of the response key per
                  // the spec
                  if (err.result && err.result.errors && err.result.data) {
                      // if we dont' call next, the UI can only show networkError because AC didn't
                      // get andy graphqlErrors
                      // this is graphql execution result info (i.e errors and possibly data)
                      // this is because there is no formal spec how errors should translate to
                      // http status codes. So an auth error (401) could have both data
                      // from a public field, errors from a private field, and a status of 401
                      // {
                      //  user { // this will have errors
                      //    firstName
                      //  }
                      //  products { // this is public so will have data
                      //    cost
                      //  }
                      // }
                      //
                      // the result of above *could* look like this:
                      // {
                      //   data: { products: [{ cost: "$10" }] },
                      //   errors: [{
                      //      message: 'your session has timed out',
                      //      path: []
                      //   }]
                      // }
                      // status code of above would be a 401
                      // in the UI you want to show data where you can, errors as data where you can
                      // and use correct http status codes
                      observer.next(err.result);
                  }
                  observer.error(err);
              });
              return function () {
                  // XXX support canceling this request
                  // https://developers.google.com/web/updates/2017/09/abortable-fetch
                  if (controller)
                      controller.abort();
              };
          });
      });
  };
  // For GET operations, returns the given URI rewritten with parameters, or a
  // parse error.
  function rewriteURIForGET(chosenURI, body) {
      // Implement the standard HTTP GET serialization, plus 'extensions'. Note
      // the extra level of JSON serialization!
      var queryParams = [];
      var addQueryParam = function (key, value) {
          queryParams.push(key + "=" + encodeURIComponent(value));
      };
      if ('query' in body) {
          addQueryParam('query', body.query);
      }
      if (body.operationName) {
          addQueryParam('operationName', body.operationName);
      }
      if (body.variables) {
          var serializedVariables = void 0;
          try {
              serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
          }
          catch (parseError) {
              return { parseError: parseError };
          }
          addQueryParam('variables', serializedVariables);
      }
      if (body.extensions) {
          var serializedExtensions = void 0;
          try {
              serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
          }
          catch (parseError) {
              return { parseError: parseError };
          }
          addQueryParam('extensions', serializedExtensions);
      }
      // Reconstruct the URI with added query params.
      // XXX This assumes that the URI is well-formed and that it doesn't
      //     already contain any of these query params. We could instead use the
      //     URL API and take a polyfill (whatwg-url@6) for older browsers that
      //     don't support URLSearchParams. Note that some browsers (and
      //     versions of whatwg-url) support URL but not URLSearchParams!
      var fragment = '', preFragment = chosenURI;
      var fragmentStart = chosenURI.indexOf('#');
      if (fragmentStart !== -1) {
          fragment = chosenURI.substr(fragmentStart);
          preFragment = chosenURI.substr(0, fragmentStart);
      }
      var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
      var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
      return { newURI: newURI };
  }
  var HttpLink = /** @class */ (function (_super) {
      __extends$3(HttpLink, _super);
      function HttpLink(opts) {
          return _super.call(this, createHttpLink(opts).request) || this;
      }
      return HttpLink;
  }(ApolloLink));

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * The `defineToJSON()` function defines toJSON() and inspect() prototype
   * methods, if no function provided they become aliases for toString().
   */

  function defineToJSON( // eslint-disable-next-line flowtype/no-weak-types
  classObject) {
    var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : classObject.prototype.toString;
    classObject.prototype.toJSON = fn;
    classObject.prototype.inspect = fn;

    if (nodejsCustomInspectSymbol) {
      classObject.prototype[nodejsCustomInspectSymbol] = fn;
    }
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  function invariant(condition, message) {
    /* istanbul ignore else */
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The `defineToStringTag()` function checks first to see if the runtime
   * supports the `Symbol` class and then if the `Symbol.toStringTag` constant
   * is defined as a `Symbol` instance. If both conditions are met, the
   * Symbol.toStringTag property is defined as a getter that returns the
   * supplied class constructor's name.
   *
   * @method defineToStringTag
   *
   * @param {Class<any>} classObject a class such as Object, String, Number but
   * typically one of your own creation through the class keyword; `class A {}`,
   * for example.
   */
  function defineToStringTag(classObject) {
    if (typeof Symbol === 'function' && Symbol.toStringTag) {
      Object.defineProperty(classObject.prototype, Symbol.toStringTag, {
        get: function get() {
          return this.constructor.name;
        }
      });
    }
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * A representation of source input to GraphQL.
   * `name` and `locationOffset` are optional. They are useful for clients who
   * store GraphQL documents in source files; for example, if the GraphQL input
   * starts at line 40 in a file named Foo.graphql, it might be useful for name to
   * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
   * line and column in locationOffset are 1-indexed
   */
  var Source = function Source(body, name, locationOffset) {
    this.body = body;
    this.name = name || 'GraphQL request';
    this.locationOffset = locationOffset || {
      line: 1,
      column: 1
    };
    !(this.locationOffset.line > 0) ? invariant(0, 'line in locationOffset is 1-indexed and must be positive') : void 0;
    !(this.locationOffset.column > 0) ? invariant(0, 'column in locationOffset is 1-indexed and must be positive') : void 0;
  }; // Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported

  defineToStringTag(Source);

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Represents a location in a Source.
   */

  /**
   * Takes a Source and a UTF-8 character offset, and returns the corresponding
   * line and column as a SourceLocation.
   */
  function getLocation(source, position) {
    var lineRegexp = /\r\n|[\n\r]/g;
    var line = 1;
    var column = position + 1;
    var match;

    while ((match = lineRegexp.exec(source.body)) && match.index < position) {
      line += 1;
      column = position + 1 - (match.index + match[0].length);
    }

    return {
      line: line,
      column: column
    };
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Prints a GraphQLError to a string, representing useful location information
   * about the error's position in the source.
   */
  function printError(error) {
    var printedLocations = [];

    if (error.nodes) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = error.nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var node = _step.value;

          if (node.loc) {
            printedLocations.push(highlightSourceAtLocation(node.loc.source, getLocation(node.loc.source, node.loc.start)));
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    } else if (error.source && error.locations) {
      var source = error.source;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = error.locations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var location = _step2.value;
          printedLocations.push(highlightSourceAtLocation(source, location));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    return printedLocations.length === 0 ? error.message : [error.message].concat(printedLocations).join('\n\n') + '\n';
  }
  /**
   * Render a helpful description of the location of the error in the GraphQL
   * Source document.
   */

  function highlightSourceAtLocation(source, location) {
    var firstLineColumnOffset = source.locationOffset.column - 1;
    var body = whitespace(firstLineColumnOffset) + source.body;
    var lineIndex = location.line - 1;
    var lineOffset = source.locationOffset.line - 1;
    var lineNum = location.line + lineOffset;
    var columnOffset = location.line === 1 ? firstLineColumnOffset : 0;
    var columnNum = location.column + columnOffset;
    var lines = body.split(/\r\n|[\n\r]/g);
    return "".concat(source.name, " (").concat(lineNum, ":").concat(columnNum, ")\n") + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
    ["".concat(lineNum - 1, ": "), lines[lineIndex - 1]], ["".concat(lineNum, ": "), lines[lineIndex]], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1, ": "), lines[lineIndex + 1]]]);
  }

  function printPrefixedLines(lines) {
    var existingLines = lines.filter(function (_ref) {
      var _ = _ref[0],
          line = _ref[1];
      return line !== undefined;
    });
    var padLen = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = existingLines[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _ref4 = _step3.value;
        var prefix = _ref4[0];
        padLen = Math.max(padLen, prefix.length);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return existingLines.map(function (_ref3) {
      var prefix = _ref3[0],
          line = _ref3[1];
      return lpad(padLen, prefix) + line;
    }).join('\n');
  }

  function whitespace(len) {
    return Array(len + 1).join(' ');
  }

  function lpad(len, str) {
    return whitespace(len - str.length) + str;
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  function GraphQLError( // eslint-disable-line no-redeclare
  message, nodes, source, positions, path, originalError, extensions) {
    // Compute list of blame nodes.
    var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


    var _source = source;

    if (!_source && _nodes) {
      var node = _nodes[0];
      _source = node && node.loc && node.loc.source;
    }

    var _positions = positions;

    if (!_positions && _nodes) {
      _positions = _nodes.reduce(function (list, node) {
        if (node.loc) {
          list.push(node.loc.start);
        }

        return list;
      }, []);
    }

    if (_positions && _positions.length === 0) {
      _positions = undefined;
    }

    var _locations;

    if (positions && source) {
      _locations = positions.map(function (pos) {
        return getLocation(source, pos);
      });
    } else if (_nodes) {
      _locations = _nodes.reduce(function (list, node) {
        if (node.loc) {
          list.push(getLocation(node.loc.source, node.loc.start));
        }

        return list;
      }, []);
    }

    var _extensions = extensions || originalError && originalError.extensions;

    Object.defineProperties(this, {
      message: {
        value: message,
        // By being enumerable, JSON.stringify will include `message` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: true,
        writable: true
      },
      locations: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: _locations || undefined,
        // By being enumerable, JSON.stringify will include `locations` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(_locations)
      },
      path: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: path || undefined,
        // By being enumerable, JSON.stringify will include `path` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(path)
      },
      nodes: {
        value: _nodes || undefined
      },
      source: {
        value: _source || undefined
      },
      positions: {
        value: _positions || undefined
      },
      originalError: {
        value: originalError
      },
      extensions: {
        // Coercing falsey values to undefined ensures they will not be included
        // in JSON.stringify() when not provided.
        value: _extensions || undefined,
        // By being enumerable, JSON.stringify will include `path` in the
        // resulting output. This ensures that the simplest possible GraphQL
        // service adheres to the spec.
        enumerable: Boolean(_extensions)
      }
    }); // Include (non-enumerable) stack trace.

    if (originalError && originalError.stack) {
      Object.defineProperty(this, 'stack', {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    } else {
      Object.defineProperty(this, 'stack', {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
  }
  GraphQLError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: GraphQLError
    },
    name: {
      value: 'GraphQLError'
    },
    toString: {
      value: function toString() {
        return printError(this);
      }
    }
  });

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Produces a GraphQLError representing a syntax error, containing useful
   * descriptive information about the syntax error's position in the source.
   */

  function syntaxError(source, position, description) {
    return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * Produces the value of a block string from its parsed raw value, similar to
   * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
   *
   * This implements the GraphQL spec's BlockStringValue() static algorithm.
   */
  function blockStringValue(rawString) {
    // Expand a block string's raw value into independent lines.
    var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

    var commonIndent = null;

    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      var indent = leadingWhitespace(line);

      if (indent < line.length && (commonIndent === null || indent < commonIndent)) {
        commonIndent = indent;

        if (commonIndent === 0) {
          break;
        }
      }
    }

    if (commonIndent) {
      for (var _i = 1; _i < lines.length; _i++) {
        lines[_i] = lines[_i].slice(commonIndent);
      }
    } // Remove leading and trailing blank lines.


    while (lines.length > 0 && isBlank(lines[0])) {
      lines.shift();
    }

    while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
      lines.pop();
    } // Return a string of the lines joined with U+000A.


    return lines.join('\n');
  }

  function leadingWhitespace(str) {
    var i = 0;

    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
      i++;
    }

    return i;
  }

  function isBlank(str) {
    return leadingWhitespace(str) === str.length;
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Given a Source object, this returns a Lexer for that source.
   * A Lexer is a stateful stream generator in that every time
   * it is advanced, it returns the next token in the Source. Assuming the
   * source lexes, the final Token emitted by the lexer will be of kind
   * EOF, after which the lexer will repeatedly return the same EOF token
   * whenever called.
   */

  function createLexer(source, options) {
    var startOfFileToken = new Tok(TokenKind.SOF, 0, 0, 0, 0, null);
    var lexer = {
      source: source,
      options: options,
      lastToken: startOfFileToken,
      token: startOfFileToken,
      line: 1,
      lineStart: 0,
      advance: advanceLexer,
      lookahead: lookahead
    };
    return lexer;
  }

  function advanceLexer() {
    this.lastToken = this.token;
    var token = this.token = this.lookahead();
    return token;
  }

  function lookahead() {
    var token = this.token;

    if (token.kind !== TokenKind.EOF) {
      do {
        // Note: next is only mutable during parsing, so we cast to allow this.
        token = token.next || (token.next = readToken(this, token));
      } while (token.kind === TokenKind.COMMENT);
    }

    return token;
  }
  /**
   * The return type of createLexer.
   */


  /**
   * An exported enum describing the different kinds of tokens that the
   * lexer emits.
   */
  var TokenKind = Object.freeze({
    SOF: '<SOF>',
    EOF: '<EOF>',
    BANG: '!',
    DOLLAR: '$',
    AMP: '&',
    PAREN_L: '(',
    PAREN_R: ')',
    SPREAD: '...',
    COLON: ':',
    EQUALS: '=',
    AT: '@',
    BRACKET_L: '[',
    BRACKET_R: ']',
    BRACE_L: '{',
    PIPE: '|',
    BRACE_R: '}',
    NAME: 'Name',
    INT: 'Int',
    FLOAT: 'Float',
    STRING: 'String',
    BLOCK_STRING: 'BlockString',
    COMMENT: 'Comment'
  });
  /**
   * The enum type representing the token kinds values.
   */

  /**
   * A helper function to describe a token as a string for debugging
   */
  function getTokenDesc(token) {
    var value = token.value;
    return value ? "".concat(token.kind, " \"").concat(value, "\"") : token.kind;
  }
  var charCodeAt = String.prototype.charCodeAt;
  var slice$1 = String.prototype.slice;
  /**
   * Helper function for constructing the Token object.
   */

  function Tok(kind, start, end, line, column, prev, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = prev;
    this.next = null;
  } // Print a simplified form when appearing in JSON/util.inspect.


  defineToJSON(Tok, function () {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  });

  function printCharCode(code) {
    return (// NaN/undefined represents access beyond the end of the file.
      isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
      code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
      "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
    );
  }
  /**
   * Gets the next token from the source starting at the given position.
   *
   * This skips over whitespace until it finds the next lexable token, then lexes
   * punctuators immediately or calls the appropriate helper function for more
   * complicated tokens.
   */


  function readToken(lexer, prev) {
    var source = lexer.source;
    var body = source.body;
    var bodyLength = body.length;
    var pos = positionAfterWhitespace(body, prev.end, lexer);
    var line = lexer.line;
    var col = 1 + pos - lexer.lineStart;

    if (pos >= bodyLength) {
      return new Tok(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
    }

    var code = charCodeAt.call(body, pos); // SourceCharacter

    switch (code) {
      // !
      case 33:
        return new Tok(TokenKind.BANG, pos, pos + 1, line, col, prev);
      // #

      case 35:
        return readComment(source, pos, line, col, prev);
      // $

      case 36:
        return new Tok(TokenKind.DOLLAR, pos, pos + 1, line, col, prev);
      // &

      case 38:
        return new Tok(TokenKind.AMP, pos, pos + 1, line, col, prev);
      // (

      case 40:
        return new Tok(TokenKind.PAREN_L, pos, pos + 1, line, col, prev);
      // )

      case 41:
        return new Tok(TokenKind.PAREN_R, pos, pos + 1, line, col, prev);
      // .

      case 46:
        if (charCodeAt.call(body, pos + 1) === 46 && charCodeAt.call(body, pos + 2) === 46) {
          return new Tok(TokenKind.SPREAD, pos, pos + 3, line, col, prev);
        }

        break;
      // :

      case 58:
        return new Tok(TokenKind.COLON, pos, pos + 1, line, col, prev);
      // =

      case 61:
        return new Tok(TokenKind.EQUALS, pos, pos + 1, line, col, prev);
      // @

      case 64:
        return new Tok(TokenKind.AT, pos, pos + 1, line, col, prev);
      // [

      case 91:
        return new Tok(TokenKind.BRACKET_L, pos, pos + 1, line, col, prev);
      // ]

      case 93:
        return new Tok(TokenKind.BRACKET_R, pos, pos + 1, line, col, prev);
      // {

      case 123:
        return new Tok(TokenKind.BRACE_L, pos, pos + 1, line, col, prev);
      // |

      case 124:
        return new Tok(TokenKind.PIPE, pos, pos + 1, line, col, prev);
      // }

      case 125:
        return new Tok(TokenKind.BRACE_R, pos, pos + 1, line, col, prev);
      // A-Z _ a-z

      case 65:
      case 66:
      case 67:
      case 68:
      case 69:
      case 70:
      case 71:
      case 72:
      case 73:
      case 74:
      case 75:
      case 76:
      case 77:
      case 78:
      case 79:
      case 80:
      case 81:
      case 82:
      case 83:
      case 84:
      case 85:
      case 86:
      case 87:
      case 88:
      case 89:
      case 90:
      case 95:
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
      case 108:
      case 109:
      case 110:
      case 111:
      case 112:
      case 113:
      case 114:
      case 115:
      case 116:
      case 117:
      case 118:
      case 119:
      case 120:
      case 121:
      case 122:
        return readName(source, pos, line, col, prev);
      // - 0-9

      case 45:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return readNumber(source, pos, code, line, col, prev);
      // "

      case 34:
        if (charCodeAt.call(body, pos + 1) === 34 && charCodeAt.call(body, pos + 2) === 34) {
          return readBlockString(source, pos, line, col, prev, lexer);
        }

        return readString(source, pos, line, col, prev);
    }

    throw syntaxError(source, pos, unexpectedCharacterMessage(code));
  }
  /**
   * Report a message that an unexpected character was encountered.
   */


  function unexpectedCharacterMessage(code) {
    if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
      return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
    }

    if (code === 39) {
      // '
      return "Unexpected single quote character ('), did you mean to use " + 'a double quote (")?';
    }

    return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
  }
  /**
   * Reads from body starting at startPosition until it finds a non-whitespace
   * character, then returns the position of that character for lexing.
   */


  function positionAfterWhitespace(body, startPosition, lexer) {
    var bodyLength = body.length;
    var position = startPosition;

    while (position < bodyLength) {
      var code = charCodeAt.call(body, position); // tab | space | comma | BOM

      if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
        ++position;
      } else if (code === 10) {
        // new line
        ++position;
        ++lexer.line;
        lexer.lineStart = position;
      } else if (code === 13) {
        // carriage return
        if (charCodeAt.call(body, position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }

        ++lexer.line;
        lexer.lineStart = position;
      } else {
        break;
      }
    }

    return position;
  }
  /**
   * Reads a comment token from the source file.
   *
   * #[\u0009\u0020-\uFFFF]*
   */


  function readComment(source, start, line, col, prev) {
    var body = source.body;
    var code;
    var position = start;

    do {
      code = charCodeAt.call(body, ++position);
    } while (code !== null && ( // SourceCharacter but not LineTerminator
    code > 0x001f || code === 0x0009));

    return new Tok(TokenKind.COMMENT, start, position, line, col, prev, slice$1.call(body, start + 1, position));
  }
  /**
   * Reads a number token from the source file, either a float
   * or an int depending on whether a decimal point appears.
   *
   * Int:   -?(0|[1-9][0-9]*)
   * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
   */


  function readNumber(source, start, firstCode, line, col, prev) {
    var body = source.body;
    var code = firstCode;
    var position = start;
    var isFloat = false;

    if (code === 45) {
      // -
      code = charCodeAt.call(body, ++position);
    }

    if (code === 48) {
      // 0
      code = charCodeAt.call(body, ++position);

      if (code >= 48 && code <= 57) {
        throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
      }
    } else {
      position = readDigits(source, position, code);
      code = charCodeAt.call(body, position);
    }

    if (code === 46) {
      // .
      isFloat = true;
      code = charCodeAt.call(body, ++position);
      position = readDigits(source, position, code);
      code = charCodeAt.call(body, position);
    }

    if (code === 69 || code === 101) {
      // E e
      isFloat = true;
      code = charCodeAt.call(body, ++position);

      if (code === 43 || code === 45) {
        // + -
        code = charCodeAt.call(body, ++position);
      }

      position = readDigits(source, position, code);
    }

    return new Tok(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, slice$1.call(body, start, position));
  }
  /**
   * Returns the new position in the source after reading digits.
   */


  function readDigits(source, start, firstCode) {
    var body = source.body;
    var position = start;
    var code = firstCode;

    if (code >= 48 && code <= 57) {
      // 0 - 9
      do {
        code = charCodeAt.call(body, ++position);
      } while (code >= 48 && code <= 57); // 0 - 9


      return position;
    }

    throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
  }
  /**
   * Reads a string token from the source file.
   *
   * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
   */


  function readString(source, start, line, col, prev) {
    var body = source.body;
    var position = start + 1;
    var chunkStart = position;
    var code = 0;
    var value = '';

    while (position < body.length && (code = charCodeAt.call(body, position)) !== null && // not LineTerminator
    code !== 0x000a && code !== 0x000d) {
      // Closing Quote (")
      if (code === 34) {
        value += slice$1.call(body, chunkStart, position);
        return new Tok(TokenKind.STRING, start, position + 1, line, col, prev, value);
      } // SourceCharacter


      if (code < 0x0020 && code !== 0x0009) {
        throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
      }

      ++position;

      if (code === 92) {
        // \
        value += slice$1.call(body, chunkStart, position - 1);
        code = charCodeAt.call(body, position);

        switch (code) {
          case 34:
            value += '"';
            break;

          case 47:
            value += '/';
            break;

          case 92:
            value += '\\';
            break;

          case 98:
            value += '\b';
            break;

          case 102:
            value += '\f';
            break;

          case 110:
            value += '\n';
            break;

          case 114:
            value += '\r';
            break;

          case 116:
            value += '\t';
            break;

          case 117:
            // u
            var charCode = uniCharCode(charCodeAt.call(body, position + 1), charCodeAt.call(body, position + 2), charCodeAt.call(body, position + 3), charCodeAt.call(body, position + 4));

            if (charCode < 0) {
              throw syntaxError(source, position, 'Invalid character escape sequence: ' + "\\u".concat(body.slice(position + 1, position + 5), "."));
            }

            value += String.fromCharCode(charCode);
            position += 4;
            break;

          default:
            throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
        }

        ++position;
        chunkStart = position;
      }
    }

    throw syntaxError(source, position, 'Unterminated string.');
  }
  /**
   * Reads a block string token from the source file.
   *
   * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
   */


  function readBlockString(source, start, line, col, prev, lexer) {
    var body = source.body;
    var position = start + 3;
    var chunkStart = position;
    var code = 0;
    var rawValue = '';

    while (position < body.length && (code = charCodeAt.call(body, position)) !== null) {
      // Closing Triple-Quote (""")
      if (code === 34 && charCodeAt.call(body, position + 1) === 34 && charCodeAt.call(body, position + 2) === 34) {
        rawValue += slice$1.call(body, chunkStart, position);
        return new Tok(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, blockStringValue(rawValue));
      } // SourceCharacter


      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
      }

      if (code === 10) {
        // new line
        ++position;
        ++lexer.line;
        lexer.lineStart = position;
      } else if (code === 13) {
        // carriage return
        if (charCodeAt.call(body, position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }

        ++lexer.line;
        lexer.lineStart = position;
      } else if ( // Escape Triple-Quote (\""")
      code === 92 && charCodeAt.call(body, position + 1) === 34 && charCodeAt.call(body, position + 2) === 34 && charCodeAt.call(body, position + 3) === 34) {
        rawValue += slice$1.call(body, chunkStart, position) + '"""';
        position += 4;
        chunkStart = position;
      } else {
        ++position;
      }
    }

    throw syntaxError(source, position, 'Unterminated string.');
  }
  /**
   * Converts four hexadecimal chars to the integer that the
   * string represents. For example, uniCharCode('0','0','0','f')
   * will return 15, and uniCharCode('0','0','f','f') returns 255.
   *
   * Returns a negative number on error, if a char was invalid.
   *
   * This is implemented by noting that char2hex() returns -1 on error,
   * which means the result of ORing the char2hex() will also be negative.
   */


  function uniCharCode(a, b, c, d) {
    return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
  }
  /**
   * Converts a hex character to its integer value.
   * '0' becomes 0, '9' becomes 9
   * 'A' becomes 10, 'F' becomes 15
   * 'a' becomes 10, 'f' becomes 15
   *
   * Returns -1 on error.
   */


  function char2hex(a) {
    return a >= 48 && a <= 57 ? a - 48 // 0-9
    : a >= 65 && a <= 70 ? a - 55 // A-F
    : a >= 97 && a <= 102 ? a - 87 // a-f
    : -1;
  }
  /**
   * Reads an alphanumeric + underscore name from the source.
   *
   * [_A-Za-z][_0-9A-Za-z]*
   */


  function readName(source, start, line, col, prev) {
    var body = source.body;
    var bodyLength = body.length;
    var position = start + 1;
    var code = 0;

    while (position !== bodyLength && (code = charCodeAt.call(body, position)) !== null && (code === 95 || // _
    code >= 48 && code <= 57 || // 0-9
    code >= 65 && code <= 90 || // A-Z
    code >= 97 && code <= 122) // a-z
    ) {
      ++position;
    }

    return new Tok(TokenKind.NAME, start, position, line, col, prev, slice$1.call(body, start, position));
  }

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The set of allowed kind values for AST nodes.
   */
  var Kind = Object.freeze({
    // Name
    NAME: 'Name',
    // Document
    DOCUMENT: 'Document',
    OPERATION_DEFINITION: 'OperationDefinition',
    VARIABLE_DEFINITION: 'VariableDefinition',
    SELECTION_SET: 'SelectionSet',
    FIELD: 'Field',
    ARGUMENT: 'Argument',
    // Fragments
    FRAGMENT_SPREAD: 'FragmentSpread',
    INLINE_FRAGMENT: 'InlineFragment',
    FRAGMENT_DEFINITION: 'FragmentDefinition',
    // Values
    VARIABLE: 'Variable',
    INT: 'IntValue',
    FLOAT: 'FloatValue',
    STRING: 'StringValue',
    BOOLEAN: 'BooleanValue',
    NULL: 'NullValue',
    ENUM: 'EnumValue',
    LIST: 'ListValue',
    OBJECT: 'ObjectValue',
    OBJECT_FIELD: 'ObjectField',
    // Directives
    DIRECTIVE: 'Directive',
    // Types
    NAMED_TYPE: 'NamedType',
    LIST_TYPE: 'ListType',
    NON_NULL_TYPE: 'NonNullType',
    // Type System Definitions
    SCHEMA_DEFINITION: 'SchemaDefinition',
    OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
    // Type Definitions
    SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
    OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
    FIELD_DEFINITION: 'FieldDefinition',
    INPUT_VALUE_DEFINITION: 'InputValueDefinition',
    INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
    UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
    ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
    ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
    INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
    // Directive Definitions
    DIRECTIVE_DEFINITION: 'DirectiveDefinition',
    // Type System Extensions
    SCHEMA_EXTENSION: 'SchemaExtension',
    // Type Extensions
    SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
    OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
    INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
    UNION_TYPE_EXTENSION: 'UnionTypeExtension',
    ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
    INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
  });
  /**
   * The enum type representing the possible kind values of AST nodes.
   */

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */

  /**
   * The set of allowed directive location values.
   */
  var DirectiveLocation = Object.freeze({
    // Request Definitions
    QUERY: 'QUERY',
    MUTATION: 'MUTATION',
    SUBSCRIPTION: 'SUBSCRIPTION',
    FIELD: 'FIELD',
    FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
    FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
    INLINE_FRAGMENT: 'INLINE_FRAGMENT',
    VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
    // Type System Definitions
    SCHEMA: 'SCHEMA',
    SCALAR: 'SCALAR',
    OBJECT: 'OBJECT',
    FIELD_DEFINITION: 'FIELD_DEFINITION',
    ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
    INTERFACE: 'INTERFACE',
    UNION: 'UNION',
    ENUM: 'ENUM',
    ENUM_VALUE: 'ENUM_VALUE',
    INPUT_OBJECT: 'INPUT_OBJECT',
    INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
  });
  /**
   * The enum type representing the directive location values.
   */

  /**
   * Copyright (c) 2015-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *
   * 
   */
  /**
   * Configuration options to control parser behavior
   */

  /**
   * Given a GraphQL source, parses it into a Document.
   * Throws GraphQLError if a syntax error is encountered.
   */
  function parse$1(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;

    if (!(sourceObj instanceof Source)) {
      throw new TypeError("Must provide Source. Received: ".concat(inspect(sourceObj)));
    }

    var lexer = createLexer(sourceObj, options || {});
    return parseDocument(lexer);
  }
  /**
   * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
   * that value.
   * Throws GraphQLError if a syntax error is encountered.
   *
   * This is useful within tools that operate upon GraphQL Values directly and
   * in isolation of complete GraphQL documents.
   *
   * Consider providing the results to the utility function: valueFromAST().
   */

  function parseValue(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;
    var lexer = createLexer(sourceObj, options || {});
    expect(lexer, TokenKind.SOF);
    var value = parseValueLiteral(lexer, false);
    expect(lexer, TokenKind.EOF);
    return value;
  }
  /**
   * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
   * that type.
   * Throws GraphQLError if a syntax error is encountered.
   *
   * This is useful within tools that operate upon GraphQL Types directly and
   * in isolation of complete GraphQL documents.
   *
   * Consider providing the results to the utility function: typeFromAST().
   */

  function parseType(source, options) {
    var sourceObj = typeof source === 'string' ? new Source(source) : source;
    var lexer = createLexer(sourceObj, options || {});
    expect(lexer, TokenKind.SOF);
    var type = parseTypeReference(lexer);
    expect(lexer, TokenKind.EOF);
    return type;
  }
  /**
   * Converts a name lex token into a name parse node.
   */

  function parseName(lexer) {
    var token = expect(lexer, TokenKind.NAME);
    return {
      kind: Kind.NAME,
      value: token.value,
      loc: loc(lexer, token)
    };
  } // Implements the parsing rules in the Document section.

  /**
   * Document : Definition+
   */


  function parseDocument(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.DOCUMENT,
      definitions: many(lexer, TokenKind.SOF, parseDefinition, TokenKind.EOF),
      loc: loc(lexer, start)
    };
  }
  /**
   * Definition :
   *   - ExecutableDefinition
   *   - TypeSystemDefinition
   *   - TypeSystemExtension
   */


  function parseDefinition(lexer) {
    if (peek(lexer, TokenKind.NAME)) {
      switch (lexer.token.value) {
        case 'query':
        case 'mutation':
        case 'subscription':
        case 'fragment':
          return parseExecutableDefinition(lexer);

        case 'schema':
        case 'scalar':
        case 'type':
        case 'interface':
        case 'union':
        case 'enum':
        case 'input':
        case 'directive':
          return parseTypeSystemDefinition(lexer);

        case 'extend':
          return parseTypeSystemExtension(lexer);
      }
    } else if (peek(lexer, TokenKind.BRACE_L)) {
      return parseExecutableDefinition(lexer);
    } else if (peekDescription(lexer)) {
      return parseTypeSystemDefinition(lexer);
    }

    throw unexpected(lexer);
  }
  /**
   * ExecutableDefinition :
   *   - OperationDefinition
   *   - FragmentDefinition
   */


  function parseExecutableDefinition(lexer) {
    if (peek(lexer, TokenKind.NAME)) {
      switch (lexer.token.value) {
        case 'query':
        case 'mutation':
        case 'subscription':
          return parseOperationDefinition(lexer);

        case 'fragment':
          return parseFragmentDefinition(lexer);
      }
    } else if (peek(lexer, TokenKind.BRACE_L)) {
      return parseOperationDefinition(lexer);
    }

    throw unexpected(lexer);
  } // Implements the parsing rules in the Operations section.

  /**
   * OperationDefinition :
   *  - SelectionSet
   *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
   */


  function parseOperationDefinition(lexer) {
    var start = lexer.token;

    if (peek(lexer, TokenKind.BRACE_L)) {
      return {
        kind: Kind.OPERATION_DEFINITION,
        operation: 'query',
        name: undefined,
        variableDefinitions: [],
        directives: [],
        selectionSet: parseSelectionSet(lexer),
        loc: loc(lexer, start)
      };
    }

    var operation = parseOperationType(lexer);
    var name;

    if (peek(lexer, TokenKind.NAME)) {
      name = parseName(lexer);
    }

    return {
      kind: Kind.OPERATION_DEFINITION,
      operation: operation,
      name: name,
      variableDefinitions: parseVariableDefinitions(lexer),
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * OperationType : one of query mutation subscription
   */


  function parseOperationType(lexer) {
    var operationToken = expect(lexer, TokenKind.NAME);

    switch (operationToken.value) {
      case 'query':
        return 'query';

      case 'mutation':
        return 'mutation';

      case 'subscription':
        return 'subscription';
    }

    throw unexpected(lexer, operationToken);
  }
  /**
   * VariableDefinitions : ( VariableDefinition+ )
   */


  function parseVariableDefinitions(lexer) {
    return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, parseVariableDefinition, TokenKind.PAREN_R) : [];
  }
  /**
   * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
   */


  function parseVariableDefinition(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.VARIABLE_DEFINITION,
      variable: parseVariable(lexer),
      type: (expect(lexer, TokenKind.COLON), parseTypeReference(lexer)),
      defaultValue: skip(lexer, TokenKind.EQUALS) ? parseValueLiteral(lexer, true) : undefined,
      directives: parseDirectives(lexer, true),
      loc: loc(lexer, start)
    };
  }
  /**
   * Variable : $ Name
   */


  function parseVariable(lexer) {
    var start = lexer.token;
    expect(lexer, TokenKind.DOLLAR);
    return {
      kind: Kind.VARIABLE,
      name: parseName(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * SelectionSet : { Selection+ }
   */


  function parseSelectionSet(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.SELECTION_SET,
      selections: many(lexer, TokenKind.BRACE_L, parseSelection, TokenKind.BRACE_R),
      loc: loc(lexer, start)
    };
  }
  /**
   * Selection :
   *   - Field
   *   - FragmentSpread
   *   - InlineFragment
   */


  function parseSelection(lexer) {
    return peek(lexer, TokenKind.SPREAD) ? parseFragment(lexer) : parseField(lexer);
  }
  /**
   * Field : Alias? Name Arguments? Directives? SelectionSet?
   *
   * Alias : Name :
   */


  function parseField(lexer) {
    var start = lexer.token;
    var nameOrAlias = parseName(lexer);
    var alias;
    var name;

    if (skip(lexer, TokenKind.COLON)) {
      alias = nameOrAlias;
      name = parseName(lexer);
    } else {
      name = nameOrAlias;
    }

    return {
      kind: Kind.FIELD,
      alias: alias,
      name: name,
      arguments: parseArguments(lexer, false),
      directives: parseDirectives(lexer, false),
      selectionSet: peek(lexer, TokenKind.BRACE_L) ? parseSelectionSet(lexer) : undefined,
      loc: loc(lexer, start)
    };
  }
  /**
   * Arguments[Const] : ( Argument[?Const]+ )
   */


  function parseArguments(lexer, isConst) {
    var item = isConst ? parseConstArgument : parseArgument;
    return peek(lexer, TokenKind.PAREN_L) ? many(lexer, TokenKind.PAREN_L, item, TokenKind.PAREN_R) : [];
  }
  /**
   * Argument[Const] : Name : Value[?Const]
   */


  function parseArgument(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.ARGUMENT,
      name: parseName(lexer),
      value: (expect(lexer, TokenKind.COLON), parseValueLiteral(lexer, false)),
      loc: loc(lexer, start)
    };
  }

  function parseConstArgument(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.ARGUMENT,
      name: parseName(lexer),
      value: (expect(lexer, TokenKind.COLON), parseConstValue(lexer)),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Fragments section.

  /**
   * Corresponds to both FragmentSpread and InlineFragment in the spec.
   *
   * FragmentSpread : ... FragmentName Directives?
   *
   * InlineFragment : ... TypeCondition? Directives? SelectionSet
   */


  function parseFragment(lexer) {
    var start = lexer.token;
    expect(lexer, TokenKind.SPREAD);
    var hasTypeCondition = skipKeyword(lexer, 'on');

    if (!hasTypeCondition && peek(lexer, TokenKind.NAME)) {
      return {
        kind: Kind.FRAGMENT_SPREAD,
        name: parseFragmentName(lexer),
        directives: parseDirectives(lexer, false),
        loc: loc(lexer, start)
      };
    }

    return {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? parseNamedType(lexer) : undefined,
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * FragmentDefinition :
   *   - fragment FragmentName on TypeCondition Directives? SelectionSet
   *
   * TypeCondition : NamedType
   */


  function parseFragmentDefinition(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'fragment'); // Experimental support for defining variables within fragments changes
    // the grammar of FragmentDefinition:
    //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

    if (lexer.options.experimentalFragmentVariables) {
      return {
        kind: Kind.FRAGMENT_DEFINITION,
        name: parseFragmentName(lexer),
        variableDefinitions: parseVariableDefinitions(lexer),
        typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
        directives: parseDirectives(lexer, false),
        selectionSet: parseSelectionSet(lexer),
        loc: loc(lexer, start)
      };
    }

    return {
      kind: Kind.FRAGMENT_DEFINITION,
      name: parseFragmentName(lexer),
      typeCondition: (expectKeyword(lexer, 'on'), parseNamedType(lexer)),
      directives: parseDirectives(lexer, false),
      selectionSet: parseSelectionSet(lexer),
      loc: loc(lexer, start)
    };
  }
  /**
   * FragmentName : Name but not `on`
   */


  function parseFragmentName(lexer) {
    if (lexer.token.value === 'on') {
      throw unexpected(lexer);
    }

    return parseName(lexer);
  } // Implements the parsing rules in the Values section.

  /**
   * Value[Const] :
   *   - [~Const] Variable
   *   - IntValue
   *   - FloatValue
   *   - StringValue
   *   - BooleanValue
   *   - NullValue
   *   - EnumValue
   *   - ListValue[?Const]
   *   - ObjectValue[?Const]
   *
   * BooleanValue : one of `true` `false`
   *
   * NullValue : `null`
   *
   * EnumValue : Name but not `true`, `false` or `null`
   */


  function parseValueLiteral(lexer, isConst) {
    var token = lexer.token;

    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return parseList(lexer, isConst);

      case TokenKind.BRACE_L:
        return parseObject(lexer, isConst);

      case TokenKind.INT:
        lexer.advance();
        return {
          kind: Kind.INT,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.FLOAT:
        lexer.advance();
        return {
          kind: Kind.FLOAT,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return parseStringLiteral(lexer);

      case TokenKind.NAME:
        if (token.value === 'true' || token.value === 'false') {
          lexer.advance();
          return {
            kind: Kind.BOOLEAN,
            value: token.value === 'true',
            loc: loc(lexer, token)
          };
        } else if (token.value === 'null') {
          lexer.advance();
          return {
            kind: Kind.NULL,
            loc: loc(lexer, token)
          };
        }

        lexer.advance();
        return {
          kind: Kind.ENUM,
          value: token.value,
          loc: loc(lexer, token)
        };

      case TokenKind.DOLLAR:
        if (!isConst) {
          return parseVariable(lexer);
        }

        break;
    }

    throw unexpected(lexer);
  }

  function parseStringLiteral(lexer) {
    var token = lexer.token;
    lexer.advance();
    return {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING,
      loc: loc(lexer, token)
    };
  }

  function parseConstValue(lexer) {
    return parseValueLiteral(lexer, true);
  }

  function parseValueValue(lexer) {
    return parseValueLiteral(lexer, false);
  }
  /**
   * ListValue[Const] :
   *   - [ ]
   *   - [ Value[?Const]+ ]
   */


  function parseList(lexer, isConst) {
    var start = lexer.token;
    var item = isConst ? parseConstValue : parseValueValue;
    return {
      kind: Kind.LIST,
      values: any(lexer, TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectValue[Const] :
   *   - { }
   *   - { ObjectField[?Const]+ }
   */


  function parseObject(lexer, isConst) {
    var start = lexer.token;
    expect(lexer, TokenKind.BRACE_L);
    var fields = [];

    while (!skip(lexer, TokenKind.BRACE_R)) {
      fields.push(parseObjectField(lexer, isConst));
    }

    return {
      kind: Kind.OBJECT,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectField[Const] : Name : Value[?Const]
   */


  function parseObjectField(lexer, isConst) {
    var start = lexer.token;
    return {
      kind: Kind.OBJECT_FIELD,
      name: parseName(lexer),
      value: (expect(lexer, TokenKind.COLON), parseValueLiteral(lexer, isConst)),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Directives section.

  /**
   * Directives[Const] : Directive[?Const]+
   */


  function parseDirectives(lexer, isConst) {
    var directives = [];

    while (peek(lexer, TokenKind.AT)) {
      directives.push(parseDirective(lexer, isConst));
    }

    return directives;
  }
  /**
   * Directive[Const] : @ Name Arguments[?Const]?
   */


  function parseDirective(lexer, isConst) {
    var start = lexer.token;
    expect(lexer, TokenKind.AT);
    return {
      kind: Kind.DIRECTIVE,
      name: parseName(lexer),
      arguments: parseArguments(lexer, isConst),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Types section.

  /**
   * Type :
   *   - NamedType
   *   - ListType
   *   - NonNullType
   */


  function parseTypeReference(lexer) {
    var start = lexer.token;
    var type;

    if (skip(lexer, TokenKind.BRACKET_L)) {
      type = parseTypeReference(lexer);
      expect(lexer, TokenKind.BRACKET_R);
      type = {
        kind: Kind.LIST_TYPE,
        type: type,
        loc: loc(lexer, start)
      };
    } else {
      type = parseNamedType(lexer);
    }

    if (skip(lexer, TokenKind.BANG)) {
      return {
        kind: Kind.NON_NULL_TYPE,
        type: type,
        loc: loc(lexer, start)
      };
    }

    return type;
  }
  /**
   * NamedType : Name
   */

  function parseNamedType(lexer) {
    var start = lexer.token;
    return {
      kind: Kind.NAMED_TYPE,
      name: parseName(lexer),
      loc: loc(lexer, start)
    };
  } // Implements the parsing rules in the Type Definition section.

  /**
   * TypeSystemDefinition :
   *   - SchemaDefinition
   *   - TypeDefinition
   *   - DirectiveDefinition
   *
   * TypeDefinition :
   *   - ScalarTypeDefinition
   *   - ObjectTypeDefinition
   *   - InterfaceTypeDefinition
   *   - UnionTypeDefinition
   *   - EnumTypeDefinition
   *   - InputObjectTypeDefinition
   */

  function parseTypeSystemDefinition(lexer) {
    // Many definitions begin with a description and require a lookahead.
    var keywordToken = peekDescription(lexer) ? lexer.lookahead() : lexer.token;

    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case 'schema':
          return parseSchemaDefinition(lexer);

        case 'scalar':
          return parseScalarTypeDefinition(lexer);

        case 'type':
          return parseObjectTypeDefinition(lexer);

        case 'interface':
          return parseInterfaceTypeDefinition(lexer);

        case 'union':
          return parseUnionTypeDefinition(lexer);

        case 'enum':
          return parseEnumTypeDefinition(lexer);

        case 'input':
          return parseInputObjectTypeDefinition(lexer);

        case 'directive':
          return parseDirectiveDefinition(lexer);
      }
    }

    throw unexpected(lexer, keywordToken);
  }

  function peekDescription(lexer) {
    return peek(lexer, TokenKind.STRING) || peek(lexer, TokenKind.BLOCK_STRING);
  }
  /**
   * Description : StringValue
   */


  function parseDescription(lexer) {
    if (peekDescription(lexer)) {
      return parseStringLiteral(lexer);
    }
  }
  /**
   * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
   */


  function parseSchemaDefinition(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'schema');
    var directives = parseDirectives(lexer, true);
    var operationTypes = many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R);
    return {
      kind: Kind.SCHEMA_DEFINITION,
      directives: directives,
      operationTypes: operationTypes,
      loc: loc(lexer, start)
    };
  }
  /**
   * OperationTypeDefinition : OperationType : NamedType
   */


  function parseOperationTypeDefinition(lexer) {
    var start = lexer.token;
    var operation = parseOperationType(lexer);
    expect(lexer, TokenKind.COLON);
    var type = parseNamedType(lexer);
    return {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation: operation,
      type: type,
      loc: loc(lexer, start)
    };
  }
  /**
   * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
   */


  function parseScalarTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'scalar');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectTypeDefinition :
   *   Description?
   *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
   */


  function parseObjectTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'type');
    var name = parseName(lexer);
    var interfaces = parseImplementsInterfaces(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description: description,
      name: name,
      interfaces: interfaces,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * ImplementsInterfaces :
   *   - implements `&`? NamedType
   *   - ImplementsInterfaces & NamedType
   */


  function parseImplementsInterfaces(lexer) {
    var types = [];

    if (skipKeyword(lexer, 'implements')) {
      // Optional leading ampersand
      skip(lexer, TokenKind.AMP);

      do {
        types.push(parseNamedType(lexer));
      } while (skip(lexer, TokenKind.AMP) || // Legacy support for the SDL?
      lexer.options.allowLegacySDLImplementsInterfaces && peek(lexer, TokenKind.NAME));
    }

    return types;
  }
  /**
   * FieldsDefinition : { FieldDefinition+ }
   */


  function parseFieldsDefinition(lexer) {
    // Legacy support for the SDL?
    if (lexer.options.allowLegacySDLEmptyFields && peek(lexer, TokenKind.BRACE_L) && lexer.lookahead().kind === TokenKind.BRACE_R) {
      lexer.advance();
      lexer.advance();
      return [];
    }

    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseFieldDefinition, TokenKind.BRACE_R) : [];
  }
  /**
   * FieldDefinition :
   *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
   */


  function parseFieldDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    var args = parseArgumentDefs(lexer);
    expect(lexer, TokenKind.COLON);
    var type = parseTypeReference(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.FIELD_DEFINITION,
      description: description,
      name: name,
      arguments: args,
      type: type,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ArgumentsDefinition : ( InputValueDefinition+ )
   */


  function parseArgumentDefs(lexer) {
    if (!peek(lexer, TokenKind.PAREN_L)) {
      return [];
    }

    return many(lexer, TokenKind.PAREN_L, parseInputValueDef, TokenKind.PAREN_R);
  }
  /**
   * InputValueDefinition :
   *   - Description? Name : Type DefaultValue? Directives[Const]?
   */


  function parseInputValueDef(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    expect(lexer, TokenKind.COLON);
    var type = parseTypeReference(lexer);
    var defaultValue;

    if (skip(lexer, TokenKind.EQUALS)) {
      defaultValue = parseConstValue(lexer);
    }

    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description: description,
      name: name,
      type: type,
      defaultValue: defaultValue,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * InterfaceTypeDefinition :
   *   - Description? interface Name Directives[Const]? FieldsDefinition?
   */


  function parseInterfaceTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'interface');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionTypeDefinition :
   *   - Description? union Name Directives[Const]? UnionMemberTypes?
   */


  function parseUnionTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'union');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var types = parseUnionMemberTypes(lexer);
    return {
      kind: Kind.UNION_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      types: types,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionMemberTypes :
   *   - = `|`? NamedType
   *   - UnionMemberTypes | NamedType
   */


  function parseUnionMemberTypes(lexer) {
    var types = [];

    if (skip(lexer, TokenKind.EQUALS)) {
      // Optional leading pipe
      skip(lexer, TokenKind.PIPE);

      do {
        types.push(parseNamedType(lexer));
      } while (skip(lexer, TokenKind.PIPE));
    }

    return types;
  }
  /**
   * EnumTypeDefinition :
   *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
   */


  function parseEnumTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'enum');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var values = parseEnumValuesDefinition(lexer);
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      values: values,
      loc: loc(lexer, start)
    };
  }
  /**
   * EnumValuesDefinition : { EnumValueDefinition+ }
   */


  function parseEnumValuesDefinition(lexer) {
    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseEnumValueDefinition, TokenKind.BRACE_R) : [];
  }
  /**
   * EnumValueDefinition : Description? EnumValue Directives[Const]?
   *
   * EnumValue : Name
   */


  function parseEnumValueDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputObjectTypeDefinition :
   *   - Description? input Name Directives[Const]? InputFieldsDefinition?
   */


  function parseInputObjectTypeDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'input');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseInputFieldsDefinition(lexer);
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description: description,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputFieldsDefinition : { InputValueDefinition+ }
   */


  function parseInputFieldsDefinition(lexer) {
    return peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseInputValueDef, TokenKind.BRACE_R) : [];
  }
  /**
   * TypeSystemExtension :
   *   - SchemaExtension
   *   - TypeExtension
   *
   * TypeExtension :
   *   - ScalarTypeExtension
   *   - ObjectTypeExtension
   *   - InterfaceTypeExtension
   *   - UnionTypeExtension
   *   - EnumTypeExtension
   *   - InputObjectTypeDefinition
   */


  function parseTypeSystemExtension(lexer) {
    var keywordToken = lexer.lookahead();

    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case 'schema':
          return parseSchemaExtension(lexer);

        case 'scalar':
          return parseScalarTypeExtension(lexer);

        case 'type':
          return parseObjectTypeExtension(lexer);

        case 'interface':
          return parseInterfaceTypeExtension(lexer);

        case 'union':
          return parseUnionTypeExtension(lexer);

        case 'enum':
          return parseEnumTypeExtension(lexer);

        case 'input':
          return parseInputObjectTypeExtension(lexer);
      }
    }

    throw unexpected(lexer, keywordToken);
  }
  /**
   * SchemaExtension :
   *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
   *  - extend schema Directives[Const]
   */


  function parseSchemaExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'schema');
    var directives = parseDirectives(lexer, true);
    var operationTypes = peek(lexer, TokenKind.BRACE_L) ? many(lexer, TokenKind.BRACE_L, parseOperationTypeDefinition, TokenKind.BRACE_R) : [];

    if (directives.length === 0 && operationTypes.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.SCHEMA_EXTENSION,
      directives: directives,
      operationTypes: operationTypes,
      loc: loc(lexer, start)
    };
  }
  /**
   * ScalarTypeExtension :
   *   - extend scalar Name Directives[Const]
   */


  function parseScalarTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'scalar');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);

    if (directives.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name: name,
      directives: directives,
      loc: loc(lexer, start)
    };
  }
  /**
   * ObjectTypeExtension :
   *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
   *  - extend type Name ImplementsInterfaces? Directives[Const]
   *  - extend type Name ImplementsInterfaces
   */


  function parseObjectTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'type');
    var name = parseName(lexer);
    var interfaces = parseImplementsInterfaces(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);

    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name: name,
      interfaces: interfaces,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * InterfaceTypeExtension :
   *   - extend interface Name Directives[Const]? FieldsDefinition
   *   - extend interface Name Directives[Const]
   */


  function parseInterfaceTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'interface');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseFieldsDefinition(lexer);

    if (directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * UnionTypeExtension :
   *   - extend union Name Directives[Const]? UnionMemberTypes
   *   - extend union Name Directives[Const]
   */


  function parseUnionTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'union');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var types = parseUnionMemberTypes(lexer);

    if (directives.length === 0 && types.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.UNION_TYPE_EXTENSION,
      name: name,
      directives: directives,
      types: types,
      loc: loc(lexer, start)
    };
  }
  /**
   * EnumTypeExtension :
   *   - extend enum Name Directives[Const]? EnumValuesDefinition
   *   - extend enum Name Directives[Const]
   */


  function parseEnumTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'enum');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var values = parseEnumValuesDefinition(lexer);

    if (directives.length === 0 && values.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name: name,
      directives: directives,
      values: values,
      loc: loc(lexer, start)
    };
  }
  /**
   * InputObjectTypeExtension :
   *   - extend input Name Directives[Const]? InputFieldsDefinition
   *   - extend input Name Directives[Const]
   */


  function parseInputObjectTypeExtension(lexer) {
    var start = lexer.token;
    expectKeyword(lexer, 'extend');
    expectKeyword(lexer, 'input');
    var name = parseName(lexer);
    var directives = parseDirectives(lexer, true);
    var fields = parseInputFieldsDefinition(lexer);

    if (directives.length === 0 && fields.length === 0) {
      throw unexpected(lexer);
    }

    return {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name: name,
      directives: directives,
      fields: fields,
      loc: loc(lexer, start)
    };
  }
  /**
   * DirectiveDefinition :
   *   - Description? directive @ Name ArgumentsDefinition? on DirectiveLocations
   */


  function parseDirectiveDefinition(lexer) {
    var start = lexer.token;
    var description = parseDescription(lexer);
    expectKeyword(lexer, 'directive');
    expect(lexer, TokenKind.AT);
    var name = parseName(lexer);
    var args = parseArgumentDefs(lexer);
    expectKeyword(lexer, 'on');
    var locations = parseDirectiveLocations(lexer);
    return {
      kind: Kind.DIRECTIVE_DEFINITION,
      description: description,
      name: name,
      arguments: args,
      locations: locations,
      loc: loc(lexer, start)
    };
  }
  /**
   * DirectiveLocations :
   *   - `|`? DirectiveLocation
   *   - DirectiveLocations | DirectiveLocation
   */


  function parseDirectiveLocations(lexer) {
    // Optional leading pipe
    skip(lexer, TokenKind.PIPE);
    var locations = [];

    do {
      locations.push(parseDirectiveLocation(lexer));
    } while (skip(lexer, TokenKind.PIPE));

    return locations;
  }
  /*
   * DirectiveLocation :
   *   - ExecutableDirectiveLocation
   *   - TypeSystemDirectiveLocation
   *
   * ExecutableDirectiveLocation : one of
   *   `QUERY`
   *   `MUTATION`
   *   `SUBSCRIPTION`
   *   `FIELD`
   *   `FRAGMENT_DEFINITION`
   *   `FRAGMENT_SPREAD`
   *   `INLINE_FRAGMENT`
   *
   * TypeSystemDirectiveLocation : one of
   *   `SCHEMA`
   *   `SCALAR`
   *   `OBJECT`
   *   `FIELD_DEFINITION`
   *   `ARGUMENT_DEFINITION`
   *   `INTERFACE`
   *   `UNION`
   *   `ENUM`
   *   `ENUM_VALUE`
   *   `INPUT_OBJECT`
   *   `INPUT_FIELD_DEFINITION`
   */


  function parseDirectiveLocation(lexer) {
    var start = lexer.token;
    var name = parseName(lexer);

    if (DirectiveLocation.hasOwnProperty(name.value)) {
      return name;
    }

    throw unexpected(lexer, start);
  } // Core parsing utility functions

  /**
   * Returns a location object, used to identify the place in
   * the source that created a given parsed object.
   */


  function loc(lexer, startToken) {
    if (!lexer.options.noLocation) {
      return new Loc(startToken, lexer.lastToken, lexer.source);
    }
  }

  function Loc(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  } // Print a simplified form when appearing in JSON/util.inspect.


  defineToJSON(Loc, function () {
    return {
      start: this.start,
      end: this.end
    };
  });
  /**
   * Determines if the next token is of a given kind
   */

  function peek(lexer, kind) {
    return lexer.token.kind === kind;
  }
  /**
   * If the next token is of the given kind, return true after advancing
   * the lexer. Otherwise, do not change the parser state and return false.
   */


  function skip(lexer, kind) {
    if (lexer.token.kind === kind) {
      lexer.advance();
      return true;
    }

    return false;
  }
  /**
   * If the next token is of the given kind, return that token after advancing
   * the lexer. Otherwise, do not change the parser state and throw an error.
   */


  function expect(lexer, kind) {
    var token = lexer.token;

    if (token.kind === kind) {
      lexer.advance();
      return token;
    }

    throw syntaxError(lexer.source, token.start, "Expected ".concat(kind, ", found ").concat(getTokenDesc(token)));
  }
  /**
   * If the next token is a keyword with the given value, return true after advancing
   * the lexer. Otherwise, do not change the parser state and return false.
   */


  function skipKeyword(lexer, value) {
    var token = lexer.token;

    if (token.kind === TokenKind.NAME && token.value === value) {
      lexer.advance();
      return true;
    }

    return false;
  }
  /**
   * If the next token is a keyword with the given value, return that token after
   * advancing the lexer. Otherwise, do not change the parser state and throw
   * an error.
   */


  function expectKeyword(lexer, value) {
    if (!skipKeyword(lexer, value)) {
      throw syntaxError(lexer.source, lexer.token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(lexer.token)));
    }
  }
  /**
   * Helper function for creating an error when an unexpected lexed token
   * is encountered.
   */


  function unexpected(lexer, atToken) {
    var token = atToken || lexer.token;
    return syntaxError(lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token)));
  }
  /**
   * Returns a possibly empty list of parse nodes, determined by
   * the parseFn. This list begins with a lex token of openKind
   * and ends with a lex token of closeKind. Advances the parser
   * to the next lex token after the closing token.
   */


  function any(lexer, openKind, parseFn, closeKind) {
    expect(lexer, openKind);
    var nodes = [];

    while (!skip(lexer, closeKind)) {
      nodes.push(parseFn(lexer));
    }

    return nodes;
  }
  /**
   * Returns a non-empty list of parse nodes, determined by
   * the parseFn. This list begins with a lex token of openKind
   * and ends with a lex token of closeKind. Advances the parser
   * to the next lex token after the closing token.
   */


  function many(lexer, openKind, parseFn, closeKind) {
    expect(lexer, openKind);
    var nodes = [parseFn(lexer)];

    while (!skip(lexer, closeKind)) {
      nodes.push(parseFn(lexer));
    }

    return nodes;
  }

  var parser = /*#__PURE__*/Object.freeze({
    parse: parse$1,
    parseValue: parseValue,
    parseType: parseType,
    parseConstValue: parseConstValue,
    parseTypeReference: parseTypeReference,
    parseNamedType: parseNamedType
  });

  var parser$1 = getCjsExportFromNamespace(parser);

  var parse$2 = parser$1.parse;

  // Strip insignificant whitespace
  // Note that this could do a lot more, such as reorder fields etc.
  function normalize(string) {
    return string.replace(/[\s,]+/g, ' ').trim();
  }

  // A map docString -> graphql document
  var docCache = {};

  // A map fragmentName -> [normalized source]
  var fragmentSourceMap = {};

  function cacheKeyFromLoc(loc) {
    return normalize(loc.source.body.substring(loc.start, loc.end));
  }

  // For testing.
  function resetCaches() {
    docCache = {};
    fragmentSourceMap = {};
  }

  // Take a unstripped parsed document (query/mutation or even fragment), and
  // check all fragment definitions, checking for name->source uniqueness.
  // We also want to make sure only unique fragments exist in the document.
  var printFragmentWarnings = true;
  function processFragments(ast) {
    var astFragmentMap = {};
    var definitions = [];

    for (var i = 0; i < ast.definitions.length; i++) {
      var fragmentDefinition = ast.definitions[i];

      if (fragmentDefinition.kind === 'FragmentDefinition') {
        var fragmentName = fragmentDefinition.name.value;
        var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

        // We know something about this fragment
        if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

          // this is a problem because the app developer is trying to register another fragment with
          // the same name as one previously registered. So, we tell them about it.
          if (printFragmentWarnings) {
            console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
              + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
              + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
          }

          fragmentSourceMap[fragmentName][sourceKey] = true;

        } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
          fragmentSourceMap[fragmentName] = {};
          fragmentSourceMap[fragmentName][sourceKey] = true;
        }

        if (!astFragmentMap[sourceKey]) {
          astFragmentMap[sourceKey] = true;
          definitions.push(fragmentDefinition);
        }
      } else {
        definitions.push(fragmentDefinition);
      }
    }

    ast.definitions = definitions;
    return ast;
  }

  function disableFragmentWarnings() {
    printFragmentWarnings = false;
  }

  function stripLoc(doc, removeLocAtThisLevel) {
    var docType = Object.prototype.toString.call(doc);

    if (docType === '[object Array]') {
      return doc.map(function (d) {
        return stripLoc(d, removeLocAtThisLevel);
      });
    }

    if (docType !== '[object Object]') {
      throw new Error('Unexpected input.');
    }

    // We don't want to remove the root loc field so we can use it
    // for fragment substitution (see below)
    if (removeLocAtThisLevel && doc.loc) {
      delete doc.loc;
    }

    // https://github.com/apollographql/graphql-tag/issues/40
    if (doc.loc) {
      delete doc.loc.startToken;
      delete doc.loc.endToken;
    }

    var keys = Object.keys(doc);
    var key;
    var value;
    var valueType;

    for (key in keys) {
      if (keys.hasOwnProperty(key)) {
        value = doc[keys[key]];
        valueType = Object.prototype.toString.call(value);

        if (valueType === '[object Object]' || valueType === '[object Array]') {
          doc[keys[key]] = stripLoc(value, true);
        }
      }
    }

    return doc;
  }

  var experimentalFragmentVariables = false;
  function parseDocument$1(doc) {
    var cacheKey = normalize(doc);

    if (docCache[cacheKey]) {
      return docCache[cacheKey];
    }

    var parsed = parse$2(doc, { experimentalFragmentVariables: experimentalFragmentVariables });
    if (!parsed || parsed.kind !== 'Document') {
      throw new Error('Not a valid GraphQL document.');
    }

    // check that all "new" fragments inside the documents are consistent with
    // existing fragments of the same name
    parsed = processFragments(parsed);
    parsed = stripLoc(parsed, false);
    docCache[cacheKey] = parsed;

    return parsed;
  }

  function enableExperimentalFragmentVariables() {
    experimentalFragmentVariables = true;
  }

  function disableExperimentalFragmentVariables() {
    experimentalFragmentVariables = false;
  }

  // XXX This should eventually disallow arbitrary string interpolation, like Relay does
  function gql(/* arguments */) {
    var args = Array.prototype.slice.call(arguments);

    var literals = args[0];

    // We always get literals[0] and then matching post literals for each arg given
    var result = (typeof(literals) === "string") ? literals : literals[0];

    for (var i = 1; i < args.length; i++) {
      if (args[i] && args[i].kind && args[i].kind === 'Document') {
        result += args[i].loc.source.body;
      } else {
        result += args[i];
      }

      result += literals[i];
    }

    return parseDocument$1(result);
  }

  // Support typescript, which isn't as nice as Babel about default exports
  gql.default = gql;
  gql.resetCaches = resetCaches;
  gql.disableFragmentWarnings = disableFragmentWarnings;
  gql.enableExperimentalFragmentVariables = enableExperimentalFragmentVariables;
  gql.disableExperimentalFragmentVariables = disableExperimentalFragmentVariables;

  var src = gql;

  // import * as es6Promise from 'es6-promise';

  /*
   * curl -X POST -H "Content-Type: application/json" --data '{ "query": "{ questions {category} }" }' http://localhost:4000
   */

  function getQuestions() {
      const MY_QUERY = src`
        query {
            questions {
                category
                question
                choices
                answer
                answered
            }
        }
    `;

      const hostname = window.location.hostname;
      const client = new ApolloClient({
        link: new HttpLink({ uri: `http://${hostname}:4000/graphql` }),
        cache: new InMemoryCache()
      });

      return client.query({
          query: MY_QUERY,
          context: {
              headers: {
                special: "Special header value"
              }
          }
      })
      .then(response => response);
  }

  class TriviaGame extends HTMLElement {
      static get observedAttributes() { return ['type']; }

      connectedCallback() {
          this.connected = true;
          this.html = bind(this);
          this.type = this.type || this.getAttribute('type');
          getQuestions()
              .then(response => {
                  this.questions = response.data.questions;
                  this.score = 0;
                  this.state = {
                      status: 'incomplete',
                      question: this.getQuestion(this.type),
                      status: {isAnswered: false, isCorrect: false},
                      score: this.score
                  };
                  this.render(this.html, this.state);
                  this.addEventListeners();
              });
      }

      disconnectedCallback() {
          this.delegateEl.off();
      }

      attributeChangedCallback(attr, oldValue, newValue) {
          if (oldValue !== newValue) {
              this[attr] = newValue;
              this.render(this.html);
          }
      }

      propertyChangeCallback(prop, oldValue, newValue) {
          if (oldValue !== newValue) {
              this.setAttribute(prop, newValue);
              this.render(this.html, this.state);
          }
      }

      addEventListeners() {
          this.delegateEl = lib(this);
          this.delegateEl.on('trivia-question:answered', '.trivia-question', (e) => {
              if (e.detail) {
                  this.state.status.isAnswered = true;
                  this.state.status.isCorrect = e.detail.answerIsCorrect;
                  this.score += e.detail.answerIsCorrect ? 100 : 0;
                  this.state.score = this.score;
              }
              this.render(this.html, this.state);
          });
          this.delegateEl.on('click', '.next-question-button', () => {
              if (this.questions.length > 0) {
                  this.state = {
                      status: 'incomplete',
                      question: this.getQuestion(this.type),
                      status: {isAnswered: false, isCorrect: false},
                      score: this.score
                  };
              } else {
                  this.state = {
                      status: 'complete',
                      question: this.getQuestion(this.type),
                      status: {isAnswered: false, isCorrect: false},
                      score: this.score
                  };
              }
              this.render(this.html, this.state);
          });
      }

      getQuestion() {
          const max =  this.questions.length;
          const randomInt = Math.floor(Math.random() * Math.floor(max));
          const question = this.questions[randomInt];
          this.questions.splice(randomInt,1);
          return question;
      }

      render(html, state) {
          if (!this.connected) { return '';}
          return html`
            <h1 class="trivia-game__title">${ this.type } Trivia</h1>
            <p class="trivia-game__score">Score: ${ this.state.score }</p>
            <div class="trivia-game__question-container">
                ${!this.state.status.isAnswered
                    ? ''
                    : this.state.status.isCorrect
                        ? wire()`
                            <div class="answer-message">
                                <p class="is-correct">CORRECT</p>
                            </div>
                        `
                        : wire()`
                            <div class="answer-message">
                                <p class="is-incorrect">INCORRECT</p>
                                <p class="correct-answer">${this.state.question.choices[this.state.question.answer]}</p>
                            </div>
                        `
                }
                ${!this.state.status.isAnswered
                    ? wire()`<trivia-question class="trivia-question" data=${ state } />`
                    : wire()`<button class="next-question-button" type="button">Next Question<button>`
                }
            </div>
        `;
      }
  }

  customElements.define('trivia-game', TriviaGame);

}());
//# sourceMappingURL=bundle.js.map
