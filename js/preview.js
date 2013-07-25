/*
IdeaPress 
File: preview.js
Author: IdeaNotion
Description: Live preview
*/
var preview = function () { 
    var instance = {              
        livePreviewUpdateStyle: function (styles) {
            //  [ { cssRule: ".ip-theme-bg-color", property: "background-color", value : "#FFF !important" } ]
            for(var i = 0; i < styles.length; i ++) {
                $(styles[i].cssRule).css(styles[i].property, styles[i].value);
            }
        },
        livePreviewUpdateLayoutOptions: function (options) {
            for (var i = 0; i < ideaPress.modules.length; i++) {
                ideaPress.modules[i].templateName = options.templateName;
            }
            ideaPress.hub.html("");
            var promises = ideaPress.renderModules();
            RSVP.all(promises).then(function () {
                ideaPress.hub.update();
                ideaPress.hub.navigateTo();
            });
            
        },
        livePreviewUpdateContent: function (url, clearCache, appTitle, type, modules) {
            ideaPress.options.mainUrl = url;
            ideaPress.options.privacyUrl = url;
            ideaPress.options.appTitle = appTitle;
            // module ==>  [{ siteDomain: 'cbsnewyork.wordpress.com', title: "Sports", typeId: wordpresscomModule.CATEGORY, categoryId: "Sports", showHub: true, hubSize: 1 , templateName: "wpc-tpl-0" } ]
            ideaPress.options.modules = [];
            var count = 0;
            for (var i in modules) {               
                var m = { name: type == 0 ? wordpressModule : wordpresscomModule, options: { id: count++, siteDomain: modules[i].siteDomain, title: modules[i].title, typeId: modules[i].typeId, categoryId : modules[i].categoryId, showHub: true, hubSize: 1, templateName: "wpc-tpl-0" } };
                ideaPress.options.modules.push(m);
            }
            ideaPress.modules = [];
            if (clearCache && (typeof(window.localStorage) != 'undefined' || null != window.localStorage))
                util.clearLocalStorage();

            ideaPress.hub.html("");
            ideaPress.clearMenuItems();
            ideaPress.initModules();
            var promises = ideaPress.renderModules();   
            RSVP.all(promises).then(function () {
                ideaPress.hub.update();
                ideaPress.hub.navigateTo();
            });
        },
        
    };

    return instance;
}();
