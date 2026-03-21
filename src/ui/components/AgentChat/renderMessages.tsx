import type { UIMessage } from "ai";
import type { AnchorHTMLAttributes } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import helpers from "../../util/helpers.ts";

export const TOOL_LABELS: Record<string, string> = {
	getStandings: "Checking standings",
	getRoster: "Checking roster",
	getAvailablePlayers: "Checking free agents",
	getPlayer: "Looking up player",
	sortRoster: "Sorting roster",
	updatePlayingTime: "Updating playing time",
	releasePlayer: "Releasing player",
	draftPick: "Making draft pick",
	proposeTrade: "Proposing trade",
	getMyRoster: "Checking my roster",
	getUserTeamRoster: "Checking your roster",
	evaluateTrade: "Evaluating trade",
	acceptTrade: "Accepting trade",
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

export const hasVisibleParts = (message: UIMessage) =>
	message.parts?.some(
		(p) =>
			(p.type === "text" && "text" in p && p.text.length > 0) ||
			p.type.startsWith("tool-"),
	) ?? false;

export const hasVisibleText = (message: UIMessage) =>
	message.parts?.some(
		(p) => p.type === "text" && "text" in p && p.text.length > 0,
	) ?? false;

export const getActiveToolLabel = (message: UIMessage): string | null => {
	if (!message.parts) return null;
	for (let i = message.parts.length - 1; i >= 0; i--) {
		const part = message.parts[i];
		if (part.type.startsWith("tool-")) {
			const state = "state" in part ? part.state : undefined;
			if (state !== "output-available" && state !== "output-error") {
				return toolPartLabel(part.type);
			}
		}
	}
	return null;
};

export const renderMessageParts = (
	message: UIMessage,
	isStreaming?: boolean,
	options?: { hideToolParts?: boolean },
) => {
	if (!message.parts || message.parts.length === 0) {
		return null;
	}

	const useMarkdown = message.role === "assistant";
	const lastTextIndex = message.parts.findLastIndex(
		(p) => p.type === "text",
	);

	return message.parts.map((part, index) => {
		if (part.type === "text") {
			const isActivelyStreaming =
				isStreaming &&
				message.role === "assistant" &&
				index === lastTextIndex &&
				"state" in part &&
				part.state === "streaming";

			if (useMarkdown) {
				return (
					<div
						key={index}
						className={`agent-chat-text agent-chat-md${isActivelyStreaming ? " agent-chat-streaming" : ""}`}
					>
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							urlTransform={urlTransform}
							components={mdComponents}
						>
							{part.text}
						</ReactMarkdown>
						{isActivelyStreaming ? (
							<span className="agent-chat-cursor" />
						) : null}
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
			if (options?.hideToolParts) return null;
			const label = toolPartLabel(part.type);
			const state =
				"state" in part ? toolStateMessage(part.state) : undefined;
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
