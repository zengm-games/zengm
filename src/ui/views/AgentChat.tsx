import { AgentChatCore } from "../components/AgentChat/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";

const AgentChat = () => {
	useTitleBar({ title: "Chat" });

	return <AgentChatCore mode="fullPage" />;
};

export default AgentChat;
