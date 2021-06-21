<template>
	<v-app class="app">
		<v-app-bar app dark color="primary">
			<div class="d-flex align-center">PDF Annotation</div>
			<v-spacer />
		</v-app-bar>

		<v-main>
			<router-view class="app__router-view" />
		</v-main>
	</v-app>
</template>

<script>

export default {
	name: 'App',
	data: () => ({
		//
	}),
};
</script>
<style lang="scss">
	// .flex-none {
	// 	flex: none;
	// }
	.flex-1 {
		flex: 1;
	}
	// .h-full {
	// 	height: 100%;
	// }
	// .app {
	// 	&__sidebar {
	// 		height: 100%;
	// 	}
	// 	&__router-view {
	// 		flex: 1;
	// 		overflow-y: auto;
	// 		height: calc(100vh - 64px);
	// 	}
	// }
</style>