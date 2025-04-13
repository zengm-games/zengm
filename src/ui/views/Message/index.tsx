import OwnerMoodsChart from "./OwnerMoodsChart.tsx";
import { SafeHtml } from "../../components/index.tsx";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/index.ts";
import type { View } from "../../../common/types.ts";

const Message = ({ message }: View<"message">) => {
	const title = message && message.subject ? message.subject : "Message";
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

			<p>
				<a href="#" onClick={() => window.history.back()}>
					Previous Page
				</a>{" "}
				· <a href={helpers.leagueUrl(["inbox"])}>Inbox</a>
			</p>
		</>
	);
};

export default Message;
