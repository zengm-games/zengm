import OwnerMoodsChart from "./OwnerMoodsChart.tsx";
import { SafeHtml } from "../../components/SafeHtml.tsx";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import type { View } from "../../../common/types.ts";

const Message = ({ message }: View<"message">) => {
	const title = message?.subject ?? "Message";
	useTitleBar({
		title,
	});

	if (!message) {
		return (
			<>
				<h2>Error</h2>
				<p>Message not found.</p>
			</>
		);
	}

	return (
		<>
			<p>
				<b>From: {message.from}</b>, {message.year}
			</p>

			<SafeHtml dirty={message.text} />

			{message.ownerMoods && message.ownerMoods.length > 2 ? (
				<OwnerMoodsChart ownerMoods={message.ownerMoods} />
			) : null}

			<div className="mt-3">
				<a href="#" onClick={() => window.history.back()}>
					Previous page
				</a>{" "}
				· <a href={helpers.leagueUrl(["inbox"])}>Inbox</a>
			</div>
		</>
	);
};

export default Message;
