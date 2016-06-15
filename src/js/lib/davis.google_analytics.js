/*!
 * Davis - googleAnalytics
 * Copyright (C) 2011 Oliver Nightingale
 * MIT Licensed
 */

/**
 * Davis.googleAnalytics is a plugin to track Davis requests in google analytics.  It automatically
 * tracks every GET request and adds helpers to manually track other requests and to prevent a
 * particular request from being tracked.
 *
 * To include this plugin in your application first include a script tag for it and then in your
 * app do the following.
 *
 *    this.use(Davis.googleAnalytics)
 *
 * @plugin
 */

var Davis = require('./davis');
var postscribe = require('postscribe');


const bannerAdTop = document.getElementById('banner-ad-top');
const bannerAdBottom = document.getElementById('banner-ad-bottom');

Davis.googleAnalytics = function () {

  /**
   * whether a route should be tracked or not
   * @private
   */
  var shouldTrack = true

  /**
   * bind to the apps routeComplete event and track the request unless explicitly told not to.
   * @private
   */
  this.bind('routeComplete', function (req) {
    if (shouldTrack && req.method == 'get') req.track()
    shouldTrack = true
  })

  this.helpers({
    /**
     * ## request.noTrack
     * Disable tracking for this request
     */
    noTrack: function () {
      shouldTrack = false
    },

    /**
     * ## request.track
     * Track this request in google analytics
     */
    track: function () {
      if (_gaq) _gaq.push(['_trackPageview', this.path])

      if (bannerAdTop) {
        bannerAdTop.innerHTML = '';
        postscribe(bannerAdTop, '<script src="https://tag.contextweb.com/TagPublish/getjs.aspx?action=VIEWAD&cwrun=200&cwadformat=728X90&cwpid=558539&cwwidth=728&cwheight=90&cwpnet=1&cwtagid=448749"></script>');
      }
      if (bannerAdBottom) {
        bannerAdBottom.innerHTML = '';
        postscribe(bannerAdBottom, '<script src="https://tag.contextweb.com/TagPublish/getjs.aspx?action=VIEWAD&cwrun=200&cwadformat=728X90&cwpid=558539&cwwidth=728&cwheight=90&cwpnet=1&cwtagid=448752"></script>');
      }
    }
  })
}