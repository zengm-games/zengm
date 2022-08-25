import { useLocalShallow } from "../util";

const StickyBottomButtons = ({
	children,
	isInsideModal,
}: {
	children: any;
	isInsideModal?: boolean;
}) => {
	const { stickyFooterAd } = useLocalShallow(state => ({
		stickyFooterAd: state.stickyFooterAd,
	}));

	let bottom;
	if (isInsideModal) {
		bottom = -15;
	} else {
		bottom = 0;
		if (stickyFooterAd) {
			bottom += 52;
		}
	}

	return (
		<div
			className={`alert-bg-color alert-secondary rounded-top ${
				isInsideModal ? "py-2" : "p-2"
			} d-flex settings-buttons`}
			style={{ bottom }}
		>
			{children}
		</div>
	);
};

export default StickyBottomButtons;
