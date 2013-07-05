/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var view = function() {
    var instance = {

        createPage: function(id, cssName, title) {
            var page = $("<div id='" + id + "' class='content'></div>");
            page.cssName = cssName;
            if ($('#content #' + page.attr('id')).length == 0) {
                $.ui.addContentDiv("#" + page.attr('id'), page.html(), "");
            }

            
            page.navigateTo = function (effect) {                               
                if (!effect)
                    effect = "slide";

                $.ui.updatePanel("#" + page.attr('id'), page.html());
                $('#content #' + page.attr('id')).addClass(page.cssName);
                $.ui.loadContent('#' + page.attr('id'), true, true, effect);
                if (title)
                    $.ui.setTitle(title);
                $.ui.toggleNavMenu(false);
            };
            page.appendContent = function (content) {
                page.append(content);
            };
            page.createSection = function (divId, clsName) {
                var section = $("<div></div>");
                section.attr('id', divId);
                section.addClass(clsName);
                $(page).append(section);
                return section;
            };
            page.appendHeader = function (content) {
                //$(page).find('[data-role=header]').append(content);
            };

            return page;
        },
    };

    return instance;
}();