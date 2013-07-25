/*
IdeaPress 
File: preview.js
Author: IdeaNotion
Description: Live preview
*/
var preview = function () { 
    var instance = {
        livePreviewInit: function (url, appTitle, type, modules, styles, cb) {
            ideaPress.options.mainUrl = url;
            ideaPress.options.privacyUrl = url;
            ideaPress.options.appTitle = appTitle;
            // module ==>  [{ siteDomain: 'cbsnewyork.wordpress.com', title: "Sports", typeId: wordpresscomModule.CATEGORY, categoryId: "Sports", showHub: true, hubSize: 1 , templateName: "wpc-tpl-0" } ]
            ideaPress.options.modules = [];
            var count = 1;
            for (var i in modules) {
                var m = { name: type == 0 ? wordpressModule : wordpresscomModule, options: { id: count++, siteDomain: modules[i].siteDomain, title: modules[i].title, typeId: modules[i].typeId, categoryId: modules[i].categoryId, showHub: true, hubSize: 1, templateName: "wpc-tpl-0" } };
                ideaPress.options.modules.push(m);
            }
            ideaPress.modules = [];
            if ((typeof (window.localStorage) != 'undefined' || null != window.localStorage))
                util.clearLocalStorage();

            ideaPress.hub.html("");
            ideaPress.clearMenuItems();
            ideaPress.initModules();
            var promises = ideaPress.renderModules();
            RSVP.all(promises).then(function () {
                ideaPress.hub.update();
                ideaPress.hub.navigateTo();
                if (styles)
                    preview.livePreviewUpdateStyle(styles, cb);
                else if (cb) {
                    cb();
                }
            });
        },
        livePreviewUpdateStyle: function (styles, cb) {
            //  [ { cssRule: ".ip-theme-bg-color", property: "background-color", value : "#FFF !important" } ]
            for(var i = 0; i < styles.length; i ++) {
                $(styles[i].cssRule).css(styles[i].property, styles[i].value);
            }
            
            if (cb)
                cb();
        },
        livePreviewUpdateLayoutOptions: function (options, cb) {
            for (var i = 0; i < ideaPress.modules.length; i++) {
                ideaPress.modules[i].templateName = options.templateName;
            }
            ideaPress.hub.html("");
            var promises = ideaPress.renderModules();
            RSVP.all(promises).then(function () {
                ideaPress.hub.update();
                ideaPress.hub.navigateTo();
                if (cb)
                    cb();
            });
            
        },
        livePreviewUpdateContent: function (type, modules, cb) {
            var oldModules = [];
            var cc = 0;
            for (var index in ideaPress.modules) {
                oldModules.push(ideaPress.modules[index]);
                cc++;
            }

            for (var c = 0; c < cc; c++)
                ideaPress.modules.pop();
            

            var count = 1;
            for (var i in modules) {
                var found = -1;
                for (var j in oldModules) {
                    if (oldModules[j].typeId == modules[i].typeId && oldModules[j].categoryId == modules[i].categoryId) {
                        found = j;
                    }
                }
                if (found > -1) {
                    oldModules[found].id = count++;
                    ideaPress.modules.push(oldModules[found]);
                } else {
                    var m = { name: type == 0 ? wordpressModule : wordpresscomModule, options: { id: count++, siteDomain: modules[i].siteDomain, title: modules[i].title, typeId: modules[i].typeId, categoryId: modules[i].categoryId, showHub: true, hubSize: 1, templateName: "wpc-tpl-0" } };
                    ideaPress.options.modules.push(m);
                    var module = m.name;
                    var options = m.options;
                    options.id = count++;
                    var mod = new module(this, options);
                    ideaPress.modules.push(mod);
                }
            }

            ideaPress.hub.html("");
            ideaPress.clearMenuItems();
            var promises = ideaPress.renderModules();   
            RSVP.all(promises).then(function () {
                ideaPress.hub.update();
                ideaPress.hub.navigateTo();
                if (cb)
                    cb();
            });
        },
        
    };

    return instance;
}();
