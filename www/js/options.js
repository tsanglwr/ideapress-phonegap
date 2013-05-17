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
            { name: wordpresscomModule, options: { siteDomain: 'wordpressmetro.wordpress.com', title: "Recent News", typeId: wordpresscomModule.MOSTRECENT, clientId: '2131', clientSecret: 'b8OEIPyqH113smvoCpgrShM3wakwYALgPOoFUn3X8PA9Y3l2hslQCCKev51VvHsR' } },
            { name: wordpresscomModule, options: { siteDomain: 'wordpressmetro.wordpress.com', title: "Tech", typeId: wordpresscomModule.CATEGORY, categoryId: "tech", clientId: '2131', clientSecret: 'b8OEIPyqH113smvoCpgrShM3wakwYALgPOoFUn3X8PA9Y3l2hslQCCKev51VvHsR' } },
            { name: wordpresscomModule, options: { siteDomain: 'wordpressmetro.wordpress.com', title: "Bookmark", typeId: wordpresscomModule.BOOKMARKS, clientId: '2131', clientSecret: 'b8OEIPyqH113smvoCpgrShM3wakwYALgPOoFUn3X8PA9Y3l2hslQCCKev51VvHsR' } }
        ],
    };
})();
