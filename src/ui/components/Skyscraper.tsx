import { memo, useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
import { AD_DIVS } from "../../common";

const widthCutoff = 1200 + 190;

let displayed = false;
export const updateSkyscraperDisplay = () => {
	const div = document.getElementById(AD_DIVS.rail);

	if (div) {
		const gold = !!div.dataset.gold;

		const documentElement = document.documentElement;

		if (
			documentElement &&
			documentElement.clientWidth >= widthCutoff &&
			!gold
		) {
			if (!displayed) {
				div.style.display = "block";
				displayed = true;
			}
		} else {
			if (displayed || gold) {
				div.style.display = "none";
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

const Skyscraper = memo(() => {
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
				className="banner-ad ml-3 flex-shrink-0"
				id={AD_DIVS.rail}
				data-gold="true"
				style={{
					display: "none",
				}}
			></div>
		</>
	);
});

export default Skyscraper;
