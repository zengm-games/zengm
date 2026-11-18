// Graph pages remember their parameters (except the season) in localStorage. The UI writes them, and the worker asks the UI for them when a graph page is opened with no parameters in the URL.

export const rememberedGraphParamsKeys = {
	playerGraphs: "playerGraphsParams",
	teamGraphs: "teamGraphsParams",
} as const;

export type RememberedGraphParamsPage = keyof typeof rememberedGraphParamsKeys;

// Values come from localStorage, so they are not trusted to be valid
export type RememberedGraphParams = Partial<Record<string, string>>;
