import React, { ContextType, Fragment } from "react";


type OptionMethod<T> = {
	_save: () => void,
	_reset: ()=>void,
};
type Props = {};
type State<T> = {
	[K in (keyof OptionMethod<T>) | (keyof T)]:
	K extends keyof OptionMethod<T> ?
	OptionMethod<T>[K]
	: K extends keyof T?
	T[K]
	: never
};

export interface IChromeSyncedOption<T> extends React.Component<Props, State<T>>{
	contextType: React.Context<State<T>>;
	new(props:Props): IChromeSyncedOption<T>;
};

export const createChromeSyncedReactContext = <T,>(defaultOption: T) => {
	const context = React.createContext<State<T>>(defaultOption as State<T>);
	const ChromeSyncedOption = class extends React.Component<Props, State<T>>{

		static contextType = context;
		constructor(props: Props) {
			super(props);
			this.state = {
				...defaultOption,
				_save: this._save,
				_reset: this._reset
			} as State<T>;
		}

		_reset = () => {
			this.setState({ ...defaultOption } as any,this._save);
		}
		_save = () => {
			const entries = Object.keys(defaultOption).map(k => [k, this.state[k as keyof State<T>]]);

			chrome.storage.local.set(Object.fromEntries(entries));
		}
		readonly onChromeStorageChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
			if (areaName !== "local") return;

			const entries = Object.keys(changes)
				.filter(k => k in defaultOption)
				.map(k => [k, changes[k].newValue]);

			this.setState(Object.fromEntries(entries));
		}

		componentDidMount() {
			chrome.storage.onChanged.addListener(this.onChromeStorageChanged);
			chrome.storage.local.get(Object.keys(defaultOption), (opt) => {
				this.setState({ ...defaultOption, ...opt } as any);
			});
		}

		componentWillUnmount() {
			chrome.storage.onChanged.removeListener(this.onChromeStorageChanged);
		}

		render() {
			return <context.Provider value={this.state}>{this.props.children}</context.Provider>
		}
	};
	return ChromeSyncedOption as unknown as IChromeSyncedOption<T>;
}
	