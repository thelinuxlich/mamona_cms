requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',
        'durandal':'../lib/durandal/js',
        'jasny_bootstrap': '../lib/jasny-bootstrap/js/jasny-bootstrap.min',
        'bootstrap': '../lib/bootstrap/js/bootstrap.min',
        'bootstrap_validation': '../lib/jqBootstrapValidation/jqBootstrapValidation',
        'datatables': '../lib/jquery-dataTables/js/jquery.dataTables.min',
        'paging': '../lib/jquery-dataTables/js/paging',
        'knockout': '../lib/knockout/knockout-2.2.1',
        'jquery_form': '../lib/jquery-form/jquery.form.min',
        'jquery': '../lib/jquery/jquery-1.9.1.min'
    },
    shim: {
        'bootstrap': {
            deps: ["jquery"]
        },
        'datatables': {
            deps: ['jquery']
        },
        'paging': {
            deps: ['datatables']
        },
        'jasny_bootstrap': {
            deps: ['bootstrap']
        },
        'bootstrap_validation': {
            deps: ['bootstrap']
        }
    }
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator'],
function(system, app, viewLocator){
    system.debug(true);
    app.title = 'Mamona CMS';
    app.start().then(function() {
        viewLocator.useConvention();
        app.setRoot('viewmodels/shell', 'entrance');
    });
});
