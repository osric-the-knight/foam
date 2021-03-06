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
  package: 'foam.apps.builder.wizard',
  name: 'DAOWizard',
  extendsModel: 'foam.apps.builder.wizard.WizardPage',

  requires: [
    'foam.apps.builder.wizard.NewOrExistingModelWizard',
    'foam.apps.builder.dao.DAOFactoryEditView',
    'foam.apps.builder.dao.IDBDAOFactoryEditView',
    'foam.apps.builder.dao.GoogleDriveDAOFactoryEditView'
  ],

  imports: [
    'daoConfigDAO',
  ],

  properties: [
    {
      name: 'nextViewFactory',
      defaultValue: null,
      // {
//         factory_: 'foam.apps.builder.wizard.NewOrExistingModelWizard',
//},
    },
    {
      name: 'title',
      defaultValue: 'Data Source Settings',
    },
  ],


  methods: [
    function onNext() {
      this.daoConfigDAO && this.daoConfigDAO.put(this.data.dao);
      this.SUPER();
    }
  ],

  templates: [

    function instructionHTML() {/*
        <p>Set the following options for your Data Source:
        </p>
    */},
    function contentHTML() {/*
        <div class="md-card-heading-content-spacer"></div>
        $$dao{ model_: 'foam.apps.builder.dao.EditView', model: this.data.dao.model_ }
    */},
  ],


});
