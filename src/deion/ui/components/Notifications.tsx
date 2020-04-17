import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { emitter, Message } from "../util/notify";
import SafeHtml from "./SafeHtml";

const Notification = ({
	extraClass,
	message,
	title,
	remove,
}: Message & { remove: () => void }) => {
	console.log("Notification", message);

	return (
		<div className={classNames("notification", extraClass)}>
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

const MAX_NUM_NOTIFICATIONS = 5;

const Notifications = () => {
	const [notifications, setNotifications] = useState<Message[]>([
		{
			key: -1,
			message: "foo",
			persistent: true,
		},
		{
			key: -2,
			message: "bar",
			title: "title",
			persistent: true,
		},
	]);

	useEffect(
		() =>
			emitter.on("notification", message => {
				let newNotifications = [...notifications, message];

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

				setNotifications(newNotifications);
			}),
		[notifications],
	);

	return (
		<div className="notification-container">
			{notifications.map(notification => (
				<Notification
					{...notification}
					remove={() =>
						setNotifications(notifications.filter(n => n !== notification))
					}
				/>
			))}
		</div>
	);
};

export default Notifications;
