import { isSport, WEBSITE_PLAY } from "../../common";
import { localActions } from "./local";

const showGcs = () => {
	// No FBGM account currently https://mail.google.com/mail/u/0/#inbox/FMfcgzGkZQKtMrLvgRtFMPvzdBRjqrxB
	if (isSport("football")) {
		return;
	}

	window.TriggerPrompt(`https://${WEBSITE_PLAY}/`, new Date().getTime());
};

const showModal = () => {
	localActions.update({
		showNagModal: true,
	});
};

export default {
	showModal,
	showGcs,
};
