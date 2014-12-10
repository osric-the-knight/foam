// BUG: Press 'Log' on startup
/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function trigFn(f) {
  return function(a) {
    return f(this.degreesMode ? a * Math.PI / 180 : a);
  };
}

function invTrigFn(f) {
  return function(a) {
    return this.degreesMode ? f(a) / Math.PI * 180 : f(a);
  };
}

/** Make a Binary Action. **/
function binaryOp(name, keys, f, sym) {
  f.toString = function() { return sym; };
  return {
    name: name,
    label: sym,
    keyboardShortcuts: keys,
    action: function() {
      if ( this.op != DEFAULT_OP ) this.equals();
      this.push('', f);
      this.editable = true;
    }
  };
}

function unaryOp(name, keys, f, opt_sym) {
  var sym = opt_sym || name;
  f.toString = function() { return sym; };

  return {
    name: name,
    label: sym,
    keyboardShortcuts: keys,
    action: function() {
      this.op = f;
      this.push(f.call(this, this.a2));
      this.editable = false;
    }
  };
}

/** Make a 0-9 Number Action. **/
function num(n) {
  return {
    name: n.toString(),
    keyboardShortcuts: [48+n /* 0 */ , 96+n /* keypad-0 */],
    action: function() {
      if ( ! this.editable ) {
        this.push(n);
        this.editable = true;
      } else {
        if ( this.a2 == '0' && ! n ) return;
        this.a2 = this.a2 == '0' ? n : this.a2.toString() + n;
      }
    }
  };
}


var DEFAULT_OP = function(a1, a2) { return a2; };
DEFAULT_OP.toString = function() { return ''; };

function formatNumber(n) {
  return typeof n === 'string' ? n              :
         Number.isNaN(n)       ? 'Not a number' :
         ! Number.isFinite(n)  ? '∞'            :
                                 n              ;
}

CLASS({
  name: 'History',
  properties: [
    'op',
    {
      name: 'a2',
      preSet: function(_, n) { return formatNumber(n); }
    }
  ]
});


CLASS({
  name: 'Calc',

  requires: [
    'CalcView',
    'GestureManager',
    'TouchManager'
  ],

  exports: [
    'gestureManager',
    'touchManager'
  ],

  templates: [ function CSS() {/*
    * {
      box-sizing: border-box;
    }

    html {
      height: 100%;
      margin: 0;
      overflow: hidden;
      padding: 0;
      width: 100%;
    }

    body {
      -webkit-user-select: none;
      font-family: RobotoDraft, 'Helvetica Neue', Helvetica, Arial;
      font-size: 28px;
      font-weight: 300;
      height: 100%;
      margin: 0;
      margin: 0px;
      overflow: hidden;
      padding: 0px;
      width: 100%;
    }

    ::-webkit-scrollbar {
      display: none;
    }

    ::-webkit-scrollbar-thumb {
      display: none;
    }

    .calc {
      background-color: #eee;
      border: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0;
      padding: 0px;
    }

    .deg, .rad {
      color: #b3b3b3;
      font-size: 18px;
      opacity: 0;
      padding-left: 12px;
      transition: opacity 0.8s;
    }

    .active {
      opacity: 1;
    }

    .calc-display, .calc-display:focus {
      border: none;
      letter-spacing: 1px;
      line-height: 36px;
      margin: 0;
      min-width: 204px;
      padding: 0 25pt 2pt 25pt;
      text-align: right;
    }

    .edge {
      background: linear-gradient(to bottom, rgba(240,240,240,1) 0%,
                                             rgba(240,240,240,0) 100%);
      height: 20px;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 99;
    }

    .edge2 {
      margin-top: -12px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%,
                                             rgba(0,0,0,0) 100%);
      top: 12px;
      height: 12px;
      position: relative;
      width: 100%;
      z-index: 99;
    }

    .calc .buttons {
      flex: 1 1 100%;
      width: 100%;
      height: 350px;
    }

    .button-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      flex: 1 1 100%;
      justify-content: space-between;
      align-items: stretch;
    }

    .button {
      flex-grow: 1;
      justify-content: center;
      display: flex;
      align-items: center;
      background-color: #4b4b4b;
    }

    .rhs-ops {
      border-left-width: 1px;
      border-left-style: solid;
      border-left-color: rgb(68, 68, 68);
      background: #777;
    }

    .rhs-ops .button {
      background-color: #777;
    }

    .button-column {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
    }

    .inner-calc-display {
      position: absolute;
      right: 20pt;
      top: 100%;
      transition: top 0.3s ease;
      width: 100%;
      padding-left: 140px;
    }

    .calc-display {
      flex-grow: 5;
      position: relative;
    }

    .secondaryButtons {
      padding-left: 10px;
      background: rgb(64, 189, 158);
    }

    .secondaryButtons .button {
      background: rgb(64, 189, 158);
    }

    .tertiaryButtons {
      padding-left: 10px;
      background: rgb(29, 233, 182);
    }

    .tertiaryButtons .button {
      background: rgb(29, 233, 182);
    }

    .keypad {
      flex-grow: 0;
      flex-shrink: 0;
      margin-bottom: -4px;
    }

    .history {
      color: #b3b3b3
    }

    .alabel {
      font-size: 44px;
      color: #b3b3b3
    }
  */}],

  properties: [
    { name: 'degreesMode', defaultValue: false },
    { name: 'a1', defaultValue: 0 },
    { name: 'a2', defaultValue: '' },
    { name: 'editable', defaultValue: true },
    {
      name: 'op',
      defaultValue: DEFAULT_OP
    },
    {
      model_: 'ArrayProperty',
      name: 'history',
      view: 'DAOListView',
      factory: function() { return [].sink; }
    },
    {
      model_: 'StringProperty',
      name: 'row1',
      view: 'ALabel'
    },
    {
      name: 'touchManager',
      factory: function() {
        // TODO(braden): HACK This should be just exporting the property, but
        // the context is not properly passed into views created using <foam>
        // tags right now. Clean up this and gestureManager below.
        var tm = this.TouchManager.create();
        window.X.touchManager = tm;
        return tm;
      }
    },
    {
      name: 'gestureManager',
      factory: function() {
        var gm = this.GestureManager.create();
        window.X.gestureManager = gm;
        return gm;
      }
    }
  ],

  methods: {
    factorial: function(n) {
      if ( n > 170 ) {
        this.error();
        return 1/0;
      }
      var r = 1;
      while ( n > 0 ) r *= n--;
      return r;
    },
    permutation: function(n, r) { return this.factorial(n) / this.factorial(n-r); },
    combination: function(n, r) { return this.permutation(n, r) / this.factorial(r); },
    error: function() {
      setTimeout(function() { flare($$('calc-display')[0], '#f44336' /* red */); }, 100);
    },
    init: function() {
      this.SUPER();

      Events.dynamic(function() { this.op; this.a2; }.bind(this), EventService.framed(function() {
        if ( Number.isNaN(this.a2) ) this.error();
        var a2 = formatNumber(this.a2);
        this.row1 = this.op + ( a2 !== '' ? '&nbsp;' + a2 : '' );
      }.bind(this)));
    },
    push: function(a2, opt_op) {
      this.history.put(History.create(this));
      this.a1 = this.a2;
      this.a2 = a2;
      this.op = opt_op || DEFAULT_OP;
    }
  },

  actions: [
    num(1), num(2), num(3),
    num(4), num(5), num(6),
    num(7), num(8), num(9), num(0),
    binaryOp('div',   [111, 191],         function(a1, a2) { return a1 / a2; }, '\u00F7'),
    binaryOp('mult',  [106, 'shift-56'],  function(a1, a2) { return a1 * a2; }, '\u00D7'),
    binaryOp('plus',  [107, 'shift-187'], function(a1, a2) { return a1 + a2; }, '+'),
    binaryOp('minus', [109, 189],         function(a1, a2) { return a1 - a2; }, '–'),
    binaryOp('pow',   [],                 Math.pow,                             'yⁿ'),
    binaryOp('p',     [],                 function(n,r) { return this.permutation(n,r); }, 'nPr'),
    binaryOp('c',     [],                 function(n,r) { return this.combination(n,r); }, 'nCr'),
    binaryOp('root',  [],                 function(a1, a2) { return Math.pow(a2, 1/a1); }, '\u207F \u221AY'),
    {
      name: 'ac',
      label: 'AC',
      // help: 'All Clear.',
      keyboardShortcuts: [ 65 /* a */, 67 /* c */ ],
      action: function() {
        this.a2 = '0';
        this.editable = true;
        this.op = DEFAULT_OP;
        this.history = [].sink;
        flare($$('calc-display')[0], '#2196F3' /* blue */);
      }
    },
    {
      name: 'sign',
      label: '+/-',
      keyboardShortcuts: [ 78 /* n */ , 83 /* s */],
      action: function() { this.a2 = - this.a2; }
    },
    {
      name: 'point',
      label: '.',
      keyboardShortcuts: [ 110, 190 ],
      action: function() {
        if ( this.a2.toString().indexOf('.') == -1 ) this.a2 = this.a2 + '.';
      }
    },
    {
      name: 'equals',
      label: '=',
      keyboardShortcuts: [ 187 /* '=' */, 13 /* <enter> */ ],
      action: function() {
        this.push(this.op(parseFloat(this.a1), parseFloat(this.a2)));
        this.editable = false;
      }
    },
    {
      name: 'backspace',
      keyboardShortcuts: [ 8 /* backspace */ ],
      action: function() {
        this.a2 = this.a2.toString.length == 1 ?
          '0' :
          this.a2.toString().substring(0, this.a2.length-1) ;
      }
    },
    {
      name: 'pi',
      label: 'π',
      keyboardShortcuts: [80 /* p */],
      action: function() { this.a2 = Math.PI; }
    },
    {
      name: 'e',
      label: 'E',
      keyboardShortcuts: [69 /* e */],
      action: function() { this.a2 = Math.E; }
    },
    {
      name: 'percent',
      label: '%',
      keyboardShortcuts: [ 'shift-53' /* % */ ],
      action: function() { this.a2 /= 100.0; }
    },
    {
      name: 'deg',
      action: function() { this.degreesMode = true; }
    },
    {
      name: 'rad',
      action: function() { this.degreesMode = false; }
    },
    unaryOp('fact',   ['shift-49' /* ! */], function(n) { return this.factorial(n); }, 'x!'),
    unaryOp('inv',    [73 /* i */], function(a) { return 1.0/a; }, '1/x'),
    unaryOp('sin',    [], trigFn(Math.sin)),
    unaryOp('cos',    [], trigFn(Math.cos)),
    unaryOp('tan',    [], trigFn(Math.tan)),
    unaryOp('asin',   [], invTrigFn(Math.asin)),
    unaryOp('acos',   [], invTrigFn(Math.acos)),
    unaryOp('atan',   [], invTrigFn(Math.atan)),
    unaryOp('square', [], function(a) { return a*a; }, 'x²'),
    unaryOp('sqroot', [82 /* r */], Math.sqrt, '√'),
    unaryOp('log',    [], function(a) { return Math.log(a) / Math.LN10; }),
    unaryOp('ln',     [], Math.log),
    unaryOp('exp',    [], Math.exp, 'eⁿ'),
  ]
});

// HACK: The buttons don't draw using the Roboto font because it isn't loaded yet.
// So we wait a second, to give the font time to load, then redraw all the buttons.
// TODO: Something better.
CLASS({
  name: 'ActionButtonCView2',
  extendsModel: 'foam.graphics.ActionButtonCView',
  methods: {
    init: function() {
      this.SUPER();
      setTimeout(function() { this.view.paint(); }.bind(this), 1000);
    }
  }
});

var CalcButton = ActionButtonCView2.xbind({
  color:      'white',
  background: '#4b4b4b',
  width:      95,
  height:     85,
  font:       '300 32px RobotoDraft'
});
X.registerModel(CalcButton, 'ActionButton');

CLASS({ name: 'CalcView', extendsModel: 'DetailView', templates: [ { name: 'toHTML' } ] });

function flare(e, color) {
//  var eStyle  = window.getComputedStyle(e);
//  var w = toNum(eStyle.width);
//  var h = toNum(eStyle.height);
  var w = e.clientWidth;
  var h = e.clientHeight;
  var c = foam.graphics.Circle.create({r: 0, width: w, height: h, x: w, y: h, color: color});
  var view = c.toView_();
  var div = document.createElement('div');
  var dStyle = div.style;
  dStyle.position = 'absolute';
  dStyle.left = 0;

  var id = View.getPrototype().nextID();
  div.id = id;
  div.innerHTML = view.toHTML();
  e.appendChild(div);
  view.initHTML();
  Movement.compile([
    // MYSTERY(kgr): I don't know why the 1.3 is needed.
    [500, function() { c.r = 1.3 * Math.sqrt(w*w, h*h); }],
    [200, function() { c.alpha = 0; }],
    function() { div.remove(); }
  ])();
c.r$.addListener(EventService.framed(view.paint.bind(view)));
c.alpha$.addListener(EventService.framed(view.paint.bind(view)));
}