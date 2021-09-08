import React,{Component, createRef, Ref } from "react";


type Props = { className: string, onKeyDown:(ev: KeyboardEvent)=>void};
type State = {};

export class KeyboardInteraction extends Component<Props, State>{
	ref;
	constructor(props: Props) {
		super(props);
		this.state = {};
		this.ref = createRef<HTMLInputElement>();
	}
	focusInput = () => {
		this.ref.current?.focus({ preventScroll: true });
	}

	componentDidMount() {
		this.ref.current!.addEventListener("keydown", this.props.onKeyDown);
		this.ref.current!.addEventListener("blur", this.focusInput);
		this.focusInput();
		document.addEventListener("focus", this.focusInput);
		document.addEventListener("keydown", this.props.onKeyDown, { capture: true });
	}
	componentWillUnmount() {
		document.removeEventListener("keydown", this.props.onKeyDown, { capture: true });
		document.removeEventListener("focus", this.focusInput);
		this.ref.current!.removeEventListener("blur", this.focusInput);
		this.ref.current!.removeEventListener("keydown", this.props.onKeyDown);
	}
	render() {
		return <input className={this.props.className} readOnly={true} tabIndex={0} ref={this.ref}
			style={{
				position: "fixed",
				width: 0,
				height: 0,
				border: 0,
				padding: 0,
				opacity:0
			}} />
	}
}