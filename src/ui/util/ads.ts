import { isSport } from "../../common";
import { localActions } from "./local";

const showGcs = () => {
	// No FBGM account currently https://mail.google.com/mail/u/0/#inbox/FMfcgzGkZQKtMrLvgRtFMPvzdBRjqrxB
	if (isSport("football")) {
		return;
	}

	try {
		window._402_Show();
	} catch (error) {}
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
