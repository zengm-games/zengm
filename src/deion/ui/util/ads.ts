import { localActions } from "./local";

const showGcs = () => {
	window.TriggerPrompt("http://www.basketball-gm.com/", new Date().getTime());
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
