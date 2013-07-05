(function () {
    ideaPress.options = {
        appTitleImage: null,                      // App title image (approx. 600px x 80px)
        appTitle: "IdeaPress",                    // App title text
        cacheTime: 3600000,                       // Global cache time to try fetch   
        mainUrl: "http://cbsnewyork.wordpress.com/",         // Main promoting site
        privacyUrl: "http://cbsnewyork.wordpress.com",      // Privacy URL
        fetchOnPostInit: false,                           //only for selfhosted sites
        hubPage : true,
        menu: 'left',
        modules: [
             { name: wordpresscomModule, options: { id: 1, siteDomain: 'cbsnewyork.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, showHub: true, hubSize: 1, templateName: "wpc-tpl-0" } }
            , { name: wordpresscomModule, options: { id: 3, siteDomain: 'cbsnewyork.wordpress.com', title: "News", typeId: wordpresscomModule.CATEGORY, categoryId: "News", showHub: true, hubSize: 2, templateName: "wpc-tpl-0" } }
            , { name: wordpresscomModule, options: { id: 2, siteDomain: 'cbsnewyork.wordpress.com', title: "Sports", typeId: wordpresscomModule.CATEGORY, categoryId: "Sports", showHub: true, hubSize: 2, templateName: "wpc-tpl-0" } }
            , { name: wordpresscomModule, options: { id: 3, siteDomain: 'cbsnewyork.wordpress.com', title: "Best Of", typeId: wordpresscomModule.CATEGORY, categoryId: "Best Of", showHub: true, hubSize: 2, templateName: "wpc-tpl-0" } }
            , { name: wordpresscomModule, options: { id: 3, siteDomain: 'cbsnewyork.wordpress.com', title: "Travel", typeId: wordpresscomModule.CATEGORY, categoryId: "Travel", showHub: true, hubSize: 2, templateName: "wpc-tpl-0" } }
        ],
    };
})();
