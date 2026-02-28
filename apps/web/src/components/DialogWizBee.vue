<script setup lang="ts">
import BtnCloseDialog from './BtnCloseDialog.vue';
import WizBeeChat from './WizBeeChat.vue';
</script>

<template>
	<q-dialog>
		<q-card class="dialog-wizbee">
			<q-card-section class="row items-center q-pb-none">
				<div class="row items-center q-gutter-x-sm">
					<img
						src="/wizbee/favicon-96x96.png"
						alt="WizBee"
						height="24"
						:class="{ 'invert-colors': $q.dark.isActive }"
					>
					<div class="text-h6">
						WizBee
					</div>
				</div>
				<q-space />
				<BtnCloseDialog />
			</q-card-section>
			<q-card-section class="dialog-wizbee__body q-pa-none">
				<WizBeeChat :show-usage="false" :show-examples="false" />
			</q-card-section>
		</q-card>
	</q-dialog>
</template>

<style scoped>
.dialog-wizbee {
  width: 700px;
  max-width: 95vw;
  height: 75vh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.dialog-wizbee__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.invert-colors {
  filter: grayscale(1) invert(1);
}
</style>
