import { getDefaultPreference } from "./chromeSynced";
import { createChromeSyncedReactContext } from "./chromeSyncedReactContext";

export const ThemeContextProvider = createChromeSyncedReactContext(
	getDefaultPreference(
		"elementSelectionRangeBg",
		"elementSelectedBg",
		"typingOverlayBg",
		"typingOverlayFg",
		"wrongText",
		"composingText",
	)
);
export const themeContextType = ThemeContextProvider.contextType;