export { }

declare global {
	interface ObjectConstructor {
		keys<T>(o: T&object): (keyof T)[];
	}
}