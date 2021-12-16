import html2canvas from "html2canvas";
import {
	fetchWrapper,
	GAME_NAME,
	SUBREDDIT_NAME,
	TWITTER_HANDLE,
	isSport,
} from "../../common";
import logEvent from "./logEvent";

const takeScreenshotChunk = async () => {
	const theme = window.getTheme().startsWith("dark") ? "dark" : "light";

	const contentEl = document.getElementById("actual-actual-content");
	if (!contentEl) {
		throw new Error("Missing DOM element #actual-actual-content");
	}

	// Add watermark
	contentEl.style.display = "inline-block";
	const watermark = document.createElement("div");
	const logos = document.getElementsByClassName("spin");
	const logoHTML =
		logos.length > 0 && logos[0] instanceof HTMLImageElement
			? `<img src="${logos[0].src}" width="18" height="18">`
			: "";
	watermark.innerHTML = `<nav class="navbar navbar-light bg-light rounded-3 px-3"><a class="navbar-brand me-auto" href="#">${logoHTML} ${GAME_NAME}</a><div class="flex-grow-1"></div><span class="navbar-text" style="color: ${
		theme === "dark" ? "#fff" : "#000"
	}; font-weight: bold">Play your own league free at ${process.env.SPORT}${
		!isSport("hockey") ? "-gm" : ".zengm"
	}.com</span></nav>
	<nav class="navbar navbar-border navbar-light mb-2 px-0"><h1 class="mb-0">${
		document.title
	}</nav>`;
	contentEl.insertBefore(watermark, contentEl.firstChild);
	contentEl.style.padding = "8px";

	// Add notifications
	const notifications = document
		.getElementsByClassName("notification-container")[0]
		.cloneNode(true);
	if (notifications instanceof HTMLDivElement) {
		notifications.classList.remove("notification-container");
		for (let i = 0; i < notifications.childNodes.length; i++) {
			// Otherwise screeenshot is taken before fade in is complete
			const el = notifications.children[0];
			if (el.classList && typeof el.classList.remove === "function") {
				el.classList.remove("notification-fadein");
			}
		}
		contentEl.appendChild(notifications);
	}

	window.scrollTo(0, 0);

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
			url: "https://imgur-apiv3.p.rapidapi.com/3/image",
			method: "POST",
			headers: {
				Authorization: "Client-ID c2593243d3ea679",
				"x-rapidapi-host": "imgur-apiv3.p.rapidapi.com",
				"x-rapidapi-key": "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
			},
			data: {
				image: canvas.toDataURL().split(",")[1],
			},
		});

		if (data.data.error) {
			console.log(data.data.error);
			throw new Error(data.data.error.message);
		}

		const url = `https://imgur.com/${data.data.id}`;
		const encodedURL = window.encodeURIComponent(url);

		logEvent({
			type: "screenshot",
			text: `<p><a href="${url}" target="_blank">Click here to view your screenshot.</a></p>
<a href="https://www.reddit.com/r/${SUBREDDIT_NAME}/submit?url=${encodedURL}">Share on Reddit</a><br>
<a href="https://twitter.com/intent/tweet?url=${encodedURL}&via=${TWITTER_HANDLE}">Share on Twitter</a>`,
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

export default takeScreenshotChunk;
