<template>
	<div ref="container"></div>
</template>
<script>

import 'pdfjs-dist/web/pdf_viewer.css'
import pdfjsLib from 'pdfjs-dist/webpack.js'

import {

	PDFPageView,
	PDFLinkService,
	DefaultAnnotationLayerFactory,
	DefaultTextLayerFactory,

} from 'pdfjs-dist/web/pdf_viewer.js'


function isPDFDocumentLoadingTask(obj) {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		obj.__PDFDocumentLoadingTask === true
	)
}

function createLoadingTask(src, options) {
	const source = typeof src === 'string' ? { url: src } : src

	source.CMapReaderFactory = function () {
		this.fetch = query => {
			return import(`raw-loader!pdfjs-dist/cmaps/${query.name}.bcmap`).then(bcmap => ({
				cMapData: bcmap,
				compressionType: pdfjsLib.CMapCompressionType.BINARY,
			}))
		}
	}

	var loadingTask = pdfjsLib.getDocument(source)
	loadingTask.__PDFDocumentLoadingTask = true

	if (options && options.onPassword) loadingTask.onPassword = options.onPassword
	if (options && options.onProgress) loadingTask.onProgress = options.onProgress

	return loadingTask
}

export default {
	createLoadingTask,
	data() {
		return {
			pdf: null,
			pages: [],
			loading: true,
			pdfViewer: null,
			internalSrc: this.src,
		}
	},
	props: {
		src: {
			type: [String, Object],
			default: '',
		},
		page: {
			type: Number,
			default: 1,
		},
		rotate: {
			type: Number,
			default: 0,
		},
		scale: {
			type: [Number, String],
			default: 0.8,
		},
		resize: {
			type: Boolean,
			default: false,
		},
		annotation: {
			type: Boolean,
			default: false,
		},
		text: {
			type: Boolean,
			default: true,
		},
	},
	watch: {
		pdf(val) {
			this.$emit('numpages', val.pdfInfo || val._pdfInfo)
		},
		page(val) {
			this.pdf.getPage(val).then(pdfPage => {
				this.pdfViewer.setPdfPage(pdfPage)
				this.pdfViewer.draw()
			})
		},
		scale(val) {
			this.drawScaled(val)
		},
		rotate(newRotate) {
			if (this.pdfViewer) {
				this.pdfViewer.update(this.scale, newRotate)
				this.pdfViewer.draw()
			}
		},
	},
	methods: {
		calculateScale(width = -1, height = -1) {
			this.pdfViewer.update(1, this.rotate)
			if (width === -1 && height === -1) {
				width = this.$refs.container.offsetWidth
				height = this.$refs.container.height
			}
			let pageWidthScale = (width / this.pdfViewer.viewport.width) * 1
			return pageWidthScale
		},
		drawScaled(newScale) {
			if (this.pdfViewer) {
				if (newScale === 'page-width') {
					newScale = this.calculateScale()
					this.$emit('update:scale', newScale)
				}
				this.pdfViewer.update(newScale, this.rotate)
				this.pdfViewer.draw()
				this.loading = false
				this.$emit('loading', false)
			}
		},
		resizeScale() {
			if (this.resize) {
				this.drawScaled('page-width')
			}
		},
	},
	mounted() {

		if (!isPDFDocumentLoadingTask(this.internalSrc)) {
			this.internalSrc = createLoadingTask(this.internalSrc)
			this.$emit('loading', true)
		}

		const pdfLinkService = new PDFLinkService()

		let annotationLayer = undefined,
			textLayer = undefined
		if (this.annotation) {
			annotationLayer = new DefaultAnnotationLayerFactory()
		}
		if (this.text) {
			textLayer = new DefaultTextLayerFactory()
		}

		this.internalSrc
			.then(pdfDocument => {
				this.pdf = pdfDocument
				return pdfDocument.getPage(this.page)
			})
			.then(pdfPage => {
				this.pdfViewer = new PDFPageView({
					container: this.$refs.container,
					id: this.page,
					scale: 1,
					defaultViewport: pdfPage.getViewport(1),
					textLayerFactory: textLayer,
					annotationLayerFactory: annotationLayer,
					renderInteractiveForms: true,
				})

				this.pages.push(this.pdfViewer.viewport)

				this.pdfViewer.setPdfPage(pdfPage)
				pdfLinkService.setViewer(this.pdfViewer)

				pdfPage.getAnnotations().then(annotations => {
					this.$emit('annotations', {
						page: this.page,
						annotations: annotations,
					}, this.pages)
				},
					reason => { console.error(reason) }
				)
				this.drawScaled(this.scale)
			})
			.catch(err => this.$emit('error', err))
	},
}
</script>
