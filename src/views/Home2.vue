<template>
	<div id="pdfviewer" class="py-8">
		<pdf
			:id="i"
			:key="i"
			:page="i"
			:text="false"
			:src="pdfdata"
			:annotation="true"
			:scale.sync="scale"
			v-for="i in numPages"
			@annotations="listAnnotations"
		/>
		<v-container v-if="isLoading" fill-height>
			<v-progress-circular
				:size="50"
				color="primary"
				class="mx-auto"
				indeterminate
			/>
		</v-container>
	</div>
</template>
<script>

import PdfViewer from '../components/PdfViewer'

export default {
	components: {
		pdf: PdfViewer
	},
	data() {
		return {
			el: null,
			pdfdata: null,

			isLoading: false,

			page: 1,
			scale: 1,
			maxScale: 2,
			minScale: 0.1,
			numPages: 0,

			transform: {},

			pages: [],
			tempAnnotations: [],
			annotationsLayer: [],
		}
	},
	created() {
		let scale = window.innerWidth / 100 / 16
		this.scale = scale > 0.9 ? scale : 0.9
		this.handleWindowResize()
	},
	async mounted() {
		this.isLoading = true
		this.getPdf()
		this.el = document.getElementById('pdfviewer')
	},
	computed: {
		formattedZoom() {
			return Number.parseInt(this.scale * 100)
		},
		mobileScreen() {
			return window.innerWidth <= 768 ? true : false
		},
	},
	watch: {
		page(p) {
			if (
				window.pageYOffset <= this.findPos(document.getElementById(p)) ||
				(document.getElementById(p + 1) &&
					window.pageYOffset >= this.findPos(document.getElementById(p + 1)))
			) {
				document.getElementById(p).scrollIntoView()
			}
		},
	},
	filters: {
		pretty: function (value) {
			return JSON.stringify(value, null, 2)
		},
	},
	methods: {
		handleWindowResize() {
			window.onresize = e => {
				let scale = e.target.innerWidth / 100 / 10
				if (scale <= this.maxScale && scale >= this.minScale) {
					this.setScale(scale)
				}
			}
		},
		listAnnotations(data, page) {
			this.tempAnnotations.push(data)
			this.pages = this.pages.concat(page)

			if (this.numPages && this.numPages === data.page) {
				this.annotationsLayer = this.tempAnnotations
				this.isLoading = false
			}
		},
		setScale(scale) {
			this.scale = scale
		},
		findPos: el => el ? el.offsetTop : null,
		getPdf() {

			this.pdfdata = PdfViewer.createLoadingTask('./pdf/employee.form.pdf')
			this.pdfdata.then(pdf => {
				this.numPages = pdf.numPages
				window.onscroll = () => {
					let i = 1, count = Number(pdf.numPages)
					let scale = this.scale
					do {
						scale = this.mobileScreen
							? this.transform.scale
								? this.transform.scale
								: this.scale
							: 1
						if (
							window.pageYOffset >= this.findPos(document.getElementById(i)) * scale &&
							window.pageYOffset <= this.findPos(document.getElementById(i + 1)) * scale
						) {
							this.page = i
						}
						i++
					} while (i < count)

					if (window.pageYOffset >= this.findPos(document.getElementById(i)) * scale) {
						this.page = i
					}
					this.isLoading = false
				}
			})
		},
	},
}
</script>
<style lang='scss'>
	#pdfviewer {
		position: relative;
		background-color: #212121;
		min-height: calc(100vh - 64px);
		.annotationLayer {
			.textWidgetAnnotation input,
			.textWidgetAnnotation textarea,
			.choiceWidgetAnnotation select,
			.buttonWidgetAnnotation.checkBox input,
			.buttonWidgetAnnotation.radioButton input {
				background-color: rgba(245, 239, 68, 0.13);
				border: 1px solid rgb(211, 206, 52);
				font-size: 9px;
			}
		}
		.page {
			margin: 0 auto;
			position: relative;
			box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
				0px 1px 1px 0px rgba(0, 0, 0, 0.14),
				0px 1px 3px 0px rgba(0, 0, 0, 0.12) !important;
		}
		& > div:not(:first-child) {
			margin-top: 2rem;
		}
	}
</style>
