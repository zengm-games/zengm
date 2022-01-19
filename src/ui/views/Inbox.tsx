import classNames from "classnames";
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
				<table className="table table-striped table-sm" id="messages-table">
					<tbody>
						{messages.map(({ from, mid, read, subject, text, year }) => {
							return (
								<tr
									key={mid}
									className={classNames({
										"fw-bold": !read,
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

export default Inbox;
