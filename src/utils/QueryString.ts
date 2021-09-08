export type JoiningOp = " " | ">" | "" | ",";
export class QueryString {
	joiningOp;
	children;
	not: string[] = [];
	constructor(joiningOp: JoiningOp, ...children: (QueryString | string)[]) {
		this.joiningOp = joiningOp;
		this.children = children;
	}
	static createFromClassList(joiningOp: JoiningOp, classList: string[]) {
		return new QueryString(joiningOp, ...classList.map(c => `.${CSS.escape(c)}`));
	}
	toString(): string {
		const body = this.children.map(qs => {
			if (typeof (qs) == "string")
				return qs;
			else
				return qs.toString();
		}).join(this.joiningOp);

		if (this.not.length > 0) {
			const neg = this.not.join(',');
			if (this.joiningOp == ",")
				return `:is(${body}):not(${neg})`;
			else
				return `${body}:not(${neg})`;
		}
		else
		{
			return body;
		}
	}
}