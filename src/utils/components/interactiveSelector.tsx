import React, { ContextType, createRef, Fragment } from "react";
import ReactDOM from "react-dom";
import styles from "./interactiveSelector.module.scss";
import { FloatingMessage } from "./floatingMessage";
import { LazyElements } from "../lazyElements";
import { QueryString } from "../QueryString";
import { themeContextType } from "../contexts/theme";
import { KeyboardInteraction } from "./keyboardInteraction";

type MouseEventCb = (ev:React.MouseEvent<HTMLDivElement, MouseEvent>)=>void;

class HighlightedBox extends React.Component<{ target:Element, onClick: MouseEventCb, background:string }>{
	render() {
		const rect = this.props.target.getBoundingClientRect();
		return (
			<div
				className={`${styles.skip} ${styles.highlighted}`}
				tabIndex={-1}
				style={{
					left: `${window.scrollX + rect.left}px`,
					top: `${window.scrollY + rect.top}px`,
					width: `${rect.width}px`,
					height: `${rect.height}px`,
					background: this.props.background
				}}
				onClick={this.props.onClick}
			/>
		);
	}
}


export type InteractiveSelectorResCb = (lazyElements: LazyElements | undefined) => void;
enum InteractiveSelectorMode { Similar=0, Text=1, Strict=2 };
type InteractiveSelectorState = { mode:InteractiveSelectorMode, root?:Element, queryString?:QueryString };
type InteractiveSelectorProps = { skip:string[], callback: InteractiveSelectorResCb };

const mode2strname = (mode: InteractiveSelectorMode) => {
	switch (mode) {
		case InteractiveSelectorMode.Text:
			return "Text Content";
		case InteractiveSelectorMode.Similar:
			return "Similar Content";
		case InteractiveSelectorMode.Strict:
			return "Strictly Similar Content";
	}
}
const mode2desc = (mode: InteractiveSelectorMode) => {
	const desc = [`Mode: ${mode2strname(mode)}`];
	switch (mode) {
		case InteractiveSelectorMode.Text:
			desc.push("Selects text.", "Works best with continous contents like articles.");
			break;
		case InteractiveSelectorMode.Similar:
			desc.push("Selects similar items.", "Works best with disconnected items.");
			break;
		case InteractiveSelectorMode.Strict:
			desc.push("Selects similar items in the same level of the DOM hierarchy.", "Works best with well-structed complex webpages.");
			break;
	}
	return desc;
}
export class InteractiveSelector extends React.Component<InteractiveSelectorProps, InteractiveSelectorState>{
	private target?: Element;
	private depth = 4;
	private effectiveDepth = this.depth;
	private targetLs:Element[] = [];

	private mouseClientX=0;
	private mouseClientY=0;

	static contextType = themeContextType;
	declare context: ContextType<typeof themeContextType>;

	constructor(props:InteractiveSelectorProps) {
		super(props);
		this.state = { mode: InteractiveSelectorMode.Similar };
		chrome.storage.local.get({
			interactiveSelectorDepth: 4,
			interactiveSelectorMode: InteractiveSelectorMode.Similar
		},sto => {
			if (sto['interactiveSelectorDepth']!= this.depth)
				this.depth = sto['interactiveSelectorDepth'];
			if (sto['interactiveSelectorMode']!= this.state.mode)
				this.setState({ mode: sto['interactiveSelectorMode'] });
		});
	}
	readonly cbMousemove = (ev: MouseEvent) => {
		this.mouseClientX = ev.clientX;
		this.mouseClientY = ev.clientY;
		this.updateTarget();
	}
	readonly updateTarget = ()=>{
		const targetCands = document.elementsFromPoint(this.mouseClientX, this.mouseClientY)
			.filter(t =>
				!this.props.skip.includes(t.tagName.toLowerCase())
				&& !t.classList.contains(styles.skip));
		
		if (targetCands[0]!==this.target) {
			this.target = targetCands[0];
			this.updateTargets();
		}
	};
	readonly sendResult = () => {
		this.props.callback(this.getSelected());
	};
	readonly sendCancel = () => {
		this.props.callback(undefined);
	};

	readonly cbKeydown = (ev: KeyboardEvent) => {
		switch (ev.key) {
			case ',':
				if (this.effectiveDepth > 0) {
					this.effectiveDepth = this.depth = Math.max(this.effectiveDepth - 1, 0);
					this.updateTargets();
				}
				break;
			case '.':
				if(this.effectiveDepth == this.depth){
					this.effectiveDepth = ++this.depth;
					this.updateTargets();
				}
				
				break;
			case 'Escape':
				this.sendCancel();
				break;
			
			case "m":
				this.setState(prev => ({ mode: (prev.mode+1)%3 }));
				this.updateTargets();
				break;
			default:
				return;
		}

		ev.stopPropagation();
		ev.preventDefault();
	}
	resultAvailable() {
		return this.state.root && this.state.queryString ? true : false;
	}
	getSelected() {
		return this.resultAvailable() ? new LazyElements(this.state.root!, this.state.queryString!) : undefined;
	}
	updateTargets() {
		if (!this.target) {
			this.targetLs = [];
			this.effectiveDepth = 4;
			this.setState({ root: undefined, queryString: undefined });
			return;
		}

		let root, queryString;

		if (this.state.mode == InteractiveSelectorMode.Text) {
			root = this.target;
			this.effectiveDepth = 0;
			for (let i = 0; i < this.depth; i++) {
				if (!root.parentElement)
					break;
				
				root = root.parentElement;
				this.effectiveDepth++;
			}
			queryString = new QueryString(","
				, "p", "span","blockquote","q","a","div"
				, "h1", "h2", "h3", "h4", "h5", "h6"
				, "li", "b", "strong", "i", "em", "mark", "label");
			queryString.not.push("table *");
		} else {
			const res = LazyElements.getSimilarsFromElementDepthParams(this.target, this.depth, this.state.mode == InteractiveSelectorMode.Strict);
			queryString = res.queryString;
			root = res.root;
			this.effectiveDepth = res.depth;
		}

		queryString.not.push(`.${styles.skip} *`);
		
		this.targetLs = [...new LazyElements(root, queryString).topmosts()];
		this.setState({ root, queryString });
	}
	componentDidMount() {

		document.addEventListener("mousemove", this.cbMousemove);
		document.addEventListener("scroll", this.updateTarget);
	}
	componentWillUnmount() {
		document.removeEventListener("scroll", this.updateTarget);
		document.removeEventListener("mousemove", this.cbMousemove);

		chrome.storage.local.set({
			'interactiveSelectorDepth': this.depth,
			'interactiveSelectorMode' : this.state.mode
		});
	}
	render() {
		return (
			<Fragment>
				<KeyboardInteraction className={`${styles.skip}`} onKeyDown={this.cbKeydown}/>
				<div className={`${styles.container} ${styles.skip}`} style={{ opacity: .5 }}>
					{
						this.resultAvailable() &&
							<HighlightedBox
								target={this.state.root!}
								onClick={this.sendResult}
								background={ this.context.elementSelectionRangeBg }
							/>
					}

					{
						this.targetLs.map(
						(t, i) => <HighlightedBox
							key={i}
							target={t}
							onClick={this.sendResult}
							background={ this.context.elementSelectedBg }
						/>)
					}
				</div>

				<FloatingMessage contents={[
					mode2desc(this.state.mode),
					[
						["#targets:",this.targetLs.length],
						["depth:", this.effectiveDepth],
					],
					[
						"Press [,] key to select less elements."
						, "Press [.] key to select more elements."
						, "Press [M] key to change the mode."
						,"Left-click to select."
						,"Press [ESC] key to cancel."
					],
					// [
					// 	`${this.state.root}, ${this.state.queryString}`
					// ]
				]} />
			</Fragment>
		)
	}
}
