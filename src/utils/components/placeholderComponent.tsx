import React, { ChangeEventHandler, Component, ContextType, createRef, Fragment } from "react";
import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { themeContextType } from "../preference/theme";

import styles from "./placeholderComponent.module.scss";
import bStyles from "./typingOverlayInputBox.module.scss";


class PlaceholderCell{
	content:string;
	className: string;
	key: number;

	constructor(content: string, className: string, key: number) {
		this.content = content;
		this.className = className;
		this.key = key;
	}
}
class PlaceholderCells{
	private raw:PlaceholderCell[] = [];
	private target: string="";
	private input: string="";
	private composingIdx: number = -1;
	private composingKey: number = -1;
	private composing: string = "";


	toSpans(composingText:string,wrongText:string) {
		const texts = this.raw.map(c => c.content.replaceAll('\n'," \n"));
		const hint =
			"‌"	// zero width non-joiner
			+ "​" // zero width space
			+ this.target.substr(this.input.length);
		if (texts.length>0 && hint.length==0 && texts[texts.length - 1].endsWith("\n"))
			texts[texts.length - 1] += " ";
		const resSpans = texts.map((text, i) => {
			let backgroundColor = undefined;
			switch (this.raw[i].className) {
				case styles.composing:
					backgroundColor = composingText;
					break;
				case styles.wrong:
					backgroundColor = wrongText;
					break;
			}
			return <span key={this.raw[i].key} className={this.raw[i].className} style={{backgroundColor}}>{text}</span>;
		});
		const hintSpan = <span key="hint" className={styles.hint}>{hint}</span>
		resSpans.push(hintSpan);
		return resSpans;
	}

	split(key: number) {
		let idx = this.raw.findIndex(cell => cell.key > key) - 1;
		if (idx < 0) idx = this.raw.length - 1;
		if (idx < 0) return this.raw.length;
		const cell = this.raw[idx];
		const textLeft = cell.content.substr(0, key - cell.key);
		const textRight = cell.content.substr(key - cell.key);
		let res = idx+1;
		cell.content = textLeft;

		if(textRight!="")
		{
			this.raw.splice(idx + 1, 0, new PlaceholderCell(textRight, cell.className, key));
		}
		if (textLeft == "")
		{
			this.raw.splice(idx, 1);
			res--;
		}
		return res;
	}

	mergeDown(idx: number) {

		if (this.raw[idx] && this.raw[idx - 1] && this.raw[idx].className == this.raw[idx - 1].className)
		{
			this.raw[idx - 1].content += this.raw[idx].content;
			this.raw.splice(idx, 1);
			return true;
		}
		return false;
	}

	setTarget(tar: string) {
		this.target = tar;
	}
	resetInput() {
		this.input = "";
		this.raw = [];
	}
	insert(start: number, end: number, str: string) {
		let idxPrev = this.split(start);
		if (idxPrev >= 0) {
			this.raw.splice(idxPrev, this.raw.length-idxPrev);
		}

		for (let i = 0; i < str.length; i++){
			const char = str[i];
			const className = this.target[start + i] === char ? styles.ok : styles.wrong;
			this.raw.splice(idxPrev, 0, new PlaceholderCell(char, className, start + i));
			if (!this.mergeDown(idxPrev)) idxPrev++;
		}

		this.input = this.input.substr(0, start) + str + this.input.substr(end);
		this.initInput(start + str.length);
		this.mergeDown(idxPrev);

	}
	startComposing(start: number) {
		if (this.composingIdx >= 0) this.endComposing();
		this.composingKey = start;
		this.composingIdx = this.split(start);
		this.raw.splice(this.composingIdx, 0, new PlaceholderCell("", styles.composing, -1));
	}
	updateComposing(str: string) {
		this.composing = this.raw[this.composingIdx].content = str;
	}
	endComposing() {
		if (this.composingIdx < 0) return;
		this.raw.splice(this.composingIdx, 1);
		this.composingIdx = -1;
		this.insert(this.composingKey, this.composingKey, this.composing);
		this.composingKey = -1;
	}

	reset(newInput: string) {
		this.endComposing();
		this.raw = [];
		this.input = newInput;
		this.initInput(0);
	}
	private initInput(startKey: number){
		let cell: PlaceholderCell | null = null;
		for (let i = startKey; i < this.input.length; i++) {
			let targetChar = this.target[i] ?? "";
			let inputChar = this.input[i] ?? "";
			let className;
			let displayChar;

			if (inputChar.length > 0) {
				if (inputChar === targetChar)
					className = styles.ok;
				else
					className = styles.wrong;
				displayChar = inputChar;
			} else {
				className = "";
				displayChar = "";
			}

			if (cell && cell.className == className) {
				cell.content += displayChar;
			}
			else {
				if (cell) this.raw.push(cell);
				cell = new PlaceholderCell(displayChar, className, i);
			}
		}
		if (cell) this.raw.push(cell);
	}
}

type State = {};
type Props = {
	targetText: string,
	style: React.CSSProperties, 
	inputElement: HTMLTextAreaElement, 
	cmd$: Observable<PlaceholderUpdateCmd>
};
export type PlaceholderUpdateCmd =
	{ cmd: "input", start: number, data?: string, end: number }
	| { cmd: "composing", composingPhase: "start", start: number, end: number }
	| { cmd:"composing", composingPhase: "update" | "end", data: string }
	| { cmd:"reset", newTarget:string, newInput:string};

export class PlaceholderComponent extends Component<Props, State>{

	static contextType = themeContextType;
	declare context: ContextType<typeof themeContextType>;

	cells = new PlaceholderCells();
	constructor(props: Props) {
		super(props);
		this.state = {};
		this.cells.setTarget(props.targetText);
		this.cells.reset("");
		this.props.cmd$.subscribe(c => {
			switch (c.cmd) {
				case "reset":
					this.cells.setTarget(c.newTarget);
					this.cells.reset(c.newInput);
					this.forceUpdate();
					break;
				
				case "composing":
					switch (c.composingPhase) {
						case "start":
							this.cells.insert(c.start, c.end, "");
							this.cells.startComposing(c.start);
							break;
						case "end":
							this.cells.endComposing();
							this.forceUpdate();
							break;
						case "update":
							this.cells.updateComposing(c.data);
							this.forceUpdate();
							break;
					}
					break;
				
				case "input":
					if (c.data == "") break;
					if (!c.data) {
						this.cells.reset(this.props.inputElement.value);
					} else {
						this.cells.insert(c.start, c.end, c.data);
					}
					this.forceUpdate();
					break;
			}
		});
	}

	render() {
		return <div
			className={styles.nomouse}
			id={bStyles.typingTextDiv}
			style={this.props.style}
		>
			{this.cells.toSpans(this.context.composingText, this.context.wrongText)}
		</div>
	}
}