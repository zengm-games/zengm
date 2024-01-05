import { memo, useEffect } from "react";
import { AD_DIVS } from "../../common";
import { ads } from "../util";

// Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container

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
		if (!window.mobile) {
			const callback = () => {
				ads.skyscraper.updateDislay(false);
			};

			callback();
			window.addEventListener("resize", resizeListener);
			window.addEventListener("optimizedResize", callback);
			return () => {
				window.removeEventListener("resize", resizeListener);
				window.removeEventListener("optimizedResize", callback);
			};
		}
	}, []);

	return (
		// banner-ad class is so ad blockers remove it cleanly. I'm so nice!
		<>
			<div
				className="banner-ad ms-3 flex-shrink-0"
				id={`${AD_DIVS.rail}_disabled`}
				data-gold="true"
				style={{
					display: "none",
				}}
			></div>
		</>
	);
});

export default Skyscraper;
