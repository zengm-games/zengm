import { memo, useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
import { AD_DIVS } from "../../common";

const widthCutoff = 1200 + 190;

let displayed = false;
const updateSkyscraperDisplay = () => {
	const div = document.getElementById(AD_DIVS.rail);

	if (div) {
		const documentElement = document.documentElement;

		if (documentElement && documentElement.clientWidth >= widthCutoff) {
			if (
				!displayed &&
				window.freestar.newAdSlots &&
				window.googletag &&
				window.googletag.pubads
			) {
				div.style.display = "block";
				window.freestar.newAdSlots([
					{
						placementName: AD_DIVS.rail,
						slotId: AD_DIVS.rail,
					},
				]);
				console.log("newAdSlots", AD_DIVS.rail);
				displayed = true;
			}
		} else {
			if (
				displayed &&
				window.freestar.deleteAdSlots &&
				window.googletag &&
				window.googletag.pubads
			) {
				div.style.display = "none";
				window.freestar.deleteAdSlots(AD_DIVS.rail);
				console.log("deleteAdSlots", AD_DIVS.rail);
				displayed = false;
			}
		}
	}
};

// https://developer.mozilla.org/en-US/docs/Web/Events/resize
let running = false;

const resizeListener = () => {
	if (running) {
		return;
	}

	running = true;
	window.requestAnimationFrame(() => {
		window.dispatchEvent(new CustomEvent("optimizedResize"));
		running = false;
	});
};

const Header = memo(() => {
	useEffect(() => {
		updateSkyscraperDisplay();
		window.addEventListener("resize", resizeListener);
		window.addEventListener("optimizedResize", updateSkyscraperDisplay);
		return () => {
			window.removeEventListener("resize", resizeListener);
			window.removeEventListener("optimizedResize", updateSkyscraperDisplay);
		};
	}, []);
	return (
		// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
		<>
			<div
				className="banner-ad"
				id={AD_DIVS.leaderboard}
				style={{
					display: "none",
					textAlign: "center",
					minHeight: 90,
					marginBottom: 5,
				}}
			/>
			<div
				className="banner-ad"
				id={AD_DIVS.mobile}
				style={{
					display: "none",
					textAlign: "center",
					minHeight: 50,
					marginBottom: 5,
				}}
			/>
			<div
				className="banner-ad skyscraper-wrapper"
				id="skyscraper-wrapper"
				style={{
					display: "none",
				}}
			>
				<div
					id={AD_DIVS.rail}
					style={{
						display: "none",
					}}
				/>
			</div>
		</>
	);
});

export default Header;
