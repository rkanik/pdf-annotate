<template>
	<div class="canvas-sizer" :id="`canvas-sizer-${this.pageNumber}`">
		<canvas :id="`canvas-${pageNumber}`" />
		<div class="annotationLayer" :id="`annotation-layer-${pageNumber}`" />
		<ToolsMenu
			:delete="true"
			:left="objActionMenuLeft"
			:lowercase="true"
			:top="objActionMenuTop"
			:uppercase="true"
			@bigger="goBigger"
			@ok="closeObjActionMenuModal"
			@remove="removeItem"
			@smaller="goSmaller"
			v-if="objActionMenu"
		/>
	</div>
</template>
<script>
import { fabric } from "fabric/dist/fabric";
import { mapMutations } from "vuex";
import ToolsMenu from "@/components/ToolsMenu";
// import moment from "moment";
import PDFJS from "pdfjs-dist";

import "pdfjs-dist/web/pdf_viewer.css";
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
	components: { ToolsMenu },
	data() {
		return {
			scale: null,
			canvasSizer: null,
			upperCanvas: {},
			annotations: [],

			mouseX: 0,
			mouseY: 0,

			objActionMenu: false,
			objActionMenuLeft: 0,
			objActionMenuTop: 0,
			objSelected: false,

			drawing: false,
			elementType: this.elType,
			lineDrawing: false,
			highLightDrawing: false,
			fabricObj: undefined,
			lastSelectedObj: null,
			mods: []
		};
	},
	created() { this.scale = this.rootScale },
	computed: {
		lastFileFabricObjects() {
			return null
		},
		lastFileID() {
			return null
		},
		fabricCanvas() {
			return null
		},
		computedName: {
			set() { },
			get() {
				return `${this.toTitleCase(this.user.firstName)} ${this.toTitleCase(
					this.user.lastName
				)}`;
			}
		},
		computedInitial: {
			set() { },
			get() {
				return `${this.toTitleCase(this.user.firstName).charAt(
					0
				)}.${this.toTitleCase(this.user.lastName).charAt(0)}.`;
			}
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
		removeItem() {
			this.upperCanvas.remove(this.upperCanvas.getActiveObject());
			this.closeObjActionMenuModal();
			// const objs = this.upperCanvas.getObjects();
			// let strObj = JSON.stringify(objs);
			// strObj = JSON.parse(strObj);
			// this.setFabricCanvas({
			// 	fabArray: strObj,
			// 	pageNumber: this.pageNumber
			// });
		},
		goSmaller() {
			const newItem = this.upperCanvas.getActiveObject();
			if (newItem.fontSize) {
				newItem.fontSize -= 1;
			} else if (newItem.x1 && newItem.x2 && newItem.y1 && newItem.y2) {
				newItem.scaleX -= 0.1;
			} else {
				newItem.scaleX -= 0.1;
				newItem.scaleY -= 0.1;
			}
			this.upperCanvas.setActiveObject(newItem);
			this.upperCanvas.renderAll();
			// const objs = this.upperCanvas.getObjects();
			// let strObj = JSON.stringify(objs);
			// strObj = JSON.parse(strObj);
			// this.setFabricCanvas({
			// 	fabArray: strObj,
			// 	pageNumber: this.pageNumber
			// });
		},
		goBigger() {
			const newItem = this.upperCanvas.getActiveObject();
			if (newItem.fontSize) {
				newItem.fontSize += 2;
			} else if (newItem.x1 && newItem.y1) {
				newItem.scaleX += 0.1;
			} else {
				newItem.scaleX += 0.1;
				newItem.scaleY += 0.1;
			}
			this.upperCanvas.setActiveObject(newItem);
			this.upperCanvas.renderAll();
			// const objs = this.upperCanvas.getObjects();
			// let strObj = JSON.stringify(objs);
			// strObj = JSON.parse(strObj);
			// this.setFabricCanvas({
			// 	fabArray: strObj,
			// 	pageNumber: this.pageNumber
			// });
		},
		closeObjActionMenuModal() {
			this.objSelected = false;
			this.objActionMenu = false;
			this.lastSelectedObj = null;
			this.upperCanvas.discardActiveObject();
			this.upperCanvas.renderAll();
			// this.panZoom.resume()
			this.canvasSizer.style.overflow = "scroll";
		},
		toTitleCase(str) {
			return str.replace(
				/\w\S*/g,
				txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
			);
		},
		saveMods(cookedData, val) {
			this.mods.push({
				elementType: this.elementType,
				cookedData,
				page: this.pageNumber,
				elementValue: val
			});
		},
		drawFirstTime(objs, upperCanvas) {
			let savedCanvas = objs[`PAGE_${this.pageNumber}`];
			if (!savedCanvas) return;
			savedCanvas.forEach(o => {
				const cookedData = {
					left: o.left,
					top: o.top
				};
				cookedData.cornerSize = 0;
				cookedData.selectionLineWidth = 1;
				cookedData.transparentCorners = true;
				cookedData.cornerColor = "hsl(141, 71%, 48%)";
				cookedData.hasRotatingPoint = false;
				cookedData.padding = 3;
				cookedData.borderDashArray = [3, 3];
				cookedData.borderColor = "green";
				cookedData.scaleX = o.scaleX;
				cookedData.scaleY = o.scaleY;
				cookedData.width = o.width;
				cookedData.height = o.height;

				switch (o.type) {
					case "i-text":
						cookedData.originX = "left";
						cookedData.fontSize = 25;
						upperCanvas.add(new fabric.IText(o.text, cookedData));
						break;
					case "text":
						cookedData.originX = "left";
						upperCanvas.add(
							new fabric.IText(o.text, Object.assign({}, cookedData, o))
						);
						break;
					case "path":
						upperCanvas.add(
							new fabric.Path(
								o.path,
								Object.assign({}, cookedData, {
									fill: false,
									stroke: "black",
									strokeWidth: 5
								})
							)
						);
						break;
					case "circle":
						upperCanvas.add(
							new fabric.Circle(Object.assign({}, o, cookedData))
						);
						break;
					case "line":
						upperCanvas.add(
							new fabric.Line(
								[o.x1, o.y1, o.x2, o.y2],
								Object.assign({}, o, cookedData)
							)
						);
						break;
					case "rect":
						upperCanvas.add(
							new fabric.Rect(Object.assign({}, o, cookedData))
						);
						break;
					case "image":
						new fabric.Image.fromURL(
							o.src,
							img => {
								upperCanvas.add(img);
							},
							Object.assign({}, o, cookedData)
						);
						break;
				}
			});
			upperCanvas.renderAll();
		},
		async fixScale(page, scale) {

			// Finding canvases
			let container = this.canvasSizer.firstElementChild;
			const canvas = container.firstElementChild;
			const upperCanvas = container.lastElementChild;

			// Gettings viewport of canvas with new scale
			const viewport = page.getViewport(scale);

			// Assigning height and width of both upper and lower canvas
			canvas.width = upperCanvas.width = viewport.width;
			canvas.height = upperCanvas.height = viewport.height;

			// Getiings context
			var context = canvas.getContext("2d");
			context.save(); context.restore();

			// Re-rendering page
			await page.render({
				canvasContext: context,
				transform: [1, 0, 0, 1, 0, 0],
				viewport,
				intent: "print"
			});

			// Rendering previous draws
			this.upperCanvas.renderAll();

			// Saving annotation values before re-render
			let annValues = this.getAnnotationValues()

			// Rendering annotations
			await this.renderAnnotationLayer(page, viewport, true /** Re-render */);

			// Bringing back annotation values
			this.setAnnotationValues(annValues)

			this.removeCanvasStyles(canvas);
			this.resize(this.upperCanvas);
		},
		async drawCanvas(page) {
			const canvas = document.getElementById(`canvas-${this.pageNumber}`);

			const dis = this;
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

			if (this.fabricCanvas != null) {
				dis.drawFirstTime(this.fabricCanvas, upperCanvas);
			}

			upperCanvas.setBackgroundImage(
				bg,
				upperCanvas.renderAll.bind(upperCanvas)
			);

			//this.setOldModifications();
			this.setUpperCanvasMouseEvents(upperCanvas);
			this.canvasSizer.style.cssText = "width:max-content";

			// Render annotation layer
			this.renderAnnotationLayer(page, viewport);

			this.$emit("done", this.pageNumber);
		},
		setUpperCanvasMouseEvents(upperCanvas) {

			// If has a selected object then showing context menu
			// let activeObject = upperCanvas.getActiveObject()
			// $(upperCanvas.upperCanvasEl).click(e => {
			// 	this.objActionMenu = activeObject ? false : true
			// });

			// Listening object events
			upperCanvas.on("object:selected", e => this.opteion(e, upperCanvas));
			upperCanvas.on("object:moving", e => this.opteion(e, upperCanvas));

			// Listening mouse events
			upperCanvas.on("mouse:up", e => this.mouseUpFunction(e, upperCanvas));
			upperCanvas.on("mouse:down", e => this.mouseDownFunction(e, upperCanvas));
			upperCanvas.on("mouse:move", e => this.mouseMoveFunction(e, upperCanvas));

			// Listening window events
			window.addEventListener("load", this.resize(upperCanvas), false);
			window.addEventListener("resize", () => this.resize(upperCanvas), false);

		},
		getSectionFromAnnotation(id) {
			return [...document.querySelectorAll("section")].find(
				s => s.getAttribute("data-annotation-id") === id
			);
		},
		getAnnotationValues() {
			return this.annotations.map(an => {
				let fieldName = an.fieldName.toLowerCase();
				let value = { id: an.id, name: fieldName };
				let section = this.getSectionFromAnnotation(an.id);
				if (section) {
					let input = section.querySelector("input");
					if (input) {
						value.type = input.type;
						value = input.type === "radio" ?
							{
								...value,
								checked: input.checked
							} : {
								...value,
								value: input.value
							};
					}
				}
				return value
			});
		},
		setAnnotationValues(values) {
			values.forEach(val => {
				let section = this.getSectionFromAnnotation(val.id)
				let input = section && section.querySelector('input')
				if (input) {
					if (input.type === 'radio') {
						input.checked = val.checked ? val.checked : false
					} else {
						input.value = val.value ? val.value : ""
					}
				}
			})
		},
		async renderAnnotationLayer(page, viewport, reRender) {

			// Finding annotation layer element
			let id = `annotation-layer-${this.pageNumber}`
			let annotationLayer = document.getElementById(id);

			// Gettings annotations
			if (!reRender) this.annotations = await page.getAnnotations();

			// Erase previous annotations
			else annotationLayer.innerHTML = "";

			// Render annotation layer
			await PDFJS.AnnotationLayer.render({
				viewport: viewport.clone({ dontFlip: true }),
				div: annotationLayer, page,
				annotations: this.annotations,
				renderInteractiveForms: true
			});
		},
		removeCanvasStyles(canvas) {
			let container = this.canvasSizer.firstElementChild;
			canvas.removeAttribute("style");
			this.canvasSizer.style.cssText = "width:max-content";
			container.removeAttribute("style");
			container.lastElementChild.removeAttribute("style");
		},
		resize(upperCanvas) {
			let canvasSig = document.getElementById("sig-canvas");

			// const canvasScaleFactor =	this.canvasSizer.offsetWidth / window.innerWidth;
			let width = this.canvasSizer.offsetWidth;
			let height = this.canvasSizer.offsetHeight;
			const ratio = upperCanvas.getWidth() / upperCanvas.getHeight();
			if (width / height > ratio) {
				width = height * ratio;
			} else {
				height = width / ratio;
			}

			const scale = width / upperCanvas.getWidth();
			let zoom = upperCanvas.getZoom();
			zoom *= scale;
			upperCanvas.setDimensions({ width, height });
			upperCanvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);

			if (window.innerWidth < 768) {
				canvasSig.width = 306;
				canvasSig.height = 176;
			} else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
				canvasSig.width = 656;
				canvasSig.height = 176;
			}
		},
		mouseUpFunction(event, upperCanvas) {
			if (!this.objSelected) {
				if (this.drawing) {
					this.fabricClickHandler(event, upperCanvas);
				}

				this.lineDrawing = false;
				this.highLightDrawing = false;
				this.drawing = false;

				// const objs = upperCanvas.getObjects();
				// let strObj = JSON.stringify(objs);
				// strObj = JSON.parse(strObj);

				// this.setFabricCanvas({
				// 	fabArray: strObj,
				// 	pageNumber: this.pageNumber
				// });
			}
		},
		mouseDownFunction(event, upperCanvas) {
			if (!this.objSelected) {
				this.drawing = true;
				this.setCurrentMousePosition(event);
				if (this.elementType === 12) {
					this.fabricClickHandler(event, upperCanvas);
				} else if (this.elementType === 14) {
					this.fabricClickHandler(event, upperCanvas);
				}
			} else {
				this.checkLastSelected();
			}
		},
		mouseLeaveFunction(/*event, upperCanvas*/) {
			if (!this.objSelected) {
				this.lineDrawing = false;
				this.highLightDrawing = false;
				this.canvasSizer.style.overflow = "scroll";
			}
		},
		mouseMoveFunction(event, upperCanvas) {
			if (this.lineDrawing) this.fabricClickHandler(event, upperCanvas);
			else if (this.highLightDrawing)
				this.fabricClickHandler(event, upperCanvas);
		},
		setCurrentMousePosition(event) {
			if (event.touches) {
				const pointer = this.upperCanvas.getPointer(event.touches[0]);
				this.mouseX = pointer.x;
				this.mouseY = pointer.y;
			} else {
				const pointer = this.upperCanvas.getPointer(event);
				this.mouseX = pointer.x;
				this.mouseY = pointer.y;
			}
		},
		checkLastSelected() {
			if (this.lastSelectedObj != null) {
				this.upperCanvas.setActiveObject(this.lastSelectedObj);
			}
		},
		fetchDate() {
			return '20-06-2021'//moment().format("d-MM-YYYY");
		},
		handleLineDrawing(data, fabCanvas, pointer) {
			const i = this.lastElementCoockedID;
			fabCanvas.remove(this.lastActiveLineObj);
			var points = [this.mouseX, this.mouseY, pointer.x, pointer.y];

			data.id = i;
			data.stroke = "#000000";
			data.fill = "#000000";
			data.strokeWidth = 8;
			data.padding = 3;
			data.left = pointer.x < this.mouseX ? pointer.x : this.mouseX;
			data.top = pointer.y < this.mouseY ? pointer.y - 3 : this.mouseY - 3;
			data.lockScalingY = true;

			const contentToAdd = new fabric.Line(points, data);

			this.lastActiveLineObj = contentToAdd;
			fabCanvas.add(contentToAdd);
		},
		handleHighlightDrawing(data, fabCanvas, pointer) {
			fabCanvas.remove(this.lastActiveLineObj);
			// var points = [this.mouseX, this.mouseY, pointer.x, pointer.y];

			data.id = this.lastElementCoockedID;
			data.width = Math.abs(pointer.x - this.mouseX);
			data.height = 20;
			data.fill = "#d4d40096";
			data.left = pointer.x < this.mouseX ? pointer.x : this.mouseX;
			data.top = pointer.y < this.mouseY ? pointer.y - 9 : this.mouseY - 9;

			const contentToAdd = new fabric.Rect(data);
			this.lastActiveLineObj = contentToAdd;
			fabCanvas.add(contentToAdd);
		},
		fabricClickHandler(event, fabricObj) {


			console.log('fabricClickHandler', event, fabricObj)

			const cookedData = {
				left:
					event.clientX -
					fabricObj.upperCanvasEl.getBoundingClientRect().left,
				top:
					event.clientY -
					fabricObj.upperCanvasEl.getBoundingClientRect().top
			};
			cookedData.cornerSize = 0;
			cookedData.selectionLineWidth = 1;
			// cookedData.cornerStyle = "line";
			cookedData.transparentCorners = true;
			cookedData.cornerColor = "hsl(141, 71%, 48%)";
			cookedData.hasRotatingPoint = false;
			// cookedData.hasControls = false
			cookedData.padding = 3;
			cookedData.borderDashArray = [3, 3];
			cookedData.borderColor = "green";

			const dis = this;
			//const canvas = this.upperCanvas;
			let contentToAdd;
			// let contentToAddOptions;

			const pointer = event.touches
				? this.upperCanvas.getPointer(event.touches[0])
				: this.upperCanvas.getPointer(event);

			if (this.lineDrawing) {
				this.handleLineDrawing(cookedData, fabricObj, pointer);
			} else if (this.highLightDrawing) {
				this.handleHighlightDrawing(cookedData, fabricObj, pointer);
			} else if (dis.elementType === 1 /** CHECK_MARK */) {
				// Checkmark
				cookedData.id = new Date().getTime();
				cookedData.left = dis.upperCanvas.getPointer(event).x - 8;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 16.382;
				// cookedData
				fabric.loadSVGFromString(
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.737 16.382"><defs><style>.a{fill:none;stroke:#363636;stroke-width:5px;}</style></defs><path class="a" d="M2.314,7.071l7.131,7.3,5.15-5.458,7.292-7.729" transform="translate(-1.241 -0.155)"/></svg>',
					(objects, options) => {
						const shape = fabric.util.groupSVGElements(objects, options);
						shape.set(cookedData);
						// canvas.add(shape);
						// canvas.calcOffset();
						dis.saveMods(cookedData);
						// dis.elementType = 0;
					}
				);
			} else if (dis.elementType === 2) {
				// Cross
				cookedData.id = new Date().getTime();
				cookedData.typeOfItem = "text";
				cookedData.fill = "#000";
				cookedData.fontSize = 25;
				cookedData.selectable = true;
				cookedData.left = dis.upperCanvas.getPointer(event).x - 3;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 24;
				contentToAdd = new fabric.IText("X", cookedData);
				// dis.saveMods(cookedData, dis.fetchDate());
				// dis.elementType = 0;
				fabricObj.add(contentToAdd);
				// this.upperCanvas.setActiveObject(contentToAdd);
			} else if (dis.elementType === 3) {
				// Bullet
				cookedData.id = new Date().getTime();
				cookedData.radius = 10;
				cookedData.stroke = "#000000";
				cookedData.strokeWidth = 1;
				cookedData.fill = "black";
				cookedData.left = dis.upperCanvas.getPointer(event).x - 9;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 10;
				contentToAdd = new fabric.Circle(cookedData);
				dis.saveMods(cookedData);
				fabricObj.add(contentToAdd);
			} else if (dis.elementType === 5) {
				// Date
				// cookedData
				cookedData.id = new Date().getTime();
				cookedData.typeOfItem = "text";
				cookedData.fill = "#000";
				cookedData.fontSize = 24;
				cookedData.selectable = true;
				cookedData.left = dis.upperCanvas.getPointer(event).x - 3;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 24;
				contentToAdd = new fabric.IText(dis.fetchDate(), cookedData);
				dis.saveMods(cookedData, dis.fetchDate());
				// dis.elementType = 0;
				fabricObj.add(contentToAdd);
				// this.upperCanvas.setActiveObject(contentToAdd);
			} else if (dis.elementType === 6) {
				// Text
				cookedData.elementType = 6;
				cookedData.id = new Date().getTime();
				cookedData.typeOfItem = "text";
				cookedData.fill = "#000";
				cookedData.fontSize = 25;
				cookedData.fontFamily = "arial";
				cookedData.selectable = true;
				cookedData.left = dis.upperCanvas.getPointer(event).x;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 26;
				// cookedData.selected = true;

				cookedData.originX = "left";
				contentToAdd = new fabric.IText("", cookedData);
				fabricObj.add(contentToAdd).setActiveObject(contentToAdd);
				// dis.opteion(event, fabricObj);
				contentToAdd.enterEditing();

				// this.upperCanvas.on("text:editing:exited", e => {
				//    dis.saveMods(cookedData, e.target.text);
				//    let obj = JSON.parse(JSON.stringify(fabricObj.getObjects()));
				//    this.setFabricCanvas({
				//       fabArray: strObj,
				//       pageNumber: this.pageNumber
				//    });
				// });
			} else if (dis.elementType === 7) {
				// Name
				// cookedData
				if (dis.loggedIn) {
					cookedData.id = new Date().getTime();
					cookedData.typeOfItem = "text";
					cookedData.fill = "#000";
					cookedData.fontSize = 24;
					cookedData.selectable = true;
					cookedData.left = dis.upperCanvas.getPointer(event).x - 3;
					cookedData.top = dis.upperCanvas.getPointer(event).y - 24;
					contentToAdd = new fabric.IText(dis.computedName, cookedData);
					dis.saveMods(cookedData, dis.computedName);
					// dis.elementType = 0;
					fabricObj.add(contentToAdd);
				} else {
					dis.regModal = true;
				}
			} else if (dis.elementType === 8) {
				// signature
				cookedData.id = new Date().getTime();
				const imgElement = document.querySelector(".sig-img");
				cookedData.element = imgElement;
				cookedData.backgroundColor = "transparent";
				cookedData.left = dis.upperCanvas.getPointer(event).x - 5;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 88;
				contentToAdd = new fabric.Image(imgElement, cookedData);
				contentToAdd.scaleX = 0.5;
				contentToAdd.scaleY = 0.5;
				dis.saveMods(cookedData, imgElement.src);
				fabricObj.add(contentToAdd);
			} else if (dis.elementType === 9) {
				// Initials
				if (dis.loggedIn) {
					// cookedData
					cookedData.id = new Date().getTime();
					cookedData.typeOfItem = "text";
					cookedData.fill = "#000";
					cookedData.fontSize = 24;
					cookedData.selectable = true;
					cookedData.left = dis.upperCanvas.getPointer(event).x - 3;
					cookedData.top = dis.upperCanvas.getPointer(event).y - 24;
					contentToAdd = new fabric.IText(dis.computedInitial, cookedData);
					dis.saveMods(cookedData, dis.computedInitial);
					fabricObj.add(contentToAdd);
				} else {
					dis.regModal = true;
				}
			} else if (dis.elementType === 10) {
				// Circle
				cookedData.id = new Date().getTime();
				cookedData.radius = 20;
				cookedData.stroke = "#000000";
				cookedData.strokeWidth = 1;
				cookedData.fill = "transparent";
				cookedData.left = dis.upperCanvas.getPointer(event).x - 18;
				cookedData.top = dis.upperCanvas.getPointer(event).y - 20;
				contentToAdd = new fabric.Circle(cookedData);
				dis.saveMods(cookedData);
				fabricObj.add(contentToAdd);
			} else if (dis.elementType === 12) {
				dis.lineDrawing = true;
				// Line
				var points = [dis.mouseX, dis.mouseY, pointer.x, pointer.y];
				const i = new Date().getTime();
				cookedData.id = i;
				dis.lastElementCoockedID = i;
				cookedData.stroke = "#000000";
				cookedData.fill = "#000000";
				cookedData.padding = 3;
				cookedData.strokeWidth = 8;
				cookedData.left = pointer.x < dis.mouseX ? pointer.x : dis.mouseX;
				cookedData.top =
					pointer.y < dis.mouseY ? pointer.y - 3 : dis.mouseY - 3;
				cookedData.lockScalingY = true;
				contentToAdd = new fabric.Line(points, cookedData);
				dis.lastActiveLineObj = contentToAdd;
				dis.saveMods(cookedData);
				fabricObj.add(contentToAdd);
			} else if (dis.elementType === 14) {
				// Highlight
				dis.highLightDrawing = true;
				const i = new Date().getTime();
				cookedData.id = i;
				dis.lastElementCoockedID = i;
				cookedData.width = Math.abs(pointer.x - dis.mouseX);
				cookedData.height = 20;
				cookedData.fill = "#d4d40096";
				cookedData.left = pointer.x < dis.mouseX ? pointer.x : dis.mouseX;
				cookedData.top =
					pointer.y < dis.mouseY ? pointer.y - 9 : dis.mouseY - 9;
				contentToAdd = new fabric.Rect(cookedData);
				dis.lastActiveLineObj = contentToAdd;
				dis.saveMods(cookedData);
				fabricObj.add(contentToAdd);
			}

			this.resize(this.upperCanvas);
		},
		showContextMenu({ etTop, etLeft }) {
			// ** Uncomment if .canvas-sizer is not relative
			// let container = this.canvasSizer.firstElementChild;
			// let { left, top } = container.getBoundingClientRect();
			// Assigning position of context menu

			console.log(this.lastSelectedObj.top, this.lastSelectedObj.left);

			console.log(etTop, etLeft, this.scale);

			this.objActionMenuLeft = etLeft; // ** +left
			this.objActionMenuTop = etTop - 32; // ** +top

			// showing context menu
			this.objActionMenu = true;
		},
		opteion(event, /*fab*/) {
			// if (!event.e) return;
			if (this.upperCanvas.getActiveObject()) {
				// this.canvasSizer.style.overflow = "hidden";
				this.lastSelectedObj = this.upperCanvas.getActiveObject();
				this.objSelected = true;

				this.showContextMenu({
					etTop: event.target ? event.target.top : 0,
					etLeft: event.target ? event.target.left : 0
				});

				// const activeItem = this.upperCanvas.getActiveObject();
				// const objs = this.upperCanvas.getObjects();
				// let strObj = JSON.stringify(objs);
				// strObj = JSON.parse(strObj);
			}
			//else {
			// this.canvasSizer.style.overflow = "scroll";
			//}
		},
		setOldModifications() {
			let hone;
			// const dis = this;
			const canvas = this.upperCanvas;
			const fabric = this.fabricObj;
			const pag = this.pageNumber;
			const current = this.mods.filter(e => e.page === pag);
			if (current.length > 0) {
				for (let i = 0; i < current.length; i++) {
					hone = current[i];

					var { cookedData } = hone;
					cookedData.cornerSize = 12;
					cookedData.selectionLineWidth = 5;
					cookedData.cornerStyle = "circle";
					cookedData.transparentCorners = false;
					cookedData.cornerColor = "hsl(141, 71%, 48%)";
					var contentToAdd;
					if (hone.elementType === 1) {
						// Checkmark
						// cookedData
						cookedData.padding = 10;
						fabric.loadSVGFromString(
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.737 16.382"><defs><style>.a{fill:none;stroke:#363636;stroke-width:3px;}</style></defs><path class="a" d="M2.314,7.071l7.131,7.3,5.15-5.458,7.292-7.729" transform="translate(-1.241 -0.155)"/></svg>',
							(objects, options) => {
								const shape = fabric.util.groupSVGElements(
									objects,
									options
								);
								shape.set(cookedData);

								canvas.add(shape);
								canvas.setActiveObject(shape);
								canvas.calcOffset();
							}
						);
					} else if (hone.elementType === 2) {
						// Cross

						// cookedData
						cookedData.padding = 10;
						fabric.loadSVGFromString(
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 24"><defs><style>.a{fill:#363636;font-size:18px;font-family:SegoeUI-Bold, Segoe UI;font-weight:700;letter-spacing:0.03em;}</style></defs><text class="a" transform="translate(6 19)"><tspan x="-5.897" y="0">X</tspan></text></svg>',
							(objects, options) => {
								const shape = fabric.util.groupSVGElements(
									objects,
									options
								);
								shape.set(cookedData);

								canvas.add(shape);
								canvas.setActiveObject(shape);
								canvas.calcOffset();
							}
						);
					} else if (hone.elementType === 3) {
						// Bullet
						cookedData.padding = 10;
						fabric.loadSVGFromString(
							'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><defs><style>.a{fill:#fff;stroke:#363636;stroke-width:2px;}.b{fill:#363636;}.c{stroke:none;}.d{fill:none;}</style></defs><g transform="translate(-790 -628)"><g class="a" transform="translate(790 628)"><circle class="c" cx="10" cy="10" r="10"/><circle class="d" cx="10" cy="10" r="9"/></g><circle class="b" cx="5" cy="5" r="5" transform="translate(795 633)"/></g></svg>',
							(objects, options) => {
								const shape = fabric.util.groupSVGElements(
									objects,
									options
								);
								shape.set(cookedData);

								canvas.add(shape);
								canvas.setActiveObject(shape);
								canvas.calcOffset();
							}
						);
					} else if (hone.elementType === 4) {
						// Highlight
					} else if (hone.elementType === 5) {
						// Date
						cookedData.padding = 10;
						cookedData.fill = "#000";
						cookedData.fontSize = 24;
						cookedData.selectable = true;
						contentToAdd = new fabric.IText(
							hone.elementValue || "12/19/2018",
							cookedData
						);
					} else if (hone.elementType === 6) {
						// Text
						cookedData.padding = 10;
						cookedData.fill = "#000";
						cookedData.fontSize = 24;
						cookedData.selectable = true;
						contentToAdd = new fabric.IText(
							hone.elementValue,
							cookedData
						);
					} else if (hone.elementType === 7) {
						// Name
						cookedData.padding = 10;
						cookedData.fill = "#000";
						cookedData.fontSize = 24;
						cookedData.selectable = true;
						contentToAdd = new fabric.IText(
							hone.elementValue || "Your Name",
							cookedData
						);
					} else if (hone.elementType === 8) {
						// signature
						cookedData.padding = 5;
						fabric.Image.fromURL(
							hone.elementValue,
							img => {
								canvas.add(img);
								canvas.setActiveObject(img);
								canvas.renderAll();
							},
							cookedData
						);
					} else if (hone.elementType === 9) {
						// Name
						cookedData.padding = 10;
						cookedData.fill = "#000";
						cookedData.fontSize = 28;
						cookedData.selectable = true;
						contentToAdd = new fabric.IText(
							hone.elementValue || "Your Initials",
							cookedData
						);
					} else if (hone.elementType === 10) {
						// circle
						cookedData.padding = 10;
						contentToAdd = new fabric.Circle(cookedData);
					} else if (hone.elementType === 11) {
						// small Circle
						cookedData.padding = 10;
						contentToAdd = new fabric.Circle(cookedData);
					} else if (hone.elementType === 12) {
						cookedData.padding = 10;
						cookedData.lockScalingY = true;
						contentToAdd = new fabric.Line(
							hone.cookedData.points,
							cookedData
						);
					} else if (hone.elementType === 13) {
						// Whitening
						cookedData.padding = 10;
						contentToAdd = new fabric.Rect(cookedData);
					} else if (hone.elementType === 14) {
						// Highlight
						cookedData.padding = 10;
						contentToAdd = new fabric.Rect(cookedData);
					}
					if (contentToAdd) {
						this.canvis[this.currentPage].add(contentToAdd);
						this.canvis[this.currentPage].setActiveObject(contentToAdd);
					}
				}
			}
		}
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