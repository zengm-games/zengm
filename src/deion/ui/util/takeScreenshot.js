import html2canvas from "html2canvas";
import { fetchWrapper } from "../../common";
import helpers from "./helpers";
import logEvent from "./logEvent";

const takeScreenshot = async () => {
    const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";

    const contentEl = document.getElementById("actual-actual-content");
    if (!contentEl) {
        throw new Error("Missing DOM element #actual-actual-content");
    }

    // Add watermark
    contentEl.style.display = "inline-block";
    const watermark = document.createElement("div");
    const logos = document.getElementsByClassName("spin");
    const logoHTML = logos.length > 0 ? `<img src="${logos[0].src}">` : "";
    watermark.innerHTML = `<nav class="navbar navbar-light bg-light mb-3"><a class="navbar-brand mr-auto" href="#">${logoHTML} ${helpers.upperCaseFirstLetter(
        process.env.SPORT,
    )} GM</a><div class="flex-grow-1"></div><span class="navbar-text navbar-right" style="color: ${
        theme === "dark" ? "#fff" : "#000"
    }; font-weight: bold">Play your own league free at ${
        process.env.SPORT
    }-gm.com</span></nav>`;
    contentEl.insertBefore(watermark, contentEl.firstChild);
    contentEl.style.padding = "8px";

    // Add notifications
    const notifications = document
        .getElementsByClassName("notification-container")[0]
        .cloneNode(true);
    notifications.classList.remove("notification-container");
    for (let i = 0; i < notifications.childNodes.length; i++) {
        // Otherwise screeenshot is taken before fade in is complete
        const el = notifications.children[0];
        if (el.classList && typeof el.classList.remove === "function") {
            el.classList.remove("notification-fadein");
        }
    }
    contentEl.appendChild(notifications);

    const canvas = await html2canvas(contentEl, {
        backgroundColor: theme === "dark" ? "#212529" : "#fff",
    });

    // Remove watermark
    contentEl.style.display = "";
    contentEl.removeChild(watermark);
    contentEl.style.padding = "";

    // Remove notifications
    contentEl.removeChild(notifications);

    logEvent({
        type: "screenshot",
        text: `Uploading your screenshot to Imgur...`,
        saveToDb: false,
        showNotification: true,
        persistent: false,
        extraClass: "notification-primary",
    });

    try {
        const data = await fetchWrapper({
            url: "https://imgur-apiv3.p.mashape.com/3/image",
            method: "POST",
            headers: {
                Authorization: "Client-ID c2593243d3ea679",
                "X-Mashape-Key":
                    "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
            },
            data: {
                image: canvas.toDataURL().split(",")[1],
            },
        });

        if (data.data.error) {
            console.log(data.data.error);
            throw new Error(data.data.error.message);
        }

        const url = `http://imgur.com/${data.data.id}`;
        const encodedURL = window.encodeURIComponent(url);

        logEvent({
            type: "screenshot",
            text: `<p><a href="${url}" target="_blank">Click here to view your screenshot.</a></p>
<a href="https://www.reddit.com/r/${
                process.env.SPORT === "basketball"
                    ? "BasketballGM"
                    : "Football_GM"
            }/submit?url=${encodedURL}">Share on Reddit</a><br>
<a href="https://twitter.com/intent/tweet?url=${encodedURL}&via=${
                process.env.SPORT === "basketball"
                    ? "basketball_gm"
                    : "FootballGM_Game"
            }">Share on Twitter</a>`,
            saveToDb: false,
            showNotification: true,
            persistent: true,
            extraClass: "notification-primary",
        });
    } catch (err) {
        console.log(err);
        let errorMsg;
        if (
            err &&
            err.responseJSON &&
            err.responseJSON.error &&
            err.responseJSON.error.message
        ) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${err.responseJSON.error.message}"`;
        } else if (err.message) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${err.message}"`;
        } else {
            errorMsg = "Error saving screenshot.";
        }
        logEvent({
            type: "error",
            text: errorMsg,
            saveToDb: false,
        });
    }
};

export default takeScreenshot;
