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
				getOptionValue={option => option.pid}
				getOptionLabel={option => option.name}
			/>
		);
	}
}

export default SelectReact;
