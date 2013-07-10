/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var ideaPress = function () { 
    var instance = {
        // Change Storage Version to empty the local storage
        localStorageSchemaVersion : '20130515-1',
        modules : [],
        options : { },
        initialized : false,
        globalFetch : false,
        currentModule: 0,
        hub : null,
        // Initialize all modules
        initModules: function () {

            console.log("ideaPress.initModules(): Enter");
            
            var promises = [];

            // register all the modules defined in options.js
            var count = 0;
            for (var i in this.options.modules) {
                var module = this.options.modules[i].name;
                var options = this.options.modules[i].options;
                options.id = count++;
                var m = new module(this, options);
                this.modules.push(m);
                
                promises.push(m.initialize().then(function () {
                }));
            }

            // register search module
            if (this.options.searchModule) {
                module = this.options.searchModule.name;
                options = this.options.searchModule.options;
                this.searchModule = new module(this, options);
                this.searchModule.searchInit();
            }

            // register notification module
            if (this.options.notification) {
                // TODO: notificaiton module?
            }
            
            console.log("ideaPress.initModules(): Exit");

            return promises;
        },


        // Call each module to render its content on hub.html
        renderModules: function () {
            console.log("ideaPress.renderModules(): Enter");

            var promises = [];
            this.hub = view.createPage("ip-hub", this.modules[0].templateName, this.options.appTitle);
            for (var i in this.modules) {
                if (this.modules[i].showHub) {
                    console.log("ideaPress.renderModules(): rendering modules: " + i);
                    promises.push(this.modules[i].render(this.hub));
                }
            }

            console.log("ideaPress.renderModules(): Exit");
            return promises;
        },
        
        update: function (page) {
            var self = this;
            view.gotoPage(this.modules[this.currentModule].pageContainer);
            this.globalFetch = this.modules[this.currentModule].update(page).then(function () {
                self.globalFetch = false;
            });
        },


        // Call each module to refresh its content or data store
        refresh: function() {      
            this.modules[currentModule].refresh();
        
            hideMenu();
        },

        // Call each module to cancel any operation    
        cancel: function() {
            for (var i in this.modules) {
                this.modules[i].cancel();
            }

            if (this.globalFetch)
                this.globalFetch.abort();
        },

        // TODO: show Menu
        showMenu: function() {

        },

        // TODO: hide Menu
        hideMenu: function() {

        },
    
        // TODO: Show external URL
        renderUrl: function (url) {        
        },
    
        showLoader : function () {
        
        },
    
        hideLoader : function () {
        
        },
        search: function (searchQuery) {
            this.searchModule.search(searchQuery);
        }
    };

    return instance;
}();
