exports.config = function(weyland) {
    weyland.build('main')
        .task.jshint({
            include:'client/**/*.js'
        })
        .task.rjs({
            include:['client/**/*.{js,html}', 'lib/durandal/**/*.js'],
            loaderPluginExtensionMaps:{
                '.html':'text'
            },
            rjs:{
                name:'main', //to deploy with require.js, use the build's name here instead
                baseUrl : 'client',
                paths : {
                    'text': '../lib/require/text',
					'plugins' : '../lib/durandal/js/plugins',
					'transitions' : '../lib/durandal/js/transitions',
					'durandal':'../lib/durandal/js'
                },
                inlineText: true,
                optimize : 'none',
                pragmas: {
                    build: true
                },
                stubModules : ['text'],
                keepBuildDir: false,
                out:'client/main-built.js'
            }
        });
}