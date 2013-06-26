(function () {
    ideaPress.options = {
        appTitleImage: null,                      // App title image (approx. 600px x 80px)
        appTitle: "IdeaPress",                    // App title text
        cacheTime: 3600000,                       // Global cache time to try fetch   
        mainUrl: "http://ideanotion.net/",         // Main promoting site
        privacyUrl: "http://ideanotion.net",      // Privacy URL
        useSnapEffect: true,
        fetchOnPostInit: false,                           //only for selfhosted sites
        modules: [
            { name: wordpresscomModule, options: { id : 1, siteDomain: 'tctechcrunch2011.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, templateName : "wpcom-tpl-normal" } },
        ],
    };
})();
