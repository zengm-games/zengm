import React, { useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container

const widthCutoff = 1200 + 190;

let displayed = false;
const updateSkyscraperDisplay = () => {
	const div = document.getElementById("basketball-gm_right_rail");

	if (div) {
		const documentElement = document.documentElement;

		if (documentElement && documentElement.clientWidth >= widthCutoff) {
			if (!displayed) {
				div.style.display = "block";
				window.freestar.newAdSlots([
					{
						placementName: "basketball-gm_right_rail",
						slotId: "basketball-gm_right_rail",
					},
				]);
				console.log("newAdSlots");
				displayed = true;
			}
		} else {
			if (displayed) {
				div.style.display = "none";
				window.freestar.deleteAdSlots("basketball-gm_right_rail");
				console.log("deleteAdSlots");
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

const Header = React.memo(() => {
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
				id="basketball-gm_leaderboard_atf"
				style={{
					display: "none",
					textAlign: "center",
					minHeight: "95px",
				}}
			/>
			<div
				className="banner-ad"
				id="basketball-gm_mobile_leaderboard"
				style={{
					display: "none",
					textAlign: "center",
					minHeight: "55px",
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
					id="basketball-gm_right_rail"
					style={{
						display: "none",
					}}
				/>
			</div>
		</>
	);
});

export default Header;
