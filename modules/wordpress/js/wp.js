/*
IdeaPress Wordpress.org API module
Author: IdeaNotion
*/
var wordpressModule = function (ideaPress, options) {
    this.templtePrefix = "wp";
    this.ideaPress = ideaPress;
    this.list = [];
    this.localStorageBookmarkKey = "wp-bookmark";
    this.apiURL = options.siteDomain;
    this.fetching = false;
    this.userAgent = navigator.userAgent;
    this.title = options.title;
    this.pageSize = 8;
    this.hubSize = options.hubSize;
    this.typeId = options.typeId;
    this.categoryId = options.categoryId;
    this.id = options.id;
    this.siteDomain = options.siteDomain;
    this.pageContainer = null;
    this.templateName = options.templateName;
    this.hubType = options.hubType;
    this.showHub = options.showHub;
    this.searchPage = '';
    this.currentPostId = null;
    return this;    
};

// Constant
wordpressModule.PAGES = 0;
wordpressModule.MOSTRECENT = 1;
wordpressModule.CATEGORY = 2;
wordpressModule.BOOKMARKS = 3;
wordpressModule.SEARCH = 4;

wordpressModule.initialized = false;

/* 
============================================================================     External Methods     =============================================================//
*/
// load templates
wordpressModule.prototype.initialize = function (elem) {

    var self = this;
    console.log("wp.initialize() [" + self.id + "]: Enter");
    /*
var share = new Share();
share.show({
    subject: 'I like turtles',
    text: 'http://www.mndaily.com'},
    function() {alert('Share SUCCESS')}, // Success function
    function() {alert('Share failed')} // Failure function

);*/


    var promise = new RSVP.Promise();
    if (!wordpressModule.initialized) {
        // file://www/modules/wordpress/pages/wp.template.html        
        console.log("wp.initialize(): loading " + LOCALPATH + "modules/wordpress/pages/wp.template.html");
        $.Mustache.load(LOCALPATH + "modules/wordpress/pages/wp.template.html", function () {
            console.log("wp.initialize() [" + self.id + "]: Ajax Resolve");
            promise.resolve();
        },
            function () {
                console.log("wp.initialize() [" + self.id + "]: Ajax Reject");
                promise.reject();
            });
        
        wordpressModule.initialized = true;
    } else {
        console.log("wp.initialize() [" + self.id + "]: Resolve");
        promise.resolve();
    }
    
    console.log("wp.initialize() [" + self.id + "]: Exit");

    return promise;
};

wordpressModule.prototype.render = function (hub) {

    var self = this;
    var promise = new RSVP.Promise();    
    self.hubContainer = hub.createSection("wp-hub-section-" + self.id, self.templateName + "-hub");
    self.hubContainer.addClass("wp-hub-div");

    /*
    if (self.typeId === wordpresscomModule.BOOKMARKS) {
        if (self.list.length == 0) {
            var content = self.container.querySelector(".mp-module-content");
            content.parentNode.className = content.parentNode.className + ' hide';
           
           
        }
        promise.resolve();
    }
    else {*/
    
    self.fetch(0).then(function () {


        var viewData = { posts: [], title: self.title, id: self.id };
        for (var i = 0; i < Math.min(self.hubSize, self.list.length); i++) {
            viewData.posts.push(self.list[i]);
        }
        var content = $.Mustache.render(self.templateName + "-hub", viewData);
        // setup event handlers
        self.hubContainer.html(content);
        $('#content #ip-hub').on('click', "#wp-hub-section-" + self.id + ' .wp-hub-title', function(e) { self.showCategory(this, self); });
        $('#content #ip-hub').on('click', "#wp-hub-section-" + self.id + ' .wp-post-div', function (e) { self.showPost(this, self); });
        
        $('#header').on('click', '#bookMarkButton', function (e) {
            
            self.addBookmark(this, self);
        });
        
        // render Panel
        self.renderPanel();
        ideaPress.addMenuItem(self.title, 'wp-module-' + self.id);
        
        promise.resolve();
    }, function() {
        promise.reject();
    });

    return promise;
};

wordpressModule.prototype.renderPanel = function() {
    var module = this;
    module.panel = view.createPanel('wp-module-' + module.id, module.templateName, module.title);

    var viewData = { posts: [], title: module.title, id: module.id };
    for (var i = 0; i < module.list.length; i++) {
        viewData.posts.push(module.list[i]);
    }

    var content = $.Mustache.render(this.templateName + "-list", viewData);

    module.panel.append(content);
    module.panel.update();
    $('#content #wp-module-' + module.id).on('click', '.wp-post-div', function (e) {
        module.showPost(this, module);
    });

};

// Fetch data and update UI
wordpressModule.prototype.update = function (page) {
    var self = this;
    if (false !== self.fetching) {
        self.fetching.abort();
    }
    
    if (!page)
        page = 0;
    
    console.log('fetching ajax...');

    return self.fetch(page).then(function () {
        console.log('fetching done...');
        var viewData = { posts: [] };
        for (var item in self.list) {
            console.log('item...' + self.list[item].title);
            viewData.posts.push(self.list[item]);
        }
        var content = $.Mustache.render(self.templateName, viewData);
        //view.append(self.pageContainer, content);
    },
    function (e) {
        alert('failed', e);
    });
};
// Refresh data and update UI
wordpressModule.prototype.refresh = function (fetch) {
    if (fetch) {
        
    }
    this.renderPanel();
};
// Cancel any WinJS.xhr in progress
wordpressModule.prototype.cancel = function () {
    if (this.fetching)
        this.fetching.abort();
};

// TODO: Search and notification?


/* 
============================================================================     Module Internal Methods     =============================================================//
*/

// Fetch pages, posts or bookmarks
wordpressModule.prototype.fetch = function (page) {
    var self = this;
    var promise = new RSVP.Promise();

    var url = self.apiURL;
    var queryString;

    if (self.typeId == wordpressModule.PAGES) {
        promise.resolve();
    } else if (self.typeId == wordpressModule.BOOKMARKS) {
        var bookmarks = self.getBookmarks();
        self.post_count = bookmarks.post_count;
        self.lastFetched = bookmarks.lastFetched;

        self.list.length = 0;

        for (var j = 0; j < bookmarks.posts.length; j++) {
            bookmarks.posts[j].module = self;
            self.list.push(bookmarks.posts[j]);
        }
        self.totalCount = bookmarks.posts.length;

        promise.resolve();
    } else {
        /*
        if (self.typeId == wordpressModule.MOSTRECENT)
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&order_by=date&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();
        else
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&category=' + self.categoryId + '&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();
        */
        if (self.typeId == wordpressModule.MOSTRECENT)
            queryString = '?json=get_recent_posts&count=' + self.defaultCount +'&number=' + self.pageSize + "&page=" + (page + 1) + "&t=" + new Date().getUTCMilliseconds();
        else
            queryString = '?json=get_category_posts&id=' + self.categoryId + '&number=' + self.pageSize  + '&count=' + self.defaultCount + "&page=" + (page + 1) + "&t=" + new Date().getUTCMilliseconds();

        
        var fullUrl = url + queryString;
 
        var headers = { "User-Agent": self.userAgent };
        var localStorageObject = self.loadFromStorage();
        if (self.shouldFetch(localStorageObject, page)) {
            console.log("call " + fullUrl);
            self.fetching = $.ajax({
                type: 'GET',
                url: fullUrl,
                xxx : true,
                headers: headers,
                cache: false,
                success: function(r) {
                    var data = r;
                    if (data.status !== "ok" || data.count === "0") {
                        self.maxPagingIndex = page;
                        promise.resolve();
                    } else {
                        self.totalCount = data.count;
                        console.log("call done");

                        if (data.count > 0) {
                            self.maxPagingIndex = page;
                            var items = self.addItemsToList(data.posts);
                            localStorageObject = { 'post_count': self.totalCount, 'posts': [], 'lastFetched': new Date() };

                            for (var item in items) {
                                localStorageObject.posts.push(data.posts[item]);
                            }
                            self.saveToStorage(localStorageObject);
                        }

                        promise.resolve();
                    }
                },
                error: function (e) {
                    for (var i in e) {
                        if (e[i])
                            console.log("wp.fetch() error: " + i + " " + e[i]);
                    }
                    localStorageObject = self.loadFromStorage();
                    if (localStorageObject != null && localStorageObject.posts != null)
                        self.addItemsToList(localStorageObject.posts);

                    promise.reject();
                    self.fetching = false;
                }
            });
        } else {
            if (!localStorageObject) {
                promise.reject();
            } else {
                self.addItemsToList(localStorageObject.posts);
                self.lastFetched = localStorageObject.lastFetched;
                self.totalCount = localStorageObject.post_count;
                promise.resolve();
            }
        }
    }
    
    return promise;
};

// Check if module show call API or read from local storage
wordpressModule.prototype.shouldFetch = function (localStorageObject, page) {
    // TODO: turn off localstorage for development
    return true;
    if (localStorageObject) {
        if (page && page > this.maxPagingIndex) {
            return true;
        }

        if (this.typeId == wordpresscomModule.PAGES) {
            if (localStorageObject.pages && localStorageObject.pages.length > 0) {
                if (new Date() - new Date(localStorageObject.lastFetched) < 360000) {
                    return false;
                }
            }
        } else {
            if (localStorageObject.posts && localStorageObject.posts.length > 0) {
                if (new Date() - new Date(localStorageObject.lastFetched) < 360000) {
                    return false;
                }
            }
        }
    }
    return true;
};

// Load from local storage
wordpressModule.prototype.loadFromStorage = function () {
    var storage = util.loadFromStorage(this.localStorageKey);
    if (storage != null) {
        var localStorageObject = JSON.parse(storage);
        this.lastFetched = localStorageObject.lastFetched;
        return localStorageObject;
    }
    return null;
};

// Save to local storage
wordpressModule.prototype.saveToStorage = function (data) {
    util.saveToStorage(this.localStorageKey, JSON.stringify(data));
};

// Navigate to Detail page
wordpressModule.prototype.showPost = function (e, module) {
    var id = $(e).attr('rel');
    this.currentPostId = id;
    var post = null;
    for (var i in module.list) {
        if (module.list[i].id == id)
            post = module.list[i];
    }
    var p = view.createPanel('wp-post-' + post.id, module.templateName, module.title);
    console.log('show...' + post.title);

    var content = $.Mustache.render(this.templateName + "-post-content", post);
    p.append(content);
    //content.attr("rel", post.id);
    p.navigateTo();

};

wordpressModule.prototype.showCategory = function (e, module) {
    var p = module.panel;
    p.navigateTo();
};


// Add post to list
wordpressModule.prototype.addItemsToList = function (jsonPosts) {
    var self = this;
    var itemArray = new Array();
    for (var key in jsonPosts) {
        var item = self.convertItem(jsonPosts[key], 'post');
        item.module = self;
        item.categories = jsonPosts[key].categories;


        item.className = "wp-item wp-item-" + key;

        var insert = true;
        self.list.forEach(function (value) {
            if (value.id == item.id) {
                insert = false;
            }
        });
        if (insert) {
            self.list.push(item);
            itemArray.push(item);
        }
    }
    return itemArray;

};

// Add page to list
wordpressModule.prototype.addPagesToList = function (jsonPages) {
    var self = this;
    var itemArray = new Array();

    for (var index in jsonPages) {
        var item = jsonPages[index];

        item.module = self;

        item.className = "wp-item wp-item-" + index;

        var insert = true;
        self.list.forEach(function (value) {
            if (value.id == item.id) {
                insert = false;
            }
        });
        if (insert) {
            self.list.push(item);
            itemArray.push(item);
        }
    }
    return;
};

// Translate page to local object
wordpressModule.prototype.convertPage = function (item, list, parentId) {
    var res = {
        type: 'page',
        title: util.decodeEntities(item.title),
        id: item.id,
        content: item.content,
        timestamp: item.date.substr(0, 10),
        permalink: item.URL.replace(/^https:/, 'http:'),
        date: item.date.replace(' ', 'T'),
        authorId: item.author.id,
        authorName: item.author.name,
        comments: item.comments,
        parentId: parentId,
        hasChildren: false
    };
    
    res.datetime = Date.parse(res.date);
    if (res.datetime !== NaN)
        res.ago = util.timeSince(res.date);


    res.description = "";
    // get the first image from attachments
    res.imgUrl = 'img/blank.png';
    res.imgThumbUrl = 'img/blank.png';

    /*if (item.featured_image) {
        res.imgUrl = item.featured_image;
        res.imgThumbUrl = item.featured_image + "?h=220";  // TODO: resize based on CSS size?
    }*/
    if (item.thumbnail) {
        
        res.imgThumbUrl = item.thumbnail + "?h=220";
    }
    else{
    
    var found = false;
        for (var i in item.attachments) {
            if (item.attachments[i].images != null) {
                res.imgUrl = item.attachments[i].images.full.url;
                if (item.attachments[i].images.medium) {
                    res.imgThumbUrl = item.attachments[i].images.medium.url;
                    found = true;
                }
                break;
            }
        }
    }
    var imgUrlStyle = res.imgThumbUrl;
    res.imgUrlStyle = "url('" + imgUrlStyle + "')";

    // we are ok as long as Wordpress doesn't allow cyclic parent-children relationship!
    for (var j in item.children) {
        this.convertPage(item.children[j], list, res.id);
        res.hasChildren = true;
    }
    res.subtitle = "";
    if (this.pageIds.length == 0 || this.pageIds.indexOf(res.id) > -1) {
        list.push(res);
    }
    return;
};

// Translate Post to local object
wordpressModule.prototype.convertItem = function (item, type) {
    var res = {
        type: type,
        title: util.decodeEntities(item.title),
        id: item.id,
        content: item.content,
        timestamp: item.date.substr(0, 10),
        permalink: item.url.replace(/^https:/, 'http:'),
        date: item.date.replace(' ', 'T'),
        authorId: item.author.id,
        authorName: item.author.name,
        comments: item.comments,
    };

    res.datetime = Date.parse(res.date);
    if (res.datetime !== NaN)
        res.ago = util.timeSince(res.date);
        
    res.description = res.title;

    if (res.description) {
        if (res.description.length > 180) {
            res.description = res.description.substr(0, 177) + "...";
        }
    } else {
        res.description = "";
    }

    // get the first image from attachments
    res.imgUrl = 'img/blank.png';
    res.imgThumbUrl = 'img/blank.png';

    /*if (item.featured_image) {
        res.imgUrl = item.featured_image;
        res.imgThumbUrl = item.featured_image + "?h=220";  // TODO: resize based on CSS size?
    }*/
    var itemThumbnail = item.thumbnail;
    if (itemThumbnail) {
        res.imgThumbUrl = itemThumbnail + "?h=220";
        res.imgUrl = itemThumbnail;
    }
    else {
        for (var i in item.attachments) {
            if (item.attachments[i].url) {
                res.imgUrl = item.attachments[i].url;
                res.imgThumbUrl = item.attachments[i].url + "?h=220";  // TODO: resize based on CSS size?
                break;
            }
        }
    }

    var imgUrlStyle = res.imgThumbUrl;
    res.imgUrlStyle = "url('" + imgUrlStyle + "')";

    var subtitle = '';
    if (item.categories) {
        for (var j in item.categories) {
            subtitle = subtitle + ', ' + util.decodeEntities(item.categories[j].name);
        }
        res.subtitle = subtitle.substring(2);
        
    }
    return res;

};

// Get Bookmarks from local storage
wordpressModule.prototype.getBookmarks = function () {
    var self = this;
    if (!util.loadFromStorage(self.localStorageBookmarkKey)) {
        util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify({ 'post_count': 0, 'posts': [], 'lastFetched': new Date() }));
    }

    this.bookmarks = JSON.parse(util.loadFromStorage(self.localStorageBookmarkKey));
    return this.bookmarks;
};

// Check if a post has been bookmarked
wordpressModule.prototype.checkIsBookmarked = function (id) {
    var bookmarks = this.getBookmarks();
    for (var index in bookmarks.posts) {
        if (id == bookmarks.posts[index].id)
            return true;
    }
    return false;
};

// Add post to bookmark
wordpressModule.prototype.addBookmark = function (e, module) {
    if (!this.currentPostId) {
        return;
    }
    var postId = this.currentPostId;
    var post = null;
    for (var i in module.list) {
        if (module.list[i].id == postId)
            post = module.list[i];
    }


    var isBookmarked = this.checkIsBookmarked(postId);
    if (!isBookmarked) {
        var copyItem = ideaPress.clone(post);
        
        var self = this;

        var bookmarks = self.getBookmarks();
        for (var index in bookmarks.posts) {
            if (copyItem.id == bookmarks.posts[index].id) {
                return;
            }
        }
        
        copyItem.module = null;
        bookmarks.posts.push(copyItem);
        bookmarks.post_count = bookmarks.posts.length;
        util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify(bookmarks));
        
        //updateButton(true);
    }
};

// Remove post to bookmark
wordpressModule.prototype.removeBookmark = function (id) {
    var self = this;
    var bookmarks = self.getBookmarks();
    for (var index in bookmarks.posts) {
        if (id == bookmarks.posts[index].id) {
            bookmarks.posts.splice(index, 1);
            break;
        }
    }
    bookmarks.post_count = bookmarks.posts.length;
    util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify(bookmarks));
};

wordpressModule.prototype.searchInit = function () {
    var self = this;

    if (self.typeId === wordpressModule.SEARCH) {
        self.searchPage = view.createPanel('search-result', self.templateName, 'Search Result');
    }
};

// Search for posts thru API
wordpressModule.prototype.search = function (query) {
    var self = this;
   /*
        var queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=5&search=' + query;

        var fullUrl = self.apiURL + queryString;
        var headers = { "User-Agent": self.userAgent };

        if (false !== self.fetching) {
            self.fetching.cancel();
            return;
        }

        self.fetching = $.ajax({
            type: 'GET',
            url: fullUrl,
            xxx: true,
            headers: headers,
            cache: false,
            success: function (r) {
                var data = r;
                
                if (data.found == undefined || data.found == "0") {
                    //self.maxPagingIndex = page;
                    //promise.resolve();
                    return;
                } else {
                    var content = "search result: Empty ...";
                    self.totalCount = data.found;
                    console.log("search call done");
                    if (data.found > 0) {
                        
                        //self.maxPagingIndex = page;
                        var items = self.addItemsToList(data.posts);
                        
                        var viewData = { posts: [], title: 'Search-result', id: 7};
                        for (var i = 0 ; i < items.length; i++) {
                            viewData.posts.push(items[i]);
                        }
                        content = $.Mustache.render(self.templateName + "-list", viewData);
                        
                    }
                    if (self) {
                        //var p = view.createPage('wpc-post-' + post.id, module.templateName, module.title);
                        //var selfsearchPage = view.createPage('search-result', self.templateName, 'Search Result');
                        //self.searchPage.html("");
                        self.searchPage.html(content);
                        self.searchPage.update();
                        self.searchPage.navigateTo();
                        $('#content #search-result').on('click', '.wpc-post-div', function (e) {
                            self.showPost(this, self);
                        });


                        //self.searchPage.appendContent(content);
                        //self.searchPage.navigateTo();
                    }
                    //promise.resolve();
                    return;
                }                
            },
            error: function (e) {
                
                alert('failed');
            }
        });*/
};
