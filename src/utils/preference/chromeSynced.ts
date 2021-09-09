
const defaultOption = {
	elementSelectedBg: "#A0F060",
	elementSelectionRangeBg: "#A06060",
	typingOverlayBg: "#FFFFFF",
	typingOverlayFg: "#000000",
	wrongText: "#FF7060",
	composingText: "#46F6FF",
	useCpm: true,
	animated: true,
};
export type OptionType = typeof defaultOption;

export const getPreference =
	<K extends keyof OptionType, R extends OptionType[K]>(k: K) =>
	{
		return new Promise<R>((res) => {
			chrome.storage.local.get(k, items => {
				if (k in items)
					res(items[k]);
				else
					res(defaultOption[k] as R);
			});
	})
}

export const getDefaultPreference =
	<K extends keyof OptionType>(...keys: (K)[]) => {
	const entries = keys.map(k => [k, defaultOption[k]]);
		return Object.fromEntries(entries) as Pick<OptionType, K>;
}
