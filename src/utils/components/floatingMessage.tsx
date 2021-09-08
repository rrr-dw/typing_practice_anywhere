import React from "react";
import styles from "./floatingMessage.module.scss";
import isStyles from "./interactiveSelector.module.scss";

type Table = (string | number)[][];
type List = (string | number)[];

type FloatingMessageState = { altPosition: boolean};
type FloatingMessageProps = { contents: (Table | List)[] };

const isTable = (el: Table | List): el is Table => {
	return Array.isArray(el[0]);
}

export class FloatingMessage extends React.Component<FloatingMessageProps, FloatingMessageState>{

	constructor(props: FloatingMessageProps) {
		super(props);
		this.state = { altPosition: false };
	}
	readonly togglePosition = () => {
		this.setState(state => ({ altPosition: !state.altPosition }));
	}

	render() {
		return (
			<div
				className={
					`${isStyles.skip} `
					+ `${styles.container} `
					+ (this.state.altPosition ? styles.altPosition : "")}
					tabIndex={-1}
				>
				{this.props.contents.map((t, i) => {

					if (isTable(t)) {
						
						return <div key={i} onMouseMove={this.togglePosition} style={{pointerEvents:"auto"}}><table><tbody>

							{t.map((r, j) =>
								<tr key={j}>

									{r.map((d, k) =>
										<td key={k}>{d}</td>)}

								</tr>)}

						</tbody></table></div>

					} else {
						return <div key={i} onMouseMove={this.togglePosition} style={{ pointerEvents: "auto" }}><ul>

							{t.map((li, j) =>
								<li key={j}>{li}</li>)}
							
						</ul></div>
					}
				}
				)}
				
				</div>
		)
	}
}