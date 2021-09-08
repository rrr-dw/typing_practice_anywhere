import { ChromeRuntimeMessage, create } from "./utils/ChromeRuntimeMessage";


const enableOnCSInjected = (tabId:number) => {
	chrome.action.disable(tabId);
	chrome.tabs.sendMessage(tabId, create("PING"), res => {
		if (chrome.runtime.lastError || res !== "PONG")
			return;
		console.log("PONG from", tabId);
		chrome.action.enable(tabId);
	});
}
chrome.tabs.onActivated.addListener(activeInfo => enableOnCSInjected(activeInfo.tabId));
chrome.tabs.onUpdated.addListener(tabId => enableOnCSInjected(tabId));
chrome.runtime.onInstalled.addListener(details => {
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		if (chrome.runtime.lastError || tabs.length < 1 || tabs[0].id == undefined)
			return;
		
		enableOnCSInjected(tabs[0].id);
	})
})

chrome.runtime.onMessage.addListener((msg: ChromeRuntimeMessage, sender) => {
	console.log("ready from", sender);
	if (sender.tab?.id != undefined && msg.type == "READY")
		chrome.action.enable(sender.tab.id);
});
chrome.action.onClicked.addListener(tab => {
	if (tab.id == undefined) return;
	if (chrome.runtime.lastError) {
		chrome.action.disable(tab.id);
		return;
	}
	enableOnCSInjected(tab.id);

	chrome.tabs.sendMessage(tab.id, create("START_ELEMENT_PICKER"), () => {
		if (chrome.runtime.lastError) {
			return;
		}
	});
});