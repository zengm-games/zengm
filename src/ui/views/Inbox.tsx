import clsx from "clsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/index.ts";
import type { View } from "../../common/types.ts";

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
					className="table table-striped table-borderless table-sm"
					id="messages-table"
				>
					<tbody>
						{messages.map(({ from, mid, read, subject, text, year }) => {
							return (
								<tr
									key={mid}
									className={clsx({
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
