import React, { Component, ContextType, createRef, Fragment } from "react";
import { generalOptionContextType } from "../preference/general";
import { themeContextType } from "../preference/theme";
import { formatMs } from "../general/formatMs";
import { LazyElements } from "../lazyElements";
import { FloatingMessage } from "./floatingMessage";
import { KeyboardInteraction } from "./keyboardInteraction";
import { TypingOverlayInputBox } from "./typingOverlayInputBox";

enum Phase{
	Playing,
	Finished,
	NotTouched
};
type State = {phase:Phase, typingCount:number, elapsed:number,prevTime?:number,lastTypedTime?:number,timer?:NodeJS.Timer};
type Props = {lazyElements:LazyElements, resetApp:()=>void, startSelector:()=>void};

export class PlainTyping extends Component<Props, State>{

	static contextType = generalOptionContextType;
	declare context: ContextType<typeof generalOptionContextType>;

	constructor(props: Props) {
		super(props);
		
		this.state = { phase:Phase.Playing, typingCount:0, elapsed:0 };
	}

	stopTimer = () => {
		if (!!this.state.timer) {
			clearInterval(this.state.timer);
			this.setState({ timer: undefined });
		}
	}
	updateElapsed = () => {
		const dateNow = Date.now();
		if (!!this.state.prevTime) {
			this.setState(s => ({
					elapsed: s.elapsed + dateNow - s.prevTime!,
					prevTime: dateNow
				}));
		} else {
			this.setState({ prevTime: dateNow });
		}
		if (this.state.timer
			&& this.state.lastTypedTime
			&& this.state.lastTypedTime + 10 * 1000 < dateNow) {
			this.stopTimer();
		}
	}
	finishTyping = (touched: boolean) => {
		if (!touched) {
			
			this.setState({ phase: Phase.NotTouched });
			return;
		} else {
			
			this.stopTimer();
			this.setState({ phase: Phase.Finished });
			return;
		}
	}

	countTyping = () => {
		const dateNow = Date.now();
		if (!this.state.timer) {
			this.setState({
				prevTime: dateNow,
				timer: setInterval(this.updateElapsed, 1000)
			});
		}
		this.setState(s => ({
			typingCount: s.typingCount + 1,
			lastTypedTime: dateNow
		}));
		this.updateElapsed();
	}

	getTypingSpeed = () => {
		let res;
		let unit = this.context.useCpm? "CPM" : "WPM";
		if (this.state.elapsed==0) {
			res = "0";
		} else {
			
			res = (this.state.typingCount / this.state.elapsed * 60000 /(this.context.useCpm?1:5)).toFixed(0);
		}
		
		return `${res} ${unit}`;
	}

	onKeyDown = (ev: KeyboardEvent) => {
		switch (ev.key) {
			case "Escape":
				this.props.resetApp();
				break;
			case "r":
				this.setState({
					phase: Phase.Playing,
					typingCount: 0,
					elapsed: 0,
					prevTime: undefined,
					lastTypedTime: undefined,
					timer:undefined
				});
				break;
			case "n":
				this.props.startSelector();
				break;
			default:
				return;
		}

		ev.stopPropagation();
		ev.preventDefault();
	}

	render() {

		switch (this.state.phase) {
			case Phase.Playing:
				return <Fragment>
					<TypingOverlayInputBox lazyElements={this.props.lazyElements} finish={this.finishTyping} countTyping={this.countTyping} />
					<FloatingMessage contents={[
						[
							"Press [Tab] key to skip characters.",
							"Press [Shift-Tab] key to skip the current item.",
							"Press [ESC] key to finish.",
						],
						[
							["Speed: ", this.getTypingSpeed()],
							["Elapsed: ", `${formatMs(this.state.elapsed)}`],
							["#Typed: ", this.state.typingCount]
						],
						
					]} />
				</Fragment>;
			
			case Phase.Finished:
				return <Fragment>
					<KeyboardInteraction className="" onKeyDown={this.onKeyDown} />
					<FloatingMessage contents={[
						
						[
							"Press [R] key to restart.",
							"Press [N] key to select new targets.",
							"Press [ESC] key to close this box.",
						],
						[
							["Speed: ", this.getTypingSpeed()],
							["Elapsed: ", `${formatMs(this.state.elapsed)}`],
							["#Typed: ", this.state.typingCount]
						],
					]} />
				</Fragment>;
			case Phase.NotTouched:
				return <Fragment>
					<KeyboardInteraction className="" onKeyDown={this.onKeyDown} />
					<FloatingMessage contents={[
						[
							"No Text Detected.",
							"Press [ESC] key to close this box.",
							"Press [N] key to select new targets."
						]
					]} />
				</Fragment>;
		}
	}
}