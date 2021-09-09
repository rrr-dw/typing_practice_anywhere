import React, { Component, ContextType, createRef, FormEventHandler, Fragment } from "react";
import { themeContextType } from "../contexts/theme";
import { LazyElements } from "../lazyElements";
import { PlaceholderComponent, PlaceholderUpdateCmd } from "./placeholderComponent";
import styles from "./typingOverlayInputBox.module.scss";
import Rx, { fromEvent, merge, Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { generalOptionContextType } from "../contexts/general";


const getTextContent = (nd: Node):string => {
	if (!(nd instanceof HTMLElement)) {
		return nd.textContent ?? "";
	}
	// if (nd.tagName=="SUP") {
	// 	return "";
	// }
	// if (nd.querySelector(":scope sup")) {
	// 	const rec = [];
	// 	for (const c of nd.childNodes) {
	// 		rec.push(getTextContent(c));
	// 	}
	// 	return rec.join("");
	// } else {
		return nd.innerText;
	// }
}
const getBoundingRect = (nd: Element) => {
	return nd.getBoundingClientRect();
	// const range = document.createRange();
	// range.selectNodeContents(nd);
	// return range.getBoundingClientRect();
}
type State = {
	containerDivStyle: React.CSSProperties,
	inputAreaStyle: React.CSSProperties,
	prevSpanStyle: React.CSSProperties,
};
type Props = { lazyElements: LazyElements, finish: (touched:boolean) => void, countTyping: ()=>void };
type InputElement = HTMLTextAreaElement;


const isElementInvisibleInHierarchy = (el: Element, textRect?: DOMRect, computedStyle?: CSSStyleDeclaration) => {
	while (!isElementInvisible(el,textRect,computedStyle)) {
		if (!el.parentElement)
			return false;
		
		el = el.parentElement;
		textRect = undefined;
		computedStyle = undefined;
	}
	return true;
}
const isElementInvisible = (el:Element, textRect?:DOMRect,computedStyle?:CSSStyleDeclaration)=> {

	if (getTextContent(el).trim().length == 0)
		return true;

	if(!computedStyle)
		computedStyle = window.getComputedStyle(el);
	
	if (computedStyle.display === "none"
		|| computedStyle.opacity === "0"
		|| computedStyle.visibility !== "visible"
	)
		return true;


	if (!textRect) {
		textRect = getBoundingRect(el);
	}

	if (
		computedStyle.overflow.search("hidden")>=0
		&& (
			computedStyle.height === "0px"
			|| computedStyle.width === "0px"
			|| textRect.width == 0
			|| textRect.height == 0
		)
	)
		return true;

	return false;
}

export class TypingOverlayInputBox extends Component<Props, State>{

	next;
	inputRef:HTMLTextAreaElement|null;
	containerRef;
	touched = false;
	currentTextContent: string;
	currentElement?: Element;
	resetPlaceholder = () => { };
	prevSelection = [0, 0];

	autoScrollMutationObserver;

	prevs: { textContent: string, style: React.CSSProperties, element: Element }[];
	placeholderUpdateCmd$?:Observable<PlaceholderUpdateCmd>;



	constructor(props: Props) {
		super(props);

		this.inputRef = null;
		this.containerRef = createRef<HTMLDivElement>();
		this.prevs = [];

		const topmosts = props.lazyElements.topmosts();
		const next = () => topmosts.next();
		this.next = next;
		this.state = { containerDivStyle: {}, inputAreaStyle: {}, prevSpanStyle: {}};

		this.currentTextContent = "";
		this.autoScrollMutationObserver = new MutationObserver(this.scrollIntoView);
	}
	scrollIntoView = () => {
		this.inputRef?.scrollIntoView({ block: "center" });
		this.scrollToCursor();
	}
	scrollToCursor = ()=>{
		this.inputRef?.blur();
		this.inputRef?.focus({ preventScroll: false });
	}

	updateStyles(textRect?: DOMRect, computedStyle?: CSSStyleDeclaration, nrrects?: number) {

		if (!this.currentElement) return;

		if (!textRect || !nrrects) {
			const range = document.createRange();
			range.selectNodeContents(this.currentElement);

			if (!textRect)
				textRect = getBoundingRect(this.currentElement);
			if(!nrrects)
				nrrects = (
					new Set([...range.getClientRects()]
					.filter(rect => rect.width > 0 && rect.height > 0)
					.map(rect => rect.top))
				).size;
		}
		if (!computedStyle) {
			computedStyle = window.getComputedStyle(this.currentElement);
		}

		const absPos = {
			left: textRect.left + window.scrollX,
			bottom: textRect.bottom + window.scrollY
		};
		const epsilon = 1.0;
		if (this.prevs.length > 0) {
			const prevEl = this.prevs[this.prevs.length - 1].element;
			const prevTextRect = getBoundingRect(prevEl);
			if(Math.abs(prevTextRect.top - textRect.top) > epsilon
				|| prevTextRect.left+prevTextRect.width - epsilon > textRect.left)
			{
				this.prevs = [];
			}
		}

		const minHeight = this.prevs.map(p => getBoundingRect(p.element).height).reduce((lhs, rhs) => Math.max(lhs, rhs), 0);
		const textWrapped = nrrects > this.currentTextContent.split('\n').length;
		this.setState({
			containerDivStyle: {
				top: absPos.bottom,
				minHeight: minHeight
			},
			inputAreaStyle: {
				left: absPos.left,
				width: textWrapped ? `${textRect.width}px` : `calc(100% - ${absPos.left}px)`,
				font: computedStyle.font,
				wordSpacing: computedStyle.wordSpacing as any,
				letterSpacing: computedStyle.letterSpacing
			}
		});
	}
	computeSpanStyle(el?: Element) {
		if (!el) return {};
		const textRect = getBoundingRect(el);
		const computedStyle = window.getComputedStyle(el);
		const absPos = {
			left: textRect.left + window.scrollX,
			bottom: textRect.bottom + window.scrollY
		};
		return {
			left: absPos.left,
			width: textRect.width,
			height: textRect.height,
			font: computedStyle.font,
			wordSpacing: computedStyle.wordSpacing as any,
			letterSpacing: computedStyle.letterSpacing
		};
	}
	nextTextContent() {
		const nextPrev = {
			textContent: this.currentTextContent,
			element: this.currentElement,
			style: this.computeSpanStyle(this.currentElement),
		};

		const res = this.nextElement();
		if (!res ) return;

		if(this.currentElement && this.currentTextContent.length>0)
			this.prevs.push(nextPrev as any);
			
		const textContent = getTextContent(this.currentElement!);
		this.currentTextContent = textContent
			.replaceAll(/\[\d+?\]/g, "") // ignore [n]
			.replaceAll("[edit]", "") // ignore [edit]
			.replaceAll(" ", " ").trim(); // convert nonbreaking space to normal space first and then trim
		this.updateStyles();
		this.prevSelection = [0, 0];
		if (this.inputRef) this.inputRef.selectionStart = this.inputRef.selectionEnd = 0;
		this.touched = true;
		this.resetPlaceholder();
	}

	nextElement() {

		let el;
		this.currentElement = undefined;
		do {
			const nextRes = this.next();

			if (nextRes.done) {
				this.props.finish(this.touched);
				return false;
			}

			el = nextRes.value;
		} while (isElementInvisibleInHierarchy(el));

		this.currentElement = el;
		return true;
	}

	componentDidMount() {
		this.nextTextContent();

		this.autoScrollMutationObserver.observe(this.containerRef.current!, { attributeFilter: ['style'] });
		this.scrollIntoView();
		
		window.addEventListener("resize", this.onResize);
		// window.addEventListener("scroll", this.onResize);
		document.addEventListener("selectionchange", this.onSelectionChange);

		let sub = new Subject<PlaceholderUpdateCmd>();
		this.resetPlaceholder = () => sub.next({
			cmd: "reset",
			newTarget: this.currentTextContent,
			newInput: this.inputRef!.value
		});
		this.placeholderUpdateCmd$ = merge(
			sub,			
			fromEvent<InputEvent>(this.inputRef!, "input").pipe(
				filter(
					ev => !ev.isComposing
				),
				map(ev => {
					const start = this.prevSelection[0];
					const end = this.prevSelection[1];
					this.prevSelection = [this.inputRef!.selectionStart, this.inputRef!.selectionEnd];
					return {
						cmd:"input",
						start,
						end,
						data:ev.data
					} as PlaceholderUpdateCmd;
				})
			),
			fromEvent<CompositionEvent>(this.inputRef!, "compositionstart").pipe(
				map(ev => {
					const start = this.prevSelection[0];
					const end = this.prevSelection[1];
					this.prevSelection = [this.inputRef!.selectionStart, this.inputRef!.selectionEnd];
					return {
						cmd:"composing",
						composingPhase: "start",
						start,
						end,
					} as PlaceholderUpdateCmd;
				})
			),
			fromEvent<CompositionEvent>(this.inputRef!, "compositionupdate").pipe(
				map(ev => {
					this.prevSelection = [this.inputRef!.selectionStart, this.inputRef!.selectionEnd];
					return {
						cmd:"composing",
						composingPhase: "update",
						data: ev.data
					} as PlaceholderUpdateCmd;
				})
			),
			fromEvent<CompositionEvent>(this.inputRef!, "compositionend").pipe(
				map(ev => {
					this.prevSelection = [this.inputRef!.selectionStart, this.inputRef!.selectionEnd];
					return {
						cmd:"composing",
						composingPhase: "end",
						data: ev.data,
					} as PlaceholderUpdateCmd;
				})
			)
		);
	}
	componentWillUnmount() {
		document.removeEventListener("selectionchange", this.onSelectionChange);
		// window.removeEventListener("scroll", this.onResize);
		window.removeEventListener("resize", this.onResize);
		this.autoScrollMutationObserver.disconnect();

		this.inputRef!.blur();
	}

	onSelectionChange = () => {
		if (this.inputRef && document.activeElement == this.inputRef) {
			
			this.prevSelection = [this.inputRef!.selectionStart, this.inputRef!.selectionEnd];
		}
	}
	onBlur = () => {
		this.inputRef!.focus();
	}

	onResize = () => {
		this.updateStyles();
		this.prevs.forEach(p => { p.style = this.computeSpanStyle(p.element) });
		this.scrollIntoView();
	}
	onKeyDown: React.KeyboardEventHandler<InputElement> = (ev) => {
		const target = (ev.target as InputElement);

		switch (ev.key) {
			case "Escape":
				this.props.finish(this.touched);
				break;

			case "Tab":
				if (!ev.getModifierState("Shift")) {
					this.onTab(target);
				}
				break;
			default:
				return;
		}
		ev.preventDefault();

	}
	onKeyUp: React.KeyboardEventHandler<InputElement> = (ev) => {
		const target = (ev.target as InputElement);

		switch (ev.key) {
			case "Tab":
				if (ev.getModifierState("Shift")) {
					target.value = "";
					this.nextTextContent();
				}
				break;
			default:
				return;
		}
		ev.preventDefault();
	}
	onTab(target: InputElement) {
		const st = target.selectionStart;
		const ed = st==target.selectionEnd? st+1 : target.selectionEnd;
		const nxtStr = this.currentTextContent.substring(st, ed);

		if (nxtStr.length == 0) return;

		target.value = `${target.value.substring(0, st)}${nxtStr}${target.value.substring(ed)}`;
		target.selectionStart = target.selectionEnd = ed;

		const inputEvent = new InputEvent("input", { data: undefined, isComposing: false, bubbles: true, cancelable: true });
		target.dispatchEvent(inputEvent);
		this.scrollToCursor();
	}
	onInput: FormEventHandler<HTMLTextAreaElement> = (ev) => {
		const nev = ev.nativeEvent as InputEvent;
		if(nev.inputType.startsWith("insert")) this.props.countTyping();
		if (nev.isComposing) return;
		this.onUpdatedValue();

	}
	onUpdatedValue = ()=>{
		while (this.inputRef?.value.startsWith(this.currentTextContent)) {
			this.inputRef.value = this.inputRef.value.substr(this.currentTextContent.length);
			this.nextTextContent();
			if (this.currentTextContent.length == 0) return;
		}
		if (this.inputRef
			&& this.inputRef.value.length == 1
			&& this.inputRef.value != this.currentTextContent[0]
			&& ['\n', ' '].includes(this.inputRef.value))
		{
			this.inputRef.value = "";
			this.resetPlaceholder();
		}
	}
	onTransitionEnd:React.TransitionEventHandler<HTMLDivElement> = (ev) => {
		if(ev.propertyName =="top")
			this.scrollIntoView();
	}

	render() {
		return <themeContextType.Consumer>{theme =>
			<generalOptionContextType.Consumer>{opt => {
				const inputStyle = { ...this.state.inputAreaStyle, color: theme.typingOverlayFg };
				return <div
					ref={this.containerRef}
					id={styles.container}
					className={ opt.animated?undefined:styles.noAnimation}
					style={{ ...this.state.containerDivStyle, backgroundColor: theme.typingOverlayBg }}
					key={styles.container}
					onTransitionEnd={this.onTransitionEnd}
				>
					{
						this.prevs.map((prev, i) =>
							<span
								className={styles.span}
								style={{ ...prev.style, color: theme.typingOverlayFg }}
								key={i}
							>
								{prev.textContent}
							</span>
						)
					}
					<textarea
						ref={ref => {
							this.inputRef = ref;
							[
								["left", `${inputStyle.left}px`],
								["width", inputStyle.width],
								["min-width", inputStyle.width],
								["font", inputStyle.font],
								["word-spacing", inputStyle.wordSpacing],
								["color", inputStyle.color],
								["letter-spacing", inputStyle.letterSpacing],
							].forEach(([nativeName, val]) =>
								ref?.style.setProperty(nativeName as string, `${val}`, "important")
							);
						}}
						id={styles.typingTextTextArea}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						onBlur={this.onBlur}
						onInput={this.onInput}
						onCompositionEnd={this.onUpdatedValue}
					/>
					{
						(this.currentElement && this.inputRef && this.placeholderUpdateCmd$)
							? <PlaceholderComponent
								targetText={this.currentTextContent}
								style={inputStyle}
								inputElement={this.inputRef}
								cmd$={this.placeholderUpdateCmd$}
							/>
							: null
					}
				</div>
			}
			}</generalOptionContextType.Consumer>
		}</themeContextType.Consumer>
	}
}
