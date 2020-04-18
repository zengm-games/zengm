import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { emitter, Message } from "../util/notify";
import SafeHtml from "./SafeHtml";
import { useLocalShallow } from "../util";

const MAX_NUM_NOTIFICATIONS = 5;

const NOTIFICATION_TIMEOUT = 8000;

const Notification = ({
	extraClass,
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
			<SafeHtml dirty={message} />
			<button className="notification-close" onClick={remove}>
				&times;
			</button>
		</div>
	);
};

const transition = { duration: 0.2, type: "tween" };

const Notifications = () => {
	const { userTids } = useLocalShallow(state => ({
		userTids: state.userTids,
	}));

	const [notifications, setNotifications] = useState<Message[]>([]);

	useEffect(
		() =>
			emitter.on("notification", notification => {
				setNotifications(currentNotifications => {
					let newNotifications = [...currentNotifications, notification];

					// Limit displayed notifications to 5 - all the persistent ones, plus the newest transient ones
					let numToDelete = newNotifications.length - MAX_NUM_NOTIFICATIONS;
					if (numToDelete > 0) {
						newNotifications = newNotifications.filter(notification => {
							if (notification.persistent) {
								return true;
							}

							if (numToDelete > 0) {
								numToDelete -= 1;
								return false;
							}

							return true;
						});
					}

					return newNotifications;
				});
			}),
		[],
	);

	return (
		<div
			className={classNames(
				"notification-container",
				userTids.length > 1
					? "notification-container-extra-margin-bottom"
					: undefined,
			)}
		>
			<ul>
				<AnimatePresence initial={false}>
					{notifications.map(notification => (
						<motion.li
							key={notification.id}
							positionTransition={transition}
							initial={{ opacity: 0, y: 100 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
							transition={transition}
						>
							<Notification
								{...notification}
								remove={() => {
									setNotifications(currentNotifications =>
										currentNotifications.filter(n => n !== notification),
									);
								}}
							/>
						</motion.li>
					))}
				</AnimatePresence>
			</ul>
		</div>
	);
};

export default Notifications;
