import ReactDOM from "react-dom";
import React from "react";
import { App } from "./utils/components/App";
import isStyles from "./utils/components/interactiveSelector.module.scss";
import styles from "./contentScript.module.scss";
import { ChromeRuntimeMessage, create } from "./utils/ChromeRuntimeMessage";


const rootDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");

const renderApp = async () => {

	const stylesheetLink = document.createElementNS("http://www.w3.org/1999/xhtml", "link") as HTMLLinkElement;
	stylesheetLink.type = "text/css";
	stylesheetLink.rel = "stylesheet";
	stylesheetLink.href = chrome.runtime.getURL("contentScript.css");
	rootDiv.append(stylesheetLink);

	const reactRoot = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
	rootDiv.appendChild(reactRoot);
	ReactDOM.render(<App />, reactRoot);

	rootDiv.classList.add(styles.root);

	rootDiv.classList.add(isStyles.skip);

};

renderApp();
document.body.append(rootDiv);
chrome.runtime.sendMessage(create("READY"));

chrome.runtime.onMessage.addListener((message: ChromeRuntimeMessage, sender, sendResponse) => {
	if (!rootDiv.parentElement) {
		document.body.append(rootDiv);
	}
});