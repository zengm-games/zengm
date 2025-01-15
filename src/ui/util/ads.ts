import { AD_DIVS, MOBILE_AD_BOTTOM_MARGIN, VIDEO_ADS } from "../../common";
import { local, localActions } from "./local";

const SKYSCAPER_WIDTH_CUTOFF = 1200 + 190;

class Skyscraper {
	displayed = false;

	updateDislay(initial: boolean) {
		const div = document.getElementById(AD_DIVS.rail);

		if (div) {
			const gold = !!div.dataset.gold;

			if (
				document.documentElement.clientWidth >= SKYSCAPER_WIDTH_CUTOFF &&
				!gold
			) {
				if (!this.displayed) {
					const before = () => {
						div.style.display = "block";
					};
					const after = () => {
						this.displayed = true;
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
				if (this.displayed || gold) {
					window.freestar.queue.push(() => {
						div.style.display = "none";
						window.freestar.deleteAdSlots(AD_DIVS.rail);
						this.displayed = false;
					});
				}
			}
		}
	}
}

type AdState = "none" | "gold" | "initializing" | "initialized";

abstract class AdsBase {
	private accountChecked = false;
	private uiRendered = false;
	private initAfterLoadingDone = false;
	private state: AdState = "none";

	setLoadingDone(type: "accountChecked" | "uiRendered") {
		this[type] = true;
		if (this.initAfterLoadingDone) {
			this.init();
		}
	}

	async init() {
		if (!window.enableLogging) {
			return;
		}

		// Prevent race condition by assuring we run this only after the account has been checked and the UI has been rendered, otherwise (especially when opening a 2nd tab) this was sometimes running before the UI was rendered, which resulted in no ads being displayed
		if (this.state !== "none") {
			// Must have already ran somehow?
			return;
		}
		if (!this.accountChecked || !this.uiRendered) {
			// We got the first pageview, but we're not done loading stuff, so render first ad after we finish loading
			this.initAfterLoadingDone = true;
			return;
		}
		this.state = "initializing";
		const gold = local.getState().gold;
		if (gold) {
			this.state = "gold";
		} else {
			await this.initCore();
			this.state = "initialized";
		}
	}
	abstract initCore(): Promise<void>;

	// This does the opposite of initAds. To be called when a user subscribes to gold or logs in to an account with an active subscription
	async stop() {
		await this.stopCore();
		this.state = "gold";
	}
	abstract stopCore(): Promise<void>;

	abstract adBlock(): boolean;

	abstract trackPageview(): void;

	refreshAll() {
		if (this.state === "initialized") {
			this.refreshAllCore();
		}
	}
	abstract refreshAllCore(): void;
}

class Ads extends AdsBase {
	skyscraper = new Skyscraper();

	initCore() {
		return new Promise<void>(resolve => {
			// _disabled names are to hide from Blockthrough, so it doesn't leak through for Gold subscribers. Run this regardless of window.freestar, so Blockthrough can still work for some users.
			const divsAll = VIDEO_ADS
				? [AD_DIVS.mobile, AD_DIVS.rail]
				: [
						AD_DIVS.mobile,
						AD_DIVS.leaderboard,
						AD_DIVS.rectangle1,
						AD_DIVS.rectangle2,
						AD_DIVS.rail,
					];
			for (const id of divsAll) {
				const div = document.getElementById(`${id}_disabled`);
				if (div) {
					div.id = id;
				}
			}

			window.freestar.queue.push(() => {
				if (VIDEO_ADS && !window.mobile) {
					window.freestar.newStickyFooter("football-gm_adhesion");
				}

				// Show hidden divs. skyscraper has its own code elsewhere to manage display.
				const divsMobile = [AD_DIVS.mobile];
				const divsDesktop = VIDEO_ADS
					? []
					: [AD_DIVS.leaderboard, AD_DIVS.rectangle1, AD_DIVS.rectangle2];
				const divs = window.mobile ? divsMobile : divsDesktop;

				for (const id of divs) {
					const div = document.getElementById(id);

					if (div) {
						div.style.removeProperty("display");
					}
				}

				// Special case for rail, to tell it there is no gold
				const rail = document.getElementById(AD_DIVS.rail);
				if (rail) {
					delete rail.dataset.gold;
					this.skyscraper.updateDislay(true);
				}

				for (const id of divs) {
					window.freestar.config.enabled_slots.push({
						placementName: id,
						slotId: id,
					});
				}

				if (divs.includes(AD_DIVS.mobile)) {
					localActions.update({
						stickyFooterAd: MOBILE_AD_BOTTOM_MARGIN,
					});

					// Add margin to footer - do this manually rather than using stickyFooterAd so <Footer> does not have to re-render
					const footer = document.getElementById("main-footer");
					if (footer) {
						footer.style.paddingBottom = `${MOBILE_AD_BOTTOM_MARGIN}px`;
					}

					// Disabled due to https://mail.google.com/mail/u/0/#inbox/FMfcgzQZSZHnVhMpncBXqpCxZMdgtcJL
					// Hack to hopefully stop the Microsoft ad from breaking everything
					// Maybe this is breaking country tracking in Freestar, and maybe for direct ads too?
					/*window.googletag = window.googletag || {};
					window.googletag.cmd = window.googletag.cmd || [];
					window.googletag.cmd.push(() => {
						window.googletag.pubads().setForceSafeFrame(true);
						window.googletag.pubads().setSafeFrameConfig({
							allowOverlayExpansion: false,
							allowPushExpansion: false,
							sandbox: true,
						});
					});*/
				}

				if (!window.mobile && !VIDEO_ADS) {
					// Show the logo too
					const logo = document.getElementById("bbgm-ads-logo");

					if (logo) {
						logo.style.display = "flex";
					}
				}

				window.freestar.newAdSlots(window.freestar.config.enabled_slots);

				resolve();
			});
		});
	}

	stopCore() {
		return new Promise<void>(resolve => {
			window.freestar.queue.push(() => {
				const divsAll = [
					AD_DIVS.mobile,
					AD_DIVS.leaderboard,
					AD_DIVS.rectangle1,
					AD_DIVS.rectangle2,
				];

				for (const id of divsAll) {
					const div = document.getElementById(id);

					if (div) {
						div.style.display = "none";
					}

					window.freestar.deleteAdSlots(id);
				}

				// Special case for rail, to tell it there is no BBGM gold
				const rail = document.getElementById(AD_DIVS.rail);
				if (rail) {
					rail.dataset.gold = "true";
					this.skyscraper.updateDislay(false);
				}

				localActions.update({
					stickyFooterAd: 0,
				});

				// Add margin to footer - do this manually rather than using stickyFooterAd so <Footer> does not have to re-render
				const footer = document.getElementById("main-footer");
				if (footer) {
					footer.style.paddingBottom = "";
				}

				const logo = document.getElementById("bbgm-ads-logo");
				if (logo) {
					logo.style.display = "none";
				}

				// Rename to hide from Blockthrough
				for (const id of [...divsAll, AD_DIVS.rail]) {
					const div = document.getElementById(id);

					if (div) {
						div.id = `${id}_disabled`;
					}
				}

				resolve();
			});
		});
	}

	adBlock() {
		return (
			!window.freestar ||
			!window.freestar.refreshAllSlots ||
			!window.googletag ||
			!window.googletag.pubads
		);
	}

	trackPageview() {
		// https://help.freestar.com/help/how-to-track-virtual-page-views
		window.freestar.queue.push(() => {
			window.freestar.trackPageview();
		});
	}

	refreshAllCore() {
		window.freestar.queue.push(() => {
			window.freestar.refreshAllSlots?.();
		});
	}
}

const ads = new Ads();

export default ads;
