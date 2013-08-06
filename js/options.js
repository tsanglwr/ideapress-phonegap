/*(function () {
    ideaPress.options = {
        appTitleImage: null,                      // App title image (approx. 600px x 80px)
        appTitle: "IdeaNotion",                    // App title text
        cacheTime: 3600000,                       // Global cache time to try fetch   
        mainUrl: "http://ideanotion.net",         // Main promoting site

        privacyUrl: "http://ideanotion.net",      // Privacy URL
        fetchOnPostInit: false,                           //only for selfhosted sites
        hubPage : true,
        menu: 'left',
        modules: [
     		  { name: wordpressModule, options: { id: 1, siteDomain: 'http://ideanotion.net', title: "Recent News", typeId: wordpressModule.MOSTRECENT, showHub: true, hubSize: 1, templateName: "wp-tpl-0" } }
            , { name: wordpresscomModule, options: { id: 2, siteDomain: 'http://ideanotion.net', title: 'bookmark', typeId: wordpressModule.BOOKMARKS, showHub: true, hubSize: 6, templateName: "wpc-tpl-0" } }
            , { name: wordpressModule, options: { id: 3, siteDomain: 'http://ideanotion.net', title: "Recent News", typeId: wordpressModule.MOSTRECENT,  showHub: true, hubSize: 6, templateName: "wp-tpl-0" } }
            , { name: wordpressModule, options: { id: 4, siteDomain: 'http://ideanotion.net', title: "Open Source", typeId: wordpressModule.CATEGORY, categoryId: 53, showHub: true, hubSize: 6, templateName: "wp-tpl-0" } }
        ]
        , searchModule: { name: wordpressModule, options: { id: 6, siteDomain: 'http://ideanotion.net', title: 'Search', typeId: wordpressModule.SEARCH, templateName: "wpc-tpl-0" } }
    };
})();
*/

(function () {
    ideaPress.options = {
        appTitleImage: null,                      // App title image (approx. 600px x 80px)
        appTitle: "WinPhankyle",                    // App title text
        cacheTime: 3600000,                       // Global cache time to try fetch   
        mainUrl: "http://winphankyle.wordpress.com/",         // Main promoting site
        privacyUrl: "http://cbsnewyork.wordpress.com",      // Privacy URL
        fetchOnPostInit: false,                           //only for selfhosted sites
        hubPage: true,
        menu: 'left',
        modules: [
             { name: wordpresscomModule, options: { id: 1, siteDomain: 'winphankyle.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, showHub: true, hubSize: 2, templateName: "wpc-tpl-3" } }
            , { name: wordpresscomModule, options: { id: 2, siteDomain: 'winphankyle.wordpress.com', title: 'bookmark', typeId: wordpresscomModule.BOOKMARKS, showHub: true, hubSize:6, templateName: "wpc-tpl-3" } }
            //,{ name: wordpresscomModule, options: { id: 2, siteDomain: 'winphankyle.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, showHub: true, hubSize: 4, templateName: "wpc-tpl-1" } }
            //, { name: wordpresscomModule, options: { id: 3, siteDomain: 'winphankyle.wordpress.com', title: "News", typeId: wordpresscomModule.CATEGORY, categoryId: "news", showHub: true, hubSize: 4, templateName: "wpc-tpl-3" } }
            //, { name: wordpresscomModule, options: { id: 5, siteDomain: 'winphankyle.wordpress.com', title: "Apps", typeId: wordpresscomModule.CATEGORY, categoryId: "apps", showHub: true, hubSize: 4, templateName: "wpc-tpl-3" } }
         /*, { name: wordpresscomModule, options: { id: 6, siteDomain: 'winphankyle.wordpress.comm', title: "Windows Phone", typeId: wordpresscomModule.CATEGORY, categoryId: "windows-phone", showHub: true, hubSize: 4, templateName: "wpc-tpl-0" } }
        */
        ]
        ,searchModule: { name: wordpresscomModule, options: { id: 6, siteDomain: 'cbsnewyork.wordpress.com', title: 'Search', typeId: wordpresscomModule.SEARCH, templateName: "wpc-tpl-0" } }
    };
})();