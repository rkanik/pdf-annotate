<template>
	<v-app class="app">
		<v-app-bar app dark color="primary" class="elevation-1">
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
	name: 'App'
};
</script>