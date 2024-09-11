import { useLocalPartial } from "../util";

const StickyBottomButtons = ({
	children,
	isInsideModal,
}: {
	children: any;
	isInsideModal?: boolean;
}) => {
	const { stickyFooterAd } = useLocalPartial(["stickyFooterAd"]);

	let bottom;
	if (isInsideModal) {
		bottom = -15;
	} else {
		bottom = stickyFooterAd;
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
