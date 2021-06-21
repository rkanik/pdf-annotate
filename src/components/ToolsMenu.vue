<template>
	<div :style="{ top: top + 'px', left: left + 'px' }" class="actions">
		<!-- <img v-for="(action,index) in actionsToShow" :key="index" class="images" :src="action.image" @click="action.clickFunction" /> -->
		<img
			:src="actions[0].image"
			@click="actions[0].clickFunction"
			class="images"
		/>
		<div class="right-border" />
		<img
			:src="actions[1].image"
			@click="actions[1].clickFunction"
			class="images"
		/>
		<div class="right-border" />
		<span @click="clickOK" class="images bold-text">OK</span>
		<div class="right-border" />
		<img
			:src="actions[2].image"
			@click="actions[2].clickFunction"
			class="images"
		/>
	</div>
</template>

<script>
export default {
	name: 'ToolsMenu',
	props: ["left", "top", "lowercase", "uppercase", "delete"],
	data() {
		return {
			actions: [
				{
					image: require("@/assets/svg/lowercase.svg"),
					clickFunction: this.minus,
					willShow: this.lowercase
				},
				{
					image: require("@/assets/svg/uppercase.svg"),
					clickFunction: this.plus,
					willShow: this.uppercase
				},
				{
					image: require("@/assets/svg/delete.svg"),
					clickFunction: this.remove,
					willShow: this.delete
				}
			]
		};
	},
	computed: {
		actionsToShow() {
			return this.actions.filter(
				x => x.willShow === true && x.clickFunction != this.remove
			);
		}
	},
	methods: {
		minus() {
			this.$emit("smaller");
		},
		plus() {
			this.$emit("bigger");
		},
		remove() {
			this.$emit("remove");
		},
		clickOK() {
			this.$emit("ok");
		}
	}
};
</script>


<style scoped>
	.actions {
		background-color: #f4f5f8;
		width: max-content;
		height: 24px;
		position: absolute;
		z-index: 10;
		text-align: center;
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
	}

	.images {
		height: 24px;
		width: 24px;
		padding-left: 3px;
		padding-top: 3px;
		padding-bottom: 3px;
		cursor: pointer;
	}

	.right-border {
		border-right: 1px solid #4bf045;
		display: inline;
	}

	.bold-text {
		font-weight: bold;
		color: #47b843;
	}
</style>
