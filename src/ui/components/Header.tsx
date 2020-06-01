import React, { useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container

const widthCutoff = 1200 + 190;

const updateSkyscraperDisplay = () => {
	const div = document.getElementById("bbgm-ads-skyscraper");

	if (div) {
		const documentElement = document.documentElement;

		if (documentElement) {
			const width = documentElement.clientWidth;
			div.style.display = width < widthCutoff ? "none" : "block";
		} else {
			div.style.display = "none";
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
				id="bbgm-ads-top"
				style={{
					display: "none",
					textAlign: "center",
					minHeight: "95px",
				}}
			/>
			<div
				className="banner-ad"
				id="bbgm-ads-mobile"
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
					id="bbgm-ads-skyscraper"
					style={{
						display: "none",
					}}
				/>
			</div>
		</>
	);
});

export default Header;
