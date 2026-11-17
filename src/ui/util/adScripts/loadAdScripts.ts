import { bySport } from "../../../common/sportFunctions.ts";
import { adShieldCode } from "./adShield.ts";
import { consentManagerCode } from "./consentManager.ts";

const runInlineScript = (code: string, attributes?: Record<string, string>) => {
	const script = document.createElement("script");
	for (const [key, value] of Object.entries(attributes ?? {})) {
		script.setAttribute(key, value);
	}
	script.textContent = code;
	document.head.append(script);
};

const loadFreestar = () => {
	// Same approach as Freestar's official React component (@freestar/pubfig-adslot-react-component), which loads pubfig from JS rather than from <head>. window.freestar.queue and window.freestar.config are set up in index.html, so code can use them before this runs.
	const publisher = bySport({
		baseball: "zengm-com",
		basketball: "basketball-gm-com",
		football: "football-gm-com",
		hockey: "zengm-com",
	});
	const script = document.createElement("script");
	script.async = true;
	script.src = `https://a.pub.network/${publisher}${window.freestar.debug ? "/qa" : ""}/pubfig.min.js`;
	document.head.append(script);
};

// Loads all third party ad code. This is a separate chunk that is only imported for non-Gold users, so Gold users never download or run any of it.
export const loadAdScripts = () => {
	// Only on the production domains
	if (!window.enableLogging) {
		return;
	}

	runInlineScript(consentManagerCode);
	loadFreestar();
	runInlineScript(adShieldCode, { id: "XJLGW", "data-cfasync": "false" });
};
