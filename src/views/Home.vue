<template>
	<div class="grey darken-3 d-flex relative">
		<div>
			<v-navigation-drawer permanent>
				<div class="pa-4 h-screen-eh d-flex flex-column">
					<v-subheader>SHAPES</v-subheader>
					<div class="d-flex">
						<v-btn
							depressed
							height="64"
							:key="tool.type"
							v-for="tool in tools"
							class="rounded-0 flex-1"
							@click="activetool = tool.type"
							:color="tool.type === activetool ? 'primary' : 'white'"
						>
							<v-icon>{{ tool.icon }}</v-icon>
						</v-btn>
					</div>
					<div class="mt-auto">
						<v-btn block depressed color="primary" @click="handleDownload"
							>download</v-btn
						>
					</div>
				</div>
			</v-navigation-drawer>
		</div>
		<div class="overflow-y-auto h-screen-eh flex-1">
			<v-container class="py-8">
				<PDFPage
					:key="pageNum"
					:loggedIn="true"
					:rootScale="scale"
					:elType="activetool"
					:pageNumber="pageNum"
					:pdfPage="pdfPages[pageNum - 1]"
					@annotate="handleAnnotate"
					v-for="pageNum in count.pages"
				/>
			</v-container>
		</div>
	</div>
</template>

<script>

// PDFJS
import PDF from "pdfjs-dist/build/pdf";
import "pdfjs-dist/web/pdf_viewer.css";
PDF.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.entry";

// ANNOTPDF
import { AnnotationFactory } from 'annotpdf';

// COMPONENTS
import PDFPage from '@/components/PDFPage'

// DATA
const _toolTypes = {
	rect: 100,
	circle: 101,
	highlight: 102
}

export default {
	name: 'Home',
	components: {
		PDFPage
	},
	data: () => ({
		pdf: null,
		pdfFactory: null,
		scale: 1.5,
		pdfPages: [],
		count: {
			pages: 0
		},
		activetool: null,
		tools: [
			{
				label: 'Rectangle',
				type: _toolTypes.rect,
				icon: 'mdi-checkbox-blank-outline'
			},
			{
				label: 'Highlight',
				type: _toolTypes.highlight,
				icon: 'mdi-format-color-highlight'
			}
		]
	}),
	async created() {
		try {
			const pdf = await PDF.getDocument('./pdf/output.pdf').promise

			this.count.pages = pdf.numPages;
			for (let i = 1; i <= pdf.numPages; i++) {
				const page = await pdf.getPage(i);
				this.pdfPages.push(page);
			}

			console.log(await pdf.getData())
			this.pdfFactory = new AnnotationFactory(await pdf.getData())
			console.log(this.pdfFactory)

		}
		catch (error) {
			console.log('Error:', error.message)
		}

	},
	methods: {
		handleDownload() {
			this.pdfFactory.download()
		},
		async handleAnnotate({ type, data }) {
			this.pdfFactory[type](data)
		}
	}
}
</script>
