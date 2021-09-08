import React, { Component } from "react";

type SyncedColorPickerProps = { label: string; optionkey: string; };
type SyncedColorPickerState = { val: string };
export class SyncedColorPicker extends Component<SyncedColorPickerProps, SyncedColorPickerState> {

	constructor(props: SyncedColorPickerProps) {
		super(props);
		this.state = {val:"#000000"};
		chrome.storage.local.get(this.props.optionkey, v => {
			if (v[this.props.optionkey]!==undefined)
				this.setState({ val: v[this.props.optionkey] });
		});
	}

	onChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
		this.setState({ val: ev.target.value });
		chrome.storage.local.set({ [this.props.optionkey]: ev.target.value });
	};
	readonly onChromeStorageChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
		if (areaName !== "local" || !(this.props.optionkey in changes)) return;

		this.setState({val:changes[this.props.optionkey].newValue});
	}
	componentDidMount() {
		chrome.storage.onChanged.addListener(this.onChromeStorageChanged);
	}
	componentWillUnmount() {
		chrome.storage.onChanged.removeListener(this.onChromeStorageChanged);
	}
	render() {
		return <div className="optionItem">
			<label>{`${this.props.label}: `}</label>
			<input type="color" onChange={this.onChange} value={this.state.val} />
		</div>;
	}
}

type SyncedCheckboxProps = { label: string; optionkey: string; };
type SyncedCheckboxState = { val: boolean };
export class SyncedCheckbox extends Component<SyncedCheckboxProps, SyncedCheckboxState> {
	constructor(props: SyncedCheckboxProps) {
		super(props);
		this.state = { val: false };
		chrome.storage.local.get(this.props.optionkey, v => {
			if (v[this.props.optionkey]!==undefined)
				this.setState({ val: v[this.props.optionkey] });
		});
	}

	onChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
		this.setState({ val: ev.target.checked });
		chrome.storage.local.set({ [this.props.optionkey]: ev.target.checked });
	};
	readonly onChromeStorageChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
		if (areaName !== "local" || !(this.props.optionkey in changes)) return;

		this.setState({ val: changes[this.props.optionkey].newValue });
	}
	componentDidMount() {
		chrome.storage.onChanged.addListener(this.onChromeStorageChanged);
	}
	componentWillUnmount() {
		chrome.storage.onChanged.removeListener(this.onChromeStorageChanged);
	}

	render() {
		return <div className="optionItem">
			<label>{`${this.props.label}: `}</label>
			<input type="checkbox" onChange={this.onChange} checked={this.state.val} />
		</div>;
	}
}
