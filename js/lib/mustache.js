/*! jQuery Mustache - v0.2.8 - 2013-06-23
* https://github.com/jonnyreeves/jquery-Mustache
* Copyright (c) 2013 Jonny Reeves; Licensed MIT */

/*global jQuery, window */
(function ($, window) {
    'use strict';

    var templateMap = {},
		instance = null,
		options = {
		    // Should an error be thrown if an attempt is made to render a non-existent template.  If false, the
		    // operation will fail silently.
		    warnOnMissingTemplates: false,

		    // Should an error be thrown if an attempt is made to overwrite a template which has already been added.
		    // If true the original template will be overwritten with the new value.
		    allowOverwrite: true,

		    // The 'type' attribute which you use to denoate a Mustache Template in the DOM; eg:
		    // `<script type="text/html" id="my-template"></script>`
		    domTemplateType: 'text/html',

		    // Specifies the `dataType` attribute used when external templates are loaded.
		    externalTemplateDataType: 'text'
		};

    function getMustache() {
        // Lazily retrieve Mustache from the window global if it hasn't been defined by
        // the User.
        if (instance === null) {
            instance = window.Mustache;
            if (instance === void 0) {
                $.error("Failed to locate Mustache instance, are you sure it has been loaded?");
            }
        }
        return instance;
    }

    /**
	 * @return {boolean} if the supplied templateName has been added.
	 */
    function has(templateName) {
        return templateMap[templateName] !== void 0;
    }

    /**
	 * Registers a template so that it can be used by $.Mustache.
	 *
	 * @param templateName		A name which uniquely identifies this template.
	 * @param templateHtml		The HTML which makes us the template; this will be rendered by Mustache when render()
	 *							is invoked.
	 * @throws					If options.allowOverwrite is false and the templateName has already been registered.
	 */
    function add(templateName, templateHtml) {
        if (!options.allowOverwrite && has(templateName)) {
            $.error('TemplateName: ' + templateName + ' is already mapped.');
            return;
        }
        templateMap[templateName] = $.trim(templateHtml);
    }

    /**
	 * Adds one or more tempaltes from the DOM using either the supplied templateElementIds or by retrieving all script
	 * tags of the 'domTemplateType'.  Templates added in this fashion will be registered with their elementId value.
	 *
	 * @param [...templateElementIds]	List of element id's present on the DOM which contain templates to be added; 
	 *									if none are supplied all script tags that are of the same type as the 
	 *									`options.domTemplateType` configuration value will be added.
	 */
    function addFromDom() {
        var templateElementIds;

        // If no args are supplied, all script blocks will be read from the document.
        if (arguments.length === 0) {
            templateElementIds = $('script[type="' + options.domTemplateType + '"]').map(function () {
                return this.id;
            });
        }
        else {
            templateElementIds = $.makeArray(arguments);
        }

        $.each(templateElementIds, function () {
            var templateElement = document.getElementById(this);

            if (templateElement === null) {
                $.error('No such elementId: #' + this);
            }
            else {
                add(this, $(templateElement).html());
            }
        });
    }

    /**
	 * Removes a template, the contents of the removed Template will be returned.
	 *
	 * @param templateName		The name of the previously registered Mustache template that you wish to remove.
	 * @returns					String which represents the raw content of the template.
	 */
    function remove(templateName) {
        var result = templateMap[templateName];
        delete templateMap[templateName];
        return result;
    }

    /**
	 * Removes all templates and tells Mustache to flush its cache.
	 */
    function clear() {
        templateMap = {};
        getMustache().clearCache();
    }

    /**
	 * Renders a previously added Mustache template using the supplied templateData object.  Note if the supplied
	 * templateName doesn't exist an empty String will be returned.
	 */
    function render(templateName, templateData) {
        if (!has(templateName)) {
            if (options.warnOnMissingTemplates) {
                $.error('No template registered for: ' + templateName);
            }
            return '';
        }
        return getMustache().to_html(templateMap[templateName], templateData, templateMap);
    }

    /**
	 * Loads the external Mustache templates located at the supplied URL and registers them for later use.  This method
	 * returns a jQuery Promise and also support an `onComplete` callback.
	 *
	 * @param url			URL of the external Mustache template file to load.
	 * @param onComplete	Optional callback function which will be invoked when the templates from the supplied URL
	 *						have been loaded and are ready for use.
	 * @returns				jQuery deferred promise which will complete when the templates have been loaded and are
	 *						ready for use.
	 */
    function load(url, onComplete) {
        return $.ajax({
            url: url,
            dataType: options.externalTemplateDataType
        }).done(function (templates) {
            $(templates).filter('script').each(function (i, el) {
                add(el.id, $(el).html());
            });

            if ($.isFunction(onComplete)) {
                onComplete();
            }
        });
    }

    /**
	 * Returns an Array of templateNames which have been registered and can be retrieved via
	 * $.Mustache.render() or $(element).mustache().
	 */
    function templates() {
        return $.map(templateMap, function (value, key) {
            return key;
        });
    }

    // Expose the public methods on jQuery.Mustache
    $.Mustache = {
        options: options,
        load: load,
        has: has,
        add: add,
        addFromDom: addFromDom,
        remove: remove,
        clear: clear,
        render: render,
        templates: templates,
        instance: instance
    };

    /**
	 * Renders one or more viewModels into the current jQuery element.
	 *
	 * @param templateName	The name of the Mustache template you wish to render, Note that the
	 *						template must have been previously loaded and / or added.
	 * @param templateData	One or more JavaScript objects which will be used to render the Mustache
	 *						template.
	 * @param options.method	jQuery method to use when rendering, defaults to 'append'.
	 */
    $.fn.mustache = function (templateName, templateData, options) {
        var settings = $.extend({
            method: 'append'
        }, options);

        var renderTemplate = function (obj, viewModel) {
            $(obj)[settings.method](render(templateName, viewModel));
        };

        return this.each(function () {
            var element = this;

            // Render a collection of viewModels.
            if ($.isArray(templateData)) {
                $.each(templateData, function () {
                    renderTemplate(element, this);
                });
            }

                // Render a single viewModel.
            else {
                renderTemplate(element, templateData);
            }
        });
    };

}(jQuery, window));

/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
    if (typeof exports === "object" && exports) {
        factory(exports); // CommonJS
    } else {
        var mustache = {};
        factory(mustache);
        if (typeof define === "function" && define.amd) {
            define(mustache); // AMD
        } else {
            root.Mustache = mustache; // <script>
        }
    }
}(this, function (mustache) {

    var whiteRe = /\s*/;
    var spaceRe = /\s+/;
    var nonSpaceRe = /\S/;
    var eqRe = /\s*=/;
    var curlyRe = /\s*\}/;
    var tagRe = /#|\^|\/|>|\{|&|=|!/;

    // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
    // See https://github.com/janl/mustache.js/issues/189
    var RegExp_test = RegExp.prototype.test;
    function testRegExp(re, string) {
        return RegExp_test.call(re, string);
    }

    function isWhitespace(string) {
        return !testRegExp(nonSpaceRe, string);
    }

    var Object_toString = Object.prototype.toString;
    var isArray = Array.isArray || function (obj) {
        return Object_toString.call(obj) === '[object Array]';
    };

    function escapeRegExp(string) {
        return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    function Scanner(string) {
        this.string = string;
        this.tail = string;
        this.pos = 0;
    }

    /**
     * Returns `true` if the tail is empty (end of string).
     */
    Scanner.prototype.eos = function () {
        return this.tail === "";
    };

    /**
     * Tries to match the given regular expression at the current position.
     * Returns the matched text if it can match, the empty string otherwise.
     */
    Scanner.prototype.scan = function (re) {
        var match = this.tail.match(re);

        if (match && match.index === 0) {
            this.tail = this.tail.substring(match[0].length);
            this.pos += match[0].length;
            return match[0];
        }

        return "";
    };

    /**
     * Skips all text until the given regular expression can be matched. Returns
     * the skipped string, which is the entire tail if no match can be made.
     */
    Scanner.prototype.scanUntil = function (re) {
        var match, pos = this.tail.search(re);

        switch (pos) {
            case -1:
                match = this.tail;
                this.pos += this.tail.length;
                this.tail = "";
                break;
            case 0:
                match = "";
                break;
            default:
                match = this.tail.substring(0, pos);
                this.tail = this.tail.substring(pos);
                this.pos += pos;
        }

        return match;
    };

    function Context(view, parent) {
        this.view = view || {};
        this.parent = parent;
        this._cache = {};
    }

    Context.make = function (view) {
        return (view instanceof Context) ? view : new Context(view);
    };

    Context.prototype.push = function (view) {
        return new Context(view, this);
    };

    Context.prototype.lookup = function (name) {
        var value = this._cache[name];

        if (!value) {
            if (name == '.') {
                value = this.view;
            } else {
                var context = this;

                while (context) {
                    if (name.indexOf('.') > 0) {
                        value = context.view;
                        var names = name.split('.'), i = 0;
                        while (value && i < names.length) {
                            value = value[names[i++]];
                        }
                    } else {
                        value = context.view[name];
                    }

                    if (value != null) break;

                    context = context.parent;
                }
            }

            this._cache[name] = value;
        }

        if (typeof value === 'function') value = value.call(this.view);

        return value;
    };

    function Writer() {
        this.clearCache();
    }

    Writer.prototype.clearCache = function () {
        this._cache = {};
        this._partialCache = {};
    };

    Writer.prototype.compile = function (template, tags) {
        var fn = this._cache[template];

        if (!fn) {
            var tokens = mustache.parse(template, tags);
            fn = this._cache[template] = this.compileTokens(tokens, template);
        }

        return fn;
    };

    Writer.prototype.compilePartial = function (name, template, tags) {
        var fn = this.compile(template, tags);
        this._partialCache[name] = fn;
        return fn;
    };

    Writer.prototype.getPartial = function (name) {
        if (!(name in this._partialCache) && this._loadPartial) {
            this.compilePartial(name, this._loadPartial(name));
        }

        return this._partialCache[name];
    };

    Writer.prototype.compileTokens = function (tokens, template) {
        var self = this;
        return function (view, partials) {
            if (partials) {
                if (typeof partials === 'function') {
                    self._loadPartial = partials;
                } else {
                    for (var name in partials) {
                        self.compilePartial(name, partials[name]);
                    }
                }
            }

            return renderTokens(tokens, self, Context.make(view), template);
        };
    };

    Writer.prototype.render = function (template, view, partials) {
        return this.compile(template)(view, partials);
    };

    /**
     * Low-level function that renders the given `tokens` using the given `writer`
     * and `context`. The `template` string is only needed for templates that use
     * higher-order sections to extract the portion of the original template that
     * was contained in that section.
     */
    function renderTokens(tokens, writer, context, template) {
        var buffer = '';

        var token, tokenValue, value;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];
            tokenValue = token[1];

            switch (token[0]) {
                case '#':
                    value = context.lookup(tokenValue);

                    if (typeof value === 'object') {
                        if (isArray(value)) {
                            for (var j = 0, jlen = value.length; j < jlen; ++j) {
                                buffer += renderTokens(token[4], writer, context.push(value[j]), template);
                            }
                        } else if (value) {
                            buffer += renderTokens(token[4], writer, context.push(value), template);
                        }
                    } else if (typeof value === 'function') {
                        var text = template == null ? null : template.slice(token[3], token[5]);
                        value = value.call(context.view, text, function (template) {
                            return writer.render(template, context);
                        });
                        if (value != null) buffer += value;
                    } else if (value) {
                        buffer += renderTokens(token[4], writer, context, template);
                    }

                    break;
                case '^':
                    value = context.lookup(tokenValue);

                    // Use JavaScript's definition of falsy. Include empty arrays.
                    // See https://github.com/janl/mustache.js/issues/186
                    if (!value || (isArray(value) && value.length === 0)) {
                        buffer += renderTokens(token[4], writer, context, template);
                    }

                    break;
                case '>':
                    value = writer.getPartial(tokenValue);
                    if (typeof value === 'function') buffer += value(context);
                    break;
                case '&':
                    value = context.lookup(tokenValue);
                    if (value != null) buffer += value;
                    break;
                case 'name':
                    value = context.lookup(tokenValue);
                    if (value != null) buffer += mustache.escape(value);
                    break;
                case 'text':
                    buffer += tokenValue;
                    break;
            }
        }

        return buffer;
    }

    /**
     * Forms the given array of `tokens` into a nested tree structure where
     * tokens that represent a section have two additional items: 1) an array of
     * all tokens that appear in that section and 2) the index in the original
     * template that represents the end of that section.
     */
    function nestTokens(tokens) {
        var tree = [];
        var collector = tree;
        var sections = [];

        var token;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];
            switch (token[0]) {
                case '#':
                case '^':
                    sections.push(token);
                    collector.push(token);
                    collector = token[4] = [];
                    break;
                case '/':
                    var section = sections.pop();
                    section[5] = token[2];
                    collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
                    break;
                default:
                    collector.push(token);
            }
        }

        return tree;
    }

    /**
     * Combines the values of consecutive text tokens in the given `tokens` array
     * to a single token.
     */
    function squashTokens(tokens) {
        var squashedTokens = [];

        var token, lastToken;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];
            if (token) {
                if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
                    lastToken[1] += token[1];
                    lastToken[3] = token[3];
                } else {
                    lastToken = token;
                    squashedTokens.push(token);
                }
            }
        }

        return squashedTokens;
    }

    function escapeTags(tags) {
        return [
          new RegExp(escapeRegExp(tags[0]) + "\\s*"),
          new RegExp("\\s*" + escapeRegExp(tags[1]))
        ];
    }

    /**
     * Breaks up the given `template` string into a tree of token objects. If
     * `tags` is given here it must be an array with two string values: the
     * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
     * course, the default is to use mustaches (i.e. Mustache.tags).
     */
    function parseTemplate(template, tags) {
        template = template || '';
        tags = tags || mustache.tags;

        if (typeof tags === 'string') tags = tags.split(spaceRe);
        if (tags.length !== 2) throw new Error('Invalid tags: ' + tags.join(', '));

        var tagRes = escapeTags(tags);
        var scanner = new Scanner(template);

        var sections = [];     // Stack to hold section tokens
        var tokens = [];       // Buffer to hold the tokens
        var spaces = [];       // Indices of whitespace tokens on the current line
        var hasTag = false;    // Is there a {{tag}} on the current line?
        var nonSpace = false;  // Is there a non-space char on the current line?

        // Strips all whitespace tokens array for the current line
        // if there was a {{#tag}} on it and otherwise only space.
        function stripSpace() {
            if (hasTag && !nonSpace) {
                while (spaces.length) {
                    delete tokens[spaces.pop()];
                }
            } else {
                spaces = [];
            }

            hasTag = false;
            nonSpace = false;
        }

        var start, type, value, chr, token;
        while (!scanner.eos()) {
            start = scanner.pos;

            // Match any text between tags.
            value = scanner.scanUntil(tagRes[0]);
            if (value) {
                for (var i = 0, len = value.length; i < len; ++i) {
                    chr = value.charAt(i);

                    if (isWhitespace(chr)) {
                        spaces.push(tokens.length);
                    } else {
                        nonSpace = true;
                    }

                    tokens.push(['text', chr, start, start + 1]);
                    start += 1;

                    // Check for whitespace on the current line.
                    if (chr == '\n') stripSpace();
                }
            }

            // Match the opening tag.
            if (!scanner.scan(tagRes[0])) break;
            hasTag = true;

            // Get the tag type.
            type = scanner.scan(tagRe) || 'name';
            scanner.scan(whiteRe);

            // Get the tag value.
            if (type === '=') {
                value = scanner.scanUntil(eqRe);
                scanner.scan(eqRe);
                scanner.scanUntil(tagRes[1]);
            } else if (type === '{') {
                value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
                scanner.scan(curlyRe);
                scanner.scanUntil(tagRes[1]);
                type = '&';
            } else {
                value = scanner.scanUntil(tagRes[1]);
            }

            // Match the closing tag.
            if (!scanner.scan(tagRes[1])) throw new Error('Unclosed tag at ' + scanner.pos);

            token = [type, value, start, scanner.pos];
            tokens.push(token);

            if (type === '#' || type === '^') {
                sections.push(token);
            } else if (type === '/') {
                // Check section nesting.
                if (sections.length === 0) throw new Error('Unopened section "' + value + '" at ' + start);
                var openSection = sections.pop();
                if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
            } else if (type === 'name' || type === '{' || type === '&') {
                nonSpace = true;
            } else if (type === '=') {
                // Set the tags for the next time around.
                tags = value.split(spaceRe);
                if (tags.length !== 2) throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
                tagRes = escapeTags(tags);
            }
        }

        // Make sure there are no open sections when we're done.
        var openSection = sections.pop();
        if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

        tokens = squashTokens(tokens);

        return nestTokens(tokens);
    }

    mustache.name = "mustache.js";
    mustache.version = "0.7.2";
    mustache.tags = ["{{", "}}"];

    mustache.Scanner = Scanner;
    mustache.Context = Context;
    mustache.Writer = Writer;

    mustache.parse = parseTemplate;

    // Export the escaping function so that the user may override it.
    // See https://github.com/janl/mustache.js/issues/244
    mustache.escape = escapeHtml;

    // All Mustache.* functions use this writer.
    var defaultWriter = new Writer();

    /**
     * Clears all cached templates and partials in the default writer.
     */
    mustache.clearCache = function () {
        return defaultWriter.clearCache();
    };

    /**
     * Compiles the given `template` to a reusable function using the default
     * writer.
     */
    mustache.compile = function (template, tags) {
        return defaultWriter.compile(template, tags);
    };

    /**
     * Compiles the partial with the given `name` and `template` to a reusable
     * function using the default writer.
     */
    mustache.compilePartial = function (name, template, tags) {
        return defaultWriter.compilePartial(name, template, tags);
    };

    /**
     * Compiles the given array of tokens (the output of a parse) to a reusable
     * function using the default writer.
     */
    mustache.compileTokens = function (tokens, template) {
        return defaultWriter.compileTokens(tokens, template);
    };

    /**
     * Renders the `template` with the given `view` and `partials` using the
     * default writer.
     */
    mustache.render = function (template, view, partials) {
        return defaultWriter.render(template, view, partials);
    };

    // This is here for backwards compatibility with 0.4.x.
    mustache.to_html = function (template, view, partials, send) {
        var result = mustache.render(template, view, partials);

        if (typeof send === "function") {
            send(result);
        } else {
            return result;
        }
    };

}));