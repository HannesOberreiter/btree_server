<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { useVModels } from '@vueuse/core';
import { isEmpty, some } from 'lodash-es';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { formCheckMultipleValues } from '../helpers';
import { integer, maxValue, minValue } from '../helpers/i18n-validators';
import { useFieldsettingStore } from '../stores/fieldsetting';
import BtnBase from './BtnBase.vue';
import BtnMultipleValues from './BtnMultipleValues.vue';

const props = defineProps({
	modelValue: {
		default: {
			broodframes: 0 as number | null,
			honeyframes: 0 as number | null,
			foundation: 0 as number | null,
			emptyframes: 0 as number | null,
		},
	},
	reset: {
		type: Number,
		default: 0,
	},
	values: {
		type: Object,
		default: null,
	},
});
const emit = defineEmits(['update:modelValue']);
const fields = useFieldsettingStore();
const expanded = ref(false);
const max = ref(10);
const { modelValue } = useVModels(props, emit);
const resetValue = { ...unref(modelValue.value) };
const { values, reset } = toRefs(props);
const multipleValues = computed(() => {
	return {
		broodframes: formCheckMultipleValues(values.value, 'broodframes'),
		honeyframes: formCheckMultipleValues(values.value, 'honeyframes'),
		foundation: formCheckMultipleValues(values.value, 'foundation'),
		emptyframes: formCheckMultipleValues(values.value, 'emptyframes'),
	};
});
const disable = ref({ ...unref(multipleValues.value) });

const rules = {
	broodframes: {
		minValue: minValue(-100),
		maxValue: maxValue(100),
		integer,
	},
	honeyframes: {
		minValue: minValue(-100),
		maxValue: maxValue(100),
		integer,
	},
	foundation: {
		minValue: minValue(-100),
		maxValue: maxValue(100),
		integer,
	},
	emptyframes: {
		minValue: minValue(-100),
		maxValue: maxValue(100),
		integer,
	},
};

const v = useVuelidate(rules, modelValue, { $autoDirty: true });

watch(values, () => {
	setValues();
});

watch(reset, () => {
	setValues();
});

function setValues() {
	disable.value = { ...unref(multipleValues.value) };
	for (const [key, value] of Object.entries(multipleValues.value)) {
		if (value) {
			editValues(true, key);
		}
		else if (values.value && !isEmpty(values.value)) {
			modelValue.value[key as keyof typeof modelValue.value]
				= values.value[0][key];
		}
		else {
			modelValue.value[key as keyof typeof modelValue.value]
				= resetValue[key as keyof typeof resetValue];
		}
	}
}

function editValues(val: boolean, key: string) {
	disable.value[key as keyof typeof disable.value] = val;
	modelValue.value[key as keyof typeof modelValue.value] = val
		? null
		: resetValue[key as keyof typeof resetValue];
}
</script>

<template>
	<div class="row q-pb-sm">
		<q-expansion-item
			v-model="expanded"
			icon="fas fa-window-maximize"
			class="full-width"
			:label="$t('frames.text')"
			:class="
				some(modelValue, (val) => val != null && val > 0) ? 'bg-orange' : ''
			"
		>
			<q-card>
				<q-card-section>
					<template v-for="(_value, index) of modelValue" :key="index">
						<div
							v-if="fields.settings.checkup.frame[index]"
							class="row q-pb-xs"
						>
							<div class="col-4">
								{{ $t(`frames.${index}`) }}
							</div>
							<div class="col-8">
								<q-slider
									v-model="modelValue[index]"
									:error="v[index].$error"
									:step="1"
									:min="max * -1"
									:max="max"
									:disable="disable[index]"
									size="sm"
								/>
								{{ modelValue[index] }}
								<BtnMultipleValues
									v-if="multipleValues[index]"
									:disable="disable[index]"
									@click="editValues(!disable[index], index)"
								/>
							</div>
						</div>
					</template>
					<div class="row q-pb-xs">
						<div class="col-12">
							<BtnBase
								outline
								size="sm"
								class="float-right"
								@click="max = max + 10"
							>
								{{ $t('frames.extend') }} ({{ $t('max') }}: {{ max }})
							</BtnBase>
							<BtnBase
								outline
								size="sm"
								class="float-right"
								no-caps
								@click="max = 10"
							>
								{{ $t('reset') }}
							</BtnBase>
						</div>
					</div>
				</q-card-section>
			</q-card>
		</q-expansion-item>
	</div>
</template>
