// Originally based on https://github.com/Srirangan/notifer.js/

define(function () {
    "use strict";

    var Notifier, container;

    container = document.createElement("div");
    container.classList.add("notification-container");
    document.body.appendChild(container);

    Notifier = {};

    Notifier.notify = function (message, title, persistent, timeOut) {
        var closeLink, i, notificationElement, remaining, removeOnFadeOut, text, textElement, timeoutId, timeoutRemaining, timeoutStart;

        persistent = persistent !== undefined ? persistent : false;
        timeoutRemaining = timeOut || 5000;
console.log(persistent);

        notificationElement = document.createElement("div");
        notificationElement.classList.add("notification");

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

        if (!persistent) {
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
        } else {
            // Add close link to persistent ones
            closeLink = document.createElement("button");
            closeLink.classList.add("notification-close");
            closeLink.innerHTML = "&times;";
            notificationElement.classList.add("notification-persistent");
            closeLink.addEventListener("click", function () {
                notificationElement.classList.add("notification-delete");
            });

            notificationElement.appendChild(closeLink);
        }

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

        // Limit displayed notifications to 5 - all the persistent ones, plus the newest ones
        remaining = 5;
        for (i = 0; i <= container.childNodes.length - 1; i++) {
            if (container.childNodes[i].classList.contains("notification-persistent")) {
                remaining -= 1;
            } else {
                container.childNodes[i].classList.add("notification-delete");
            }

            if (i > container.childNodes.length - remaining) {
                break;
            }
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