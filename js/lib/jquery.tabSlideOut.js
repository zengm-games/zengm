// Based on tabSlideOut v1.3 by William Paoli http://wpaoli.building58.com but with cleaned up (and less general) code.

/*global jQuery */
(function ($) {
    $.fn.tabSlideOut = function (callerSettings) {
        const settings = $.extend({
            rightPos: '20px'
        }, callerSettings || {});

        settings.tabHandle = $(settings.tabHandle);
        const obj = this;

        settings.tabHandle.css({position: 'absolute'});
        obj.css({position: 'absolute'});

        const containerHeight = `${parseInt(obj.outerHeight(), 10)}px`;
        const tabHeight = `${parseInt(settings.tabHandle.outerHeight(), 10)}px`;

        // Set calculated css
        obj.css({right: settings.rightPos});
        settings.tabHandle.css({right: 0});
        obj.css({bottom: `-${containerHeight}`, position: 'fixed'});
        settings.tabHandle.css({top: `-${tabHeight}`});

        // Functions for animation events
        settings.tabHandle.click(event => event.stopPropagation());

        const slideIn = () => {
            obj.animate({bottom: `-${containerHeight}`}, 300).removeClass('open');
        };

        const slideOut = () => {
            obj.animate({bottom: '-3px'}, 300).addClass('open');
        };

        settings.tabHandle.click(() => {
            if (obj.hasClass('open')) {
                slideIn();
            } else {
                slideOut();
            }
        });

        // Click screen to close
        obj.click(event => event.stopPropagation());
        $(document).click(event => {
            // Make sure there was a left click, as apparently jQuery's .click fires for left and right clicks when attached to document but not when attached to obj as above.
            if (event.button !== 0) {
                return true;
            }

            slideIn();
        });
    };
}(jQuery));