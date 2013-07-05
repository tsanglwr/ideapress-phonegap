/**
 * af.css3animate - a css3 animation library that supports chaning/callbacks
 * Copyright 2012 - Intel
 */ (function($) {
    var cache = [];
    var objId = function(obj) {
        if (!obj.afCSS3AnimateId) obj.afCSS3AnimateId = $.uuid();
        return obj.afCSS3AnimateId;
    };
    var getEl = function(elID) {
        if (typeof elID == "string" || elID instanceof String) {
            return document.getElementById(elID);
        } else if ($.is$(elID)) {
            return elID[0];
        } else {
            return elID;
        }
    };
    var getCSS3Animate = function(obj, options) {
        var tmp, id, el = getEl(obj);
        //first one
        id = objId(el);
        if (cache[id]) {
            cache[id].animate(options);
            tmp = cache[id];
        } else {
            tmp = css3Animate(el, options);
            cache[id] = tmp;
        }
        return tmp;
    };
    $.fn["css3Animate"] = function(opts) {
        //keep old callback system - backwards compatibility - should be deprecated in future versions
        if (!opts.complete && opts.callback) opts.complete = opts.callback;
        //first on
        var tmp = getCSS3Animate(this[0], opts);
        opts.complete = null;
        opts.sucess = null;
        opts.failure = null;
        for (var i = 1; i < this.length; i++) {
            tmp.link(this[i], opts);
        }
        return tmp;
    };


    $["css3AnimateQueue"] = function() {
        return new css3Animate.queue();
    };
    var translateOpen = $.feat.cssTransformStart;
    var translateClose = $.feat.cssTransformEnd;
    var transitionEnd = $.feat.cssPrefix.replace(/-/g, "") + "TransitionEnd";
    transitionEnd = ($.os.fennec || $.feat.cssPrefix === "" || $.os.ie) ? "transitionend" : transitionEnd;

    transitionEnd = transitionEnd.replace(transitionEnd.charAt(0), transitionEnd.charAt(0).toLowerCase());

    var css3Animate = (function() {

        var css3Animate = function(elID, options) {
            if (!(this instanceof css3Animate)) return new css3Animate(elID, options);

            //start doing stuff
            this.callbacksStack = [];
            this.activeEvent = null;
            this.countStack = 0;
            this.isActive = false;
            this.el = elID;
            this.linkFinishedProxy_ = $.proxy(this.linkFinished, this);

            if (!this.el) return;

            this.animate(options);

            var that = this;
            af(this.el).bind('destroy', function() {
                var id = that.el.afCSS3AnimateId;
                that.callbacksStack = [];
                if (cache[id]) delete cache[id];
            });
        };
        css3Animate.prototype = {
            animate: function(options) {

                //cancel current active animation on this object
                if (this.isActive) this.cancel();
                this.isActive = true;

                if (!options) {
                    alert("Please provide configuration options for animation of " + this.el.id);
                    return;
                }

                var classMode = !! options["addClass"];
                var scale, time;
                var timeNum = numOnly(options["time"]);
                if (classMode) {
                    //class defines properties being changed
                    if (options["removeClass"]) {
                        af(this.el).replaceClass(options["removeClass"], options["addClass"]);
                    } else {
                        af(this.el).addClass(options["addClass"]);
                    }

                } else {
                    //property by property

                    if (timeNum === 0) options["time"] = 0;

                    if (!options["y"]) options["y"] = 0;
                    if (!options["x"]) options["x"] = 0;
                    if (options["previous"]) {
                        var cssMatrix = new $.getCssMatrix(this.el);
                        options.y += numOnly(cssMatrix.f);
                        options.x += numOnly(cssMatrix.e);
                    }
                    if (!options["origin"]) options.origin = "0% 0%";

                    if (!options["scale"]) options.scale = "1";

                    if (!options["rotateY"]) options.rotateY = "0";
                    if (!options["rotateX"]) options.rotateX = "0";
                    if (!options["skewY"]) options.skewY = "0";
                    if (!options["skewX"]) options.skewX = "0";


                    if (!options["timingFunction"]) options["timingFunction"] = "linear";

                    //check for percent or numbers
                    if (typeof(options.x) == "number" || (options.x.indexOf("%") == -1 && options.x.toLowerCase().indexOf("px") == -1 && options.x.toLowerCase().indexOf("deg") == -1)) options.x = parseInt(options.x, 10) + "px";
                    if (typeof(options.y) == "number" || (options.y.indexOf("%") == -1 && options.y.toLowerCase().indexOf("px") == -1 && options.y.toLowerCase().indexOf("deg") == -1)) options.y = parseInt(options.y, 10) + "px";

                    var trans = "translate" + translateOpen + (options.x) + "," + (options.y) + translateClose + " scale(" + parseFloat(options.scale) + ") rotate(" + options.rotateX + ")";
                    if (!$.os.opera)
                        trans += " rotateY(" + options.rotateY + ")";
                    trans += " skew(" + options.skewX + "," + options.skewY + ")";
                    this.el.style[$.feat.cssPrefix + "Transform"] = trans;
                    this.el.style[$.feat.cssPrefix + "BackfaceVisibility"] = "hidden";
                    var properties = $.feat.cssPrefix + "Transform";
                    if (options["opacity"] !== undefined) {
                        this.el.style.opacity = options["opacity"];
                        properties += ", opacity";
                    }
                    if (options["width"]) {
                        this.el.style.width = options["width"];
                        properties = "all";
                    }
                    if (options["height"]) {
                        this.el.style.height = options["height"];
                        properties = "all";
                    }
                    this.el.style[$.feat.cssPrefix + "TransitionProperty"] = "all";

                    if (("" + options["time"]).indexOf("s") === -1) {
                        scale = 'ms';
                        time = options["time"] + scale;
                    } else if (options["time"].indexOf("ms") !== -1) {
                        scale = 'ms';
                        time = options["time"];
                    } else {
                        scale = 's';
                        time = options["time"] + scale;
                    }
                    if (options.delay) {
                        this.el.style[$.feat.cssPrefix + "TransitionDelay"] = options.delay;
                    }

                    this.el.style[$.feat.cssPrefix + "TransitionDuration"] = time;
                    this.el.style[$.feat.cssPrefix + "TransitionTimingFunction"] = options["timingFunction"];
                    this.el.style[$.feat.cssPrefix + "TransformOrigin"] = options.origin;

                }

                //add callback to the stack

                this.callbacksStack.push({
                    complete: options["complete"],
                    success: options["success"],
                    failure: options["failure"]
                });
                this.countStack++;

                var that = this,
                    duration;
                var style = window.getComputedStyle(this.el);
                if (classMode) {
                    //get the duration
                    duration = style[$.feat.cssPrefix + "TransitionDuration"];
                    timeNum = numOnly(duration);
                    options["time"] = timeNum;
                    if (duration.indexOf("ms") !== -1) {
                        scale = 'ms';
                    } else {
                        scale = 's';
                        options["time"] *= 1000;
                    }
                }

                //finish asap
                if (timeNum === 0 || (scale == 'ms' && timeNum < 5) || style.display == 'none') {
                    //the duration is nearly 0 or the element is not displayed, finish immediatly
                    $.asap($.proxy(this.finishAnimation, this, [false]));
                    //this.finishAnimation();
                    //set transitionend event
                } else {
                    //setup the event normally

                    this.activeEvent = function(event) {
                        clearTimeout(that.timeout);
                        that.finishAnimation(event);
                        that.el.removeEventListener(transitionEnd, that.activeEvent, false);
                    };
                    that.timeout = setTimeout(this.activeEvent, numOnly(options["time"]) + 50);
                    this.el.addEventListener(transitionEnd, this.activeEvent, false);

                }

            },
            addCallbackHook: function(callback) {
                if (callback) this.callbacksStack.push(callback);
                this.countStack++;
                return this.linkFinishedProxy_;
            },
            linkFinished: function(canceled) {
                if (canceled) this.cancel();
                else this.finishAnimation();
            },
            finishAnimation: function(event) {
                if (event && event.preventDefault) event.preventDefault();
                if (!this.isActive) return;

                this.countStack--;

                if (this.countStack === 0) this.fireCallbacks(false);
            },
            fireCallbacks: function(canceled) {
                this.clearEvents();

                //keep callbacks after cleanup
                // (if any of the callbacks overrides this object, callbacks will keep on fire as expected)
                var callbacks = this.callbacksStack;

                //cleanup
                this.cleanup();

                //fire all callbacks
                for (var i = 0; i < callbacks.length; i++) {
                    var complete = callbacks[i]['complete'];
                    var success = callbacks[i]['success'];
                    var failure = callbacks[i]['failure'];
                    //fire callbacks
                    if (complete && typeof(complete) == "function") complete(canceled);
                    //success/failure
                    if (canceled && failure && typeof(failure) == "function") failure();
                    else if (success && typeof(success) == "function") success();
                }
            },
            cancel: function() {
                if (!this.isActive) return;
                this.fireCallbacks(true); //fire failure callbacks
            },
            cleanup: function() {
                this.callbacksStack = [];
                this.isActive = false;
                this.countStack = 0;
            },
            clearEvents: function() {
                if (this.activeEvent) {
                    this.el.removeEventListener(transitionEnd, this.activeEvent, false);
                }
                this.activeEvent = null;
            },
            link: function(elID, opts) {
                var callbacks = {
                    complete: opts.complete,
                    success: opts.success,
                    failure: opts.failure
                };
                opts.complete = this.addCallbackHook(callbacks);
                opts.success = null;
                opts.failure = null;
                //run the animation with the replaced callbacks
                getCSS3Animate(elID, opts);
                //set the old callback back in the obj to avoid strange stuff
                opts.complete = callbacks.complete;
                opts.success = callbacks.success;
                opts.failure = callbacks.failure;
                return this;
            }
        };

        return css3Animate;
    })();

    css3Animate.queue = function() {
        return {
            elements: [],
            push: function(el) {
                this.elements.push(el);
            },
            pop: function() {
                return this.elements.pop();
            },
            run: function() {
                var that = this;
                if (this.elements.length === 0) return;
                if (typeof(this.elements[0]) == "function") {
                    var func = this.shift();
                    func();
                }
                if (this.elements.length === 0) return;
                var params = this.shift();
                if (this.elements.length > 0) params.complete = function(canceled) {
                        if (!canceled) that.run();
                };
                css3Animate(document.getElementById(params.id), params);
            },
            shift: function() {
                return this.elements.shift();
            }
        };
    };
})(af);
/**
 * af.scroller 
 * created by appMobi with modifications by Carlos Ouro @ Badoo and Intel
 * Supports iOS native touch scrolling
 * Optimizations and bug improvements by Intel
 * @copyright Intel
 */ (function ($) {
    var HIDE_REFRESH_TIME = 75; // hide animation of pull2ref duration in ms
    var cache = [];
    var objId = function (obj) {
        if (!obj.afScrollerId) obj.afScrollerId = $.uuid();
        return obj.afScrollerId;
    };
    $.fn["scroller"] = function (opts) {
        var tmp, id;
        for (var i = 0; i < this.length; i++) {
            //cache system
            id = objId(this[i]);
            if (!cache[id]) {
                if (!opts) opts = {};
                if (!$.feat.nativeTouchScroll) opts.useJsScroll = true;

                tmp = scroller(this[i], opts);
                cache[id] = tmp;
            } else {
                tmp = cache[id];
            }
        }
        return this.length == 1 ? tmp : this;
    };
    var boundTouchLayer = false;

    function checkConsistency(id) {
        if (!cache[id].el) {
            delete cache[id];
            return false;
        }
        return true;
    }

    function bindTouchLayer() {
        //use a single bind for all scrollers
        if (af.os.android && !af.os.chrome && af.os.webkit) {
            var androidFixOn = false;
            //connect to touchLayer to detect editMode
            $.bind($.touchLayer, ['cancel-enter-edit', 'exit-edit'], function (focusEl) {
                if (androidFixOn) {
                    androidFixOn = false;
                    //dehactivate on scroller
                    for (var el in cache)
                        if (checkConsistency(el) && cache[el].androidFormsMode) cache[el].stopFormsMode();
                }
            });
        }
        boundTouchLayer = true;
    }
    var scroller = (function () {
        var translateOpen = $.feat.cssTransformStart;
        var translateClose = $.feat.cssTransformEnd;
        var jsScroller, nativeScroller;

        //initialize and js/native mode selector
        var scroller = function (elID, opts) {

            var el;

            if (!boundTouchLayer && $.touchLayer && $.isObject($.touchLayer)) bindTouchLayer();
            else if (!$.touchLayer || !$.isObject($.touchLayer)) $.touchLayer = {};
            if (typeof elID == "string" || elID instanceof String) {
                el = document.getElementById(elID);
            } else {
                el = elID;
            }
            if (!el) {
                alert("Could not find element for scroller " + elID);
                return;
            }
            if (af.os.desktop)
                return new scrollerCore(el, opts);
            else if (opts.useJsScroll) return new jsScroller(el, opts);
            return new nativeScroller(el, opts);

        };

        //parent abstract class (common functionality)
        var scrollerCore = function (el, opts) {
            this.el = el;
            this.afEl = $(this.el);
            for (var j in opts) {
                this[j] = opts[j];
            }
        };
        scrollerCore.prototype = {
            //core default properties
            refresh: false,
            refreshContent: "Pull to Refresh",
            refreshHangTimeout: 2000,
            refreshHeight: 60,
            refreshElement: null,
            refreshCancelCB: null,
            refreshRunning: false,
            scrollTop: 0,
            scrollLeft: 0,
            preventHideRefresh: true,
            verticalScroll: true,
            horizontalScroll: false,
            refreshTriggered: false,
            moved: false,
            eventsActive: false,
            rememberEventsActive: false,
            scrollingLocked: false,
            autoEnable: true,
            blockFormsFix: false,
            loggedPcentY: 0,
            loggedPcentX: 0,
            infinite: false,
            infiniteEndCheck: false,
            infiniteTriggered: false,
            scrollSkip: false,
            scrollTopInterval: null,
            scrollLeftInterval: null,
            bubbles:true,
            lockBounce:false,
            _scrollTo: function (params, time) {
                time = parseInt(time, 10);
                if (time === 0 || isNaN(time)) {
                    this.el.scrollTop = Math.abs(params.y);
                    this.el.scrollLeft = Math.abs(params.x);
                    return;
                }
                var singleTick = 10;
                var distPerTick = (this.el.scrollTop - params.y) / Math.ceil(time / singleTick);
                var distLPerTick = (this.el.scrollLeft - params.x) / Math.ceil(time / singleTick);
                var self = this;
                var toRunY = Math.ceil(this.el.scrollTop - params.y) / distPerTick;
                var toRunX = Math.ceil(this.el.scrollLeft - params.x) / distPerTick;
                var xRun =0, yRun = 0;
                self.scrollTopInterval = window.setInterval(function () {
                    self.el.scrollTop -= distPerTick;
                    yRun++;
                    if (yRun >= toRunY) {
                        self.el.scrollTop = params.y;
                        clearInterval(self.scrollTopInterval);
                    }
                }, singleTick);

                self.scrollLeftInterval = window.setInterval(function () {
                    self.el.scrollLeft -= distLPerTick;
                    xRun++;
                    if (xRun >= toRunX) {
                        self.el.scrollLeft = params.x;
                        clearInterval(self.scrollLeftInterval);
                    }
                }, singleTick);
            },
            enable: function () {},
            disable: function () {},
            hideScrollbars: function () {},
            addPullToRefresh: function () {},
            /**
             * We do step animations for 'native' - iOS is acceptable and desktop browsers are fine
             * instead of css3
             */
            _scrollToTop: function (time) {
                this._scrollTo({
                    x: 0,
                    y: 0
                }, time);
            },
            _scrollToBottom: function (time) {
                this._scrollTo({
                    x: 0,
                    y: this.el.scrollHeight - this.el.offsetHeight
                }, time);
            },
            scrollToBottom: function (time) {
                return this._scrollToBottom(time);
            },
            scrollToTop: function (time) {
                return this._scrollToTop(time);
            },

            //methods
            init: function (el, opts) {
                this.el = el;
                this.afEl = $(this.el);
                this.defaultProperties();
                for (var j in opts) {
                    this[j] = opts[j];
                }
                //assign self destruct
                var that = this;
                var orientationChangeProxy = function () {
                    //no need to readjust if disabled...
                    if (that.eventsActive) that.adjustScroll();
                };
                this.afEl.bind('destroy', function () {
                    that.disable(true); //with destroy notice
                    var id = that.el.afScrollerId;
                    if (cache[id]) delete cache[id];
                    $.unbind($.touchLayer, 'orientationchange-reshape', orientationChangeProxy);
                });
                $.bind($.touchLayer, 'orientationchange-reshape', orientationChangeProxy);
            },
            needsFormsFix: function (focusEl) {
                return this.useJsScroll && this.isEnabled() && this.el.style.display != "none" && $(focusEl).closest(this.afEl).size() > 0;
            },
            handleEvent: function (e) {
                if (!this.scrollingLocked) {
                    switch (e.type) {
                        case 'touchstart':
                            clearInterval(this.scrollTopInterval);
                            this.preventHideRefresh = !this.refreshRunning; // if it's not running why prevent it xD
                            this.moved = false;
                            this.onTouchStart(e);
                            if(!this.bubbles)
                                e.stopPropagation();
                            break;
                        case 'touchmove':

                            this.onTouchMove(e);
                            if(!this.bubbles)
                                e.stopPropagation();
                            break;
                        case 'touchend':
                            this.onTouchEnd(e);
                            if(!this.bubbles)
                                e.stopPropagation();
                            break;
                        case 'scroll':
                            this.onScroll(e);
                            break;
                    }
                }
            },
            coreAddPullToRefresh: function (rEl) {
                if (rEl) this.refreshElement = rEl;
                //Add the pull to refresh text.  Not optimal but keeps from others overwriting the content and worrying about italics
                //add the refresh div
                var afEl;
                if (this.refreshElement === null) {
                    var orginalEl = document.getElementById(this.container.id + "_pulldown");
                    if (orginalEl !== null) {
                        afEl = af(orginalEl);
                    } else {
                        afEl = af("<div id='" + this.container.id + "_pulldown' class='afscroll_refresh' style='border-radius:.6em;border: 1px solid #2A2A2A;background-image: -webkit-gradient(linear,left top,left bottom,color-stop(0,#666666),color-stop(1,#222222));background:#222222;margin:0px;height:60px;position:relative;text-align:center;line-height:60px;color:white;width:100%;'>" + this.refreshContent + "</div>");
                    }
                } else {
                    afEl = af(this.refreshElement);
                }
                var el = afEl.get(0);

                this.refreshContainer = af("<div style=\"overflow:hidden;width:100%;height:0;margin:0;padding:0;padding-left:5px;padding-right:5px;display:none;\"></div>");
                $(this.el).prepend(this.refreshContainer.append(el, 'top'));
                this.refreshContainer = this.refreshContainer[0];
            },
            fireRefreshRelease: function (triggered, allowHide) {
                if (!this.refresh || !triggered) return;

                var autoCancel = $.trigger(this, 'refresh-release', [triggered]) !== false;
                this.preventHideRefresh = false;
                this.refreshRunning = true;
                if (autoCancel) {
                    var that = this;
                    if (this.refreshHangTimeout > 0) this.refreshCancelCB = setTimeout(function () {
                            that.hideRefresh();
                        }, this.refreshHangTimeout);
                }
            },
            setRefreshContent: function (content) {
                af(this.container).find(".afscroll_refresh").html(content);
            },
            lock: function () {
                if (this.scrollingLocked) return;
                this.scrollingLocked = true;
                this.rememberEventsActive = this.eventsActive;
                if (!this.eventsActive) {
                    this.initEvents();
                }
            },
            unlock: function () {
                if (!this.scrollingLocked) return;
                this.scrollingLocked = false;
                if (!this.rememberEventsActive) {
                    this.removeEvents();
                }
            },
            scrollToItem: function (el, where) { //TODO: add functionality for x position
                if (!$.is$(el)) el = $(el);
                var newTop,itemPos,panelTop,itemTop;
                if (where == 'bottom') {
                    itemPos = el.offset();
                    newTop = itemPos.top - this.afEl.offset().bottom + itemPos.height;
                    newTop += 4; //add a small space
                } else {
                    itemTop = el.offset().top;
                    newTop = itemTop - document.body.scrollTop;
                    panelTop = this.afEl.offset().top;
                    if (document.body.scrollTop < panelTop) {
                        newTop -= panelTop;
                    }
                    newTop -= 4; //add a small space
                }

                this.scrollBy({
                    y: newTop,
                    x: 0
                }, 0);
            },
            setPaddings: function (top, bottom) {
                var el = $(this.el);
                var curTop = numOnly(el.css('paddingTop'));
                el.css('paddingTop', top + "px").css('paddingBottom', bottom + "px");
                //don't let padding mess with scroll
                this.scrollBy({
                    y: top - curTop,
                    x: 0
                });
            },
            //freak of mathematics, but for our cases it works
            divide: function (a, b) {
                return b !== 0 ? a / b : 0;
            },
            isEnabled: function () {
                return this.eventsActive;
            },
            addInfinite: function () {
                this.infinite = true;
            },
            clearInfinite: function () {
                this.infiniteTriggered = false;
                this.scrollSkip = true;
            }
        };

        //extend to jsScroller and nativeScroller (constructs)
        jsScroller = function (el, opts) {
            this.init(el, opts);
            //test
            //this.refresh=true;
            this.container = this.el.parentNode;
            this.container.afScrollerId = el.afScrollerId;
            this.afEl = $(this.container);

            if (this.container.style.overflow != 'hidden') this.container.style.overflow = 'hidden';

            this.addPullToRefresh(null, true);
            if (this.autoEnable) this.enable(true);
            var scrollDiv;
            //create vertical scroll
            if (this.verticalScroll && this.verticalScroll === true && this.scrollBars === true) {
                scrollDiv = createScrollBar(5, 20);
                scrollDiv.style.top = "0px";
                if (this.vScrollCSS) scrollDiv.className = this.vScrollCSS;
                //scrollDiv.style.opacity = "0";
                scrollDiv.style.display='none';
                this.container.appendChild(scrollDiv);
                this.vscrollBar = scrollDiv;
                scrollDiv = null;
            }
            //create horizontal scroll
            if (this.horizontalScroll && this.horizontalScroll === true && this.scrollBars === true) {
                scrollDiv = createScrollBar(20, 5);
                scrollDiv.style.bottom = "0px";


                if (this.hScrollCSS) scrollDiv.className = this.hScrollCSS;
                //scrollDiv.style.opacity = "0";
                scrollDiv.style.display='none';
                this.container.appendChild(scrollDiv);
                this.hscrollBar = scrollDiv;
                scrollDiv = null;
            }
            if (this.horizontalScroll) this.el.style['float'] = "left";

            this.el.hasScroller = true;

        };
        nativeScroller = function (el, opts) {
           
            if(opts.nativeParent){
                el=el.parentNode;
            }
            this.init(el, opts);
            
            var $el = $(el);

            if (opts.noParent !== true) {
                var oldParent = $el.parent();

                $el.css('height', oldParent.height()).css("width", oldParent.width());
                $el.insertBefore($el.parent());
                //$el.parent().parent().append($el);
                oldParent.remove();
            }
            this.container = this.el;
            $el.css("-webkit-overflow-scrolling", "touch");
            if(opts.autoEnable)
                this.enable();
        };
        nativeScroller.prototype = new scrollerCore();
        jsScroller.prototype = new scrollerCore();




        ///Native scroller
        nativeScroller.prototype.defaultProperties = function () {

            this.refreshContainer = null;
            this.dY = this.cY = 0;
            this.dX = this.cX = 0;
            this.cancelPropagation = false;
            this.loggedPcentY = 0;
            this.loggedPcentX = 0;
            var that = this;
            this.adjustScrollOverflowProxy_ = function () {
                that.afEl.css('overflow', 'auto');
                that.afEl.parent().css("overflow","hidden");
            };
        };
        nativeScroller.prototype.enable = function (firstExecution) {
            if (this.eventsActive) return;
            this.eventsActive = true;
            //unlock overflow
            this.el.style.overflow = 'auto';
            this.el.parentNode.style.overflow="hidden";
            //set current scroll

            if (!firstExecution) this.adjustScroll();
            //set events
            this.el.addEventListener('touchstart', this, false);
            this.el.addEventListener('scroll', this, false);
        };
        nativeScroller.prototype.disable = function (destroy) {
            if (!this.eventsActive) return;
            //log current scroll
            this.logPos(this.el.scrollLeft, this.el.scrollTop);
            //lock overflow
            if (!destroy) {
                this.el.style.overflow = 'hidden';
            }
            //remove events
            this.el.removeEventListener('touchstart', this, false);
            this.el.removeEventListener('touchmove', this, false);
            this.el.removeEventListener('touchend', this, false);
            this.el.removeEventListener('scroll', this, false);
            this.eventsActive = false;
        };
        nativeScroller.prototype.addPullToRefresh = function (el, leaveRefresh) {
            this.el.removeEventListener('touchstart', this, false);
            this.el.addEventListener('touchstart', this, false);
            if (!leaveRefresh) this.refresh = true;
            if (this.refresh && this.refresh === true) {
                this.coreAddPullToRefresh(el);
                this.refreshContainer.style.position = "absolute";
                this.refreshContainer.style.top = "-60px";
                this.refreshContainer.style.height = "60px";
                this.refreshContainer.style.display = "block";
            }
        };
        nativeScroller.prototype.onTouchStart = function (e) {
            

            if(this.el.scrollTop===0)
                this.el.scrollTop=1;
            if(this.el.scrollTop===(this.el.scrollHeight - this.el.clientHeight))
                this.el.scrollTop-=1;
            
            if(this.horizontalScroll){
                if(this.el.scrollLeft===0)
                    this.el.scrollLeft=1;
                if(this.el.scrollLeft===(this.el.scrollWidth-this.el.clientWidth))
                    this.el.scrollLeft-=1;
            }
            if (this.refreshCancelCB) clearTimeout(this.refreshCancelCB);
            //get refresh ready
            this.el.addEventListener('touchmove', this,false);
            this.dY = e.touches[0].pageY;
            if (this.refresh || this.infinite) {


                if (this.refresh && this.dY < 0) {
                    this.showRefresh();

                }
            }
           
        };
        nativeScroller.prototype.onTouchMove = function (e) {
           
            var newcY = e.touches[0].pageY - this.dY;
            var newcX = e.touches[0].pageX - this.dX;
            if(this.hasVertScroll&&this.el.clientHeight==this.el.scrollHeight){
                e.preventDefault();

            }
            if(this.hasHorScroll&&this.el.clientWidth==this.el.scrollWidth){
                e.preventDefault();

            }

            if (!this.moved) {
                $.trigger(this, "scrollstart", [this.el]);
                $.trigger($.touchLayer, "scrollstart", [this.el]);
                this.el.addEventListener('touchend', this, false);
                this.moved = true;
            }

            var difY = newcY - this.cY;
            var difX = newcX-this.cX;

            //check for trigger
            if (this.refresh && (this.el.scrollTop) < 0) {
                this.showRefresh();
                //check for cancel
            } else if (this.refreshTriggered && this.refresh && (this.el.scrollTop > this.refreshHeight)) {
                this.refreshTriggered = false;
                if (this.refreshCancelCB) clearTimeout(this.refreshCancelCB);
                this.hideRefresh(false);
                $.trigger(this, 'refresh-cancel');
            }

            this.cY = newcY;
            this.cX = newcX;
        };
        nativeScroller.prototype.showRefresh = function () {
            if (!this.refreshTriggered) {
                this.refreshTriggered = true;
                $.trigger(this, 'refresh-trigger');
            }
        };
        nativeScroller.prototype.onTouchEnd = function (e) {

            var triggered = this.el.scrollTop <= -(this.refreshHeight);

            this.fireRefreshRelease(triggered, true);
            if (triggered&&this.refresh) {
                //lock in place
                this.refreshContainer.style.position = "relative";
                this.refreshContainer.style.top = "0px";
            }

            this.dY = this.cY = 0;
            this.el.removeEventListener('touchmove', this, false);
            this.el.removeEventListener('touchend', this, false);
            this.infiniteEndCheck = true;
            if (this.infinite && !this.infiniteTriggered && (Math.abs(this.el.scrollTop) >= (this.el.scrollHeight - this.el.clientHeight))) {
                this.infiniteTriggered = true;
                $.trigger(this, "infinite-scroll");
                this.infiniteEndCheck = true;
            }
            this.touchEndFired = true;
            //pollyfil for scroll end since webkit doesn't give any events during the "flick"
            var max = 200;
            var self = this;
            var currPos = {
                top: this.el.scrollTop,
                left: this.el.scrollLeft
            };
            var counter = 0;
            self.nativePolling = setInterval(function () {
                counter++;
                if (counter >= max) {
                    clearInterval(self.nativePolling);
                    return;
                }
                if (self.el.scrollTop != currPos.top || self.el.scrollLeft != currPos.left) {
                    clearInterval(self.nativePolling);
                    $.trigger($.touchLayer, 'scrollend', [self.el]); //notify touchLayer of this elements scrollend
                    $.trigger(self, "scrollend", [self.el]);
                }

            }, 20);
        };
        nativeScroller.prototype.hideRefresh = function (animate) {

            if (this.preventHideRefresh) return;

            var that = this;
            var endAnimationCb = function (canceled) {
                if (!canceled) { //not sure if this should be the correct logic....
                    that.el.style[$.feat.cssPrefix + "Transform"] = "none";
                    that.el.style[$.feat.cssPrefix + "TransitionProperty"] = "none";
                    that.el.scrollTop = 0;
                    that.logPos(that.el.scrollLeft, 0);
                }
                that.refreshContainer.style.top = "-60px";
                that.refreshContainer.style.position = "absolute";
                that.dY = that.cY = 0;
                $.trigger(that, "refresh-finish");
            };

            if (animate === false || !that.afEl.css3Animate) {
                endAnimationCb();
            } else {
                that.afEl.css3Animate({
                    y: (that.el.scrollTop - that.refreshHeight) + "px",
                    x: "0%",
                    time: HIDE_REFRESH_TIME + "ms",
                    complete: endAnimationCb
                });
            }
            this.refreshTriggered = false;
            //this.el.addEventListener('touchend', this, false);
        };
        nativeScroller.prototype.hideScrollbars = function () {};
        nativeScroller.prototype.scrollTo = function (pos, time) {
            this.logPos(pos.x, pos.y);
            pos.x *= -1;
            pos.y *= -1;
            return this._scrollTo(pos, time);
        };
        nativeScroller.prototype.scrollBy = function (pos, time) {
            pos.x += this.el.scrollLeft;
            pos.y += this.el.scrollTop;
            this.logPos(this.el.scrollLeft, this.el.scrollTop);
            return this._scrollTo(pos, time);
        };
        nativeScroller.prototype.scrollToBottom = function (time) {
            //this.el.scrollTop = this.el.scrollHeight;
            this._scrollToBottom(time);
            this.logPos(this.el.scrollLeft, this.el.scrollTop);
        };
        nativeScroller.prototype.onScroll = function (e) {
            if (this.infinite && this.touchEndFired) {
                this.touchEndFired = false;
                return;
            }
            if (this.scrollSkip) {
                this.scrollSkip = false;
                return;
            }

            if (this.infinite) {
                if (!this.infiniteTriggered && (Math.abs(this.el.scrollTop) >= (this.el.scrollHeight - this.el.clientHeight))) {
                    this.infiniteTriggered = true;
                    $.trigger(this, "infinite-scroll");
                    this.infiniteEndCheck = true;
                }
            }


            var that = this;
            if (this.infinite && this.infiniteEndCheck && this.infiniteTriggered) {

                this.infiniteEndCheck = false;
                $.trigger(that, "infinite-scroll-end");
            }
        };
        nativeScroller.prototype.logPos = function (x, y) {


            this.loggedPcentX = this.divide(x, (this.el.scrollWidth));
            this.loggedPcentY = this.divide(y, (this.el.scrollHeight));
            this.scrollLeft = x;
            this.scrollTop = y;

            if (isNaN(this.loggedPcentX))
                this.loggedPcentX = 0;
            if (isNaN(this.loggedPcentY))
                this.loggedPcentY = 0;

        };
        nativeScroller.prototype.adjustScroll = function () {
            this.adjustScrollOverflowProxy_();

            this.el.scrollLeft = this.loggedPcentX * (this.el.scrollWidth);
            this.el.scrollTop = this.loggedPcentY * (this.el.scrollHeight);
            this.logPos(this.el.scrollLeft, this.el.scrollTop);
        };



        //JS scroller
        jsScroller.prototype.defaultProperties = function () {

            this.boolScrollLock = false;
            this.currentScrollingObject = null;
            this.elementInfo = null;
            this.verticalScroll = true;
            this.horizontalScroll = false;
            this.scrollBars = true;
            this.vscrollBar = null;
            this.hscrollBar = null;
            this.hScrollCSS = "scrollBar";
            this.vScrollCSS = "scrollBar";
            this.firstEventInfo = null;
            this.moved = false;
            this.preventPullToRefresh = true;
            this.isScrolling = false;
            this.androidFormsMode = false;
            this.refreshSafeKeep = false;

            this.lastScrollbar = "";
            this.finishScrollingObject = null;
            this.container = null;
            this.scrollingFinishCB = null;
            this.loggedPcentY = 0;
            this.loggedPcentX = 0;

        };

        function createScrollBar(width, height) {
            var scrollDiv = document.createElement("div");
            scrollDiv.style.position = 'absolute';
            scrollDiv.style.width = width + "px";
            scrollDiv.style.height = height + "px";
            scrollDiv.style[$.feat.cssPrefix + 'BorderRadius'] = "2px";
            scrollDiv.style.borderRadius = "2px";
            scrollDiv.style.display="none";
            scrollDiv.className = 'scrollBar';
            scrollDiv.style.background = "black";
            return scrollDiv;
        }
        jsScroller.prototype.enable = function (firstExecution) {
            if (this.eventsActive) return;
            this.eventsActive = true;
            if (!firstExecution) this.adjustScroll();
            else
                this.scrollerMoveCSS({
                    x: 0,
                    y: 0
                }, 0);
            //add listeners
            this.container.addEventListener('touchstart', this, false);
            this.container.addEventListener('touchmove', this, false);
            this.container.addEventListener('touchend', this, false);

        };
        jsScroller.prototype.adjustScroll = function () {
            //set top/left
            var size = this.getViewportSize();
            this.scrollerMoveCSS({
                x: Math.round(this.loggedPcentX * (this.el.clientWidth - size.w)),
                y: Math.round(this.loggedPcentY * (this.el.clientHeight - size.h))
            }, 0);
        };
        jsScroller.prototype.disable = function () {
            if (!this.eventsActive) return;
            //log top/left
            var cssMatrix = this.getCSSMatrix(this.el);
            this.logPos((numOnly(cssMatrix.e) - numOnly(this.container.scrollLeft)), (numOnly(cssMatrix.f) - numOnly(this.container.scrollTop)));
            //remove event listeners
            this.container.removeEventListener('touchstart', this, false);
            this.container.removeEventListener('touchmove', this, false);
            this.container.removeEventListener('touchend', this, false);
            this.eventsActive = false;
        };
        jsScroller.prototype.addPullToRefresh = function (el, leaveRefresh) {
            if (!leaveRefresh) this.refresh = true;
            if (this.refresh && this.refresh === true) {
                this.coreAddPullToRefresh(el);
                this.el.style.overflow = 'visible';
            }
        };
        jsScroller.prototype.hideScrollbars = function () {
            if (this.hscrollBar) {
                this.hscrollBar.style.display="none";
                this.hscrollBar.style[$.feat.cssPrefix + 'TransitionDuration'] = "0ms";
            }
            if (this.vscrollBar) {
                this.vscrollBar.style.display="none";
                this.vscrollBar.style[$.feat.cssPrefix + 'TransitionDuration'] = "0ms";
            }
        };

        jsScroller.prototype.getViewportSize = function () {
            var style = window.getComputedStyle(this.container);
            if (isNaN(numOnly(style.paddingTop))) alert((typeof style.paddingTop) + '::' + style.paddingTop + ':');
            return {
                h: (this.container.clientHeight > window.innerHeight ? window.innerHeight : this.container.clientHeight - numOnly(style.paddingTop) - numOnly(style.paddingBottom)),
                w: (this.container.clientWidth > window.innerWidth ? window.innerWidth : this.container.clientWidth - numOnly(style.paddingLeft) - numOnly(style.paddingRight))
            };
        };

        jsScroller.prototype.onTouchStart = function (event) {

            this.moved = false;
            this.currentScrollingObject = null;

            if (!this.container) return;
            if (this.refreshCancelCB) {
                clearTimeout(this.refreshCancelCB);
                this.refreshCancelCB = null;
            }
            if (this.scrollingFinishCB) {
                clearTimeout(this.scrollingFinishCB);
                this.scrollingFinishCB = null;
            }


            //disable if locked
            if (event.touches.length != 1 || this.boolScrollLock) return;

            // Allow interaction to legit calls, like select boxes, etc.
            if (event.touches[0].target && event.touches[0].target.type !== undefined) {
                var tagname = event.touches[0].target.tagName.toLowerCase();
                var tagtype=event.touches[0].target.type.toLowerCase();

                if (tagname == "select" ) // stuff we need to allow
                // access to legit calls
                    return;

            }

            //default variables
            var scrollInfo = {
                //current position
                top: 0,
                left: 0,
                //current movement
                speedY: 0,
                speedX: 0,
                absSpeedY: 0,
                absSpeedX: 0,
                deltaY: 0,
                deltaX: 0,
                absDeltaY: 0,
                absDeltaX: 0,
                y: 0,
                x: 0,
                duration: 0
            };

            //element info
            this.elementInfo = {};
            var size = this.getViewportSize();
            this.elementInfo.bottomMargin = size.h;
            this.elementInfo.maxTop = (this.el.clientHeight - this.elementInfo.bottomMargin);
            if (this.elementInfo.maxTop < 0) this.elementInfo.maxTop = 0;
            this.elementInfo.divHeight = this.el.clientHeight;
            this.elementInfo.rightMargin = size.w;
            this.elementInfo.maxLeft = (this.el.clientWidth - this.elementInfo.rightMargin);
            if (this.elementInfo.maxLeft < 0) this.elementInfo.maxLeft = 0;
            this.elementInfo.divWidth = this.el.clientWidth;
            this.elementInfo.hasVertScroll = this.verticalScroll || this.elementInfo.maxTop > 0;
            this.elementInfo.hasHorScroll = this.elementInfo.maxLeft > 0;
            this.elementInfo.requiresVScrollBar = this.vscrollBar && this.elementInfo.hasVertScroll;
            this.elementInfo.requiresHScrollBar = this.hscrollBar && this.elementInfo.hasHorScroll;

            //save event
            this.saveEventInfo(event);
            this.saveFirstEventInfo(event);

            //get the current top
            var cssMatrix = this.getCSSMatrix(this.el);
            scrollInfo.top = numOnly(cssMatrix.f) - numOnly(this.container.scrollTop);
            scrollInfo.left = numOnly(cssMatrix.e) - numOnly(this.container.scrollLeft);

            this.container.scrollTop = this.container.scrollLeft = 0;
            this.currentScrollingObject = this.el;

            //get refresh ready
            if (this.refresh && scrollInfo.top === 0) {
                this.refreshContainer.style.display = "block";
                this.refreshHeight = this.refreshContainer.firstChild.clientHeight;
                this.refreshContainer.firstChild.style.top = (-this.refreshHeight) + 'px';
                this.refreshContainer.style.overflow = 'visible';
                this.preventPullToRefresh = false;
            } else if (scrollInfo.top < 0) {
                this.preventPullToRefresh = true;
                if (this.refresh) this.refreshContainer.style.overflow = 'hidden';
            }

            //set target
            scrollInfo.x = scrollInfo.left;
            scrollInfo.y = scrollInfo.top;

            //vertical scroll bar
            if (this.setVScrollBar(scrollInfo, 0, 0)) {
                if (this.container.clientWidth > window.innerWidth)
                    this.vscrollBar.style.right =  "0px";
                else
                    this.vscrollBar.style.right = "0px";
                this.vscrollBar.style[$.feat.cssPrefix + "Transition"] = '';
                // this.vscrollBar.style.opacity = 1;
            }

            //horizontal scroll
            if (this.setHScrollBar(scrollInfo, 0, 0)) {
                if (this.container.clientHeight > window.innerHeight)
                    this.hscrollBar.style.top = (window.innerHeight - numOnly(this.hscrollBar.style.height)) + "px";
                else
                    this.hscrollBar.style.bottom = numOnly(this.hscrollBar.style.height);
                this.hscrollBar.style[$.feat.cssPrefix + "Transition"] = '';
                // this.hscrollBar.style.opacity = 1;
            }

            //save scrollInfo
            this.lastScrollInfo = scrollInfo;
            this.hasMoved = false;

            this.scrollerMoveCSS(this.lastScrollInfo, 0);
      

        };
        jsScroller.prototype.getCSSMatrix = function (el) {
            if (this.androidFormsMode) {
                //absolute mode
                var top = parseInt(el.style.marginTop,10);
                var left = parseInt(el.style.marginLeft,10);
                if (isNaN(top)) top = 0;
                if (isNaN(left)) left = 0;
                return {
                    f: top,
                    e: left
                };
            } else {
                //regular transform

                var obj = $.getCssMatrix(el);
                return obj;
            }
        };
        jsScroller.prototype.saveEventInfo = function (event) {
            this.lastEventInfo = {
                pageX: event.touches[0].pageX,
                pageY: event.touches[0].pageY,
                time: event.timeStamp
            };
        };
        jsScroller.prototype.saveFirstEventInfo = function (event) {
            this.firstEventInfo = {
                pageX: event.touches[0].pageX,
                pageY: event.touches[0].pageY,
                time: event.timeStamp
            };
        };
        jsScroller.prototype.setVScrollBar = function (scrollInfo, time, timingFunction) {

            if (!this.elementInfo.requiresVScrollBar) return false;
            var newHeight = (parseFloat(this.elementInfo.bottomMargin / this.elementInfo.divHeight) * this.elementInfo.bottomMargin) + "px";
            if(numOnly(newHeight)>this.elementInfo.bottomMargin)
                newHeight=this.elementInfo.bottomMargin+"px";
            if (newHeight != this.vscrollBar.style.height) this.vscrollBar.style.height = newHeight;

            var pos = (this.elementInfo.bottomMargin - numOnly(this.vscrollBar.style.height)) - (((this.elementInfo.maxTop + scrollInfo.y) / this.elementInfo.maxTop) * (this.elementInfo.bottomMargin - numOnly(this.vscrollBar.style.height)));
            if (pos > this.elementInfo.bottomMargin) pos = this.elementInfo.bottomMargin;

            if (pos < 0) pos = 0;
            this.scrollbarMoveCSS(this.vscrollBar, {
                x: 0,
                y: pos
            }, time, timingFunction);
            return true;
        };
        jsScroller.prototype.setHScrollBar = function (scrollInfo, time, timingFunction) {
            if (!this.elementInfo.requiresHScrollBar) return false;
            var newWidth = (parseFloat(this.elementInfo.rightMargin / this.elementInfo.divWidth) * this.elementInfo.rightMargin) + "px";
            if (newWidth != this.hscrollBar.style.width) this.hscrollBar.style.width = newWidth;
            var pos = (this.elementInfo.rightMargin - numOnly(this.hscrollBar.style.width)) - (((this.elementInfo.maxLeft + scrollInfo.x) / this.elementInfo.maxLeft) * (this.elementInfo.rightMargin - numOnly(this.hscrollBar.style.width)));

            if (pos > this.elementInfo.rightMargin) pos = this.elementInfo.rightMargin;
            if (pos < 0) pos = 0;

            this.scrollbarMoveCSS(this.hscrollBar, {
                x: pos,
                y: 0
            }, time, timingFunction);
            return true;
        };

        jsScroller.prototype.onTouchMove = function (event) {


            if (this.currentScrollingObject === null) return;
            //event.preventDefault();
            var scrollInfo = this.calculateMovement(event);
            this.calculateTarget(scrollInfo);

            this.lastScrollInfo = scrollInfo;
            if (!this.moved) {
                $.trigger(this, "scrollstart");
                $.trigger($.touchLayer, "scrollstart", [this.el]);
                if (this.elementInfo.requiresVScrollBar) this.vscrollBar.style.display="block";
                if (this.elementInfo.requiresHScrollBar) this.hscrollBar.style.display="block";
            }
            this.moved = true;


            if (this.refresh && scrollInfo.top === 0) {
                this.refreshContainer.style.display = "block";
                this.refreshHeight = this.refreshContainer.firstChild.clientHeight;
                this.refreshContainer.firstChild.style.top = (-this.refreshHeight) + 'px';
                this.refreshContainer.style.overflow = 'visible';
                this.preventPullToRefresh = false;
            } else if (scrollInfo.top < 0) {
                this.preventPullToRefresh = true;
                if (this.refresh) this.refreshContainer.style.overflow = 'hidden';
            }


            this.saveEventInfo(event);
            if (this.isScrolling===false){ // && (this.lastScrollInfo.x != this.lastScrollInfo.left || this.lastScrollInfo.y != this.lastScrollInfo.top)) {
                this.isScrolling = true;
                if (this.onScrollStart) this.onScrollStart();
            }
            //proceed normally
            var cssMatrix = this.getCSSMatrix(this.el);
            this.lastScrollInfo.top = numOnly(cssMatrix.f);
            this.lastScrollInfo.left = numOnly(cssMatrix.e);

            this.recalculateDeltaY(this.lastScrollInfo);
            this.recalculateDeltaX(this.lastScrollInfo);

            //boundaries control
            this.checkYboundary(this.lastScrollInfo);
            if (this.elementInfo.hasHorScroll) this.checkXboundary(this.lastScrollInfo);


            //pull to refresh elastic

            var positiveOverflow = this.lastScrollInfo.y > 0 && this.lastScrollInfo.deltaY > 0;
            var negativeOverflow = this.lastScrollInfo.y < -this.elementInfo.maxTop && this.lastScrollInfo.deltaY < 0;
            if (positiveOverflow || negativeOverflow) {
                var overflow = positiveOverflow ? this.lastScrollInfo.y : -this.lastScrollInfo.y - this.elementInfo.maxTop;
                var pcent = (this.container.clientHeight - overflow) / this.container.clientHeight;
                if (pcent < 0.5) pcent = 0.5;
                //cur top, maxTop or 0?
                var baseTop = 0;
                if ((positiveOverflow && this.lastScrollInfo.top > 0) || (negativeOverflow && this.lastScrollInfo.top < -this.elementInfo.maxTop)) {
                    baseTop = this.lastScrollInfo.top;
                } else if (negativeOverflow) {
                    baseTop = -this.elementInfo.maxTop;
                }
                var changeY = this.lastScrollInfo.deltaY * pcent;
                var absChangeY = Math.abs(this.lastScrollInfo.deltaY * pcent);
                if (absChangeY < 1) changeY = positiveOverflow ? 1 : -1;
                this.lastScrollInfo.y = baseTop + changeY;
            }

            if(this.elementInfo.hasHorScroll){
                positiveOverflow = this.lastScrollInfo.x > 0 && this.lastScrollInfo.deltaX > 0;
                negativeOverflow = this.lastScrollInfo.x < -this.elementInfo.maxLeft && this.lastScrollInfo.deltaX < 0;
                if (positiveOverflow || negativeOverflow) {
                    var overflow = positiveOverflow ? this.lastScrollInfo.x : -this.lastScrollInfo.x - this.elementInfo.maxLeft;
                    var pcent = (this.container.clientWidth - overflow) / this.container.clientWidth;
                    if (pcent < 0.5) pcent = 0.5;
                //cur top, maxTop or 0?
                    var baseTop = 0;
                    if ((positiveOverflow && this.lastScrollInfo.left > 0) || (negativeOverflow && this.lastScrollInfo.left < -this.elementInfo.maxLeft)) {
                        baseTop = this.lastScrollInfo.left;
                    } else if (negativeOverflow) {
                        baseTop = -this.elementInfo.maxLeft;
                    }
                    var changeX = this.lastScrollInfo.deltaX * pcent;
                    var absChangeX = Math.abs(this.lastScrollInfo.deltaX * pcent);
                    if (absChangeX < 1) changeX = positiveOverflow ? 1 : -1;
                    this.lastScrollInfo.x = baseTop + changeX;
                }
            }
            if(this.lockBounce){
                if(this.lastScrollInfo.x>0)
                    this.lastScrollInfo.x=0;
                else if(this.lastScrollInfo.x*-1>this.elementInfo.maxLeft)
                    this.lastScrollInfo.x=this.elementInfo.maxLeft*-1;
                if(this.lastScrollInfo.y>0)
                    this.lastScrollInfo.y=0;
                else if(this.lastScrollInfo.y*-1>this.elementInfo.maxTop)
                    this.lastScrollInfo.y=this.elementInfo.maxTop*-1;
            }

            //move

            this.scrollerMoveCSS(this.lastScrollInfo, 0);
            this.setVScrollBar(this.lastScrollInfo, 0, 0);
            this.setHScrollBar(this.lastScrollInfo, 0, 0);

            //check refresh triggering
            if (this.refresh && !this.preventPullToRefresh) {
                if (!this.refreshTriggered && this.lastScrollInfo.top > this.refreshHeight) {
                    this.refreshTriggered = true;
                    $.trigger(this, 'refresh-trigger');
                } else if (this.refreshTriggered && this.lastScrollInfo.top < this.refreshHeight) {
                    this.refreshTriggered = false;
                    $.trigger(this, 'refresh-cancel');
                }
            }

            if (this.infinite && !this.infiniteTriggered) {
                if ((Math.abs(this.lastScrollInfo.top) >= (this.el.clientHeight - this.container.clientHeight))) {
                    this.infiniteTriggered = true;
                    $.trigger(this, "infinite-scroll");
                }
            }

        };

       

        jsScroller.prototype.calculateMovement = function (event, last) {
            //default variables
            var scrollInfo = {
                //current position
                top: 0,
                left: 0,
                //current movement
                speedY: 0,
                speedX: 0,
                absSpeedY: 0,
                absSpeedX: 0,
                deltaY: 0,
                deltaX: 0,
                absDeltaY: 0,
                absDeltaX: 0,
                y: 0,
                x: 0,
                duration: 0
            };

            var prevEventInfo = last ? this.firstEventInfo : this.lastEventInfo;
            var pageX = last ? event.pageX : event.touches[0].pageX;
            var pageY = last ? event.pageY : event.touches[0].pageY;
            var time = last ? event.time : event.timeStamp;

            scrollInfo.deltaY = this.elementInfo.hasVertScroll ? pageY - prevEventInfo.pageY : 0;
            scrollInfo.deltaX = this.elementInfo.hasHorScroll ? pageX - prevEventInfo.pageX : 0;
            scrollInfo.time = time;


            scrollInfo.duration = time - prevEventInfo.time;
            return scrollInfo;
        };

        jsScroller.prototype.calculateTarget = function (scrollInfo) {
            scrollInfo.y = this.lastScrollInfo.y + scrollInfo.deltaY;
            scrollInfo.x = this.lastScrollInfo.x + scrollInfo.deltaX;
        };
        jsScroller.prototype.checkYboundary = function (scrollInfo) {
            var minTop = this.container.clientHeight / 2;
            var maxTop = this.elementInfo.maxTop + minTop;
            //y boundaries
            if (scrollInfo.y > minTop) scrollInfo.y = minTop;
            else if (-scrollInfo.y > maxTop) scrollInfo.y = -maxTop;
            else return;
            this.recalculateDeltaY(scrollInfo);
        };
        jsScroller.prototype.checkXboundary = function (scrollInfo) {
            //x boundaries

            var minLeft=this.container.clientWidth/2;
            var maxLeft=this.elementInfo.maxLeft+minLeft;
            
            if (scrollInfo.x > minLeft) scrollInfo.x = minLeft;
            else if (-scrollInfo.x > maxLeft) scrollInfo.x = -maxLeft;
            else return;

            this.recalculateDeltaX(scrollInfo);
        };
        jsScroller.prototype.recalculateDeltaY = function (scrollInfo) {
            //recalculate delta
            var oldAbsDeltaY = Math.abs(scrollInfo.deltaY);
            scrollInfo.deltaY = scrollInfo.y - scrollInfo.top;
            newAbsDeltaY = Math.abs(scrollInfo.deltaY);
            //recalculate duration at same speed
            scrollInfo.duration = scrollInfo.duration * newAbsDeltaY / oldAbsDeltaY;

        };
        jsScroller.prototype.recalculateDeltaX = function (scrollInfo) {
            //recalculate delta
            var oldAbsDeltaX = Math.abs(scrollInfo.deltaX);
            scrollInfo.deltaX = scrollInfo.x - scrollInfo.left;
            newAbsDeltaX = Math.abs(scrollInfo.deltaX);
            //recalculate duration at same speed
            scrollInfo.duration = scrollInfo.duration * newAbsDeltaX / oldAbsDeltaX;

        };

        jsScroller.prototype.hideRefresh = function (animate) {
            var that = this;
            if (this.preventHideRefresh) return;
            this.scrollerMoveCSS({
                x: 0,
                y: 0,
                complete: function () {
                    $.trigger(that, "refresh-finish");
                }
            }, HIDE_REFRESH_TIME);
            this.refreshTriggered = false;
        };

        jsScroller.prototype.setMomentum = function (scrollInfo) {
            var deceleration = 0.0012;

            //calculate movement speed
            scrollInfo.speedY = this.divide(scrollInfo.deltaY, scrollInfo.duration);
            scrollInfo.speedX = this.divide(scrollInfo.deltaX, scrollInfo.duration);

            scrollInfo.absSpeedY = Math.abs(scrollInfo.speedY);
            scrollInfo.absSpeedX = Math.abs(scrollInfo.speedX);

            scrollInfo.absDeltaY = Math.abs(scrollInfo.deltaY);
            scrollInfo.absDeltaX = Math.abs(scrollInfo.deltaX);


            //set momentum
            if (scrollInfo.absDeltaY > 0) {
                scrollInfo.deltaY = (scrollInfo.deltaY < 0 ? -1 : 1) * (scrollInfo.absSpeedY * scrollInfo.absSpeedY) / (2 * deceleration);
                scrollInfo.absDeltaY = Math.abs(scrollInfo.deltaY);
                scrollInfo.duration = scrollInfo.absSpeedY / deceleration;
                scrollInfo.speedY = scrollInfo.deltaY / scrollInfo.duration;
                scrollInfo.absSpeedY = Math.abs(scrollInfo.speedY);
                if (scrollInfo.absSpeedY < deceleration * 100 || scrollInfo.absDeltaY < 5) scrollInfo.deltaY = scrollInfo.absDeltaY = scrollInfo.duration = scrollInfo.speedY = scrollInfo.absSpeedY = 0;
            } else if (scrollInfo.absDeltaX) {
                scrollInfo.deltaX = (scrollInfo.deltaX < 0 ? -1 : 1) * (scrollInfo.absSpeedX * scrollInfo.absSpeedX) / (2 * deceleration);
                scrollInfo.absDeltaX = Math.abs(scrollInfo.deltaX);
                scrollInfo.duration = scrollInfo.absSpeedX / deceleration;
                scrollInfo.speedX = scrollInfo.deltaX / scrollInfo.duration;
                scrollInfo.absSpeedX = Math.abs(scrollInfo.speedX);
                if (scrollInfo.absSpeedX < deceleration * 100 || scrollInfo.absDeltaX < 5) scrollInfo.deltaX = scrollInfo.absDeltaX = scrollInfo.duration = scrollInfo.speedX = scrollInfo.absSpeedX = 0;
            } else scrollInfo.duration = 0;
        };


        jsScroller.prototype.onTouchEnd = function (event) {


            if (this.currentScrollingObject === null || !this.moved) return;
            //event.preventDefault();
            this.finishScrollingObject = this.currentScrollingObject;
            this.currentScrollingObject = null;

            var scrollInfo = this.calculateMovement(this.lastEventInfo, true);

            if (!this.androidFormsMode) {
                this.setMomentum(scrollInfo);
            }
            this.calculateTarget(scrollInfo);

            //get the current top
            var cssMatrix = this.getCSSMatrix(this.el);
            scrollInfo.top = numOnly(cssMatrix.f);
            scrollInfo.left = numOnly(cssMatrix.e);

            //boundaries control
            this.checkYboundary(scrollInfo);

            if (this.elementInfo.hasHorScroll) this.checkXboundary(scrollInfo);


            var triggered = !this.preventPullToRefresh && (scrollInfo.top > this.refreshHeight || scrollInfo.y > this.refreshHeight);
            this.fireRefreshRelease(triggered, scrollInfo.top > 0);

            //refresh hang in
            if (this.refresh && triggered) {
                scrollInfo.y = this.refreshHeight;
                scrollInfo.duration = HIDE_REFRESH_TIME;
                //top boundary
            } else if (scrollInfo.y >= 0) {
                scrollInfo.y = 0;
                if (scrollInfo.top >= 0) scrollInfo.duration = HIDE_REFRESH_TIME;
                //lower boundary
            } else if (-scrollInfo.y > this.elementInfo.maxTop || this.elementInfo.maxTop === 0) {
                scrollInfo.y = -this.elementInfo.maxTop;
                if (-scrollInfo.top > this.elementInfo.maxTop) scrollInfo.duration = HIDE_REFRESH_TIME;
                //all others
            }
            ;
            if(this.elementInfo.hasHorScroll){
                if(scrollInfo.x>=0)
                {
                    scrollInfo.x=0;
                    if(scrollInfo.left>=0) scrollInfo.duration=HIDE_REFRESH_TIME;
                }
                else if(-scrollInfo.x>this.elementInfo.maxLeft||this.elementInfo.maxLeft===0){
                    scrollInfo.x=-this.elementInfo.maxLeft;
                    if(-scrollInfo.left>this.elementInfo.maxLeft) scrollInfo.duration=HIDE_REFRESH_TIME;
                }
            }

            if (this.androidFormsMode) scrollInfo.duration = 0;

            this.scrollerMoveCSS(scrollInfo, scrollInfo.duration, "cubic-bezier(0.33,0.66,0.66,1)");
            this.setVScrollBar(scrollInfo, scrollInfo.duration, "cubic-bezier(0.33,0.66,0.66,1)");
            this.setHScrollBar(scrollInfo, scrollInfo.duration, "cubic-bezier(0.33,0.66,0.66,1)");
            this.setFinishCalback(scrollInfo.duration);
            if (this.infinite && !this.infiniteTriggered) {
                if ((Math.abs(scrollInfo.y) >= (this.el.clientHeight - this.container.clientHeight))) {
                    this.infiniteTriggered = true;
                    $.trigger(this, "infinite-scroll");
                }
            }
        };

        //finish callback
        jsScroller.prototype.setFinishCalback = function (duration) {
            var that = this;
            this.scrollingFinishCB = setTimeout(function () {
                that.hideScrollbars();
                $.trigger($.touchLayer, 'scrollend', [that.el]); //notify touchLayer of this elements scrollend
                $.trigger(that, "scrollend", [that.el]);
                that.isScrolling = false;
                that.elementInfo = null; //reset elementInfo when idle
                if (that.infinite) $.trigger(that, "infinite-scroll-end");
            }, duration);
        };

        //Android Forms Fix
        jsScroller.prototype.startFormsMode = function () {
            if (this.blockFormsFix) return;
            //get prev values
            var cssMatrix = this.getCSSMatrix(this.el);
            //toggle vars
            this.refreshSafeKeep = this.refresh;
            this.refresh = false;
            this.androidFormsMode = true;
            //set new css rules
            this.el.style[$.feat.cssPrefix + "Transform"] = "none";
            this.el.style[$.feat.cssPrefix + "Transition"] = "none";
            this.el.style[$.feat.cssPrefix + "Perspective"] = "none";

            //set position
            this.scrollerMoveCSS({
                x: numOnly(cssMatrix.e),
                y: numOnly(cssMatrix.f)
            }, 0);

            //container
            this.container.style[$.feat.cssPrefix + "Perspective"] = "none";
            this.container.style[$.feat.cssPrefix + "BackfaceVisibility"] = "visible";
            //scrollbars
            if (this.vscrollBar) {
                this.vscrollBar.style[$.feat.cssPrefix + "Transform"] = "none";
                this.vscrollBar.style[$.feat.cssPrefix + "Transition"] = "none";
                this.vscrollBar.style[$.feat.cssPrefix + "Perspective"] = "none";
                this.vscrollBar.style[$.feat.cssPrefix + "BackfaceVisibility"] = "visible";
            }
            if (this.hscrollBar) {
                this.hscrollBar.style[$.feat.cssPrefix + "Transform"] = "none";
                this.hscrollBar.style[$.feat.cssPrefix + "Transition"] = "none";
                this.hscrollBar.style[$.feat.cssPrefix + "Perspective"] = "none";
                this.hscrollBar.style[$.feat.cssPrefix + "BackfaceVisibility"] = "visible";
            }

        };
        jsScroller.prototype.stopFormsMode = function () {
            if (this.blockFormsFix) return;
            //get prev values
            var cssMatrix = this.getCSSMatrix(this.el);
            //toggle vars
            this.refresh = this.refreshSafeKeep;
            this.androidFormsMode = false;
            //set new css rules
            this.el.style[$.feat.cssPrefix + "Perspective"] = 1000;
            this.el.style.marginTop = 0;
            this.el.style.marginLeft = 0;
            this.el.style[$.feat.cssPrefix + "Transition"] = '0ms linear'; //reactivate transitions
            //set position
            this.scrollerMoveCSS({
                x: numOnly(cssMatrix.e),
                y: numOnly(cssMatrix.f)
            }, 0);
            //container
            this.container.style[$.feat.cssPrefix + "Perspective"] = 1000;
            this.container.style[$.feat.cssPrefix + "BackfaceVisibility"] = "hidden";
            //scrollbars
            if (this.vscrollBar) {
                this.vscrollBar.style[$.feat.cssPrefix + "Perspective"] = 1000;
                this.vscrollBar.style[$.feat.cssPrefix + "BackfaceVisibility"] = "hidden";
            }
            if (this.hscrollBar) {
                this.hscrollBar.style[$.feat.cssPrefix + "Perspective"] = 1000;
                this.hscrollBar.style[$.feat.cssPrefix + "BackfaceVisibility"] = "hidden";
            }

        };



        jsScroller.prototype.scrollerMoveCSS = function (distanceToMove, time, timingFunction) {
            if (!time) time = 0;
            if (!timingFunction) timingFunction = "linear";
            time = numOnly(time);
            if (this.el && this.el.style) {

                //do not touch the DOM if disabled
                if (this.eventsActive) {
                    if (this.androidFormsMode) {
                        this.el.style.marginTop = Math.round(distanceToMove.y) + "px";
                        this.el.style.marginLeft = Math.round(distanceToMove.x) + "px";
                    } else {

                        this.el.style[$.feat.cssPrefix + "Transform"] = "translate" + translateOpen + distanceToMove.x + "px," + distanceToMove.y + "px" + translateClose;
                        this.el.style[$.feat.cssPrefix + "TransitionDuration"] = time + "ms";
                        this.el.style[$.feat.cssPrefix + "TransitionTimingFunction"] = timingFunction;
                    }
                }
                // Position should be updated even when the scroller is disabled so we log the change
                this.logPos(distanceToMove.x, distanceToMove.y);
            }
        };
        jsScroller.prototype.logPos = function (x, y) {

            var size;
            if (!this.elementInfo) {
                size = this.getViewportSize();
            } else {
                size = {
                    h: this.elementInfo.bottomMargin,
                    w: this.elementInfo.rightMargin
                };
            }

            this.loggedPcentX = this.divide(x, (this.el.clientWidth - size.w));
            this.loggedPcentY = this.divide(y, (this.el.clientHeight - size.h));
            this.scrollTop = y;
            this.scrollLeft = x;
        };
        jsScroller.prototype.scrollbarMoveCSS = function (el, distanceToMove, time, timingFunction) {
            if (!time) time = 0;
            if (!timingFunction) timingFunction = "linear";

            if (el && el.style) {
                if (this.androidFormsMode) {
                    el.style.marginTop = Math.round(distanceToMove.y) + "px";
                    el.style.marginLeft = Math.round(distanceToMove.x) + "px";
                } else {
                    el.style[$.feat.cssPrefix + "Transform"] = "translate" + translateOpen + distanceToMove.x + "px," + distanceToMove.y + "px" + translateClose;
                    el.style[$.feat.cssPrefix + "TransitionDuration"] = time + "ms";
                    el.style[$.feat.cssPrefix + "TransitionTimingFunction"] = timingFunction;
                }
            }
        };
        jsScroller.prototype.scrollTo = function (pos, time) {
            if (!time) time = 0;
            this.scrollerMoveCSS(pos, time);
        };
        jsScroller.prototype.scrollBy = function (pos, time) {
            var cssMatrix = this.getCSSMatrix(this.el);
            var startTop = numOnly(cssMatrix.f);
            var startLeft = numOnly(cssMatrix.e);
            this.scrollTo({
                y: startTop - pos.y,
                x: startLeft - pos.x
            }, time);
        };
        jsScroller.prototype.scrollToBottom = function (time) {
            this.scrollTo({
                y: -1 * (this.el.clientHeight - this.container.clientHeight),
                x: 0
            }, time);
        };
        jsScroller.prototype.scrollToTop = function (time) {
            this.scrollTo({
                x: 0,
                y: 0
            }, time);
        };
        return scroller;
    })();
})(af);
/**
 * af.popup - a popup/alert library for html5 mobile apps
 * @copyright Indiepath 2011 - Tim Fisher
 * Modifications/enhancements by appMobi for App Framework
 *
 */
/* EXAMPLE
 $.query('body').popup({
        title:"Alert! Alert!",
        message:"This is a test of the emergency alert system!! Don't PANIC!",
        cancelText:"Cancel me",
        cancelCallback: function(){console.log("cancelled");},
        doneText:"I'm done!",
        doneCallback: function(){console.log("Done for!");},
        cancelOnly:false,
        doneClass:'button',
        cancelClass:'button',
        onShow:function(){console.log('showing popup');}
        autoCloseDone:true, //default is true will close the popup when done is clicked.
        suppressTitle:false //Do not show the title if set to true
  });

  You can programatically trigger a close by dispatching a "close" event to it.

 $.query('body').popup({title:'Alert',id:'myTestPopup'});
  $("#myTestPopup").trigger("close");

 */
(function ($) {

    $.fn.popup = function (opts) {
        return new popup(this[0], opts);
    };
    var queue = [];
    var popup = (function () {
        var popup = function (containerEl, opts) {

            if (typeof containerEl === "string" || containerEl instanceof String) {
                this.container = document.getElementById(containerEl);
            } else {
                this.container = containerEl;
            }
            if (!this.container) {
                alert("Error finding container for popup " + containerEl);
                return;
            }

            try {
                if (typeof (opts) === "string" || typeof (opts) === "number")
                    opts = {
                        message: opts,
                        cancelOnly: "true",
                        cancelText: "OK"
                };
                this.id = id = opts.id = opts.id || $.uuid(); //opts is passed by reference
                var self = this;
                this.title = opts.suppressTitle ? "" : (opts.title || "Alert");
                this.message = opts.message || "";
                this.cancelText = opts.cancelText || "Cancel";
                this.cancelCallback = opts.cancelCallback || function () {};
                this.cancelClass = opts.cancelClass || "button";
                this.doneText = opts.doneText || "Done";
                this.doneCallback = opts.doneCallback || function (self) {
                    // no action by default
                };
                this.doneClass = opts.doneClass || "button";
                this.cancelOnly = opts.cancelOnly || false;
                this.onShow = opts.onShow || function () {};
                this.autoCloseDone = opts.autoCloseDone !== undefined ? opts.autoCloseDone : true;

                queue.push(this);
                if (queue.length == 1)
                    this.show();
            } catch (e) {
                console.log("error adding popup " + e);
            }

        };

        popup.prototype = {
            id: null,
            title: null,
            message: null,
            cancelText: null,
            cancelCallback: null,
            cancelClass: null,
            doneText: null,
            doneCallback: null,
            doneClass: null,
            cancelOnly: false,
            onShow: null,
            autoCloseDone: true,
            supressTitle: false,
            show: function () {
                var self = this;
                var markup = '<div id="' + this.id + '" class="afPopup hidden">'+
                            '<header>' + this.title + '</header>'+
                             '<div>' + this.message + '</div>'+
                             '<footer style="clear:both;">'+
                                 '<a href="javascript:;" class="' + this.cancelClass + '" id="cancel">' + this.cancelText + '</a>'+
                                 '<a href="javascript:;" class="' + this.doneClass + '" id="action">' + this.doneText + '</a>'+
                            ' </footer>'+
                         '</div></div>';
                $(this.container).append($(markup));

                var $el = $.query("#" + this.id);
                $el.bind("close", function () {
                    self.hide();
                });

                if (this.cancelOnly) {
                    $el.find('A#action').hide();
                    $el.find('A#cancel').addClass('center');
                }
                $el.find('A').each(function () {
                    var button = $(this);
                    button.bind('click', function (e) {
                        if (button.attr('id') == 'cancel') {
                            self.cancelCallback.call(self.cancelCallback, self);
                            self.hide();
                        } else {
                            self.doneCallback.call(self.doneCallback, self);
                            if (self.autoCloseDone)
                                self.hide();
                        }
                        e.preventDefault();
                    });
                });
                self.positionPopup();
                $.blockUI(0.5);

                $el.bind("orientationchange", function () {
                    self.positionPopup();
                });

                //force header/footer showing to fix CSS style bugs
                $el.find("header").show();
                $el.find("footer").show();
                setTimeout(function(){
                    $el.removeClass('hidden');
                    self.onShow(self);
                },50);
            },

            hide: function () {
                var self = this;
                $.query('#' + self.id).addClass('hidden');
                $.unblockUI();
                if(!$.os.ie&&!$.os.android){
                    setTimeout(function () {
                        self.remove();
                    }, 250);
                }
                else
                    self.remove();
            },

            remove: function () {
                var self = this;
                var $el = $.query("#" + self.id);
                $el.unbind("close");
                $el.find('BUTTON#action').unbind('click');
                $el.find('BUTTON#cancel').unbind('click');
                $el.unbind("orientationchange").remove();
                queue.splice(0, 1);
                if (queue.length > 0)
                    queue[0].show();
            },

            positionPopup: function () {
                var popup = $.query('#' + this.id);
                popup.css("top", ((window.innerHeight / 2.5) + window.pageYOffset) - (popup[0].clientHeight / 2) + "px");
                popup.css("left", (window.innerWidth / 2) - (popup[0].clientWidth / 2) + "px");
            }
        };

        return popup;
    })();
    var uiBlocked = false;
    $.blockUI = function (opacity) {
        if (uiBlocked)
            return;
        opacity = opacity ? " style='opacity:" + opacity + ";'" : "";
        $.query('BODY').prepend($("<div id='mask'" + opacity + "></div>"));
        $.query('BODY DIV#mask').bind("touchstart", function (e) {
            e.preventDefault();
        });
        $.query('BODY DIV#mask').bind("touchmove", function (e) {
            e.preventDefault();
        });
        uiBlocked = true;
    };

    $.unblockUI = function () {
        uiBlocked = false;
        $.query('BODY DIV#mask').unbind("touchstart");
        $.query('BODY DIV#mask').unbind("touchmove");
        $("BODY DIV#mask").remove();
    };

})(af);
/**
 * af.actionsheet - an actionsheet for html5 mobile apps
 * Copyright 2012 - Intel
 */
(function($) {
    $.fn["actionsheet"] = function(opts) {
        var tmp;
        for (var i = 0; i < this.length; i++) {
            tmp = new actionsheet(this[i], opts);
        }
        return this.length == 1 ? tmp : this;
    };
    var actionsheet = (function() {
        var actionsheet = function(elID, opts) {
            if (typeof elID == "string" || elID instanceof String) {
                this.el = document.getElementById(elID);
            } else {
                this.el = elID;
            }
            if (!this.el) {
                alert("Could not find element for actionsheet " + elID);
                return;
            }

            if (this instanceof actionsheet) {
                if (typeof(opts) == "object") {
                    for (var j in opts) {
                        this[j] = opts[j];
                    }
                }
            } else {
                return new actionsheet(elID, opts);
            }

            //  try {
            var that = this;
            var markStart = '<div id="af_actionsheet"><div style="width:100%">';
            var markEnd = '</div></div>';
            var markup;
            if (typeof opts == "string") {
                markup = $(markStart + opts + "<a href='javascript:;' class='cancel'>Cancel</a>" + markEnd);
            } else if (typeof opts == "object") {
                markup = $(markStart + markEnd);
                var container = $(markup.children().get(0));
                opts.push({
                    text: "Cancel",
                    cssClasses: "cancel"
                });
                for (var i = 0; i < opts.length; i++) {
                    var item = $('<a href="javascript:;" >' + (opts[i].text || "TEXT NOT ENTERED") + '</a>');
                    item[0].onclick = (opts[i].handler || function() {});
                    if (opts[i].cssClasses && opts[i].cssClasses.length > 0)
                        item.addClass(opts[i].cssClasses);
                    container.append(item);
                }
            }
            $(elID).find("#af_actionsheet").remove();
            $(elID).find("#af_action_mask").remove();
            actionsheetEl = $(elID).append(markup);

            markup.vendorCss("Transition", "all 0ms");
            markup.cssTranslate("0,0");
            markup.css("top", window.innerHeight + "px");
            this.el.style.overflow = "hidden";
            markup.on("click", "a", function() {
                that.hideSheet();
                return false;
            });
            this.activeSheet = markup;
            $(elID).append('<div id="af_action_mask" style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;z-index:9998;background:rgba(0,0,0,.4)"/>');
            setTimeout(function() {
                markup.vendorCss("Transition", "all 300ms");
                markup.cssTranslate("0," + (-(markup.height())) + "px");
            }, 10);

        };
        actionsheet.prototype = {
            activeSheet: null,
            hideSheet: function() {
                var that = this;
                this.activeSheet.off("click", "a", function() {
                    that.hideSheet();
                });
                $(this.el).find("#af_action_mask").remove();
                this.activeSheet.vendorCss("Transition", "all 0ms");
                var markup = this.activeSheet;
                var theEl = this.el;
                setTimeout(function() {
                    markup.vendorCss("Transition", "all 300ms");
                    markup.cssTranslate("0,0px");
                    setTimeout(function() {
                        markup.remove();
                        markup = null;
                        theEl.style.overflow = "none";
                    }, 500);
                }, 10);
            }
        };
        return actionsheet;
    })();
})(af);
/**
 * af.passwordBox - password box replacement for html5 mobile apps on android due to a bug with CSS3 translate3d
 * @copyright 2011 - Intel
 */
(function ($) {
    $["passwordBox"] = function () {

        return new passwordBox();
    };

    var passwordBox = function () {
            this.oldPasswords = {};
        };
    passwordBox.prototype = {
        showPasswordPlainText: false,
        getOldPasswords: function (elID) {
         //   if ($.os.android == false) return; -  iOS users seem to want this too, so we'll let everyone join the party
            var container = elID && document.getElementById(elID) ? document.getElementById(elID) : document;
            if (!container) {
                alert("Could not find container element for passwordBox " + elID);
                return;
            }
            var sels = container.getElementsByTagName("input");

            var that = this;
            for (var i = 0; i < sels.length; i++) {
                if (sels[i].type != "password") continue;

                if($.os.webkit){
                    sels[i].type = "text";
                    $(sels[i]).vendorCss("TextSecurity","disc");
                }
            }
        },

        changePasswordVisiblity: function (what, id) {
            what = parseInt(what,10);
            var theEl = document.getElementById(id);

            if (what == 1) { //show
                $(theEl).vendorCss("TextSecurity","none");
                
            } else {
                $(theEl).vendorCss("TextSecurity","disc");
            }
            if(!$.os.webkit) {
                if(what==1)
                    theEl.type="text";
                else
                    theEl.type="password";
            }
            theEl = null;
        }
    };
})(af);
/**
 * @copyright: 2011 Intel
 * @description:  This script will replace all drop downs with friendly select controls.  Users can still interact
 * with the old drop down box as normal with javascript, and this will be reflected
 */
(function($) {
    function updateOption(prop, oldValue, newValue) {
        if (newValue === true) {
            if (!this.getAttribute("multiple"))
                $.selectBox.updateMaskValue(this.parentNode.id, this.text, this.value);
            this.parentNode.value = this.value;
        }
        return newValue;
    }

    function updateIndex(prop, oldValue, newValue) {
        if (this.options[newValue]) {
            if (!this.getAttribute("multiple"))
                $.selectBox.updateMaskValue(this.linker, this.options[newValue].value, this.options[newValue].text);
            this.value = this.options[newValue].value;
        }
        return newValue;
    }

    function destroy(e) {
        var el = e.target;
        $(el.linker).remove();
        delete el.linker;
        e.stopPropagation();
    }
    $['selectBox'] = {
        scroller: null,
        currLinker: null,
        getOldSelects: function(elID) {
            if (!$.os.android || $.os.androidICS) return;
            if (!$.fn['scroller']) {
                alert("This library requires af.scroller");
                return;
            }
            var container = elID && document.getElementById(elID) ? document.getElementById(elID) : document;
            if (!container) {
                alert("Could not find container element for af.selectBox " + elID);
                return;
            }
            var sels = container.getElementsByTagName("select");
            var that = this;
            for (var i = 0; i < sels.length; i++) {

                var el = sels[i];
                el.style.display = "none";
                var fixer = $.create("div", {
                    className: "afFakeSelect"
                });
                fixer.get(0).linker = sels[i];
                el.linker = fixer.get(0);
                fixer.insertAfter(sels[i]);

                el.watch("selectedIndex", updateIndex);
                for (var j = 0; j < el.options.length; j++) {
                    var currInd = j;
                    el.options[j].watch("selected", updateOption);
                    if (el.options[j].selected)
                        fixer.html(el.options[j].text);
                }
                $(el).one("destroy", destroy);
            }
            that.createHtml();
        },
        updateDropdown: function(el) {
            if (!el) return;
            for (var j = 0; j < el.options.length; j++) {
                if (el.options[j].selected) el.linker.innerHTML = el.options[j].text;
            }
            el = null;
        },
        initDropDown: function(el) {

            var that = this;
            if (el.disabled) return;
            if (!el || !el.options || el.options.length === 0) return;
            var htmlTemplate = "";
            var foundInd = 0;
            var $scr = $("#afSelectBoxfix");
            $scr.html("<ul></ul>");
            var $list = $scr.find("ul");
            for (var j = 0; j < el.options.length; j++) {
                var currInd = j;
                el.options[j].watch("selected", updateOption);
                var checked = (el.options[j].selected) ? "selected" : "";
                if (checked) foundInd = j + 1;
                var row = $.create("li", {
                    html: el.options[j].text,
                    className: checked
                });
                row.data("ind", j);
                $list.append(row);
            }
            $("#afSelectBoxContainer").show();
            try {
                if (foundInd > 0 && el.getAttribute("multiple") != "multiple") {
                    var scrollToPos = 0;
                    var scrollThreshold = numOnly($list.find("li").computedStyle("height"));
                    var theHeight = numOnly($("#afSelectBoxContainer").computedStyle("height"));
                    if (foundInd * scrollThreshold >= theHeight) scrollToPos = (foundInd - 1) * -scrollThreshold;
                    this.scroller.scrollTo({
                        x: 0,
                        y: scrollToPos
                    });
                }
            } catch (e) {
                console.log("error init dropdown" + e);
            }

            var selClose = $("#afSelectClose").css("display") == "block" ? numOnly($("#afSelectClose").height()) : 0;
            $("#afSelectWrapper").height((numOnly($("#afSelectBoxContainer").height()) - selClose) + "px");

        },
        updateMaskValue: function(linker, value, val2) {

            $(linker).html(val2);
        },
        setDropDownValue: function(el, value) {

            if (!el) return;
            var $el = $(el);

            value = parseInt(value, 10);
            if (!el.getAttribute("multiple")) {
                el.selectedIndex = value;
                $el.find("option").prop("selected", false);
                $el.find("option:nth-child(" + (value + 1) + ")").prop("selected", true);
                this.scroller.scrollTo({
                    x: 0,
                    y: 0
                });
                this.hideDropDown();
            } else {
                //multi select

                // var myEl = $el.find("option:nth-child(" + (value + 1) + ")").get(0);
                var myList = $("#afSelectBoxfix li:nth-child(" + (value + 1) + ")");
                if (myList.hasClass("selected")) {
                    myList.removeClass("selected");
                    //  myEl.selected = false;
                } else {
                    myList.addClass("selected");
                    //  myEl.selected = true;
                }
            }
            $(el).trigger("change");
            el = null;
        },
        hideDropDown: function() {
            $("#afSelectBoxContainer").hide();
            $("#afSelectBoxfix").html("");
        },
        createHtml: function() {
            var that = this;
            if (document.getElementById("afSelectBoxfix")) {
                return;
            }
            $(document).ready(function() {
                $(document).on("click", ".afFakeSelect", function(e) {
                    if (this.linker.disabled)
                        return;
                    that.currLinker = this;

                    if (this.linker.getAttribute("multiple") == "multiple")
                        $("#afSelectClose").show();
                    else
                        $("#afSelectClose").hide();
                    that.initDropDown(this.linker);
                });
                var container = $.create("div", {
                    id: "afSelectBoxContainer"
                });
                var modalDiv = $.create("div", {
                    id: "afSelectBoxfix"
                });
                var modalWrapper = $.create("div", {
                    id: "afSelectWrapper"
                });
                modalWrapper.css("position", "relative");
                modalWrapper.append(modalDiv);
                var closeDiv = $.create("div", {
                    id: "afSelectClose",
                    html: "<a id='afSelectDone'>Done</a> <a id='afSelectCancel'>Cancel</a>"
                });


                var $afui = $("#afui");
                container.prepend(closeDiv).append(modalWrapper);
                if ($afui.length > 0) $afui.append(container);
                else document.body.appendChild(container.get(0));

                that.scroller = $.query("#afSelectBoxfix").scroller({
                    scroller: false,
                    verticalScroll: true,
                    vScrollCSS: "jqselectscrollBarV"
                });

                $("#afSelectBoxfix").on("click", "li", function(e) {
                    var $el = $(e.target);
                    that.setDropDownValue(that.currLinker.linker, $el.data("ind"));
                });
                $("#afSelectBoxContainer").on("click", "a", function(e) {
                    if (e.target.id == "afSelectCancel")
                        return that.hideDropDown();
                    var $sel = $(that.currLinker.linker);
                    $sel.find("option").prop("selected", false);

                    $("#afSelectBoxfix li").each(function(el) {
                        var $el = $(this);
                        if ($el.hasClass("selected")) {
                            var ind = parseInt($el.data("ind"), 10);
                            $sel.find("option:nth-child(" + (ind + 1) + ")").prop("selected", true);
                            that.currLinker.innerHTML = $el.html();
                        }
                    });

                    that.hideDropDown();
                });

            });
        }
    };

    //The following is based off Eli Grey's shim
    //https://gist.github.com/384583
    //We use HTMLElement to not cause problems with other objects
    if (!HTMLElement.prototype.watch) {
        HTMLElement.prototype.watch = function(prop, handler) {
            var oldval = this[prop],
                newval = oldval,
                getter = function() {
                    return newval;
                },
                setter = function(val) {
                    oldval = newval;
                    newval = handler.call(this, prop, oldval, val);
                    return newval;
                };
            if (delete this[prop]) { // can't watch constants
                if (HTMLElement.defineProperty) { // ECMAScript 5
                    HTMLElement.defineProperty(this, prop, {
                        get: getter,
                        set: setter,
                        enumerable: false,
                        configurable: true
                    });
                } else if (HTMLElement.prototype.__defineGetter__ && HTMLElement.prototype.__defineSetter__) { // legacy
                    HTMLElement.prototype.__defineGetter__.call(this, prop, getter);
                    HTMLElement.prototype.__defineSetter__.call(this, prop, setter);
                }
            }
        };
    }
    if (!HTMLElement.prototype.unwatch) {
        HTMLElement.prototype.unwatch = function(prop) {
            var val = this[prop];
            delete this[prop]; // remove accessors
            this[prop] = val;
        };
    }
})(af);
//Touch events are from zepto/touch.js
(function($) {
    var touch = {}, touchTimeout;

    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
    }

    function swipeDirection(x1, x2, y1, y2) {
        var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
        if (xDelta >= yDelta) {
            return (x1 - x2 > 0 ? 'Left' : 'Right');
        } else {
            return (y1 - y2 > 0 ? 'Up' : 'Down');
        }
    }

    var longTapDelay = 750;
    function longTap() {
        if (touch.last && (Date.now() - touch.last >= longTapDelay)) {
            touch.el.trigger('longTap');
            touch = {};
        }
    }
    var longTapTimer;
    $(document).ready(function() {
        var prevEl;
        $(document.body).bind('touchstart', function(e) {
            if(e.originalEvent)
                e=e.originalEvent;
            if(!e.touches||e.touches.length===0) return;
            var now = Date.now(), delta = now - (touch.last || now);
            if(!e.touches||e.touches.length===0) return;
            touch.el = $(parentIfText(e.touches[0].target));
            touchTimeout && clearTimeout(touchTimeout);
            touch.x1 =  e.touches[0].pageX;
            touch.y1 = e.touches[0].pageY;
            touch.x2=touch.y2=0;
            if (delta > 0 && delta <= 250)
                touch.isDoubleTap = true;
            touch.last = now;
           longTapTimer=setTimeout(longTap, longTapDelay);
            if ($.ui.useAutoPressed && !touch.el.data("ignore-pressed"))
                touch.el.addClass("pressed");
            if(prevEl && $.ui.useAutoPressed && !prevEl.data("ignore-pressed"))
                prevEl.removeClass("pressed");
            prevEl=touch.el;
        }).bind('touchmove', function(e) {
            if(e.originalEvent)
                e=e.originalEvent;
            touch.x2 = e.touches[0].pageX;
            touch.y2 = e.touches[0].pageY;
            clearTimeout(longTapTimer);
        }).bind('touchend', function(e) {
            if(e.originalEvent)
                e=e.originalEvent;
            if (!touch.el)
                return;
            if ($.ui.useAutoPressed && !touch.el.data("ignore-pressed"))
                touch.el.removeClass("pressed");
            if (touch.isDoubleTap) {
                touch.el.trigger('doubleTap');
                touch = {};
            } else if (touch.x2 > 0 || touch.y2 > 0) {
                (Math.abs(touch.x1 - touch.x2) > 30 || Math.abs(touch.y1 - touch.y2) > 30) &&
                touch.el.trigger('swipe') &&
                touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
                touch.x1 = touch.x2 = touch.y1 = touch.y2 = touch.last = 0;
            } else if ('last' in touch) {
                touch.el.trigger('tap');


                touchTimeout = setTimeout(function() {
                    touchTimeout = null;
                    if (touch.el)
                        touch.el.trigger('singleTap');
                    touch = {};
                }, 250);
            }
        }).bind('touchcancel', function() {
            if(touch.el && $.ui.useAutoPressed && !touch.el.data("ignore-pressed"))
                touch.el.removeClass("pressed");
            touch = {};
            clearTimeout(longTapTimer);

        });
    });

    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m) {
        $.fn[m] = function(callback) {
            return this.bind(m, callback);
        };
    });
})(jq);

//TouchLayer contributed by Carlos Ouro @ Badoo
//un-authoritive layer between touches and actions on the DOM
//(un-authoritive: listeners do not require useCapture)
//handles overlooking JS and native scrolling, panning,
//no delay on click, edit mode focus, preventing defaults, resizing content,
//enter/exit edit mode (keyboard on screen), prevent clicks on momentum, etc
//It can be used independently in other apps but it is required by jqUi
//Object Events
//Enter Edit Mode:
//pre-enter-edit - when a possible enter-edit is actioned - happens before actual click or focus (android can still reposition elements and event is actioned)
//cancel-enter-edit - when a pre-enter-edit does not result in a enter-edit
//enter-edit - on a enter edit mode focus
//enter-edit-reshape - focus resized/scrolled event
//in-edit-reshape - resized/scrolled event when a different element is focused
//Exit Edit Mode
//exit-edit - on blur
//exit-edit-reshape - blur resized/scrolled event
//Other
//orientationchange-reshape - resize event due to an orientationchange action
//reshape - window.resize/window.scroll event (ignores onfocus "shaking") - general reshape notice
(function($) {

    //singleton
    $.touchLayer = function(el) {
        //	if(af.os.desktop||!af.os.webkit) return;
        $.touchLayer = new touchLayer(el);
        return $.touchLayer;
    };
    //configuration stuff
    var inputElements = ['input', 'select', 'textarea'];
    var autoBlurInputTypes = ['button', 'radio', 'checkbox', 'range', 'date'];
    var requiresJSFocus = $.os.ios; //devices which require .focus() on dynamic click events
    var verySensitiveTouch = $.os.blackberry; //devices which have a very sensitive touch and touchmove is easily fired even on simple taps
    var inputElementRequiresNativeTap = $.os.blackberry || ($.os.android && !$.os.chrome); //devices which require the touchstart event to bleed through in order to actually fire the click on select elements
    var selectElementRequiresNativeTap = $.os.blackberry || ($.os.android && !$.os.chrome); //devices which require the touchstart event to bleed through in order to actually fire the click on select elements
    var focusScrolls = $.os.ios; //devices scrolling on focus instead of resizing
    var focusResizes = $.os.blackberry10;
    var requirePanning = $.os.ios; //devices which require panning feature
    var addressBarError = 0.97; //max 3% error in position
    var maxHideTries = 2; //HideAdressBar does not retry more than 2 times (3 overall)
    var skipTouchEnd = false; //Fix iOS bug with alerts/confirms
    var cancelClick = false;

    function getTime() {
        var d = new Date();
        var n = d.getTime();
        return n;
    }
    var touchLayer = function(el) {
        this.clearTouchVars();
        el.addEventListener('touchstart', this, false);
        el.addEventListener('touchmove', this, false);
        el.addEventListener('touchend', this, false);
        el.addEventListener('click', this, false);
        el.addEventListener("focusin", this, false);
        document.addEventListener('scroll', this, false);
        window.addEventListener("resize", this, false);
        window.addEventListener("orientationchange", this, false);
        this.layer = el;
        //proxies
        this.scrollEndedProxy_ = $.proxy(this.scrollEnded, this);
        this.exitEditProxy_ = $.proxy(this.exitExit, this, []);
        this.launchFixUIProxy_ = $.proxy(this.launchFixUI, this);
        var that = this;
        this.scrollTimeoutExpireProxy_ = function() {
            that.scrollTimeout_ = null;
            that.scrollTimeoutEl_.addEventListener('scroll', that.scrollEndedProxy_, false);
        };
        this.retestAndFixUIProxy_ = function() {
            if (af.os.android) that.layer.style.height = '100%';
            $.asap(that.testAndFixUI, that, arguments);
        };
        //iPhone double clicks workaround
        document.addEventListener('click', function(e) {
            if (cancelClick) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            if (e.clientX !== undefined && that.lastTouchStartX != null) {
                if (2 > Math.abs(that.lastTouchStartX - e.clientX) && 2 > Math.abs(that.lastTouchStartY - e.clientY)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, true);
        //js scrollers self binding
        $.bind(this, 'scrollstart', function(el) {
            that.isScrolling = true;
            that.scrollingEl_ = el;
            if (!$.feat.nativeTouchScroll)
                that.scrollerIsScrolling = true;
            that.fireEvent('UIEvents', 'scrollstart', el, false, false);
        });
        $.bind(this, 'scrollend', function(el) {
            that.isScrolling = false;
            if (!$.feat.nativeTouchScroll)
                that.scrollerIsScrolling = false;
            that.fireEvent('UIEvents', 'scrollend', el, false, false);
        });
        //fix layer positioning
        this.launchFixUI(5); //try a lot to set page into place
    };

    touchLayer.prototype = {
        dX: 0,
        dY: 0,
        cX: 0,
        cY: 0,
        touchStartX: null,
        touchStartY: null,
        //elements
        layer: null,
        scrollingEl_: null,
        scrollTimeoutEl_: null,
        //handles / proxies
        scrollTimeout_: null,
        reshapeTimeout_: null,
        scrollEndedProxy_: null,
        exitEditProxy_: null,
        launchFixUIProxy_: null,
        reHideAddressBarTimeout_: null,
        retestAndFixUIProxy_: null,
        //options
        panElementId: "header",
        //public locks
        blockClicks: false,
        //private locks
        allowDocumentScroll_: false,
        ignoreNextResize_: false,
        blockPossibleClick_: false,
        //status vars
        isScrolling: false,
        isScrollingVertical_: false,
        wasPanning_: false,
        isPanning_: false,
        isFocused_: false,
        justBlurred_: false,
        requiresNativeTap: false,
        holdingReshapeType_: null,
        trackingClick: false,
        scrollerIsScrolling: false,

        handleEvent: function(e) {
            switch (e.type) {
                case 'touchstart':
                    this.onTouchStart(e);
                    break;
                case 'touchmove':
                    this.onTouchMove(e);
                    break;
                case 'touchend':
                    this.onTouchEnd(e);
                    break;
                case 'click':
                    this.onClick(e);
                    break;
                case 'blur':
                    this.onBlur(e);
                    break;
                case 'scroll':
                    this.onScroll(e);
                    break;
                case 'orientationchange':
                    this.onOrientationChange(e);
                    break;
                case 'resize':
                    this.onResize(e);
                    break;
                case 'focusin':
                    this.onFocusIn(e);
                    break;
            }
        },
        launchFixUI: function(maxTries) {
            //this.log("launchFixUI");
            if (!maxTries) maxTries = maxHideTries;
            if (this.reHideAddressBarTimeout_ === null) return this.testAndFixUI(0, maxTries);
        },
        resetFixUI: function() {
            //this.log("resetFixUI");
            if (this.reHideAddressBarTimeout_) clearTimeout(this.reHideAddressBarTimeout_);
            this.reHideAddressBarTimeout_ = null;
        },
        testAndFixUI: function(retry, maxTries) {
            //this.log("testAndFixUI");
            //for ios or if the heights are incompatible (and not close)
            var refH = this.getReferenceHeight();
            var curH = this.getCurrentHeight();
            if ((refH != curH && !(curH * addressBarError < refH && refH * addressBarError < curH))) {
                //panic! page is out of place!
                this.hideAddressBar(retry, maxTries);
                return true;
            }
            if (af.os.android) this.resetFixUI();
            return false;
        },
        hideAddressBar: function(retry, maxTries) {
            if(af.ui&&af.ui.isIntel) return;
            if (retry >= maxTries) {
                this.resetFixUI();
                return; //avoid a possible loop
            }

            //this.log("hiding address bar");
            if (af.os.desktop || af.os.chrome) {
                this.layer.style.height = "100%";
            } else if (af.os.android) {
                //on some phones its immediate
                window.scrollTo(1, 1);
                this.layer.style.height = this.isFocused_ || window.innerHeight > window.outerHeight ? (window.innerHeight) + "px" : ((window.outerHeight) / window.devicePixelRatio) + 'px';
                //sometimes android devices are stubborn
                that = this;
                //re-test in a bit (some androids (SII, Nexus S, etc) fail to resize on first try)
                var nextTry = retry + 1;
                this.reHideAddressBarTimeout_ = setTimeout(this.retestAndFixUIProxy_, 250 * nextTry, [nextTry, maxTries]); //each fix is progressibily longer (slower phones fix)
            } else if (!this.isFocused_) {
                document.documentElement.style.height = "5000px";
                window.scrollTo(0, 0);
                document.documentElement.style.height = window.innerHeight + "px";
                this.layer.style.height = window.innerHeight + "px";
            }
        },
        getReferenceHeight: function() {
            //the height the page should be at
            if (af.os.android) {
                return Math.ceil(window.outerHeight / window.devicePixelRatio);
            } else return window.innerHeight;
        },
        getCurrentHeight: function() {
            //the height the page really is at
            if (af.os.android) {
                return window.innerHeight;
            } else return numOnly(document.documentElement.style.height); //TODO: works well on iPhone, test BB
        },
        onOrientationChange: function(e) {
            //this.log("orientationchange");
            //if a resize already happened, fire the orientationchange
            if (!this.holdingReshapeType_ && this.reshapeTimeout_) {
                this.fireReshapeEvent('orientationchange');
            } else this.previewReshapeEvent('orientationchange');
        },
        onResize: function(e) {
            //avoid infinite loop on iPhone
            if (this.ignoreNextResize_) {
                //this.log('ignored resize');
                this.ignoreNextResize_ = false;
                return;
            }
            //this.logInfo('resize');
            if (this.launchFixUI()) {
                this.reshapeAction();
            }
        },
        onClick: function(e) {
            //handle forms
            var tag = e.target && e.target.tagName !== undefined ? e.target.tagName.toLowerCase() : '';

            //this.log("click on "+tag);
            if (inputElements.indexOf(tag) !== -1 && (!this.isFocused_ || e.target !== (this.focusedElement))) {
                var type = e.target && e.target.type !== undefined ? e.target.type.toLowerCase() : '';
                var autoBlur = autoBlurInputTypes.indexOf(type) !== -1;

                //focus
                if (!autoBlur) {
                    //remove previous blur event if this keeps focus
                    if (this.isFocused_) {
                        this.focusedElement.removeEventListener('blur', this, false);
                    }
                    this.focusedElement = e.target;
                    this.focusedElement.addEventListener('blur', this, false);
                    //android bug workaround for UI
                    if (!this.isFocused_ && !this.justBlurred_) {
                        //this.log("enter edit mode");
                        $.trigger(this, 'enter-edit', [e.target]);
                        //fire / preview reshape event
                        if ($.os.ios) {
                            var that = this;
                            setTimeout(function() {
                                that.fireReshapeEvent('enter-edit');
                            }, 300); //TODO: get accurate reading from window scrolling motion and get rid of timeout
                        } else this.previewReshapeEvent('enter-edit');
                    }
                    this.isFocused_ = true;
                } else {
                    this.isFocused_ = false;
                }
                this.justBlurred_ = false;
                this.allowDocumentScroll_ = true;

                //fire focus action
                if (requiresJSFocus) {
                    e.target.focus();
                }

                //BB10 needs to be preventDefault on touchstart and thus need manual blur on click
            } else if ($.os.blackberry10 && this.isFocused_) {
                //this.log("forcing blur on bb10 ");
                this.focusedElement.blur();
            }
        },
        previewReshapeEvent: function(ev) {
            //a reshape event of this type should fire within the next 750 ms, otherwise fire it yourself
            that = this;
            this.reshapeTimeout_ = setTimeout(function() {
                that.fireReshapeEvent(ev);
                that.reshapeTimeout_ = null;
                that.holdingReshapeType_ = null;
            }, 750);
            this.holdingReshapeType_ = ev;
        },
        fireReshapeEvent: function(ev) {
            //this.log(ev?ev+'-reshape':'unknown-reshape');
            $.trigger(this, 'reshape'); //trigger a general reshape notice
            $.trigger(this, ev ? ev + '-reshape' : 'unknown-reshape'); //trigger the specific reshape
        },
        reshapeAction: function() {
            if (this.reshapeTimeout_) {
                //we have a specific reshape event waiting for a reshapeAction, fire it now
                clearTimeout(this.reshapeTimeout_);
                this.fireReshapeEvent(this.holdingReshapeType_);
                this.holdingReshapeType_ = null;
                this.reshapeTimeout_ = null;
            } else this.previewReshapeEvent();
        },
        onFocusIn: function(e) {
            if (!this.isFocused_)
                this.onClick(e);
        },
        onBlur: function(e) {
            if (af.os.android && e.target == window) return; //ignore window blurs

            this.isFocused_ = false;
            //just in case...
            if (this.focusedElement) this.focusedElement.removeEventListener('blur', this, false);
            this.focusedElement = null;
            //make sure this blur is not followed by another focus
            this.justBlurred_ = true;
            $.asap(this.exitEditProxy_, this, [e.target]);
        },
        exitExit: function(el) {
            this.justBlurred_ = false;
            if (!this.isFocused_) {
                //this.log("exit edit mode");
                $.trigger(this, 'exit-edit', [el]);
                //do not allow scroll anymore
                this.allowDocumentScroll_ = false;
                //fire / preview reshape event
                if ($.os.ios) {
                    var that = this;
                    setTimeout(function() {
                        that.fireReshapeEvent('exit-edit');
                    }, 300); //TODO: get accurate reading from window scrolling motion and get rid of timeout
                } else this.previewReshapeEvent('exit-edit');
            }
        },
        onScroll: function(e) {
            //this.log("document scroll detected "+document.body.scrollTop);
            if (!this.allowDocumentScroll_ && !this.isPanning_ && e.target == (document)) {
                this.allowDocumentScroll_ = true;
                if (this.wasPanning_) {
                    this.wasPanning_ = false;
                    //give it a couple of seconds
                    setTimeout(this.launchFixUIProxy_, 2000, [maxHideTries]);
                } else {
                    //this.log("scroll forced page into place");
                    this.launchFixUI();
                }
            }
        },

        onTouchStart: function(e) {
            //setup initial touch position
            this.dX = e.touches[0].pageX;
            this.dY = e.touches[0].pageY;
            this.lastTimestamp = e.timeStamp;
            this.lastTouchStartX = this.lastTouchStartY = null;

            if ($.os.ios) {

                if (skipTouchEnd === e.touches[0].identifier) {
                    cancelClick = true;
                    e.preventDefault();
                    return false;
                }
                skipTouchEnd = e.touches[0].identifier;
                cancelClick = false;
            }

            if (this.scrollerIsScrolling) {
                this.moved = true;
                this.scrollerIsScrolling = false;
                e.preventDefault();

                return false;
            }
            this.trackingClick = true;
            //check dom if necessary
            if (requirePanning || $.feat.nativeTouchScroll) this.checkDOMTree(e.target, this.layer);
            //scrollend check
            if (this.isScrolling) {
                //remove prev timeout
                if (this.scrollTimeout_ !== null) {
                    clearTimeout(this.scrollTimeout_);
                    this.scrollTimeout_ = null;
                    //different element, trigger scrollend anyway
                    if (this.scrollTimeoutEl_ != this.scrollingEl_) this.scrollEnded(false);
                    else this.blockPossibleClick_ = true;
                    //check if event was already set
                } else if (this.scrollTimeoutEl_) {
                    //trigger
                    this.scrollEnded(true);
                    this.blockPossibleClick_ = true;
                }

            }


            // We allow forcing native tap in android devices (required in special cases)
            var forceNativeTap = (af.os.android && e && e.target && e.target.getAttribute && e.target.getAttribute("data-touchlayer") == "ignore");

            //if on edit mode, allow all native touches
            //(BB10 must still be prevented, always clicks even after move)
            if (forceNativeTap || (this.isFocused_ && !$.os.blackberry10)) {
                this.requiresNativeTap = true;
                this.allowDocumentScroll_ = true;

                //some stupid phones require a native tap in order for the native input elements to work
            } else if (inputElementRequiresNativeTap && e.target && e.target.tagName !== undefined) {
                var tag = e.target.tagName.toLowerCase();
                if (inputElements.indexOf(tag) !== -1) {
                    //notify scrollers (android forms bug), except for selects
                    //if(tag != 'select') $.trigger(this, 'pre-enter-edit', [e.target]);
                    this.requiresNativeTap = true;
                }
            } else if (e.target && e.target.tagName !== undefined && e.target.tagName.toLowerCase() == "input" && e.target.type == "range") {
                this.requiresNativeTap = true;
            }

            //prevent default if possible
            if (!this.isPanning_ && !this.requiresNativeTap) {
                if ((this.isScrolling && !$.feat.nativeTouchScroll) || (!this.isScrolling))
                    e.preventDefault();
                //demand vertical scroll (don't let it pan the page)
            } else if (this.isScrollingVertical_) {
                this.demandVerticalScroll();
            }

        },
        demandVerticalScroll: function() {
            //if at top or bottom adjust scroll
            var atTop = this.scrollingEl_.scrollTop <= 0;
            if (atTop) {
                //this.log("adjusting scrollTop to 1");
                this.scrollingEl_.scrollTop = 1;
            } else {
                var scrollHeight = this.scrollingEl_.scrollTop + this.scrollingEl_.clientHeight;
                var atBottom = scrollHeight >= this.scrollingEl_.scrollHeight;
                if (atBottom) {
                    //this.log("adjusting scrollTop to max-1");
                    this.scrollingEl_.scrollTop = this.scrollingEl_.scrollHeight - this.scrollingEl_.clientHeight - 1;
                }
            }
        },
        //set rules here to ignore scrolling check on these elements
        //consider forcing user to use scroller object to assess these... might be causing bugs
        ignoreScrolling: function(el) {
            if (el['scrollWidth'] === undefined || el['clientWidth'] === undefined) return true;
            if (el['scrollHeight'] === undefined || el['clientHeight'] === undefined) return true;
            return false;
        },

        allowsVerticalScroll: function(el, styles) {
            var overflowY = styles.overflowY;
            if (overflowY == 'scroll') return true;
            if (overflowY == 'auto' && el['scrollHeight'] > el['clientHeight']) return true;
            return false;
        },
        allowsHorizontalScroll: function(el, styles) {
            var overflowX = styles.overflowX;
            if (overflowX == 'scroll') return true;
            if (overflowX == 'auto' && el['scrollWidth'] > el['clientWidth']) return true;
            return false;
        },


        //check if pan or native scroll is possible
        checkDOMTree: function(el, parentTarget) {

            //check panning
            //temporarily disabled for android - click vs panning issues
            if (requirePanning && this.panElementId == el.id) {
                this.isPanning_ = true;
                return;
            }
            //check native scroll
            if ($.feat.nativeTouchScroll) {

                //prevent errors
                if (this.ignoreScrolling(el)) {
                    return;
                }

                //check if vertical or hor scroll are allowed
                var styles = window.getComputedStyle(el);
                if (this.allowsVerticalScroll(el, styles)) {
                    this.isScrollingVertical_ = true;
                    this.scrollingEl_ = el;
                    this.isScrolling = true;
                    return;
                } else if (this.allowsHorizontalScroll(el, styles)) {
                    this.isScrollingVertical_ = false;
                    this.scrollingEl_ = null;
                    this.isScrolling = true;
                }

            }
            //check recursive up to top element
            var isTarget = el == (parentTarget);
            if (!isTarget && el.parentNode) this.checkDOMTree(el.parentNode, parentTarget);
        },
        //scroll finish detectors
        scrollEnded: function(e) {
            //this.log("scrollEnded");
            if (e) this.scrollTimeoutEl_.removeEventListener('scroll', this.scrollEndedProxy_, false);
            this.fireEvent('UIEvents', 'scrollend', this.scrollTimeoutEl_, false, false);
            this.scrollTimeoutEl_ = null;
        },


        onTouchMove: function(e) {
            //set it as moved
            var wasMoving = this.moved;
            this.moved = true;
            //very sensitive devices check
            if (verySensitiveTouch) {
                this.cY = e.touches[0].pageY - this.dY;
                this.cX = e.touches[0].pageX - this.dX;
            }
            //panning check
            if (this.isPanning_) {
                return;
            }
            //native scroll (for scrollend)
            if (this.isScrolling) {

                if (!wasMoving) {
                    //this.log("scrollstart");
                    this.fireEvent('UIEvents', 'scrollstart', this.scrollingEl_, false, false);
                }
                //if(this.isScrollingVertical_) {
                this.speedY = (this.lastY - e.touches[0].pageY) / (e.timeStamp - this.lastTimestamp);
                this.lastY = e.touches[0].pageY;
                this.lastX = e.touches[0].pageX;
                this.lastTimestamp = e.timeStamp;
                //}
            }
            //non-native scroll devices

            if ((!$.os.blackberry10)) {
                //legacy stuff for old browsers
                if (!this.isScrolling || !$.feat.nativeTouchScroll)
                    e.preventDefault();
                return;
            }
            //e.stopImmediatPropegation();
            //e.stopPropagation();
        },

        onTouchEnd: function(e) {

            //double check moved for sensitive devices)
            var itMoved = this.moved;
            if (verySensitiveTouch) {
                itMoved = itMoved && !(Math.abs(this.cX) < 10 && Math.abs(this.cY) < 10);
            }

            //don't allow document scroll unless a specific click demands it further ahead
            if (!af.os.ios || !this.requiresNativeTap) this.allowDocumentScroll_ = false;

            //panning action
            if (this.isPanning_ && itMoved) {
                //wait 2 secs and cancel
                this.wasPanning_ = true;

                //a generated click
            } else if (!itMoved && !this.requiresNativeTap) {
                this.scrollerIsScrolling = false;
                if (!this.trackingClick) {
                    return;
                }
                //NOTE: on android if touchstart is not preventDefault(), click will fire even if touchend is prevented
                //this is one of the reasons why scrolling and panning can not be nice and native like on iPhone
                e.preventDefault();

                //fire click
                if (!this.blockClicks && !this.blockPossibleClick_) {
                    var theTarget = e.target;
                    if (theTarget.nodeType == 3) theTarget = theTarget.parentNode;
                    this.fireEvent('Event', 'click', theTarget, true, e.mouseToTouch, e.changedTouches[0]);
                    this.lastTouchStartX = this.dX;
                    this.lastTouchStartY = this.dY;
                }

            } else if (itMoved) {
                //setup scrollend stuff
                if (this.isScrolling) {
                    this.scrollTimeoutEl_ = this.scrollingEl_;
                    if (Math.abs(this.speedY) < 0.01) {
                        //fire scrollend immediatly
                        //this.log(" scrollend immediately "+this.speedY);
                        this.scrollEnded(false);
                    } else {
                        //wait for scroll event
                        //this.log($.debug.since()+" setting scroll timeout "+this.speedY);
                        this.scrollTimeout_ = setTimeout(this.scrollTimeoutExpireProxy_, 30);
                    }
                }
                //trigger cancel-enter-edit on inputs
                if (this.requiresNativeTap) {
                    if (!this.isFocused_) $.trigger(this, 'cancel-enter-edit', [e.target]);
                }
            }
            this.clearTouchVars();
        },

        clearTouchVars: function() {
            //this.log("clearing touchVars");
            this.speedY = this.lastY = this.cY = this.cX = this.dX = this.dY = 0;
            this.moved = false;
            this.isPanning_ = false;
            this.isScrolling = false;
            this.isScrollingVertical_ = false;
            this.requiresNativeTap = false;
            this.blockPossibleClick_ = false;
            this.trackingClick = false;
        },

        fireEvent: function(eventType, eventName, target, bubbles, mouseToTouch, data) {
            //this.log("Firing event "+eventName);
            //create the event and set the options
            var theEvent = document.createEvent(eventType);
            theEvent.initEvent(eventName, bubbles, true);
            theEvent.target = target;
            if (data) {
                $.each(data, function(key, val) {
                    theEvent[key] = val;
                });
            }
            //af.DesktopBrowsers flag
            if (mouseToTouch) theEvent.mouseToTouch = true;
            target.dispatchEvent(theEvent);
        }
    };

})(af);
/**
 * appframework.ui - A User Interface library for App Framework applications
 *
 * @copyright 2011 Intel
 * @author AppMobi
 * @version 2.0
 */ (function($) {
    "use strict";

    var hasLaunched = false;
    var startPath = window.location.pathname;
    var defaultHash = window.location.hash;
    var previousTarget = defaultHash;
    var ui = function() {
        // Init the page
        var that = this;

        /**
         * Helper function to setup the transition objects
         * Custom transitions can be added via $.ui.availableTransitions
           ```
           $.ui.availableTransitions['none']=function();
           ```
           */

        this.availableTransitions = {};
        this.availableTransitions['default'] = this.availableTransitions.none = this.noTransition;
        //setup the menu and boot touchLayer
        $(document).ready(function() {
            //boot touchLayer
            //create afui element if it still does not exist
            var afui = document.getElementById("afui");
            if (afui === null) {
                afui = document.createElement("div");
                afui.id = "afui";
                var body = document.body;
                while (body.firstChild) {
                    afui.appendChild(body.firstChild);
                }
                $(document.body).prepend(afui);
            }
            if ($.os.supportsTouch) $.touchLayer(afui);
            setupCustomTheme();

        });

        function checkNodeInserted(i) {
            if (i.target.id === "afui") {
                setupCustomTheme();
                $(document).unbind("DOMNodeInserted", checkNodeInserted);
            }
        }

        if ($("#afui").length === 1) {
            setupCustomTheme();
        } else {
            $(document).bind("DOMNodeInserted", checkNodeInserted);
        }



        if ("AppMobi" in window){ 
            document.addEventListener("appMobi.device.ready", function() {
                that.autoBoot();
            });
        }
        else if (document.readyState == "complete" || document.readyState == "loaded") {
            this.autoBoot();
        } else $(document).ready(function() {
                that.autoBoot();

            }, false);

        if (!("AppMobi" in window)) window.AppMobi = {}, window.AppMobi.webRoot = "";

        //click back event
        window.addEventListener("popstate", function() {

            var id = that.getPanelId(document.location.hash);
            var hashChecker = document.location.href.replace(document.location.origin + "/", "");
            //make sure we allow hash changes outside afui
            if (hashChecker == "#") return;
            if (id === "" && that.history.length === 1) //Fix going back to first panel and an empty hash
                id = "#" + that.firstDiv.id;
            if (id === "") return;
            if (af(id).filter(".panel").length === 0) return;
            if (id != "#" + that.activeDiv.id) that.goBack();
        }, false);

        function setupCustomTheme() {

            if (that.useOSThemes) {
                if ($.os.android) $("#afui").addClass("android");
                else if ($.os.ie) {
                    $("#afui").addClass("win8");
                    $("head").append($.create("script", {
                        src: "plugins/af.8tiles.js"
                    }));
                } else if ($.os.blackberry) {
                    $("#afui").addClass("bb");
                    that.backButtonText = "Back";
                } else if ($.os.ios7)
                    $("#afui").addClass("ios7");
                else if ($.os.ios)
                    $("#afui").addClass("ios");
            }

        }
    };


    ui.prototype = {
        transitionTime: "230ms",
        showLoading: true,
        loadContentQueue: [],
        isIntel: false,
        titlebar: "",
        navbar: "",
        header: "",
        viewportContainer: "",
        remotePages: {},
        history: [],
        homeDiv: "",
        screenWidth: "",
        content: "",
        modalWindow: "",
        customFooter: false,
        defaultFooter: "",
        defaultHeader: null,
        customMenu: false,
        defaultMenu: "",
        _readyFunc: null,
        doingTransition: false,
        passwordBox: $.passwordBox ? new $.passwordBox() : false,
        selectBox: $.selectBox ? $.selectBox : false,
        ajaxUrl: "",
        transitionType: "slide",
        scrollingDivs: [],
        firstDiv: "",
        hasLaunched: false,
        launchCompleted: false,
        activeDiv: "",
        customClickHandler: "",
        menuAnimation: null,
        togglingSideMenu: false,
        sideMenuWidth: "200px",
        trimBackButtonText: true,
        useOSThemes: true,
        lockPageBounce: false,
        animateHeaders: true,
        useAutoPressed: true,
        _currentHeaderID:"defaultHeader",
        autoBoot: function() {
            this.hasLaunched = true;
            if (this.autoLaunch) {
                this.launch();
            }
        },
        css3animate: function(el, opts) {
            el = $(el);
            return el.css3Animate(opts);
        },
        /**
         * This changes the side menu width
         * ```
           $.ui.setSideMenuWidth('300px');
           ```
         *@title $.ui.setSideMenuWidth
         */

        setSideMenuWidth: function(width) {
            this.sideMenuWidth = width;
            //override the css style
            width = width + "";
            width = width.replace("px", "") + "px";
            $("head").find("#styleWidth").remove();
            $("head").append("<style id='styleWidth'>#afui #menu {width:" + width + "  !important}</style>");
        },

        /**
         * this will disable native scrolling on iOS
         *
         ```
         $.ui.disableNativeScrolling);
         ```
         *@title $.ui.disableNativeScrolling
         */
        disableNativeScrolling: function() {
            $.feat.nativeTouchScroll = false;
        },

        /**
          * This is a boolean property.   When set to true, we manage history and update the hash
          ```
          $.ui.manageHistory=false;//Don't manage for apps using Backbone
          ```
          *@title $.ui.manageHistory
          */
        manageHistory: true,

        /**
         * This is a boolean property.  When set to true (default) it will load that panel when the app is started
           ```
           $.ui.loadDefaultHash=false; //Never load the page from the hash when the app is started
           $.ui.loadDefaultHash=true; //Default
           ```
         *@title $.ui.loadDefaultHash
         */
        loadDefaultHash: true,
        /**
         * This is a boolean that when set to true will add "&cache=_rand_" to any ajax loaded link
           The default is false
           ```
           $.ui.useAjaxCacheBuster=true;
           ```
          *@title $.ui.useAjaxCacheBuster
          */
        useAjaxCacheBuster: false,
        /**
         * This is a shorthand call to the $.actionsheet plugin.  We wire it to the afui div automatically
           ```
           $.ui.actionsheet("<a href='javascript:;' class='button'>Settings</a> <a href='javascript:;' class='button red'>Logout</a>")
           $.ui.actionsheet("[{
                        text: 'back',
                        cssClasses: 'red',
                        handler: function () { $.ui.goBack(); ; }
                    }, {
                        text: 'show alert 5',
                        cssClasses: 'blue',
                        handler: function () { alert("hi"); }
                    }, {
                        text: 'show alert 6',
                        cssClasses: '',
                        handler: function () { alert("goodbye"); }
                    }]");
           ```
         * @param {String,Array} links
         * @title $.ui.actionsheet()
         */
        actionsheet: function(opts) {
            return $.query("#afui").actionsheet(opts);
        },
        /**
         * This is a wrapper to $.popup.js plugin.  If you pass in a text string, it acts like an alert box and just gives a message
           ```
           $.ui.popup(opts);
           $.ui.popup( {
                        title:"Alert! Alert!",
                        message:"This is a test of the emergency alert system!! Don't PANIC!",
                        cancelText:"Cancel me",
                        cancelCallback: function(){console.log("cancelled");},
                        doneText:"I'm done!",
                        doneCallback: function(){console.log("Done for!");},
                        cancelOnly:false
                      });
           $.ui.popup('Hi there');
           ```
         * @param {Object|String} options
         * @title $.ui.popup(opts)
         */
        popup: function(opts) {
            return $.query("#afui").popup(opts);
        },

        /**
         *This will throw up a mask and block the UI
         ```
         $.ui.blockUI(.9)
         ````
         * @param {Float} opacity
         * @title $.ui.blockUI(opacity)
         */
        blockUI: function(opacity) {
            $.blockUI(opacity);
        },
        /**
         *This will remove the UI mask
         ```
         $.ui.unblockUI()
         ````
         * @title $.ui.unblockUI()
         */
        unblockUI: function() {
            $.unblockUI();
        },
        /**
         * Will remove the bottom nav bar menu from your application
           ```
           $.ui.removeFooterMenu();
           ```
         * @title $.ui.removeFooterMenu
         */
        removeFooterMenu: function() {
            $.query("#navbar").hide();
            $.query("#content").css("bottom", "0px");
            this.showNavMenu = false;
        },
        /**
         * Boolean if you want to show the bottom nav menu.
           ```
           $.ui.showNavMenu = false;
           ```
         * @api private
         * @title $.ui.showNavMenu
         */
        showNavMenu: true,
        /**
         * Boolean if you want to auto launch afui
           ```
           $.ui.autoLaunch = false; //
         * @title $.ui.autoLaunch
         */
        autoLaunch: true,
        /**
         * Boolean if you want to show the back button
           ```
           $.ui.showBackButton = false; //
         * @title $.ui.showBackButton
         */
        showBackbutton: true,
        /**
         *  Override the back button text
            ```
            $.ui.backButtonText="Back"
            ```
         * @title $.ui.backButtonText
         */
        backButtonText: "",
        /**
         * Boolean if you want to reset the scroller position when navigating panels.  Default is true
           ```
           $.ui.resetScrollers=false; //Do not reset the scrollers when switching panels
           ```
         * @title $.ui.resetScrollers
         */
        resetScrollers: true,
        /**
         * function to fire when afui is ready and completed launch
           ```
           $.ui.ready(function(){console.log('afui is ready');});
           ```
         * @param {Function} function to execute
         * @title $.ui.ready
         */
        ready: function(param) {

            if (this.launchCompleted) param();
            else {
                $(document).on("afui:ready", function(e) {
                    param();
                });
            }
        },
        /**
         * Override the back button class name
           ```
           $.ui.setBackButtonStyle('newClass');
           ```
         * @param {String} new class name
         * @title $.ui.setBackButtonStyle(class)
         */
        setBackButtonStyle: function(className) {
            $.query("#backButton").replaceClass(null, className);
        },
        /**
         * Initiate a back transition
           ```
           $.ui.goBack()
           ```

         * @title $.ui.goBack()
         */
        goBack: function() {
            if (this.history.length > 0) {
                var that = this;
                var tmpEl = this.history.pop();
                that.loadContent(tmpEl.target + "", 0, 1, tmpEl.transition);
                that.transitionType = tmpEl.transition;
                that.updateHash(tmpEl.target);
            }
        },
        /**
         * Clear the history queue
           ```
           $.ui.clearHistory()
           ```

         * @title $.ui.clearHistory()
         */
        clearHistory: function() {
            this.history = [];
            this.setBackButtonVisibility(false);
        },

        /**
         * PushHistory
           ```
           $.ui.pushHistory(previousPage, newPage, transition, hashExtras)
           ```
         * @api private
         * @title $.ui.pushHistory()
         */
        pushHistory: function(previousPage, newPage, transition, hashExtras) {
            //push into local history

            this.history.push({
                target: previousPage,
                transition: transition
            });
            //push into the browser history
            try {
                if (!this.manageHistory) return;
                window.history.pushState(newPage, newPage, startPath + '#' + newPage + hashExtras);
                $(window).trigger("hashchange", null, {
                    newUrl: startPath + '#' + newPage + hashExtras,
                    oldURL: startPath + previousPage
                });
            } catch (e) {}
        },


        /**
         * Updates the current window hash
         *
         * @param {String} newHash New Hash value
         * @title $.ui.updateHash(newHash)
         * @api private
         */
        updateHash: function(newHash) {
            if (!this.manageHistory) return;
            newHash = newHash.indexOf('#') == -1 ? '#' + newHash : newHash; //force having the # in the begginning as a standard
            previousTarget = newHash;

            var previousHash = window.location.hash;
            var panelName = this.getPanelId(newHash).substring(1); //remove the #
            try {
                window.history.replaceState(panelName, panelName, startPath + newHash);
                $(window).trigger("hashchange", null, {
                    newUrl: startPath + newHash,
                    oldUrl: startPath + previousHash
                });
            } catch (e) {}
        },
        /*gets the panel name from an hash*/
        getPanelId: function(hash) {
            var firstSlash = hash.indexOf('/');
            return firstSlash == -1 ? hash : hash.substring(0, firstSlash);
        },

        /**
         * Update a badge on the selected target.  Position can be
            bl = bottom left
            tl = top left
            br = bottom right
            tr = top right (default)
           ```
           $.ui.updateBadge('#mydiv','3','bl','green');
           ```
         * @param {String} target
         * @param {String} Value
         * @param {String} [position]
         * @param {String|Object} [color or CSS hash]
         * @title $.ui.updateBadge(target,value,[position],[color])
         */
        updateBadge: function(target, value, position, color) {
            if (position === undefined) position = "";

            var $target = $(target);
            var badge = $target.find("span.af-badge");

            if (badge.length === 0) {
                if ($target.css("position") != "absolute") $target.css("position", "relative");
                badge = $.create("span", {
                    className: "af-badge " + position,
                    html: value
                });
                $target.append(badge);
            } else badge.html(value);
            badge.removeClass("tl bl br tr");
            badge.addClass(position);
            if (color === undefined)
                color = "red";
            if ($.isObject(color)) {
                badge.css(color);
            } else if (color) {
                badge.css("background", color);
            }
            badge.data("ignore-pressed", "true");

        },
        /**
         * Removes a badge from the selected target.
           ```
           $.ui.removeBadge('#mydiv');
           ```
         * @param {String} target
         * @title $.ui.removeBadge(target)
         */
        removeBadge: function(target) {
            $(target).find("span.af-badge").remove();
        },
        /**
         * Toggles the bottom nav menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleNavMenu();//toggle it
           $.ui.toggleNavMenu(true); //force show it
           ```
         * @param {Boolean} [force]
         * @title $.ui.toggleNavMenu([force])
         */
        toggleNavMenu: function(force) {
            if (!this.showNavMenu) return;
            if ($.query("#navbar").css("display") != "none" && ((force !== undefined && force !== true) || force === undefined)) {
                $.query("#content").css("bottom", "0px");
                $.query("#navbar").hide();
            } else if (force === undefined || (force !== undefined && force === true)) {
                $.query("#navbar").show();
                $.query("#content").css("bottom", $.query("#navbar").css("height"));

            }
        },
        /**
         * Toggles the top header menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleHeaderMenu();//toggle it
           ```
         * @param {Boolean} [force]
         * @title $.ui.toggleHeaderMenu([force])
         */
        toggleHeaderMenu: function(force) {
            if ($.query("#header").css("display") != "none" && ((force !== undefined && force !== true) || force === undefined)) {
                $.query("#content").css("top", "0px");
                $.query("#header").hide();
            } else if (force === undefined || (force !== undefined && force === true)) {
                $.query("#header").show();
                $.query("#content").css("top", $.query("#header").css("height"));
            }
        },
        /**
         * Toggles the side menu.  Force is a boolean to force show or hide.
           ```
           $.ui.toggleSideMenu();//toggle it
           ```
         * @param {Boolean} [force]
         * @param {Function} [callback] Callback function to execute after menu toggle is finished
         * @param {int} [time] Time to run the transition
         * @title $.ui.toggleSideMenu([force],[callback],[time])
         */
        toggleSideMenu: function(force, callback, time) {
            if (!this.isSideMenuEnabled() || this.togglingSideMenu) return;

            var that = this;
            var menu = $.query("#menu");
            var els = $.query("#content,  #header, #navbar");
            time = time || this.transitionTime;
            var open = this.isSideMenuOn();

            if (force === 2 || (!open && ((force !== undefined && force !== false) || force === undefined))) {
                this.togglingSideMenu = true;
                menu.show();
                that.css3animate(els, {
                    x: that.sideMenuWidth,
                    time: time,
                    complete: function(canceled) {
                        that.togglingSideMenu = false;
                        els.vendorCss("Transition", "");
                        if (callback) callback(canceled);
                    }
                });

            } else if (force === undefined || (force !== undefined && force === false)) {
                this.togglingSideMenu = true;
                that.css3animate(els, {
                    x: "0px",
                    time: time,
                    complete: function(canceled) {
                        // els.removeClass("on");
                        els.vendorCss("Transition", "");
                        els.vendorCss("Transform", "");
                        that.togglingSideMenu = false;
                        if (callback) callback(canceled);
                        menu.hide();
                    }
                });
            }
        },
        /**
         * Disables the side menu
           ```
           $.ui.disableSideMenu();
           ```
        * @title $.ui.disableSideMenu();
        */
        disableSideMenu: function() {
            var that = this;
            var els = $.query("#content, #header, #navbar");
            if (this.isSideMenuOn()) {
                this.toggleSideMenu(false, function(canceled) {
                    if (!canceled) els.removeClass("hasMenu");
                });
            } else els.removeClass("hasMenu");
            $.query("#menu").removeClass("tabletMenu");
        },
        /**
         * Enables the side menu if it has been disabled
           ```
           $.ui.enableSideMenu();
           ```
        * @title $.ui.enableSideMenu();
        */
        enableSideMenu: function() {
            $.query("#content, #header, #navbar").addClass("hasMenu");
            $.query("#menu").addClass("tabletMenu");
        },
        /**
         *
         * @title $.ui.enableSideMenu();
         * @api private
         */
        isSideMenuEnabled: function() {
            return $.query("#content").hasClass("hasMenu");
        },
        /**
         *
         * @title $.ui.enableSideMenu();
         * @api private
         */
        isSideMenuOn: function() {

            var menu = parseInt($.getCssMatrix($("#content")).e) > 1 ? true : false;
            return this.isSideMenuEnabled() && menu;
        },

        /**
         * Reference to the default footer
         * @api private
         */
        prevFooter: null,
        /**
         * Updates the elements in the navbar
           ```
           $.ui.updateNavbarElements(elements);
           ```
         * @param {String|Object} Elements
         * @title $.ui.updateNavbarElements(Elements)
         */
        updateNavbarElements: function(elems) {
            if (this.prevFooter) {
                if (this.prevFooter.data("parent")) this.prevFooter.appendTo("#" + this.prevFooter.data("parent"));
                else this.prevFooter.appendTo("#afui");
            }
            if (!$.is$(elems)) //inline footer
            {
                elems = $.query("#" + elems);
            }
            $.query("#navbar").append(elems);
            this.prevFooter = elems;
            var tmpAnchors = $.query("#navbar a");
            if (tmpAnchors.length > 0) {
                tmpAnchors.data("ignore-pressed", "true").data("resetHistory", "true");
                var width = parseFloat(100 / tmpAnchors.length);
                tmpAnchors.css("width", width + "%");
            }
            var nodes = $.query("#navbar footer");
            if (nodes.length === 0) return;
            nodes = nodes.get(0).childNodes;

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType === 3) {
                    nodes[i].parentNode.removeChild(nodes[i]);
                }
            }

        },
        /**
         * Reference to the previous header
         * @api private
         */
        prevHeader: null,
        /**
         * Updates the elements in the header
           ```
           $.ui.updateHeaderElements(elements);
           ```
         * @param {String|Object} Elements
         * @title $.ui.updateHeaderElements(Elements)
         */
        updateHeaderElements: function(elems, goBack) {
            var that = this;
            if (!$.is$(elems)) //inline footer
            {
                elems = $.query("#" + elems);
            }
            if (elems == this.prevHeader) return;
            this._currentHeaderID=elems.prop("id");
            if (this.prevHeader) {
                //Let's slide them out
                $.query("#header").append(elems);
                //Do not animate - sometimes they act funky
                if (!$.ui.animateHeaders) {
                    if (that.prevHeader.data("parent")) that.prevHeader.appendTo("#" + that.prevHeader.data("parent"));
                    else that.prevHeader.appendTo("#afui");
                    that.prevHeader = elems;
                    return;
                }

                var from = goBack ? "100px" : "-100px";
                var to = goBack ? "-100px" : "100px";
                that.prevHeader.addClass("ignore");
                that.css3animate(elems, {
                    x: to,
                    opacity: 0.3,
                    time: "1ms"
                });
                that.css3animate(that.prevHeader, {
                    x: from,
                    y: 0,
                    opacity: 0.3,
                    time: that.transitionTime,
                    delay: numOnly(that.transitionTime) / 5 + "ms",
                    complete: function() {
                        if (that.prevHeader.data("parent")) that.prevHeader.appendTo("#" + that.prevHeader.data("parent"));
                        else that.prevHeader.appendTo("#afui");
                        that.prevHeader.removeClass("ignore");
                        that.css3animate(that.prevHeader, {
                            x: to,
                            opacity: 1,
                            time: "1ms"
                        });
                        that.prevHeader = elems;
                    }
                });
                that.css3animate(elems, {
                    x: "0px",
                    opacity: 1,
                    time: that.transitionTime
                });


            } else {
                $.query("#header").append(elems);
                this.prevHeader = elems;
            }
        },
        /**
         * @api private
         * Kept for backwards compatibility
         */
        updateSideMenu: function(elems) {
            return this.updateSideMenuElements(elems);
        },
        /**
         * Updates the elements in the side menu
           ```
           $.ui.updateSideMenuElements(elements);
           ```
         * @param {String|Object} Elements
         * @title $.ui.updateSideMenuElements(Elements)
         */
        updateSideMenuElements: function(elems) {
            var that = this;
            if (elems === undefined || elems === null) return;
            var nb = $.query("#menu_scroller");

            if (this.prevMenu) {
                this.prevMenu.insertBefore("#afui #menu");
                this.prevMenu = null;
            }

            if (!$.is$(elems)) elems = $.query("#" + elems);

            nb.html('');
            nb.append(elems);
            this.prevMenu = elems;
            //Move the scroller to the top and hide it
            this.scrollingDivs.menu_scroller.hideScrollbars();
            this.scrollingDivs.menu_scroller.scrollToTop();
        },
        /**
         * Set the title of the current panel
           ```
           $.ui.setTitle("new title");
           ```

         * @param {String} value
         * @title $.ui.setTitle(value)
         */
        setTitle: function(val) {
            if(this._currentHeaderID!=="defaultHeader") return;
            $.query("#header header:not(.ignore)  #pageTitle").html(val);
        },
        /**
         * Override the text for the back button
           ```
           $.ui.setBackButtonText("GO...");
           ```

         * @param {String} value
         * @title $.ui.setBackButtonText(value)
         */
        setBackButtonText: function(text) {
            if(this._currentHeaderID!=="defaultHeader") return;
            if (this.trimBackButtonText)
                text = text.substring(0, 5) + "...";
            if (this.backButtonText.length > 0) $.query("#header header:not(.ignore) #backButton").html(this.backButtonText);
            else $.query("#header header:not(.ignore)  #backButton").html(text);
        },
        /**
         * Toggle visibility of the back button
         */
        setBackButtonVisibility: function(show) {
            if (!show) $.query("#header #backButton").css("visibility", "hidden");
            else $.query("#header #backButton").css("visibility", "visible");
        },
        /**
         * Show the loading mask
           ```
           $.ui.showMask()
           $.ui.showMask('Doing work')
           ```

         * @param {String} [text]
         * @title $.ui.showMask(text);
         */
        showMask: function(text) {
            if (!text) text = "Loading Content";
            $.query("#afui_mask>h1").html(text);
            $.query("#afui_mask").show();
        },
        /**
         * Hide the loading mask
         * @title $.ui.hideMask();
         */
        hideMask: function() {
            $.query("#afui_mask").hide();
        },
        /**
         * Load a content panel in a modal window.  We set the innerHTML so event binding will not work.  Please use the data-load or panelloaded events to setup any event binding
           ```
           $.ui.showModal("#myDiv","fade");
           ```
         * @param {String|Object} panel to show
         * @param {String} [transition]
         * @title $.ui.showModal();
         */
        showModal: function(id, trans) {
            var that = this;
            this.modalTransition = trans || "up";
            var modalDiv = $.query("#modalContainer");
            if (typeof(id) === "string")
                id = "#" + id.replace("#", "");
            if ($.query(id)) {
                modalDiv.html($.feat.nativeTouchScroll ? $.query(id).html() : $.query(id).get(0).childNodes[0].innerHTML + '', true);
                modalDiv.append("<a onclick='$.ui.hideModal();' class='closebutton modalbutton'></a>");
                that.modalWindow.style.display = "block";

                this.runTransition(this.modalTransition, that.modalTransContainer, that.modalWindow, false);

                this.scrollingDivs.modal_container.enable(that.resetScrollers);
                this.scrollToTop('modal');
                modalDiv.data("panel", id);

            }
        },
        /**
         * Hide the modal window and remove the content.  We remove any event listeners on the contents.
           ```
           $.ui.hideModal("");
           ```
         * @title $.ui.hideModal();
         */
        hideModal: function() {
            var self = this;
            $.query("#modalContainer").html("", true);

            this.runTransition(self.modalTransition, self.modalWindow, self.modalTransContainer, true);

            this.scrollingDivs.modal_container.disable();

            var tmp = $.query($.query("#modalContainer").data("panel"));
            var fnc = tmp.data("unload");
            if (typeof fnc == "string" && window[fnc]) {
                window[fnc](tmp.get(0));
            }
            tmp.trigger("unloadpanel");

        },

        /**
         * Update the HTML in a content panel
           ```
           $.ui.updatePanel("#myDiv","This is the new content");
           ```
         * @param {String,Object} panel
         * @param {String} html to update with
         * @title $.ui.updatePanel(id,content);
         */
        updatePanel: function(id, content) {
            id = "#" + id.replace("#", "");
            var el = $.query(id).get(0);
            if (!el) return;

            var newDiv = $.create("div", {
                html: content
            });
            if (newDiv.children('.panel') && newDiv.children('.panel').length > 0) newDiv = newDiv.children('.panel').get(0);
            else newDiv = newDiv.get(0);


            if (el.getAttribute("js-scrolling") && (el.getAttribute("js-scrolling").toLowerCase() == "yes" || el.getAttribute("js-scrolling").toLowerCase() == "true")) {
                $.cleanUpContent(el.childNodes[0], false, true);
                $(el.childNodes[0]).html(content);
            } else {
                $.cleanUpContent(el, false, true);
                $(el).html(content);
            }
            if (newDiv.title) el.title = newDiv.title;
        },
        /**
         * Same as $.ui.updatePanel.  kept for backwards compatibility
           ```
           $.ui.updateContentDiv("#myDiv","This is the new content");
           ```
         * @param {String,Object} panel
         * @param {String} html to update with
         * @title $.ui.updateContentDiv(id,content);
         */
        updateContentDiv: function(id, content) {
            return this.updatePanel(id, content);
        },
        /**
         * Dynamically creates a new panel.  It wires events, creates the scroller, applies Android fixes, etc.
           ```
           $.ui.addContentDiv("myDiv","This is the new content","Title");
           ```
         * @param {String|Object} Element to add
         * @param {String} Content
         * @param {String} title
         * @title $.ui.addContentDiv(id,content,title);
         */
        addContentDiv: function(el, content, title, refresh, refreshFunc) {
            el = typeof(el) !== "string" ? el : el.indexOf("#") == -1 ? "#" + el : el;
            var myEl = $.query(el).get(0);
            var newDiv, newId;
            if (!myEl) {
                newDiv = $.create("div", {
                    html: content
                });
                if (newDiv.children('.panel') && newDiv.children('.panel').length > 0) newDiv = newDiv.children('.panel').get(0);
                else newDiv = newDiv.get(0);

                if (!newDiv.title && title) newDiv.title = title;
                newId = (newDiv.id) ? newDiv.id : el.replace("#", ""); //figure out the new id - either the id from the loaded div.panel or the crc32 hash
                newDiv.id = newId;
                if (newDiv.id != el) newDiv.setAttribute("data-crc", el.replace("#", ""));
            } else {
                newDiv = myEl;
            }
            newDiv.className = "panel";
            newId = newDiv.id;
            this.addDivAndScroll(newDiv, refresh, refreshFunc);
            myEl = null;
            newDiv = null;
            return newId;
        },
        /**
         *  Takes a div and sets up scrolling for it..
           ```
           $.ui.addDivAndScroll(object);
           ```
         * @param {Object} Element
         * @title $.ui.addDivAndScroll(element);
         * @api private
         */
        addDivAndScroll: function(tmp, refreshPull, refreshFunc, container) {
            var jsScroll = false,
                scrollEl;
            var overflowStyle = tmp.style.overflow;
            var hasScroll = overflowStyle != 'hidden' && overflowStyle != 'visible';

            container = container || this.content;
            //sets up scroll when required and not supported
            if (!$.feat.nativeTouchScroll && hasScroll) tmp.setAttribute("js-scrolling", "true");

            if (tmp.getAttribute("js-scrolling") && (tmp.getAttribute("js-scrolling").toLowerCase() == "yes" || tmp.getAttribute("js-scrolling").toLowerCase() == "true")) {
                jsScroll = true;
                hasScroll = true;
            }



            if (tmp.getAttribute("scrolling") && tmp.getAttribute("scrolling") == "no") {
                hasScroll = false;
                jsScroll = false;
                tmp.removeAttribute("js-scrolling");
            }

            if (!jsScroll) {
                container.appendChild(tmp);
                scrollEl = tmp;
                tmp.style['-webkit-overflow-scrolling'] = "none";
            } else {
                //WE need to clone the div so we keep events
                scrollEl = tmp.cloneNode(false);


                tmp.title = null;
                tmp.id = null;
                var $tmp = $(tmp);
                $tmp.removeAttr("data-footer data-nav data-header selected data-load data-unload data-tab data-crc");

                $tmp.replaceClass("panel", "afScrollPanel");

                scrollEl.appendChild(tmp);

                container.appendChild(scrollEl);

                if (this.selectBox !== false) this.selectBox.getOldSelects(scrollEl.id);
                if (this.passwordBox !== false) this.passwordBox.getOldPasswords(scrollEl.id);

            }

            if (hasScroll) {
                this.scrollingDivs[scrollEl.id] = ($(tmp).scroller({
                    scrollBars: true,
                    verticalScroll: true,
                    horizontalScroll: false,
                    vScrollCSS: "afScrollbar",
                    refresh: refreshPull,
                    useJsScroll: jsScroll,
                    noParent: !jsScroll,
                    lockBounce: this.lockPageBounce,
                    autoEnable: false //dont enable the events unnecessarilly
                }));
                //backwards compatibility
                if (refreshFunc) $.bind(this.scrollingDivs[scrollEl.id], 'refresh-release', function(trigger) {
                        if (trigger) refreshFunc();
                    });
            }

            tmp = null;
            scrollEl = null;
        },

        /**
         *  Scrolls a panel to the top
           ```
           $.ui.scrollToTop(id);
           ```
         * @param {String} id
         * @param {string} Time to scroll
         * @title $.ui.scrollToTop(id);
         */
        scrollToTop: function(id, time) {
            time = time || "300ms";
            id = id.replace("#", "");
            if (this.scrollingDivs[id]) {
                this.scrollingDivs[id].scrollToTop(time);
            }
        },
        /**
         *  Scrolls a panel to the bottom
           ```
           $.ui.scrollToBottom(id,time);
           ```
         * @param {String} id
         * @param {string} Time to scroll
         * @title $.ui.scrollToBottom(id);
         */
        scrollToBottom: function(id, time) {
            id = id.replace("#", "");
            if (this.scrollingDivs[id]) {
                this.scrollingDivs[id].scrollToBottom(time);
            }
        },

        /**
         *  This is used when a transition fires to do helper events.  We check to see if we need to change the nav menus, footer, and fire
         * the load/onload functions for panels
           ```
           $.ui.parsePanelFunctions(currentDiv,oldDiv);
           ```
         * @param {Object} current div
         * @param {Object} old div
         * @title $.ui.parsePanelFunctions(currentDiv,oldDiv);
         * @api private
         */
        parsePanelFunctions: function(what, oldDiv, goBack) {
            //check for custom footer
            var that = this;
            var hasFooter = what.getAttribute("data-footer");
            var hasHeader = what.getAttribute("data-header");

            //$asap removed since animations are fixed in css3animate
            if (hasFooter && hasFooter.toLowerCase() == "none") {
                that.toggleNavMenu(false);
                hasFooter = false;
            } else {
                that.toggleNavMenu(true);
            }
            if (hasFooter && that.customFooter != hasFooter) {
                that.customFooter = hasFooter;
                that.updateNavbarElements(hasFooter);
            } else if (hasFooter != that.customFooter) {
                if (that.customFooter) that.updateNavbarElements(that.defaultFooter);
                that.customFooter = false;
            }
            if (hasHeader && hasHeader.toLowerCase() == "none") {
                that.toggleHeaderMenu(false);
            } else {
                that.toggleHeaderMenu(true);
            }

            if (hasHeader && that.customHeader != hasHeader) {
                that.customHeader = hasHeader;
                that.updateHeaderElements(hasHeader, goBack);
            } else if (hasHeader != that.customHeader) {
                if (that.customHeader) {
                    that.updateHeaderElements(that.defaultHeader, goBack);
                    //that.setTitle(that.activeDiv.title);
                }
                that.customHeader = false;
            }

            //Load inline footers
            var inlineFooters = $(what).find("footer");
            if (inlineFooters.length > 0) {
                that.customFooter = what.id;
                inlineFooters.data("parent", what.id);
                that.updateNavbarElements(inlineFooters);
            }
            //load inline headers
            var inlineHeader = $(what).find("header");


            if (inlineHeader.length > 0) {
                that.customHeader = what.id;
                inlineHeader.data("parent", what.id);
                that.updateHeaderElements(inlineHeader, goBack);
            }
            //check if the panel has a footer
            if (what.getAttribute("data-tab")) { //Allow the dev to force the footer menu
                $.query("#navbar a").removeClass("pressed");
                $.query("#navbar #" + what.getAttribute("data-tab")).addClass("pressed");
            }

            var hasMenu = what.getAttribute("data-nav");
            if (hasMenu && this.customMenu != hasMenu) {
                this.customMenu = hasMenu;
                this.updateSideMenuElements(hasMenu);
            } else if (hasMenu != this.customMenu) {
                if (this.customMenu) {
                    this.updateSideMenuElements(this.defaultMenu);
                }
                this.customMenu = false;
            }



            if (oldDiv) {
                fnc = oldDiv.getAttribute("data-unload");
                if (typeof fnc == "string" && window[fnc]) {
                    window[fnc](oldDiv);
                }
                $(oldDiv).trigger("unloadpanel");
            }
            var fnc = what.getAttribute("data-load");
            if (typeof fnc == "string" && window[fnc]) {
                window[fnc](what);
            }
            $(what).trigger("loadpanel");
            if (this.isSideMenuOn()) {
                var that = this;
                that.toggleSideMenu(false);
                /* $("#menu").width(window.innerWidth);

                $(".hasMenu").css3Animate({
                    x: (window.innerWidth + 100),
                    time: that.transitionTime,
                    complete: function() {
                        $("#menu").width(that.sideMenuWidth);
                        that.toggleSideMenu(false);

                    }
                });
                */
            }
        },
        /**
         * Helper function that parses a contents html for any script tags and either adds them or executes the code
         * @api private
         */
        parseScriptTags: function(div) {
            if (!div) return;
            $.parseJS(div);
        },
        /**
         * This is called to initiate a transition or load content via ajax.
         * We can pass in a hash+id or URL and then we parse the panel for additional functions
           ```
           $.ui.loadContent("#main",false,false,"up");
           ```
         * @param {String} target
         * @param {Boolean} newtab (resets history)
         * @param {Boolean} go back (initiate the back click)
         * @param {String} transition
         * @title $.ui.loadContent(target,newTab,goBack,transition);
         * @api public
         */
        loadContent: function(target, newTab, back, transition, anchor) {

            if (this.doingTransition) {
                var that = this;
                this.loadContentQueue.push([target, newTab, back, transition, anchor]);
                return;
            }
            if (target.length === 0) return;

            var what = null;
            var loadAjax = true;
            anchor = anchor || document.createElement("a"); //Hack to allow passing in no anchor
            if (target.indexOf("#") == -1) {
                var urlHash = "url" + crc32(target); //Ajax urls
                var crcCheck = $.query("div.panel[data-crc='" + urlHash + "']");
                if ($.query("#" + target).length > 0) {
                    loadAjax = false;
                } else if (crcCheck.length > 0) {
                    loadAjax = false;
                    if (anchor.getAttribute("data-refresh-ajax") === 'true' || (anchor.refresh && anchor.refresh === true || this.isAjaxApp)) {
                        loadAjax = true;
                    } else {
                        target = "#" + crcCheck.get(0).id;
                    }
                } else if ($.query("#" + urlHash).length > 0) {

                    //ajax div already exists.  Let's see if we should be refreshing it.
                    loadAjax = false;
                    if (anchor.getAttribute("data-refresh-ajax") === 'true' || (anchor.refresh && anchor.refresh === true || this.isAjaxApp)) {
                        loadAjax = true;
                    } else target = "#" + urlHash;
                }
            }
            if (target.indexOf("#") == -1 && loadAjax) {
                this.loadAjax(target, newTab, back, transition, anchor);
            } else {
                this.loadDiv(target, newTab, back, transition);
            }
        },
        /**
         * This is called internally by loadContent.  Here we are loading a div instead of an Ajax link
           ```
           $.ui.loadDiv("#main",false,false,"up");
           ```
         * @param {String} target
         * @param {Boolean} newtab (resets history)
         * @param {Boolean} go back (initiate the back click)
         * @param {String} transition
         * @title $.ui.loadDiv(target,newTab,goBack,transition);
         * @api private
         */
        loadDiv: function(target, newTab, back, transition) {
            // load a div
            var that = this;
            var what = target.replace("#", "");

            var slashIndex = what.indexOf('/');
            var hashLink = "";
            if (slashIndex != -1) {
                // Ignore everything after the slash for loading
                hashLink = what.substr(slashIndex);
                what = what.substr(0, slashIndex);
            }

            what = $.query("#" + what).get(0);

            if (!what) return console.log("Target: " + target + " was not found");
            if (what == this.activeDiv && !back) {
                //toggle the menu if applicable
                if (this.isSideMenuOn()) this.toggleSideMenu(false);
                return;
            }
            this.transitionType = transition;
            var oldDiv = this.activeDiv;
            var currWhat = what;

            if (what.getAttribute("data-modal") == "true" || what.getAttribute("modal") == "true") {
                var fnc = what.getAttribute("data-load");
                if (typeof fnc == "string" && window[fnc]) {
                    window[fnc](what);
                }
                $(what).trigger("loadpanel");
                return this.showModal(what.id);
            }



            if (oldDiv == currWhat) //prevent it from going to itself
                return;

            if (newTab) {
                this.clearHistory();
                this.pushHistory("#" + this.firstDiv.id, what.id, transition, hashLink);
            } else if (!back) {
                this.pushHistory(previousTarget, what.id, transition, hashLink);
            }


            previousTarget = '#' + what.id + hashLink;


            this.doingTransition = true;
            oldDiv.style.display = "block";
            currWhat.style.display = "block";

            this.runTransition(transition, oldDiv, currWhat, back);


            //Let's check if it has a function to run to update the data
            this.parsePanelFunctions(what, oldDiv, back);
            //Need to call after parsePanelFunctions, since new headers can override
            this.loadContentData(what, newTab, back, transition);
            setTimeout(function() {
                if (that.scrollingDivs[oldDiv.id]) {
                    that.scrollingDivs[oldDiv.id].disable();
                }
            }, (that.transitionTime) + 50);

        },
        /**
         * This is called internally by loadDiv.  This sets up the back button in the header and scroller for the panel
           ```
           $.ui.loadContentData("#main",false,false,"up");
           ```
         * @param {String} target
         * @param {Boolean} newtab (resets history)
         * @param {Boolean} go back (initiate the back click)
         * @param {String} transition
         * @title $.ui.loadDiv(target,newTab,goBack,transition);
         * @api private
         */
        loadContentData: function(what, newTab, back, transition) {
            var prevId, el, val, slashIndex;
            if (back) {
                if (this.history.length > 0) {
                    val = this.history[this.history.length - 1];
                    slashIndex = val.target.indexOf('/');
                    if (slashIndex != -1) {
                        prevId = val.target.substr(0, slashIndex);
                    } else prevId = val.target;
                    el = $.query(prevId).get(0);
                    //make sure panel is there
                    if (el) this.setBackButtonText(el.title);
                    else this.setBackButtonText("Back");
                }
            } else if (this.activeDiv.title) this.setBackButtonText(this.activeDiv.title);
            else this.setBackButtonText("Back");
            if (what.title) {
                this.setTitle(what.title);
            }
            if (newTab) {
                this.setBackButtonText(this.firstDiv.title);
                if (what == this.firstDiv) {
                    this.history.length = 0;
                }
            }

            $("#header #menubadge").css("float", "right");
            if (this.history.length === 0) {
                this.setBackButtonVisibility(false);
                this.history = [];
                $("#header #menubadge").css("float", "left");
            } else if (this.showBackbutton) this.setBackButtonVisibility(true);
            this.activeDiv = what;
            if (this.scrollingDivs[this.activeDiv.id]) {
                this.scrollingDivs[this.activeDiv.id].enable(this.resetScrollers);
            }
        },
        /**
         * This is called internally by loadContent.  Here we are using Ajax to fetch the data
           ```
           $.ui.loadDiv("page.html",false,false,"up");
           ```
         * @param {String} target
         * @param {Boolean} newtab (resets history)
         * @param {Boolean} go back (initiate the back click)
         * @param {String} transition
         * @title $.ui.loadDiv(target,newTab,goBack,transition);
         * @api private
         */
        loadAjax: function(target, newTab, back, transition, anchor) {
            // XML Request
            if (this.activeDiv.id == "afui_ajax" && target == this.ajaxUrl) return;
            var urlHash = "url" + crc32(target); //Ajax urls
            var that = this;
            if (target.indexOf("http") == -1) target = AppMobi.webRoot + target;
            var xmlhttp = new XMLHttpRequest();
        
            if (anchor && typeof(anchor) !== "object") {
                anchor = document.createElement("a");
                anchor.setAttribute("data-persist-ajax", true);
            }

            anchor = anchor || document.createElement("a");
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    this.doingTransition = false;
                    var refreshFunction;
                    var doReturn = false;
                    var retainDiv = $.query("#" + urlHash);
                    //Here we check to see if we are retaining the div, if so update it
                    if (retainDiv.length > 0) {
                        that.updatePanel(urlHash, xmlhttp.responseText);
                        retainDiv.get(0).title = anchor.title ? anchor.title : target;
                    } else if (anchor.getAttribute("data-persist-ajax") || that.isAjaxApp) {

                        var refresh = (anchor.getAttribute("data-pull-scroller") === 'true') ? true : false;
                        refreshFunction = refresh ? function() {
                            anchor.refresh = true;
                            that.loadContent(target, newTab, back, transition, anchor);
                            anchor.refresh = false;
                        } : null;
                        //that.addContentDiv(urlHash, xmlhttp.responseText, refresh, refreshFunction);
                        var contents = $(xmlhttp.responseText);
                        console.log(anchor);
                        if (contents.hasClass("panel"))
                            contents = contents.get(0).innerHTML;
                        else
                            contents = contents.html();
                        if ($("#" + urlHash).length > 0) {
                            that.updatePanel("#" + urlHash, contents);
                        } else if ($("div.panel[data-crc='" + urlHash + "']").length > 0) {
                            that.updatePanel($("div.panel[data-crc='" + urlHash + "']").get(0).id, contents);
                            urlHash = $("div.panel[data-crc='" + urlHash + "']").get(0).id;
                        } else
                            urlHash = that.addContentDiv(urlHash, xmlhttp.responseText, anchor.title ? anchor.title : target, refresh, refreshFunction);
                    } else {
                        that.updatePanel("afui_ajax", xmlhttp.responseText);
                        $.query("#afui_ajax").get(0).title = anchor.title ? anchor.title : target;
                        that.loadContent("#afui_ajax", newTab, back);
                        doReturn = true;
                    }
                    //Let's load the content now.
                    //We need to check for any script tags and handle them
                    var div = document.createElement("div");
                    $(div).html(xmlhttp.responseText);
                    that.parseScriptTags(div);

                    if (doReturn) {
                        if (that.showLoading) that.hideMask();
                        return;
                    }

                    that.loadContent("#" + urlHash);
                    if (that.showLoading) that.hideMask();
                    return null;
                }
            };
            this.ajaxUrl = target;
            var newtarget = this.useAjaxCacheBuster ? target + (target.split('?')[1] ? '&' : '?') + "cache=" + Math.random() * 10000000000000000 : target;
            xmlhttp.open("GET", newtarget, true);
            xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xmlhttp.send();
            // show Ajax Mask
            if (this.showLoading) this.showMask();
        },
        /**
         * This executes the transition for the panel
            ```
            $.ui.runTransition(transition,oldDiv,currDiv,back)
            ```
         * @api private
         * @title $.ui.runTransition(transition,oldDiv,currDiv,back)
         */
        runTransition: function(transition, oldDiv, currWhat, back) {
            if (!this.availableTransitions[transition]) transition = 'default';
            this.availableTransitions[transition].call(this, oldDiv, currWhat, back);
        },

        /**
         * This is callled when you want to launch afui.  If autoLaunch is set to true, it gets called on DOMContentLoaded.
         * If autoLaunch is set to false, you can manually invoke it.
           ```
           $.ui.autoLaunch=false;
           $.ui.launch();
           ```
         * @title $.ui.launch();
         */
        launch: function() {

            if (this.hasLaunched === false || this.launchCompleted) {
                this.hasLaunched = true;
                return;
            }

            var that = this;
            this.isIntel = (window.AppMobi && typeof(AppMobi) == "object" && AppMobi.app !== undefined) ? true : false;
            this.viewportContainer = af.query("#afui");
            this.navbar = af.query("#navbar").get(0);
            this.content = af.query("#content").get(0);
            this.header = af.query("#header").get(0);
            this.menu = af.query("#menu").get(0);
            //set anchor click handler for UI
            this.viewportContainer.on("click", "a", function(e) {
                checkAnchorClick(e, e.currentTarget);
            });


            //enter-edit scroll paddings fix
            //focus scroll adjust fix
            var enterEditEl = null;

            //on enter-edit keep a reference of the actioned element
            $.bind($.touchLayer, 'enter-edit', function(el) {
                enterEditEl = el;
            });
            //enter-edit-reshape panel padding and scroll adjust
            $.bind($.touchLayer, 'enter-edit-reshape', function() {
                //onReshape UI fixes
                //check if focused element is within active panel
                var jQel = $(enterEditEl);
                var jQactive = jQel.closest(that.activeDiv);
                if (jQactive && jQactive.size() > 0) {
                    if ($.os.ios || $.os.chrome) {
                        var paddingTop, paddingBottom;
                        if (document.body.scrollTop) {
                            paddingTop = document.body.scrollTop - jQactive.offset().top;
                        } else {
                            paddingTop = 0;
                        }
                        //not exact, can be a little above the actual value
                        //but we haven't found an accurate way to measure it and this is the best so far
                        paddingBottom = jQactive.offset().bottom - jQel.offset().bottom;
                        that.scrollingDivs[that.activeDiv.id].setPaddings(paddingTop, paddingBottom);

                    } else if ($.os.android || $.os.blackberry) {
                        var elPos = jQel.offset();
                        var containerPos = jQactive.offset();
                        if (elPos.bottom > containerPos.bottom && elPos.height < containerPos.height) {
                            //apply fix
                            that.scrollingDivs[that.activeDiv.id].scrollToItem(jQel, 'bottom');
                        }
                    }
                }
            });
            if ($.os.ios) {
                $.bind($.touchLayer, 'exit-edit-reshape', function() {
                    that.scrollingDivs[that.activeDiv.id].setPaddings(0, 0);
                });
            }


            //elements setup
            if (!this.navbar) {
                this.navbar = $.create("div", {
                    id: "navbar"
                }).get(0);
                this.viewportContainer.append(this.navbar);
            }
            if (!this.header) {
                this.header = $.create("div", {
                    id: "header"
                }).get(0);
                this.viewportContainer.prepend(this.header);
            }
            if (!this.menu) {
                this.menu = $.create("div", {
                    id: "menu",
                    html: '<div id="menu_scroller"></div>'
                }).get(0);
                this.viewportContainer.append(this.menu);
                this.menu.style.overflow = "hidden";
                this.scrollingDivs.menu_scroller = $.query("#menu_scroller").scroller({
                    scrollBars: true,
                    verticalScroll: true,
                    vScrollCSS: "afScrollbar",
                    useJsScroll: !$.feat.nativeTouchScroll,
                    noParent: $.feat.nativeTouchScroll,
                    autoEnable: true,
                    lockBounce: this.lockPageBounce
                });
                if ($.feat.nativeTouchScroll) $.query("#menu_scroller").css("height", "100%");
            }

            if (!this.content) {
                this.content = $.create("div", {
                    id: "content"
                }).get(0);
                this.viewportContainer.append(this.content);
            }

            //insert backbutton (should optionally be left to developer..)
            $(this.header).html('<a id="backButton" class="button"></a> <h1 id="pageTitle"></h1>' + header.innerHTML);
            this.backButton = $.query("#header #backButton").css("visibility", "hidden");
            $(document).on("click", "#header #backButton", function(e) {
                e.preventDefault();
                that.goBack();
            });

            //page title (should optionally be left to developer..)
            this.titleBar = $.query("#header #pageTitle").get(0);

            //setup ajax mask
            this.addContentDiv("afui_ajax", "");
            var maskDiv = $.create("div", {
                id: "afui_mask",
                className: "ui-loader",
                html: "<span class='ui-icon ui-icon-loading spin'></span><h1>Loading Content</h1>"
            }).css({
                'z-index': 20000,
                display: "none"
            });
            document.body.appendChild(maskDiv.get(0));
            //setup modalDiv
            var modalDiv = $.create("div", {
                id: "afui_modal"
            }).get(0);

            modalDiv.appendChild($.create("div", {
                id: 'modalContainer'
            }).get(0));
            this.modalTransContainer = $.create("div", {
                id: "modalTransContainer"
            }).appendTo(modalDiv).get(0);
            this.viewportContainer.append(modalDiv);
            this.scrollingDivs.modal_container = $.query("#modalContainer").scroller({
                scrollBars: true,
                vertical: true,
                vScrollCSS: "afScrollbar",
                noParent: true,
                lockBounce: this.lockPageBounce
            });
            this.modalWindow = modalDiv;
            //get first div, defer
            var defer = {};
            var contentDivs = this.viewportContainer.get(0).querySelectorAll(".panel");
            for (var i = 0; i < contentDivs.length; i++) {
                var el = contentDivs[i];
                var tmp = el;
                var id;
                var prevSibling = el.previousSibling;
                if (el.parentNode && el.parentNode.id != "content") {

                    el.parentNode.removeChild(el);
                    id = el.id;
                    if (tmp.getAttribute("selected")) this.firstDiv = $.query("#" + id).get(0);
                    this.addDivAndScroll(tmp);
                    $.query("#" + id).insertAfter(prevSibling);
                } else if (!el.parsedContent) {
                    el.parsedContent = 1;
                    el.parentNode.removeChild(el);
                    id = el.id;
                    if (tmp.getAttribute("selected")) this.firstDiv = $.query("#" + id).get(0);
                    this.addDivAndScroll(tmp);
                    $.query("#" + id).insertAfter(prevSibling);
                }
                if (el.getAttribute("data-defer")) {
                    defer[id] = el.getAttribute("data-defer");
                }
                if (!this.firstDiv) this.firstDiv = $.query("#" + id).get(0);

                el = null;
            }
            contentDivs = null;
            var loadingDefer = false;
            var toLoad = Object.keys(defer).length;
            if (toLoad > 0) {
                loadingDefer = true;
                var loaded = 0;
                for (var j in defer) {
                    (function(j) {
                        $.ajax({
                            url: AppMobi.webRoot + defer[j],
                            success: function(data) {
                                if (data.length === 0) return;
                                that.updatePanel(j, data);
                                that.parseScriptTags($.query("#" + j).get(0));
                                loaded++;
                                if (loaded >= toLoad) {
                                    $(document).trigger("defer:loaded");
                                    loadingDefer = false;

                                }
                            },
                            error: function(msg) {
                                //still trigger the file as being loaded to not block $.ui.ready
                                console.log("Error with deferred load " + AppMobi.webRoot + defer[j]);
                                loaded++;
                                if (loaded >= toLoad) {
                                    $(document).trigger("defer:loaded");
                                    loadingDefer = false;
                                }
                            }
                        });
                    })(j);
                }
            }
            if (this.firstDiv) {
                this.activeDiv = this.firstDiv;
                if (this.scrollingDivs[this.activeDiv.id]) {
                    this.scrollingDivs[this.activeDiv.id].enable();
                }

                var loadFirstDiv = function() {


                    $.query("#navbar").append($.create("footer", {
                        id: 'defaultNav'
                    }).append($.query("#navbar").children()));
                    that.defaultFooter = "defaultNav";
                    that.prevFooter = $.query("#defaultNav");
                    that.updateNavbarElements(that.prevFooter);
                    //setup initial menu
                    var firstMenu = $.query("nav").get(0);
                    if (firstMenu) {
                        that.defaultMenu = $(firstMenu);
                        that.updateSideMenuElements(that.defaultMenu);
                        that.prevMenu = that.defaultMenu;
                    }
                    //get default header
                    that.defaultHeader = "defaultHeader";
                    $.query("#header").append($.create("header", {
                        id: 'defaultHeader'
                    }).append($.query("#header").children()));
                    that.prevHeader = $.query("#defaultHeader");

                    //
                    $.query("#navbar").on("click", "a", function(e) {
                        $.query("#navbar a").not(e.currentTarget).removeClass("pressed");
                        $(e.currentTarget).addClass("pressed");
                    });

                    //update the width
                    var footerLinks = $.query("#navbar a");
                    if (footerLinks.length > 0) {
                        footerLinks.css("width", (100 / footerLinks.length) + "%");
                    }

                    //There is a bug in chrome with @media queries where the header was not getting repainted
                    if ($.query("nav").length > 0) {
                        $.query("#afui #header").addClass("hasMenu");
                        $.query("#afui #content").addClass("hasMenu");
                        $.query("#afui #navbar").addClass("hasMenu");
                        $.query("#afui #menu").addClass("tabletMenu");
                    }
                    //go to activeDiv
                    var firstPanelId = that.getPanelId(defaultHash);
                    //that.history=[{target:'#'+that.firstDiv.id}];   //set the first id as origin of path
                    if (firstPanelId.length > 0 && that.loadDefaultHash && firstPanelId != ("#" + that.firstDiv.id) && $.query(firstPanelId).length > 0) {
                        that.loadContent(defaultHash, true, false, 'none'); //load the active page as a newTab with no transition

                    } else {
                        previousTarget = "#" + that.firstDiv.id;

                        that.firstDiv.style.display = "block";
                        //Let's check if it has a function to run to update the data
                        that.parsePanelFunctions(that.firstDiv);
                        //Need to call after parsePanelFunctions, since new headers can override
                        that.loadContentData(that.firstDiv);

                        $.query("#header #backButton").css("visibility", "hidden");
                        if (that.firstDiv.getAttribute("data-modal") == "true" || that.firstDiv.getAttribute("modal") == "true") {
                            that.showModal(that.firstDiv.id);
                        }
                    }

                    that.launchCompleted = true;
                    //trigger ui ready
                    $(document).trigger("afui:ready");
                    $.query("#afui #splashscreen").remove();
                };
                if (loadingDefer) {
                    $(document).one("defer:loaded", loadFirstDiv);
                } else loadFirstDiv();
            }
            $.bind(that, "content-loaded", function() {
                if (that.loadContentQueue.length > 0) {
                    var tmp = that.loadContentQueue.splice(0, 1)[0];
                    that.loadContent(tmp[0], tmp[1], tmp[2], tmp[3], tmp[4]);
                }
            });
            if (window.navigator.standalone||this.isIntel) {
                this.blockPageScroll();
            }
            this.topClickScroll();

        },
        /**
         * This simulates the click and scroll to top of browsers
         */
        topClickScroll: function() {
            var that = this;
            document.getElementById("header").addEventListener("click", function(e) {
                if (e.clientY <= 15 && e.target.nodeName.toLowerCase() == "h1") //hack - the title spans the whole width of the header
                    that.scrollingDivs[that.activeDiv.id].scrollToTop("100");
            });

        },
        /**
         * This blocks the page from scrolling/panning.  Usefull for native apps
         */
        blockPageScroll: function() {
            $.query("#afui #header").bind("touchmove", function(e) {
                e.preventDefault();
            });
        },
        /**
         * This is the default transition.  It simply shows the new panel and hides the old
         */
        noTransition: function(oldDiv, currDiv, back) {
            currDiv.style.display = "block";
            oldDiv.style.display = "block";
            var that = this;
            that.clearAnimations(currDiv);
            that.css3animate(oldDiv, {
                x: "0%",
                y: 0
            });
            that.finishTransition(oldDiv);
            currDiv.style.zIndex = 2;
            oldDiv.style.zIndex = 1;
        },
        /**
         * This must be called at the end of every transition to hide the old div and reset the doingTransition variable
         *
         * @param {Object} Div that transitioned out
         * @title $.ui.finishTransition(oldDiv)
         */
        finishTransition: function(oldDiv, currDiv) {
            oldDiv.style.display = 'none';
            this.doingTransition = false;
            if (currDiv) this.clearAnimations(currDiv);
            if (oldDiv) this.clearAnimations(oldDiv);
            $.trigger(this, "content-loaded");
        },

        /**
         * This must be called at the end of every transition to remove all transforms and transitions attached to the inView object (performance + native scroll)
         *
         * @param {Object} Div that transitioned out
         * @title $.ui.finishTransition(oldDiv)
         */
        clearAnimations: function(inViewDiv) {
            inViewDiv.style[$.feat.cssPrefix + 'Transform'] = "none";
            inViewDiv.style[$.feat.cssPrefix + 'Transition'] = "none";
        }

        /**
         * END
         * @api private
         */
    };


    //lookup for a clicked anchor recursively and fire UI own actions when applicable
    var checkAnchorClick = function(e, theTarget) {

        if (theTarget == (afui)) {
            return;
        }

        //this technique fails when considerable content exists inside anchor, should be recursive ?
        if (theTarget.tagName.toLowerCase() != "a" && theTarget.parentNode) return checkAnchorClick(e, theTarget.parentNode); //let's try the parent (recursive)
        //anchors
        if (theTarget.tagName !== "undefined" && theTarget.tagName.toLowerCase() == "a") {

            var custom = (typeof $.ui.customClickHandler == "function") ? $.ui.customClickHandler : false;
            if (custom !== false) {
                if ($.ui.customClickHandler(theTarget)) return e.preventDefault();

            }
            if (theTarget.href.toLowerCase().indexOf("javascript:") !== -1 || theTarget.getAttribute("data-ignore")) {
                return;
            }


            if (theTarget.href.indexOf("tel:") === 0) return false;

            //external links
            if (theTarget.hash.indexOf("#") === -1 && theTarget.target.length > 0) {
                if (theTarget.href.toLowerCase().indexOf("javascript:") !== 0) {
                    if ($.ui.isIntel) {
                        e.preventDefault();
                        AppMobi.device.launchExternal(theTarget.href);
                    } else if (!$.os.desktop) {
                        e.target.target = "_blank";
                    }
                }
                return;
            }

            /* IE 10 fixes*/

            var href = theTarget.href,
                prefix = location.protocol + "//" + location.hostname + ":" + location.port + location.pathname;
            if (href.indexOf(prefix) === 0) {
                href = href.substring(prefix.length);
            }
            //empty links
            if (href == "#" || (href.indexOf("#") === href.length - 1) || (href.length === 0 && theTarget.hash.length === 0)) return;

            //internal links
            e.preventDefault();
            var mytransition = theTarget.getAttribute("data-transition");
            var resetHistory = theTarget.getAttribute("data-resetHistory");
            resetHistory = resetHistory && resetHistory.toLowerCase() == "true" ? true : false;
            href = theTarget.hash.length > 0 ? theTarget.hash : href;
            $.ui.loadContent(href, resetHistory, 0, mytransition, theTarget);
            return;
        }
    };

    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D"; /* Number */
    var crc32 = function( /* String */ str, /* Number */ crc) {
        if (crc === undefined) crc = 0;
        var n = 0; //a number between 0 and 255
        var x = 0; //an hex number
        crc = crc ^ (-1);
        for (var i = 0, iTop = str.length; i < iTop; i++) {
            n = (crc ^ str.charCodeAt(i)) & 0xFF;
            x = "0x" + table.substr(n * 9, 8);
            crc = (crc >>> 8) ^ x;
        }
        return crc ^ (-1);
    };


    $.ui = new ui();

})(af);



//The following functions are utilitiy functions for afui within appMobi.

(function() {
    $(document).one("appMobi.device.ready", function() { //in AppMobi, we need to undo the height stuff since it causes issues.
        setTimeout(function() {
            document.getElementById('afui').style.height = "100%";
            document.body.style.height = "100%";
            document.documentElement.style.minHeight = window.innerHeight;
        }, 300);
        $.ui.ready(function() {
            $.ui.blockPageScroll();
        });
    });
    //Fix an ios bug where scrolling will not work with rotation
    if ($.feat.nativeTouchScroll) {
        document.addEventListener("orientationchange", function(e) {
            if ($.ui.scrollingDivs[$.ui.activeDiv.id]) {
                var tmpscroller = $.ui.scrollingDivs[$.ui.activeDiv.id];
                if (tmpscroller.el.scrollTop === 0) {
                    tmpscroller.disable();
                    setTimeout(function() {
                        tmpscroller.enable();
                    }, 300);
                }
            }
        });
    }
})();
(function($ui){
        function fadeTransition (oldDiv, currDiv, back) {
            oldDiv.style.display = "block";
            currDiv.style.display = "block";
            var that = this;
            if (back) {
                currDiv.style.zIndex = 1;
                oldDiv.style.zIndex = 2;
                that.clearAnimations(currDiv);
                that.css3animate(oldDiv, {
                    x: "0%",
                    time: $ui.transitionTime,
                    opacity: 0.1,
                    complete: function(canceled) {
                        if(canceled) {
                            that.finishTransition(oldDiv, currDiv);
                            return;
                        }

                        that.css3animate(oldDiv, {
                            x: "-100%",
                            opacity: 1,
                            complete: function() {
                                that.finishTransition(oldDiv);
                            }

                        });
                        currDiv.style.zIndex = 2;
                        oldDiv.style.zIndex = 1;
                    }
                });
            } else {
                oldDiv.style.zIndex = 1;
                currDiv.style.zIndex = 2;
                currDiv.style.opacity = 0;
                that.css3animate(currDiv, {
                    x: "0%",
                    opacity: 0.1,
                    complete: function() {
                        that.css3animate(currDiv, {
                            x: "0%",
                            time: $ui.transitionTime,
                            opacity: 1,
                            complete:function(canceled){
                                if(canceled) {
                                    that.finishTransition(oldDiv, currDiv);
                                    return;
                                }

                                that.clearAnimations(currDiv);
                                that.css3animate(oldDiv, {
                                    x: "-100%",
                                    y: 0,
                                    complete: function() {
                                        that.finishTransition(oldDiv);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
        $ui.availableTransitions.fade = fadeTransition;
})(af.ui);


(function ($ui) {

    function flipTransition(oldDiv, currDiv, back) {
        oldDiv.style.display = "block";
        currDiv.style.display = "block";
        var that = this;
        if (back) {
            that.css3animate(currDiv, {
                x: "100%",
                scale: 0.8,
                rotateY: "180deg",
                complete: function () {
                    that.css3animate(currDiv, {
                        x: "0%",
                        scale: 1,
                        time: $ui.transitionTime,
                        rotateY: "0deg",
                        complete: function () {
                            that.clearAnimations(currDiv);
                        }
                    });
                }
            });
            that.css3animate(oldDiv, {
                x: "100%",
                time: $ui.transitionTime,
                scale: 0.8,
                rotateY: "180deg",
                complete: function () {
                    that.css3animate(oldDiv, {
                        x: "-100%",
                        opacity: 1,
                        scale: 1,
                        rotateY: "0deg",
                        complete: function () {
                            that.finishTransition(oldDiv);
                        }
                    });
                    currDiv.style.zIndex = 2;
                    oldDiv.style.zIndex = 1;
                }
            });
        } else {
            oldDiv.style.zIndex = 1;
            currDiv.style.zIndex = 2;
            that.css3animate(currDiv, {
                x: "100%",
                scale: 0.8,
                rotateY: "180deg",
                complete: function () {
                    that.css3animate(currDiv, {
                        x: "0%",
                        scale: 1,
                        time: $ui.transitionTime,
                        rotateY: "0deg",
                        complete: function () {
                            that.clearAnimations(currDiv);
                        }
                    });
                }
            });
            that.css3animate(oldDiv, {
                x: "100%",
                time: $ui.transitionTime,
                scale: 0.8,
                rotateY: "180deg",
                complete: function () {
                    that.css3animate(oldDiv, {
                        x: "-100%",
                        opacity: 1,
                        scale: 1,
                        rotateY: "0deg",
                        complete: function () {
                            that.finishTransition(oldDiv);
                        }
                    });
                    currDiv.style.zIndex = 2;
                    oldDiv.style.zIndex = 1;
                }
            });
        }
    }
    $ui.availableTransitions.flip = flipTransition;
})(af.ui);
(function ($ui) {

    function popTransition(oldDiv, currDiv, back) {
        oldDiv.style.display = "block";
        currDiv.style.display = "block";
        var that = this;
        if (back) {
            currDiv.style.zIndex = 1;
            oldDiv.style.zIndex = 2;
            that.clearAnimations(currDiv);
            that.css3animate(oldDiv, {
                x:"0%",
                time: $ui.transitionTime,
                opacity: 0.1,
                scale: 0.2,
                origin:"50% 50%",
                complete: function (canceled) {
                    if (canceled) {
                        that.finishTransition(oldDiv);
                        return;
                    }

                    that.css3animate(oldDiv, {
                        x: "-100%",
                        complete: function () {
                            that.finishTransition(oldDiv);
                        }
                    });
                    currDiv.style.zIndex = 2;
                    oldDiv.style.zIndex = 1;
                }
            });
        } else {
            oldDiv.style.zIndex = 1;
            currDiv.style.zIndex = 2;
            that.css3animate(currDiv, {
                x: "0%",
                scale: 0.2,
                origin: "50%" + " 50%",
                opacity: 0.1,
                time:"0ms",
                complete: function () {
                    that.css3animate(currDiv, {
                        x: "0%",
                        time: $ui.transitionTime,
                        scale: 1,
                        opacity: 1,
                        origin: "0%" + " 0%",
                        complete: function (canceled) {
                            if (canceled) {
                                that.finishTransition(oldDiv, currDiv);
                                return;
                            }

                            that.clearAnimations(currDiv);
                            that.css3animate(oldDiv, {
                                x: "100%",
                                y: 0,
                                complete: function () {
                                    that.finishTransition(oldDiv);
                                }
                            });
                        }
                    });
                }
            });
        }
    }
    $ui.availableTransitions.pop = popTransition;
})(af.ui);
(function ($ui) {

    /**
     * Initiate a sliding transition.  This is a sample to show how transitions are implemented.  These are registered in $ui.availableTransitions and take in three parameters.
     * @param {Object} previous panel
     * @param {Object} current panel
     * @param {Boolean} go back
     * @title $ui.slideTransition(previousPanel,currentPanel,goBack);
     */
    function slideTransition(oldDiv, currDiv, back) {

        oldDiv.style.display = "block";
        currDiv.style.display = "block";
        var that = this;
        if (back) {
            that.css3animate(oldDiv, {
                x: "0%",
                y: "0%",
                complete: function () {
                    that.css3animate(oldDiv, {
                        x: "100%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    }).link(currDiv, {
                        x: "0%",
                        time: $ui.transitionTime
                    });
                }
            }).link(currDiv, {
                x: "-100%",
                y: "0%"
            });
        } else {
            that.css3animate(oldDiv, {
                x: "0%",
                y: "0%",
                complete: function () {
                    that.css3animate(oldDiv, {
                        x: "-100%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    }).link(currDiv, {
                        x: "0%",
                        time: $ui.transitionTime
                    });
                }
            }).link(currDiv, {
                x: "100%",
                y: "0%"
            });
        }
    }
    $ui.availableTransitions.slide = slideTransition;
    $ui.availableTransitions['default'] = slideTransition;
})(af.ui);
(function ($ui) {

    function slideDownTransition(oldDiv, currDiv, back) {
        oldDiv.style.display = "block";
        currDiv.style.display = "block";
        var that = this;
        if (back) {
            oldDiv.style.zIndex = 2;
            currDiv.style.zIndex = 1;
            that.css3animate(oldDiv, {
                y: "0%",
                x: "0%",
                complete: function () {
                    that.css3animate(oldDiv, {
                        y: "-100%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    });
                }
            });
        } else {
            oldDiv.style.zIndex = 1;
            currDiv.style.zIndex = 2;
            that.css3animate(currDiv, {
                y: "-100%",
                x: "0%",
                time:"10ms",
                complete: function () {
                    that.css3animate(currDiv, {
                        y: "0%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    });
                }
            });
        }
    }
    $ui.availableTransitions.down = slideDownTransition;
})(af.ui);
(function ($ui) {

    function slideUpTransition(oldDiv, currDiv, back) {
        oldDiv.style.display = "block";
        currDiv.style.display = "block";
        var that = this;
        if (back) {
            oldDiv.style.zIndex = 2;
            currDiv.style.zIndex = 1;
            that.css3animate(oldDiv, {
                y: "0%",
                x: "0%",
                complete: function () {
                    that.css3animate(oldDiv, {
                        y: "100%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    });
                }
            });
        } else {
            oldDiv.style.zIndex = 1;
            currDiv.style.zIndex = 2;
            that.css3animate(currDiv, {
                y: "100%",
                x: "0%",
                time:"10ms",
                complete: function () {
                    that.css3animate(currDiv, {
                        y: "0%",
                        time: $ui.transitionTime,
                        complete: function () {
                            that.finishTransition(oldDiv, currDiv);
                        }
                    });
                }
            });
        }
    }
    $ui.availableTransitions.up = slideUpTransition;
})(af.ui);

/**
 * af.8tiles - Provides a WP8 theme and handles showing the menu
 * Copyright 2012 - Intel
 */;
(function($) {
	"use strict";

	if (!$) {
		throw "This plugin requires jqUi";
	}

	function wire8Tiles() {
		$.ui.isWin8 = true;
		if (!$.os.ie) return;

		$.ui.ready(function() {

			if ($.ui.slideSideMenu) $.ui.slideSideMenu = false;
			//we need to make sure the menu button shows up in the bottom navbar
			$.query("#afui #navbar footer").append("<a id='metroMenu' onclick='$.ui.toggleSideMenu()'>•••</a>");
			var tmpAnchors = $.query("#afui #navbar").find("a");
			if (tmpAnchors.length > 0) {
				tmpAnchors.data("ignore-pressed", "true").data("resetHistory", "true");
				var width = parseFloat(100 / tmpAnchors.length);
				tmpAnchors.css("width", width + "%");
			}
			var oldUpdate = $.ui.updateNavbarElements;
			$.ui.updateNavbarElements = function() {
				oldUpdate.apply($.ui, arguments);
				if ($.query("#afui #navbar #metroMenu").length == 1) return;
				$.query("#afui #navbar footer").append("<a id='metroMenu' onclick='$.ui.toggleSideMenu()'>•••</a>");
			};

			var oldToggle = $.ui.toggleSideMenu;
			$.ui.isSideMenuOn = function() {

				var menu = parseInt($.getCssMatrix($("#navbar")).f) < 0 ? true : false;
				return this.isSideMenuEnabled() && menu;
			};
			$.ui.toggleSideMenu = function(force, callback) {
				if (!this.isSideMenuEnabled() || this.togglingSideMenu) return;
				this.togglingSideMenu = true;
				var that = this;
				var menu = $.query("#menu");
				var els = $.query("#navbar");
				var open = this.isSideMenuOn();

				if (force === 2 || (!open && ((force !== undefined && force !== false) || force === undefined))) {
					menu.show();

					that.css3animate(els, {
						y: "-150px",
						time: $.ui.transitionTime,
						complete: function(canceled) {
							that.togglingSideMenu = false;

							if (callback) callback(true);

						}
					});
					that.css3animate(menu, {
						y: "0px",
						time: $.ui.transitionTime
					});

				} else if (force === undefined || (force !== undefined && force === false)) {

					that.css3animate(els, {
						y: "0",
						time: $.ui.transitionTime,
						complete: function(canceled) {


							that.togglingSideMenu = false;
							if (callback) callback(true);
							menu.hide();
						}
					});
					that.css3animate(menu, {
						y: "150px",
						time: $.ui.transitionTime
					});
				}
			};
		});
	}

	if (!$.ui) {
		$(document).ready(function() {
			wire8Tiles();
		});
	} else {
		wire8Tiles();
	}
})(af);
