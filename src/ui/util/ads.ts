import { localActions } from "./local";

const showGcs = () => {
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
