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
						<v-btn dark block depressed color="teal" @click="dialogs.rect = true">Add Rect</v-btn>
						<v-btn dark block depressed color="primary" @click="handleDownload" class="mt-3">download</v-btn>
					</div>
				</div>
			</v-navigation-drawer>
		</div>
		<div class="overflow-y-auto h-screen-eh flex-1">
			<v-container class="py-8">
				<div v-if="!loaded" class="text-center">
					<v-progress-circular size="64" width="6" indeterminate color="primary" />
				</div>
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
		<v-dialog v-model="dialogs.rect" max-width="500">
			<v-card>
				<v-card-title>Add Rectangle</v-card-title>
				<v-card-text>
					<v-form @submit.prevent>
						<v-container fluid>
							<v-row>
								<v-col cols="6">
									<v-text-field v-bind="attrs.dialog.rect" label="Page" v-model="rect.page" />
								</v-col>
								<v-col cols="6">
									<v-text-field v-bind="attrs.dialog.rect" label="Border Width" v-model="rect.strokeWidth" />
								</v-col>
								<v-col cols="3">
									<v-text-field v-bind="attrs.dialog.rect" label="X1" v-model="rect.rect[0]" />
								</v-col>
								<v-col cols="3">
									<v-text-field v-bind="attrs.dialog.rect" label="Y1" v-model="rect.rect[1]" />
								</v-col>
								<v-col cols="3">
									<v-text-field v-bind="attrs.dialog.rect" label="X2" v-model="rect.rect[2]" />
								</v-col>
								<v-col cols="3">
									<v-text-field v-bind="attrs.dialog.rect" label="Y2" v-model="rect.rect[3]" />
								</v-col>
								<v-col cols="6" class="relative">
									<v-text-field v-bind="attrs.dialog.rect" label="Border Color" v-model="rect.stroke" />
									<div class="color-box" :style="{ backgroundColor: rect.stroke }"></div>
								</v-col>
								<v-col cols="6" class="relative">
									<v-text-field v-bind="attrs.dialog.rect" label="Background Color" v-model="rect.fill" />
									<div class="color-box" :style="{ backgroundColor: rect.fill }"></div>
								</v-col>
								<v-col cols="12">
									<v-btn block depressed color="primary" @click="handleDrawRect">Draw</v-btn>
								</v-col>
							</v-row>
						</v-container>
					</v-form>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import { _TOOLS } from '../consts'

// PDFJS
import PDF from "pdfjs-dist/build/pdf";
import "pdfjs-dist/web/pdf_viewer.css";
PDF.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.entry";

// ANNOTPDF
import { AnnotationFactory } from 'annotpdf';

// COMPONENTS
import PDFPage from '@/components/PDFPage'

const initialRect = () => ({
	page: 0,
	strokeWidth: 1,
	rect: ['', '', '', ''],
	stroke: 'rgba(0, 0, 0, 1)',
	fill: "rgba(0, 0, 0, 0)"
})

export default {
	name: 'Home',
	components: {
		PDFPage
	},
	data: () => ({
		pdf: null,
		pdfFactory: null,
		loaded: false,
		scale: 1.5,
		pdfPages: [],
		count: {
			pages: 0
		},
		rect: initialRect(),
		dialogs: {
			rect: false,
		},
		attrs: {
			dialog: {
				rect: {
					dense: true,
					outlined: true,
					hideDetails: true
				}
			}
		},
		activetool: null,
		tools: [
			{
				label: 'Rectangle',
				type: _TOOLS.RECT,
				icon: 'mdi-checkbox-blank-outline'
			},
			{
				label: 'Highlight',
				type: _TOOLS.HIGHLIGHT,
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
		catch (error) { console.log('Error:', error.message) }
		this.loaded = true
	},
	methods: {
		handleDrawRect() {
			this.$emit('draw', this.rect)
		},
		handleDownload() {
			this.pdfFactory.download()
		},
		async handleAnnotate({ type, data }) {
			this.pdfFactory[type](data)
		}
	}
}
</script>
<style lang="scss" scoped>
.color-box {
	top: 50%;
	right: 1rem;
	width: 2rem;
	height: 2rem;
	position: absolute;
	transform: translateY(-50%);
	border-radius: 2px;
}
</style>