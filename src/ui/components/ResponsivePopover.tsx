import { type ReactNode, type RefObject, useRef, useState } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import Modal from "./Modal";

const ResponsivePopover = ({
	id,
	modalHeader,
	modalBody,
	popoverContent,
	renderTarget,
	toggle,
}: {
	id: string;
	modalHeader: ReactNode;
	modalBody: ReactNode;
	popoverContent: ReactNode;
	renderTarget: (props: {
		onClick?: () => void;
		forwardedRef?: RefObject<HTMLElement>;
	}) => ReactNode;
	toggle?: () => void;
}) => {
	const [showModal, setShowModal] = useState(false);
	const ref = useRef(null);

	if (window.mobile) {
		return (
			<>
				{renderTarget({
					onClick: () => {
						setShowModal(true);
						if (toggle) {
							toggle();
						}
					},
				})}
				<Modal
					centered
					show={showModal}
					onHide={() => {
						setShowModal(false);
					}}
				>
					<Modal.Header closeButton>{modalHeader}</Modal.Header>
					<Modal.Body>{modalBody}</Modal.Body>
				</Modal>
			</>
		);
	}

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover id={id}>
					<Popover.Body>{popoverContent}</Popover.Body>
				</Popover>
			}
			rootClose
			onEnter={toggle}
		>
			<span ref={ref}>{renderTarget({ forwardedRef: ref }) as any}</span>
		</OverlayTrigger>
	);
};

export default ResponsivePopover;
