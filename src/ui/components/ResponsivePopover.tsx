import { ReactNode, RefObject, useRef, useState } from "react";
import { Modal, OverlayTrigger, Popover } from "react-bootstrap";

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
					animation={false}
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
