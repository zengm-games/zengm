import { Suspense, lazy } from "react";

export { default as ActionButton } from "./ActionButton";
export { default as BarGraph } from "./BarGraph";
export { default as BoxPlot } from "./BoxPlot";
export { default as BoxScore } from "./BoxScore";
export { default as BoxScoreRow } from "./BoxScoreRow";
export { default as BoxScoreWrapper } from "./BoxScoreWrapper";
export { default as ScoreBox } from "./ScoreBox";
export { default as Confetti } from "./Confetti";
export { default as Controller } from "./Controller";
export { default as CountryFlag } from "./CountryFlag";
export { default as DataTable } from "./DataTable";
export { default as DraftAbbrev } from "./DraftAbbrev";
export { default as Footer } from "./Footer";
export { default as ForceWin } from "./ForceWin";
export { default as GameLinks } from "./GameLinks";
export { default as Header } from "./Header";
export { default as Height } from "./Height";
export { default as HelpPopover } from "./HelpPopover";
export { default as InjuryIcon } from "./InjuryIcon";
export { default as JerseyNumber } from "./JerseyNumber";
export { default as LeagueFileUpload } from "./LeagueFileUpload";
export { default as PlusMinus } from "./PlusMinus";
export { default as Mood } from "./Mood";
export { default as MoreLinks } from "./MoreLinks";
export { default as MovOrDiff } from "./MovOrDiff";
export { default as MultiTeamMenu } from "./MultiTeamMenu";
export { default as NagModal } from "./NagModal";
export { default as NavBar } from "./NavBar";
export { default as NegotiateButtons } from "./NegotiateButtons";
export { default as NextPrevButtons } from "./NextPrevButtons";
export { default as NewWindowLink } from "./NewWindowLink";
export { default as NewsBlock } from "./NewsBlock";
export { default as PlayPauseNext } from "./PlayPauseNext";
export { default as PlayerNameLabels } from "./PlayerNameLabels";
export { default as PlayoffMatchup } from "./PlayoffMatchup";
export { default as PopText } from "./PopText";
export { default as ProgressBarText } from "./ProgressBarText";
export { default as RatingWithChange } from "./RatingWithChange";
export { default as RatingsStatsPopover } from "./RatingsStatsPopover";
export { default as RecordAndPlayoffs } from "./RecordAndPlayoffs";
export { default as ResponsiveTableWrapper } from "./ResponsiveTableWrapper";
export { default as RetiredPlayers } from "./RetiredPlayers";
export { default as RosterComposition } from "./RosterComposition";
export { default as RosterSalarySummary } from "./RosterSalarySummary";
export { default as SafeHtml } from "./SafeHtml";
export { default as SideBar } from "./SideBar";
export { default as SkillsBlock } from "./SkillsBlock";
export { default as Skyscraper } from "./Skyscraper";
export { default as SortableTable } from "./SortableTable";
export { default as StatWithChange } from "./StatWithChange";
export { default as StickyBottomButtons } from "./StickyBottomButtons";
export { default as TeamLogoInline } from "./TeamLogoInline";
export { default as WatchBlock } from "./WatchBlock";
export { default as Weight } from "./Weight";

import ErrorBoundary from "./ErrorBoundary";
export { ErrorBoundary };

const PlayerPictureLazy = lazy(() => import("./PlayerPicture"));
export const PlayerPicture = (
	props: Parameters<typeof PlayerPictureLazy>[0],
) => (
	<ErrorBoundary local>
		<Suspense fallback={<div className="mt-3">Loading...</div>}>
			<PlayerPictureLazy {...props} />
		</Suspense>
	</ErrorBoundary>
);
