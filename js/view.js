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
        createPage: function(id, cssName) {
            var page = $(
                "<div data-role='page' data-url='" + id + "' id='" + id + "'>" +
                    "<div data-role='header'><div id='logo-div'><img id='logo-img' src='css/images/logo.png' /></div></div>" +
                    "<div data-role='content' id='ip-hub-content'></div>" +
/*                    "<div data-role='footer'>" +
                    "<div data-role='navbar' data-iconpos='top'  data-id='navbar' data-position='fixed'><ul>" +            
			        "<li><a href='#' data-icon='home'>Home</a></li>" +
			        "<li><a href='#' data-icon='star'>Bookmark</a></li>" +
			        "<li><a href='#' data-icon='search'>Search</a></li>" +
                    "</ul></div>" +*/
                    "</div>" + //
                    "</div>");
            if (cssName)
                page.addClass(cssName);
            page.navigateTo = function (effect) {                
                $.mobile.changePage($(this), {
                        allowSamePageTransition: true,
                        transition: effect ? effect : "flip",
                    }
                );
                $(this).trigger("pagecreate");
            };
            page.appendContent = function(content) {
                $(page).find('[data-role=content]').append(content);
            };
            page.createSection = function (divId, clsName) {
                var section = $("<div></div>");
                section.attr('id', divId);
                section.addClass(clsName);
                $(page).find('[data-role=content]').append(section);
                return section;
            };
            page.appendHeader = function (content) {
                $(page).find('[data-role=header]').append(content);
            };

            $('#container').append(page);
            return page;
        },
    };

    return instance;
}();