/*
 * Generic function for preloading html pages and
 * images from server and replacing a target element
 */
var Pager = function(target) {
	self = this;
	self.pages = {};
    self.target = target;

	self.preloadImages = function(imagenames) {
		$(imagenames).each(function() {
			image = new Image();
			image.src = this;
		});
	};
	
	self.preloadPages = function(pagenames) {
		// Synchronously preload pages.
		$(pagenames).each(function() {
			$.ajax({
				url: this,
				success: function(page_html) { self.pages[this.url] = page_html;},
				dataType: "html",
				async: false
			});
		});
	};
	// Get HTML file from collection and pass on to a callback
	self.getPage = function(pagename) {
		return self.pages[pagename];
	};

    self.replaceTarget = function(page) {
        self.target.html(page);
    };
	
	self.showPage = _.compose(self.replaceTarget, self.getPage);
	return self;
};
