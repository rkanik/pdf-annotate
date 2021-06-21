<template>
	<div class="canvas-sizer" :id="`canvas-sizer-${this.pageNumber}`">
		<canvas :id="`canvas-${pageNumber}`" />
		<div class="annotationLayer" :id="`annotation-layer-${pageNumber}`" />
	</div>
</template>
<script>
import { mapMutations } from "vuex";
import { fabric } from "fabric/dist/fabric";

// DATA
const _toolTypes = {
	rect: 100,
	circle: 101,
	highlight: 102
}

export default {
	name: "PDFPage",
	props: {
		pageNumber: Number,
		pdfPage: Object,
		elType: Number,
		loggedIn: Boolean,
		lastFile: Boolean,
		rootScale: Number
	},
	data() {
		return {
			scale: null,
			canvasSizer: null,
			upperCanvas: {},

			mouseX: 0,
			mouseY: 0,

			drawing: false,
			elementType: this.elType,
			fabricObj: undefined,
		};
	},
	created() {
		this.scale = this.rootScale
	},
	computed: {
		lastFileFabricObjects() {
			return null
		},
		lastFileID() {
			return null
		}
	},
	watch: {
		pdfPage(page) {
			this.drawCanvas(page);
		},
		elType(type) {
			this.elementType = type;
			this.upperCanvas.isDrawingMode = type === 15 ? true : false;
		},
		rootScale(scale) {
			this.scale = scale;
			this.fixScale(this.pdfPage, scale);
		}
	},
	mounted() {
		this.canvasSizer = document.getElementById(
			`canvas-sizer-${this.pageNumber}`
		);
	},
	methods: {
		...mapMutations("pdfFile", ["setFabricCanvas"]),
		async drawCanvas(page) {
			const canvas = document.getElementById(`canvas-${this.pageNumber}`);

			this.fabricObj = fabric;

			const viewport = page.getViewport(this.scale);

			canvas.width = viewport.width;
			canvas.height = viewport.height;

			var context = canvas.getContext("2d");
			context.save();
			context.fillStyle = "rgb(255, 255, 255)";
			context.fillRect(0, 0, viewport.width, viewport.height);
			context.restore();

			await page.render({
				canvasContext: context,
				transform: [1, 0, 0, 1, 0, 0],
				viewport,
				intent: "print"
			});

			context.scale(600 / 96, 600 / 96);
			const bg = canvas.toDataURL("image/png", 1);
			const upperCanvas = new fabric.Canvas(`canvas-${this.pageNumber}`, {
				allowTouchScrolling: true,
				renderInteractiveForms: true,
				selection: false
			});

			upperCanvas.setDimensions({
				width: viewport.width,
				height: viewport.height
			});
			upperCanvas.freeDrawingBrush.color = "black";
			upperCanvas.freeDrawingBrush.width = 5;

			this.upperCanvas = upperCanvas;

			upperCanvas.setBackgroundImage(bg, upperCanvas.renderAll.bind(upperCanvas));

			this.setUpperCanvasMouseEvents(upperCanvas);
			this.canvasSizer.style.cssText = "width:max-content";

			this.$emit("done", this.pageNumber);
		},
		setUpperCanvasMouseEvents(upperCanvas) {
			upperCanvas.on("mouse:up", e => this.mouseUpFunction(e, upperCanvas));
			upperCanvas.on("mouse:down", e => this.mouseDownFunction(e, upperCanvas));
		},
		mouseUpFunction(event, upperCanvas) {
			if (this.drawing) this.fabricClickHandler(event, upperCanvas);
			this.drawing = false;
		},
		mouseDownFunction(event) {
			this.drawing = true;
			this.setCurrentMousePosition(event);
		},
		setCurrentMousePosition(event) {
			const { x, y } = this.upperCanvas
				.getPointer(
					event.touches
						? event.touches[0]
						: event
				);
			this.mouseX = x;
			this.mouseY = y;
		},
		fabricClickHandler(event, fabricObj) {
			const clientRect = fabricObj.upperCanvasEl.getBoundingClientRect()
			const ant = {
				left: event.clientX - clientRect.left,
				top: event.clientY - clientRect.top,
				cornerSize: 0,
				selectionLineWidth: 1,
				transparentCorners: true,
				cornerColor: "hsl(141, 71%, 48%)",
				hasRotatingPoint: false,
				padding: 3,
				borderDashArray: [3, 3],
				borderColor: "green",
			};

			const pointer = event.touches
				? this.upperCanvas.getPointer(event.touches[0])
				: this.upperCanvas.getPointer(event);

			if (this.elementType === _toolTypes.highlight) {

				this.highLightDrawing = true;

				this.lastElementCoockedID = ant.id = new Date().getTime();

				ant.height = 20;
				ant.width = Math.abs(pointer.x - this.mouseX);
				ant.fill = "rgba(255, 255, 0, 0.5)";

				ant.left = pointer.x < this.mouseX ? pointer.x : this.mouseX;
				ant.top = pointer.y < this.mouseY ? pointer.y - 9 : this.mouseY - 9;

				const contentToAdd = new fabric.Rect(ant);

				this.lastActiveLineObj = contentToAdd;
				fabricObj.add(contentToAdd);

				// const length = 200, height = 20
				const viewport = this.pdfPage.getViewport(1)
				const aLeft = ant.left / this.rootScale
				const aTop = ant.top / this.rootScale

				this.$emit('annotate', {
					type: 'createHighlightAnnotation',
					data: {
						page: this.pageNumber - 1,
						rect: [
							...this.topLeftToBottomLeft([aLeft, aTop], viewport.height),
							...this.topLeftToBottomLeft([aLeft + (ant.width / this.rootScale), aTop + ant.height,], viewport.height),
						],
						contents: "Hightlight",
						author: "RK Anik",
					}
				})
			}
			else if (this.elementType === _toolTypes.rect) {

				this.lastElementCoockedID = ant.id = new Date().getTime();

				ant.height = Math.abs(pointer.y - this.mouseY);
				ant.width = Math.abs(pointer.x - this.mouseX);
				ant.stroke = "black";
				ant.strokeWidth = 1;
				ant.fill = 'rgba(0,0,0,0)';

				ant.left = pointer.x < this.mouseX ? pointer.x : this.mouseX;
				ant.top = pointer.y < this.mouseY ? pointer.y - 9 : this.mouseY - 9;

				console.log('ant', ant)
				const contentToAdd = new fabric.Rect(ant);

				this.lastActiveLineObj = contentToAdd;
				fabricObj.add(contentToAdd);

				const viewport = this.pdfPage.getViewport(1)
				const [top, left, height, width] = [
					ant.top, ant.left,
					ant.height, ant.width
				].map(e => e / this.rootScale)

				this.$emit('annotate', {
					type: 'createSquareAnnotation',
					data: {
						page: this.pageNumber - 1,
						rect: [
							...this.topLeftToBottomLeft([left, top], viewport.height),
							...this.topLeftToBottomLeft([left + width, top + height], viewport.height),
						],
						color: { r: 0, g: 0, b: 0 }
					}
				})
			}
		},
		topLeftToBottomLeft([x, y], height) {
			return [x, height - y]
		},
	}
};
</script>
<style lang="scss">
	.canvas-sizer {
		position: relative;
		margin: 0 auto 1rem auto !important;
		overflow: visible !important;
		&:last-child {
			margin-bottom: 0 !important;
		}
		.canvas-container {
			height: max-content !important;
			width: max-content !important;
			canvas {
				&:first-child {
					touch-action: none;
					user-select: none;
					position: unset !important;
					top: unset !important;
					left: unset !important;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
						0 1px 2px rgba(0, 0, 0, 0.24) !important;
				}
				&:last-child {
					position: absolute !important;
					height: 100% !important;
					width: 100% !important;
					top: 0 !important;
					left: 0 !important;
				}
			}
		}
	}
</style>