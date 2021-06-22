export const createRectangle = options => {
	return {
		padding: 3,
		cornerSize: 0,
		id: Date.now(),
		stroke: "black",
		strokeWidth: 1,
		borderColor: "green",
		borderDashArray: [3, 3],
		fill: "rgba(0,0,0,0)",
		cornerColor: "hsl(141, 71%, 48%)",
		hasRotatingPoint: false,
		selectionLineWidth: 1,
		transparentCorners: true,
		...options
	}
}