import { delay, retryWhen } from "rxjs/operators";
import { defer } from "rxjs";
import { create } from "./ChromeRuntimeMessage";

export const onContentScriptAvailable = defer(() =>
	new Promise<void>((resolve, reject) =>
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (chrome.runtime.lastError || !tabs[0] || !tabs[0].id) {
				reject();
				return;
			}
			chrome.tabs.sendMessage(tabs[0].id, create("PING"), res => {
				if (chrome.runtime.lastError)
					reject();
				else if (res !== "PONG")
					reject();
				else
					resolve();
			});
		})
	)
)
	.pipe(
		retryWhen(err => err.pipe(delay(1000)))
	);

