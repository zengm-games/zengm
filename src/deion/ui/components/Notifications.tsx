import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { emitter, Message } from "../util/notify";
import SafeHtml from "./SafeHtml";

const Notification = ({
	message,
	remove,
}: {
	key: number;
	message: Message;
} & { remove: () => void }) => {
	console.log("Notification", message);

	return (
		<div className={classNames("notification", message.extraClass)}>
			{message.title ? (
				<>
					<strong>{message.title}</strong>
					<br />
				</>
			) : null}
			<SafeHtml dirty={message.message} />
			<button className="notification-close" onClick={remove}>
				&times;
			</button>
		</div>
	);
};

const MAX_NUM_NOTIFICATIONS = 5;

const Notifications = () => {
	const index = useRef(0);
	const [notifications, setNotifications] = useState<
		{
			key: number;
			message: Message;
		}[]
	>([
		{
			key: -1,
			message: {
				message: "foo",
				persistent: true,
			},
		},
		{
			key: -2,
			message: {
				message: "bar",
				title: "title",
				persistent: true,
			},
		},
	]);

	useEffect(
		() =>
			emitter.on("notification", message => {
				let newNotifications = [
					...notifications,
					{
						key: index.current,
						message,
					},
				];
				index.current += 1;

				// Limit displayed notifications to 5 - all the persistent ones, plus the newest transient ones
				let numToDelete = newNotifications.length - MAX_NUM_NOTIFICATIONS;
				if (numToDelete > 0) {
					newNotifications = newNotifications.filter(notification => {
						if (notification.message.persistent) {
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
