import html2canvas from "html2canvas";
import {
	GAME_NAME,
	SUBREDDIT_NAME,
	TWITTER_HANDLE,
} from "../../common/constants.ts";
import { showNotification } from "./showNotification.ts";
import { fetchWrapper } from "../../common/fetchWrapper.ts";
import { getLogoSpinnerUrl } from "../../../common/logoSpinners.ts";

// The logo is an animated sprite sheet (a row of square frames, see
// tools/logo-spinners/render/renderSpinner.ts), which html2canvas doesn't draw
// correctly. So make a static SVG of just the first frame. The gold colors are
// normally applied by the #gold URL fragment, which html2canvas also ignores,
// so for gold they're applied directly.
const getLogoFirstFrame = async (gold: boolean) => {
	const response = await fetch(getLogoSpinnerUrl(false));
	let svg = await response.text();

	// Frames are square, so the first one is as wide as the sheet is tall
	const viewBoxRegex = /viewBox="0 0 [\d.]+ ([\d.]+)"/;
	if (!viewBoxRegex.test(svg)) {
		throw new Error("Unexpected logo SVG format");
	}
	svg = svg.replace(viewBoxRegex, 'viewBox="0 0 $1 $1" width="18" height="18"');

	if (gold) {
		svg = svg.replace("#gold:target~*", "#gold~*");
	}

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const takeScreenshotChunk = async () => {
	const theme = window.getTheme();

	const contentEl = document.getElementById("actual-actual-content");
	if (!contentEl) {
		throw new Error("Missing DOM element #actual-actual-content");
	}

	const logo = document.querySelector(".navbar-brand .logo-spinner img");
	if (!(logo instanceof HTMLImageElement)) {
		throw new Error("Should never happen");
	}
	const logoSrc = await getLogoFirstFrame(logo.src.endsWith("#gold"));

	// Add watermark
	contentEl.style.display = "inline-block";
	const watermark = document.createElement("div");
	const logoHTML = `<img src="${logoSrc}" width="18" height="18"> `;
	watermark.innerHTML = `<nav class="navbar navbar-light bg-light rounded-3 px-3"><a class="navbar-brand me-auto" href="#">${logoHTML}${GAME_NAME}</a><div class="flex-grow-1"></div><span class="navbar-text" style="color: ${
		theme === "dark" ? "#fff" : "#000"
	}; font-weight: bold">Play your own league free at ${__SPORT}${
		__SPORT !== "hockey" ? "-gm" : ".zengm"
	}.com</span></nav>
	<nav class="navbar navbar-border navbar-light mb-2 px-0"><h1 class="mb-0">${
		document.title
	}</nav>`;
	contentEl.insertBefore(watermark, contentEl.firstChild);
	contentEl.style.padding = "8px";

	// Add notifications
	const notificationsRaw = document.querySelector(".notification-container");
	if (!(notificationsRaw instanceof HTMLElement)) {
		throw new Error("Should never happen");
	}
	// Type cast due to https://github.com/microsoft/TypeScript/issues/283
	const notifications = notificationsRaw.cloneNode(true) as HTMLElement;
	notifications.classList.remove("notification-container");
	for (let i = 0; i < notifications.childNodes.length; i++) {
		// Otherwise screeenshot is taken before fade in is complete
		const el = notifications.children[0];
		if (el) {
			el.classList.remove("notification-fadein");
		}
	}
	contentEl.append(notifications);

	window.scrollTo(0, 0);

	const cleanup = () => {
		// Remove watermark
		contentEl.style.display = "";
		contentEl.removeChild(watermark);
		contentEl.style.padding = "";

		// Remove notifications
		contentEl.removeChild(notifications);
	};

	let canvas;
	try {
		canvas = await html2canvas(contentEl, {
			backgroundColor: theme === "dark" ? "#212529" : "#fff",
		});
	} catch (error) {
		cleanup();

		showNotification({
			type: "error",
			text: `Error taking screenshot: ${error.message}`,
		});

		return;
	}

	cleanup();

	showNotification({
		type: "screenshot",
		text: `Uploading your screenshot to Imgur...`,
		persistent: false,
		extraClass: "notification-primary",
	});

	try {
		const blob = await new Promise<Blob>((resolve, reject) => {
			// Would be nice to make this webp rather than the default png, but the imgur API returns a 400 error when I try
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Could not create blob"));
				}
			});
		});

		const formData = new FormData();
		formData.append("image", blob);
		const data = await fetchWrapper({
			url: "https://imgur-apiv3.p.rapidapi.com/3/image",
			method: "POST",
			headers: {
				Authorization: "Client-ID c2593243d3ea679",
				"x-rapidapi-host": "imgur-apiv3.p.rapidapi.com",
				"x-rapidapi-key": "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
			},
			data: formData,
		});

		if (data.data.error) {
			console.log(data.data.error);
			throw new Error(data.data.error.message);
		}

		const url = `https://imgur.com/${data.data.id}`;
		const encodedURL = window.encodeURIComponent(url);

		showNotification({
			type: "screenshot",
			text: `<p><a href="${url}" target="_blank">Click here to view your screenshot.</a></p>
<a href="https://www.reddit.com/r/${SUBREDDIT_NAME}/submit?url=${encodedURL}">Share on Reddit</a><br>
<a href="https://twitter.com/intent/tweet?url=${encodedURL}&via=${TWITTER_HANDLE}">Share on Twitter</a>`,
			persistent: true,
			extraClass: "notification-primary",
		});
	} catch (error) {
		console.log(error);
		let errorMsg;
		if (error.responseJSON?.error?.message) {
			errorMsg = `Error saving screenshot. Error message from Imgur: "${error.responseJSON.error.message}"`;
		} else if (error.message) {
			errorMsg = `Error saving screenshot. Error message from Imgur: "${error.message}"`;
		} else {
			errorMsg = "Error saving screenshot.";
		}
		showNotification({
			type: "error",
			text: errorMsg,
		});
	}
};

export default takeScreenshotChunk;
