import classNames from "classnames";
import PropTypes from "prop-types";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";

const Inbox = ({ anyUnread, messages }: View<"inbox">) => {
	useTitleBar({
		title: "Inbox",
	});
	return (
		<>
			{anyUnread ? (
				<p className="text-danger">
					You have a new message. Read it before continuing.
				</p>
			) : null}

			{messages.length === 0 ? (
				<p>No messages!</p>
			) : (
				<table
					className="table table-striped table-bordered table-sm"
					id="messages-table"
				>
					<tbody>
						{messages.map(({ from, mid, read, subject, text, year }) => {
							return (
								<tr
									key={mid}
									className={classNames({
										"font-weight-bold": !read,
									})}
								>
									<td className="year">
										<a href={helpers.leagueUrl(["message", mid])}>{year}</a>
									</td>
									<td className="from">
										<a href={helpers.leagueUrl(["message", mid])}>{from}</a>
									</td>
									<td className="text">
										<a href={helpers.leagueUrl(["message", mid])}>
											{subject ? (
												<>
													{subject} - {text}
												</>
											) : (
												text
											)}
										</a>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</>
	);
};

Inbox.propTypes = {
	anyUnread: PropTypes.bool.isRequired,
	messages: PropTypes.arrayOf(
		PropTypes.shape({
			from: PropTypes.string.isRequired,
			mid: PropTypes.number.isRequired,
			read: PropTypes.bool.isRequired,
			text: PropTypes.string.isRequired,
			year: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default Inbox;
