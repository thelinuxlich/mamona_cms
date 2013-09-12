
/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The system module encapsulates the most basic features used by other modules.
 * @module system
 * @requires require
 * @requires jquery
 */
define('durandal/system',['require', 'jquery'], function(require, $) {
    var isDebugging = false,
        nativeKeys = Object.keys,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        system,
        treatAsIE8 = false,
        nativeIsArray = Array.isArray,
        slice = Array.prototype.slice;

    //see http://patik.com/blog/complete-cross-browser-console-log/
    // Tell IE9 to use its built-in console
    if (Function.prototype.bind && (typeof console === 'object' || typeof console === 'function') && typeof console.log == 'object') {
        try {
            ['log', 'info', 'warn', 'error', 'assert', 'dir', 'clear', 'profile', 'profileEnd']
                .forEach(function(method) {
                    console[method] = this.call(console[method], console);
                }, Function.prototype.bind);
        } catch (ex) {
            treatAsIE8 = true;
        }
    }

    // callback for dojo's loader 
    // note: if you wish to use Durandal with dojo's AMD loader,
    // currently you must fork the dojo source with the following
    // dojo/dojo.js, line 1187, the last line of the finishExec() function: 
    //  (add) signal("moduleLoaded", [module.result, module.mid]);
    // an enhancement request has been submitted to dojo to make this
    // a permanent change. To view the status of this request, visit:
    // http://bugs.dojotoolkit.org/ticket/16727

    if (require.on) {
        require.on("moduleLoaded", function(module, mid) {
            system.setModuleId(module, mid);
        });
    }

    // callback for require.js loader
    if (typeof requirejs !== 'undefined') {
        requirejs.onResourceLoad = function(context, map, depArray) {
            system.setModuleId(context.defined[map.id], map.id);
        };
    }

    var noop = function() { };

    var log = function() {
        try {
            // Modern browsers
            if (typeof console != 'undefined' && typeof console.log == 'function') {
                // Opera 11
                if (window.opera) {
                    var i = 0;
                    while (i < arguments.length) {
                        console.log('Item ' + (i + 1) + ': ' + arguments[i]);
                        i++;
                    }
                }
                // All other modern browsers
                else if ((slice.call(arguments)).length == 1 && typeof slice.call(arguments)[0] == 'string') {
                    console.log((slice.call(arguments)).toString());
                } else {
                    console.log.apply(console, slice.call(arguments));
                }
            }
            // IE8
            else if ((!Function.prototype.bind || treatAsIE8) && typeof console != 'undefined' && typeof console.log == 'object') {
                Function.prototype.call.call(console.log, console, slice.call(arguments));
            }

            // IE7 and lower, and other old browsers
        } catch (ignore) { }
    };

    var logError = function(error) {
        if(error instanceof Error){
            throw error;
        }

        throw new Error(error);
    };

    /**
     * @class SystemModule
     * @static
     */
    system = {
        /**
         * Durandal's version.
         * @property {string} version
         */
        version: "2.0.0",
        /**
         * A noop function.
         * @method noop
         */
        noop: noop,
        /**
         * Gets the module id for the specified object.
         * @method getModuleId
         * @param {object} obj The object whose module id you wish to determine.
         * @return {string} The module id.
         */
        getModuleId: function(obj) {
            if (!obj) {
                return null;
            }

            if (typeof obj == 'function') {
                return obj.prototype.__moduleId__;
            }

            if (typeof obj == 'string') {
                return null;
            }

            return obj.__moduleId__;
        },
        /**
         * Sets the module id for the specified object.
         * @method setModuleId
         * @param {object} obj The object whose module id you wish to set.
         * @param {string} id The id to set for the specified object.
         */
        setModuleId: function(obj, id) {
            if (!obj) {
                return;
            }

            if (typeof obj == 'function') {
                obj.prototype.__moduleId__ = id;
                return;
            }

            if (typeof obj == 'string') {
                return;
            }

            obj.__moduleId__ = id;
        },
        /**
         * Resolves the default object instance for a module. If the module is an object, the module is returned. If the module is a function, that function is called with `new` and it's result is returned.
         * @method resolveObject
         * @param {object} module The module to use to get/create the default object for.
         * @return {object} The default object for the module.
         */
        resolveObject: function(module) {
            if (system.isFunction(module)) {
                return new module();
            } else {
                return module;
            }
        },
        /**
         * Gets/Sets whether or not Durandal is in debug mode.
         * @method debug
         * @param {boolean} [enable] Turns on/off debugging.
         * @return {boolean} Whether or not Durandal is current debugging.
         */
        debug: function(enable) {
            if (arguments.length == 1) {
                isDebugging = enable;
                if (isDebugging) {
                    this.log = log;
                    this.error = logError;
                    this.log('Debug:Enabled');
                } else {
                    this.log('Debug:Disabled');
                    this.log = noop;
                    this.error = noop;
                }
            }

            return isDebugging;
        },
        /**
         * Logs data to the console. Pass any number of parameters to be logged. Log output is not processed if the framework is not running in debug mode.
         * @method log
         * @param {object} info* The objects to log.
         */
        log: noop,
        /**
         * Logs an error.
         * @method error
         * @param {string|Error} obj The error to report.
         */
        error: noop,
        /**
         * Asserts a condition by throwing an error if the condition fails.
         * @method assert
         * @param {boolean} condition The condition to check.
         * @param {string} message The message to report in the error if the condition check fails.
         */
        assert: function (condition, message) {
            if (!condition) {
                system.error(new Error(message || 'Assert:Failed'));
            }
        },
        /**
         * Creates a deferred object which can be used to create a promise. Optionally pass a function action to perform which will be passed an object used in resolving the promise.
         * @method defer
         * @param {function} [action] The action to defer. You will be passed the deferred object as a paramter.
         * @return {Deferred} The deferred object.
         */
        defer: function(action) {
            return $.Deferred(action);
        },
        /**
         * Creates a simple V4 UUID. This should not be used as a PK in your database. It can be used to generate internal, unique ids. For a more robust solution see [node-uuid](https://github.com/broofa/node-uuid).
         * @method guid
         * @return {string} The guid.
         */
        guid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        /**
         * Uses require.js to obtain a module. This function returns a promise which resolves with the module instance. You can pass more than one module id to this function or an array of ids. If more than one or an array is passed, then the promise will resolve with an array of module instances.
         * @method acquire
         * @param {string|string[]} moduleId The id(s) of the modules to load.
         * @return {Promise} A promise for the loaded module(s).
         */
        acquire: function() {
            var modules,
                first = arguments[0],
                arrayRequest = false;

            if(system.isArray(first)){
                modules = first;
                arrayRequest = true;
            }else{
                modules = slice.call(arguments, 0);
            }

            return this.defer(function(dfd) {
                require(modules, function() {
                    var args = arguments;
                    setTimeout(function() {
                        if(args.length > 1 || arrayRequest){
                            dfd.resolve(slice.call(args, 0));
                        }else{
                            dfd.resolve(args[0]);
                        }
                    }, 1);
                }, function(err){
                    dfd.reject(err);
                });
            }).promise();
        },
        /**
         * Extends the first object with the properties of the following objects.
         * @method extend
         * @param {object} obj The target object to extend.
         * @param {object} extension* Uses to extend the target object.
         */
        extend: function(obj) {
            var rest = slice.call(arguments, 1);

            for (var i = 0; i < rest.length; i++) {
                var source = rest[i];

                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            }

            return obj;
        },
        /**
         * Uses a setTimeout to wait the specified milliseconds.
         * @method wait
         * @param {number} milliseconds The number of milliseconds to wait.
         * @return {Promise}
         */
        wait: function(milliseconds) {
            return system.defer(function(dfd) {
                setTimeout(dfd.resolve, milliseconds);
            }).promise();
        }
    };

    /**
     * Gets all the owned keys of the specified object.
     * @method keys
     * @param {object} object The object whose owned keys should be returned.
     * @return {string[]} The keys.
     */
    system.keys = nativeKeys || function(obj) {
        if (obj !== Object(obj)) {
            throw new TypeError('Invalid object');
        }

        var keys = [];

        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                keys[keys.length] = key;
            }
        }

        return keys;
    };

    /**
     * Determines if the specified object is an html element.
     * @method isElement
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */
    system.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    /**
     * Determines if the specified object is an array.
     * @method isArray
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */
    system.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) == '[object Array]';
    };

    /**
     * Determines if the specified object is...an object. ie. Not an array, string, etc.
     * @method isObject
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */
    system.isObject = function(obj) {
        return obj === Object(obj);
    };

    /**
     * Determines if the specified object is a boolean.
     * @method isBoolean
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */
    system.isBoolean = function(obj) {
        return typeof(obj) === "boolean";
    };

    /**
     * Determines if the specified object is a promise.
     * @method isPromise
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */
    system.isPromise = function(obj) {
        return obj && system.isFunction(obj.then);
    };

    /**
     * Determines if the specified object is a function arguments object.
     * @method isArguments
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    /**
     * Determines if the specified object is a function.
     * @method isFunction
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    /**
     * Determines if the specified object is a string.
     * @method isString
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    /**
     * Determines if the specified object is a number.
     * @method isNumber
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    /**
     * Determines if the specified object is a date.
     * @method isDate
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    /**
     * Determines if the specified object is a boolean.
     * @method isBoolean
     * @param {object} object The object to check.
     * @return {boolean} True if matches the type, false otherwise.
     */

    //isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    var isChecks = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];

    function makeIsFunction(name) {
        var value = '[object ' + name + ']';
        system['is' + name] = function(obj) {
            return toString.call(obj) == value;
        };
    }

    for (var i = 0; i < isChecks.length; i++) {
        makeIsFunction(isChecks[i]);
    }

    return system;
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The viewEngine module provides information to the viewLocator module which is used to locate the view's source file. The viewEngine also transforms a view id into a view instance.
 * @module viewEngine
 * @requires system
 * @requires jquery
 */
define('durandal/viewEngine',['durandal/system', 'jquery'], function (system, $) {
    var parseMarkup;

    if ($.parseHTML) {
        parseMarkup = function (html) {
            return $.parseHTML(html);
        };
    } else {
        parseMarkup = function (html) {
            return $(html).get();
        };
    }

    /**
     * @class ViewEngineModule
     * @static
     */
    return {
        /**
         * The file extension that view source files are expected to have.
         * @property {string} viewExtension
         * @default .html
         */
        viewExtension: '.html',
        /**
         * The name of the RequireJS loader plugin used by the viewLocator to obtain the view source. (Use requirejs to map the plugin's full path).
         * @property {string} viewPlugin
         * @default text
         */
        viewPlugin: 'text',
        /**
         * Determines if the url is a url for a view, according to the view engine.
         * @method isViewUrl
         * @param {string} url The potential view url.
         * @return {boolean} True if the url is a view url, false otherwise.
         */
        isViewUrl: function (url) {
            return url.indexOf(this.viewExtension, url.length - this.viewExtension.length) !== -1;
        },
        /**
         * Converts a view url into a view id.
         * @method convertViewUrlToViewId
         * @param {string} url The url to convert.
         * @return {string} The view id.
         */
        convertViewUrlToViewId: function (url) {
            return url.substring(0, url.length - this.viewExtension.length);
        },
        /**
         * Converts a view id into a full RequireJS path.
         * @method convertViewIdToRequirePath
         * @param {string} viewId The view id to convert.
         * @return {string} The require path.
         */
        convertViewIdToRequirePath: function (viewId) {
            return this.viewPlugin + '!' + viewId + this.viewExtension;
        },
        /**
         * Parses the view engine recognized markup and returns DOM elements.
         * @method parseMarkup
         * @param {string} markup The markup to parse.
         * @return {DOMElement[]} The elements.
         */
        parseMarkup: parseMarkup,
        /**
         * Calls `parseMarkup` and then pipes the results through `ensureSingleElement`.
         * @method processMarkup
         * @param {string} markup The markup to process.
         * @return {DOMElement} The view.
         */
        processMarkup: function (markup) {
            var allElements = this.parseMarkup(markup);
            return this.ensureSingleElement(allElements);
        },
        /**
         * Converts an array of elements into a single element. White space and comments are removed. If a single element does not remain, then the elements are wrapped.
         * @method ensureSingleElement
         * @param {DOMElement[]} allElements The elements.
         * @return {DOMElement} A single element.
         */
        ensureSingleElement:function(allElements){
            if (allElements.length == 1) {
                return allElements[0];
            }

            var withoutCommentsOrEmptyText = [];

            for (var i = 0; i < allElements.length; i++) {
                var current = allElements[i];
                if (current.nodeType != 8) {
                    if (current.nodeType == 3) {
                        var result = /\S/.test(current.nodeValue);
                        if (!result) {
                            continue;
                        }
                    }

                    withoutCommentsOrEmptyText.push(current);
                }
            }

            if (withoutCommentsOrEmptyText.length > 1) {
                return $(withoutCommentsOrEmptyText).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0);
            }

            return withoutCommentsOrEmptyText[0];
        },
        /**
         * Creates the view associated with the view id.
         * @method createView
         * @param {string} viewId The view id whose view should be created.
         * @return {Promise} A promise of the view.
         */
        createView: function(viewId) {
            var that = this;
            var requirePath = this.convertViewIdToRequirePath(viewId);

            return system.defer(function(dfd) {
                system.acquire(requirePath).then(function(markup) {
                    var element = that.processMarkup(markup);
                    element.setAttribute('data-view', viewId);
                    dfd.resolve(element);
                }).fail(function(err){
                        that.createFallbackView(viewId, requirePath, err).then(function(element){
                            element.setAttribute('data-view', viewId);
                            dfd.resolve(element);
                        });
                    });
            }).promise();
        },
        /**
         * Called when a view cannot be found to provide the opportunity to locate or generate a fallback view. Mainly used to ease development.
         * @method createFallbackView
         * @param {string} viewId The view id whose view should be created.
         * @param {string} requirePath The require path that was attempted.
         * @param {Error} requirePath The error that was returned from the attempt to locate the default view.
         * @return {Promise} A promise for the fallback view.
         */
        createFallbackView: function (viewId, requirePath, err) {
            var that = this,
                message = 'View Not Found. Searched for "' + viewId + '" via path "' + requirePath + '".';

            return system.defer(function(dfd) {
                dfd.resolve(that.processMarkup('<div class="durandal-view-404">' + message + '</div>'));
            }).promise();
        }
    };
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The viewLocator module collaborates with the viewEngine module to provide views (literally dom sub-trees) to other parts of the framework as needed. The primary consumer of the viewLocator is the composition module.
 * @module viewLocator
 * @requires system
 * @requires viewEngine
 */
define('durandal/viewLocator',['durandal/system', 'durandal/viewEngine'], function (system, viewEngine) {
    function findInElements(nodes, url) {
        for (var i = 0; i < nodes.length; i++) {
            var current = nodes[i];
            var existingUrl = current.getAttribute('data-view');
            if (existingUrl == url) {
                return current;
            }
        }
    }
    
    function escape(str) {
        return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
    }

    /**
     * @class ViewLocatorModule
     * @static
     */
    return {
        /**
         * Allows you to set up a convention for mapping module folders to view folders. It is a convenience method that customizes `convertModuleIdToViewId` and `translateViewIdToArea` under the covers.
         * @method useConvention
         * @param {string} [modulesPath] A string to match in the path and replace with the viewsPath. If not specified, the match is 'viewmodels'.
         * @param {string} [viewsPath] The replacement for the modulesPath. If not specified, the replacement is 'views'.
         * @param {string} [areasPath] Partial views are mapped to the "views" folder if not specified. Use this parameter to change their location.
         */
        useConvention: function(modulesPath, viewsPath, areasPath) {
            modulesPath = modulesPath || 'viewmodels';
            viewsPath = viewsPath || 'views';
            areasPath = areasPath || viewsPath;

            var reg = new RegExp(escape(modulesPath), 'gi');

            this.convertModuleIdToViewId = function (moduleId) {
                return moduleId.replace(reg, viewsPath);
            };

            this.translateViewIdToArea = function (viewId, area) {
                if (!area || area == 'partial') {
                    return areasPath + '/' + viewId;
                }
                
                return areasPath + '/' + area + '/' + viewId;
            };
        },
        /**
         * Maps an object instance to a view instance.
         * @method locateViewForObject
         * @param {object} obj The object to locate the view for.
         * @param {string} [area] The area to translate the view to.
         * @param {DOMElement[]} [elementsToSearch] An existing set of elements to search first.
         * @return {Promise} A promise of the view.
         */
        locateViewForObject: function(obj, area, elementsToSearch) {
            var view;

            if (obj.getView) {
                view = obj.getView();
                if (view) {
                    return this.locateView(view, area, elementsToSearch);
                }
            }

            if (obj.viewUrl) {
                return this.locateView(obj.viewUrl, area, elementsToSearch);
            }

            var id = system.getModuleId(obj);
            if (id) {
                return this.locateView(this.convertModuleIdToViewId(id), area, elementsToSearch);
            }

            return this.locateView(this.determineFallbackViewId(obj), area, elementsToSearch);
        },
        /**
         * Converts a module id into a view id. By default the ids are the same.
         * @method convertModuleIdToViewId
         * @param {string} moduleId The module id.
         * @return {string} The view id.
         */
        convertModuleIdToViewId: function(moduleId) {
            return moduleId;
        },
        /**
         * If no view id can be determined, this function is called to genreate one. By default it attempts to determine the object's type and use that.
         * @method determineFallbackViewId
         * @param {object} obj The object to determine the fallback id for.
         * @return {string} The view id.
         */
        determineFallbackViewId: function (obj) {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((obj).constructor.toString());
            var typeName = (results && results.length > 1) ? results[1] : "";

            return 'views/' + typeName;
        },
        /**
         * Takes a view id and translates it into a particular area. By default, no translation occurs.
         * @method translateViewIdToArea
         * @param {string} viewId The view id.
         * @param {string} area The area to translate the view to.
         * @return {string} The translated view id.
         */
        translateViewIdToArea: function (viewId, area) {
            return viewId;
        },
        /**
         * Locates the specified view.
         * @method locateView
         * @param {string|DOMElement} viewOrUrlOrId A view, view url or view id to locate.
         * @param {string} [area] The area to translate the view to.
         * @param {DOMElement[]} [elementsToSearch] An existing set of elements to search first.
         * @return {Promise} A promise of the view.
         */
        locateView: function(viewOrUrlOrId, area, elementsToSearch) {
            if (typeof viewOrUrlOrId === 'string') {
                var viewId;

                if (viewEngine.isViewUrl(viewOrUrlOrId)) {
                    viewId = viewEngine.convertViewUrlToViewId(viewOrUrlOrId);
                } else {
                    viewId = viewOrUrlOrId;
                }

                if (area) {
                    viewId = this.translateViewIdToArea(viewId, area);
                }

                if (elementsToSearch) {
                    var existing = findInElements(elementsToSearch, viewId);
                    if (existing) {
                        return system.defer(function(dfd) {
                            dfd.resolve(existing);
                        }).promise();
                    }
                }

                return viewEngine.createView(viewId);
            }

            return system.defer(function(dfd) {
                dfd.resolve(viewOrUrlOrId);
            }).promise();
        }
    };
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The binder joins an object instance and a DOM element tree by applying databinding and/or invoking binding lifecycle callbacks (binding and bindingComplete).
 * @module binder
 * @requires system
 * @requires knockout
 */
define('durandal/binder',['durandal/system', 'knockout'], function (system, ko) {
    var binder,
        insufficientInfoMessage = 'Insufficient Information to Bind',
        unexpectedViewMessage = 'Unexpected View Type',
        bindingInstructionKey = 'durandal-binding-instruction',
        koBindingContextKey = '__ko_bindingContext__';

    function normalizeBindingInstruction(result){
        if(result === undefined){
            return { applyBindings: true };
        }

        if(system.isBoolean(result)){
            return { applyBindings:result };
        }

        if(result.applyBindings === undefined){
            result.applyBindings = true;
        }

        return result;
    }

    function doBind(obj, view, bindingTarget, data){
        if (!view || !bindingTarget) {
            if (binder.throwOnErrors) {
                system.error(insufficientInfoMessage);
            } else {
                system.log(insufficientInfoMessage, view, data);
            }
            return;
        }

        if (!view.getAttribute) {
            if (binder.throwOnErrors) {
                system.error(unexpectedViewMessage);
            } else {
                system.log(unexpectedViewMessage, view, data);
            }
            return;
        }

        var viewName = view.getAttribute('data-view');

        try {
            var instruction;

            if (obj && obj.binding) {
                instruction = obj.binding(view);
            }

            instruction = normalizeBindingInstruction(instruction);
            binder.binding(data, view, instruction);

            if(instruction.applyBindings){
                system.log('Binding', viewName, data);
                ko.applyBindings(bindingTarget, view);
            }else if(obj){
                ko.utils.domData.set(view, koBindingContextKey, { $data:obj });
            }

            binder.bindingComplete(data, view, instruction);

            if (obj && obj.bindingComplete) {
                obj.bindingComplete(view);
            }

            ko.utils.domData.set(view, bindingInstructionKey, instruction);
            return instruction;
        } catch (e) {
            e.message = e.message + ';\nView: ' + viewName + ";\nModuleId: " + system.getModuleId(data);
            if (binder.throwOnErrors) {
                system.error(e);
            } else {
                system.log(e.message);
            }
        }
    }

    /**
     * @class BinderModule
     * @static
     */
    return binder = {
        /**
         * Called before every binding operation. Does nothing by default.
         * @method binding
         * @param {object} data The data that is about to be bound.
         * @param {DOMElement} view The view that is about to be bound.
         * @param {object} instruction The object that carries the binding instructions.
         */
        binding: system.noop,
        /**
         * Called after every binding operation. Does nothing by default.
         * @method bindingComplete
         * @param {object} data The data that has just been bound.
         * @param {DOMElement} view The view that has just been bound.
         * @param {object} instruction The object that carries the binding instructions.
         */
        bindingComplete: system.noop,
        /**
         * Indicates whether or not the binding system should throw errors or not.
         * @property {boolean} throwOnErrors
         * @default false The binding system will not throw errors by default. Instead it will log them.
         */
        throwOnErrors: false,
        /**
         * Gets the binding instruction that was associated with a view when it was bound.
         * @method getBindingInstruction
         * @param {DOMElement} view The view that was previously bound.
         * @return {object} The object that carries the binding instructions.
         */
        getBindingInstruction:function(view){
            return ko.utils.domData.get(view, bindingInstructionKey);
        },
        /**
         * Binds the view, preserving the existing binding context. Optionally, a new context can be created, parented to the previous context.
         * @method bindContext
         * @param {KnockoutBindingContext} bindingContext The current binding context.
         * @param {DOMElement} view The view to bind.
         * @param {object} [obj] The data to bind to, causing the creation of a child binding context if present.
         */
        bindContext: function(bindingContext, view, obj) {
            if (obj && bindingContext) {
                bindingContext = bindingContext.createChildContext(obj);
            }

            return doBind(obj, view, bindingContext, obj || (bindingContext ? bindingContext.$data : null));
        },
        /**
         * Binds the view, preserving the existing binding context. Optionally, a new context can be created, parented to the previous context.
         * @method bind
         * @param {object} obj The data to bind to.
         * @param {DOMElement} view The view to bind.
         */
        bind: function(obj, view) {
            return doBind(obj, view, obj, obj);
        }
    };
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The activator module encapsulates all logic related to screen/component activation.
 * An activator is essentially an asynchronous state machine that understands a particular state transition protocol.
 * The protocol ensures that the following series of events always occur: `canDeactivate` (previous state), `canActivate` (new state), `deactivate` (previous state), `activate` (new state).
 * Each of the _can_ callbacks may return a boolean, affirmative value or promise for one of those. If either of the _can_ functions yields a false result, then activation halts.
 * @module activator
 * @requires system
 * @requires knockout
 */
define('durandal/activator',['durandal/system', 'knockout'], function (system, ko) {
    var activator;

    function ensureSettings(settings) {
        if (settings == undefined) {
            settings = {};
        }

        if (!settings.closeOnDeactivate) {
            settings.closeOnDeactivate = activator.defaults.closeOnDeactivate;
        }

        if (!settings.beforeActivate) {
            settings.beforeActivate = activator.defaults.beforeActivate;
        }

        if (!settings.afterDeactivate) {
            settings.afterDeactivate = activator.defaults.afterDeactivate;
        }

        if(!settings.affirmations){
            settings.affirmations = activator.defaults.affirmations;
        }

        if (!settings.interpretResponse) {
            settings.interpretResponse = activator.defaults.interpretResponse;
        }

        if (!settings.areSameItem) {
            settings.areSameItem = activator.defaults.areSameItem;
        }

        return settings;
    }

    function invoke(target, method, data) {
        if (system.isArray(data)) {
            return target[method].apply(target, data);
        }

        return target[method](data);
    }

    function deactivate(item, close, settings, dfd, setter) {
        if (item && item.deactivate) {
            system.log('Deactivating', item);

            var result;
            try {
                result = item.deactivate(close);
            } catch(error) {
                system.error(error);
                dfd.resolve(false);
                return;
            }

            if (result && result.then) {
                result.then(function() {
                    settings.afterDeactivate(item, close, setter);
                    dfd.resolve(true);
                }, function(reason) {
                    system.log(reason);
                    dfd.resolve(false);
                });
            } else {
                settings.afterDeactivate(item, close, setter);
                dfd.resolve(true);
            }
        } else {
            if (item) {
                settings.afterDeactivate(item, close, setter);
            }

            dfd.resolve(true);
        }
    }

    function activate(newItem, activeItem, callback, activationData) {
        if (newItem) {
            if (newItem.activate) {
                system.log('Activating', newItem);

                var result;
                try {
                    result = invoke(newItem, 'activate', activationData);
                } catch (error) {
                    system.error(error);
                    callback(false);
                    return;
                }

                if (result && result.then) {
                    result.then(function() {
                        activeItem(newItem);
                        callback(true);
                    }, function(reason) {
                        system.log(reason);
                        callback(false);
                    });
                } else {
                    activeItem(newItem);
                    callback(true);
                }
            } else {
                activeItem(newItem);
                callback(true);
            }
        } else {
            callback(true);
        }
    }

    function canDeactivateItem(item, close, settings) {
        settings.lifecycleData = null;

        return system.defer(function (dfd) {
            if (item && item.canDeactivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = item.canDeactivate(close);
                } catch(error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        settings.lifecycleData = result;
                        dfd.resolve(settings.interpretResponse(result));
                    }, function(reason) {
                        system.error(reason);
                        dfd.resolve(false);
                    });
                } else {
                    settings.lifecycleData = resultOrPromise;
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    function canActivateItem(newItem, activeItem, settings, activationData) {
        settings.lifecycleData = null;

        return system.defer(function (dfd) {
            if (newItem == activeItem()) {
                dfd.resolve(true);
                return;
            }

            if (newItem && newItem.canActivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = invoke(newItem, 'canActivate', activationData);
                } catch (error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        settings.lifecycleData = result;
                        dfd.resolve(settings.interpretResponse(result));
                    }, function(reason) {
                        system.error(reason);
                        dfd.resolve(false);
                    });
                } else {
                    settings.lifecycleData = resultOrPromise;
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    /**
     * An activator is a read/write computed observable that enforces the activation lifecycle whenever changing values.
     * @class Activator
     */
    function createActivator(initialActiveItem, settings) {
        var activeItem = ko.observable(null);
        var activeData;

        settings = ensureSettings(settings);

        var computed = ko.computed({
            read: function () {
                return activeItem();
            },
            write: function (newValue) {
                computed.viaSetter = true;
                computed.activateItem(newValue);
            }
        });

        computed.__activator__ = true;

        /**
         * The settings for this activator.
         * @property {ActivatorSettings} settings
         */
        computed.settings = settings;
        settings.activator = computed;

        /**
         * An observable which indicates whether or not the activator is currently in the process of activating an instance.
         * @method isActivating
         * @return {boolean}
         */
        computed.isActivating = ko.observable(false);

        /**
         * Determines whether or not the specified item can be deactivated.
         * @method canDeactivateItem
         * @param {object} item The item to check.
         * @param {boolean} close Whether or not to check if close is possible.
         * @return {promise}
         */
        computed.canDeactivateItem = function (item, close) {
            return canDeactivateItem(item, close, settings);
        };

        /**
         * Deactivates the specified item.
         * @method deactivateItem
         * @param {object} item The item to deactivate.
         * @param {boolean} close Whether or not to close the item.
         * @return {promise}
         */
        computed.deactivateItem = function (item, close) {
            return system.defer(function(dfd) {
                computed.canDeactivateItem(item, close).then(function(canDeactivate) {
                    if (canDeactivate) {
                        deactivate(item, close, settings, dfd, activeItem);
                    } else {
                        computed.notifySubscribers();
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        /**
         * Determines whether or not the specified item can be activated.
         * @method canActivateItem
         * @param {object} item The item to check.
         * @param {object} activationData Data associated with the activation.
         * @return {promise}
         */
        computed.canActivateItem = function (newItem, activationData) {
            return canActivateItem(newItem, activeItem, settings, activationData);
        };

        /**
         * Activates the specified item.
         * @method activateItem
         * @param {object} newItem The item to activate.
         * @param {object} newActivationData Data associated with the activation.
         * @return {promise}
         */
        computed.activateItem = function (newItem, newActivationData) {
            var viaSetter = computed.viaSetter;
            computed.viaSetter = false;

            return system.defer(function (dfd) {
                if (computed.isActivating()) {
                    dfd.resolve(false);
                    return;
                }

                computed.isActivating(true);

                var currentItem = activeItem();
                if (settings.areSameItem(currentItem, newItem, activeData, newActivationData)) {
                    computed.isActivating(false);
                    dfd.resolve(true);
                    return;
                }

                computed.canDeactivateItem(currentItem, settings.closeOnDeactivate).then(function (canDeactivate) {
                    if (canDeactivate) {
                        computed.canActivateItem(newItem, newActivationData).then(function (canActivate) {
                            if (canActivate) {
                                system.defer(function (dfd2) {
                                    deactivate(currentItem, settings.closeOnDeactivate, settings, dfd2);
                                }).promise().then(function () {
                                    newItem = settings.beforeActivate(newItem, newActivationData);
                                    activate(newItem, activeItem, function (result) {
                                        activeData = newActivationData;
                                        computed.isActivating(false);
                                        dfd.resolve(result);
                                    }, newActivationData);
                                });
                            } else {
                                if (viaSetter) {
                                    computed.notifySubscribers();
                                }

                                computed.isActivating(false);
                                dfd.resolve(false);
                            }
                        });
                    } else {
                        if (viaSetter) {
                            computed.notifySubscribers();
                        }

                        computed.isActivating(false);
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        /**
         * Determines whether or not the activator, in its current state, can be activated.
         * @method canActivate
         * @return {promise}
         */
        computed.canActivate = function () {
            var toCheck;

            if (initialActiveItem) {
                toCheck = initialActiveItem;
                initialActiveItem = false;
            } else {
                toCheck = computed();
            }

            return computed.canActivateItem(toCheck);
        };

        /**
         * Activates the activator, in its current state.
         * @method activate
         * @return {promise}
         */
        computed.activate = function () {
            var toActivate;

            if (initialActiveItem) {
                toActivate = initialActiveItem;
                initialActiveItem = false;
            } else {
                toActivate = computed();
            }

            return computed.activateItem(toActivate);
        };

        /**
         * Determines whether or not the activator, in its current state, can be deactivated.
         * @method canDeactivate
         * @return {promise}
         */
        computed.canDeactivate = function (close) {
            return computed.canDeactivateItem(computed(), close);
        };

        /**
         * Deactivates the activator, in its current state.
         * @method deactivate
         * @return {promise}
         */
        computed.deactivate = function (close) {
            return computed.deactivateItem(computed(), close);
        };

        computed.includeIn = function (includeIn) {
            includeIn.canActivate = function () {
                return computed.canActivate();
            };

            includeIn.activate = function () {
                return computed.activate();
            };

            includeIn.canDeactivate = function (close) {
                return computed.canDeactivate(close);
            };

            includeIn.deactivate = function (close) {
                return computed.deactivate(close);
            };
        };

        if (settings.includeIn) {
            computed.includeIn(settings.includeIn);
        } else if (initialActiveItem) {
            computed.activate();
        }

        computed.forItems = function (items) {
            settings.closeOnDeactivate = false;

            settings.determineNextItemToActivate = function (list, lastIndex) {
                var toRemoveAt = lastIndex - 1;

                if (toRemoveAt == -1 && list.length > 1) {
                    return list[1];
                }

                if (toRemoveAt > -1 && toRemoveAt < list.length - 1) {
                    return list[toRemoveAt];
                }

                return null;
            };

            settings.beforeActivate = function (newItem) {
                var currentItem = computed();

                if (!newItem) {
                    newItem = settings.determineNextItemToActivate(items, currentItem ? items.indexOf(currentItem) : 0);
                } else {
                    var index = items.indexOf(newItem);

                    if (index == -1) {
                        items.push(newItem);
                    } else {
                        newItem = items()[index];
                    }
                }

                return newItem;
            };

            settings.afterDeactivate = function (oldItem, close) {
                if (close) {
                    items.remove(oldItem);
                }
            };

            var originalCanDeactivate = computed.canDeactivate;
            computed.canDeactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = [];

                        function finish() {
                            for (var j = 0; j < results.length; j++) {
                                if (!results[j]) {
                                    dfd.resolve(false);
                                    return;
                                }
                            }

                            dfd.resolve(true);
                        }

                        for (var i = 0; i < list.length; i++) {
                            computed.canDeactivateItem(list[i], close).then(function (result) {
                                results.push(result);
                                if (results.length == list.length) {
                                    finish();
                                }
                            });
                        }
                    }).promise();
                } else {
                    return originalCanDeactivate();
                }
            };

            var originalDeactivate = computed.deactivate;
            computed.deactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = 0;
                        var listLength = list.length;

                        function doDeactivate(item) {
                            computed.deactivateItem(item, close).then(function () {
                                results++;
                                items.remove(item);
                                if (results == listLength) {
                                    dfd.resolve();
                                }
                            });
                        }

                        for (var i = 0; i < listLength; i++) {
                            doDeactivate(list[i]);
                        }
                    }).promise();
                } else {
                    return originalDeactivate();
                }
            };

            return computed;
        };

        return computed;
    }

    /**
     * @class ActivatorSettings
     * @static
     */
    var activatorSettings = {
        /**
         * The default value passed to an object's deactivate function as its close parameter.
         * @property {boolean} closeOnDeactivate
         * @default true
         */
        closeOnDeactivate: true,
        /**
         * Lower-cased words which represent a truthy value.
         * @property {string[]} affirmations
         * @default ['yes', 'ok', 'true']
         */
        affirmations: ['yes', 'ok', 'true'],
        /**
         * Interprets the response of a `canActivate` or `canDeactivate` call using the known affirmative values in the `affirmations` array.
         * @method interpretResponse
         * @param {object} value
         * @return {boolean}
         */
        interpretResponse: function(value) {
            if(system.isObject(value)) {
                value = value.can || false;
            }

            if(system.isString(value)) {
                return ko.utils.arrayIndexOf(this.affirmations, value.toLowerCase()) !== -1;
            }

            return value;
        },
        /**
         * Determines whether or not the current item and the new item are the same.
         * @method areSameItem
         * @param {object} currentItem
         * @param {object} newItem
         * @param {object} currentActivationData
         * @param {object} newActivationData
         * @return {boolean}
         */
        areSameItem: function(currentItem, newItem, currentActivationData, newActivationData) {
            return currentItem == newItem;
        },
        /**
         * Called immediately before the new item is activated.
         * @method beforeActivate
         * @param {object} newItem
         */
        beforeActivate: function(newItem) {
            return newItem;
        },
        /**
         * Called immediately after the old item is deactivated.
         * @method afterDeactivate
         * @param {object} oldItem The previous item.
         * @param {boolean} close Whether or not the previous item was closed.
         * @param {function} setter The activate item setter function.
         */
        afterDeactivate: function(oldItem, close, setter) {
            if(close && setter) {
                setter(null);
            }
        }
    };

    /**
     * @class ActivatorModule
     * @static
     */
    activator = {
        /**
         * The default settings used by activators.
         * @property {ActivatorSettings} defaults
         */
        defaults: activatorSettings,
        /**
          * Creates a new activator.
          * @method create
          * @param {object} [initialActiveItem] The item which should be immediately activated upon creation of the ativator.
          * @param {ActivatorSettings} [settings] Per activator overrides of the default activator settings.
          * @return {Activator} The created activator.
          */
        create: createActivator,
        /**
         * Determines whether or not the provided object is an activator or not.
         * @method isActivator
         * @param {object} object Any object you wish to verify as an activator or not.
         * @return {boolean} True if the object is an activator; false otherwise.
         */
        isActivator:function(object){
            return object && object.__activator__;
        }
    };

    return activator;
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The composition module encapsulates all functionality related to visual composition.
 * @module composition
 * @requires system
 * @requires viewLocator
 * @requires binder
 * @requires viewEngine
 * @requires activator
 * @requires jquery
 * @requires knockout
 */
define('durandal/composition',['durandal/system', 'durandal/viewLocator', 'durandal/binder', 'durandal/viewEngine', 'durandal/activator', 'jquery', 'knockout'], function (system, viewLocator, binder, viewEngine, activator, $, ko) {
    var dummyModel = {},
        activeViewAttributeName = 'data-active-view',
        composition,
        compositionCompleteCallbacks = [],
        compositionCount = 0,
        compositionDataKey = 'durandal-composition-data',
        partAttributeName = 'data-part',
        partAttributeSelector = '[' + partAttributeName + ']',
        bindableSettings = ['model', 'view', 'transition', 'area', 'strategy', 'activationData'];

    function getHostState(parent) {
        var elements = [];
        var state = {
            childElements: elements,
            activeView: null
        };

        var child = ko.virtualElements.firstChild(parent);

        while (child) {
            if (child.nodeType == 1) {
                elements.push(child);
                if (child.getAttribute(activeViewAttributeName)) {
                    state.activeView = child;
                }
            }

            child = ko.virtualElements.nextSibling(child);
        }

        if(!state.activeView){
            state.activeView = elements[0];
        }

        return state;
    }

    function endComposition() {
        compositionCount--;

        if (compositionCount === 0) {
            setTimeout(function(){
                var i = compositionCompleteCallbacks.length;

                while(i--) {
                    compositionCompleteCallbacks[i]();
                }

                compositionCompleteCallbacks = [];
            }, 1);
        }
    }

    function tryActivate(context, successCallback, skipActivation) {
        if(skipActivation){
            successCallback();
        } else if (context.activate && context.model && context.model.activate) {
            var result;

            if(system.isArray(context.activationData)) {
                result = context.model.activate.apply(context.model, context.activationData);
            } else {
                result = context.model.activate(context.activationData);
            }

            if(result && result.then) {
                result.then(successCallback);
            } else if(result || result === undefined) {
                successCallback();
            } else {
                endComposition();
            }
        } else {
            successCallback();
        }
    }

    function triggerAttach() {
        var context = this;

        if (context.activeView) {
            context.activeView.removeAttribute(activeViewAttributeName);
        }

        if (context.child) {
            if (context.model && context.model.attached) {
                if (context.composingNewView || context.alwaysTriggerAttach) {
                    context.model.attached(context.child, context.parent, context);
                }
            }

            if (context.attached) {
                context.attached(context.child, context.parent, context);
            }

            context.child.setAttribute(activeViewAttributeName, true);

            if (context.composingNewView && context.model) {
                if (context.model.compositionComplete) {
                    composition.current.complete(function () {
                        context.model.compositionComplete(context.child, context.parent, context);
                    });
                }

                if (context.model.detached) {
                    ko.utils.domNodeDisposal.addDisposeCallback(context.child, function () {
                        context.model.detached(context.child, context.parent, context);
                    });
                }
            }

            if (context.compositionComplete) {
                composition.current.complete(function () {
                    context.compositionComplete(context.child, context.parent, context);
                });
            }
        }

        endComposition();
        context.triggerAttach = system.noop;
    }

    function shouldTransition(context) {
        if (system.isString(context.transition)) {
            if (context.activeView) {
                if (context.activeView == context.child) {
                    return false;
                }

                if (!context.child) {
                    return true;
                }

                if (context.skipTransitionOnSameViewId) {
                    var currentViewId = context.activeView.getAttribute('data-view');
                    var newViewId = context.child.getAttribute('data-view');
                    return currentViewId != newViewId;
                }
            }

            return true;
        }

        return false;
    }

    function cloneNodes(nodesArray) {
        for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
            var clonedNode = nodesArray[i].cloneNode(true);
            newNodesArray.push(clonedNode);
        }
        return newNodesArray;
    }

    function replaceParts(context){
        var parts = cloneNodes(context.parts);
        var replacementParts = composition.getParts(parts);
        var standardParts = composition.getParts(context.child);

        for (var partId in replacementParts) {
            $(standardParts[partId]).replaceWith(replacementParts[partId]);
        }
    }

    function removePreviousView(parent){
        var children = ko.virtualElements.childNodes(parent), i, len;

        if(!system.isArray(children)){
            var arrayChildren = [];

            for(i = 0, len = children.length; i < len; i++){
                arrayChildren[i] = children[i];
            }

            children = arrayChildren;
        }

        for(i = 1,len = children.length; i < len; i++){
            ko.removeNode(children[i]);
        }
    }

    /**
     * @class CompositionTransaction
     * @static
     */
    var compositionTransaction = {
        /**
         * Registers a callback which will be invoked when the current composition transaction has completed. The transaction includes all parent and children compositions.
         * @method complete
         * @param {function} callback The callback to be invoked when composition is complete.
         */
        complete: function (callback) {
            compositionCompleteCallbacks.push(callback);
        }
    };

    /**
     * @class CompositionModule
     * @static
     */
    composition = {
        /**
         * Converts a transition name to its moduleId.
         * @method convertTransitionToModuleId
         * @param {string} name The name of the transtion.
         * @return {string} The moduleId.
         */
        convertTransitionToModuleId: function (name) {
            return 'transitions/' + name;
        },
        /**
         * The name of the transition to use in all compositions.
         * @property {string} defaultTransitionName
         * @default null
         */
        defaultTransitionName: null,
        /**
         * Represents the currently executing composition transaction.
         * @property {CompositionTransaction} current
         */
        current: compositionTransaction,
        /**
         * Registers a binding handler that will be invoked when the current composition transaction is complete.
         * @method addBindingHandler
         * @param {string} name The name of the binding handler.
         * @param {object} [config] The binding handler instance. If none is provided, the name will be used to look up an existing handler which will then be converted to a composition handler.
         * @param {function} [initOptionsFactory] If the registered binding needs to return options from its init call back to knockout, this function will server as a factory for those options. It will receive the same parameters that the init function does.
         */
        addBindingHandler:function(name, config, initOptionsFactory){
            var key,
                dataKey = 'composition-handler-' + name,
                handler;

            config = config || ko.bindingHandlers[name];
            initOptionsFactory = initOptionsFactory || function(){ return undefined;  };

            handler = ko.bindingHandlers[name] = {
                init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var data = {
                        trigger:ko.observable(null)
                    };

                    composition.current.complete(function(){
                        if(config.init){
                            config.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                        }

                        if(config.update){
                            ko.utils.domData.set(element, dataKey, config);
                            data.trigger('trigger');
                        }
                    });

                    ko.utils.domData.set(element, dataKey, data);

                    return initOptionsFactory(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                },
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var data = ko.utils.domData.get(element, dataKey);

                    if(data.update){
                        return data.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
                    }

                    data.trigger();
                }
            };

            for (key in config) {
                if (key !== "init" && key !== "update") {
                    handler[key] = config[key];
                }
            }
        },
        /**
         * Gets an object keyed with all the elements that are replacable parts, found within the supplied elements. The key will be the part name and the value will be the element itself.
         * @method getParts
         * @param {DOMElement\DOMElement[]} elements The element(s) to search for parts.
         * @return {object} An object keyed by part.
         */
        getParts: function(elements) {
            var parts = {};

            if (!system.isArray(elements)) {
                elements = [elements];
            }

            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                if (element.getAttribute) {
                    var id = element.getAttribute(partAttributeName);
                    if (id) {
                        parts[id] = element;
                    }

                    var childParts = $(partAttributeSelector, element)
                        .not($('[data-bind] ' + partAttributeSelector, element));

                    for (var j = 0; j < childParts.length; j++) {
                        var part = childParts.get(j);
                        parts[part.getAttribute(partAttributeName)] = part;
                    }
                }
            }

            return parts;
        },
        cloneNodes:cloneNodes,
        finalize: function (context) {
            context.transition = context.transition || this.defaultTransitionName;

            if(!context.child && !context.activeView){
                if (!context.cacheViews) {
                    ko.virtualElements.emptyNode(context.parent);
                }

                context.triggerAttach();
            }else if (shouldTransition(context)) {
                var transitionModuleId = this.convertTransitionToModuleId(context.transition);

                system.acquire(transitionModuleId).then(function (transition) {
                    context.transition = transition;

                    transition(context).then(function () {
                        if (!context.cacheViews) {
                            if(!context.child){
                                ko.virtualElements.emptyNode(context.parent);
                            }else{
                                removePreviousView(context.parent);
                            }
                        }else if(context.activeView){
                            var instruction = binder.getBindingInstruction(context.activeView);
                            if(instruction.cacheViews != undefined && !instruction.cacheViews){
                                ko.removeNode(context.activeView);
                            }
                        }

                        context.triggerAttach();
                    });
                }).fail(function(err){
                    system.error('Failed to load transition (' + transitionModuleId + '). Details: ' + err.message);
                });
            } else {
                if (context.child != context.activeView) {
                    if (context.cacheViews && context.activeView) {
                        var instruction = binder.getBindingInstruction(context.activeView);
                        if(instruction.cacheViews != undefined && !instruction.cacheViews){
                            ko.removeNode(context.activeView);
                        }else{
                            $(context.activeView).hide();
                        }
                    }

                    if (!context.child) {
                        if (!context.cacheViews) {
                            ko.virtualElements.emptyNode(context.parent);
                        }
                    } else {
                        if (!context.cacheViews) {
                            removePreviousView(context.parent);
                        }

                        $(context.child).show();
                    }
                }

                context.triggerAttach();
            }
        },
        bindAndShow: function (child, context, skipActivation) {
            context.child = child;

            if (context.cacheViews) {
                context.composingNewView = (ko.utils.arrayIndexOf(context.viewElements, child) == -1);
            } else {
                context.composingNewView = true;
            }

            tryActivate(context, function () {
                if (context.binding) {
                    context.binding(context.child, context.parent, context);
                }

                if (context.preserveContext && context.bindingContext) {
                    if (context.composingNewView) {
                        if(context.parts){
                            replaceParts(context);
                        }

                        $(child).hide();
                        ko.virtualElements.prepend(context.parent, child);

                        binder.bindContext(context.bindingContext, child, context.model);
                    }
                } else if (child) {
                    var modelToBind = context.model || dummyModel;
                    var currentModel = ko.dataFor(child);

                    if (currentModel != modelToBind) {
                        if (!context.composingNewView) {
                            $(child).remove();
                            viewEngine.createView(child.getAttribute('data-view')).then(function(recreatedView) {
                                composition.bindAndShow(recreatedView, context, true);
                            });
                            return;
                        }

                        if(context.parts){
                            replaceParts(context);
                        }

                        $(child).hide();
                        ko.virtualElements.prepend(context.parent, child);

                        binder.bind(modelToBind, child);
                    }
                }

                composition.finalize(context);
            }, skipActivation);
        },
        /**
         * Eecutes the default view location strategy.
         * @method defaultStrategy
         * @param {object} context The composition context containing the model and possibly existing viewElements.
         * @return {promise} A promise for the view.
         */
        defaultStrategy: function (context) {
            return viewLocator.locateViewForObject(context.model, context.area, context.viewElements);
        },
        getSettings: function (valueAccessor, element) {
            var value = valueAccessor(),
                settings = ko.utils.unwrapObservable(value) || {},
                activatorPresent = activator.isActivator(value),
                moduleId;

            if (system.isString(settings)) {
                if (viewEngine.isViewUrl(settings)) {
                    settings = {
                        view: settings
                    };
                } else {
                    settings = {
                        model: settings,
                        activate: true
                    };
                }

                return settings;
            }

            moduleId = system.getModuleId(settings);
            if (moduleId) {
                settings = {
                    model: settings,
                    activate: true
                };

                return settings;
            }

            if(!activatorPresent && settings.model) {
                activatorPresent = activator.isActivator(settings.model);
            }

            for (var attrName in settings) {
                if (ko.utils.arrayIndexOf(bindableSettings, attrName) != -1) {
                    settings[attrName] = ko.utils.unwrapObservable(settings[attrName]);
                } else {
                    settings[attrName] = settings[attrName];
                }
            }

            if (activatorPresent) {
                settings.activate = false;
            } else if (settings.activate === undefined) {
                settings.activate = true;
            }

            return settings;
        },
        executeStrategy: function (context) {
            context.strategy(context).then(function (child) {
                composition.bindAndShow(child, context);
            });
        },
        inject: function (context) {
            if (!context.model) {
                this.bindAndShow(null, context);
                return;
            }

            if (context.view) {
                viewLocator.locateView(context.view, context.area, context.viewElements).then(function (child) {
                    composition.bindAndShow(child, context);
                });
                return;
            }

            if (!context.strategy) {
                context.strategy = this.defaultStrategy;
            }

            if (system.isString(context.strategy)) {
                system.acquire(context.strategy).then(function (strategy) {
                    context.strategy = strategy;
                    composition.executeStrategy(context);
                }).fail(function(err){
                    system.error('Failed to load view strategy (' + context.strategy + '). Details: ' + err.message);
                });
            } else {
                this.executeStrategy(context);
            }
        },
        /**
         * Initiates a composition.
         * @method compose
         * @param {DOMElement} element The DOMElement or knockout virtual element that serves as the parent for the composition.
         * @param {object} settings The composition settings.
         * @param {object} [bindingContext] The current binding context.
         */
        compose: function (element, settings, bindingContext, fromBinding) {
            compositionCount++;

            if(!fromBinding){
                settings = composition.getSettings(function() { return settings; }, element);
            }

            var hostState = getHostState(element);

            settings.activeView = hostState.activeView;
            settings.parent = element;
            settings.triggerAttach = triggerAttach;
            settings.bindingContext = bindingContext;

            if (settings.cacheViews && !settings.viewElements) {
                settings.viewElements = hostState.childElements;
            }

            if (!settings.model) {
                if (!settings.view) {
                    this.bindAndShow(null, settings);
                } else {
                    settings.area = settings.area || 'partial';
                    settings.preserveContext = true;

                    viewLocator.locateView(settings.view, settings.area, settings.viewElements).then(function (child) {
                        composition.bindAndShow(child, settings);
                    });
                }
            } else if (system.isString(settings.model)) {
                system.acquire(settings.model).then(function (module) {
                    settings.model = system.resolveObject(module);
                    composition.inject(settings);
                }).fail(function(err){
                    system.error('Failed to load composed module (' + settings.model + '). Details: ' + err.message);
                });
            } else {
                composition.inject(settings);
            }
        }
    };

    ko.bindingHandlers.compose = {
        init: function() {
            return { controlsDescendantBindings: true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = composition.getSettings(valueAccessor, element);
            if(settings.mode){
                var data = ko.utils.domData.get(element, compositionDataKey);
                if(!data){
                    var childNodes = ko.virtualElements.childNodes(element);
                    data = {};

                    if(settings.mode === 'inline'){
                        data.view = viewEngine.ensureSingleElement(childNodes);
                    }else if(settings.mode === 'templated'){
                        data.parts = cloneNodes(childNodes);
                    }

                    ko.virtualElements.emptyNode(element);
                    ko.utils.domData.set(element, compositionDataKey, data);
                }

                if(settings.mode === 'inline'){
                    settings.view = data.view.cloneNode(true);
                }else if(settings.mode === 'templated'){
                    settings.parts = data.parts;
                }

                settings.preserveContext = true;
            }

            composition.compose(element, settings, bindingContext, true);
        }
    };

    ko.virtualElements.allowedBindings.compose = true;

    return composition;
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * Durandal events originate from backbone.js but also combine some ideas from signals.js as well as some additional improvements.
 * Events can be installed into any object and are installed into the `app` module by default for convenient app-wide eventing.
 * @module events
 * @requires system
 */
define('durandal/events',['durandal/system'], function (system) {
    var eventSplitter = /\s+/;
    var Events = function() { };

    /**
     * Represents an event subscription.
     * @class Subscription
     */
    var Subscription = function(owner, events) {
        this.owner = owner;
        this.events = events;
    };

    /**
     * Attaches a callback to the event subscription.
     * @method then
     * @param {function} callback The callback function to invoke when the event is triggered.
     * @param {object} [context] An object to use as `this` when invoking the `callback`.
     * @chainable
     */
    Subscription.prototype.then = function (callback, context) {
        this.callback = callback || this.callback;
        this.context = context || this.context;

        if (!this.callback) {
            return this;
        }

        this.owner.on(this.events, this.callback, this.context);
        return this;
    };

    /**
     * Attaches a callback to the event subscription.
     * @method on
     * @param {function} [callback] The callback function to invoke when the event is triggered. If `callback` is not provided, the previous callback will be re-activated.
     * @param {object} [context] An object to use as `this` when invoking the `callback`.
     * @chainable
     */
    Subscription.prototype.on = Subscription.prototype.then;

    /**
     * Cancels the subscription.
     * @method off
     * @chainable
     */
    Subscription.prototype.off = function () {
        this.owner.off(this.events, this.callback, this.context);
        return this;
    };

    /**
     * Creates an object with eventing capabilities.
     * @class Events
     */

    /**
     * Creates a subscription or registers a callback for the specified event.
     * @method on
     * @param {string} events One or more events, separated by white space.
     * @param {function} [callback] The callback function to invoke when the event is triggered. If `callback` is not provided, a subscription instance is returned.
     * @param {object} [context] An object to use as `this` when invoking the `callback`.
     * @return {Subscription|Events} A subscription is returned if no callback is supplied, otherwise the events object is returned for chaining.
     */
    Events.prototype.on = function(events, callback, context) {
        var calls, event, list;

        if (!callback) {
            return new Subscription(this, events);
        } else {
            calls = this.callbacks || (this.callbacks = {});
            events = events.split(eventSplitter);

            while (event = events.shift()) {
                list = calls[event] || (calls[event] = []);
                list.push(callback, context);
            }

            return this;
        }
    };

    /**
     * Removes the callbacks for the specified events.
     * @method off
     * @param {string} [events] One or more events, separated by white space to turn off. If no events are specified, then the callbacks will be removed.
     * @param {function} [callback] The callback function to remove. If `callback` is not provided, all callbacks for the specified events will be removed.
     * @param {object} [context] The object that was used as `this`. Callbacks with this context will be removed.
     * @chainable
     */
    Events.prototype.off = function(events, callback, context) {
        var event, calls, list, i;

        // No events
        if (!(calls = this.callbacks)) {
            return this;
        }

        //removing all
        if (!(events || callback || context)) {
            delete this.callbacks;
            return this;
        }

        events = events ? events.split(eventSplitter) : system.keys(calls);

        // Loop through the callback list, splicing where appropriate.
        while (event = events.shift()) {
            if (!(list = calls[event]) || !(callback || context)) {
                delete calls[event];
                continue;
            }

            for (i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                    list.splice(i, 2);
                }
            }
        }

        return this;
    };

    /**
     * Triggers the specified events.
     * @method trigger
     * @param {string} [events] One or more events, separated by white space to trigger.
     * @chainable
     */
    Events.prototype.trigger = function(events) {
        var event, calls, list, i, length, args, all, rest;
        if (!(calls = this.callbacks)) {
            return this;
        }

        rest = [];
        events = events.split(eventSplitter);
        for (i = 1, length = arguments.length; i < length; i++) {
            rest[i - 1] = arguments[i];
        }

        // For each event, walk through the list of callbacks twice, first to
        // trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
            // Copy callback lists to prevent modification.
            if (all = calls.all) {
                all = all.slice();
            }

            if (list = calls[event]) {
                list = list.slice();
            }

            // Execute event callbacks.
            if (list) {
                for (i = 0, length = list.length; i < length; i += 2) {
                    list[i].apply(list[i + 1] || this, rest);
                }
            }

            // Execute "all" callbacks.
            if (all) {
                args = [event].concat(rest);
                for (i = 0, length = all.length; i < length; i += 2) {
                    all[i].apply(all[i + 1] || this, args);
                }
            }
        }

        return this;
    };

    /**
     * Creates a function that will trigger the specified events when called. Simplifies proxying jQuery (or other) events through to the events object.
     * @method proxy
     * @param {string} events One or more events, separated by white space to trigger by invoking the returned function.
     * @return {function} Calling the function will invoke the previously specified events on the events object.
     */
    Events.prototype.proxy = function(events) {
        var that = this;
        return (function(arg) {
            that.trigger(events, arg);
        });
    };

    /**
     * Creates an object with eventing capabilities.
     * @class EventsModule
     * @static
     */

    /**
     * Adds eventing capabilities to the specified object.
     * @method includeIn
     * @param {object} targetObject The object to add eventing capabilities to.
     */
    Events.includeIn = function(targetObject) {
        targetObject.on = Events.prototype.on;
        targetObject.off = Events.prototype.off;
        targetObject.trigger = Events.prototype.trigger;
        targetObject.proxy = Events.prototype.proxy;
    };

    return Events;
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The app module controls app startup, plugin loading/configuration and root visual display.
 * @module app
 * @requires system
 * @requires viewEngine
 * @requires composition
 * @requires events
 * @requires jquery
 */
define('durandal/app',['durandal/system', 'durandal/viewEngine', 'durandal/composition', 'durandal/events', 'jquery'], function(system, viewEngine, composition, Events, $) {
    var app,
        allPluginIds = [],
        allPluginConfigs = [];

    function loadPlugins(){
        return system.defer(function(dfd){
            if(allPluginIds.length == 0){
                dfd.resolve();
                return;
            }

            system.acquire(allPluginIds).then(function(loaded){
                for(var i = 0; i < loaded.length; i++){
                    var currentModule = loaded[i];

                    if(currentModule.install){
                        var config = allPluginConfigs[i];
                        if(!system.isObject(config)){
                            config = {};
                        }

                        currentModule.install(config);
                        system.log('Plugin:Installed ' + allPluginIds[i]);
                    }else{
                        system.log('Plugin:Loaded ' + allPluginIds[i]);
                    }
                }

                dfd.resolve();
            }).fail(function(err){
                system.error('Failed to load plugin(s). Details: ' + err.message);
            });
        }).promise();
    }

    /**
     * @class AppModule
     * @static
     * @uses Events
     */
    app = {
        /**
         * The title of your application.
         * @property {string} title
         */
        title: 'Application',
        /**
         * Configures one or more plugins to be loaded and installed into the application.
         * @method configurePlugins
         * @param {object} config Keys are plugin names. Values can be truthy, to simply install the plugin, or a configuration object to pass to the plugin.
         * @param {string} [baseUrl] The base url to load the plugins from.
         */
        configurePlugins:function(config, baseUrl){
            var pluginIds = system.keys(config);
            baseUrl = baseUrl || 'plugins/';

            if(baseUrl.indexOf('/', baseUrl.length - 1) === -1){
                baseUrl += '/';
            }

            for(var i = 0; i < pluginIds.length; i++){
                var key = pluginIds[i];
                allPluginIds.push(baseUrl + key);
                allPluginConfigs.push(config[key]);
            }
        },
        /**
         * Starts the application.
         * @method start
         * @return {promise}
         */
        start: function() {
            system.log('Application:Starting');

            if (this.title) {
                document.title = this.title;
            }

            return system.defer(function (dfd) {
                $(function() {
                    loadPlugins().then(function(){
                        dfd.resolve();
                        system.log('Application:Started');
                    });
                });
            }).promise();
        },
        /**
         * Sets the root module/view for the application.
         * @method setRoot
         * @param {string} root The root view or module.
         * @param {string} [transition] The transition to use from the previous root (or splash screen) into the new root.
         * @param {string} [applicationHost] The application host element or id. By default the id 'applicationHost' will be used.
         */
        setRoot: function(root, transition, applicationHost) {
            var hostElement, settings = { activate:true, transition: transition };

            if (!applicationHost || system.isString(applicationHost)) {
                hostElement = document.getElementById(applicationHost || 'applicationHost');
            } else {
                hostElement = applicationHost;
            }

            if (system.isString(root)) {
                if (viewEngine.isViewUrl(root)) {
                    settings.view = root;
                } else {
                    settings.model = root;
                }
            } else {
                settings.model = root;
            }

            composition.compose(hostElement, settings);
        }
    };

    Events.includeIn(app);

    return app;
});

requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',
        'durandal':'../lib/durandal/js',
    },
    urlArgs: "bust=" +  (new Date()).getTime()
});

define('jquery', [], function () { return jQuery; });
define('knockout', [], function () { return ko; });

define('main',['durandal/system', 'durandal/app', 'durandal/viewLocator'],
function(system, app, viewLocator){
    system.debug(true);
    app.title = 'Abelhinhas';
    app.configurePlugins({
        router:true,
        dialog: true,
        widget: true
    });
    app.start().then(function() {
        viewLocator.useConvention();
        app.setRoot('viewmodels/shell');
    });
});

define('viewmodels/404/index',[],function () {
    return { };
});
/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * The dialog module enables the display of message boxes, custom modal dialogs and other overlays or slide-out UI abstractions. Dialogs are constructed by the composition system which interacts with a user defined dialog context. The dialog module enforced the activator lifecycle.
 * @module dialog
 * @requires system
 * @requires app
 * @requires composition
 * @requires activator
 * @requires viewEngine
 * @requires jquery
 * @requires knockout
 */
define('plugins/dialog',['durandal/system', 'durandal/app', 'durandal/composition', 'durandal/activator', 'durandal/viewEngine', 'jquery', 'knockout'], function (system, app, composition, activator, viewEngine, $, ko) {
    var contexts = {},
        dialogCount = 0,
        dialog;

    /**
     * Models a message box's message, title and options.
     * @class MessageBox
     */
    var MessageBox = function(message, title, options) {
        this.message = message;
        this.title = title || MessageBox.defaultTitle;
        this.options = options || MessageBox.defaultOptions;
    };

    /**
     * Selects an option and closes the message box, returning the selected option through the dialog system's promise.
     * @method selectOption
     * @param {string} dialogResult The result to select.
     */
    MessageBox.prototype.selectOption = function (dialogResult) {
        dialog.close(this, dialogResult);
    };

    /**
     * Provides the view to the composition system.
     * @method getView
     * @return {DOMElement} The view of the message box.
     */
    MessageBox.prototype.getView = function(){
        return viewEngine.processMarkup(MessageBox.defaultViewMarkup);
    };

    /**
     * Configures a custom view to use when displaying message boxes.
     * @method setViewUrl
     * @param {string} viewUrl The view url relative to the base url which the view locator will use to find the message box's view.
     * @static
     */
    MessageBox.setViewUrl = function(viewUrl){
        delete MessageBox.prototype.getView;
        MessageBox.prototype.viewUrl = viewUrl;
    };

    /**
     * The title to be used for the message box if one is not provided.
     * @property {string} defaultTitle
     * @default Application
     * @static
     */
    MessageBox.defaultTitle = app.title || 'Application';

    /**
     * The options to display in the message box of none are specified.
     * @property {string[]} defaultOptions
     * @default ['Ok']
     * @static
     */
    MessageBox.defaultOptions = ['Ok'];

    /**
     * The markup for the message box's view.
     * @property {string} defaultViewMarkup
     * @static
     */
    MessageBox.defaultViewMarkup = [
        '<div data-view="plugins/messageBox" class="messageBox">',
            '<div class="modal-header">',
                '<h3 data-bind="text: title"></h3>',
            '</div>',
            '<div class="modal-body">',
                '<p class="message" data-bind="text: message"></p>',
            '</div>',
            '<div class="modal-footer" data-bind="foreach: options">',
                '<button class="btn" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>',
            '</div>',
        '</div>'
    ].join('\n');

    function ensureDialogInstance(objOrModuleId) {
        return system.defer(function(dfd) {
            if (system.isString(objOrModuleId)) {
                system.acquire(objOrModuleId).then(function (module) {
                    dfd.resolve(system.resolveObject(module));
                }).fail(function(err){
                    system.error('Failed to load dialog module (' + objOrModuleId + '). Details: ' + err.message);
                });
            } else {
                dfd.resolve(objOrModuleId);
            }
        }).promise();
    }

    /**
     * @class DialogModule
     * @static
     */
    dialog = {
        /**
         * The constructor function used to create message boxes.
         * @property {MessageBox} MessageBox
         */
        MessageBox:MessageBox,
        /**
         * The css zIndex that the last dialog was displayed at.
         * @property {number} currentZIndex
         */
        currentZIndex: 1050,
        /**
         * Gets the next css zIndex at which a dialog should be displayed.
         * @method getNextZIndex
         * @return {number} The next usable zIndex.
         */
        getNextZIndex: function () {
            return ++this.currentZIndex;
        },
        /**
         * Determines whether or not there are any dialogs open.
         * @method isOpen
         * @return {boolean} True if a dialog is open. false otherwise.
         */
        isOpen: function() {
            return dialogCount > 0;
        },
        /**
         * Gets the dialog context by name or returns the default context if no name is specified.
         * @method getContext
         * @param {string} [name] The name of the context to retrieve.
         * @return {DialogContext} True context.
         */
        getContext: function(name) {
            return contexts[name || 'default'];
        },
        /**
         * Adds (or replaces) a dialog context.
         * @method addContext
         * @param {string} name The name of the context to add.
         * @param {DialogContext} dialogContext The context to add.
         */
        addContext: function(name, dialogContext) {
            dialogContext.name = name;
            contexts[name] = dialogContext;

            var helperName = 'show' + name.substr(0, 1).toUpperCase() + name.substr(1);
            this[helperName] = function (obj, activationData) {
                return this.show(obj, activationData, name);
            };
        },
        createCompositionSettings: function(obj, dialogContext) {
            var settings = {
                model:obj,
                activate:false
            };

            if (dialogContext.attached) {
                settings.attached = dialogContext.attached;
            }

            if (dialogContext.compositionComplete) {
                settings.compositionComplete = dialogContext.compositionComplete;
            }

            return settings;
        },
        /**
         * Gets the dialog model that is associated with the specified object.
         * @method getDialog
         * @param {object} obj The object for whom to retrieve the dialog.
         * @return {Dialog} The dialog model.
         */
        getDialog:function(obj){
            if(obj){
                return obj.__dialog__;
            }

            return undefined;
        },
        /**
         * Closes the dialog associated with the specified object.
         * @method close
         * @param {object} obj The object whose dialog should be closed.
         * @param {object} result* The results to return back to the dialog caller after closing.
         */
        close:function(obj){
            var theDialog = this.getDialog(obj);
            if(theDialog){
                var rest = Array.prototype.slice.call(arguments, 1);
                theDialog.close.apply(theDialog, rest);
            }
        },
        /**
         * Shows a dialog.
         * @method show
         * @param {object|string} obj The object (or moduleId) to display as a dialog.
         * @param {object} [activationData] The data that should be passed to the object upon activation.
         * @param {string} [context] The name of the dialog context to use. Uses the default context if none is specified.
         * @return {Promise} A promise that resolves when the dialog is closed and returns any data passed at the time of closing.
         */
        show: function(obj, activationData, context) {
            var that = this;
            var dialogContext = contexts[context || 'default'];

            return system.defer(function(dfd) {
                ensureDialogInstance(obj).then(function(instance) {
                    var dialogActivator = activator.create();

                    dialogActivator.activateItem(instance, activationData).then(function (success) {
                        if (success) {
                            var theDialog = instance.__dialog__ = {
                                owner: instance,
                                context: dialogContext,
                                activator: dialogActivator,
                                close: function () {
                                    var args = arguments;
                                    dialogActivator.deactivateItem(instance, true).then(function (closeSuccess) {
                                        if (closeSuccess) {
                                            dialogCount--;
                                            dialogContext.removeHost(theDialog);
                                            delete instance.__dialog__;

                                            if(args.length == 0){
                                                dfd.resolve();
                                            }else if(args.length == 1){
                                                dfd.resolve(args[0])
                                            }else{
                                                dfd.resolve.apply(dfd, args);
                                            }
                                        }
                                    });
                                }
                            };

                            theDialog.settings = that.createCompositionSettings(instance, dialogContext);
                            dialogContext.addHost(theDialog);

                            dialogCount++;
                            composition.compose(theDialog.host, theDialog.settings);
                        } else {
                            dfd.resolve(false);
                        }
                    });
                });
            }).promise();
        },
        /**
         * Shows a message box.
         * @method showMessage
         * @param {string} message The message to display in the dialog.
         * @param {string} [title] The title message.
         * @param {string[]} [options] The options to provide to the user.
         * @return {Promise} A promise that resolves when the message box is closed and returns the selected option.
         */
        showMessage:function(message, title, options){
            if(system.isString(this.MessageBox)){
                return dialog.show(this.MessageBox, [
                    message,
                    title || MessageBox.defaultTitle,
                    options || MessageBox.defaultOptions
                ]);
            }

            return dialog.show(new this.MessageBox(message, title, options));
        },
        /**
         * Installs this module into Durandal; called by the framework. Adds `app.showDialog` and `app.showMessage` convenience methods.
         * @method install
         * @param {object} [config] Add a `messageBox` property to supply a custom message box constructor. Add a `messageBoxView` property to supply custom view markup for the built-in message box.
         */
        install:function(config){
            app.showDialog = function(obj, activationData, context) {
                return dialog.show(obj, activationData, context);
            };

            app.showMessage = function(message, title, options) {
                return dialog.showMessage(message, title, options);
            };

            if(config.messageBox){
                dialog.MessageBox = config.messageBox;
            }

            if(config.messageBoxView){
                dialog.MessageBox.prototype.getView = function(){
                    return config.messageBoxView;
                };
            }
        }
    };

    /**
     * @class DialogContext
     */
    dialog.addContext('default', {
        blockoutOpacity: .2,
        removeDelay: 200,
        /**
         * In this function, you are expected to add a DOM element to the tree which will serve as the "host" for the modal's composed view. You must add a property called host to the modalWindow object which references the dom element. It is this host which is passed to the composition module.
         * @method addHost
         * @param {Dialog} theDialog The dialog model.
         */
        addHost: function(theDialog) {
            var body = $('body');
            var blockout = $('<div class="modalBlockout"></div>')
                .css({ 'z-index': dialog.getNextZIndex(), 'opacity': this.blockoutOpacity })
                .appendTo(body);

            var host = $('<div class="modalHost"></div>')
                .css({ 'z-index': dialog.getNextZIndex() })
                .appendTo(body);

            theDialog.host = host.get(0);
            theDialog.blockout = blockout.get(0);

            if (!dialog.isOpen()) {
                theDialog.oldBodyMarginRight = body.css("margin-right");
                theDialog.oldInlineMarginRight = body.get(0).style.marginRight;

                var html = $("html");
                var oldBodyOuterWidth = body.outerWidth(true);
                var oldScrollTop = html.scrollTop();
                $("html").css("overflow-y", "hidden");
                var newBodyOuterWidth = $("body").outerWidth(true);
                body.css("margin-right", (newBodyOuterWidth - oldBodyOuterWidth + parseInt(theDialog.oldBodyMarginRight)) + "px");
                html.scrollTop(oldScrollTop); // necessary for Firefox
            }
        },
        /**
         * This function is expected to remove any DOM machinery associated with the specified dialog and do any other necessary cleanup.
         * @method removeHost
         * @param {Dialog} theDialog The dialog model.
         */
        removeHost: function(theDialog) {
            $(theDialog.host).css('opacity', 0);
            $(theDialog.blockout).css('opacity', 0);

            setTimeout(function() {
                ko.removeNode(theDialog.host);
                ko.removeNode(theDialog.blockout);
            }, this.removeDelay);

            if (!dialog.isOpen()) {
                var html = $("html");
                var oldScrollTop = html.scrollTop(); // necessary for Firefox.
                html.css("overflow-y", "").scrollTop(oldScrollTop);

                if(theDialog.oldInlineMarginRight) {
                    $("body").css("margin-right", theDialog.oldBodyMarginRight);
                } else {
                    $("body").css("margin-right", '');
                }
            }
        },
        /**
         * This function is called after the modal is fully composed into the DOM, allowing your implementation to do any final modifications, such as positioning or animation. You can obtain the original dialog object by using `getDialog` on context.model.
         * @method compositionComplete
         * @param {DOMElement} child The dialog view.
         * @param {DOMElement} parent The parent view.
         * @param {object} context The composition context.
         */
        compositionComplete: function (child, parent, context) {
            var $child = $(child);
            var width = $child.width();
            var height = $child.height();
            var theDialog = dialog.getDialog(context.model);

            $child.css({
                'margin-top': (-height / 2).toString() + 'px',
                'margin-left': (-width / 2).toString() + 'px'
            });

            $(theDialog.host).css('opacity', 1);

            if ($(child).hasClass('autoclose')) {
                $(theDialog.blockout).click(function() {
                    theDialog.close();
                });
            }

            $('.autofocus', child).each(function() {
                $(this).focus();
            });
        }
    });

    return dialog;
});

define('viewmodels/access/customModal',['plugins/dialog'], function (dialog) {

    var CustomModal = function() {
        this.input = ko.observable('');
    };

    CustomModal.prototype.ok = function() {
        dialog.close(this, this.input());
    };

    CustomModal.show = function(){
        return dialog.show(new CustomModal());
    };

    return CustomModal;
});
/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * This module is based on Backbone's core history support. It abstracts away the low level details of working with browser history and url changes in order to provide a solid foundation for a router.
 * @module history
 * @requires system
 * @requires jquery
 */
define('plugins/history',['durandal/system', 'jquery'], function (system, $) {
    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    function updateHash(location, fragment, replace) {
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        } else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    };

    /**
     * @class HistoryModule
     * @static
     */
    var history = {
        /**
         * The setTimeout interval used when the browser does not support hash change events.
         * @property {string} interval
         * @default 50
         */
        interval: 50,
        /**
         * Indicates whether or not the history module is actively tracking history.
         * @property {string} active
         */
        active: false
    };
    
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
        history.location = window.location;
        history.history = window.history;
    }

    /**
     * Gets the true hash value. Cannot use location.hash directly due to a bug in Firefox where location.hash will always be decoded.
     * @method getHash
     * @param {string} [window] The optional window instance
     * @return {string} The hash.
     */
    history.getHash = function(window) {
        var match = (window || history).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    };
    
    /**
     * Get the cross-browser normalized URL fragment, either from the URL, the hash, or the override.
     * @method getFragment
     * @param {string} fragment The fragment.
     * @param {boolean} forcePushState Should we force push state?
     * @return {string} he fragment.
     */
    history.getFragment = function(fragment, forcePushState) {
        if (fragment == null) {
            if (history._hasPushState || !history._wantsHashChange || forcePushState) {
                fragment = history.location.pathname;
                var root = history.root.replace(trailingSlash, '');
                if (!fragment.indexOf(root)) {
                    fragment = fragment.substr(root.length);
                }
            } else {
                fragment = history.getHash();
            }
        }
        
        return fragment.replace(routeStripper, '');
    };

    /**
     * Activate the hash change handling, returning `true` if the current URL matches an existing route, and `false` otherwise.
     * @method activate
     * @param {HistoryOptions} options.
     * @return {boolean|undefined} Returns true/false from loading the url unless the silent option was selected.
     */
    history.activate = function(options) {
        if (history.active) {
            system.error("History has already been activated.");
        }

        history.active = true;

        // Figure out the initial configuration. Do we need an iframe?
        // Is pushState desired ... is it available?
        history.options = system.extend({}, { root: '/' }, history.options, options);
        history.root = history.options.root;
        history._wantsHashChange = history.options.hashChange !== false;
        history._wantsPushState = !!history.options.pushState;
        history._hasPushState = !!(history.options.pushState && history.history && history.history.pushState);

        var fragment = history.getFragment();
        var docMode = document.documentMode;
        var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

        // Normalize root to always include a leading and trailing slash.
        history.root = ('/' + history.root + '/').replace(rootStripper, '/');

        if (oldIE && history._wantsHashChange) {
            history.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
            history.navigate(fragment, false);
        }

        // Depending on whether we're using pushState or hashes, and whether
        // 'onhashchange' is supported, determine how we check the URL state.
        if (history._hasPushState) {
            $(window).on('popstate', history.checkUrl);
        } else if (history._wantsHashChange && ('onhashchange' in window) && !oldIE) {
            $(window).on('hashchange', history.checkUrl);
        } else if (history._wantsHashChange) {
            history._checkUrlInterval = setInterval(history.checkUrl, history.interval);
        }

        // Determine if we need to change the base url, for a pushState link
        // opened by a non-pushState browser.
        history.fragment = fragment;
        var loc = history.location;
        var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === history.root;

        // Transition from hashChange to pushState or vice versa if both are requested.
        if (history._wantsHashChange && history._wantsPushState) {
            // If we've started off with a route from a `pushState`-enabled
            // browser, but we're currently in a browser that doesn't support it...
            if (!history._hasPushState && !atRoot) {
                history.fragment = history.getFragment(null, true);
                history.location.replace(history.root + history.location.search + '#' + history.fragment);
                // Return immediately as browser will do redirect to new url
                return true;

            // Or if we've started out with a hash-based route, but we're currently
            // in a browser where it could be `pushState`-based instead...
            } else if (history._hasPushState && atRoot && loc.hash) {
                this.fragment = history.getHash().replace(routeStripper, '');
                this.history.replaceState({}, document.title, history.root + history.fragment + loc.search);
            }
        }

        if (!history.options.silent) {
            return history.loadUrl();
        }
    };

    /**
     * Disable history, perhaps temporarily. Not useful in a real app, but possibly useful for unit testing Routers.
     * @method deactivate
     */
    history.deactivate = function() {
        $(window).off('popstate', history.checkUrl).off('hashchange', history.checkUrl);
        clearInterval(history._checkUrlInterval);
        history.active = false;
    };

    /**
     * Checks the current URL to see if it has changed, and if it has, calls `loadUrl`, normalizing across the hidden iframe.
     * @method checkUrl
     * @return {boolean} Returns true/false from loading the url.
     */
    history.checkUrl = function() {
        var current = history.getFragment();
        if (current === history.fragment && history.iframe) {
            current = history.getFragment(history.getHash(history.iframe));
        }

        if (current === history.fragment) {
            return false;
        }

        if (history.iframe) {
            history.navigate(current, false);
        }
        
        history.loadUrl();
    };
    
    /**
     * Attempts to load the current URL fragment. A pass-through to options.routeHandler.
     * @method loadUrl
     * @return {boolean} Returns true/false from the route handler.
     */
    history.loadUrl = function(fragmentOverride) {
        var fragment = history.fragment = history.getFragment(fragmentOverride);

        return history.options.routeHandler ?
            history.options.routeHandler(fragment) :
            false;
    };

    /**
     * Save a fragment into the hash history, or replace the URL state if the
     * 'replace' option is passed. You are responsible for properly URL-encoding
     * the fragment in advance.
     * The options object can contain `trigger: false` if you wish to not have the
     * route callback be fired, or `replace: true`, if
     * you wish to modify the current URL without adding an entry to the history.
     * @method navigate
     * @param {string} fragment The url fragment to navigate to.
     * @param {object|boolean} options An options object with optional trigger and replace flags. You can also pass a boolean directly to set the trigger option. Trigger is `true` by default.
     * @return {boolean} Returns true/false from loading the url.
     */
    history.navigate = function(fragment, options) {
        if (!history.active) {
            return false;
        }

        if(options === undefined) {
            options = {
                trigger: true
            };
        }else if(system.isBoolean(options)) {
            options = {
                trigger: options
            };
        }

        fragment = history.getFragment(fragment || '');

        if (history.fragment === fragment) {
            return;
        }

        history.fragment = fragment;
        var url = history.root + fragment;

        // If pushState is available, we use it to set the fragment as a real URL.
        if (history._hasPushState) {
            history.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

            // If hash changes haven't been explicitly disabled, update the hash
            // fragment to store history.
        } else if (history._wantsHashChange) {
            updateHash(history.location, fragment, options.replace);
            
            if (history.iframe && (fragment !== history.getFragment(history.getHash(history.iframe)))) {
                // Opening and closing the iframe tricks IE7 and earlier to push a
                // history entry on hash-tag change.  When replace is true, we don't
                // want history.
                if (!options.replace) {
                    history.iframe.document.open().close();
                }
                
                updateHash(history.iframe.location, fragment, options.replace);
            }

            // If you've told us that you explicitly don't want fallback hashchange-
            // based history, then `navigate` becomes a page refresh.
        } else {
            return history.location.assign(url);
        }

        if (options.trigger) {
            return history.loadUrl(fragment);
        }
    };

    /**
     * Navigates back in the browser history.
     * @method navigateBack
     */
    history.navigateBack = function() {
        history.history.back();
    };

    /**
     * @class HistoryOptions
     * @static
     */

    /**
     * The function that will be called back when the fragment changes.
     * @property {function} routeHandler
     */

    /**
     * The url root used to extract the fragment when using push state.
     * @property {string} root
     */

    /**
     * Use hash change when present.
     * @property {boolean} hashChange
     * @default true
     */

    /**
     * Use push state when present.
     * @property {boolean} pushState
     * @default false
     */

    /**
     * Prevents loading of the current url when activating history.
     * @property {boolean} silent
     * @default false
     */

    return history;
});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * Connects the history module's url and history tracking support to Durandal's activation and composition engine allowing you to easily build navigation-style applications.
 * @module router
 * @requires system
 * @requires app
 * @requires activator
 * @requires events
 * @requires composition
 * @requires history
 * @requires knockout
 * @requires jquery
 */
define('plugins/router',['durandal/system', 'durandal/app', 'durandal/activator', 'durandal/events', 'durandal/composition', 'plugins/history', 'knockout', 'jquery'], function(system, app, activator, events, composition, history, ko, $) {
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    var startDeferred, rootRouter;
    var trailingSlash = /\/$/;

    function routeStringToRegExp(routeString) {
        routeString = routeString.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^\/]+)';
            })
            .replace(splatParam, '(.*?)');

        return new RegExp('^' + routeString + '$');
    }

    function stripParametersFromRoute(route) {
        var colonIndex = route.indexOf(':');
        var length = colonIndex > 0 ? colonIndex - 1 : route.length;
        return route.substring(0, length);
    }

    function hasChildRouter(instance) {
        return instance.router && instance.router.loadUrl;
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function compareArrays(first, second) {
        if (!first || !second){
            return false;
        }

        if (first.length != second.length) {
            return false;
        }

        for (var i = 0, len = first.length; i < len; i++) {
            if (first[i] != second[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @class Router
     * @uses Events
     */

    /**
     * Triggered when the navigation logic has completed.
     * @event router:navigation:complete
     * @param {object} instance The activated instance.
     * @param {object} instruction The routing instruction.
     * @param {Router} router The router.
     */

    /**
     * Triggered when the navigation has been cancelled.
     * @event router:navigation:cancelled
     * @param {object} instance The activated instance.
     * @param {object} instruction The routing instruction.
     * @param {Router} router The router.
     */

    /**
     * Triggered right before a route is activated.
     * @event router:route:activating
     * @param {object} instance The activated instance.
     * @param {object} instruction The routing instruction.
     * @param {Router} router The router.
     */

    /**
     * Triggered right before a route is configured.
     * @event router:route:before-config
     * @param {object} config The route config.
     * @param {Router} router The router.
     */

    /**
     * Triggered just after a route is configured.
     * @event router:route:after-config
     * @param {object} config The route config.
     * @param {Router} router The router.
     */

    /**
     * Triggered when the view for the activated instance is attached.
     * @event router:navigation:attached
     * @param {object} instance The activated instance.
     * @param {object} instruction The routing instruction.
     * @param {Router} router The router.
     */

    /**
     * Triggered when the composition that the activated instance participates in is complete.
     * @event router:navigation:composition-complete
     * @param {object} instance The activated instance.
     * @param {object} instruction The routing instruction.
     * @param {Router} router The router.
     */

    /**
     * Triggered when the router does not find a matching route.
     * @event router:route:not-found
     * @param {string} fragment The url fragment.
     * @param {Router} router The router.
     */

    var createRouter = function() {
        var queue = [],
            isProcessing = ko.observable(false),
            currentActivation,
            currentInstruction,
            activeItem = activator.create();

        var router = {
            /**
             * The route handlers that are registered. Each handler consists of a `routePattern` and a `callback`.
             * @property {object[]} handlers
             */
            handlers: [],
            /**
             * The route configs that are registered.
             * @property {object[]} routes
             */
            routes: [],
            /**
             * The route configurations that have been designated as displayable in a nav ui (nav:true).
             * @property {KnockoutObservableArray} navigationModel
             */
            navigationModel: ko.observableArray([]),
            /**
             * The active item/screen based on the current navigation state.
             * @property {Activator} activeItem
             */
            activeItem: activeItem,
            /**
             * Indicates that the router (or a child router) is currently in the process of navigating.
             * @property {KnockoutComputed} isNavigating
             */
            isNavigating: ko.computed(function() {
                var current = activeItem();
                var processing = isProcessing();
                var currentRouterIsProcesing = current
                    && current.router
                    && current.router != router
                    && current.router.isNavigating() ? true : false;
                return  processing || currentRouterIsProcesing;
            }),
            /**
             * An observable surfacing the active routing instruction that is currently being processed or has recently finished processing.
             * The instruction object has `config`, `fragment`, `queryString`, `params` and `queryParams` properties.
             * @property {KnockoutObservable} activeInstruction
             */
            activeInstruction:ko.observable(null),
            __router__:true
        };

        events.includeIn(router);

        activeItem.settings.areSameItem = function (currentItem, newItem, currentActivationData, newActivationData) {
            if (currentItem == newItem) {
                return compareArrays(currentActivationData, newActivationData);
            }

            return false;
        };

        function completeNavigation(instance, instruction) {
            system.log('Navigation Complete', instance, instruction);

            var fromModuleId = system.getModuleId(currentActivation);
            if (fromModuleId) {
                router.trigger('router:navigation:from:' + fromModuleId);
            }

            currentActivation = instance;
            currentInstruction = instruction;

            var toModuleId = system.getModuleId(currentActivation);
            if (toModuleId) {
                router.trigger('router:navigation:to:' + toModuleId);
            }

            if (!hasChildRouter(instance)) {
                router.updateDocumentTitle(instance, instruction);
            }

            rootRouter.explicitNavigation = false;
            rootRouter.navigatingBack = false;
            router.trigger('router:navigation:complete', instance, instruction, router);
        }

        function cancelNavigation(instance, instruction) {
            system.log('Navigation Cancelled');

            router.activeInstruction(currentInstruction);

            if (currentInstruction) {
                router.navigate(currentInstruction.fragment, false);
            }

            isProcessing(false);
            rootRouter.explicitNavigation = false;
            rootRouter.navigatingBack = false;
            router.trigger('router:navigation:cancelled', instance, instruction, router);
        }

        function redirect(url) {
            system.log('Navigation Redirecting');

            isProcessing(false);
            rootRouter.explicitNavigation = false;
            rootRouter.navigatingBack = false;
            router.navigate(url, { trigger: true, replace: true });
        }

        function activateRoute(activator, instance, instruction) {
            rootRouter.navigatingBack = !rootRouter.explicitNavigation && currentActivation != instruction.fragment;
            router.trigger('router:route:activating', instance, instruction, router);

            activator.activateItem(instance, instruction.params).then(function(succeeded) {
                if (succeeded) {
                    var previousActivation = currentActivation;
                    completeNavigation(instance, instruction);

                    if (hasChildRouter(instance)) {
                        queueInstruction({
                            router: instance.router,
                            fragment: instruction.fragment,
                            queryString: instruction.queryString
                        });
                    }

                    if (previousActivation == instance) {
                        router.attached();
                    }
                } else if(activator.settings.lifecycleData && activator.settings.lifecycleData.redirect){
                    redirect(activator.settings.lifecycleData.redirect);
                }else{
                    cancelNavigation(instance, instruction);
                }

                if (startDeferred) {
                    startDeferred.resolve();
                    startDeferred = null;
                }
            });
        }

        /**
         * Inspects routes and modules before activation. Can be used to protect access by cancelling navigation or redirecting.
         * @method guardRoute
         * @param {object} instance The module instance that is about to be activated by the router.
         * @param {object} instruction The route instruction. The instruction object has config, fragment, queryString, params and queryParams properties.
         * @return {Promise|Boolean|String} If a boolean, determines whether or not the route should activate or be cancelled. If a string, causes a redirect to the specified route. Can also be a promise for either of these value types.
         */
        function handleGuardedRoute(activator, instance, instruction) {
            var resultOrPromise = router.guardRoute(instance, instruction);
            if (resultOrPromise) {
                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        if (result) {
                            if (system.isString(result)) {
                                redirect(result);
                            } else {
                                activateRoute(activator, instance, instruction);
                            }
                        } else {
                            cancelNavigation(instance, instruction);
                        }
                    });
                } else {
                    if (system.isString(resultOrPromise)) {
                        redirect(resultOrPromise);
                    } else {
                        activateRoute(activator, instance, instruction);
                    }
                }
            } else {
                cancelNavigation(instance, instruction);
            }
        }

        function ensureActivation(activator, instance, instruction) {
            if (router.guardRoute) {
                handleGuardedRoute(activator, instance, instruction);
            } else {
                activateRoute(activator, instance, instruction);
            }
        }

        function canReuseCurrentActivation(instruction) {
            return currentInstruction
                && currentInstruction.config.moduleId == instruction.config.moduleId
                && currentActivation
                && ((currentActivation.canReuseForRoute && currentActivation.canReuseForRoute.apply(currentActivation, instruction.params))
                || (currentActivation.router && currentActivation.router.loadUrl));
        }

        function dequeueInstruction() {
            if (isProcessing()) {
                return;
            }

            var instruction = queue.shift();
            queue = [];

            if (!instruction) {
                return;
            }

            if (instruction.router) {
                var fullFragment = instruction.fragment;
                if (instruction.queryString) {
                    fullFragment += "?" + instruction.queryString;
                }

                instruction.router.loadUrl(fullFragment);
                return;
            }

            isProcessing(true);
            router.activeInstruction(instruction);

            if (canReuseCurrentActivation(instruction)) {
                ensureActivation(activator.create(), currentActivation, instruction);
            } else {
                system.acquire(instruction.config.moduleId).then(function(module) {
                    var instance = system.resolveObject(module);
                    ensureActivation(activeItem, instance, instruction);
                }).fail(function(err){
                        system.error('Failed to load routed module (' + instruction.config.moduleId + '). Details: ' + err.message);
                    });
            }
        }

        function queueInstruction(instruction) {
            queue.unshift(instruction);
            dequeueInstruction();
        }

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        function createParams(routePattern, fragment, queryString) {
            var params = routePattern.exec(fragment).slice(1);

            for (var i = 0; i < params.length; i++) {
                var current = params[i];
                params[i] = current ? decodeURIComponent(current) : null;
            }

            var queryParams = router.parseQueryString(queryString);
            if (queryParams) {
                params.push(queryParams);
            }

            return {
                params:params,
                queryParams:queryParams
            };
        }

        function configureRoute(config){
            router.trigger('router:route:before-config', config, router);

            if (!system.isRegExp(config)) {
                config.title = config.title || router.convertRouteToTitle(config.route);
                config.moduleId = config.moduleId || router.convertRouteToModuleId(config.route);
                config.hash = config.hash || router.convertRouteToHash(config.route);
                config.routePattern = routeStringToRegExp(config.route);
            }else{
                config.routePattern = config.route;
            }

            router.trigger('router:route:after-config', config, router);

            router.routes.push(config);

            router.route(config.routePattern, function(fragment, queryString) {
                var paramInfo = createParams(config.routePattern, fragment, queryString);
                queueInstruction({
                    fragment: fragment,
                    queryString:queryString,
                    config: config,
                    params: paramInfo.params,
                    queryParams:paramInfo.queryParams
                });
            });
        };

        function mapRoute(config) {
            if(system.isArray(config.route)){
                for(var i = 0, length = config.route.length; i < length; i++){
                    var current = system.extend({}, config);
                    current.route = config.route[i];
                    if(i > 0){
                        delete current.nav;
                    }
                    configureRoute(current);
                }
            }else{
                configureRoute(config);
            }

            return router;
        }

        function addActiveFlag(config) {
            if(config.isActive){
                return;
            }

            config.isActive = ko.computed(function() {
                var theItem = activeItem();
                return theItem && theItem.__moduleId__ == config.moduleId;
            });
        }

        /**
         * Parses a query string into an object.
         * @method parseQueryString
         * @param {string} queryString The query string to parse.
         * @return {object} An object keyed according to the query string parameters.
         */
        router.parseQueryString = function (queryString) {
            var queryObject, pairs;

            if (!queryString) {
                return null;
            }

            pairs = queryString.split('&');

            if (pairs.length == 0) {
                return null;
            }

            queryObject = {};

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                if (pair === '') {
                    continue;
                }

                var parts = pair.split('=');
                queryObject[parts[0]] = parts[1] && decodeURIComponent(parts[1].replace(/\+/g, ' '));
            }

            return queryObject;
        };

        /**
         * Add a route to be tested when the url fragment changes.
         * @method route
         * @param {RegEx} routePattern The route pattern to test against.
         * @param {function} callback The callback to execute when the route pattern is matched.
         */
        router.route = function(routePattern, callback) {
            router.handlers.push({ routePattern: routePattern, callback: callback });
        };

        /**
         * Attempt to load the specified URL fragment. If a route succeeds with a match, returns `true`. If no defined routes matches the fragment, returns `false`.
         * @method loadUrl
         * @param {string} fragment The URL fragment to find a match for.
         * @return {boolean} True if a match was found, false otherwise.
         */
        router.loadUrl = function(fragment) {
            var handlers = router.handlers,
                queryString = null,
                coreFragment = fragment,
                queryIndex = fragment.indexOf('?');

            if (queryIndex != -1) {
                coreFragment = fragment.substring(0, queryIndex);
                queryString = fragment.substr(queryIndex + 1);
            }

            if(router.relativeToParentRouter){
                var instruction = this.parent.activeInstruction();
                coreFragment = instruction.params.join('/');

                if(coreFragment && coreFragment[0] == '/'){
                    coreFragment = coreFragment.substr(1);
                }

                if(!coreFragment){
                    coreFragment = '';
                }

                coreFragment = coreFragment.replace('//', '/').replace('//', '/');
            }

            coreFragment = coreFragment.replace(trailingSlash, '');

            for (var i = 0; i < handlers.length; i++) {
                var current = handlers[i];
                if (current.routePattern.test(coreFragment)) {
                    current.callback(coreFragment, queryString);
                    return true;
                }
            }

            system.log('Route Not Found');
            router.trigger('router:route:not-found', fragment, router);

            if (currentInstruction) {
                history.navigate(currentInstruction.fragment, { trigger:false, replace:true });
            }

            rootRouter.explicitNavigation = false;
            rootRouter.navigatingBack = false;

            return false;
        };

        /**
         * Updates the document title based on the activated module instance, the routing instruction and the app.title.
         * @method updateDocumentTitle
         * @param {object} instance The activated module.
         * @param {object} instruction The routing instruction associated with the action. It has a `config` property that references the original route mapping config.
         */
        router.updateDocumentTitle = function(instance, instruction) {
            if (instruction.config.title) {
                if (app.title) {
                    document.title = instruction.config.title + " | " + app.title;
                } else {
                    document.title = instruction.config.title;
                }
            } else if (app.title) {
                document.title = app.title;
            }
        };

        /**
         * Save a fragment into the hash history, or replace the URL state if the
         * 'replace' option is passed. You are responsible for properly URL-encoding
         * the fragment in advance.
         * The options object can contain `trigger: false` if you wish to not have the
         * route callback be fired, or `replace: true`, if
         * you wish to modify the current URL without adding an entry to the history.
         * @method navigate
         * @param {string} fragment The url fragment to navigate to.
         * @param {object|boolean} options An options object with optional trigger and replace flags. You can also pass a boolean directly to set the trigger option. Trigger is `true` by default.
         * @return {boolean} Returns true/false from loading the url.
         */
        router.navigate = function(fragment, options) {
            if(fragment && fragment.indexOf('://') != -1){
                window.location.href = fragment;
                return true;
            }

            rootRouter.explicitNavigation = true;
            return history.navigate(fragment, options);
        };

        /**
         * Navigates back in the browser history.
         * @method navigateBack
         */
        router.navigateBack = function() {
            history.navigateBack();
        };

        router.attached = function() {
            setTimeout(function() {
                isProcessing(false);
                router.trigger('router:navigation:attached', currentActivation, currentInstruction, router);
                dequeueInstruction();
            }, 10);
        };

        router.compositionComplete = function(){
            router.trigger('router:navigation:composition-complete', currentActivation, currentInstruction, router);
        };

        /**
         * Converts a route to a hash suitable for binding to a link's href.
         * @method convertRouteToHash
         * @param {string} route
         * @return {string} The hash.
         */
        router.convertRouteToHash = function(route) {
            if(router.relativeToParentRouter){
                var instruction = router.parent.activeInstruction(),
                    hash = instruction.config.hash + '/' + route;

                if(history._hasPushState){
                    hash = '/' + hash;
                }

                hash = hash.replace('//', '/').replace('//', '/');
                return hash;
            }

            if(history._hasPushState){
                return route;
            }

            return "#" + route;
        };

        /**
         * Converts a route to a module id. This is only called if no module id is supplied as part of the route mapping.
         * @method convertRouteToModuleId
         * @param {string} route
         * @return {string} The module id.
         */
        router.convertRouteToModuleId = function(route) {
            return stripParametersFromRoute(route);
        };

        /**
         * Converts a route to a displayable title. This is only called if no title is specified as part of the route mapping.
         * @method convertRouteToTitle
         * @param {string} route
         * @return {string} The title.
         */
        router.convertRouteToTitle = function(route) {
            var value = stripParametersFromRoute(route);
            return value.substring(0, 1).toUpperCase() + value.substring(1);
        };

        /**
         * Maps route patterns to modules.
         * @method map
         * @param {string|object|object[]} route A route, config or array of configs.
         * @param {object} [config] The config for the specified route.
         * @chainable
         * @example
 router.map([
    { route: '', title:'Home', moduleId: 'homeScreen', nav: true },
    { route: 'customer/:id', moduleId: 'customerDetails'}
 ]);
         */
        router.map = function(route, config) {
            if (system.isArray(route)) {
                for (var i = 0; i < route.length; i++) {
                    router.map(route[i]);
                }

                return router;
            }

            if (system.isString(route) || system.isRegExp(route)) {
                if (!config) {
                    config = {};
                } else if (system.isString(config)) {
                    config = { moduleId: config };
                }

                config.route = route;
            } else {
                config = route;
            }

            return mapRoute(config);
        };

        /**
         * Builds an observable array designed to bind a navigation UI to. The model will exist in the `navigationModel` property.
         * @method buildNavigationModel
         * @param {number} defaultOrder The default order to use for navigation visible routes that don't specify an order. The defualt is 100.
         * @chainable
         */
        router.buildNavigationModel = function(defaultOrder) {
            var nav = [], routes = router.routes;
            defaultOrder = defaultOrder || 100;

            for (var i = 0; i < routes.length; i++) {
                var current = routes[i];

                if (current.nav) {
                    if (!system.isNumber(current.nav)) {
                        current.nav = defaultOrder;
                    }

                    addActiveFlag(current);
                    nav.push(current);
                }
            }

            nav.sort(function(a, b) { return a.nav - b.nav; });
            router.navigationModel(nav);

            return router;
        };

        /**
         * Configures how the router will handle unknown routes.
         * @method mapUnknownRoutes
         * @param {string|function} [config] If not supplied, then the router will map routes to modules with the same name.
         * If a string is supplied, it represents the module id to route all unknown routes to.
         * Finally, if config is a function, it will be called back with the route instruction containing the route info. The function can then modify the instruction by adding a moduleId and the router will take over from there.
         * @param {string} [replaceRoute] If config is a module id, then you can optionally provide a route to replace the url with.
         * @chainable
         */
        router.mapUnknownRoutes = function(config, replaceRoute) {
            var catchAllRoute = "*catchall";
            var catchAllPattern = routeStringToRegExp(catchAllRoute);

            router.route(catchAllPattern, function (fragment, queryString) {
                var paramInfo = createParams(catchAllPattern, fragment, queryString);
                var instruction = {
                    fragment: fragment,
                    queryString: queryString,
                    config: {
                        route: catchAllRoute,
                        routePattern: catchAllPattern
                    },
                    params: paramInfo.params,
                    queryParams: paramInfo.queryParams
                };

                if (!config) {
                    instruction.config.moduleId = fragment;
                } else if (system.isString(config)) {
                    instruction.config.moduleId = config;
                    if(replaceRoute){
                        history.navigate(replaceRoute, { trigger:false, replace:true });
                    }
                } else if (system.isFunction(config)) {
                    var result = config(instruction);
                    if (result && result.then) {
                        result.then(function() {
                            router.trigger('router:route:before-config', instruction.config, router);
                            router.trigger('router:route:after-config', instruction.config, router);
                            queueInstruction(instruction);
                        });
                        return;
                    }
                } else {
                    instruction.config = config;
                    instruction.config.route = catchAllRoute;
                    instruction.config.routePattern = catchAllPattern;
                }

                router.trigger('router:route:before-config', instruction.config, router);
                router.trigger('router:route:after-config', instruction.config, router);
                queueInstruction(instruction);
            });

            return router;
        };

        /**
         * Resets the router by removing handlers, routes, event handlers and previously configured options.
         * @method reset
         * @chainable
         */
        router.reset = function() {
            currentInstruction = currentActivation = undefined;
            router.handlers = [];
            router.routes = [];
            router.off();
            delete router.options;
            return router;
        };

        /**
         * Makes all configured routes and/or module ids relative to a certain base url.
         * @method makeRelative
         * @param {string|object} settings If string, the value is used as the base for routes and module ids. If an object, you can specify `route` and `moduleId` separately. In place of specifying route, you can set `fromParent:true` to make routes automatically relative to the parent router's active route.
         * @chainable
         */
        router.makeRelative = function(settings){
            if(system.isString(settings)){
                settings = {
                    moduleId:settings,
                    route:settings
                };
            }

            if(settings.moduleId && !endsWith(settings.moduleId, '/')){
                settings.moduleId += '/';
            }

            if(settings.route && !endsWith(settings.route, '/')){
                settings.route += '/';
            }

            if(settings.fromParent){
                router.relativeToParentRouter = true;
            }

            router.on('router:route:before-config').then(function(config){
                if(settings.moduleId){
                    config.moduleId = settings.moduleId + config.moduleId;
                }

                if(settings.route){
                    if(config.route === ''){
                        config.route = settings.route.substring(0, settings.route.length - 1);
                    }else{
                        config.route = settings.route + config.route;
                    }
                }
            });

            return router;
        };

        /**
         * Creates a child router.
         * @method createChildRouter
         * @return {Router} The child router.
         */
        router.createChildRouter = function() {
            var childRouter = createRouter();
            childRouter.parent = router;
            return childRouter;
        };

        return router;
    };

    /**
     * @class RouterModule
     * @extends Router
     * @static
     */
    rootRouter = createRouter();
    rootRouter.explicitNavigation = false;
    rootRouter.navigatingBack = false;

    /**
     * Activates the router and the underlying history tracking mechanism.
     * @method activate
     * @return {Promise} A promise that resolves when the router is ready.
     */
    rootRouter.activate = function(options) {
        return system.defer(function(dfd) {
            startDeferred = dfd;
            rootRouter.options = system.extend({ routeHandler: rootRouter.loadUrl }, rootRouter.options, options);

            history.activate(rootRouter.options);

            if(history._hasPushState){
                var routes = rootRouter.routes,
                    i = routes.length;

                while(i--){
                    var current = routes[i];
                    current.hash = current.hash.replace('#', '');
                }
            }

            $(document).delegate("a", 'click', function(evt){
                rootRouter.explicitNavigation = true;

                if(history._hasPushState){
                    if(!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey){
                        // Get the anchor href and protcol
                        var href = $(this).attr("href");
                        var protocol = this.protocol + "//";

                        // Ensure the protocol is not part of URL, meaning its relative.
                        // Stop the event bubbling to ensure the link will not cause a page refresh.
                        if (!href || (href.charAt(0) !== "#" && href.slice(protocol.length) !== protocol)) {
                            evt.preventDefault();
                            history.navigate(href);
                        }
                    }
                }
            });
        }).promise();
    };

    /**
     * Disable history, perhaps temporarily. Not useful in a real app, but possibly useful for unit testing Routers.
     * @method deactivate
     */
    rootRouter.deactivate = function() {
        history.deactivate();
    };

    /**
     * Installs the router's custom ko binding handler.
     * @method install
     */
    rootRouter.install = function(){
        ko.bindingHandlers.router = {
            init: function() {
                return { controlsDescendantBindings: true };
            },
            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var settings = ko.utils.unwrapObservable(valueAccessor()) || {};

                if (settings.__router__) {
                    settings = {
                        model:settings.activeItem(),
                        attached:settings.attached,
                        compositionComplete:settings.compositionComplete,
                        activate: false
                    };
                } else {
                    var theRouter = ko.utils.unwrapObservable(settings.router || viewModel.router) || rootRouter;
                    settings.model = theRouter.activeItem();
                    settings.attached = theRouter.attached;
                    settings.compositionComplete = theRouter.compositionComplete;
                    settings.activate = false;
                }

                composition.compose(element, settings, bindingContext);
            }
        };

        ko.virtualElements.allowedBindings.router = true;
    };

    return rootRouter;
});

define('viewmodels/shell',['plugins/router','durandal/app','durandal/system'],
function (router,app,system){
    return {
        router: router,
        title: app.title,
        username: ko.observable(),
        flash: ko.observable({msg: null,type: null}),
        logged: ko.observable(false),
        permissions: ko.observableArray([]),
        can: function(action_type,resource) {
            var p = ko.utils.arrayFirst(this.permissions(),function(item){
                return item.resource == resource;
            });
            if(!!p) {
                return(p["action_"+action_type] == 1);
            } else {
                return false;
            }
        },
        closeFlash: function() {
            $("#flash").hide();
        },
        logoff: function() {
            var that = this;
            $.post("logoff").then(function(r) {
                that.logged(false);
                app.trigger('flash',{type: "success",msg: "Você desconectou do sistema."});
                that.router.navigate("#access");
            });
        },
        isActive: function(resource) {
            return this.router.activeInstruction().fragment.match(resource+"/") !== null;
        },
        activate: function () {
            var that = this;
            app.on('flash').then(function(obj){
                that.flash().msg = obj.msg;
                that.flash().type = obj.type;
            });
            app.on('flashNow').then(function(obj){
                that.flash({msg: obj.msg,type: obj.type});
            });
            app.on("username").then(function(name){
                that.username(name);
            });
            app.on("loadPermissions").then(function(obj){
                that.permissions(obj);
            });
            router.on("router:navigation:complete",function() {
                that.flash.valueHasMutated();
                that.flash().msg = null;
                that.flash().type = null;
            });
            router.guardRoute = function(routeInfo, params, instance) {
                if(routeInfo["__moduleId__"] !== "viewmodels/access/index") {
                    var routeArray = routeInfo["__moduleId__"].split("/");
                    return $.get("check_session",{resource: routeArray[1],action: routeArray[2]}).then(function(r){
                        if(r.status) {
                            that.logged(true);
                            that.username(r.username);
                            that.permissions(r.permissions);
                            return r.authorized;
                        } else {
                            return "#access";
                        }
                    });
                } else {
                    return true;
                }
            };
            router.map([
                { route: '', moduleId: 'viewmodels/hello/index', title: 'Início', nav: true },
                { route: 'user', moduleId: 'viewmodels/user/index', title: 'Usuários', nav: true },
                { route: 'user/new', moduleId: 'viewmodels/user/new', title: 'Novo Usuário', nav: true},
                { route: 'user/:id/edit', moduleId: 'viewmodels/user/edit', title: 'Editar Usuário', nav: true},
                { route: 'role', moduleId: 'viewmodels/role/index', title: 'Níveis', nav: true },
                { route: 'role/new', moduleId: 'viewmodels/role/new', title: 'Novo Nível', nav: true},
                { route: 'role/:id/edit', moduleId: 'viewmodels/role/edit', title: 'Editar Nível', nav: true},
                { route: 'permission', moduleId: 'viewmodels/permission/index', title: 'Permissões', nav: true },
                { route: 'permission/new', moduleId: 'viewmodels/permission/new', title: 'Nova Permissão', nav: true},
                { route: 'permission/:id/edit', moduleId: 'viewmodels/permission/edit', title: 'Editar Permissão', nav: true},
                { route: 'access', moduleId: 'viewmodels/access/index', title: 'Acesso ao Sistema', nav: true},
                { route: '404', moduleId: 'viewmodels/404/index', title: 'Página não encontrada', nav: true}
            ]).buildNavigationModel().mapUnknownRoutes("viewmodels/404/index").activate();
        }
    };
});

define('viewmodels/access/index',['durandal/app','plugins/dialog','viewmodels/shell','durandal/system','./customModal'],function (app,dialog,shell,system,CustomModal) {
    return {
        email: ko.observable(""),
        password: ko.observable(""),
        title: app.title,
        forgotPassword: function() {
            CustomModal.show().then(function(response) {
                $.post("forgot_password",{email: response}).then(function(r){
                    if(r.status) {
                        dialog.showMessage("Um e-mail foi enviado, verifique sua caixa de entrada.");
                    } else {
                        dialog.showMessage("Ocorreu um erro ao tentar enviar um e-mail, cheque o endereço e tente novamente.");
                    }
                });
            });
        },
        submit: function() {
            var that = this;
            $.post("login",{email: that.email(),password: that.password()}).then(function(r){
                if(r.status) {
                    app.trigger("flash",{type: "success", msg: r.msg});
                    app.trigger("loadPermissions",r.permissions);
                    app.trigger("username",r.username);
                    shell.router.navigate("");
                } else {
                    app.trigger("flashNow",{type: "error", msg: r.msg});
                }
            });
        }
    };
});
define('viewmodels/hello/index',[],function () {
    return { };
});
define('viewmodels/permission/permission',[],function(){
    var Permission = function() {
        this.id = "";
        this.resource = ko.observable();
        this.action_read = ko.observable();
        this.action_write = ko.observable();
        this.action_remove = ko.observable();
        this.role_id = ko.observable();
    };

    return Permission;
});
define('viewmodels/permission/form',['plugins/dialog','viewmodels/permission/permission','durandal/app','viewmodels/shell'],
function(dialog,Permission,app,shell){
    var Form = function(id) {
        this.permission = new Permission();
        if(!!id) {
            this.permission.id = id;
        }
        this.roles = [];
        this.resources = [
            {id: "user",name: "Usuários"},
            {id: "role",name: "Níveis"},
            {id: "permission",name: "Permissões"}
        ];
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                $(element).ajaxSubmit({url: "permission/"+(that.permission.id == "" ? "create" : "update/"+that.permission.id),dataType: 'json',
                    success: function(r) {
                        shell.router.navigate('permission');
                        app.trigger("flash",{type: "success", msg: "Permissão "+(that.permission.id == "" ? "gravada" : "atualizada")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        dialog.showMessage("Ocorreu um erro ao tentar "+(that.permission.id == "" ? "gravar" : "atualizar")+" a permissão. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        return $.getJSON("role").then(function(r){
            that.roles = r;
            if(that.permission.id !== "") {
                return $.get("permission/"+that.permission.id,function(p){
                    that.permission.resource(p.resource)
                    .action_write(p.action_write)
                    .action_remove(p.action_remove)
                    .action_read(p.action_read)
                    .role_id(p.role_id);
                });
            }
        });
    };

    Form.prototype.compositionComplete = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});
define('viewmodels/permission/edit',['viewmodels/permission/form'],
    function(Form){
        return {
            form: null,
            activate: function(id) {
                this.form = new Form(id);
            }
        }
    }
);
define('viewmodels/table/index',['durandal/app','plugins/dialog'],function(app,dialog){
    var ctor = function(obj,fields,actions,options) {
        this.obj = obj;
        this.fields = fields;
        this.html = "<table "+(typeof options !== "undefined" && options["export_tools"] == false ? "data-tools='false'" : "")+" "+(typeof options !== "undefined" && options["click_to_show"] == false ? "data-show='false'" : "")+"style='display: none' class='table table-hover table-striped table-bordered'><thead>";
        this.custom_tfoot = (typeof options !== "undefined" && options["custom_tfoot"] != "" ? options["custom_tfoot"] : "");
        for(var k in fields) {
            this.html += "<th>"+k+"</th>";
        }
        if(actions.length > 0) {
            this.html += "<th>Ações</th>";
        }
        this.html += "</thead><tbody>";
        this.generate_actions = function(id){
            return {
                "Excluir": "<a class='btn btn-mini remove_item link_row' data-id='"+id+"'><i class='icon-trash'></i> Excluir</a>"
            }
        };
        for(i = 0;i < obj.length;i++) {
            var item = obj[i];
            this.html += "<tr data-id='"+item["id"]+"'>";
            var _actions = this.generate_actions(item["id"]);
            for(var k in fields) {
                field = fields[k];
                if(field == "status") {
                    this.html += "<td><a data-id="+item["id"]+" class='change_status btn btn-mini "+(item["status"] == "0" ? "btn-warning": "btn-success")+"'>"+(item["status"] == "0" ? "Inativo" : "Ativo")+"</a></td>";
                } else {
                    this.html += "<td>"+(item[field] ? item[field] : "")+"</td>";
                }
            }
            if(actions.length > 0) {
                this.html += "<td>";
                for(j = 0; j < actions.length; j++) {
                    this.html += _actions[actions[j]];
                }
                this.html += "</td>";
            }
            this.html += "</tr>";
        }
        if(obj.length > 1) {
            this.html += "</tbody><tfoot><tr>";
            for(var k in fields) {
                var field = fields[k];
                if(field != "status") {
                    this.html += "<td><input type='text'></td>";
                } else {
                    this.html += "<td></td>";
                }
            }
            if(actions.length > 0) {
                this.html += "<td></td>";
            }
            this.html += "</tr>";
            if(this.custom_tfoot != "") {
                this.html += this.custom_tfoot+"</tfoot>";
            }
        }
        this.html += "</table>";
    };

    ctor.initializeTable = function(container_id,extra_options) {
        var asInitVals = new Array();

        $.extend($.fn.dataTableExt.oStdClasses, {
            "sSortAsc": "header headerSortDown",
            "sSortDesc": "header headerSortUp",
            "sSortable": "header"
        });

        $.extend( true, $.fn.DataTable.TableTools.classes, {
            "container": "btn-group",
            "buttons": {
                "normal": "btn",
                "disabled": "btn disabled"
            },
            "collection": {
                "container": "DTTT_dropdown dropdown-menu",
                "buttons": {
                    "normal": "",
                    "disabled": "disabled"
                }
            }
        });

        // Have the collection use a bootstrap compatible dropdown
        $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
            "collection": {
                "container": "ul",
                "button": "li",
                "liner": "a"
            }
        });

        var table_options = {
            "bPaginate": true,
            "bLengthChange": true,
            "bFilter": true,
            "bSort": true,
            "bInfo": false,
            "bAutoWidth": true,
            "sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sProcessing":   "A processar...",
                "sLengthMenu":   "Mostrar _MENU_ registros",
                "sZeroRecords":  "Não foram encontrados resultados",
                "sInfo":         "Mostrando de _START_ até _END_ de _TOTAL_ registos",
                "sInfoEmpty":    "Mostrando de 0 até 0 de 0 registros",
                "sInfoFiltered": "(filtrado de _MAX_ registos no total)",
                "sInfoPostFix":  "",
                "sSearch":       "Procurar:",
                "sUrl":          "",
                "oPaginate": {
                    "sFirst":    "Primeiro",
                    "sPrevious": "Anterior",
                    "sNext":     "Seguinte",
                    "sLast":     "Último"
                }
            }
        };

        if(typeof extra_options !== "undefined") {
            table_options = $.extend(true,table_options,extra_options);
        }

        if($("#"+container_id).find(".table").attr("data-tools") !== "false") {
            table_options["sDom"] = "<'row-fluid'<'span4'l><'span4'T><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>";
            table_options["oTableTools"] = {
                "sSwfPath": "lib/tabletools/swf/copy_csv_xls_pdf.swf",
                "aButtons": [
                    {
                        "sExtends": "print",
                        "sButtonText": "Imprimir"
                    },
                    {
                        "sExtends": "csv",
                        "sButtonText": "XLS"
                    }
                ]
            };
        }

        var oTable = $("#"+container_id).find('.table').dataTable(table_options);

        $("#"+container_id).find('.table').show();

        $("tfoot input").keyup( function () {
            /* Filter on the column (the index) of this element */
            oTable.fnFilter( this.value, $("tfoot input").index(this) );
        });

        $("tfoot input").each( function (i) {
            asInitVals[i] = this.value;
        });

        $("tfoot input").focus( function () {
            if ( this.className == "search_init" )
            {
                this.className = "";
                this.value = "";
            }
        });

        $("tfoot input").blur( function (i) {
            if ( this.value == "" )
            {
                this.className = "search_init";
                this.value = asInitVals[$("tfoot input").index(this)];
            }
        });

        if($("#"+container_id).find(".table").attr("data-show") !== "false") {
            $("#"+container_id).find(".table tbody tr").on("click",function(){
                window.location.href = "#"+container_id+"/"+$(this).attr("data-id")+"/edit";
            });
        }

        $("#"+container_id).find(".link_row").on("click",function(e){
            e.stopPropagation();
        });

        $("#"+container_id).find(".change_status").on("click",function(){
            var self = $(this);
            self.attr("disabled",true);
            $.post(container_id+"/update_status/"+self.attr("data-id"), function(r) {
                if(r.status) {
                    if(self.hasClass("btn-warning")) {
                        self.removeClass("btn-warning");
                        self.addClass("btn-success");
                        if(self.text() == "Inativo") {
                            self.text("Ativo");
                        } else if(self.text() == "Pendente") {
                            self.text("Confirmado");
                        } else if(self.text() == "Ausente") {
                            self.text("Presente");
                        }
                    } else {
                        self.removeClass("btn-success");
                        self.addClass("btn-warning");
                        if(self.text() == "Ativo") {
                            self.text("Inativo");
                        } else if(self.text() == "Confirmado") {
                            self.text("Pendente");
                        } else if(self.text() == "Presente") {
                            self.text("Ausente");
                        }
                    }
                } else {
                    dialog.showMessage(html_decode(r.msg));
                }
                self.attr("disabled",false);
            });
            return false;
        });

        $("#"+container_id).find(".remove_item").on("click",function(){
            var self = $(this);
            self.attr("disabled",true);
            dialog.showMessage("O item será excluído. Continuar?", "Atenção!",["Ok","Cancelar"]).then(
                function(response) {
                    if(response == "Ok") {
                        self.parent().parent().remove();
                        $.post(window.location.href.replace("#","")+"/delete/"+self.attr("data-id"), function(r){
                            if(r.status != true) {
                                dialog.showMessage(html_decode(r.msg));
                            }
                        });
                    } else {
                        self.attr("disabled",false);
                    }
                }
            );
            return false;
        });
    }

    return ctor;
});
define('viewmodels/permission/index',['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        attached: function() {
            Table.initializeTable("permission");
        },
        activate: function() {
            var that = this;
            return $.get("permission").then(function(r){
                var table = new Table(r,{'#': 'id','Recurso': 'resource','Nível': 'role_name','Leitura': 'action_read','Gravação': 'action_write','Remoção': 'action_remove'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});
define('viewmodels/permission/new',['viewmodels/permission/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        }
    }
);
define('viewmodels/role/role',[],function(){
    var Role = function() {
        this.id = "";
        this.name = ko.observable();
        this.description = ko.observable();
    };

    return Role;
});
define('viewmodels/role/form',['plugins/dialog','viewmodels/role/role','durandal/app','viewmodels/shell'],
function(dialog,Role,app,shell){
    var Form = function(id) {
        this.role = new Role();
        if(!!id) {
            this.role.id = id;
        }
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                $(element).ajaxSubmit({url: "role/"+(that.role.id == "" ? "create" : "update/"+that.role.id),dataType: 'json',
                    success: function(r) {
                        shell.router.navigate('role');
                        app.trigger("flash",{type: "success", msg: "Nível "+(that.role.id == "" ? "gravado" : "atualizado")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        dialog.showMessage("Ocorreu um erro ao tentar "+(that.role.id == "" ? "gravar" : "atualizar")+" o nível. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        if(that.role.id !== "") {
            return $.get("role/"+that.role.id).then(function(r){
                that.role.name(r.name).description(r.description);
            });
        }
    };

    Form.prototype.compositionComplete = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});
define('viewmodels/role/edit',['viewmodels/role/form'],
    function(Form){
        return {
            form: null,
            activate: function(id) {
                this.form = new Form(id);
            }
        }
    }
);
define('viewmodels/role/index',['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        attached: function() {
            Table.initializeTable("role");
        },
        activate: function() {
            var that = this;
            return $.get("role").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','Descrição': 'description'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});
define('viewmodels/role/new',['viewmodels/role/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        };
    }
);
define('viewmodels/user/user',[],function(){
    var User = function() {
        this.id = "";
        this.name = ko.observable();
        this.avatar = ko.observable();
        this.role_id = ko.observable();
        this.email = ko.observable();
        this.password = ko.observable();
        this.status = ko.observable(1);
    };

    return User;
});
define('viewmodels/user/form',['plugins/dialog','viewmodels/user/user','durandal/app','viewmodels/shell','durandal/system'],
function(dialog,User,app,shell,system){
    var Form = function(id) {
        this.user = new User();
        if(!!id) {
            this.user.id = id;
        }
        this.roles = [];
        this.submit = function(element) {
            var that = this;
            if($(element).jqBootstrapValidation("hasErrors")) {
                return false;
            } else {
                var submit = $(element).find("button[type=submit]");
                submit.button("loading");
                if(!!that.user.id && !!that.user.avatar()) {
                    that.user.avatar($("#avatar").val());
                }
                $(element).ajaxSubmit({url: "user/"+(that.user.id == "" ? "create" : "update/"+that.user.id),data: ko.toJS(that.user),type: "POST",dataType: 'json',iframe: true,
                    success: function(r) {
                        shell.router.navigate('user');
                        app.trigger("flash",{type: "success", msg: "Usuário "+(that.user.id == "" ? "gravado" : "atualizado")+" com sucesso!"});
                        submit.button("reset");
                    },
                    error: function(r) {
                        dialog.showMessage("Ocorreu um erro ao tentar "+(that.user.id == "" ? "gravar" : "atualizar")+" o usuário. Tente novamente mais tarde");
                        submit.button("reset");
                    }
                });
            }
        };
    };

    Form.prototype.activate = function() {
        var that = this;
        return $.get("role").then(function(r){
            that.roles = r;
            if(that.user.id !== "") {
                return $.get("user/"+that.user.id,function(u){
                    that.user.name(u.name)
                    .avatar(u.avatar)
                    .role_id(u.role_id)
                    .email(u.email)
                    .status(u.status);
                });
            }
        });
    };

    Form.prototype.compositionComplete = function() {
        $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
    };

    return Form;
});
define('viewmodels/user/edit',['viewmodels/user/form'],
    function(Form){
        return {
            form: null,
            activate: function(id) {
                this.form = new Form(id);
            }
        }
    }
);
define('viewmodels/user/index',['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        attached: function() {
            Table.initializeTable("user");
        },
        activate: function() {
            var that = this;
            return $.get("user").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','E-mail': 'email',
                'Nível': 'role_name','Último Login': 'last_login_at',
                'Data de Criação': 'created_at','Status': 'status'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});
define('viewmodels/user/new',['viewmodels/user/form'],
    function(Form){
        return {
            activate: function() {
                this.form = new Form();
            }
        };
    }
);
define('viewmodels/utils/states',[],function(){
   return [
            {id: "AC", name: "Acre"},
            {id: "AL", name: "Alagoas"},
            {id: "AP", name: "Amapá"},
            {id: "AM", name: "Amazonas"},
            {id: "BA", name: "Bahia"},
            {id: "CE", name: "Ceará"},
            {id: "DF", name: "Distrito Federal"},
            {id: "ES", name: "Espírito Santo"},
            {id: "GO", name: "Goiás"},
            {id: "MA", name: "Maranhão"},
            {id: "MT", name: "Mato Grosso"},
            {id: "MS", name: "Mato Grosso do Sul"},
            {id: "MG", name: "Minas Gerais"},
            {id: "PA", name: "Pará"},
            {id: "PB", name: "Paraíba"},
            {id: "PR", name: "Paraná"},
            {id: "PE", name: "Pernambuco"},
            {id: "PI", name: "Piauí"},
            {id: "RJ", name: "Rio de Janeiro"},
            {id: "RN", name: "Rio Grande do Norte"},
            {id: "RS", name: "Rio Grande do Sul"},
            {id: "RO", name: "Rondônia"},
            {id: "RR", name: "Roraima"},
            {id: "SC", name: "Santa Catarina"},
            {id: "SP", name: "São Paulo"},
            {id: "SE", name: "Sergipe"},
            {id: "TO", name: "Tocantins"}
        ];
});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('text!views/404/index.html',[],function () { return '<h1>ERRO: Página não encontrada.</h1>';});

define('text!views/access/customModal.html',[],function () { return '<div class="messageBox">\r\n    <div class="modal-header">\r\n        <h3>Esqueci minha senha</h3>\r\n    </div>\r\n    <div class="modal-body">\r\n        <form data-bind="submit: ok">\r\n            <p class="message">Digite seu e-mail para receber uma nova senha:</p>\r\n            <input data-bind="value: input, valueUpdate: \'afterkeydown\'" class="autofocus"/>\r\n        </form>\r\n    </div>\r\n    <div class="modal-footer">\r\n        <button class="btn btn-primary" data-bind="click: ok">Ok</button>\r\n    </div>\r\n</div>';});

define('text!views/access/index.html',[],function () { return '<form data-bind="submit: submit" class="form-signin">\r\n    <h2 class="form-signin-heading" data-bind="text: title">Please sign in</h2>\r\n    <input type="email" name="email" id="email" data-bind="value: email" class="input-block-level" placeholder="Email">\r\n    <input type="password" id="password" name="password" data-bind="value: password" class="input-block-level" placeholder="Password">\r\n    <button type="submit" data-loading-text="Aguarde..." class="btn btn-primary">Conectar</button>\r\n    <a id="forgot_password" class="btn btn-link" data-bind="click: forgotPassword">Esqueci minha senha</a>\r\n</form>';});

define('text!views/event/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/event/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: event.id == \'\' ? \'Novo Evento\' : \'Atualizar Evento\'"></legend>\r\n            <div class="row-fluid">\r\n                <div class="span4">\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'title\'>Nome do Evento</label>\r\n                        <div class=\'controls\'>\r\n                            <input type=\'text\' class="input-block-level" maxlength="255" name=\'title\' data-bind="value: event.title" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um título.\'>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'max_subscriptions\'>Número de vagas</label>\r\n                        <div class=\'controls\'>\r\n                            <input type=\'text\' class="span2" maxlength="5" name=\'max_subscriptions\' data-bind="value: event.max_subscriptions" data-validation-number-number="true" data-validation-number-message="Este campo aceita apenas números." data-validation-required-required=\'true\' data-validation-required-message=\'Digite um número de vagas.\'>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'date_start\'>Data de início</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="span6" name=\'date_start\' data-meio-mask=\'date\' data-bind="value: event.date_start" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma data de início.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'time_start\'>Horário de início</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="span4" id=\'time_start\' data-meio-mask=\'time\' data-bind="value: event.time_start" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um horário de início.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'date_end\'>Data de término</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="span6" name=\'date_end\' data-meio-mask=\'date\' data-bind="value: event.date_end" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma data de término.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'time_end\'>Horário de término</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="span4" id="time_end" data-meio-mask=\'time\' data-bind="value: event.time_end" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um horário de término.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'street\'>Endereço completo</label>\r\n                        <div class=\'controls\'>\r\n                            <input type=\'text\'  class="input-block-level" maxlength="255" name=\'street\' data-bind="value: event.street" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um endereço.\'>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'city\'>Cidade</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' maxlength="255" name=\'city\' data-bind="value: event.city" data-validation-required-required="true" data-validation-required-message="Digite uma cidade." class="input-block-level">\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'state\'>Estado</label>\r\n                            <select name="state" class="input-block-level" data-bind="options: states,optionsValue: \'id\',optionsText: \'name\',value: event.state"></select>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'description\'>Descrição</label>\r\n                        <div class=\'controls\'>\r\n                            <textarea class="editor input-block-level" name=\'description\' rows="10" data-bind="value: event.description" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma descrição.\'></textarea>\r\n                        </div>\r\n                    </div>\r\n                    <div id="event_upload_photo" data-bind="attr: {class: \'span12 fileupload fileupload-\'+(!!event.image() ? \'exists\' : \'new\')}" data-provides="fileupload">\r\n                      <div class="fileupload-new thumbnail" style="width: 50px; height: 50px;"></div>\r\n                      <div class="fileupload-preview fileupload-exists thumbnail" style="width: 50px; height: 50px;"><img data-bind="attr: {src: event.image}"></div>\r\n                      <span class="btn btn-file"><span class="fileupload-new">Selecionar Imagem</span><span class="fileupload-exists">Mudar</span>\r\n                        <input type="file" name="image" id="image">\r\n                      </span>\r\n                      <a href="#" class="btn fileupload-exists" data-dismiss="fileupload">Excluir</a>\r\n                    </div>\r\n                </div>\r\n                <div class="span3">\r\n                    <label>Status do Evento</label>\r\n                    <select name="status" data-bind="value: event.status">\r\n                        <option value="0">Inativo</option>\r\n                        <option value="1">Ativo</option>\r\n                    </select>\r\n                    <label for="status_subscriptions">Inscrições</label>\r\n                    <select name="status_subscriptions" data-bind="value: event.status_subscriptions">\r\n                        <option value="1">Abertas</option>\r\n                        <option value="2">Pausadas</option>\r\n                        <option value="0">Encerradas</option>\r\n                    </select>\r\n                    <div class="row-fluid">\r\n                        <div class="span12" data-bind="visible: event.id !== \'\'">\r\n                            <h3 data-bind="text: event.participations_text"></h3>\r\n                            <h4 data-bind="text: event.presences_and_absences_text"></h4>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'student_price\'>Preço para Estudante</label>\r\n                        <div class=\'controls\'>\r\n                            <input type="checkbox" class="check_price">\r\n                            <input type=\'text\' class="span3" maxlength="10" data-mask-money=\'true\'  name=\'student_price\' data-bind="value: event.student_price" data-validation-regex-regex="[0-9\\.,]+" data-validation-regex-message="Este campo aceita apenas números.">\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'professional_price\'>Preço para Profissional</label>\r\n                        <div class=\'controls\'>\r\n                            <input type="checkbox" class="check_price">\r\n                            <input type=\'text\' class="span3" maxlength="10" data-mask-money=\'true\'  name=\'professional_price\' data-bind="value: event.professional_price"  data-validation-regex-regex="[0-9\\.,]+" data-validation-regex-message="Este campo aceita apenas números.">\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'abelhinhas_price\'>Preço para Abelhinhas</label>\r\n                        <div class=\'controls\'>\r\n                            <input type="checkbox" class="check_price">\r\n                            <input type=\'text\' class="span3" maxlength="10"  data-mask-money=\'true\' name=\'abelhinhas_price\' data-bind="value: event.abelhinhas_price"  data-validation-regex-regex="[0-9\\,.]+" data-validation-regex-message="Este campo aceita apenas números.">\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'price\'>Preço para Avulso</label>\r\n                        <div class=\'controls\'>\r\n                            <input type="checkbox" class="check_price">\r\n                            <input type=\'text\' class="span3" maxlength="10" data-mask-money=\'true\' name=\'price\' data-bind="value: event.price"  data-validation-regex-regex="[0-9\\,.]+" data-validation-regex-message="Este campo aceita apenas números.">\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: event.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#event" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/event/index.html',[],function () { return '<div>\r\n    <a href="#event/new" class="btn btn-primary"><i class="icon-plus"></i> Novo Evento</a>\r\n    <div id="event" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/event/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/event/subscription.html',[],function () { return '<style>\r\n@media (max-width: 728px) {\r\n    .navbar {\r\n        display: none;\r\n    }\r\n\r\n    body {\r\n        padding: 0;\r\n    }\r\n}\r\n\r\n#event_info {\r\n    margin: 20px;\r\n}\r\n\r\n#event_participations .btn {\r\n    -webkit-border-radius: 0;\r\n    -moz-border-radius: 0;\r\n    border-radius: 0;\r\n    text-align: left;\r\n    text-indent: 5px;\r\n    font-size: 20px;\r\n    padding: 10px 0;\r\n    line-height: 22px;\r\n}\r\n\r\n#event_participations .btn i {\r\n    position: relative;\r\n    top: 0px;\r\n}\r\n</style>\r\n\r\n<div id="event_participations">\r\n    <div id="event_info">\r\n        <h3 data-bind="text: event.title"></h3>\r\n        <div data-bind="text: event.street"></div>\r\n        <span data-bind="text: event.city"></span> - <span data-bind="text: event.state"></span>\r\n        <div>\r\n            Início: <span data-bind="text: event.date_start"></span>&nbsp;<span data-bind="text: event.time_start"></span>\r\n        </div>\r\n        <div>\r\n            Término: <span data-bind="text: event.date_start"></span>&nbsp;<span data-bind="text: event.time_start"></span>\r\n        </div>\r\n        <div><strong>Marque os presentes abaixo.</strong></div>\r\n    </div>\r\n    <div id="subscription" class="table_container" data-bind="html: table"></div>\r\n</div>';});

define('text!views/event_payment/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/event_payment/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: payment.id == \'\' ? \'Novo Pagamento\' : \'Atualizar Pagamento\'"></legend>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'type\'>Tipo</label>\r\n                <select name="type" data-bind="value: payment.type">\r\n                    <option value="boleto">Boleto</option>\r\n                    <option value="deposito">Depósito</option>\r\n                    <option value="especial">Especial</option>\r\n                </select>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'price\'>Valor</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'text\' data-mask-money="true" maxlength="10" name=\'description\' data-bind="value: payment.price" data-validation-regex-regex="[0-9\\.,]+" data-validation-regex-message="Digite um valor válido." data-validation-required-required=\'true\' data-validation-required-message=\'Digite um valor.\'>\r\n                </div>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class="control-label" for="status">Status</label>\r\n                <select name="status" data-bind="value: payment.status">\r\n                    <option value="0">Pendente</option>\r\n                    <option value="1">Confirmado</option>\r\n                </select>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: payment.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#payment" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/event_payment/index.html',[],function () { return '<div>\r\n    <div id="event_payment" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/event_payment/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/hello/index.html',[],function () { return '<h1>Página Inicial</h1>';});

define('text!views/member/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/member/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: member.id == \'\' ? \'Novo Membro\' : \'Atualizar Membro\'"></legend>\r\n            <div class="row-fluid">\r\n                <div class="span4">\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'name\'>Nome</label>\r\n                        <div class=\'controls\'>\r\n                            <input type=\'text\' maxlength="255" name=\'name\' class="input-block-level" data-bind="value: member.name" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um nome.\'>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'control-group\'>\r\n                        <label class=\'control-label\' for=\'name\'>Sobrenome</label>\r\n                        <div class=\'controls\'>\r\n                            <input type=\'text\' maxlength="255" name=\'surname\' class="input-block-level" data-bind="value: member.surname" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um sobrenome.\'>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'nationality\'>Nacionalidade</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  maxlength="255" class="input-block-level" name=\'nationality\' data-bind="value: member.nationality" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma nacionalidade.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'birth_date\'>Data de Nascimento</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  class="input-block-level" data-mask=\'99/99/9999\' name=\'birth_date\' data-bind="value: member.birth_date" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma data de nascimento.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'cpf\'>CPF</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  class="input-block-level" data-mask=\'999.999.999-99\' name=\'cpf\' data-bind="value: member.cpf" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um CPF.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'rg\'>RG</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  maxlength="40" class="input-block-level" name=\'rg\' data-bind="value: member.rg" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um RG.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class="span6">\r\n                            <label>Estado Civil</label>\r\n                            <select name="marital_status" class="input-block-level" data-bind="value: member.marital_status">\r\n                                <option>Solteiro</option>\r\n                                <option>Noivo</option>\r\n                                <option>Casado</option>\r\n                                <option>Viúvo</option>\r\n                                <option>Separado</option>\r\n                                <option>Divorciado</option>\r\n                            </select>\r\n                        </div>\r\n                        <div class="span6">\r\n                            <label>Tipo de Associação</label>\r\n                            <select name="type_registration"  class="input-block-level" data-bind="value: member.type_registration">\r\n                                <option>Estudante</option>\r\n                                <option>Profissional</option>\r\n                            </select>\r\n                        </div>\r\n                    </div>\r\n                    <div class=\'row-fluid\'>\r\n                        <div class=\'control-group span4\'>\r\n                            <label class=\'control-label\' for=\'cep\'>CEP</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="input-block-level" name=\'cep\' data-mask="99999-999" data-bind="value: member.cep" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um CEP.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span8\'>\r\n                            <label class=\'control-label\' for=\'street\'>Endereço</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' maxlength="255" class="input-block-level" name=\'street\' data-bind="value: member.street" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um endereço.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'number\'>Número</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' name=\'number\' class="input-block-level" maxlength="255" data-bind="value: member.number" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um número.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'neighborhood\'>Bairro</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' name=\'neighborhood\' class="input-block-level" maxlength="255" data-bind="value: member.neighborhood" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um bairro.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'city\'>Cidade</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' name=\'city\'  class="input-block-level" maxlength="255" data-bind="value: member.city" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma cidade.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label>Estado</label>\r\n                            <select name="state"  class="input-block-level" data-bind="options: states,optionsText: \'name\',optionsValue: \'id\',value: member.state"></select>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'email\'>E-mail</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="input-block-level" maxlength="255"  name=\'email\' data-bind="value: member.email" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um e-mail.\'>\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'phone\'>Telefone</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  class="input-block-level" data-meio-mask=\'phone\' name=\'phone\' data-validation-required-required=\'true\' data-validation-required-message=\'Digite um telefone.\' data-bind="value: member.phone">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'commercial_phone\'>Telefone Comercial</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  class="input-block-level" data-meio-mask=\'phone\' name=\'commercial_phone\' data-bind="value: member.commercial_phone">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div class="row-fluid" data-bind="visible: member.type_registration() == \'Estudante\'">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'college\'>Faculdade</label>\r\n                            <select name="college" data-bind="value: member.college">\r\n                                <option>Faculdade 1</option>\r\n                                <option>Faculdade 2</option>\r\n                                <option>Faculdade 3</option>\r\n                                <option>Faculdade 4</option>\r\n                                <option>Outros</option>\r\n                            </select>\r\n                            <input type="text" id="custom_college" name="custom_college" data-bind="value: member.custom_college,visible: member.college() == \'Outros\'">\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'course\'>Curso</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\'  class="input-block-level" maxlength="255"  name=\'course\' data-bind="value: member.course" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um curso.\'>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <!-- ko if: member.type_registration() == \'Profissional\' -->\r\n                        <!-- ko foreach: member.scholarities -->\r\n                            <div class="scholarity_item row-fluid">\r\n                                <div class="scholarity_item_container" class="span12">\r\n                                    <div class="span6">\r\n                                        <div>Escolaridade</div>\r\n                                        <select name="degree[]" class="degree" data-bind="value: degree">\r\n                                            <option>Superior Incompleto</option>\r\n                                            <option>Superior Completo</option>\r\n                                            <option>Pós Incompleta</option>\r\n                                            <option>Pós Completa</option>\r\n                                            <option>Mestrado Incompleto</option>\r\n                                            <option>Mestrado Completo</option>\r\n                                            <option>Doutorado Incompleto</option>\r\n                                            <option>Doutorado Completo</option>\r\n                                        </select>\r\n                                    </div>\r\n                                    <div class="span6">\r\n                                        <div>Instituição</div>\r\n                                        <select name="institution[]" class="institution" data-bind="value: institution">\r\n                                            <option>Faculdade 1</option>\r\n                                            <option>Faculdade 2</option>\r\n                                            <option>Faculdade 3</option>\r\n                                            <option>Faculdade 4</option>\r\n                                            <option>Outros</option>\r\n                                        </select>\r\n                                        <input type="text" data-required="true" style="display: none" data-error-message="Digite a faculdade." class="custom_institution" name="custom_institution[]" data-bind="value: custom_institution,visible: institution() == \'Outros\'">\r\n                                    </div>\r\n                                </div>\r\n                            </div>\r\n                            <div class="row-fluid">\r\n                                <div class="add_scholarity_container span6">\r\n                                    <a class="add_scholarity" data-bind="visible: $index() == 0,click: $root.member.add_scholarity">Adicionar Escolaridade</a>\r\n                                </div>\r\n                                <div class="span6">\r\n                                    <a class="remove_scholarity" data-bind="visible: $index() > 0,click: function() { $root.member.remove_scholarity($data) } ">Remover</a>\r\n                                </div>\r\n                            </div>\r\n                        <!-- /ko -->\r\n                    <!-- /ko -->\r\n                    <div data-bind="visible: member.type_registration() == \'Estudante\'">\r\n                        Trabalha?\r\n                        <label class="radio inline">\r\n                          <input type="radio" name="employee" value="1" data-bind="checked: member.employee">\r\n                          Sim\r\n                        </label>\r\n                        <label class="radio inline">\r\n                          <input type="radio" name="employee" value="0" data-bind="checked: member.employee">\r\n                          Não\r\n                        </label>\r\n                    </div>\r\n                    <div class="row-fluid" data-bind="visible: member.employee() == \'1\'">\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'email\'>Onde?</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="input-block-level" maxlength="255"  name=\'workplace\' data-bind="value: member.workplace">\r\n                            </div>\r\n                        </div>\r\n                        <div class=\'control-group span6\'>\r\n                            <label class=\'control-label\' for=\'job\'>Cargo</label>\r\n                            <div class=\'controls\'>\r\n                                <input type=\'text\' class="input-block-level" maxlength="255" name=\'job\' data-bind="value: member.job">\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                    <div data-bind="visible: member.type_registration() == \'Estudante\'">\r\n                        <label class="checkbox inline">\r\n                          <input type="hidden" name="is_abelhinhas" value="0">\r\n                          <input type="checkbox" name="is_abelhinhas" value="1" data-bind="checked: member.is_abelhinhas() == \'1\'">\r\n                          Participa do Projeto Abelhinhas\r\n                        </label>\r\n                    </div>\r\n                    <div data-bind="visible: member.type_registration() == \'Estudante\'">\r\n                        <label class="checkbox inline">\r\n                          <input type="hidden" name="is_punished" value="0">\r\n                          <input type="checkbox" name="is_punished" value="1" data-bind="checked: member.is_punished() == \'1\'">\r\n                          Punição\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n                <div class="span4" data-bind="visible: member.id !== \'\'">\r\n                    <div>\r\n                        <label>Status do Pagamento</label>\r\n                        <select name="payment_status" data-bind="value: member.payment_status">\r\n                            <option>Confirmado</option>\r\n                            <option>Pendente</option>\r\n                        </select>\r\n                    </div>\r\n                    <div>\r\n                        <h3>Histórico</h3>\r\n                        <div data-bind="foreach: subscriptions">\r\n                            <div>\r\n                                <a data-bind="click: $parent.toggle.bind($parent,event_id),attr: {class: \'btn \'+(status() == \'1\' ? \'btn-success\' : \'\') }">\r\n                                    <i data-bind="attr: {class: (status() == \'1\' ? \'icon-check\' : \'icon-check-empty\')+\' icon-large\'}"></i> <span data-bind="html: title"></span>\r\n                                </a>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n            <div class="row-fluid">\r\n                <div class="span12">\r\n                    <hr />\r\n                    <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: member.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                    <a href="#member" class="btn">Voltar</a>\r\n                </div>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/member/index.html',[],function () { return '<div>\r\n    <!--<a href="#member/new" class="btn btn-primary"><i class="icon-plus"></i> Novo Membro</a>-->\r\n    <div id="member" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/member/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/payment/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/payment/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: payment.id == \'\' ? \'Novo Pagamento\' : \'Atualizar Pagamento\'"></legend>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'type\'>Tipo</label>\r\n                <select name="type" data-bind="value: payment.type">\r\n                    <option value="boleto">Boleto</option>\r\n                    <option value="deposito">Depósito</option>\r\n                    <option value="especial">Especial</option>\r\n                </select>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'price\'>Valor</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'text\' data-mask-money="true" maxlength="10" name=\'description\' data-bind="value: payment.price" data-validation-regex-regex="[0-9\\.,]+" data-validation-regex-message="Digite um valor válido." data-validation-required-required=\'true\' data-validation-required-message=\'Digite um valor.\'>\r\n                </div>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class="control-label" for="status">Status</label>\r\n                <select name="status" data-bind="value: payment.status">\r\n                    <option value="0">Pendente</option>\r\n                    <option value="1">Confirmado</option>\r\n                </select>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: payment.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#payment" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/payment/index.html',[],function () { return '<div>\r\n    <div id="payment" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/payment/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/permission/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/permission/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: permission.id == \'\' ? \'Nova Permissão\' : \'Atualizar Permissão\'"></legend>\r\n            <label>Nível</label>\r\n            <select name="role_id" data-bind="options: roles,optionsValue: \'id\',optionsText: \'name\',value: permission.role_id"></select>\r\n            <label>Recurso</label>\r\n            <select name="resource" data-bind="options: resources,optionsValue: \'id\',optionsText: \'name\',value: permission.resource"></select>\r\n            <div class="checkbox_group">\r\n                <label class="checkbox inline">\r\n                  <input type="hidden" name="action_read" value="0">\r\n                  <input type="checkbox" data-bind="checked: permission.action_read() == 1" name="action_read" value="1"> Ler\r\n                </label>\r\n                <label class="checkbox inline">\r\n                    <input type="hidden" name="action_write" value="0">\r\n                  <input type="checkbox" data-bind="checked: permission.action_write() == 1" name="action_write" value="1"> Gravar\r\n                </label>\r\n                <label class="checkbox inline">\r\n                  <input type="hidden" name="action_remove" value="0">\r\n                  <input type="checkbox" data-bind="checked: permission.action_remove() == 1" name="action_remove" value="1"> Excluir\r\n                </label>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: permission.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#permission" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/permission/index.html',[],function () { return '<div>\r\n    <a href="#permission/new" class="btn btn-primary"><i class="icon-plus"></i> Nova Permissão</a>\r\n    <div id="permission" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/permission/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/role/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/role/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: role.id == \'\' ? \'Novo Nível\' : \'Atualizar Nível\'"></legend>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'name\'>Nome</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'text\'  maxlength="255" name=\'name\' data-bind="value: role.name" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um nome de usuário.\'>\r\n                </div>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'description\'>Descrição</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'text\'  maxlength="255" name=\'description\' data-bind="value: role.description" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma descrição.\'>\r\n                </div>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: role.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#role" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/role/index.html',[],function () { return '<div>\r\n    <a href="#role/new" class="btn btn-primary"><i class="icon-plus"></i> Novo Nível</a>\r\n    <div id="role" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/role/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/shell.html',[],function () { return '<div>\r\n    <div class="navbar" data-bind="visible: logged">\r\n      <div class="navbar-inner">\r\n        <a class="brand" href="#" data-bind="text:title"></a>\r\n        <ul class="nav">\r\n            <li class="dropdown" data-bind="css: {active: isActive(\'user\')}">\r\n                <a id="drop1" href="#" role="button" class="dropdown-toggle" data-toggle="dropdown">\r\n                  Administração\r\n                  <b class="caret"></b>\r\n                </a>\r\n                <ul class="dropdown-menu" role="menu" aria-labelledby="drop1">\r\n                    <li data-bind="visible: can(\'read\',\'user\'),css: {active: isActive(\'user\')}">\r\n                        <a href="#user">Usuários</a>\r\n                    </li>\r\n                    <li data-bind="visible: can(\'read\',\'role\'),css: {active: isActive(\'role\')}">\r\n                        <a href="#role">Níveis</a>\r\n                    </li>\r\n                    <li data-bind="visible: can(\'read\',\'permission\'),css: {active: isActive(\'permission\')}">\r\n                        <a href="#permission">Permissões</a>\r\n                    </li>\r\n                </ul>\r\n            </li>\r\n        </ul>\r\n        <div class="loader alert" data-bind="css: { active: router.isNavigating }">\r\n            Carregando...\r\n        </div>\r\n        <a class="btn btn-small btn-inverse" id="logoff" data-bind="click: logoff"><i class="icon-signout"></i>&nbsp;Logout</a>\r\n      </div>\r\n    </div>\r\n    <div class="row-fluid" id="flash" data-bind="if: flash().msg !== null">\r\n        <div class="span12 input-block-level" style="padding: 20px;">\r\n          <div data-bind="attr: { class: \'alert alert-\'+flash().type }">\r\n            <button type="button" data-bind="click: closeFlash" class="close" data-dismiss="alert">&times;</button>\r\n            <span data-bind="html: flash().msg"></span>\r\n          </div>\r\n        </div>\r\n    </div>\r\n    <div class="container-fluid page-host">\r\n        <!--ko router: {}--><!--/ko-->\r\n    </div>\r\n</div>';});

define('text!views/user/edit.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('text!views/user/form.html',[],function () { return '<div>\r\n    <form novalidate data-bind="submit: submit" enctype=\'multipart/form-data\' method="post">\r\n        <fieldset>\r\n            <legend data-bind="text: user.id == \'\' ? \'Novo Usuário\' : \'Atualizar Usuário\'"></legend>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'nome\'>Nome</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'text\' maxlength="255" name=\'name\' data-bind="value: user.name" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um nome de usuário.\'>\r\n                </div>\r\n            </div>\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'email\'>E-mail</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'email\' maxlength="255"  name=\'email\' data-bind="value: user.email" data-validation-required-required=\'true\' data-validation-required-message=\'Digite um e-mail válido.\'>\r\n                </div>\r\n            </div>\r\n            <!-- ko if: user.id == \'\' -->\r\n            <div class=\'control-group\'>\r\n                <label class=\'control-label\' for=\'password\'>Senha</label>\r\n                <div class=\'controls\'>\r\n                    <input type=\'password\' maxlength="255"  name=\'password\' data-bind="value: user.senha" data-validation-required-required=\'true\' data-validation-required-message=\'Digite uma senha.\'>\r\n                </div>\r\n            </div>\r\n            <!-- /ko -->\r\n            <label>Nível</label>\r\n            <select name="role_id" data-bind="options: roles,optionsValue: \'id\',optionsText: \'name\',value: user.role_id"></select>\r\n            <label>Status</label>\r\n            <select name="status" data-bind="value: user.status">\r\n                <option value="1">Ativo</option>\r\n                <option value="0">Inativo</option>\r\n            </select>\r\n            <div data-bind="attr: {class: \'fileupload fileupload-\'+(!!user.avatar() ? \'exists\' : \'new\')}" data-provides="fileupload">\r\n              <div class="fileupload-new thumbnail" style="width: 50px; height: 50px;"></div>\r\n              <div class="fileupload-preview fileupload-exists thumbnail" style="width: 50px; height: 50px;"><img data-bind="attr: {src: user.avatar}"></div>\r\n              <span class="btn btn-file"><span class="fileupload-new">Selecionar Avatar</span><span class="fileupload-exists">Mudar</span>\r\n                <input type="file" name="avatar" id="avatar">\r\n              </span>\r\n              <a href="#" class="btn fileupload-exists" data-dismiss="fileupload">Excluir</a>\r\n            </div>\r\n            <div>\r\n                <hr />\r\n                <button type="submit" class="btn btn-primary" data-loading-text="Aguarde..." data-bind="text: user.id == \'\' ? \'Gravar\' : \'Atualizar\' "></button>\r\n                <a href="#user" class="btn">Voltar</a>\r\n            </div>\r\n        </fieldset>\r\n    </form>\r\n</div>';});

define('text!views/user/index.html',[],function () { return '<div>\r\n    <a href="#user/new" class="btn btn-primary"><i class="icon-plus"></i> Novo Usuário</a>\r\n    <div id="user" class="table_container" data-bind="html: table">\r\n    </div>\r\n</div>';});

define('text!views/user/new.html',[],function () { return '<div>\r\n    <!-- ko compose: {model: form,activate: true} --><!--/ko-->\r\n</div>';});

define('durandal/activator', ['durandal/system'],
function (system) {

    var activator;

    function ensureSettings(settings) {
        if (settings == undefined) {
            settings = {};
        }

        if (!settings.closeOnDeactivate) {
            settings.closeOnDeactivate = activator.defaults.closeOnDeactivate;
        }

        if (!settings.beforeActivate) {
            settings.beforeActivate = activator.defaults.beforeActivate;
        }

        if (!settings.afterDeactivate) {
            settings.afterDeactivate = activator.defaults.afterDeactivate;
        }

        if (!settings.interpretResponse) {
            settings.interpretResponse = activator.defaults.interpretResponse;
        }

        if (!settings.areSameItem) {
            settings.areSameItem = activator.defaults.areSameItem;
        }

        return settings;
    }

    function invoke(target, method, data) {
        if (system.isArray(data)) {
            return target[method].apply(target, data);
        }

        return target[method](data);
    }

    function deactivate(item, close, settings, dfd, setter) {
        if (item && item.deactivate) {
            system.log('Deactivating', item);

            var result;
            try {
                result = item.deactivate(close);
            } catch(error) {
                system.error(error);
                dfd.resolve(false);
                return;
            }

            if (result && result.then) {
                result.then(function() {
                    settings.afterDeactivate(item, close, setter);
                    dfd.resolve(true);
                }, function(reason) {
                    system.log(reason);
                    dfd.resolve(false);
                });
            } else {
                settings.afterDeactivate(item, close, setter);
                dfd.resolve(true);
            }
        } else {
            if (item) {
                settings.afterDeactivate(item, close, setter);
            }

            dfd.resolve(true);
        }
    }

    function activate(newItem, activeItem, callback, activationData) {
        if (newItem) {
            if (newItem.activate) {
                system.log('Activating', newItem);

                var result;
                try {
                    result = invoke(newItem, 'activate', activationData);
                } catch (error) {
                    system.error(error);
                    callback(false);
                    return;
                }

                if (result && result.then) {
                    result.then(function() {
                        activeItem(newItem);
                        callback(true);
                    }, function(reason) {
                        system.log(reason);
                        callback(false);
                    });
                } else {
                    activeItem(newItem);
                    callback(true);
                }
            } else {
                activeItem(newItem);
                callback(true);
            }
        } else {
            callback(true);
        }
    }

    function canDeactivateItem(item, close, settings) {
        return system.defer(function (dfd) {
            if (item && item.canDeactivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = item.canDeactivate(close);
                } catch(error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        dfd.resolve(settings.interpretResponse(result));
                    }, function(reason) {
                        system.log(reason);
                        dfd.resolve(false);
                    });
                } else {
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    function canActivateItem(newItem, activeItem, settings, activationData) {
        return system.defer(function (dfd) {
            if (newItem == activeItem()) {
                dfd.resolve(true);
                return;
            }

            if (newItem && newItem.canActivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = invoke(newItem, 'canActivate', activationData);
                } catch (error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        dfd.resolve(settings.interpretResponse(result));
                    }, function(reason) {
                        system.log(reason);
                        dfd.resolve(false);
                    });
                } else {
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    function createActivator(initialActiveItem, settings) {
        var activeItem = ko.observable(null);

        settings = ensureSettings(settings);

        var computed = ko.computed({
            read: function () {
                return activeItem();
            },
            write: function (newValue) {
                computed.viaSetter = true;
                computed.activateItem(newValue);
            }
        });

        computed.__activator__ = true;
        computed.settings = settings;
        settings.activator = computed;

        computed.isActivating = ko.observable(false);

        computed.canDeactivateItem = function (item, close) {
            return canDeactivateItem(item, close, settings);
        };

        computed.deactivateItem = function (item, close) {
            return system.defer(function(dfd) {
                computed.canDeactivateItem(item, close).then(function(canDeactivate) {
                    if (canDeactivate) {
                        deactivate(item, close, settings, dfd, activeItem);
                    } else {
                        computed.notifySubscribers();
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        computed.canActivateItem = function (newItem, activationData) {
            return canActivateItem(newItem, activeItem, settings, activationData);
        };

        computed.activateItem = function (newItem, activationData) {
            var viaSetter = computed.viaSetter;
            computed.viaSetter = false;

            return system.defer(function (dfd) {
                if (computed.isActivating()) {
                    dfd.resolve(false);
                    return;
                }

                computed.isActivating(true);

                var currentItem = activeItem();
                if (settings.areSameItem(currentItem, newItem, activationData)) {
                    computed.isActivating(false);
                    dfd.resolve(true);
                    return;
                }

                computed.canDeactivateItem(currentItem, settings.closeOnDeactivate).then(function (canDeactivate) {
                    if (canDeactivate) {
                        computed.canActivateItem(newItem, activationData).then(function (canActivate) {
                            if (canActivate) {
                                system.defer(function (dfd2) {
                                    deactivate(currentItem, settings.closeOnDeactivate, settings, dfd2);
                                }).promise().then(function () {
                                    newItem = settings.beforeActivate(newItem, activationData);
                                    activate(newItem, activeItem, function (result) {
                                        computed.isActivating(false);
                                        dfd.resolve(result);
                                    }, activationData);
                                });
                            } else {
                                if (viaSetter) {
                                    computed.notifySubscribers();
                                }

                                computed.isActivating(false);
                                dfd.resolve(false);
                            }
                        });
                    } else {
                        if (viaSetter) {
                            computed.notifySubscribers();
                        }

                        computed.isActivating(false);
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        computed.canActivate = function () {
            var toCheck;

            if (initialActiveItem) {
                toCheck = initialActiveItem;
                initialActiveItem = false;
            } else {
                toCheck = computed();
            }

            return computed.canActivateItem(toCheck);
        };

        computed.activate = function () {
            var toActivate;

            if (initialActiveItem) {
                toActivate = initialActiveItem;
                initialActiveItem = false;
            } else {
                toActivate = computed();
            }

            return computed.activateItem(toActivate);
        };

        computed.canDeactivate = function (close) {
            return computed.canDeactivateItem(computed(), close);
        };

        computed.deactivate = function (close) {
            return computed.deactivateItem(computed(), close);
        };

        computed.includeIn = function (includeIn) {
            includeIn.canActivate = function () {
                return computed.canActivate();
            };

            includeIn.activate = function () {
                return computed.activate();
            };

            includeIn.canDeactivate = function (close) {
                return computed.canDeactivate(close);
            };

            includeIn.deactivate = function (close) {
                return computed.deactivate(close);
            };
        };

        if (settings.includeIn) {
            computed.includeIn(settings.includeIn);
        } else if (initialActiveItem) {
            computed.activate();
        }

        computed.forItems = function (items) {
            settings.closeOnDeactivate = false;

            settings.determineNextItemToActivate = function (list, lastIndex) {
                var toRemoveAt = lastIndex - 1;

                if (toRemoveAt == -1 && list.length > 1) {
                    return list[1];
                }

                if (toRemoveAt > -1 && toRemoveAt < list.length - 1) {
                    return list[toRemoveAt];
                }

                return null;
            };

            settings.beforeActivate = function (newItem) {
                var currentItem = computed();

                if (!newItem) {
                    newItem = settings.determineNextItemToActivate(items, currentItem ? items.indexOf(currentItem) : 0);
                } else {
                    var index = items.indexOf(newItem);

                    if (index == -1) {
                        items.push(newItem);
                    } else {
                        newItem = items()[index];
                    }
                }

                return newItem;
            };

            settings.afterDeactivate = function (oldItem, close) {
                if (close) {
                    items.remove(oldItem);
                }
            };

            var originalCanDeactivate = computed.canDeactivate;
            computed.canDeactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = [];

                        function finish() {
                            for (var j = 0; j < results.length; j++) {
                                if (!results[j]) {
                                    dfd.resolve(false);
                                    return;
                                }
                            }

                            dfd.resolve(true);
                        }

                        for (var i = 0; i < list.length; i++) {
                            computed.canDeactivateItem(list[i], close).then(function (result) {
                                results.push(result);
                                if (results.length == list.length) {
                                    finish();
                                }
                            });
                        }
                    }).promise();
                } else {
                    return originalCanDeactivate();
                }
            };

            var originalDeactivate = computed.deactivate;
            computed.deactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = 0;
                        var listLength = list.length;

                        function doDeactivate(item) {
                            computed.deactivateItem(item, close).then(function () {
                                results++;
                                items.remove(item);
                                if (results == listLength) {
                                    dfd.resolve();
                                }
                            });
                        }

                        for (var i = 0; i < listLength; i++) {
                            doDeactivate(list[i]);
                        }
                    }).promise();
                } else {
                    return originalDeactivate();
                }
            };

            return computed;
        };

        return computed;
    }

    return activator = {
        defaults: {
            closeOnDeactivate: true,
            interpretResponse: function (value) {
                if (typeof value == 'string') {
                    var lowered = value.toLowerCase();
                    return lowered == 'yes' || lowered == 'ok';
                }

                return value;
            },
            areSameItem: function (currentItem, newItem, activationData) {
                return currentItem == newItem;
            },
            beforeActivate: function (newItem) {
                return newItem;
            },
            afterDeactivate: function (item, close, setter) {
                if (close && setter) {
                    setter(null);
                }
            }
        },
        create: createActivator
    };
});
define('durandal/app', ['durandal/system', 'durandal/viewEngine', 'durandal/composition', 'durandal/widget', 'durandal/modalDialog', 'durandal/events'],
function(system, viewEngine, composition, widget, modalDialog, Events) {

    var app = {
        title: 'Application',
        showModal: function(obj, activationData, context) {
            return modalDialog.show(obj, activationData, context);
        },
        showMessage: function(message, title, options) {
            return modalDialog.show('./messageBox', {
                message: message,
                title: title || this.title,
                options: options
            });
        },
        start: function() {
            var that = this;
            if (that.title) {
                document.title = that.title;
            }

            return system.defer(function (dfd) {
                $(function() {
                    system.log('Starting Application');
                    dfd.resolve();
                    system.log('Started Application');
                });
            }).promise();
        },
        setRoot: function(root, transition, applicationHost) {
            var hostElement, settings = { activate: true, transition: transition };

            if (!applicationHost || system.isString(applicationHost)) {
                hostElement = document.getElementById(applicationHost || 'applicationHost');
            } else {
                hostElement = applicationHost;
            }

            if (system.isString(root)) {
                if (viewEngine.isViewUrl(root)) {
                    settings.view = root;
                } else {
                    settings.model = root;
                }
            } else {
                settings.model = root;
            }

            composition.compose(hostElement, settings);
        },
        adaptToDevice: function() {
            document.ontouchmove = function (event) {
                event.preventDefault();
            };
        }
    };

    Events.includeIn(app);

    return app;
});
define('durandal/composition', ['durandal/viewLocator', 'durandal/viewModelBinder', 'durandal/viewEngine', 'durandal/system'],
function (viewLocator, viewModelBinder, viewEngine, system) {

    var dummyModel = {},
        activeViewAttributeName = 'data-active-view',
        composition,
        documentAttachedCallbacks = [],
        compositionCount = 0;

    function getHostState(parent) {
        var elements = [];
        var state = {
            childElements: elements,
            activeView: null
        };

        var child = ko.virtualElements.firstChild(parent);

        while (child) {
            if (child.nodeType == 1) {
                elements.push(child);
                if (child.getAttribute(activeViewAttributeName)) {
                    state.activeView = child;
                }
            }

            child = ko.virtualElements.nextSibling(child);
        }

        return state;
    }
    
    function endComposition() {
        compositionCount--;

        if (compositionCount === 0) {
            for (var i = 0; i < documentAttachedCallbacks.length; i++) {
                documentAttachedCallbacks[i]();
            }

            documentAttachedCallbacks = [];
        }
    }

    function tryActivate(context, successCallback) {
        if (context.activate && context.model && context.model.activate) {
            var result;

            if(system.isArray(context.activationData)) {
                result = context.model.activate.apply(context.model, context.activationData);
            } else {
                result = context.model.activate(context.activationData);
            }

            if(result && result.then) {
                result.then(successCallback);
            } else if(result || result === undefined) {
                successCallback();
            } else {
                endComposition();
            }
        } else {
            successCallback();
        }
    }

    function triggerViewAttached() {
        var context = this;

        if (context.activeView) {
            context.activeView.removeAttribute(activeViewAttributeName);
        }

        if (context.child) {
            if (context.model && context.model.viewAttached) {
                if (context.composingNewView || context.alwaysAttachView) {
                    context.model.viewAttached(context.child, context);
                }
            }
            
            context.child.setAttribute(activeViewAttributeName, true);

            if (context.composingNewView && context.model) {
                if (context.model.documentAttached) {
                    composition.current.completed(function () {
                        context.model.documentAttached(context.child, context);
                    });
                }

                if (context.model.documentDetached) {
                    composition.documentDetached(context.child, function () {
                        context.model.documentDetached(context.child, context);
                    });
                }
            }
        }
        
        if (context.afterCompose) {
            context.afterCompose(context.child, context);
        }

        if (context.documentAttached) {
            composition.current.completed(function () {
                context.documentAttached(context.child, context);
            });
        }

        endComposition();
        context.triggerViewAttached = system.noop;
    }

    function shouldTransition(context) {
        if (system.isString(context.transition)) {
            if (context.activeView) {
                if (context.activeView == context.child) {
                    return false;
                }

                if (!context.child) {
                    return true;
                }

                if (context.skipTransitionOnSameViewId) {
                    var currentViewId = context.activeView.getAttribute('data-view');
                    var newViewId = context.child.getAttribute('data-view');
                    return currentViewId != newViewId;
                }
            }
            
            return true;
        }
        
        return false;
    }

    composition = {
        convertTransitionToModuleId: function (name) {
            return 'transitions/' + name;
        },
        current: {
            completed: function (callback) {
                documentAttachedCallbacks.push(callback);
            }
        },
        documentDetached: function (element, callback) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, callback);
        },
        switchContent: function (context) {
            context.transition = context.transition || this.defaultTransitionName;

            if (shouldTransition(context)) {
                var transitionModuleId = this.convertTransitionToModuleId(context.transition);
                system.acquire(transitionModuleId).then(function (transition) {
                    context.transition = transition;
                    transition(context).then(function () { context.triggerViewAttached(); });
                });
            } else {
                if (context.child != context.activeView) {
                    if (context.cacheViews && context.activeView) {
                        $(context.activeView).css('display', 'none');
                    }

                    if (!context.child) {
                        if (!context.cacheViews) {
                            ko.virtualElements.emptyNode(context.parent);
                        }
                    } else {
                        if (context.cacheViews) {
                            if (context.composingNewView) {
                                context.viewElements.push(context.child);
                                ko.virtualElements.prepend(context.parent, context.child);
                            } else {
                                $(context.child).css('display', '');
                            }
                        } else {
                            ko.virtualElements.emptyNode(context.parent);
                            ko.virtualElements.prepend(context.parent, context.child);
                        }
                    }
                }

                context.triggerViewAttached();
            }
        },
        bindAndShow: function (child, context) {
            context.child = child;

            if (context.cacheViews) {
                context.composingNewView = (ko.utils.arrayIndexOf(context.viewElements, child) == -1);
            } else {
                context.composingNewView = true;
            }

            tryActivate(context, function () {
                if (context.beforeBind) {
                    context.beforeBind(child, context);
                }

                if (context.preserveContext && context.bindingContext) {
                    if (context.composingNewView) {
                        viewModelBinder.bindContext(context.bindingContext, child, context.model);
                    }
                } else if (child) {
                    var modelToBind = context.model || dummyModel;
                    var currentModel = ko.dataFor(child);

                    if (currentModel != modelToBind) {
                        if (!context.composingNewView) {
                            $(child).remove();
                            viewEngine.createView(child.getAttribute('data-view')).then(function(recreatedView) {
                                composition.bindAndShow(recreatedView, context);
                            });
                            return;
                        }
                        viewModelBinder.bind(modelToBind, child);
                    }
                }

                composition.switchContent(context);
            });
        },
        defaultStrategy: function (context) {
            return viewLocator.locateViewForObject(context.model, context.viewElements);
        },
        getSettings: function (valueAccessor, element) {
            var value = valueAccessor(),
                settings = ko.utils.unwrapObservable(value) || {},
                isActivator = value && value.__activator__,
                moduleId;

            if (system.isString(settings)) {
                return settings;
            }

            moduleId = system.getModuleId(settings);
            if(moduleId) {
                settings = {
                    model: settings
                };
            } else {
                if(!isActivator && settings.model) {
                    isActivator = settings.model.__activator__;
                }

                for(var attrName in settings) {
                    settings[attrName] = ko.utils.unwrapObservable(settings[attrName]);
                }
            }

            if (isActivator) {
                settings.activate = false;
            } else if (settings.activate === undefined) {
                settings.activate = true;
            }

            return settings;
        },
        executeStrategy: function (context) {
            context.strategy(context).then(function (child) {
                composition.bindAndShow(child, context);
            });
        },
        inject: function (context) {
            if (!context.model) {
                this.bindAndShow(null, context);
                return;
            }

            if (context.view) {
                viewLocator.locateView(context.view, context.area, context.viewElements).then(function (child) {
                    composition.bindAndShow(child, context);
                });
                return;
            }

            if (!context.strategy) {
                context.strategy = this.defaultStrategy;
            }

            if (system.isString(context.strategy)) {
                system.acquire(context.strategy).then(function (strategy) {
                    context.strategy = strategy;
                    composition.executeStrategy(context);
                });
            } else {
                this.executeStrategy(context);
            }
        },
        compose: function (element, settings, bindingContext) {
            compositionCount++;

            if (system.isString(settings)) {
                if (viewEngine.isViewUrl(settings)) {
                    settings = {
                        view: settings
                    };
                } else {
                    settings = {
                        model: settings,
                        activate: true
                    };
                }
            }

            var moduleId = system.getModuleId(settings);
            if (moduleId) {
                settings = {
                    model: settings,
                    activate: true
                };
            }

            var hostState = getHostState(element);

            settings.activeView = hostState.activeView;
            settings.parent = element;
            settings.triggerViewAttached = triggerViewAttached;
            settings.bindingContext = bindingContext;

            if (settings.cacheViews && !settings.viewElements) {
                settings.viewElements = hostState.childElements;
            }

            if (!settings.model) {
                if (!settings.view) {
                    this.bindAndShow(null, settings);
                } else {
                    settings.area = settings.area || 'partial';
                    settings.preserveContext = true;

                    viewLocator.locateView(settings.view, settings.area, settings.viewElements).then(function (child) {
                        composition.bindAndShow(child, settings);
                    });
                }
            } else if (system.isString(settings.model)) {
                system.acquire(settings.model).then(function (module) {
                    settings.model = new (system.getObjectResolver(module))();
                    composition.inject(settings);
                });
            } else {
                composition.inject(settings);
            }
        }
    };

    ko.bindingHandlers.compose = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = composition.getSettings(valueAccessor);
            composition.compose(element, settings, bindingContext);
        }
    };

    ko.virtualElements.allowedBindings.compose = true;

    return composition;
});
//heavily borrowed from backbone events, augmented by signals.js, added a little of my own code
//cleaned up for better readability and a more fluent api
define('durandal/events', ['durandal/system'],
function (system) {

    var eventSplitter = /\s+/;
    var Events = function() { };

    var Subscription = function(owner, events) {
        this.owner = owner;
        this.events = events;
    };
    
    Subscription.prototype.then = function (callback, context) {
        this.callback = callback || this.callback;
        this.context = context || this.context;
        
        if (!this.callback) {
            return this;
        }

        this.owner.on(this.events, this.callback, this.context);
        return this;
    };
    
    Subscription.prototype.on = Subscription.prototype.then;
    
    Subscription.prototype.off = function () {
        this.owner.off(this.events, this.callback, this.context);
        return this;
    };
    
    Events.prototype.on = function(events, callback, context) {
        var calls, event, list;

        if (!callback) {
            return new Subscription(this, events);
        } else {
            calls = this.callbacks || (this.callbacks = {});
            events = events.split(eventSplitter);

            while (event = events.shift()) {
                list = calls[event] || (calls[event] = []);
                list.push(callback, context);
            }

            return this;
        }
    };

    Events.prototype.off = function(events, callback, context) {
        var event, calls, list, i;

        // No events
        if (!(calls = this.callbacks)) {
            return this;
        }

        //removing all
        if (!(events || callback || context)) {
            delete this.callbacks;
            return this;
        }

        events = events ? events.split(eventSplitter) : system.keys(calls);

        // Loop through the callback list, splicing where appropriate.
        while (event = events.shift()) {
            if (!(list = calls[event]) || !(callback || context)) {
                delete calls[event];
                continue;
            }

            for (i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                    list.splice(i, 2);
                }
            }
        }

        return this;
    };

    Events.prototype.trigger = function(events) {
        var event, calls, list, i, length, args, all, rest;
        if (!(calls = this.callbacks)) {
            return this;
        }

        rest = [];
        events = events.split(eventSplitter);
        for (i = 1, length = arguments.length; i < length; i++) {
            rest[i - 1] = arguments[i];
        }

        // For each event, walk through the list of callbacks twice, first to
        // trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
            // Copy callback lists to prevent modification.
            if (all = calls.all) {
                all = all.slice();
            }

            if (list = calls[event]) {
                list = list.slice();
            }

            // Execute event callbacks.
            if (list) {
                for (i = 0, length = list.length; i < length; i += 2) {
                    list[i].apply(list[i + 1] || this, rest);
                }
            }

            // Execute "all" callbacks.
            if (all) {
                args = [event].concat(rest);
                for (i = 0, length = all.length; i < length; i += 2) {
                    all[i].apply(all[i + 1] || this, args);
                }
            }
        }

        return this;
    };

    Events.prototype.proxy = function(events) {
        var that = this;
        return (function(arg) {
            that.trigger(events, arg);
        });
    };

    Events.includeIn = function(targetObject) {
        targetObject.on = Events.prototype.on;
        targetObject.off = Events.prototype.off;
        targetObject.trigger = Events.prototype.trigger;
        targetObject.proxy = Events.prototype.proxy;
    };

    return Events;
});
define('durandal/messageBox', ['durandal/viewEngine'],
function(viewEngine) {

    var MessageBox = function(message, title, options) {
        this.message = message;
        this.title = title || MessageBox.defaultTitle;
        this.options = options || MessageBox.defaultOptions;
    };

    MessageBox.prototype.selectOption = function (dialogResult) {
        this.modal.close(dialogResult);
    };

    MessageBox.prototype.getView = function(){
        return viewEngine.processMarkup(MessageBox.defaultViewMarkup);
    };

    MessageBox.prototype.activate = function(config) {
        if (config) {
            this.message = config.message;
            this.title = config.title || MessageBox.defaultTitle;
            this.options = config.options || MessageBox.defaultOptions;
        }
    };

    MessageBox.defaultTitle = 'Application';
    MessageBox.defaultOptions = ['Ok'];
    MessageBox.defaultViewMarkup = [
        '<div class="messageBox">',
            '<div class="modal-header">',
                '<h3 data-bind="text: title"></h3>',
            '</div>',
            '<div class="modal-body">',
            '   <p class="message" data-bind="text: message"></p>',
            '</div>',
            '<div class="modal-footer" data-bind="foreach: options">',
                '<button class="btn" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>',
            '</div>',
        '</div>'
    ].join('\n');

    return MessageBox;
});
define('durandal/modalDialog', ['durandal/composition', 'durandal/system', 'durandal/activator'],
function (composition, system, activator) {

    var contexts = {},
        modalCount = 0;

    function ensureModalInstance(objOrModuleId) {
        return system.defer(function(dfd) {
            if (system.isString(objOrModuleId)) {
                system.acquire(objOrModuleId).then(function (module) {
                    dfd.resolve(new (system.getObjectResolver(module))());
                });
            } else {
                dfd.resolve(objOrModuleId);
            }
        }).promise();
    }

    var modalDialog = {
        currentZIndex: 1050,
        getNextZIndex: function () {
            return ++this.currentZIndex;
        },
        isModalOpen: function() {
            return modalCount > 0;
        },
        getContext: function(name) {
            return contexts[name || 'default'];
        },
        addContext: function(name, modalContext) {
            modalContext.name = name;
            contexts[name] = modalContext;

            var helperName = 'show' + name.substr(0, 1).toUpperCase() + name.substr(1);
            this[helperName] = function (obj, activationData) {
                return this.show(obj, activationData, name);
            };
        },
        createCompositionSettings: function(obj, modalContext) {
            var settings = {
                model:obj,
                activate:false
            };

            if (modalContext.documentAttached) {
                settings.documentAttached = modalContext.documentAttached;
            }

            return settings;
        },
        show: function(obj, activationData, context) {
            var that = this;
            var modalContext = contexts[context || 'default'];

            return system.defer(function(dfd) {
                ensureModalInstance(obj).then(function(instance) {
                    var modalActivator = activator.create();

                    modalActivator.activateItem(instance, activationData).then(function (success) {
                        if (success) {
                            var modal = instance.modal = {
                                owner: instance,
                                context: modalContext,
                                activator: modalActivator,
                                close: function () {
                                    var args = arguments;
                                    modalActivator.deactivateItem(instance, true).then(function (closeSuccess) {
                                        if (closeSuccess) {
                                            modalCount--;
                                            modalContext.removeHost(modal);
                                            delete instance.modal;
                                            dfd.resolve.apply(dfd, args);
                                        }
                                    });
                                }
                            };

                            modal.settings = that.createCompositionSettings(instance, modalContext);
                            modalContext.addHost(modal);

                            modalCount++;
                            composition.compose(modal.host, modal.settings);
                        } else {
                            dfd.resolve(false);
                        }
                    });
                });
            }).promise();
        }
    };

    modalDialog.addContext('default', {
        blockoutOpacity: .2,
        removeDelay: 200,
        addHost: function(modal) {
            var body = $('body');
            var blockout = $('<div class="modalBlockout"></div>')
                .css({ 'z-index': modalDialog.getNextZIndex(), 'opacity': this.blockoutOpacity })
                .appendTo(body);

            var host = $('<div class="modalHost"></div>')
                .css({ 'z-index': modalDialog.getNextZIndex() })
                .appendTo(body);

            modal.host = host.get(0);
            modal.blockout = blockout.get(0);

            if (!modalDialog.isModalOpen()) {
                modal.oldBodyMarginRight = $("body").css("margin-right");
                
                var html = $("html");
                var oldBodyOuterWidth = body.outerWidth(true);
                var oldScrollTop = html.scrollTop();
                $("html").css("overflow-y", "hidden");
                var newBodyOuterWidth = $("body").outerWidth(true);
                body.css("margin-right", (newBodyOuterWidth - oldBodyOuterWidth + parseInt(modal.oldBodyMarginRight)) + "px");
                html.scrollTop(oldScrollTop); // necessary for Firefox
            }
        },
        removeHost: function(modal) {
            $(modal.host).css('opacity', 0);
            $(modal.blockout).css('opacity', 0);

            setTimeout(function() {
                $(modal.host).remove();
                $(modal.blockout).remove();
            }, this.removeDelay);
            
            if (!modalDialog.isModalOpen()) {
                var html = $("html");
                var oldScrollTop = html.scrollTop(); // necessary for Firefox.
                html.css("overflow-y", "").scrollTop(oldScrollTop);
                $("body").css("margin-right", modal.oldBodyMarginRight);
            }
        },
        documentAttached: function (child, context) {
            var $child = $(child);
            var width = $child.width();
            var height = $child.height();

            $child.css({
                'margin-top': (-height / 2).toString() + 'px',
                'margin-left': (-width / 2).toString() + 'px'
            });

            $(context.model.modal.host).css('opacity', 1);

            if ($(child).hasClass('autoclose')) {
                $(context.model.modal.blockout).click(function() {
                    context.model.modal.close();
                });
            }

            $('.autofocus', child).each(function() {
                $(this).focus();
            });
        }
    });

    return modalDialog;
});
define('durandal/system', ['require'],
function(require) {

    var isDebugging = false,
        nativeKeys = Object.keys,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        system,
        treatAsIE8 = false,
        nativeIsArray = Array.isArray,
        slice = Array.prototype.slice;

    //see http://patik.com/blog/complete-cross-browser-console-log/
    // Tell IE9 to use its built-in console
    if (Function.prototype.bind && (typeof console === 'object' || typeof console === 'function') && typeof console.log == 'object') {
        try {
            ['log', 'info', 'warn', 'error', 'assert', 'dir', 'clear', 'profile', 'profileEnd']
                .forEach(function(method) {
                    console[method] = this.call(console[method], console);
                }, Function.prototype.bind);
        } catch (ex) {
            treatAsIE8 = true;
        }
    }

    // callback for dojo's loader 
    // note: if you wish to use Durandal with dojo's AMD loader,
    // currently you must fork the dojo source with the following
    // dojo/dojo.js, line 1187, the last line of the finishExec() function: 
    //  (add) signal("moduleLoaded", [module.result, module.mid]);
    // an enhancement request has been submitted to dojo to make this
    // a permanent change. To view the status of this request, visit:
    // http://bugs.dojotoolkit.org/ticket/16727

    if (require.on) {
        require.on("moduleLoaded", function(module, mid) {
            system.setModuleId(module, mid);
        });
    }

    // callback for require.js loader
    if (typeof requirejs !== 'undefined') {
        requirejs.onResourceLoad = function(context, map, depArray) {
            system.setModuleId(context.defined[map.id], map.id);
        };
    }

    var noop = function() { };

    var log = function() {
        try {
            // Modern browsers
            if (typeof console != 'undefined' && typeof console.log == 'function') {
                // Opera 11
                if (window.opera) {
                    var i = 0;
                    while (i < arguments.length) {
                        console.log('Item ' + (i + 1) + ': ' + arguments[i]);
                        i++;
                    }
                }
                // All other modern browsers
                else if ((slice.call(arguments)).length == 1 && typeof slice.call(arguments)[0] == 'string') {
                    console.log((slice.call(arguments)).toString());
                } else {
                    console.log(slice.call(arguments));
                }
            }
            // IE8
            else if ((!Function.prototype.bind || treatAsIE8) && typeof console != 'undefined' && typeof console.log == 'object') {
                Function.prototype.call.call(console.log, console, slice.call(arguments));
            }

            // IE7 and lower, and other old browsers
        } catch (ignore) { }
    };

    var logError = function(error) {
        throw error;
    };

    system = {
        version: "2.0.0",
        noop: noop,
        getModuleId: function(obj) {
            if (!obj) {
                return null;
            }

            if (typeof obj == 'function') {
                return obj.prototype.__moduleId__;
            }

            if (typeof obj == 'string') {
                return null;
            }

            return obj.__moduleId__;
        },
        setModuleId: function(obj, id) {
            if (!obj) {
                return;
            }

            if (typeof obj == 'function') {
                obj.prototype.__moduleId__ = id;
                return;
            }

            if (typeof obj == 'string') {
                return;
            }

            obj.__moduleId__ = id;
        },
        getObjectResolver: function(module) {
            if (system.isFunction(module)) {
                return module;
            } else {
                return (function() { return module; });
            }
        },
        debug: function(enable) {
            if (arguments.length == 1) {
                isDebugging = enable;
                if (isDebugging) {
                    this.log = log;
                    this.error = logError;
                    this.log('Debug mode enabled.');
                } else {
                    this.log('Debug mode disabled.');
                    this.log = noop;
                    this.error = noop;
                }
            } else {
                return isDebugging;
            }
        },
        log: noop,
        error: noop,
        assert: function (condition, message) {
            if (!condition) {
                system.error(new Error(message || 'Assertion failed.'));
            }
        },
        defer: function(action) {
            return $.Deferred(action);
        },
        guid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        acquire: function() {
            var modules = slice.call(arguments, 0);
            return this.defer(function(dfd) {
                require(modules, function() {
                    var args = arguments;
                    setTimeout(function() {
                        dfd.resolve.apply(dfd, args);
                    }, 1);
                });
            }).promise();
        },
        extend: function(obj) {
            var rest = slice.call(arguments, 1);

            for (var i = 0; i < rest.length; i++) {
                var source = rest[i];

                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            }

            return obj;
        }
    };

    system.keys = nativeKeys || function(obj) {
        if (obj !== Object(obj)) {
            throw new TypeError('Invalid object');
        }

        var keys = [];

        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                keys[keys.length] = key;
            }
        }

        return keys;
    };

    system.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };

    system.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) == '[object Array]';
    };

    system.isObject = function(obj) {
        return obj === Object(obj);
    };

    system.isBoolean = function(obj) {
        return typeof(obj) === "boolean";
    };

    //isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    var isChecks = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];

    function makeIsFunction(name) {
        var value = '[object ' + name + ']';
        system['is' + name] = function(obj) {
            return toString.call(obj) == value;
        };
    }

    for (var i = 0; i < isChecks.length; i++) {
        makeIsFunction(isChecks[i]);
    }

    return system;
});
define('durandal/viewEngine', ['durandal/system'],
function (system) {

    var parseMarkup;

    if ($.parseHTML) {
        parseMarkup = function (html) {
            return $.parseHTML(html);
        };
    } else {
        parseMarkup = function (html) {
            return $(html).get();
        };
    }

    return {
        viewExtension: '.html',
        viewPlugin: 'text',
        isViewUrl: function (url) {
            return url.indexOf(this.viewExtension, url.length - this.viewExtension.length) !== -1;
        },
        convertViewUrlToViewId: function (url) {
            return url.substring(0, url.length - this.viewExtension.length);
        },
        convertViewIdToRequirePath: function (viewId) {
            return this.viewPlugin + '!' + viewId + this.viewExtension;
        },
        parseMarkup: parseMarkup,
        processMarkup: function (markup) {
            var allElements = this.parseMarkup(markup);
            if (allElements.length == 1) {
                return allElements[0];
            }

            var withoutCommentsOrEmptyText = [];

            for (var i = 0; i < allElements.length; i++) {
                var current = allElements[i];
                if (current.nodeType != 8) {
                    if (current.nodeType == 3) {
                        var result = /\S/.test(current.nodeValue);
                        if (!result) {
                            continue;
                        }
                    }

                    withoutCommentsOrEmptyText.push(current);
                }
            }

            if (withoutCommentsOrEmptyText.length > 1) {
                return $(withoutCommentsOrEmptyText).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0);
            }

            return withoutCommentsOrEmptyText[0];
        },
        createView: function(viewId) {
            var that = this;
            var requirePath = this.convertViewIdToRequirePath(viewId);

            return system.defer(function(dfd) {
                system.acquire(requirePath).then(function(markup) {
                    var element = that.processMarkup(markup);
                    element.setAttribute('data-view', viewId);
                    dfd.resolve(element);
                });
            }).promise();
        }
    };
});
define('durandal/viewLocator', ['durandal/system', 'durandal/viewEngine'],
function (system, viewEngine) {

    function findInElements(nodes, url) {
        for (var i = 0; i < nodes.length; i++) {
            var current = nodes[i];
            var existingUrl = current.getAttribute('data-view');
            if (existingUrl == url) {
                return current;
            }
        }
    }
    
    function escape(str) {
        return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
    }

    return {
        useConvention: function(modulesPath, viewsPath, areasPath) {
            modulesPath = modulesPath || 'viewmodels';
            viewsPath = viewsPath || 'views';
            areasPath = areasPath || viewsPath;

            var reg = new RegExp(escape(modulesPath), 'gi');

            this.convertModuleIdToViewId = function (moduleId) {
                return moduleId.replace(reg, viewsPath);
            };

            this.translateViewIdToArea = function (viewId, area) {
                if (!area || area == 'partial') {
                    return areasPath + '/' + viewId;
                }
                
                return areasPath + '/' + area + '/' + viewId;
            };
        },
        locateViewForObject: function(obj, elementsToSearch) {
            var view;

            if (obj.getView) {
                view = obj.getView();
                if (view) {
                    return this.locateView(view, null, elementsToSearch);
                }
            }

            if (obj.viewUrl) {
                return this.locateView(obj.viewUrl, null, elementsToSearch);
            }

            var id = system.getModuleId(obj);
            if (id) {
                return this.locateView(this.convertModuleIdToViewId(id), null, elementsToSearch);
            }

            return this.locateView(this.determineFallbackViewId(obj), null, elementsToSearch);
        },
        convertModuleIdToViewId: function(moduleId) {
            return moduleId;
        },
        determineFallbackViewId: function (obj) {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((obj).constructor.toString());
            var typeName = (results && results.length > 1) ? results[1] : "";

            return 'views/' + typeName;
        },
        translateViewIdToArea: function (viewId, area) {
            return viewId;
        },
        locateView: function(viewOrUrlOrId, area, elementsToSearch) {
            if (typeof viewOrUrlOrId === 'string') {
                var viewId;

                if (viewEngine.isViewUrl(viewOrUrlOrId)) {
                    viewId = viewEngine.convertViewUrlToViewId(viewOrUrlOrId);
                } else {
                    viewId = viewOrUrlOrId;
                }

                if (area) {
                    viewId = this.translateViewIdToArea(viewId, area);
                }

                if (elementsToSearch) {
                    var existing = findInElements(elementsToSearch, viewId);
                    if (existing) {
                        return system.defer(function(dfd) {
                            dfd.resolve(existing);
                        }).promise();
                    }
                }

                return viewEngine.createView(viewId);
            }

            return system.defer(function(dfd) {
                dfd.resolve(viewOrUrlOrId);
            }).promise();
        }
    };
});
define('durandal/viewModelBinder', ['durandal/system'],
function (system) {

    var viewModelBinder;
    var insufficientInfoMessage = 'Insufficient Information to Bind';
    var unexpectedViewMessage = 'Unexpected View Type';

    function doBind(obj, view, action) {
        if (!view || !obj) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(insufficientInfoMessage));
            } else {
                system.log(insufficientInfoMessage, view, obj);
            }
            return;
        }

        if (!view.getAttribute) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(unexpectedViewMessage));
            } else {
                system.log(unexpectedViewMessage, view, obj);
            }
            return;
        }

        var viewName = view.getAttribute('data-view');
        
        try {
            viewModelBinder.beforeBind(obj, view);
            action(viewName);
            viewModelBinder.afterBind(obj, view);
        } catch (e) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(e.message + ';\nView: ' + viewName + ";\nModuleId: " + system.getModuleId(obj)));
            } else {
                system.log(e.message, viewName, obj);
            }
        }
    }

    return viewModelBinder = {
        beforeBind: system.noop,
        afterBind: system.noop,
        throwOnErrors: false,
        bindContext: function(bindingContext, view, obj) {
            if (obj) {
                bindingContext = bindingContext.createChildContext(obj);
            }

            doBind(bindingContext, view, function (viewName) {
                if (obj && obj.beforeBind) {
                    obj.beforeBind(view);
                }

                system.log('Binding', viewName, obj || bindingContext);
                ko.applyBindings(bindingContext, view);
                
                if (obj && obj.afterBind) {
                    obj.afterBind(view);
                }
            });
        },
        bind: function(obj, view) {
            doBind(obj, view, function (viewName) {
                if (obj.beforeBind) {
                    obj.beforeBind(view);
                }
                
                system.log('Binding', viewName, obj);
                ko.applyBindings(obj, view);
                
                if (obj.afterBind) {
                    obj.afterBind(view);
                }
            });
        }
    };
});
define('durandal/widget', ['durandal/system', 'durandal/composition'],
function(system, composition) {

    var partAttributeName = 'data-part',
        partAttributeSelector = '[' + partAttributeName + ']';

    var kindModuleMaps = {},
        kindViewMaps = {},
        bindableSettings = ['model', 'view', 'kind'];

    var widget = {
        getParts: function(elements) {
            var parts = {};

            if (!system.isArray(elements)) {
                elements = [elements];
            }

            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                if (element.getAttribute) {
                    var id = element.getAttribute(partAttributeName);
                    if (id) {
                        parts[id] = element;
                    }

                    var childParts = $(partAttributeSelector, element)
                                        .not($('[data-bind^="widget:"] ' + partAttributeSelector, element));

                    for (var j = 0; j < childParts.length; j++) {
                        var part = childParts.get(j);
                        parts[part.getAttribute(partAttributeName)] = part;
                    }
                }
            }

            return parts;
        },
        getSettings: function(valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};

            if (system.isString(value)) {
                return value;
            } else {
                for (var attrName in value) {
                    if (ko.utils.arrayIndexOf(bindableSettings, attrName) != -1) {
                        value[attrName] = ko.utils.unwrapObservable(value[attrName]);
                    } else {
                        value[attrName] = value[attrName];
                    }
                }
            }

            return value;
        },
        registerKind: function(kind) {
            ko.bindingHandlers[kind] = {
                init: function() {
                    return { controlsDescendantBindings: true };
                },
                update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var settings = widget.getSettings(valueAccessor);
                    settings.kind = kind;
                    widget.create(element, settings, bindingContext);
                }
            };

            ko.virtualElements.allowedBindings[kind] = true;
        },
        mapKind: function(kind, viewId, moduleId) {
            if (viewId) {
                kindViewMaps[kind] = viewId;
            }

            if (moduleId) {
                kindModuleMaps[kind] = moduleId;
            }
        },
        mapKindToModuleId: function(kind) {
            return kindModuleMaps[kind] || widget.convertKindToModulePath(kind);
        },
        convertKindToModulePath: function(kind) {
            return 'widgets/' + kind + '/viewmodel';
        },
        mapKindToViewId: function(kind) {
            return kindViewMaps[kind] || widget.convertKindToViewPath(kind);
        },
        convertKindToViewPath: function(kind) {
            return 'widgets/' + kind + '/view';
        },
        beforeBind: function (child, context) {
            var replacementParts = widget.getParts(context.parent);
            var standardParts = widget.getParts(child);

            for (var partId in replacementParts) {
                $(standardParts[partId]).replaceWith(replacementParts[partId]);
            }
        },
        createCompositionSettings: function(element, settings) {
            if (!settings.model) {
                settings.model = this.mapKindToModuleId(settings.kind);
            }

            if (!settings.view) {
                settings.view = this.mapKindToViewId(settings.kind);
            }

            settings.preserveContext = true;
            settings.beforeBind = this.beforeBind;
            settings.activate = true;
            settings.activationData = settings;

            return settings;
        },
        create: function(element, settings, bindingContext) {
            if (system.isString(settings)) {
                settings = { kind: settings };
            }

            var compositionSettings = widget.createCompositionSettings(element, settings);

            composition.compose(element, compositionSettings, bindingContext);
        }
    };

    ko.bindingHandlers.widget = {
        init: function() {
            return { controlsDescendantBindings: true };
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = widget.getSettings(valueAccessor);
            widget.create(element, settings, bindingContext);
        }
    };

    ko.virtualElements.allowedBindings.widget = true;

    return widget;
});

define("durandal/durandal.debug", function(){});

define("durandal/activator",["durandal/system"],function(e){function t(e){return void 0==e&&(e={}),e.closeOnDeactivate||(e.closeOnDeactivate=s.defaults.closeOnDeactivate),e.beforeActivate||(e.beforeActivate=s.defaults.beforeActivate),e.afterDeactivate||(e.afterDeactivate=s.defaults.afterDeactivate),e.interpretResponse||(e.interpretResponse=s.defaults.interpretResponse),e.areSameItem||(e.areSameItem=s.defaults.areSameItem),e}function n(t,n,i){return e.isArray(i)?t[n].apply(t,i):t[n](i)}function i(t,n,i,o,r){if(t&&t.deactivate){e.log("Deactivating",t);var a;try{a=t.deactivate(n)}catch(c){return e.error(c),o.resolve(!1),void 0}a&&a.then?a.then(function(){i.afterDeactivate(t,n,r),o.resolve(!0)},function(t){e.log(t),o.resolve(!1)}):(i.afterDeactivate(t,n,r),o.resolve(!0))}else t&&i.afterDeactivate(t,n,r),o.resolve(!0)}function o(t,i,o,r){if(t)if(t.activate){e.log("Activating",t);var a;try{a=n(t,"activate",r)}catch(c){return e.error(c),o(!1),void 0}a&&a.then?a.then(function(){i(t),o(!0)},function(t){e.log(t),o(!1)}):(i(t),o(!0))}else i(t),o(!0);else o(!0)}function r(t,n,i){return e.defer(function(o){if(t&&t.canDeactivate){var r;try{r=t.canDeactivate(n)}catch(a){return e.error(a),o.resolve(!1),void 0}r.then?r.then(function(e){o.resolve(i.interpretResponse(e))},function(t){e.log(t),o.resolve(!1)}):o.resolve(i.interpretResponse(r))}else o.resolve(!0)}).promise()}function a(t,i,o,r){return e.defer(function(a){if(t==i())return a.resolve(!0),void 0;if(t&&t.canActivate){var c;try{c=n(t,"canActivate",r)}catch(s){return e.error(s),a.resolve(!1),void 0}c.then?c.then(function(e){a.resolve(o.interpretResponse(e))},function(t){e.log(t),a.resolve(!1)}):a.resolve(o.interpretResponse(c))}else a.resolve(!0)}).promise()}function c(n,c){var s=ko.observable(null);c=t(c);var u=ko.computed({read:function(){return s()},write:function(e){u.viaSetter=!0,u.activateItem(e)}});return u.__activator__=!0,u.settings=c,c.activator=u,u.isActivating=ko.observable(!1),u.canDeactivateItem=function(e,t){return r(e,t,c)},u.deactivateItem=function(t,n){return e.defer(function(e){u.canDeactivateItem(t,n).then(function(o){o?i(t,n,c,e,s):(u.notifySubscribers(),e.resolve(!1))})}).promise()},u.canActivateItem=function(e,t){return a(e,s,c,t)},u.activateItem=function(t,n){var r=u.viaSetter;return u.viaSetter=!1,e.defer(function(a){if(u.isActivating())return a.resolve(!1),void 0;u.isActivating(!0);var l=s();return c.areSameItem(l,t,n)?(u.isActivating(!1),a.resolve(!0),void 0):(u.canDeactivateItem(l,c.closeOnDeactivate).then(function(d){d?u.canActivateItem(t,n).then(function(d){d?e.defer(function(e){i(l,c.closeOnDeactivate,c,e)}).promise().then(function(){t=c.beforeActivate(t,n),o(t,s,function(e){u.isActivating(!1),a.resolve(e)},n)}):(r&&u.notifySubscribers(),u.isActivating(!1),a.resolve(!1))}):(r&&u.notifySubscribers(),u.isActivating(!1),a.resolve(!1))}),void 0)}).promise()},u.canActivate=function(){var e;return n?(e=n,n=!1):e=u(),u.canActivateItem(e)},u.activate=function(){var e;return n?(e=n,n=!1):e=u(),u.activateItem(e)},u.canDeactivate=function(e){return u.canDeactivateItem(u(),e)},u.deactivate=function(e){return u.deactivateItem(u(),e)},u.includeIn=function(e){e.canActivate=function(){return u.canActivate()},e.activate=function(){return u.activate()},e.canDeactivate=function(e){return u.canDeactivate(e)},e.deactivate=function(e){return u.deactivate(e)}},c.includeIn?u.includeIn(c.includeIn):n&&u.activate(),u.forItems=function(t){c.closeOnDeactivate=!1,c.determineNextItemToActivate=function(e,t){var n=t-1;return-1==n&&e.length>1?e[1]:n>-1&&n<e.length-1?e[n]:null},c.beforeActivate=function(e){var n=u();if(e){var i=t.indexOf(e);-1==i?t.push(e):e=t()[i]}else e=c.determineNextItemToActivate(t,n?t.indexOf(n):0);return e},c.afterDeactivate=function(e,n){n&&t.remove(e)};var n=u.canDeactivate;u.canDeactivate=function(i){return i?e.defer(function(e){function n(){for(var t=0;t<r.length;t++)if(!r[t])return e.resolve(!1),void 0;e.resolve(!0)}for(var o=t(),r=[],a=0;a<o.length;a++)u.canDeactivateItem(o[a],i).then(function(e){r.push(e),r.length==o.length&&n()})}).promise():n()};var i=u.deactivate;return u.deactivate=function(n){return n?e.defer(function(e){function i(i){u.deactivateItem(i,n).then(function(){r++,t.remove(i),r==a&&e.resolve()})}for(var o=t(),r=0,a=o.length,c=0;a>c;c++)i(o[c])}).promise():i()},u},u}var s;return s={defaults:{closeOnDeactivate:!0,interpretResponse:function(e){if("string"==typeof e){var t=e.toLowerCase();return"yes"==t||"ok"==t}return e},areSameItem:function(e,t){return e==t},beforeActivate:function(e){return e},afterDeactivate:function(e,t,n){t&&n&&n(null)}},create:c}}),define("durandal/app",["durandal/system","durandal/viewEngine","durandal/composition","durandal/widget","durandal/modalDialog","durandal/events"],function(e,t,n,i,o,r){var a={title:"Application",showModal:function(e,t,n){return o.show(e,t,n)},showMessage:function(e,t,n){return o.show("./messageBox",{message:e,title:t||this.title,options:n})},start:function(){var t=this;return t.title&&(document.title=t.title),e.defer(function(t){$(function(){e.log("Starting Application"),t.resolve(),e.log("Started Application")})}).promise()},setRoot:function(i,o,r){var a,c={activate:!0,transition:o};a=!r||e.isString(r)?document.getElementById(r||"applicationHost"):r,e.isString(i)?t.isViewUrl(i)?c.view=i:c.model=i:c.model=i,n.compose(a,c)},adaptToDevice:function(){document.ontouchmove=function(e){e.preventDefault()}}};return r.includeIn(a),a}),define("durandal/composition",["durandal/viewLocator","durandal/viewModelBinder","durandal/viewEngine","durandal/system"],function(e,t,n,i){function o(e){for(var t=[],n={childElements:t,activeView:null},i=ko.virtualElements.firstChild(e);i;)1==i.nodeType&&(t.push(i),i.getAttribute(d)&&(n.activeView=i)),i=ko.virtualElements.nextSibling(i);return n}function r(){if(v--,0===v){for(var e=0;e<f.length;e++)f[e]();f=[]}}function a(e,t){if(e.activate&&e.model&&e.model.activate){var n;n=i.isArray(e.activationData)?e.model.activate.apply(e.model,e.activationData):e.model.activate(e.activationData),n&&n.then?n.then(t):n||void 0===n?t():r()}else t()}function c(){var e=this;e.activeView&&e.activeView.removeAttribute(d),e.child&&(e.model&&e.model.viewAttached&&(e.composingNewView||e.alwaysAttachView)&&e.model.viewAttached(e.child,e),e.child.setAttribute(d,!0),e.composingNewView&&e.model&&(e.model.documentAttached&&u.current.completed(function(){e.model.documentAttached(e.child,e)}),e.model.documentDetached&&u.documentDetached(e.child,function(){e.model.documentDetached(e.child,e)}))),e.afterCompose&&e.afterCompose(e.child,e),e.documentAttached&&u.current.completed(function(){e.documentAttached(e.child,e)}),r(),e.triggerViewAttached=i.noop}function s(e){if(i.isString(e.transition)){if(e.activeView){if(e.activeView==e.child)return!1;if(!e.child)return!0;if(e.skipTransitionOnSameViewId){var t=e.activeView.getAttribute("data-view"),n=e.child.getAttribute("data-view");return t!=n}}return!0}return!1}var u,l={},d="data-active-view",f=[],v=0;return u={convertTransitionToModuleId:function(e){return"transitions/"+e},current:{completed:function(e){f.push(e)}},documentDetached:function(e,t){ko.utils.domNodeDisposal.addDisposeCallback(e,t)},switchContent:function(e){if(e.transition=e.transition||this.defaultTransitionName,s(e)){var t=this.convertTransitionToModuleId(e.transition);i.acquire(t).then(function(t){e.transition=t,t(e).then(function(){e.triggerViewAttached()})})}else e.child!=e.activeView&&(e.cacheViews&&e.activeView&&$(e.activeView).css("display","none"),e.child?e.cacheViews?e.composingNewView?(e.viewElements.push(e.child),ko.virtualElements.prepend(e.parent,e.child)):$(e.child).css("display",""):(ko.virtualElements.emptyNode(e.parent),ko.virtualElements.prepend(e.parent,e.child)):e.cacheViews||ko.virtualElements.emptyNode(e.parent)),e.triggerViewAttached()},bindAndShow:function(e,i){i.child=e,i.composingNewView=i.cacheViews?-1==ko.utils.arrayIndexOf(i.viewElements,e):!0,a(i,function(){if(i.beforeBind&&i.beforeBind(e,i),i.preserveContext&&i.bindingContext)i.composingNewView&&t.bindContext(i.bindingContext,e,i.model);else if(e){var o=i.model||l,r=ko.dataFor(e);if(r!=o){if(!i.composingNewView)return $(e).remove(),n.createView(e.getAttribute("data-view")).then(function(e){u.bindAndShow(e,i)}),void 0;t.bind(o,e)}}u.switchContent(i)})},defaultStrategy:function(t){return e.locateViewForObject(t.model,t.viewElements)},getSettings:function(e){var t,n=e(),o=ko.utils.unwrapObservable(n)||{},r=n&&n.__activator__;if(i.isString(o))return o;if(t=i.getModuleId(o))o={model:o};else{!r&&o.model&&(r=o.model.__activator__);for(var a in o)o[a]=ko.utils.unwrapObservable(o[a])}return r?o.activate=!1:void 0===o.activate&&(o.activate=!0),o},executeStrategy:function(e){e.strategy(e).then(function(t){u.bindAndShow(t,e)})},inject:function(t){return t.model?t.view?(e.locateView(t.view,t.area,t.viewElements).then(function(e){u.bindAndShow(e,t)}),void 0):(t.strategy||(t.strategy=this.defaultStrategy),i.isString(t.strategy)?i.acquire(t.strategy).then(function(e){t.strategy=e,u.executeStrategy(t)}):this.executeStrategy(t),void 0):(this.bindAndShow(null,t),void 0)},compose:function(t,r,a){v++,i.isString(r)&&(r=n.isViewUrl(r)?{view:r}:{model:r,activate:!0});var s=i.getModuleId(r);s&&(r={model:r,activate:!0});var l=o(t);r.activeView=l.activeView,r.parent=t,r.triggerViewAttached=c,r.bindingContext=a,r.cacheViews&&!r.viewElements&&(r.viewElements=l.childElements),r.model?i.isString(r.model)?i.acquire(r.model).then(function(e){r.model=new(i.getObjectResolver(e)),u.inject(r)}):u.inject(r):r.view?(r.area=r.area||"partial",r.preserveContext=!0,e.locateView(r.view,r.area,r.viewElements).then(function(e){u.bindAndShow(e,r)})):this.bindAndShow(null,r)}},ko.bindingHandlers.compose={update:function(e,t,n,i,o){var r=u.getSettings(t);u.compose(e,r,o)}},ko.virtualElements.allowedBindings.compose=!0,u}),define("durandal/events",["durandal/system"],function(e){var t=/\s+/,n=function(){},i=function(e,t){this.owner=e,this.events=t};return i.prototype.then=function(e,t){return this.callback=e||this.callback,this.context=t||this.context,this.callback?(this.owner.on(this.events,this.callback,this.context),this):this},i.prototype.on=i.prototype.then,i.prototype.off=function(){return this.owner.off(this.events,this.callback,this.context),this},n.prototype.on=function(e,n,o){var r,a,c;if(n){for(r=this.callbacks||(this.callbacks={}),e=e.split(t);a=e.shift();)c=r[a]||(r[a]=[]),c.push(n,o);return this}return new i(this,e)},n.prototype.off=function(n,i,o){var r,a,c,s;if(!(a=this.callbacks))return this;if(!(n||i||o))return delete this.callbacks,this;for(n=n?n.split(t):e.keys(a);r=n.shift();)if((c=a[r])&&(i||o))for(s=c.length-2;s>=0;s-=2)i&&c[s]!==i||o&&c[s+1]!==o||c.splice(s,2);else delete a[r];return this},n.prototype.trigger=function(e){var n,i,o,r,a,c,s,u;if(!(i=this.callbacks))return this;for(u=[],e=e.split(t),r=1,a=arguments.length;a>r;r++)u[r-1]=arguments[r];for(;n=e.shift();){if((s=i.all)&&(s=s.slice()),(o=i[n])&&(o=o.slice()),o)for(r=0,a=o.length;a>r;r+=2)o[r].apply(o[r+1]||this,u);if(s)for(c=[n].concat(u),r=0,a=s.length;a>r;r+=2)s[r].apply(s[r+1]||this,c)}return this},n.prototype.proxy=function(e){var t=this;return function(n){t.trigger(e,n)}},n.includeIn=function(e){e.on=n.prototype.on,e.off=n.prototype.off,e.trigger=n.prototype.trigger,e.proxy=n.prototype.proxy},n}),define("durandal/messageBox",["durandal/viewEngine"],function(e){var t=function(e,n,i){this.message=e,this.title=n||t.defaultTitle,this.options=i||t.defaultOptions};return t.prototype.selectOption=function(e){this.modal.close(e)},t.prototype.getView=function(){return e.processMarkup(t.defaultViewMarkup)},t.prototype.activate=function(e){e&&(this.message=e.message,this.title=e.title||t.defaultTitle,this.options=e.options||t.defaultOptions)},t.defaultTitle="Application",t.defaultOptions=["Ok"],t.defaultViewMarkup=['<div class="messageBox">','<div class="modal-header">','<h3 data-bind="text: title"></h3>',"</div>",'<div class="modal-body">','   <p class="message" data-bind="text: message"></p>',"</div>",'<div class="modal-footer" data-bind="foreach: options">','<button class="btn" data-bind="click: function () { $parent.selectOption($data); }, text: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>',"</div>","</div>"].join("\n"),t}),define("durandal/modalDialog",["durandal/composition","durandal/system","durandal/activator"],function(e,t,n){function i(e){return t.defer(function(n){t.isString(e)?t.acquire(e).then(function(e){n.resolve(new(t.getObjectResolver(e)))}):n.resolve(e)}).promise()}var o={},r=0,a={currentZIndex:1050,getNextZIndex:function(){return++this.currentZIndex},isModalOpen:function(){return r>0},getContext:function(e){return o[e||"default"]},addContext:function(e,t){t.name=e,o[e]=t;var n="show"+e.substr(0,1).toUpperCase()+e.substr(1);this[n]=function(t,n){return this.show(t,n,e)}},createCompositionSettings:function(e,t){var n={model:e,activate:!1};return t.documentAttached&&(n.documentAttached=t.documentAttached),n},show:function(a,c,s){var u=this,l=o[s||"default"];return t.defer(function(t){i(a).then(function(i){var o=n.create();o.activateItem(i,c).then(function(n){if(n){var a=i.modal={owner:i,context:l,activator:o,close:function(){var e=arguments;o.deactivateItem(i,!0).then(function(n){n&&(r--,l.removeHost(a),delete i.modal,t.resolve.apply(t,e))})}};a.settings=u.createCompositionSettings(i,l),l.addHost(a),r++,e.compose(a.host,a.settings)}else t.resolve(!1)})})}).promise()}};return a.addContext("default",{blockoutOpacity:.2,removeDelay:200,addHost:function(e){var t=$("body"),n=$('<div class="modalBlockout"></div>').css({"z-index":a.getNextZIndex(),opacity:this.blockoutOpacity}).appendTo(t),i=$('<div class="modalHost"></div>').css({"z-index":a.getNextZIndex()}).appendTo(t);if(e.host=i.get(0),e.blockout=n.get(0),!a.isModalOpen()){e.oldBodyMarginRight=$("body").css("margin-right");var o=$("html"),r=t.outerWidth(!0),c=o.scrollTop();$("html").css("overflow-y","hidden");var s=$("body").outerWidth(!0);t.css("margin-right",s-r+parseInt(e.oldBodyMarginRight)+"px"),o.scrollTop(c)}},removeHost:function(e){if($(e.host).css("opacity",0),$(e.blockout).css("opacity",0),setTimeout(function(){$(e.host).remove(),$(e.blockout).remove()},this.removeDelay),!a.isModalOpen()){var t=$("html"),n=t.scrollTop();t.css("overflow-y","").scrollTop(n),$("body").css("margin-right",e.oldBodyMarginRight)}},documentAttached:function(e,t){var n=$(e),i=n.width(),o=n.height();n.css({"margin-top":(-o/2).toString()+"px","margin-left":(-i/2).toString()+"px"}),$(t.model.modal.host).css("opacity",1),$(e).hasClass("autoclose")&&$(t.model.modal.blockout).click(function(){t.model.modal.close()}),$(".autofocus",e).each(function(){$(this).focus()})}}),a}),define("durandal/system",["require"],function(e){function t(e){var t="[object "+e+"]";n["is"+e]=function(e){return a.call(e)==t}}var n,i=!1,o=Object.keys,r=Object.prototype.hasOwnProperty,a=Object.prototype.toString,c=!1,s=Array.isArray,u=Array.prototype.slice;if(Function.prototype.bind&&("object"==typeof console||"function"==typeof console)&&"object"==typeof console.log)try{["log","info","warn","error","assert","dir","clear","profile","profileEnd"].forEach(function(e){console[e]=this.call(console[e],console)},Function.prototype.bind)}catch(l){c=!0}e.on&&e.on("moduleLoaded",function(e,t){n.setModuleId(e,t)}),"undefined"!=typeof requirejs&&(requirejs.onResourceLoad=function(e,t){n.setModuleId(e.defined[t.id],t.id)});var d=function(){},f=function(){try{if("undefined"!=typeof console&&"function"==typeof console.log)if(window.opera)for(var e=0;e<arguments.length;)console.log("Item "+(e+1)+": "+arguments[e]),e++;else 1==u.call(arguments).length&&"string"==typeof u.call(arguments)[0]?console.log(u.call(arguments).toString()):console.log(u.call(arguments));else Function.prototype.bind&&!c||"undefined"==typeof console||"object"!=typeof console.log||Function.prototype.call.call(console.log,console,u.call(arguments))}catch(t){}},v=function(e){throw e};n={version:"2.0.0",noop:d,getModuleId:function(e){return e?"function"==typeof e?e.prototype.__moduleId__:"string"==typeof e?null:e.__moduleId__:null},setModuleId:function(e,t){return e?"function"==typeof e?(e.prototype.__moduleId__=t,void 0):("string"!=typeof e&&(e.__moduleId__=t),void 0):void 0},getObjectResolver:function(e){return n.isFunction(e)?e:function(){return e}},debug:function(e){return 1!=arguments.length?i:(i=e,i?(this.log=f,this.error=v,this.log("Debug mode enabled.")):(this.log("Debug mode disabled."),this.log=d,this.error=d),void 0)},log:d,error:d,assert:function(e,t){e||n.error(new Error(t||"Assertion failed."))},defer:function(e){return $.Deferred(e)},guid:function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=0|16*Math.random(),n="x"==e?t:8|3&t;return n.toString(16)})},acquire:function(){var t=u.call(arguments,0);return this.defer(function(n){e(t,function(){var e=arguments;setTimeout(function(){n.resolve.apply(n,e)},1)})}).promise()},extend:function(e){for(var t=u.call(arguments,1),n=0;n<t.length;n++){var i=t[n];if(i)for(var o in i)e[o]=i[o]}return e}},n.keys=o||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)r.call(e,n)&&(t[t.length]=n);return t},n.isElement=function(e){return!(!e||1!==e.nodeType)},n.isArray=s||function(e){return"[object Array]"==a.call(e)},n.isObject=function(e){return e===Object(e)},n.isBoolean=function(e){return"boolean"==typeof e};for(var p=["Arguments","Function","String","Number","Date","RegExp"],h=0;h<p.length;h++)t(p[h]);return n}),define("durandal/viewEngine",["durandal/system"],function(e){var t;return t=$.parseHTML?function(e){return $.parseHTML(e)}:function(e){return $(e).get()},{viewExtension:".html",viewPlugin:"text",isViewUrl:function(e){return-1!==e.indexOf(this.viewExtension,e.length-this.viewExtension.length)},convertViewUrlToViewId:function(e){return e.substring(0,e.length-this.viewExtension.length)},convertViewIdToRequirePath:function(e){return this.viewPlugin+"!"+e+this.viewExtension},parseMarkup:t,processMarkup:function(e){var t=this.parseMarkup(e);if(1==t.length)return t[0];for(var n=[],i=0;i<t.length;i++){var o=t[i];if(8!=o.nodeType){if(3==o.nodeType){var r=/\S/.test(o.nodeValue);if(!r)continue}n.push(o)}}return n.length>1?$(n).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0):n[0]},createView:function(t){var n=this,i=this.convertViewIdToRequirePath(t);return e.defer(function(o){e.acquire(i).then(function(e){var i=n.processMarkup(e);i.setAttribute("data-view",t),o.resolve(i)})}).promise()}}}),define("durandal/viewLocator",["durandal/system","durandal/viewEngine"],function(e,t){function n(e,t){for(var n=0;n<e.length;n++){var i=e[n],o=i.getAttribute("data-view");if(o==t)return i}}function i(e){return(e+"").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g,"\\$1")}return{useConvention:function(e,t,n){e=e||"viewmodels",t=t||"views",n=n||t;var o=new RegExp(i(e),"gi");this.convertModuleIdToViewId=function(e){return e.replace(o,t)},this.translateViewIdToArea=function(e,t){return t&&"partial"!=t?n+"/"+t+"/"+e:n+"/"+e}},locateViewForObject:function(t,n){var i;if(t.getView&&(i=t.getView()))return this.locateView(i,null,n);if(t.viewUrl)return this.locateView(t.viewUrl,null,n);var o=e.getModuleId(t);return o?this.locateView(this.convertModuleIdToViewId(o),null,n):this.locateView(this.determineFallbackViewId(t),null,n)},convertModuleIdToViewId:function(e){return e},determineFallbackViewId:function(e){var t=/function (.{1,})\(/,n=t.exec(e.constructor.toString()),i=n&&n.length>1?n[1]:"";return"views/"+i},translateViewIdToArea:function(e){return e},locateView:function(i,o,r){if("string"==typeof i){var a;if(a=t.isViewUrl(i)?t.convertViewUrlToViewId(i):i,o&&(a=this.translateViewIdToArea(a,o)),r){var c=n(r,a);if(c)return e.defer(function(e){e.resolve(c)}).promise()}return t.createView(a)}return e.defer(function(e){e.resolve(i)}).promise()}}}),define("durandal/viewModelBinder",["durandal/system"],function(e){function t(t,r,a){if(!r||!t)return n.throwOnErrors?e.error(new Error(i)):e.log(i,r,t),void 0;if(!r.getAttribute)return n.throwOnErrors?e.error(new Error(o)):e.log(o,r,t),void 0;var c=r.getAttribute("data-view");try{n.beforeBind(t,r),a(c),n.afterBind(t,r)}catch(s){n.throwOnErrors?e.error(new Error(s.message+";\nView: "+c+";\nModuleId: "+e.getModuleId(t))):e.log(s.message,c,t)}}var n,i="Insufficient Information to Bind",o="Unexpected View Type";return n={beforeBind:e.noop,afterBind:e.noop,throwOnErrors:!1,bindContext:function(n,i,o){o&&(n=n.createChildContext(o)),t(n,i,function(t){o&&o.beforeBind&&o.beforeBind(i),e.log("Binding",t,o||n),ko.applyBindings(n,i),o&&o.afterBind&&o.afterBind(i)})},bind:function(n,i){t(n,i,function(t){n.beforeBind&&n.beforeBind(i),e.log("Binding",t,n),ko.applyBindings(n,i),n.afterBind&&n.afterBind(i)})}}}),define("durandal/widget",["durandal/system","durandal/composition"],function(e,t){var n="data-part",i="["+n+"]",o={},r={},a=["model","view","kind"],c={getParts:function(t){var o={};e.isArray(t)||(t=[t]);for(var r=0;r<t.length;r++){var a=t[r];if(a.getAttribute){var c=a.getAttribute(n);c&&(o[c]=a);for(var s=$(i,a).not($('[data-bind^="widget:"] '+i,a)),u=0;u<s.length;u++){var l=s.get(u);o[l.getAttribute(n)]=l}}}return o},getSettings:function(t){var n=ko.utils.unwrapObservable(t())||{};if(e.isString(n))return n;for(var i in n)n[i]=-1!=ko.utils.arrayIndexOf(a,i)?ko.utils.unwrapObservable(n[i]):n[i];return n},registerKind:function(e){ko.bindingHandlers[e]={init:function(){return{controlsDescendantBindings:!0}},update:function(t,n,i,o,r){var a=c.getSettings(n);a.kind=e,c.create(t,a,r)}},ko.virtualElements.allowedBindings[e]=!0},mapKind:function(e,t,n){t&&(r[e]=t),n&&(o[e]=n)},mapKindToModuleId:function(e){return o[e]||c.convertKindToModulePath(e)},convertKindToModulePath:function(e){return"widgets/"+e+"/viewmodel"},mapKindToViewId:function(e){return r[e]||c.convertKindToViewPath(e)},convertKindToViewPath:function(e){return"widgets/"+e+"/view"},beforeBind:function(e,t){var n=c.getParts(t.parent),i=c.getParts(e);for(var o in n)$(i[o]).replaceWith(n[o])},createCompositionSettings:function(e,t){return t.model||(t.model=this.mapKindToModuleId(t.kind)),t.view||(t.view=this.mapKindToViewId(t.kind)),t.preserveContext=!0,t.beforeBind=this.beforeBind,t.activate=!0,t.activationData=t,t},create:function(n,i,o){e.isString(i)&&(i={kind:i});var r=c.createCompositionSettings(n,i);t.compose(n,r,o)}};return ko.bindingHandlers.widget={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,i,o){var r=c.getSettings(t);c.create(e,r,o)}},ko.virtualElements.allowedBindings.widget=!0,c});
define("durandal/durandal", function(){});

define('plugins/history', ['durandal/system'],
function (system) {

    // Handles cross-browser history management, based on either
    // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
    // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    // and URL fragments. If the browser supports neither (old IE, natch),
    // falls back to polling.
    
    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    function updateHash(location, fragment, replace) {
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        } else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    };

    var history = {
        interval: 50,
        active: false
    };
    
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
        history.location = window.location;
        history.history = window.history;
    }
    
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    history.getHash = function(window) {
        var match = (window || history).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    };
    
    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    history.getFragment = function(fragment, forcePushState) {
        if (fragment == null) {
            if (history._hasPushState || !history._wantsHashChange || forcePushState) {
                fragment = history.location.pathname;
                var root = history.root.replace(trailingSlash, '');
                if (!fragment.indexOf(root)) {
                    fragment = fragment.substr(root.length);
                }
            } else {
                fragment = history.getHash();
            }
        }
        
        return fragment.replace(routeStripper, '');
    };

    // Activate the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    history.activate = function(options) {
        if (history.active) {
            throw new Error("History has already been activated.");
        }

        history.active = true;

        // Figure out the initial configuration. Do we need an iframe?
        // Is pushState desired ... is it available?
        history.options = system.extend({}, { root: '/' }, history.options, options);
        history.root = history.options.root;
        history._wantsHashChange = history.options.hashChange !== false;
        history._wantsPushState = !!history.options.pushState;
        history._hasPushState = !!(history.options.pushState && history.history && history.history.pushState);

        var fragment = history.getFragment();
        var docMode = document.documentMode;
        var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

        // Normalize root to always include a leading and trailing slash.
        history.root = ('/' + history.root + '/').replace(rootStripper, '/');

        if (oldIE && history._wantsHashChange) {
            history.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
            history.navigate(fragment);
        }

        // Depending on whether we're using pushState or hashes, and whether
        // 'onhashchange' is supported, determine how we check the URL state.
        if (history._hasPushState) {
            $(window).on('popstate', history.checkUrl);
        } else if (history._wantsHashChange && ('onhashchange' in window) && !oldIE) {
            $(window).on('hashchange', history.checkUrl);
        } else if (history._wantsHashChange) {
            history._checkUrlInterval = setInterval(history.checkUrl, history.interval);
        }

        // Determine if we need to change the base url, for a pushState link
        // opened by a non-pushState browser.
        history.fragment = fragment;
        var loc = history.location;
        var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === history.root;

        // If we've started off with a route from a `pushState`-enabled browser,
        // but we're currently in a browser that doesn't support it...
        if (history._wantsHashChange && history._wantsPushState && !history._hasPushState && !atRoot) {
            history.fragment = history.getFragment(null, true);
            history.location.replace(history.root + history.location.search + '#' + history.fragment);
            // Return immediately as browser will do redirect to new url
            return true;

            // Or if we've started out with a hash-based route, but we're currently
            // in a browser where it could be `pushState`-based instead...
        } else if (history._wantsPushState && history._hasPushState && atRoot && loc.hash) {
            history.fragment = history.getHash().replace(routeStripper, '');
            history.history.replaceState({}, document.title, history.root + history.fragment + loc.search);
        }

        if (!history.options.silent) {
            return history.loadUrl();
        }
    };
    
    // Disable history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    history.deactivate = function() {
        $(window).off('popstate', history.checkUrl).off('hashchange', history.checkUrl);
        clearInterval(history._checkUrlInterval);
        history.active = false;
    };
    
    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    history.checkUrl = function(e) {
        var current = history.getFragment();
        if (current === history.fragment && history.iframe) {
            current = history.getFragment(history.getHash(history.iframe));
        }

        if (current === history.fragment) {
            return false;
        }

        if (history.iframe) {
            history.navigate(current);
        }
        
        history.loadUrl() || history.loadUrl(history.getHash());
    };
    
    // Attempt to load the current URL fragment. Pass it to options.routeHandler
    history.loadUrl = function(fragmentOverride) {
        var fragment = history.fragment = history.getFragment(fragmentOverride);

        return history.options.routeHandler ?
            history.options.routeHandler(fragment) :
            false;
    };
    
    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    history.navigate = function(fragment, options) {
        if (!history.active) {
            return false;
        }

        if (!options || options === true) {
            options = { trigger: options };
        }

        fragment = history.getFragment(fragment || '');

        if (history.fragment === fragment) {
            return;
        }

        history.fragment = fragment;
        var url = history.root + fragment;

        // If pushState is available, we use it to set the fragment as a real URL.
        if (history._hasPushState) {
            history.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

            // If hash changes haven't been explicitly disabled, update the hash
            // fragment to store history.
        } else if (history._wantsHashChange) {
            updateHash(history.location, fragment, options.replace);
            
            if (history.iframe && (fragment !== history.getFragment(history.getHash(history.iframe)))) {
                // Opening and closing the iframe tricks IE7 and earlier to push a
                // history entry on hash-tag change.  When replace is true, we don't
                // want history.
                if (!options.replace) {
                    history.iframe.document.open().close();
                }
                
                updateHash(history.iframe.location, fragment, options.replace);
            }

            // If you've told us that you explicitly don't want fallback hashchange-
            // based history, then `navigate` becomes a page refresh.
        } else {
            return history.location.assign(url);
        }

        if (options.trigger) {
            return history.loadUrl(fragment);
        }
    };

    return history;
});

define("plugins/history.debug", function(){});

define('plugins/http',
[],function() {

    return {
        callbackParam:'callback',
        get:function(url, query) {
            return $.ajax(url, { data: query });
        },
        jsonp: function (url, query, callbackParam) {
            if (url.indexOf('=?') == -1) {
                callbackParam = callbackParam || this.callbackParam;

                if (url.indexOf('?') == -1) {
                    url += '?';
                } else {
                    url += '&';
                }

                url += callbackParam + '=?';
            }

            return $.ajax({
                url: url,
                dataType:'jsonp',
                data:query
            });
        },
        post:function(url, data) {
            return $.ajax({
                url: url,
                data: ko.toJSON(data),
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json'
            });
        }
    };
});

define("plugins/http.debug", function(){});

define('plugins/observable', ['durandal/system', 'durandal/viewModelBinder'],
function(system, viewModelBinder) {

    var nonObservableTypes = ['[object Function]', '[object String]', '[object Boolean]', '[object Number]', '[object Date]', '[object RegExp]'];
    var ignoredProperties = ['__moduleId__', '__observable__'];
    var toString = Object.prototype.toString;
    var observableArrayMethods = ["remove", "removeAll", "destroy", "destroyAll", "replace"];
    var arrayMethods = ["pop", "reverse", "shift", "sort", "splice", "unshift"];
    var arrayProto = Array.prototype;
    var observableArrayFunctions = ko.observableArray.fn;

    function canConvert(value) {
        if (!value || system.isElement(value) || value.ko === ko) {
            return false;
        }

        var type = toString.call(value);

        return nonObservableTypes.indexOf(type) == -1 && !(value === true || value === false);
    }

    function isConverted(obj) {
        return obj && obj.__observable__;
    }

    function makeObservableArray(original, observable, deep) {
        original.__observable__ = true;

        observableArrayMethods.forEach(function(methodName) {
            original[methodName] = observableArrayFunctions[methodName].bind(observable);
        });

        arrayMethods.forEach(function(methodName) {
            original[methodName] = function() {
                observable.valueWillMutate();
                var methodCallResult = arrayProto[methodName].apply(original, arguments);
                observable.valueHasMutated();
                return methodCallResult;
            };
        });

        original['push'] = function() {
            if (deep) {
                for(var i = 0; i < arguments.length; i++) {
                    convert(arguments[i], true);
                }
            }

            observable.valueWillMutate();
            var methodCallResult = arrayProto['push'].apply(original, arguments);
            observable.valueHasMutated();
            return methodCallResult;
        };

        if (deep) {
            for (var i = 0; i < original.length; i++) {
                convert(original[i], true);
            }
        }
    }

    function convert(original, deep) {
        if (isConverted(original) || !canConvert(original)) {
            return;
        }

        original.__observable__ = true;

        if (system.isArray(original)) {
            var observable = ko.observableArray(original);
            makeObservableArray(original, observable, deep);
        } else {
            for (var prop in original) {
                convertProperty(original, prop, deep);
            }
        }

        system.log('Converted', original);
    }

    function convertProperty(obj, property, deep) {
        var observable,
            isArray,
            original = obj[property];

        if (ignoredProperties.indexOf(property) != -1) {
            return;
        }

        if (system.isArray(original)) {
            observable = ko.observableArray(original);
            isArray = true;
            makeObservableArray(original, observable, deep);
        } else if (typeof original == "function") {
            return;
        } else {
            observable = ko.observable(original);

            if (deep) {
                convert(original, true);
            }
        }

        //observables are already set up to act getters/setters
        //this actually redefines the existing property on the object that was provided
        Object.defineProperty(obj, property, {
            get: observable,
            set: function(newValue) {
                var val;
                observable(newValue);
                val = observable.peek();

                //if this was originally an observableArray, then always check to see if we need to add/replace the array methods (if newValue was an entirely new array)
                if (isArray) {
                    if (!val.destroyAll) {
                        //don't allow null, force to an empty array
                        if (!val) {
                            val = [];
                            observable(val);
                        }

                        makeObservableArray(val, observable, deep);
                    }
                } else if (deep) {
                    convert(val, true);
                }
            }
        });
    }

    return {
        convertProperty: convertProperty,
        convert: convert,
        isConverted: isConverted,
        getObservable: function(obj, property) {
            //            var desc = Object.getOwnPropertyDescriptor(obj, property);

            //            console.log('observable:' + ko.isObservable(desc.get));
            //            console.log('computed:' + ko.isComputed(desc.get));
            //            console.log('supports subscribe:' + (desc.get.subscribe != undefined).toString());
        },
        install: function() {
            viewModelBinder.beforeBind = function(obj, view) {
                convert(obj, true);
            };
        }
    };
});

define("plugins/observable.debug", function(){});

define('plugins/router', ['durandal/system', 'durandal/app', 'durandal/activator', 'durandal/events', 'plugins/history'],
function(system, app, activator, events, history) {

    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    var startDeferred, rootRouter;

    function routeStringToRegExp(routeString) {
        routeString = routeString.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^\/]+)';
            })
            .replace(splatParam, '(.*?)');

        return new RegExp('^' + routeString + '$');
    }

    function stripParametersFromRoute(route) {
        var colonIndex = route.indexOf(':');
        var length = colonIndex > 0 ? colonIndex - 1 : route.length;
        return route.substring(0, length);
    }

    function hasChildRouter(instance) {
        return instance.router && instance.router.loadUrl;
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    var createRouter = function() {
        var queue = [],
            isProcessing = ko.observable(false),
            currentActivation,
            currentInstruction,
            activeItem = activator.create();

        var router = {
            handlers: [],
            routes: [],
            navigationModel: ko.observableArray([]),
            activeItem: activeItem,
            isNavigating: ko.computed(function() {
                var current = activeItem();
                return isProcessing() || (current && current.router && current.router.isNavigating());
            })
        };

        events.includeIn(router);

        function completeNavigation(instance, instruction) {
            system.log('Navigation Complete', instance, instruction);

            if (currentActivation && currentActivation.__moduleId__) {
                router.trigger('router:navigatedFrom:' + currentActivation.__moduleId__);
            }

            currentActivation = instance;
            currentInstruction = instruction;

            if (currentActivation && currentActivation.__moduleId__) {
                router.trigger('router:navigatedTo:' + currentActivation.__moduleId__);
            }

            if (!hasChildRouter(instance)) {
                router.updateDocumentTitle(instance, instruction);
            }

            router.trigger('router:navigation:complete', instance, instruction, router);
        }

        function cancelNavigation(instance, instruction) {
            system.log('Navigation Cancelled');

            if (currentInstruction) {
                router.navigate(currentInstruction.fragment, { trigger: false });
            }

            isProcessing(false);
            router.trigger('router:navigation:cancelled', instance, instruction, router);
        }

        function redirect(url) {
            system.log('Navigation Redirecting');

            isProcessing(false);
            router.navigate(url, { trigger: true, replace: true });
        }

        function activateRoute(activator, instance, instruction) {
            activator.activateItem(instance, instruction.params).then(function(succeeded) {
                if (succeeded) {
                    var previousActivation = currentActivation;
                    completeNavigation(instance, instruction);

                    if (hasChildRouter(instance)) {
                        queueInstruction({
                            router: instance.router,
                            fragment: instruction.fragment,
                            queryString: instruction.queryString
                        });
                    }

                    if (previousActivation == instance) {
                        router.afterCompose();
                    }
                } else {
                    cancelNavigation(instance, instruction);
                }

                if (startDeferred) {
                    startDeferred.resolve();
                    startDeferred = null;
                }
            });
        }

        function handleGuardedRoute(activator, instance, instruction) {
            var resultOrPromise = router.guardRoute(instance, instruction);
            if (resultOrPromise) {
                if (resultOrPromise.then) {
                    resultOrPromise.then(function(result) {
                        if (result) {
                            if (system.isString(result)) {
                                redirect(result);
                            } else {
                                activateRoute(activator, instance, instruction);
                            }
                        } else {
                            cancelNavigation(instance, instruction);
                        }
                    });
                } else {
                    if (system.isString(resultOrPromise)) {
                        redirect(resultOrPromise);
                    } else {
                        activateRoute(activator, instance, instruction);
                    }
                }
            } else {
                cancelNavigation(instance, instruction);
            }
        }

        function ensureActivation(activator, instance, instruction) {
            if (router.guardRoute) {
                handleGuardedRoute(activator, instance, instruction);
            } else {
                activateRoute(activator, instance, instruction);
            }
        }

        function canReuseCurrentActivation(instruction) {
            return currentInstruction
                && currentInstruction.config.moduleId == instruction.config.moduleId
                && currentActivation
                && ((currentActivation.canReuseForRoute && currentActivation.canReuseForRoute.apply(currentActivation, instruction.params))
                    || (currentActivation.router && currentActivation.router.loadUrl));
        }

        function dequeueInstruction() {
            if (isProcessing()) {
                return;
            }

            var instruction = queue.shift();
            queue = [];

            if (!instruction) {
                return;
            }

            if (instruction.router) {
                var fullFragment = instruction.fragment;
                if (instruction.queryString) {
                    fullFragment += "?" + instruction.queryString;
                }
                
                instruction.router.loadUrl(fullFragment);
                return;
            }

            isProcessing(true);

            if (canReuseCurrentActivation(instruction)) {
                ensureActivation(activator.create(), currentActivation, instruction);
            } else {
                system.acquire(instruction.config.moduleId).then(function(module) {
                    var instance = new (system.getObjectResolver(module))();
                    ensureActivation(activeItem, instance, instruction);
                });
            }
        }

        function queueInstruction(instruction) {
            queue.unshift(instruction);
            dequeueInstruction();
        }
        
        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        function createParams(routePattern, fragment, queryString) {
            var params = routePattern.exec(fragment).slice(1);

            for (var i = 0; i < params.length; i++) {
                var current = params[i];
                params[i] = current ? decodeURIComponent(current) : null;
            }

            var queryObject = router.parseQueryString(queryString);
            if (queryObject) {
                params.push(queryObject);
            }

            return params;
        }

        function mapRoute(config) {
            router.trigger('router:route:before-config', config, router);

            if (!system.isRegExp(config.route)) {
                config.title = config.title || router.convertRouteToTitle(config.route);
                config.moduleId = config.moduleId || router.convertRouteToModuleId(config.route);
                config.hash = config.hash || router.convertRouteToHash(config.route);
                config.routePattern = routeStringToRegExp(config.route);
            }else{
                config.routePattern = config.route;
            }

            router.trigger('router:route:after-config', config, router);

            router.routes.push(config);

            router.route(config.routePattern, function(fragment, queryString) {
                queueInstruction({
                    fragment: fragment,
                    queryString:queryString,
                    config: config,
                    params: createParams(config.routePattern, fragment, queryString)
                });
            });

            return router;
        }

        function addActiveFlag(config) {
            config.isActive = ko.computed(function() {
                return activeItem() && activeItem().__moduleId__ == config.moduleId;
            });
        }

        router.parseQueryString = function (queryString) {
            var queryObject, pairs;

            if (!queryString) {
                return null;
            }
            
            pairs = queryString.split('&');

            if (pairs.length == 0) {
                return null;
            }

            queryObject = {};

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                if (pair === '') {
                    continue;
                }

                var parts = pair.split('=');
                queryObject[parts[0]] = parts[1] && decodeURIComponent(parts[1].replace(/\+/g, ' '));
            }

            return queryObject;
        };

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        router.route = function(routePattern, callback) {
            router.handlers.push({ routePattern: routePattern, callback: callback });
        };

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        router.loadUrl = function(fragment) {
            var handlers = router.handlers,
                queryString = null,
                coreFragment = fragment,
                queryIndex = fragment.indexOf('?');

            if (queryIndex != -1) {
                coreFragment = fragment.substring(0, queryIndex);
                queryString = fragment.substr(queryIndex + 1);
            }

            for (var i = 0; i < handlers.length; i++) {
                var current = handlers[i];
                if (current.routePattern.test(coreFragment)) {
                    current.callback(coreFragment, queryString);
                    return true;
                }
            }

            return false;
        };

        router.updateDocumentTitle = function(instance, instruction) {
            if (instruction.config.title) {
                if (app.title) {
                    document.title = instruction.config.title + " | " + app.title;
                } else {
                    document.title = instruction.config.title;
                }
            } else if (app.title) {
                document.title = app.title;
            }
        };

        router.navigate = function(fragment, options) {
            history.navigate(fragment, options);
        };

        router.navigateBack = function() {
            history.history.back();
        };

        router.afterCompose = function() {
            setTimeout(function() {
                isProcessing(false);
                router.trigger('router:navigation:composed', currentActivation, currentInstruction, router);
                dequeueInstruction();
            }, 10);
        };

        router.convertRouteToHash = function(route) {
            return "#" + route;
        };

        router.convertRouteToModuleId = function(route) {
            return stripParametersFromRoute(route);
        };

        router.convertRouteToTitle = function(route) {
            var value = stripParametersFromRoute(route);
            return value.substring(0, 1).toUpperCase() + value.substring(1);
        };

        // Manually bind a single named route to a module. For example:
        //
        //     router.map('search/:query/p:num', 'viewmodels/search');
        //
        router.map = function(route, config) {
            if (system.isArray(route)) {
                for (var i = 0; i < route.length; i++) {
                    router.map(route[i]);
                }

                return router;
            }

            if (system.isString(route) || system.isRegExp(route)) {
                if (!config) {
                    config = {};
                } else if (system.isString(config)) {
                    config = { moduleId: config };
                }

                config.route = route;
            } else {
                config = route;
            }

            return mapRoute(config);
        };

        router.buildNavigationModel = function(defaultOrder) {
            var nav = [], routes = router.routes;
            defaultOrder = defaultOrder || 100;

            for (var i = 0; i < routes.length; i++) {
                var current = routes[i];

                if (current.nav) {
                    if (!system.isNumber(current.nav)) {
                        current.nav = defaultOrder;
                    }

                    addActiveFlag(current);
                    nav.push(current);
                }
            }

            nav.sort(function(a, b) { return a.nav - b.nav; });
            router.navigationModel(nav);

            return router;
        };

        router.mapUnknownRoutes = function(config) {
            var route = "*catchall";
            var routePattern = routeStringToRegExp(route);
            
            router.route(routePattern, function (fragment, queryString) {
                var instruction = {
                    fragment: fragment,
                    queryString: queryString,
                    config: {
                        route: route,
                        routePattern: routePattern
                    },
                    params: createParams(routePattern, fragment, queryString)
                };

                if (!config) {
                    instruction.config.moduleId = fragment;
                } else if (system.isString(config)) {
                    instruction.config.moduleId = config;
                } else if (system.isFunction(config)) {
                    var result = config(instruction);
                    if (result && result.then) {
                        result.then(function() {
                            router.trigger('router:route:before-config', instruction.config, router);
                            router.trigger('router:route:after-config', instruction.config, router);
                            queueInstruction(instruction);
                        });
                        return;
                    }
                } else {
                    instruction.config = config;
                    instruction.config.route = route;
                    instruction.config.routePattern = routePattern;
                }

                router.trigger('router:route:before-config', instruction.config, router);
                router.trigger('router:route:after-config', instruction.config, router);
                queueInstruction(instruction);
            });

            return router;
        };

        router.reset = function() {
            router.handlers = [];
            router.routes = [];
            delete router.options;
        };

        router.makeRelative = function(settings){
            if(system.isString(settings)){
                settings = {
                    moduleId:settings,
                    route:settings
                };
            }

            if(settings.moduleId && !endsWith(settings.moduleId, '/')){
                settings.moduleId += '/';
            }

            if(settings.route && !endsWith(settings.route, '/')){
                settings.route += '/';
            }

            this.on('router:route:before-config').then(function(config){
                if(settings.moduleId){
                    config.moduleId = settings.moduleId + config.moduleId;
                }

                if(settings.route){
                    if(config.route === ''){
                        config.route = settings.route.substring(0, settings.route.length - 1);
                    }else{
                        config.route = settings.route + config.route;
                    }
                }
            });

            return this;
        };

        router.createChildRouter = function() {
            var childRouter = createRouter();
            childRouter.parent = router;
            return childRouter;
        };

        return router;
    };

    rootRouter = createRouter();

    rootRouter.activate = function(options) {
        return system.defer(function(dfd) {
            startDeferred = dfd;
            rootRouter.options = system.extend({ routeHandler: rootRouter.loadUrl }, rootRouter.options, options);
            history.activate(rootRouter.options);
        }).promise();
    };

    rootRouter.deactivate = function() {
        history.deactivate();
    };

    return rootRouter;
});

define("plugins/router.debug", function(){});

define('plugins/serializer', ['durandal/system'],
function(system) {

    return {
        typeAttribute: 'type',
        space:undefined,
        replacer: function(key, value) {
            if(key){
                var first = key[0];
                if(first === '_' || first === '$'){
                    return undefined;
                }
            }

            return value;
        },
        serialize: function(object, settings) {
            settings = (settings === undefined) ? {} : settings;

            if(system.isString(settings)){
                settings = { space:settings }
            }

            return JSON.stringify(object, settings.replacer || this.replacer, settings.space || this.space);
        },
        getTypeId: function(object) {
            if (object) {
                return object[this.typeAttribute];
            }

            return undefined;
        },
        typeMap: {},
        registerType: function() {
            var first = arguments[0];

            if (arguments.length == 1) {
                var id = first[this.typeAttribute] || system.getModuleId(first);
                this.typeMap[id] = first;
            } else {
                this.typeMap[first] = arguments[1];
            }
        },
        reviver: function(key, value, getTypeId, typeMap) {
            var typeId = getTypeId(value);
            if (typeId) {
                var registered = typeMap[typeId];
                if (registered) {
                    if (registered.fromJSON) {
                        return registered.fromJSON(value);
                    }

                    return new registered(value);
                }
            }

            return value;
        },
        deserialize: function(string, settings) {
            var that = this;
            settings = settings || {};

            var getTypeId = settings.getTypeId || function(object) { return that.getTypeId(object); };
            var typeMap = settings.typeMap || that.typeMap;
            var reviver = settings.reviver || function(key, value) { return that.reviver(key, value, getTypeId, typeMap); };

            return JSON.parse(string, reviver);
        }
    };
});

define("plugins/serializer.debug", function(){});

/**
 * Durandal 2.0.0 Copyright (c) 2012 Blue Spire Consulting, Inc. All Rights Reserved.
 * Available via the MIT license.
 * see: http://durandaljs.com or https://github.com/BlueSpire/Durandal for details.
 */
/**
 * Layers the widget sugar on top of the composition system.
 * @module widget
 * @requires system
 * @requires composition
 * @requires jquery
 * @requires knockout
 */
define('plugins/widget',['durandal/system', 'durandal/composition', 'jquery', 'knockout'], function(system, composition, $, ko) {
    var kindModuleMaps = {},
        kindViewMaps = {},
        bindableSettings = ['model', 'view', 'kind'],
        widgetDataKey = 'durandal-widget-data';

    function extractParts(element, settings){
        var data = ko.utils.domData.get(element, widgetDataKey);

        if(!data){
            data = {
                parts:composition.cloneNodes(ko.virtualElements.childNodes(element))
            };

            ko.virtualElements.emptyNode(element);
            ko.utils.domData.set(element, widgetDataKey, data);
        }

        settings.parts = data.parts;
    }

    /**
     * @class WidgetModule
     * @static
     */
    var widget = {
        getSettings: function(valueAccessor) {
            var settings = ko.utils.unwrapObservable(valueAccessor()) || {};

            if (system.isString(settings)) {
                return { kind: settings };
            }

            for (var attrName in settings) {
                if (ko.utils.arrayIndexOf(bindableSettings, attrName) != -1) {
                    settings[attrName] = ko.utils.unwrapObservable(settings[attrName]);
                } else {
                    settings[attrName] = settings[attrName];
                }
            }

            return settings;
        },
        /**
         * Creates a ko binding handler for the specified kind.
         * @method registerKind
         * @param {string} kind The kind to create a custom binding handler for.
         */
        registerKind: function(kind) {
            ko.bindingHandlers[kind] = {
                init: function() {
                    return { controlsDescendantBindings: true };
                },
                update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var settings = widget.getSettings(valueAccessor);
                    settings.kind = kind;
                    extractParts(element, settings);
                    widget.create(element, settings, bindingContext, true);
                }
            };

            ko.virtualElements.allowedBindings[kind] = true;
        },
        /**
         * Maps views and module to the kind identifier if a non-standard pattern is desired.
         * @method mapKind
         * @param {string} kind The kind name.
         * @param {string} [viewId] The unconventional view id to map the kind to.
         * @param {string} [moduleId] The unconventional module id to map the kind to.
         */
        mapKind: function(kind, viewId, moduleId) {
            if (viewId) {
                kindViewMaps[kind] = viewId;
            }

            if (moduleId) {
                kindModuleMaps[kind] = moduleId;
            }
        },
        /**
         * Maps a kind name to it's module id. First it looks up a custom mapped kind, then falls back to `convertKindToModulePath`.
         * @method mapKindToModuleId
         * @param {string} kind The kind name.
         * @return {string} The module id.
         */
        mapKindToModuleId: function(kind) {
            return kindModuleMaps[kind] || widget.convertKindToModulePath(kind);
        },
        /**
         * Converts a kind name to it's module path. Used to conventionally map kinds who aren't explicitly mapped through `mapKind`.
         * @method convertKindToModulePath
         * @param {string} kind The kind name.
         * @return {string} The module path.
         */
        convertKindToModulePath: function(kind) {
            return 'widgets/' + kind + '/viewmodel';
        },
        /**
         * Maps a kind name to it's view id. First it looks up a custom mapped kind, then falls back to `convertKindToViewPath`.
         * @method mapKindToViewId
         * @param {string} kind The kind name.
         * @return {string} The view id.
         */
        mapKindToViewId: function(kind) {
            return kindViewMaps[kind] || widget.convertKindToViewPath(kind);
        },
        /**
         * Converts a kind name to it's view id. Used to conventionally map kinds who aren't explicitly mapped through `mapKind`.
         * @method convertKindToViewPath
         * @param {string} kind The kind name.
         * @return {string} The view id.
         */
        convertKindToViewPath: function(kind) {
            return 'widgets/' + kind + '/view';
        },
        createCompositionSettings: function(element, settings) {
            if (!settings.model) {
                settings.model = this.mapKindToModuleId(settings.kind);
            }

            if (!settings.view) {
                settings.view = this.mapKindToViewId(settings.kind);
            }

            settings.preserveContext = true;
            settings.activate = true;
            settings.activationData = settings;
            settings.mode = 'templated';

            return settings;
        },
        /**
         * Creates a widget.
         * @method create
         * @param {DOMElement} element The DOMElement or knockout virtual element that serves as the target element for the widget.
         * @param {object} settings The widget settings.
         * @param {object} [bindingContext] The current binding context.
         */
        create: function(element, settings, bindingContext, fromBinding) {
            if(!fromBinding){
                settings = widget.getSettings(function() { return settings; }, element);
            }

            var compositionSettings = widget.createCompositionSettings(element, settings);

            composition.compose(element, compositionSettings, bindingContext);
        },
        /**
         * Installs the widget module by adding the widget binding handler and optionally registering kinds.
         * @method install
         * @param {object} config The module config. Add a `kinds` array with the names of widgets to automatically register. You can also specify a `bindingName` if you wish to use another name for the widget binding, such as "control" for example.
         */
        install:function(config){
            config.bindingName = config.bindingName || 'widget';

            if(config.kinds){
                var toRegister = config.kinds;

                for(var i = 0; i < toRegister.length; i++){
                    widget.registerKind(toRegister[i]);
                }
            }

            ko.bindingHandlers[config.bindingName] = {
                init: function() {
                    return { controlsDescendantBindings: true };
                },
                update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var settings = widget.getSettings(valueAccessor);
                    extractParts(element, settings);
                    widget.create(element, settings, bindingContext, true);
                }
            };

            ko.virtualElements.allowedBindings[config.bindingName] = true;
        }
    };

    return widget;
});

define('transitions/entrance', ['durandal/system'],
function(system) {

    var fadeOutDuration = 100;
    var endValues = {
        marginRight: 0,
        marginLeft: 0,
        opacity: 1
    };
    var clearValues = {
        marginLeft: '',
        marginRight: '',
        opacity: '',
        display: ''
    };

    var entrance = function(context) {
        return system.defer(function(dfd) {
            function endTransition() {
                dfd.resolve();
            }

            function scrollIfNeeded() {
                if (!context.keepScrollPosition) {
                    $(document).scrollTop(0);
                }
            }

            if (!context.child) {
                scrollIfNeeded();

                if (context.activeView) {
                    $(context.activeView).fadeOut(fadeOutDuration, function () {
                        if (!context.cacheViews) {
                            ko.virtualElements.emptyNode(context.parent);
                        }
                        endTransition();
                    });
                } else {
                    if (!context.cacheViews) {
                        ko.virtualElements.emptyNode(context.parent);
                    }
                    endTransition();
                }
            } else {
                var $previousView = $(context.activeView);
                var duration = context.duration || 500;
                var fadeOnly = !!context.fadeOnly;

                function startTransition() {
                    scrollIfNeeded();

                    if (context.cacheViews) {
                        if (context.composingNewView) {
                            ko.virtualElements.prepend(context.parent, context.child);
                        }
                    } else {
                        ko.virtualElements.emptyNode(context.parent);
                        ko.virtualElements.prepend(context.parent, context.child);
                    }

                    context.triggerViewAttached();

                    var startValues = {
                        marginLeft: fadeOnly ? '0' : '20px',
                        marginRight: fadeOnly ? '0' : '-20px',
                        opacity: 0,
                        display: 'block'
                    };

                    var $child = $(context.child);

                    $child.css(startValues);
                    $child.animate(endValues, duration, 'swing', function () {
                        $child.css(clearValues);
                        endTransition();
                    });
                }

                if ($previousView.length) {
                    $previousView.fadeOut(fadeOutDuration, startTransition);
                } else {
                    startTransition();
                }
            }
        }).promise();
    };

    return entrance;
});

define("transitions/entrance.debug", function(){});
