/*
IdeaPress Wordpress.COM API module
Author: IdeaNotion
*/
var wordpresscomModule = function (ideaPress, options) {
    this.templtePrefix = "wpc";
    this.ideaPress = ideaPress;
    this.list = [];
    this.localStorageBookmarkKey = "wpcom-bookmark";
    this.apiURL = 'https://public-api.wordpress.com/';
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
wordpresscomModule.PAGES = 0;
wordpresscomModule.MOSTRECENT = 1;
wordpresscomModule.CATEGORY = 2;
wordpresscomModule.BOOKMARKS = 3;
wordpresscomModule.SEARCH = 4;

wordpresscomModule.initialized = false;

/* 
============================================================================     External Methods     =============================================================//
*/
// load templates
wordpresscomModule.prototype.initialize = function (elem) {
    var self = this;
    console.log("wpc.initialize() [" + self.id + "]: Enter");
    /*
var share = new Share();
share.show({
    subject: 'I like turtles',
    text: 'http://www.mndaily.com'},
    function() {alert('Share SUCCESS')}, // Success function
    function() {alert('Share failed')} // Failure function

);*/


    var promise = new RSVP.Promise();
    if (!wordpresscomModule.initialized) {
        // file://www/modules/wordpressCom/pages/wpcom.template.html
        console.log("wpc.initialize(): loading " + LOCALPATH + "modules/wordpressCom/pages/wpcom.template.html");

        $.Mustache.load(LOCALPATH + "modules/wordpressCom/pages/wpcom.template.html", function() {
            console.log("wpc.initialize() [" + self.id + "]: Ajax Resolve");
            promise.resolve();
            },
            function() {
                console.log("wpc.initialize() [" + self.id + "]: Ajax Reject");
                promise.reject();
            });
        
        wordpresscomModule.initialized = true;

        
        $('#header').on('click', '#bookMarkButton', function (e) {
            self.addBookmark(this, self);
        });
                
    } else {
        console.log("wpc.initialize() [" + self.id + "]: Resolve");
        promise.resolve();
    }
    
    console.log("wpc.initialize() [" + self.id + "]: Exit");

    return promise;
};

wordpresscomModule.prototype.render = function(hub) {
    var self = this;
    var promise = new RSVP.Promise();    
    self.hubContainer = hub.createSection("wpc-hub-section-" + self.id, self.templateName + "-hub");
    self.hubContainer.addClass("wpc-hub-div");

        self.fetch(0).then(function() {


            var viewData = { posts: [], title: self.title, id: self.id };
            for (var i = 0; i < Math.min(self.hubSize, self.list.length); i++) {
                viewData.posts.push(self.list[i]);
            }
            var content = $.Mustache.render(self.templateName + "-hub", viewData);
            // setup event handlers
            self.hubContainer.html(content);
            $('#content #ip-hub').on('click', "#wpc-hub-section-" + self.id + ' .wpc-hub-title', function(e) { self.showCategory(this, self); });
            $('#content #ip-hub').on('click', "#wpc-hub-section-" + self.id + ' .wpc-post-div', function(e) { self.showPost(this, self); });
            /*
            $('#header').on('click', '#bookMarkButton', function (e) {
                alert('from 113 wpcom');
                self.addBookmark(this, self);
            });*/

            // render Panel
            self.renderPanel();
            ideaPress.addMenuItem(self.title, 'wpc-module-' + self.id, self.id);

            promise.resolve();
        }, function() {
            promise.reject();
        });

    return promise;
};

wordpresscomModule.prototype.renderPanel = function() {
    var module = this;
    module.panel = view.createPanel('wpc-module-' + module.id, module.templateName, module.title);

    var viewData = { posts: [], title: module.title, id: module.id };
    for (var i = 0; i < module.list.length; i++) {
        viewData.posts.push(module.list[i]);
    }

    var content = $.Mustache.render(this.templateName + "-list", viewData);

    module.panel.append(content);
    module.panel.update();
    $('#content #wpc-module-' + module.id).on('click', '.wpc-post-div', function (e) {
        module.showPost(this, module);
    });

};

// Fetch data and update UI
wordpresscomModule.prototype.update = function (page) {
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
wordpresscomModule.prototype.refresh = function (fetch) {
    if (fetch) {
        
    }
    this.renderPanel();
};
// Cancel any WinJS.xhr in progress
wordpresscomModule.prototype.cancel = function () {
    if (this.fetching)
        this.fetching.abort();
};

// TODO: Search and notification?


/* 
============================================================================     Module Internal Methods     =============================================================//
*/

// Fetch pages, posts or bookmarks
wordpresscomModule.prototype.fetch = function (page) {
    var self = this;
    var promise = new RSVP.Promise();

    var url = self.apiURL;
    var queryString;

    if (self.typeId == wordpresscomModule.PAGES) {
        promise.resolve();
    } else if (self.typeId == wordpresscomModule.BOOKMARKS) {
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

        if (self.typeId == wordpresscomModule.MOSTRECENT)
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&order_by=date&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();
        else
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&category=' + self.categoryId + '&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();

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
                    if (data.found == undefined || data.found == "0") {
                        self.maxPagingIndex = page;
                        promise.resolve();
                    } else {
                        self.totalCount = data.found;
                        console.log("call done");

                        if (data.found > 0) {
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
                            console.log("wpcom.fetch() error: " + i + " " + e[i]);
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
wordpresscomModule.prototype.shouldFetch = function (localStorageObject, page) {
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
wordpresscomModule.prototype.loadFromStorage = function () {
    var storage = util.loadFromStorage(this.localStorageKey);
    if (storage != null) {
        var localStorageObject = JSON.parse(storage);
        this.lastFetched = localStorageObject.lastFetched;
        return localStorageObject;
    }
    return null;
};

// Save to local storage
wordpresscomModule.prototype.saveToStorage = function (data) {
    util.saveToStorage(this.localStorageKey, JSON.stringify(data));
};

// Navigate to Detail page
wordpresscomModule.prototype.showPost = function (e, module) {
    var id = $(e).attr('rel');
    this.currentPostId = id;
    var self = this;

    
    var isBookmarked = this.checkIsBookmarked(id);
    
    if (isBookmarked) {
        
        $('#bookMarkButton').hide();
        $('#unbookMarkButton').show();
        $('#unbookMarkButton').bind('click', function (e) {
            self.removeBookmark(parseInt(id), self);
        });
    } else {
        $('#bookMarkButton').show();
        $('#unbookMarkButton').unbind('click');
            
        $('#unbookMarkButton').hide();
    }

    var post = null;
    for (var i in module.list) {
        if (module.list[i].id == id)
            post = module.list[i];
    }
    var p = view.createPanel('wpc-post-' + post.id, module.templateName, module.title);
    console.log('show...' + post.title);

    var content = $.Mustache.render(this.templateName + "-post-content", post);
    p.append(content);
    //content.attr("rel", post.id);
    p.navigateTo();

};

wordpresscomModule.prototype.showCategory = function (e, module) {
    var p = module.panel;
    p.navigateTo();
};


// Add post to list
wordpresscomModule.prototype.addItemsToList = function (jsonPosts) {
    var self = this;
    var itemArray = new Array();
    for (var key in jsonPosts) {
        var item = self.convertItem(jsonPosts[key], 'post');
        item.module = self;
        item.categories = jsonPosts[key].categories;


        item.className = "wpc-item wpc-item-" + key;

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
wordpresscomModule.prototype.addPagesToList = function (jsonPages) {
    var self = this;
    var itemArray = new Array();

    for (var index in jsonPages) {
        var item = jsonPages[index];

        item.module = self;

        item.className = "wpc-item wpc-item-" + index;

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
wordpresscomModule.prototype.convertPage = function (item, list, parentId) {
    var res = {
        type: 'page',
        title: util.decodeEntities(item.title),
        id: item.ID,
        content: item.content,
        timestamp: item.date.substr(0, 10),
        permalink: item.URL.replace(/^https:/, 'http:'),
        date: item.date.replace(' ', 'T'),
        authorId: item.author.ID,
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
    res.imgUrl = 'ms-appx:/images/blank.png';
    res.imgThumbUrl = 'ms-appx:/images/blank.png';

    if (item.featured_image) {
        res.imgUrl = item.featured_image;
        res.imgThumbUrl = item.featured_image + "?h=220";  // TODO: resize based on CSS size?
    }
    else {
        for (var i in item.attachments) {
            if (item.attachments[i].URL) {
                res.imgUrl = item.attachments[i].URL;
                res.imgThumbUrl = item.attachments[i].URL + "?h=220";  // TODO: resize based on CSS size?
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
wordpresscomModule.prototype.convertItem = function (item, type) {
    var res = {
        type: type,
        title: util.decodeEntities(item.title),
        id: item.ID,
        content: item.content,
        timestamp: item.date.substr(0, 10),
        permalink: item.URL.replace(/^https:/, 'http:'),
        date: item.date.replace(' ', 'T'),
        authorId: item.author.ID,
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
    res.imgUrl = '/images/cordova.png';
    res.imgThumbUrl = '/images/blank.png';

    if (item.featured_image) {
        res.imgUrl = item.featured_image;
        res.imgThumbUrl = item.featured_image + "?h=220";  // TODO: resize based on CSS size?
    }
    else {
        for (var i in item.attachments) {
            if (item.attachments[i].URL) {
                res.imgUrl = item.attachments[i].URL;
                res.imgThumbUrl = item.attachments[i].URL + "?h=220";  // TODO: resize based on CSS size?
                break;
            }
        }
    }

    var imgUrlStyle = res.imgThumbUrl;
    res.imgUrlStyle = "url('" + imgUrlStyle + "')";

    var subtitle = '';
    for (var j in item.categories) {
        subtitle = subtitle + ', ' + util.decodeEntities(item.categories[j].name);
    }
    res.subtitle = subtitle.substring(2);

    return res;

};

// Get Bookmarks from local storage
wordpresscomModule.prototype.getBookmarks = function () {
    var self = this;
    if (!util.loadFromStorage(self.localStorageBookmarkKey)) {
        util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify({ 'post_count': 0, 'posts': [], 'lastFetched': new Date() }));
    }

    this.bookmarks = JSON.parse(util.loadFromStorage(self.localStorageBookmarkKey));
    return this.bookmarks;
};

// Check if a post has been bookmarked
wordpresscomModule.prototype.checkIsBookmarked = function (id) {
    var bookmarks = this.getBookmarks();
    for (var index in bookmarks.posts) {
        if (id == bookmarks.posts[index].id)
            return true;
    }
    return false;
};

// Add post to bookmark
wordpresscomModule.prototype.addBookmark = function (e, module) {
    
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
        var copyItem = util.clone(post);
        
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
wordpresscomModule.prototype.removeBookmark = function (id) {
    alert('remove');
    var self = this;
    var bookmarks = self.getBookmarks();
    for (var index in bookmarks.posts) {
        if (id === bookmarks.posts[index].id) {
            
            bookmarks.posts.splice(index, 1);
            break;
        }
    }
    bookmarks.post_count = bookmarks.posts.length;
    util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify(bookmarks));
};
// Get comments for a post thru API
wordpresscomModule.prototype.getComments = function (postId, c, r, p) {    
    var self = this;
    //https://public-api.wordpress.com/rest/v1/sites/$site/posts/$postId/replies/
    if (false !== self.fetching) {
        self.fetching.abort();
    }

    var queryString = 'rest/v1/sites/' + this.siteDomain + '/posts/' + postId + '/replies/';
    var fullUrl = this.apiURL + queryString;
    var headers = { "User-Agent": this.userAgent };

    self.fetching = $({ type: 'GET', url: fullUrl, headers: headers }).then(
        function (result) {
            var data = JSON.parse(result.responseText);
            c(data);
            self.fetching = false;
        },
        function (result) {
            r(result);
            self.fetching = false;
        }
    );
};

wordpresscomModule.prototype.searchInit = function() {
    var self = this;

    if (self.typeId === wordpresscomModule.SEARCH) {
        self.searchPage = view.createPanel('search-result', self.templateName, 'Search Result');
    }
};

// Search for posts thru API
wordpresscomModule.prototype.search = function (query) {
    var self = this;
   
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
        });
};
