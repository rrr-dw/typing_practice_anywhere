export const formatMs = (ms: number) => {
	let s = Math.floor(ms / 1000);
	let m = Math.floor(s / 60);
	let h = Math.floor(m / 60);
	s %= 60;
	m %= 60;

	let res = `${addLeadingZero(m)}:${addLeadingZero(s)}`;

	if (h > 0)
		res = `${h}:${res}`;
	return res;
}

const addLeadingZero = (n: number) => {
	let res = `${n}`;
	if (res.length == 1) return `0${res}`;
	else return res;
}