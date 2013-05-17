/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var ideaPress = {
    // Change Storage Version to empty the local storage
    localStorageSchemaVersion: '20130515-1',
    modules: [],
    initialized: false,
    globalFetch: false,
    currentModule: 0,

    // Initialize all modules
    initModules: function() {
        // register all the modules defined in options.js
        var count = 0;
        for (var i in this.options.modules) {
            var module = this.options.modules[i].name;
            var options = this.options.modules[i].options;
            options.id = count++;
            this.modules.push(new module(this, options));
        }

        // register search module
        if (this.options.searchModule) {
            // TODO: search
        }

        // register notification module
        if (this.options.notification) {
            // TODO: notificaiton module?
        }
    },

    // Call each module to render its content on hub.html
    renderModules: function(elem) {
        var promises = [];
        var count = 1;
        for (var i in this.modules) {
            //promises.push(this.modules[i].render(elem));
            count++;
        }
        promises.push(this.modules[0].render(elem));       
        return promises;
    },

    // Call each module to update its content on hub.html
    update: function(page) {
        ideaPress.globalFetch = this.modules[this.currentModule].update(page).then(function () {
            ideaPress.globalFetch = false;
        });
    },


    // Call each module to refresh its content or data store
    refresh: function() {      
        ideaPress.modules[currentModule].refresh();
        
        hideMenu();
    },

    // Call each module to cancel any operation    
    cancel: function() {
        for (var i in ideaPress.modules) {
            ideaPress.modules[i].cancel();
        }

        if (ideaPress.globalFetch)
            ideaPress.globalFetch.abort();
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
};
