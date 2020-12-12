import React from "react";
import Select from "react-select";

class SelectReact extends React.Component<
	{
		player: any;
		options: any[];
		changing: any;
		teamNumber?: number;
		playerNumber?: number;
		getOptionLabel: any;
	},
	{ select: { value: any; options: any[] } }
> {
	constructor(props: any) {
		super(props);
		this.state = {
			select: {
				value: props.player,
				options: props.options,
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
				isClearable
				onChange={this.handleChange}
				options={select.options}
				getOptionValue={p => p.pid}
				getOptionLabel={this.props.getOptionLabel}
			/>
		);
	}
}

export default SelectReact;
