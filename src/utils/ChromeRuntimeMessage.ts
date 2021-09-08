export type ChromeRuntimeMessageType = "START_ELEMENT_PICKER" | "TEST" | "PING" | "READY";
export type ChromeRuntimeMessage = {
	type: ChromeRuntimeMessageType,
	data?: any
};

export const create = (msgType: ChromeRuntimeMessageType, data?: any):ChromeRuntimeMessage => {
	return { type: msgType, data: data };
}