﻿/*
IdeaPress Wordpress.COM API module
Author: IdeaNotion
*/
var wordpresscomModule = function (ideaPress, options) {
    this.ideaPress = ideaPress;
    this.list = [];
    this.localStorageBookmarkKey = "wpcom-bookmark";
    this.apiURL = 'https://public-api.wordpress.com/';
    this.fetching = false;
    this.userAgent = navigator.userAgent;
    this.title = options.title;
    this.pageSize = 8;
    this.typeId = options.typeId;
    this.categoryId = options.categoryId;
    this.id = options.id;
    this.siteDomain = options.siteDomain;
    this.container = null;
    return this;
};

// Constant
wordpresscomModule.PAGES = 0;
wordpresscomModule.MOSTRECENT = 1;
wordpresscomModule.CATEGORY = 2;
wordpresscomModule.BOOKMARKS = 3;

/* 
============================================================================     External Methods     =============================================================//
*/
// Render main section with html
wordpresscomModule.prototype.render = function (elem) {
    var self = this;
    var deferred = new $.Deferred();
    ideaPress.showLoader();

    self.parentContainer = elem;
    //$.ajax({url : "file://www/modules/wordpressCom/pages/wpcom.module.html", cache : false, type : "GET"})    
    //.done(function (html) {
     
        //var scope = angular.element('#ip-container').scope();
        var newPage = $("<div data-role=page id=''><div data-role=header><h1>" + self.title + "</h1></div><div data-role=content class='content'></div></div>");

        //append it to the page container
        newPage.appendTo($.mobile.pageContainer);
        newPage.attr('id', 'wp-module-' + self.id);
        self.container = newPage;
        $.mobile.changePage(newPage);       
        deferred.resolve();
    //});
    
    return deferred;
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
        var content = self.container.find('.content');
        for (var item in self.list) {
            console.log('item...' + self.list[item].title);
            content.append($(
                '<div><h3>' + self.list[item].title + '</h3></div>'
            ));
        }
    },
    function (e) {
        alert('failed', e);
    });
};
// Refresh data and update UI
wordpresscomModule.prototype.refresh = function () {
    
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
    var defered = new $.Deferred();
    
    var url = self.apiURL;
    var queryString;

    if (self.typeId == wordpresscomModule.PAGES) {            
        deferred.resolve();
    }
    else if (self.typeId == wordpresscomModule.BOOKMARKS) {
        var bookmarks = self.getBookmarks();
        self.post_count = bookmarks.post_count;
        self.lastFetched = bookmarks.lastFetched;

        self.list.length = 0;

        for (var j = 0; j < bookmarks.posts.length; j++) {
            bookmarks.posts[j].module = self;
            self.list.push(bookmarks.posts[j]);
        }
        self.totalCount = bookmarks.posts.length;

        defered.resolve();
    }
    else {

        if (self.typeId == wordpresscomModule.MOSTRECENT)
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&order_by=date&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();
        else
            queryString = 'rest/v1/sites/' + self.siteDomain + '/posts/?number=' + self.pageSize + '&category=' + self.categoryId + '&page=' + (page + 1) + "&t=" + new Date().getUTCMilliseconds();

        var fullUrl = url + queryString;
        var headers = { "User-Agent": self.userAgent };
        var localStorageObject = self.loadFromStorage();
        if (self.shouldFetch(localStorageObject, page)) {
            console.log("call " + fullUrl);
            self.fetching = $.ajax({ type: 'GET', url: fullUrl, headers: headers }).then(function (r) {
                var data = r;
                if (data.found == undefined || data.found == "0") {
                    self.maxPagingIndex = page;
                    defered.resolve();
                }
                else {
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

                    defered.resolve();
                }
            },
            function(e) {
                console.log("call error"  + e);
                localStorageObject = self.loadFromStorage();
                if (localStorageObject != null && localStorageObject.posts != null)
                    self.addItemsToList(localStorageObject.posts);

                defered.reject();
                self.fetching = false;
            },
            function() {
                defered.notify();
                self.fetching = false;
            });
        } else {
            if (!localStorageObject) {
                defered.reject();
            }
            else {
                self.addItemsToList(localStorageObject.posts);
                self.lastFetched = localStorageObject.lastFetched;
                self.totalCount = localStorageObject.post_count;
                defered.resolve();
            }
        }
    }
    return defered;
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
wordpresscomModule.prototype.showPost = function (e) {
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
        comments: item.comments
    };
    
    //var div = $("div");
    ////div.innerHTML = item.content;
    //$(div).html(res.content);


    //res.description = div.textContent || div.innerText || "";

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
wordpresscomModule.prototype.addBookmark = function (item) {
    var self = this;

    var bookmarks = self.getBookmarks();
    for (var index in bookmarks.posts) {
        if (item.id == bookmarks.posts[index].id) {
            return;
        }
    }
    item.module = null;
    bookmarks.posts.push(item);
    bookmarks.post_count = bookmarks.posts.length;
    util.saveToStorage(self.localStorageBookmarkKey, JSON.stringify(bookmarks));
};

// Remove post to bookmark
wordpresscomModule.prototype.removeBookmark = function (id) {
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

    self.fetching = $.ajax({ type: 'GET', url: fullUrl, headers: headers }).done(
        function (result) {
            var data = JSON.parse(result.responseText);
            c(data);
            self.fetching = false;
        },
        function (result) {
            r(result);
            self.fetching = false;
        },
        function (result) {
            p(result);
        }
    );
};
