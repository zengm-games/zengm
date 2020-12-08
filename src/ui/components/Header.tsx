import React, { useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container

const widthCutoff = 1200 + 190;

let displayed = false;
const updateSkyscraperDisplay = () => {
	const div = document.getElementById(`${process.env.SPORT}-gm_right_rail`);

	if (div) {
		const documentElement = document.documentElement;

		if (documentElement && documentElement.clientWidth >= widthCutoff) {
			if (!displayed && window.freestar.newAdSlots) {
				div.style.display = "block";
				window.freestar.newAdSlots([
					{
						placementName: `${process.env.SPORT}-gm_right_rail`,
						slotId: `${process.env.SPORT}-gm_right_rail`,
					},
				]);
				console.log("newAdSlots", `${process.env.SPORT}-gm_right_rail`);
				displayed = true;
			}
		} else {
			if (displayed && window.freestar.deleteAdSlots) {
				div.style.display = "none";
				window.freestar.deleteAdSlots(`${process.env.SPORT}-gm_right_rail`);
				console.log("deleteAdSlots", `${process.env.SPORT}-gm_right_rail`);
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
				id={`${process.env.SPORT}-gm_leaderboard_atf`}
				style={{
					display: "none",
					textAlign: "center",
					minHeight: 90,
					marginBottom: 5,
				}}
			/>
			<div
				className="banner-ad"
				id={`${process.env.SPORT}-gm_mobile_leaderboard`}
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
					id={`${process.env.SPORT}-gm_right_rail`}
					style={{
						display: "none",
					}}
				/>
			</div>
		</>
	);
});

export default Header;
