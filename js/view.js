/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var view = function() {
    var instance = {

        createPanel: function(id, cssName, title) {
            var panel = $("<div id='" + id + "' class='content'></div>");
            panel.cssName = cssName;
            if ($('#content #' + panel.attr('id')).length == 0) {
                $.ui.addContentDiv("#" + panel.attr('id'), panel.html(), "");
            }

            panel.update = function() {

                $.ui.updatePanel("#" + panel.attr('id'), panel.html());
                $('#content #' + panel.attr('id')).addClass(panel.cssName);
            };
            panel.navigateTo = function (effect) {                
                panel.update();

                if (!effect)
                    effect = "slide";

                $.ui.loadContent('#' + panel.attr('id'), true, true, effect);

                if (title)
                    $.ui.setTitle(title);
                
                $.ui.toggleNavMenu(false);
            };            
            panel.createSection = function (divId, clsName) {
                var section = $("<div></div>");
                section.attr('id', divId);
                section.addClass(clsName);
                $(panel).append(section);
                return section;
            };
            return panel;
        },
    };

    return instance;
}();