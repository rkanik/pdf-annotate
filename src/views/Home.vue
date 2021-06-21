<template>
	<div class="grey darken-3 d-flex relative">
		<v-navigation-drawer>
			<div class="pa-4">
				<v-subheader>SHAPES</v-subheader>
				<div class="d-flex">
					<v-btn depressed height="64" class="rounded-0 flex-1">
						<v-icon>mdi-checkbox-blank-outline</v-icon>
					</v-btn>
					<v-btn depressed height="64" class="rounded-0 flex-1">
						<v-icon>mdi-checkbox-blank-circle-outline</v-icon>
					</v-btn>
				</div>
			</div>
		</v-navigation-drawer>
		<div class="overflow-y-auto">
			<v-container class="py-8">
				<PDFPage
					:key="pageNum"
					:elType="14"
					:loggedIn="true"
					:rootScale="scale"
					:pageNumber="pageNum"
					:pdfPage="pdfPages[pageNum - 1]"
					v-for="pageNum in count.pages"
				/>
			</v-container>
		</div>
	</div>
</template>

<script>

// PDFJS
import PDF from "pdfjs-dist/build/pdf";
PDF.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.entry";

// ANNOTPDF
import { AnnotationFactory, AnnotationIcon } from 'annotpdf';

// COMPONENTS
import PDFPage from '@/components/PDFPage'

export default {
	name: 'Home',
	components: {
		PDFPage
	},
	data: () => ({
		pdf: null,
		scale: 1.5,
		pdfPages: [],
		count: {
			pages: 0
		},
		tool: ''
	}),
	created() {



		console.log("FETCH", this.file)

		PDF.getDocument('./pdf/sample.daycare.form.pdf').promise.then(pdf => {

			console.log('pdfJs.getDocument', pdf)
			console.log("PDF", pdf)

			pdf.getData().then((data) => {
				let pdfFactory = new AnnotationFactory(data)
				console.log('AnnotationFactory', pdfFactory)



				// pdfFactory.createTextAnnotation({
				// 	page: 1,
				// 	rect: [100, 100, 200, 200],
				// 	contents: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
				// 	author: "RK ANIK"
				// })

				pdfFactory.createStrikeOutAnnotation({
					page: 1,
					rect: [100, 100, 200, 200],
					contents: "Test123",
					author: "John",
					color: { r: 128, g: 128, b: 128 },
					opacity: 0.5
				})

				pdfFactory.createPolygonAnnotation({
					page: 1,
					rect: [100, 100, 200, 200],
					contents: "Lorem Ipsum",
					author: "RK ANIK",
					vertices: [
						100, 100, 400, 100, 400, 400, 100, 400
					],
					color: { r: 0, g: 0, b: 0 }
				})

				pdfFactory.createTextAnnotation({
					page: 1,
					rect: [50, 50, 80, 80],
					contents: "Pop up note",
					author: "Max",
					color: { r: 128, g: 128, b: 128 },
					open: false,
					icon: AnnotationIcon.Help,
					opacity: 0.5
				})



				this.pdf = pdfFactory.write();
				this.count.pages = pdf.numPages;
				for (let i = 1; i <= pdf.numPages; i++) {
					pdf.getPage(i).then(page => {
						this.pdfPages.push(page);
					});
					// if (i == pdf.numPages - 1) this.isLoading.fetchingPdf = false;
				}

				// pdfFactory.save()
				// pdfFactory.download()
			})


		}).catch(err => {
			console.log("PDF_FETCH_ERROR", err)
		})
	}
}
</script>
