/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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

CLASS({
  package: 'com.google.watlobby',
  name: 'VideoBubble',

  extendsModel: 'com.google.watlobby.TopicBubble',

  requires: [
    'foam.graphics.ImageCView',
    'foam.graphics.SimpleRectangle',
    'foam.graphics.ViewCView'
  ],

  properties: [
    {
      name: 'playIcon',
      factory: function() { return this.ImageCView.create({src: 'img/play.png', x:-40, y:-40, width: 80, height: 80, alpha: 0.25}); }
    }
  ],

  methods: [
    function initCView() {
      this.SUPER();
      this.addChild(this.playIcon);
    },
    function setSelected(selected) {
      var lobby = this.lobby;
      if ( selected ) {
        this.children_ = [];
        var w = lobby.width;
        var h = lobby.height;

        var r = this.SimpleRectangle.create({background: 'black', alpha: 0, x: 0, y: 0, width: w, height: h});
        lobby.addChild(r);
//        Movement.animate(1500, function() { r.alpha = 0.7; })();

        this.children_.push(r);

        var video = this.topic.video;
        var vw = Math.floor(Math.min(w, h * 1.77) * 0.7);
        var vh = Math.floor(vw / 1.77);

        var v = this.ViewCView.create({innerView: {
          toHTML: function() { return '<iframe width="' + vw + '" height="' + vh + '" src="https://www.youtube.com/embed/' + video + '?autoplay=1" frameborder="0" allowfullscreen></iframe>'; },
          initHTML: function() {}
        }, x: this.x, y: this.y, width: 0, height: 0});

        lobby.collider.stop();
        Movement.compile([
          [500, function() { this.alpha = 0; }.bind(this) ],
          [1000, function(i, j) {
            r.alpha = 0.7;
            v.width = vw;
            v.height = vh;
            v.x = (w-vw)/2;
            v.y = (h-vh)/2;
          }]
        ])();
        lobby.addChild(v);
        this.children_.push(v);
      } else {
        // TODO: remove children from lobby when done
        var r = this.children_[0];
        var v = this.children_[1];
//        lobby.collider.stop();
        Movement.compile([
          [ 500, function() { v.x = this.x; v.y = this.y; v.width = v.height = r.alpha = 0; }.bind(this) ],
          [ 500, function() { this.alpha = 1.0; }.bind(this) ],
          function() {
            v.destroy();
            lobby.collider.start();
            lobby.removeChild(v);
            lobby.removeChild(r);
          }
        ])();
        this.children_ = [];
      }
    }
  ]
});
