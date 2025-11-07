<script setup lang="ts">
import {
	LCircle,
	LCircleMarker,
	LFeatureGroup,
	LMap,
	LMarker,
	LPopup,
} from '@vue-leaflet/vue-leaflet';
import L from 'leaflet';
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BtnBase from '../components/BtnBase.vue';
import BtnBaseGroup from '../components/BtnBaseGroup.vue';
import DialogForm from '../components/DialogForm.vue';
import GlobalLoading from '../components/GlobalLoading.vue';
import MapButtons from '../components/MapButtons.vue';
import MapOverlay from '../components/MapOverlay.vue';
import { useApiFetch } from '../composables/useApi';

import { useNotification } from '../composables/useNotification';
import {
	useAfbQuery,
	useApiariesQuery,
	useInvalidateQueries,
} from '../composables/useQuery';

import { useAuthUserStore } from '../stores/auth';
import 'leaflet/dist/leaflet.css';

const icon = new L.Icon.Default() as any;
icon.options.shadowSize = [0, 0];

const api = useApiFetch();
const {
	isLoading,
	data: apiaries,
	refetch,
} = useApiariesQuery({ modus: null });
const {
	data: afbData,
} = useAfbQuery({ enabled: true });
const updateTimestamp = ref(String(new Date())); // helper to update layer

const { t } = useI18n();
const $q = useQuasar();
const userStore = useAuthUserStore();
const notification = useNotification();
const useInvalidate = useInvalidateQueries();

const zoom = computed(() => (isLoading.value ? 2 : 9));
const circleRadius = ref(1000);
const circleOpacity = 0.3;
const mapRef = ref(null as any);
const location = ref(null as any);
const userLocationLoading = ref(false);
const showInactive = ref(false);
const showAfb = ref(true); // AFB is enabled by default
let map = {} as any;
let dragObject = {} as any;

function onMapReady() {
	map = mapRef.value.leafletObject;
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.enable();
	map.on('dblclick', (e: any) => {
		createApiaryForm(e);
	});
}

function loadLocation() {
	userLocationLoading.value = true;
	map.locate();
}
function onLocationFound(e: any) {
	userLocationLoading.value = false;
	location.value = e;
	map.setView(location.value.latlng, 10);
}
function onLocationError() {
	userLocationLoading.value = false;
	notification.open('negative', 'locationError');
}

function createApiaryForm(e: any) {
	if (userStore.isAdmin) {
		$q.dialog({
			component: DialogForm,
			componentProps: {
				title: 'newApiary',
				form: 'apiary',
				latlng: e.latlng,
			},
		}).onOk((e) => {
			refetch().then(
				() => console.log(e),
				error => console.error(error),
			);
		});
	}
}
function editApiaryForm(e: any) {
	if (userStore.isAdmin) {
		$q.dialog({
			component: DialogForm,
			componentProps: {
				title: 'apiaryEdit',
				form: 'apiary',
				ids: [e],
			},
		}).onOk((e) => {
			refetch().then(
				() => console.log(e),
				error => console.error(error),
			);
		});
	}
}
function deleteApiary(value: string) {
	api.patch('/v1/apiary/batchDelete', { ids: [value] }).then(
		async (_response: any) => {
			useInvalidate.invalidate('apiary');
			// await refetch();
			notification.open('positive', '');
		},
		(error) => {
			notification.open('negative', error);
		},
	);
}
function moveApiaryStart(value: any) {
	dragObject = value;
	map.closePopup();
}
function moveApiaryEnd(e: any) {
	const data = JSON.stringify({
		ids: [dragObject.id],
		data: {
			latitude: e.target._latlng.lat,
			longitude: e.target._latlng.lng,
		},
	});
	$q.dialog({
		title: t('confirm'),
		message: t('map.move', { msg: dragObject.name }),
		cancel: true,
		persistent: true,
	})
		.onOk(() => {
			api.patch('/v1/apiary', data).then(
				async (_response: any) => {
					await refetch();
					notification.open('positive', '');
				},
				(error) => {
					updateTimestamp.value = String(new Date());
					notification.open('negative', error);
				},
			);
		})
		.onCancel(async () => {
			updateTimestamp.value = String(new Date());
		});
}
</script>

<template>
	<div class="row justify-center">
		<div v-if="isLoading" class="col-1">
			<GlobalLoading />
		</div>
		<div v-else class="col-12">
			<div class="map">
				<LMap
					ref="mapRef"
					:zoom="zoom"
					:center="apiaries.center"
					loading-control="true"
					@ready="onMapReady"
					@locationfound="onLocationFound"
					@locationerror="onLocationError"
				>
					<MapButtons
						v-model:model-radius="circleRadius"
						:user-location-loading="userLocationLoading"
						:is-apiary-map="true"
						@locate="loadLocation"
						@toggle="(v) => (showInactive = v)"
						@toggle-afb="(v) => (showAfb = v)"
					/>
					<MapOverlay />

					<LCircleMarker
						v-if="location"
						:lat-lng="location.latlng"
						color="black"
						:radius="location.accuracy ? location.accuracy : 50"
					/>
					<LFeatureGroup v-if="apiaries" :key="updateTimestamp">
						<template v-for="value in apiaries.results" :key="value.id">
							<LCircle
								v-if="value.modus || showInactive"
								:lat-lng="[value.latitude, value.longitude]"
								:radius="circleRadius"
								:fill="true"
								:color="value.modus ? 'green' : 'red'"
								:fill-opacity="circleOpacity"
							/>
							<LMarker
								v-if="value.modus || showInactive"
								:options="{ alt: value.name }"
								:lat-lng="[value.latitude, value.longitude]"
								:draggable="true"
								:icon="icon"
								@dragstart="moveApiaryStart(value)"
								@dragend="moveApiaryEnd"
							>
								<LPopup>
									<div class="text-h6">
										<b>{{ value.name }}</b> [
										<span v-if="value.hive_count">{{
											value.hive_count.count + value.hive_count.grouphivescount
										}}</span>
										<span v-else>0</span>
										]
									</div>
									<div v-if="value.description" class="text-caption">
										{{ value.description }}
									</div>
									<div v-if="value.note">
										{{ value.note }}
									</div>
									<BtnBaseGroup
										v-if="userStore.isAdmin"
										class="q-mt-sm"
										size="sm"
									>
										<BtnBase
											color="secondary"
											@click="editApiaryForm(value.id)"
										>
											{{ t('edit') }}
										</BtnBase>
										<BtnBase
											v-if="!value.hive_count"
											color="negative"
											:data-cy="`btn-delete-${value.name}`"
											@click="deleteApiary(value.id)"
										>
											{{ t('delete') }}
										</BtnBase>
									</BtnBaseGroup>
								</LPopup>
							</LMarker>
						</template>
					</LFeatureGroup>

					<!-- AFB Quarantine Areas -->
					<LFeatureGroup v-if="afbData && showAfb" key="afb-areas">
						<template v-for="area in afbData" :key="area.id">
							<LCircle
								:lat-lng="area.gps"
								:radius="area.radius"
								:fill="true"
								color="red"
								fill-color="orange"
								:fill-opacity="0.2"
								:stroke-opacity="0.8"
								:weight="2"
							>
								<LPopup>
									<pre style="line-break: strict;" v-text="area.popup" />
								</LPopup>
							</LCircle>
						</template>
					</LFeatureGroup>
				</LMap>
			</div>
		</div>
	</div>
</template>

<style>
.map {
  height: 85vh;
}

.leaflet-top,
.leaflet-bottom {
  z-index: 900;
}
</style>
