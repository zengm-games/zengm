import { useLocalShallow } from "../util";

const StickyBottomButtons = ({ children }: { children: any }) => {
	const { stickyFooterAd } = useLocalShallow(state => ({
		stickyFooterAd: state.stickyFooterAd,
	}));

	let bottom = 0;
	if (stickyFooterAd) {
		bottom += 52;
	}

	return (
		<div
			className="alert-secondary rounded-top p-2 d-flex settings-buttons"
			style={{ bottom }}
		>
			{children}
		</div>
	);
};

export default StickyBottomButtons;
