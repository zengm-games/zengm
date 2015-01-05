// Based on tabSlideOUt v1.3 by William Paoli http://wpaoli.building58.com but with cleaned up (and less general) code.
/*global jQuery */
(function ($) {
    "use strict";

    $.fn.tabSlideOut = function (callerSettings) {
        var containerHeight, obj, settings, slideIn, slideOut, tabHeight;

        settings = $.extend({
            rightPos: '20px'
        }, callerSettings || {});

        settings.tabHandle = $(settings.tabHandle);
        obj = this;

        settings.tabHandle.css({position: 'absolute'});
        obj.css({position: 'absolute'});

        containerHeight = parseInt(obj.outerHeight(), 10) + 'px';
        tabHeight = parseInt(settings.tabHandle.outerHeight(), 10) + 'px';

        // Set calculated css
        obj.css({right: settings.rightPos});
        settings.tabHandle.css({right: 0});
        obj.css({bottom: '-' + containerHeight, position: 'fixed'});
        settings.tabHandle.css({top: '-' + tabHeight});

        // Functions for animation events
        settings.tabHandle.click(function (event) {
            event.preventDefault();
        });

        slideIn = function () {
            obj.animate({bottom: '-' + containerHeight}, 300).removeClass('open');
        };

        slideOut = function () {
            obj.animate({bottom: '-3px'}, 300).addClass('open');
        };

        settings.tabHandle.click(function () {
            if (obj.hasClass('open')) {
                slideIn();
            } else {
                slideOut();
            }
        });

        // Click screen to close
        obj.click(function (event) {
            event.stopPropagation();
        });
        $(document).click(function (event) {
            // Make sure there was a left click, as apparently jQuery's .click fires for left and right clicks when attached to document but not when attached to obj as above.
            if (event.button !== 0) {
                return true;
            }

            slideIn();
        });
    };
}(jQuery));