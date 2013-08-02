(function () {
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
     		  //{ name: wordpressModule, options: { id: 1, siteDomain: 'http://ideanotion.net', title: "Recent News", typeId: wordpressModule.MOSTRECENT, showHub: true, hubSize: 1, templateName: "wp-tpl-3" } }
             { name: wordpressModule, options: { id: 3, siteDomain: 'http://ideanotion.net', title: "Recent News", typeId: wordpressModule.MOSTRECENT,  showHub: true, hubSize: 6, templateName: "wp-tpl-3" } }
            , { name: wordpressModule, options: { id: 4, siteDomain: 'http://ideanotion.net', title: "Open Source", typeId: wordpressModule.CATEGORY, categoryId: 53, showHub: true, hubSize: 6, templateName: "wp-tpl-3" } }
        ]
        //,searchModule: { name: wordpresscomModule, options: { id: 6, siteDomain: 'cbsnewyork.wordpress.com', title: 'Search', typeId: wordpresscomModule.SEARCH, templateName: "wpc-tpl-0" } }
    };
})();
