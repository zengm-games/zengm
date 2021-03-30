import { ReactNode, useEffect, useRef, useState } from "react";
import { Modal, OverlayTrigger, Popover } from "react-bootstrap";

const isMobile = () => window.screen && window.screen.width < 768;

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
	renderTarget: (props: { onClick?: () => void }) => ReactNode;
	toggle?: () => void;
}) => {
	const [mobile, setMobile] = useState(isMobile);
	useEffect(() => {
		const update = () => {
			setMobile(isMobile());
		};
		window.addEventListener("optimizedResize", update);
		return () => {
			window.removeEventListener("optimizedResize", update);
		};
	}, []);

	const [showModal, setShowModal] = useState(false);

	const prevPopperPlacement = useRef<string | undefined>();

	if (mobile) {
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

	// Apply class here based on best guess of what we'll actually want in onEnter, to minimize flicker
	const popover = (
		<Popover
			id={id}
			className={
				prevPopperPlacement.current
					? "popover-margin-fix-2"
					: "popover-margin-fix-1"
			}
		>
			<Popover.Content>{popoverContent}</Popover.Content>
		</Popover>
	);

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={popover}
			rootClose
			onEnter={toggle}
			onEntered={node => {
				// Hacky fix for https://github.com/react-bootstrap/react-bootstrap/issues/5270
				if (prevPopperPlacement.current === node.dataset.popperPlacement) {
					node.classList.remove("popover-margin-fix-1");
					node.classList.add("popover-margin-fix-2");
				} else {
					prevPopperPlacement.current = node.dataset.popperPlacement;
					node.classList.remove("popover-margin-fix-2");
					node.classList.add("popover-margin-fix-1");
				}
			}}
		>
			{renderTarget({}) as any}
		</OverlayTrigger>
	);
};

export default ResponsivePopover;
