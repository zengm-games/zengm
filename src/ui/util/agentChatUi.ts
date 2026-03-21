import { create } from "zustand";

type AgentChatUiState = {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
};

export const useAgentChatUi = create<AgentChatUiState>((set) => ({
	open: false,
	setOpen: (open) => set({ open }),
	toggle: () => set((s) => ({ open: !s.open })),
}));
