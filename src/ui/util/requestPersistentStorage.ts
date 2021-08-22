import { WEBSITE_ROOT } from "../../common";
import logEvent from "./logEvent";

const requestPersistentStorage = async () => {
	if (
		navigator.storage &&
		navigator.storage.persist &&
		navigator.storage.persisted
	) {
		let persisted = await navigator.storage.persisted();

		if (!persisted) {
			try {
				if (navigator.permissions && navigator.permissions.query) {
					const permission = await navigator.permissions.query({
						name: "persistent-storage",
					});

					// If possible to get persistent storage without prompting the user, do it!
					if (permission.state === "granted") {
						persisted = await navigator.storage.persist();
					}

					if (!persisted || permission.state === "prompt") {
						(window as any)._ps_apply = async (button: HTMLButtonElement) => {
							const result = await navigator.storage.persist();

							const div = button.parentElement;
							if (div) {
								if (result) {
									div.innerHTML = "Success!";
								} else {
									div.innerHTML =
										"<b>Failed to enable persistent storage!</b> You can always view your persistent storage settings by going to Tools > Global Settings.";
								}
							}
						};

						await logEvent({
							extraClass: "",
							type: "info",
							htmlIsSafe: true,
							text: `<b>Persistent Storage</b><div class="mt-2"><div>Game data is stored in your browser profile, so <a href="https://${WEBSITE_ROOT}/manual/faq/#missing-leagues" rel="noopener noreferrer" target="_blank">your browser may delete it if disk space is low</a>. Enabling persistent storage helps protect against this.</div><button class="btn btn-primary mt-2" onclick="window._ps_apply(this)">Enable persistent storage</button></div>`,
							saveToDb: false,
							persistent: true,
						});
					}
				}
			} catch (error) {
				// Old browsers might error if they don't recognize the "persistent-storage" permission, but who cares
				console.error(error);
			}
		}
	}
};

export default requestPersistentStorage;
