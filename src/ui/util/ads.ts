import { localActions } from "./local";

const showModal = () => {
	localActions.update({
		showNagModal: true,
	});
};

export default {
	showModal,
};
