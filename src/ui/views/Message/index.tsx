import PropTypes from "prop-types";
import OwnerMoodsChart from "./OwnerMoodsChart";
import { SafeHtml } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import { helpers } from "../../util";
import type { View } from "../../../common/types";

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
				<OwnerMoodsChart ownerMoods={message.ownerMoods} year={message.year} />
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

Message.propTypes = {
	message: PropTypes.shape({
		from: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired,
		year: PropTypes.number.isRequired,
		subject: PropTypes.string,
		ownerMoods: PropTypes.array,
	}),
};

export default Message;
