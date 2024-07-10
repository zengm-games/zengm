import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import AwardsSummary from "./AwardsSummary";
import { PlayerPicture } from "../../components";
interface Props {
	name: string;
	teams: string[];
	stats: {
		games: string;
		points: string;
		rebounds: string;
		assists: string;
		playerEfficiencyRating: string;
	};
	awards: Array<{
		season: number;
		type: string;
	}>;
}

const PlayerTradingCard: React.FC<Props> = ({
	name,
	teams,
	stats,
	awards,
	face,
	imgURL,
	colors,
	jersey,
}) => {
	const cardRef = useRef<HTMLDivElement>(null);
	const handleDownloadClick = () => {
		html2canvas(cardRef.current!).then(canvas => {
			const link = document.createElement("a");
			link.download = "player-card.png";
			link.href = canvas.toDataURL();
			link.click();
		});
	};

	const styling = {
		container: {
			display: "flex",
			flexDirection: "column",
			flexWrap: "wrap",
			alignContent: "center",
			justifyContent: "center",
			alignItems: "center",
			marginTop: "20px",
		},
		card: {
			backgroundColor: "#111",
			color: "#fff",
			padding: "20px",
			borderRadius: "10px",
			fontFamily: "Arial, sans-serif",
			textAlign: "center",
		},
		image: {
			height: "350px",
		},
		name: {
			fontSize: "24px",
			fontWeight: "bold",
			marginTop: "10px",
		},
		teams: {
			fontSize: "1.2rem",
			margin: "1rem 0",
		},
		teamsUl: {
			listStyleType: "none",
			padding: "0",
			margin: "0",
		},
		teamsLi: {
			padding: "0.5rem 0",
			borderBottom: "1px solid #ccc",
		},
		stats: {
			marginTop: "20px",
		},
		table: {
			margin: "0 auto",
			borderCollapse: "collapse",
			fontSize: "18px",
		},
		th: {
			fontWeight: "normal",
			padding: "10px 15px",
			borderBottom: "2px solid #fff",
		},
		td: {
			padding: "10px 15px",
			borderBottom: "1px solid #444",
		},
		tfoot: {
			fontWeight: "bold",
		},
		button: {
			backgroundColor: "#007bff",
			color: "#fff",
			padding: "10px 20px",
			border: "none",
			borderRadius: "5px",
			fontSize: "18px",
			cursor: "pointer",
			marginTop: "20px",
		},
	};

	return (
		<div style={styling.container}>
			<div ref={cardRef} style={styling.card}>
				<div style={styling.image}>
					<PlayerPicture
						face={face}
						imgURL={imgURL}
						colors={colors}
						jersey={jersey}
					/>
				</div>
				<div style={styling.name}>{name}</div>
				<div style={styling.teams}>
					<ul style={styling.teamsUl}>
						{teams.map((team, index) => (
							<li key={index} style={styling.teamsLi}>
								{team}
							</li>
						))}
					</ul>
				</div>
				<div>
					<table style={styling.table}>
						<thead>
							<tr>
								<th style={styling.th}>G</th>
								<th style={styling.th}>PTS</th>
								<th style={styling.th}>TRB</th>
								<th style={styling.th}>AST</th>
								<th style={styling.th}>PER</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td style={styling.td}>{stats.games}</td>
								<td style={styling.td}>{stats.points}</td>
								<td style={styling.td}>{stats.rebounds}</td>
								<td style={styling.td}>{stats.assists}</td>
								<td style={styling.td}>{stats.playerEfficiencyRating}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<AwardsSummary awards={awards} />
			</div>
			<button style={styling.button} onClick={handleDownloadClick}>
				Download Card
			</button>
		</div>
	);
};

export default PlayerTradingCard;
