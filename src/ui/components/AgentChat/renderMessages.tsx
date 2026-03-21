import type { UIMessage } from "ai";
import type { AnchorHTMLAttributes } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import helpers from "../../util/helpers.ts";

export const TOOL_LABELS: Record<string, string> = {
	getStandings: "League standings",
	getRoster: "Roster",
	getAvailablePlayers: "Free agents",
	getPlayer: "Player profile",
	sortRoster: "Sort roster",
	updatePlayingTime: "Playing time",
	releasePlayer: "Release player",
	draftPick: "Draft pick",
	proposeTrade: "Propose trade",
	getMyRoster: "My roster",
	getUserTeamRoster: "User roster",
	evaluateTrade: "Evaluate trade",
	acceptTrade: "Accept trade",
};

export const toolPartLabel = (partType: string) => {
	if (!partType.startsWith("tool-")) {
		return partType;
	}
	const name = partType.slice("tool-".length);
	return TOOL_LABELS[name] ?? name;
};

export const toolStateMessage = (state: unknown) => {
	if (state === "input-streaming" || state === "input-available") {
		return "Preparing…";
	}
	if (state === "output-available") {
		return "Done";
	}
	if (state === "output-error") {
		return "Error";
	}
	return String(state);
};

const PLAYER_LINK_RE = /^player:(\d+)$/;

const urlTransform: (url: string, key: string) => string = (url, key) => {
	if (key === "href" && PLAYER_LINK_RE.test(url)) {
		return url;
	}
	return defaultUrlTransform(url);
};

const MarkdownLink = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
	const { href, children, ...rest } = props;
	if (href) {
		const match = PLAYER_LINK_RE.exec(href);
		if (match) {
			const pid = Number(match[1]);
			return (
				<a href={helpers.leagueUrl(["player", pid])} {...rest}>
					{children}
				</a>
			);
		}
	}
	return (
		<a href={href} {...rest}>
			{children}
		</a>
	);
};

const mdComponents = { a: MarkdownLink };

export const renderMessageParts = (message: UIMessage) => {
	if (!message.parts || message.parts.length === 0) {
		return null;
	}

	const useMarkdown = message.role === "assistant";

	return message.parts.map((part, index) => {
		if (part.type === "text") {
			if (useMarkdown) {
				return (
					<div key={index} className="agent-chat-text agent-chat-md">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						urlTransform={urlTransform}
						components={mdComponents}
					>
						{part.text}
					</ReactMarkdown>
					</div>
				);
			}

			return (
				<div key={index} className="agent-chat-text">
					{part.text}
				</div>
			);
		}

		if (part.type.startsWith("tool-")) {
			const label = toolPartLabel(part.type);
			const state = "state" in part ? toolStateMessage(part.state) : undefined;
			return (
				<div key={index} className="text-muted small py-1">
					{state && state !== "Done" ? (
						<span className="me-1" aria-hidden>
							…
						</span>
					) : null}
					{label}
					{state ? ` — ${state}` : ""}
				</div>
			);
		}

		return null;
	});
};
