import { isSport, WEBSITE_PLAY } from "../../common";
import { localActions } from "./local";

const showModal = () => {
	localActions.update({
		showNagModal: true,
	});
};

const showGcs = () => {
	// No FBGM account currently https://mail.google.com/mail/u/0/#inbox/FMfcgzGkZQKtMrLvgRtFMPvzdBRjqrxB
	if (isSport("football")) {
		return;
	}

	// https://mail.google.com/mail/u/0/#search/callbackGCS/FMfcgxckZpsFPhHWMwTGHhSctGSchZMR
	(window as any).callbackGCS = () => {
		console.log("callbackGCS");
	};

	try {
		window.TriggerPrompt(`https://${WEBSITE_PLAY}/`, new Date().getTime());
	} catch (error) {}
};

export default {
	showModal,
	showGcs,
};
