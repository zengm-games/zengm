// Originally based on https://github.com/Srirangan/notifer.js/

define(function () {
    "use strict";

    var container, Notifier;

    container = document.createElement("div");
    container.classList.add("notification-container");
    document.body.appendChild(container);

    Notifier = {};

    Notifier.notify = function (message, title, timeOut) {
        var i, notificationElement, removeOnFadeOut, text, textElement, timeoutId, timeoutRemaining, timeoutStart;

        notificationElement = document.createElement("div");
        notificationElement.classList.add("notification");

        timeoutRemaining = timeOut || 5000;

        textElement = document.createElement("div");

        text = "";
        if (title) {
            text += "<strong>" + title + "</strong><br>";
        }
        if (message) {
            text += message;
        }
        textElement.innerHTML = text;
        notificationElement.appendChild(textElement);

        // Hide notification after timeout
        function notificationTimeout() {
            timeoutId = window.setTimeout(function () {
                if (container.contains(notificationElement)) {
                    notificationElement.classList.add("notification-delete");
                }
            }, timeoutRemaining);
            timeoutStart = new Date();
        }
        notificationTimeout();

        // When hovering over, don't count towards timeout
        notificationElement.addEventListener("mouseenter", function () {
            window.clearTimeout(timeoutId);
            timeoutRemaining -= new Date() - timeoutStart;
        });
        notificationElement.addEventListener("mouseleave", function () {
            notificationTimeout();
        });

        /*// Hide notification on click, except if it's a link
        notificationElement.addEventListener("click", function (event) {
            container.removeChild(notificationElement);
            notificationElement = null;
        });
        // PROBLEM: Stopping hiding on link click doesn't work because it also stops Davis.js from working
        links = notificationElement.getElementsByTagName("a");
        for (i = 0; i < links.length; i++) {
            links[0].addEventListener("click", function (event) {
                event.stopPropagation();
            });
        }*/

        // Limit displayed notifications to 5
        for (i = 0; i <= container.childNodes.length - 5; i++) {
            container.childNodes[i].classList.add("notification-delete");
        }

        removeOnFadeOut = function (event) {
            if (event.animationName === "fadeOut") {
                container.removeChild(notificationElement);
                notificationElement = null;
            }
        };
        notificationElement.addEventListener("webkitAnimationEnd", removeOnFadeOut, false);
        notificationElement.addEventListener("animationend", removeOnFadeOut, false);


        container.appendChild(notificationElement);
    };

    return {
        notify: Notifier.notify
    };
});