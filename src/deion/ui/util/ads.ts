import { localActions } from "./local";

const showGcs = () => {
	if (process.env.SPORT === "basketball") {
		window.TriggerPrompt("http://www.basketball-gm.com/", new Date().getTime());
	}
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
