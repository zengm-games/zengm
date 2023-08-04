import { memo, useEffect } from "react"; // Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
import { AD_DIVS } from "../../common";

const widthCutoff = 1200 + 190;

let displayed = false;
export const updateSkyscraperDisplay = (initial: boolean) => {
	const div = document.getElementById(AD_DIVS.rail);

	if (div) {
		const gold = !!div.dataset.gold;

		if (document.documentElement.clientWidth >= widthCutoff && !gold) {
			if (!displayed) {
				const before = () => {
					div.style.display = "block";
				};
				const after = () => {
					displayed = true;
				};

				if (initial) {
					// On initial load, we can batch ad request with others
					before();
					window.freestar.config.enabled_slots.push({
						placementName: AD_DIVS.rail,
						slotId: AD_DIVS.rail,
					});
					after();
				} else {
					window.freestar.queue.push(() => {
						before();
						window.freestar.newAdSlots([
							{
								placementName: AD_DIVS.rail,
								slotId: AD_DIVS.rail,
							},
						]);
						after();
					});
				}
			}
		} else {
			if (displayed || gold) {
				window.freestar.queue.push(() => {
					div.style.display = "none";
					window.freestar.deleteAdSlots(AD_DIVS.rail);
					displayed = false;
				});
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
		if (!window.mobile) {
			const callback = () => {
				updateSkyscraperDisplay(false);
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
