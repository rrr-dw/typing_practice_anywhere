import { createChromeSyncedReactContext } from "./chromeSyncedReactContext";

export type ThemeType = {
	elementSelectionRangeBg:string,
	elementSelectedBg: string,
	typingOverlayBg: string,
	typingOverlayFg: string,
	wrongText: string,
	composingText: string,
};
const defaultTheme: ThemeType = {
	elementSelectedBg: "#A0F060",
	elementSelectionRangeBg: "#A06060",
	typingOverlayBg: "#FFFFFF",
	typingOverlayFg: "#000000",
	wrongText: "#FF7060",
	composingText: "#46F6FF",
};

export const ThemeContextProvider = createChromeSyncedReactContext(defaultTheme);
export const themeContextType = ThemeContextProvider.contextType;