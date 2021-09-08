import React, { Fragment } from "react";
import { createChromeSyncedReactContext } from "./chromeSyncedReactContext";

export type GeneralOptionType = {
	useCpm: boolean,
	animated: boolean,
};
const defaultOption: GeneralOptionType = {
	useCpm: true,
	animated: true,
};

export const GeneralOptionContextProvider = createChromeSyncedReactContext(defaultOption);
export const generalOptionContextType = GeneralOptionContextProvider.contextType;