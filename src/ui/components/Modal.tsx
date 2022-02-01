import type { ContainerState } from "@restart/ui/esm/ModalManager";
import { Modal } from "react-bootstrap";
import BootstrapModalManager from "react-bootstrap/BootstrapModalManager";
import { createNanoEvents } from "nanoevents";

export const emitter = createNanoEvents<{
	keepScrollToRight: () => void;
}>();

// If animation is enabled, the modal gets stuck open on Android Chrome v91. This happens only when clicking Cancel/Save - the X and clicking outside the modal still works to close it. All my code is working - show does get set false, it does get rendered, just still displayed. Disabling ads makes no difference. It works when calling programmatically wtih ButtonElement.click() but not with an actual click. Disabling animation fixes it though. Also https://mail.google.com/mail/u/0/#inbox/FMfcgzGkZGhkhtPsGFPFxcKxhvZFkHpl
const animation = false;

class MyModalManager extends BootstrapModalManager {
	constructor() {
		super();
	}

	override setContainerStyle(containerState: ContainerState) {
		super.setContainerStyle(containerState);

		if (!containerState.scrollBarWidth) {
			return;
		}

		const divs = document.getElementsByClassName(
			"league-top-bar-toggle",
		) as HTMLCollectionOf<HTMLDivElement>;
		if (divs.length > 0) {
			divs[0].style.right = `${containerState.scrollBarWidth}px`;
		}
	}
	override removeContainerStyle(containerState: ContainerState) {
		super.removeContainerStyle(containerState);

		if (!containerState.scrollBarWidth) {
			return;
		}

		const divs = document.getElementsByClassName(
			"league-top-bar-toggle",
		) as HTMLCollectionOf<HTMLDivElement>;
		if (divs.length > 0) {
			divs[0].style.right = "";
		}

		emitter.emit("keepScrollToRight");
	}
}

const manager = new MyModalManager();

const WrappedModal = ({ children, ...props }: Parameters<typeof Modal>[0]) => {
	return (
		<Modal animation={animation} manager={manager} {...props}>
			{children}
		</Modal>
	);
};

WrappedModal.Body = Modal.Body;
WrappedModal.Footer = Modal.Footer;
WrappedModal.Header = Modal.Header;
WrappedModal.Title = Modal.Title;

export default WrappedModal;
