import React, { Component } from "react";
import ReactDOM from "react-dom";
import { ThemeContextProvider } from "../contexts/theme";
import { ChromeRuntimeMessage } from "../ChromeRuntimeMessage";
import { InteractiveSelector, InteractiveSelectorResCb } from "./interactiveSelector";
import { LazyElements } from "../lazyElements";
import { PlainTyping } from "./plainTyping";
import { GeneralOptionContextProvider } from "../contexts/general";


type AppProps = {
};
enum AppPhase{
	None,
	Picker,
	PlainTyping
}
type AppState = {
	appPhase:AppPhase
};
export class App extends Component<AppProps,AppState>{

	lazyElements: LazyElements|undefined;
	constructor(props:AppProps) {
		super(props);
		this.state = {appPhase:AppPhase.None};
	}
	componentDidMount() {
		chrome.runtime.onMessage.addListener(this.onChromeMessage);

	}
	componentWillUnmount() {
		chrome.runtime.onMessage.removeListener(this.onChromeMessage);
	}
	onChromeMessage:Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (message: ChromeRuntimeMessage, sender, sendResponse) => {

		switch (message.type) {
			case "START_ELEMENT_PICKER":
				this.setState({ appPhase: AppPhase.Picker });
				sendResponse(true);
				return;
			
			case "PING":
				sendResponse("PONG");
				return;
		}
	}
	flushElementSelector: InteractiveSelectorResCb = (selected) => {
		this.lazyElements = selected;
		this.setState({ appPhase: selected ? AppPhase.PlainTyping : AppPhase.None });
	}
	resetApp = () => {
		this.setState({ appPhase: AppPhase.None });
	}
	startSelector = () => {
		this.setState({ appPhase: AppPhase.Picker });
	}
	render() {
		return <GeneralOptionContextProvider><ThemeContextProvider>
			{this.state.appPhase === AppPhase.Picker ?
				<InteractiveSelector
					skip={["img", "svg", "body", "html","iframe"]}
					callback={this.flushElementSelector}
				/>

			: this.state.appPhase === AppPhase.PlainTyping ?
					<PlainTyping
						lazyElements={this.lazyElements!}
						resetApp={this.resetApp}
						startSelector={this.startSelector}
					/>
				
			: null}
		</ThemeContextProvider></GeneralOptionContextProvider>
	}
}