import classNames from "classnames";
import { m, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { emitter, Message } from "../util/notify";
import SafeHtml from "./SafeHtml";
import { useLocalShallow } from "../util";

const MAX_NUM_NOTIFICATIONS = 5;

const NOTIFICATION_TIMEOUT = 8000;

const Notification = ({
	extraClass,
	htmlIsSafe,
	message,
	persistent,
	title,
	remove,
}: Message & { remove: () => void }) => {
	const notificationElement = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let timeoutID: number;
		let timeoutStart: number;
		let timeoutRemaining = NOTIFICATION_TIMEOUT;

		const element = notificationElement.current;

		const notificationTimeout = () => {
			timeoutID = window.setTimeout(remove, timeoutRemaining);
			timeoutStart = Date.now();
		};

		if (!persistent && element) {
			// Hide notification after timeout
			notificationTimeout();

			// When hovering over, don't count towards timeout
			element.addEventListener("mouseenter", () => {
				window.clearTimeout(timeoutID);
				timeoutRemaining -= Date.now() - timeoutStart;
			});
			element.addEventListener("mouseleave", notificationTimeout);
		}

		return () => {
			window.clearTimeout(timeoutID);
			if (element) {
				element.removeEventListener("mouseleave", notificationTimeout);
			}
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div
			className={classNames("notification", extraClass)}
			ref={notificationElement}
		>
			{title ? (
				<>
					<strong>{title}</strong>
					<br />
				</>
			) : null}
			<SafeHtml dirty={message} htmlIsSafe={htmlIsSafe} />
			<button
				className="notification-close"
				onClick={remove}
				title="Dismiss notification"
			>
				&times;
			</button>
		</div>
	);
};

const transition = { duration: 0.2, type: "tween" };

// Listen for notifications sent before Notifications component is mounted
const initialNotifications: Message[] = [];
const unbind = emitter.on("notification", notification => {
	initialNotifications.push(notification);
});

const Notifications = () => {
	const { stickyFooterAd, stickyFormButtons, userTids } = useLocalShallow(
		state => ({
			stickyFooterAd: state.stickyFooterAd,
			stickyFormButtons: state.stickyFormButtons,
			userTids: state.userTids,
		}),
	);

	const [notifications, setNotifications] = useState<Message[]>([]);

	useEffect(() => {
		unbind();

		const unbind2 = emitter.on("notification", notification => {
			// Non-persistent notifications, only show if page is visible, for performance
			if (!notification.persistent && document.hidden) {
				return;
			}

			setNotifications(currentNotifications => {
				let newNotifications = [...currentNotifications, notification];

				// Limit displayed notifications to 5 - all the persistent ones, plus the newest transient ones
				let numToDelete = newNotifications.length - MAX_NUM_NOTIFICATIONS;
				let numPersistentKept = 0;
				if (numToDelete > -1) {
					// -1 so numPersistentKept can still identify when there are 4 persistent notifications
					newNotifications = newNotifications.filter(notification => {
						if (notification.persistent) {
							numPersistentKept += 1;
							return true;
						}

						if (numToDelete > 0) {
							numToDelete -= 1;
							if (notification.onClose) {
								notification.onClose();
							}
							return false;
						}

						return true;
					});
				}

				// Want at most MAX_NUM_NOTIFICATIONS-1, so there is room for another
				if (numPersistentKept > MAX_NUM_NOTIFICATIONS - 1) {
					newNotifications = newNotifications.slice(
						numPersistentKept - (MAX_NUM_NOTIFICATIONS - 1),
					);
				}

				return newNotifications;
			});
		});

		for (const notification of initialNotifications) {
			emitter.emit("notification", notification);
		}

		return unbind2;
	}, []);

	let ulBottom = 0;
	let buttonBottom = 6;
	if (userTids.length > 1 && !stickyFormButtons) {
		// Move up ul over multi team menu, but button doesn't need to move
		ulBottom += 40;
	}
	if (stickyFormButtons) {
		// Ideally all stickyFormButtons logic would only happen on narrow windows, but whatever it's fine
		ulBottom += 49;
		buttonBottom += 49;
	}
	if (stickyFooterAd) {
		ulBottom += 52;
		buttonBottom += 52;
	}

	return (
		<div className="notification-container">
			{notifications.length > 0 ? (
				<button
					className="notification-close-all"
					title="Dismiss all notifications"
					onClick={() => {
						for (const notification of notifications) {
							if (notification.onClose) {
								notification.onClose();
							}
						}
						setNotifications([]);
					}}
					style={{
						bottom: buttonBottom,
					}}
				>
					&times;
				</button>
			) : null}
			<ul
				style={{
					bottom: ulBottom,
				}}
			>
				<AnimatePresence initial={false}>
					{notifications.map(notification => (
						<m.li
							key={notification.id}
							layout
							initial={{ opacity: 0, y: 100 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
							transition={transition}
						>
							<Notification
								{...notification}
								remove={() => {
									setNotifications(currentNotifications =>
										currentNotifications.filter(n => {
											if (n === notification) {
												if (notification.onClose) {
													notification.onClose();
												}
												return false;
											}

											return true;
										}),
									);
								}}
							/>
						</m.li>
					))}
				</AnimatePresence>
			</ul>
		</div>
	);
};

export default Notifications;
