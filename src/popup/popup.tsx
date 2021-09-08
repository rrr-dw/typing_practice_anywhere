import React, { FC } from "react";
import { render } from 'react-dom';
import "./popup.scss";
import { create } from "../utils/ChromeRuntimeMessage";
import { Subscription } from "rxjs";
import { onContentScriptAvailable } from "../utils/onContentScriptAvailable";


const elementpicker = () => {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		if (chrome.runtime.lastError || !tabs[0] || !tabs[0].id) return;

		chrome.tabs.sendMessage(tabs[0].id, create("START_ELEMENT_PICKER"), () => {
			if (chrome.runtime.lastError) return;
			window.close();
		});
	});
}

const test = () => {
	chrome.runtime.sendMessage(create("TEST"));
}

type PopupProps = {};
type PopupState = {contentScriptAvailable:boolean};
class Popup extends React.Component<PopupProps,PopupState>{

	subscriptions:Subscription[] = [];
	constructor(props:PopupProps) {
		super(props);
		this.state = {
			contentScriptAvailable:false
		};
	}

	componentDidMount() {
		this.subscriptions.push(
			onContentScriptAvailable.subscribe(
				() => this.setState({ contentScriptAvailable: true })
			));
	}
	componentWillUnmount() {
		this.subscriptions.forEach(s => s.unsubscribe());
	}
	render(){
	return (
		<div>
			Popup Page
			<button onClick={ test }>
				test
			</button>
			<button onClick={elementpicker} disabled={!this.state.contentScriptAvailable}>
				picker
			</button>
		</div>
	);
}
}

render(<Popup />, document.getElementById("root"));