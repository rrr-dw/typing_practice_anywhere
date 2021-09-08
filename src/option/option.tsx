import React, { Component, FC, Fragment } from "react";
import ReactDOM from 'react-dom';
import { generalOptionContextType, GeneralOptionContextProvider } from "../utils/contexts/general";
import { themeContextType, ThemeContextProvider } from "../utils/contexts/theme";
import "./option.scss";
import { SyncedCheckbox, SyncedColorPicker } from "./syncedInput";


type OptionProps = {};
type OptionState = {
	selectionRangeBg?: string,
	selectedBg?: string
};

class Option extends Component<OptionProps, OptionState> {

	constructor(props: OptionProps) {
		super(props);
		this.state = {};
	}
	render() {
		return <Fragment>
			<ThemeContextProvider><GeneralOptionContextProvider>
				<ThemeOption />
				<GeneralOption />
				{/* <SaveButton /> */}
			</GeneralOptionContextProvider></ThemeContextProvider>
		</Fragment>;
	}
}
const SaveButton: FC = () => {
	return (
		<generalOptionContextType.Consumer>{(gc) =>
			<themeContextType.Consumer>{(tc) =>
				<button id="save" onClick={() => { gc._save(); tc._save(); alert("Saved.") }}>Save</button>
			}</themeContextType.Consumer>
		}</generalOptionContextType.Consumer>
	)
}
const GeneralOption:FC = () => {
	return (
		<div className="optionBox">
			<h1>General</h1>
			<SyncedCheckbox label="Use CPM instead of WPM" optionkey="useCpm" />
			<SyncedCheckbox label="Animated" optionkey="animated" />
			<generalOptionContextType.Consumer>
				{(context) => (
					<button onClick={context._reset}>Reset</button>
				)}
			</generalOptionContextType.Consumer>
		</div>
	);
}

const ThemeOption: FC = () => {
	return (
		<div className="optionBox">
			<h1>Theme</h1>
			<SyncedColorPicker label="Selection Range" optionkey="elementSelectionRangeBg" />
			<SyncedColorPicker label="Selected Elements" optionkey="elementSelectedBg" />
			<SyncedColorPicker label="Typing Overlay Background" optionkey="typingOverlayBg" />
			<SyncedColorPicker label="Typing Overlay Text" optionkey="typingOverlayFg" />
			<SyncedColorPicker label="Typing Overlay Wrong Text" optionkey="wrongText" />
			<SyncedColorPicker label="Typing Overlay Composing Text" optionkey="composingText" />
			<themeContextType.Consumer>
				{(context) => (
					<button onClick={context._reset}>Reset</button>
				)}
			</themeContextType.Consumer >
		</div>
	);
}

ReactDOM.render(<Option />, document.getElementById("root"));
