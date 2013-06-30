(function () {
    ideaPress.options = {
        appTitleImage: null,                      // App title image (approx. 600px x 80px)
        appTitle: "IdeaPress",                    // App title text
        cacheTime: 3600000,                       // Global cache time to try fetch   
        mainUrl: "http://tctechcrunch2011.wordpress.com/",         // Main promoting site
        privacyUrl: "http://tctechcrunch2011.wordpress.com",      // Privacy URL
        fetchOnPostInit: false,                           //only for selfhosted sites
        hubPage : true,
        menu: 'left',
        modules: [
             { name: wordpresscomModule, options: { id: 1, siteDomain: 'tctechcrunch2011.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, showHub: true, hubSize: 1, templateName: "wpc-tpl-0", hubType : "a" } }
            , { name: wordpresscomModule, options: { id: 2, siteDomain: 'tctechcrunch2011.wordpress.com', title: "Startups", typeId: wordpresscomModule.CATEGORY, categoryId: "Startups", showHub: true, hubSize: 3, templateName: "wpc-tpl-0", hubType: "b" } }
        ],
    };
})();
