import { useChat } from "@ai-sdk/react";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from "ai";
import { useEffect, useMemo, useRef, type FormEvent } from "react";
import type { AgentChatToolName } from "../../../common/agentChatTools.ts";
import type { GmChatToolName } from "../../../common/gmChatTools.ts";
import {
	serializeAgentGameState,
	type AgentGameContext,
} from "../../util/agentGameState.ts";
import {
	runAgentDraftPick,
	runAgentGetAvailablePlayers,
	runAgentGetPlayer,
	runAgentGetRoster,
	runAgentGetStandings,
	runAgentProposeTrade,
	runAgentReleasePlayer,
	runAgentSortRoster,
	runAgentUpdatePlayingTime,
} from "../../util/agentTools.ts";
import {
	runGmAcceptTrade,
	runGmEvaluateTrade,
	runGmGetMyRoster,
	runGmGetUserTeamRoster,
} from "../../util/gmAgentTools.ts";
import {
	useAgentChatUi,
	type Conversation,
} from "../../util/agentChatUi.ts";
import { useLocalPartial } from "../../util/index.ts";
import TeamLogoInline from "../TeamLogoInline.tsx";
import { renderMessageParts } from "./renderMessages.tsx";

export default function ChatView({
	conversation,
	hideNav,
}: {
	conversation: Conversation;
	hideNav?: boolean;
}) {
	const setOpen = useAgentChatUi((s) => s.setOpen);
	const openInbox = useAgentChatUi((s) => s.openInbox);
	const getMessages = useAgentChatUi((s) => s.getMessages);
	const setMessages = useAgentChatUi((s) => s.setMessages);
	const updateConversationPreview = useAgentChatUi(
		(s) => s.updateConversationPreview,
	);

	const messages = getMessages(conversation.id);

	const local = useLocalPartial([
		"phase",
		"phaseText",
		"season",
		"lid",
		"userTid",
		"userTids",
		"spectator",
		"teamInfoCache",
		"statusText",
	]);

	const gameContextRef = useRef<AgentGameContext>(
		serializeAgentGameState(local),
	);
	gameContextRef.current = serializeAgentGameState(local);

	const isGm = conversation.type === "gm";
	const entityContext = conversation.entityContext;

	const transport = useMemo(
		() =>
			new DefaultChatTransport<UIMessage>({
				api: "/api/chat",
				body: () => {
					const gameContext = gameContextRef.current;
					return isGm
						? { gameContext, entityContext }
						: { gameContext };
				},
			}),
		[isGm, entityContext],
	);

	const addToolOutputRef = useRef<
		| ((args: {
				tool: string;
				toolCallId: string;
				output: unknown;
		  }) => void)
		| null
	>(null);

	const {
		messages: chatMessages,
		sendMessage,
		status,
		error,
		stop,
		addToolOutput,
	} = useChat({
		id: conversation.id,
		transport,
		messages,
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		async onToolCall({ toolCall }) {
			if (toolCall.dynamic) {
				return;
			}

			const addOut = addToolOutputRef.current;
			if (!addOut) {
				return;
			}

			const ctx = gameContextRef.current;

			const reply = async (output: unknown) => {
				void addOut({
					tool: toolCall.toolName,
					toolCallId: toolCall.toolCallId,
					output,
				});
			};

			if (isGm && entityContext) {
				const gmName = toolCall.toolName as GmChatToolName;
				switch (gmName) {
					case "getMyRoster":
						await reply(await runGmGetMyRoster(entityContext, ctx));
						return;
					case "getUserTeamRoster":
						await reply(await runGmGetUserTeamRoster(ctx));
						return;
					case "evaluateTrade": {
						const input = toolCall.input as {
							myPids?: number[];
							myDpids?: number[];
							userPids?: number[];
							userDpids?: number[];
						};
						await reply(
							await runGmEvaluateTrade(entityContext, ctx, input),
						);
						return;
					}
					case "acceptTrade": {
						const input = toolCall.input as {
							myPids?: number[];
							myDpids?: number[];
							userPids?: number[];
							userDpids?: number[];
						};
						await reply(
							await runGmAcceptTrade(entityContext, ctx, input),
						);
						return;
					}
					default:
						return;
				}
			}

			const name = toolCall.toolName as AgentChatToolName;
			switch (name) {
				case "getStandings": {
					const input = toolCall.input as { season?: number };
					await reply(await runAgentGetStandings(ctx, input));
					return;
				}
				case "getRoster": {
					const input = toolCall.input as { teamAbbrev?: string };
					await reply(await runAgentGetRoster(ctx, input));
					return;
				}
				case "getAvailablePlayers": {
					await reply(await runAgentGetAvailablePlayers());
					return;
				}
				case "getPlayer": {
					const input = toolCall.input as { pid: number };
					await reply(await runAgentGetPlayer(input));
					return;
				}
				case "sortRoster": {
					const input = toolCall.input as { pos?: string };
					await reply(await runAgentSortRoster(input));
					return;
				}
				case "updatePlayingTime": {
					const input = toolCall.input as {
						pid: number;
						ptModifier: "0" | "0.75" | "1" | "1.25" | "1.5";
					};
					await reply(await runAgentUpdatePlayingTime(input));
					return;
				}
				case "releasePlayer": {
					const input = toolCall.input as { pid: number };
					await reply(await runAgentReleasePlayer(ctx, input));
					return;
				}
				case "draftPick": {
					const input = toolCall.input as { pid: number };
					await reply(await runAgentDraftPick(ctx, input));
					return;
				}
				case "proposeTrade": {
					const input = toolCall.input as {
						otherTeamAbbrev: string;
						userPids?: number[];
						userDpids?: number[];
						otherPids?: number[];
						otherDpids?: number[];
					};
					await reply(await runAgentProposeTrade(ctx, input));
					return;
				}
				default:
					return;
			}
		},
	});

	addToolOutputRef.current = addToolOutput;

	useEffect(() => {
		if (chatMessages.length > 0) {
			setMessages(conversation.id, chatMessages);
			const last = chatMessages.at(-1);
			if (last) {
				const textPart = last.parts?.find((p) => p.type === "text");
				const preview =
					textPart && "text" in textPart
						? textPart.text.slice(0, 60)
						: "";
				updateConversationPreview(conversation.id, preview);
			}
		}
	}, [chatMessages, setMessages, conversation.id, updateConversationPreview]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const text = String(fd.get("message") ?? "").trim();
		if (!text) {
			return;
		}

		await sendMessage({ text });
		form.reset();
	};

	const headerName = isGm ? conversation.name : "AI GM";
	const placeholder = isGm
		? `Message ${conversation.name}...`
		: "Ask about your team...";

	const gmTeamInfo =
		isGm && entityContext
			? local.teamInfoCache[entityContext.tid]
			: undefined;

	return (
		<div className="d-flex flex-column h-100">
			{!hideNav && (
				<div className="d-flex align-items-center gap-2 border-bottom px-2 py-2">
					<button
						type="button"
						className="btn btn-sm btn-outline-secondary"
						onClick={() => openInbox()}
					>
						←
					</button>
					{gmTeamInfo ? (
						<TeamLogoInline
							imgURL={gmTeamInfo.imgURL}
							imgURLSmall={gmTeamInfo.imgURLSmall}
							size={20}
						/>
					) : null}
					<span className="fw-semibold">{headerName}</span>
					<button
						type="button"
						className="btn-close ms-auto"
						aria-label="Close"
						onClick={() => setOpen(false)}
					/>
				</div>
			)}
			{hideNav && (
				<div className="d-flex align-items-center gap-2 border-bottom px-3 py-2">
					{gmTeamInfo ? (
						<TeamLogoInline
							imgURL={gmTeamInfo.imgURL}
							imgURLSmall={gmTeamInfo.imgURLSmall}
							size={20}
						/>
					) : null}
					<span className="fw-semibold">{headerName}</span>
				</div>
			)}
			<div className="overflow-auto agent-chat-messages flex-grow-1 p-2">
				{error ? (
					<div className="alert alert-warning py-2 small" role="alert">
						{error.message}
					</div>
				) : null}
				{chatMessages.map((m) => (
					<div
						key={m.id}
						className={`mb-2 agent-chat-msg role-${m.role}`}
					>
						<div className="small text-muted text-uppercase d-flex align-items-center gap-1">
							{m.role === "assistant" && gmTeamInfo ? (
								<TeamLogoInline
									imgURL={gmTeamInfo.imgURL}
									imgURLSmall={gmTeamInfo.imgURLSmall}
									size={16}
								/>
							) : null}
							{m.role === "assistant" && isGm
								? headerName
								: m.role}
						</div>
						{renderMessageParts(m)}
					</div>
				))}
			</div>
			<div className="border-top px-2 py-2">
				<form onSubmit={handleSubmit} className="d-flex gap-2">
					<input
						type="text"
						name="message"
						className="form-control form-control-sm"
						placeholder={placeholder}
						disabled={status !== "ready"}
						autoComplete="off"
					/>
					<button
						type="submit"
						className="btn btn-sm btn-primary"
						disabled={status !== "ready"}
					>
						Send
					</button>
					{status === "streaming" ? (
						<button
							type="button"
							className="btn btn-sm btn-outline-secondary"
							onClick={() => void stop()}
						>
							Stop
						</button>
					) : null}
				</form>
			</div>
		</div>
	);
}
