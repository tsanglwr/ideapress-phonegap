/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var view = function () {
    var refreshblock = "<div class='refreshBlock' ><div class='refreshContainer'><div class='refreshImageBlock'></div><div class='refreshLabel'>RELEASE ME TO REFRESH</div></div></div>";
    var instance = {
        
        createPanel: function (id, cssName, title, refreshCallback) {
            var block = refreshblock;
            if (!refreshCallback) {
                block = "";
            }
            var panel = $("<div id='" + id + "' class='content'>" + block + "</div>");
            panel.cssName = cssName;
            if ($('#content #' + panel.attr('id')).length == 0) {
                $.ui.addContentDiv("#" + panel.attr('id'), panel.html(), "");
            }
            panel.refreshCallback = refreshCallback;
            panel.update = function() {
               $.ui.updatePanel("#" + panel.attr('id'), panel.html());
               $('#content #' + panel.attr('id')).attr("class", "panel");
               $('#content #' + panel.attr('id')).addClass(panel.cssName);
                
               if (this.refreshCallback) {
                   //hook 
                   var myScroller = $("#" + id).scroller({
                       scrollBars: true,
                       verticalScroll: true,
                       horizontalScroll: false,
                       vScrollCSS: "jqmScrollbar",
                       hScrollCSS: "jqmScrollbar"
                   });
                   myScroller.addPullToRefresh();
                   //myScroller.refresh = true;
                   //$.ui.scrollingDivs['ip-hub'].addPullToRefresh();
                   if (!this.isBind) {
                       $.bind(myScroller, "refresh-release", function () {
              
                           $('#' + id + ' .refreshBlock').css('margin', '0');
                           refreshCallback();
                       });
                       this.isBind = true;
                   }
               }
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
            panel.clearHtml = function() {
               $(this).html(block);
            };
            return panel;
        },
    };

    return instance;
}();