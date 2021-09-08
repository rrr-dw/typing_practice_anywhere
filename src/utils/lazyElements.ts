import { QueryString } from "./QueryString";

export class LazyElements{
	root;
	queryString;

	constructor(root:Element, queryString:QueryString) {
		this.root = root;
		this.queryString = queryString;
	}
	static getSimilarsFromElementDepthParams(e: Element, depth: number, strict:boolean) {
		let root = e;
		let queryString = new QueryString(strict ? ">" : " ");

		for (let i = 0; i < depth; i++) {
			if (!root.parentElement || root.tagName.toLowerCase() == "body") {
				depth = i;
				break;
			}
			if (strict) {
				const classQS = QueryString.createFromClassList("", [...root.classList].filter(isCharacterizingClass).filter(isSimpleClass));

				queryString.children.push(`${root.tagName}${classQS}`);
			}
			root = root.parentElement;
		}
		if(strict)
			queryString.children = queryString.children.reverse();
		else {
			const classQS = QueryString.createFromClassList("", [...e.classList].filter(isCharacterizingClass).filter(isSimpleClass));
			queryString.children.push(`${e.tagName}${classQS}`);
		}

		return { root, queryString ,depth };
	}

	*[Symbol.iterator]() {
		if (this.queryString.children.length == 0)
			yield this.root;
		else
			yield* this.root.querySelectorAll(`:scope ${this.queryString}`);
		
		return;
	}
	*topmosts() {
		if (this.queryString.children.length == 0) {
			yield this.root;
			return;
		}
		const rawQueryString = this.queryString.toString();
		const queryString = `:scope :is(${rawQueryString}):not(:scope :is(${rawQueryString}) :is(${rawQueryString}))`;
		yield* this.root.querySelectorAll(queryString);
	}

	*textNodes() {
		for (let el of this.topmosts()) {

			yield* childTextNodes(el);
		}
	}
}

function *childTextNodes(parent: Element):Generator<ChildNode,void> {
	for (let child = parent.firstChild; child; child = child.nextSibling) {

		if (child.nodeType === child.TEXT_NODE)
			yield child;
		else if (child.nodeType === child.ELEMENT_NODE)
			yield* childTextNodes(child as Element);
	}
	return;
}

const isSimpleClass = (className: string) => {
	const operators = [":"];
	return operators.every(op => className.indexOf(op) == -1);
}
const isCharacterizingClass = (className: string) => {
	const transients = ["focus", "sel", "cur", "act", "hover"];
	const loweredClassName = className.toLowerCase();
	return transients.every(t => loweredClassName.indexOf(t) == -1);
}