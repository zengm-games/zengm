import React from "react";
import Select from "react-select";

class SelectReact extends React.Component<
	{
		player: any;
		options: any[];
		changing: any;
		teamNumber?: number;
		playerNumber?: number;
		award: string;
	},
	{ select: { value: any; options: any[] } }
> {
	constructor(props: any) {
		super(props);
		const options = props["options"];
		const player = props["player"];
		this.state = {
			select: {
				value: player, // "One" as initial value for react-select
				options, // all available options
			},
		};
	}

	setValue = (value: any) => {
		this.setState(prevState => ({
			select: {
				...prevState.select,
				value,
			},
		}));
	};

	handleChange = (value: any) => {
		const val = this.props.changing(this, value);
		if (!val) {
			this.setValue(value);
		} else {
			this.setValue(this.state.select.value);
		}
	};

	render() {
		const { select } = this.state;
		return (
			<Select
				classNamePrefix="dark-select"
				defaultValue={select.value}
				onChange={this.handleChange}
				options={select.options}
				getOptionValue={p => p.pid}
				getOptionLabel={p => {
					if (p.pid === undefined) {
						return p.name;
					}

					let stats;
					if (process.env.SPORT === "basketball") {
						if (
							this.props.award === "dpoy" ||
							this.props.award === "allDefensive"
						) {
							stats = `${p.stats.trb.toFixed(1)} reb, ${p.stats.blk.toFixed(
								1,
							)} blk, ${p.stats.stl.toFixed(1)} stl`;
						} else {
							stats = `${p.stats.pts.toFixed(1)} pts, ${p.stats.trb.toFixed(
								1,
							)} reb, ${p.stats.ast.toFixed(1)} ast`;
						}
					} else {
						stats = p.stats.keyStats;
					}
					return `${p.name} (${p.ratings.pos}, ${p.stats.abbrev}) ${stats}`;
				}}
			/>
		);
	}
}

export default SelectReact;
