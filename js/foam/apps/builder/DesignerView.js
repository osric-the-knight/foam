/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

CLASS({
  package: 'foam.apps.builder',
  name: 'DesignerView',
  extendsModel: 'foam.ui.View',
  traits: [
    'foam.metrics.ScreenViewTrait',
  ],

  requires: [
    'Binding',
    'PersistentContext',
    'foam.apps.builder.AppConfigActionsView',
    'foam.apps.builder.DesignerViewContext',
    'foam.apps.builder.kiosk.KioskView',
    'foam.apps.builder.Panel',
    'foam.dao.IDBDAO',
    'foam.ui.OverlayHelpView',
    'foam.ui.HelpSnippetView',
  ],
  imports: [
    'mdToolbar as toolbar'
  ],

  properties: [
    'toolbar',
    {
      name: 'data',
      postSet: function(old, nu) {
        if ( old ) old.removeListener(this.onDataChange);
        if ( nu ) nu.addListener(this.onDataChange);
        // TODO(jacksonic): Bind this better.
        if ( this.data && this.data.model )
          this.data.model.instance_.prototype_ = null;
      },
    },
    {
      model_: 'BooleanProperty',
      name: 'autoUpdatePreviewHTML',
      help: 'If true, call updateHTML() on preview view on every data-related change.',
      defaultValue: true,
    },
    {
      model_: 'ViewFactoryProperty',
      name: 'panel',
      defaultValue: {
        factory_: 'foam.apps.builder.Panel',
        innerView: 'foam.apps.builder.AppConfigActionsView',
      },
    },
    {
      model_: 'ViewFactoryProperty',
      name: 'app',
      defaultValue: 'foam.apps.builder.kiosk.KioskView',
    },
    'panelView',
    'appView',
    {
      name: 'persistentContext',
      transient: true,
      lazyFactory: function() {
        return this.PersistentContext.create({
          dao: this.IDBDAO.create({ model: this.Binding }),
          predicate: NOT_TRANSIENT,
          context: this
        });
      },
    },
    {
      type: 'foam.apps.builder.DesignerViewContext',
      name: 'ctx',
      transient: true,
      defaultValue: null,
      postSet: function(old, nu) {
        if ( old === nu ) return;
        if ( this.$ && nu && nu.firstRun ) {
          this.constructHelpSnippets();
        }
      },
    },
  ],

  methods: [
    function init() {
      this.SUPER();
      this.persistentContext.bindObject(
          'ctx', this.DesignerViewContext, undefined, 1);
    },
    function initHTML() {
      this.SUPER();
      if ( this.ctx && this.ctx.firstRun ) this.constructHelpSnippets();
    },
  ],

  listeners: [
    {
      name: 'onDataChange',
      code: function() {
        if ( ! (this.appView && this.data && this.data.model &&
            this.autoUpdatePreviewHTML ) ) return;
        // TODO(jacksonic): Bind this better.
        this.data.model.instance_.prototype_ = null;
        this.appView.updateHTML();
      },
    },
    {
      name: 'constructHelpSnippets',
      isMerged: 1000,
      code: function () {
        var self = this;
        this.OverlayHelpView.create({
          helpSnippets: [
            this.HelpSnippetView.create({
              data: 'Configure your app using the options listed in the config view',
              extraClassName: 'md-body',
              target: this.panelView,
              abeforeInit: function(ret) {
                // If panel view is openable, target its contents.
                if ( self.panelView && self.panelView.open ) {
                  self.panelView.open(self.$);
                  this.target = self.panelView.delegateView ||
                      self.panelView.innerView || self.panelView;
                  var listener = function() {
                    if ( self.panelView.state !== 'open' &&
                        self.panelView.state !== 'expanded' ) return;
                    self.panelView.state$.removeListener(listener);
                    ret && ret();
                  };
                  self.panelView.state$.addListener(listener);
                } else {
                  ret && ret();
                }
              },
              aafterDestroy: function(ret) {
                self.panelView && self.panelView.close &&
                    self.panelView.close();
                ret && ret();
              },
              location: 'ABOVE',
              actionLocation: 'TOP_RIGHT',
            }, this.Y),
            this.HelpSnippetView.create({
              data: 'See how your app looks with the live preview',
              extraClassName: 'md-body',
              target: this.appView,
              abeforeInit: function(ret) {
                // While view has no DOM element, try contents delegate/inner
                // contents.
                var view;
                for ( view = this.target; view && ! view.$;
                      view = view.delegateView || view.innerView || null );
                if ( view ) this.target = view;
                ret && ret();
              },
              location: 'ABOVE',
              actionLocation: 'TOP_RIGHT',
            }, this.Y),
            this.HelpSnippetView.create({
              data: "When you're ready, use the action toolbar to package, download, upload, or publish your app",
              extraClassName: 'md-body',
              target: this.toolbar.rightActionList,
              location: 'BELOW',
              actionLocation: 'BOTTOM_RIGHT',
            }, this.Y),
          ],
          onComplete: function() {
            this.ctx.firstRun = false;
          }.bind(this)
        }, this.Y).construct();
      },
    },
  ],

  templates: [
    function toHTML() {/*
      <designer id="%%id" <%= this.cssClassAttr() %>>

        <% this.panelView = this.panel({
             zIndex: 2,
           }, this.Y);
           this.appView = this.app({
             zIndex: 1,
           }, this.Y);
           this.addDataChild(this.panelView);
           this.addDataChild(this.appView); %>

        <%= this.panelView %>
        <%= this.appView %>

      </designer>
    */},
    function CSS() {/*
      designer {
        flex-grow: 1;
        position: relative;
        display: flex;
        flex-direction: column;
      }
    */},
  ],
});
