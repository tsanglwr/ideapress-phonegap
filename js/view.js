/*
IdeaPress 
File: core.js
Author: IdeaNotion
Description: Control and maintain core logics of the application
*/
var view = function() {
    var instance = {
        /*
          <div data-role="page">
          <div data-theme="b" data-role="header">
                <h2></h2>
          </div>
          <div data-theme="b" id='pageContent' data-role="content">
          </div>
             <div data-theme="b" data-role="footer">
                 <h2></h2>
             </div>
         </div>  
        */
        addPage: function (id) {
            var page = $(
                "<div data-role='page' data-url='" + id + "' id=" + id + "'>" +
                    //"<div data-role='header'></div>" +
                    "<div data-role='content'></div>" +
                    "<div data-role='footer'>" +
                    "<div data-role='navbar' data-iconpos='top'  data-id='navbar' data-position='fixed'><ul>" +            
			        "<li><a href='#' data-icon='home'>Home</a></li>" +
			        "<li><a href='#' data-icon='star'>Bookmark</a></li>" +
			        "<li><a href='#' data-icon='search'>Search</a></li>" +
                    "</ul></div>" +
                    "</div>" + //TODO: footer NAV?
                "</div>");

            $('#container').append(page);
            return page;

        },
        gotoPage: function (page, effect) {
            $.mobile.changePage($(page), {
                    allowSamePageTransition : true,
                     transition: effect ? effect : "flip",
                }
            );
        },
        renderHeader: function (page, content) {
            var header = $("<div data-role='header'></div>");
            header.html(content);
            if (typeof page === "string")
                $('#' + page).prepend(header);
            else {
                $(page).prepend(header);
            }
            
        },
        renderContent: function (page, content) {
            if (typeof page === "string")
                $('#' + page).find('div[data-role=content]').html(content);
            else {
                $(page).find('div[data-role=content]').html(content);
            }
            $(page).trigger("pagecreate");
        }
    };
    return instance;
}();