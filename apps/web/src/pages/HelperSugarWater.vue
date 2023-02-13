<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('sugarwater') }}
        </div>
      </div>
      <div class="col-12 col-md-8 col-lg-4">
        <q-form>
          <q-select v-model="type" :options="options"></q-select>
          <q-input
            v-model.number="sugar"
            :label="$t('sugarHelper.sugar')"
            type="number"
            min="0"
            @change="changeUser('sugar')"
          ></q-input>
          <q-input
            v-model.number="water"
            type="number"
            min="0"
            :label="$t('sugarHelper.water')"
            @change="changeUser('water')"
          ></q-input>
          <q-input
            v-model.number="solution"
            :readonly="true"
            :label="$t('sugarHelper.solution')"
          ></q-input>
          <q-input
            v-model.number="calculatedTheoretical"
            :label="$t('sugarHelper.theoretical')"
            :readonly="true"
            :hint="$t('sugarHelper.hintStored')"
          ></q-input>
          <btn-base-group class="q-pt-lg">
            <btn-base
              :label="$t('calculate')"
              color="positive"
              @click="calculate"
            ></btn-base>
            <btn-base
              :label="$t('reset')"
              color="negative"
              @click="resetForm"
            ></btn-base>
          </btn-base-group>
        </q-form>
        <div class="text-caption q-pt-sm q-pb-sm">
          {{ $t('sugarHelper.source') }}
        </div>
      </div>
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section class="q-pa-xs">
            <q-tabs
              v-model="activeTab"
              dense
              active-color="secondary"
              indicator-color="secondary"
              align="justify"
              narrow-indicator
            >
              <q-tab
                no-caps
                name="oneToOne"
                :label="$t('sugarHelper.oneToOne')"
              />
              <q-tab
                no-caps
                name="threeToTwo"
                :label="$t('sugarHelper.threeToTwo')"
              />
            </q-tabs>
            <q-tab-panels v-model="activeTab" animated>
              <q-tab-panel name="oneToOne" class="q-pa-xs">
                <q-markup-table dense separator="none">
                  <thead class="text-right bg-info">
                    <tr>
                      <th>{{ $t('sugarHelper.sugar') }}</th>
                      <th>{{ $t('sugarHelper.water') }}</th>
                      <th>{{ $t('sugarHelper.solution') }}</th>
                      <th>{{ $t('sugarHelper.theoretical') }}</th>
                      <th>{{ $t('sugarHelper.stored') }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-right">
                    <tr v-for="(n, index) in 20" :key="n">
                      <td>{{ n }}</td>
                      <td>{{ n * oneToOne.water }}</td>
                      <td>
                        {{
                          (
                            (n + n * oneToOne.water) *
                            oneToOne.solution
                          ).toFixed(1)
                        }}
                      </td>
                      <td>
                        {{ (n * theoretical).toFixed(1) }}
                      </td>
                      <td>{{ practical[index] }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="text-right bg-info">
                    <tr>
                      <th>{{ $t('sugarHelper.sugar') }}</th>
                      <th>{{ $t('sugarHelper.water') }}</th>
                      <th>{{ $t('sugarHelper.solution') }}</th>
                      <th>{{ $t('sugarHelper.theoretical') }}</th>
                      <th>{{ $t('sugarHelper.stored') }}</th>
                    </tr>
                  </tfoot>
                </q-markup-table>
              </q-tab-panel>
              <q-tab-panel name="threeToTwo" class="q-pa-xs">
                <q-markup-table dense separator="none">
                  <thead class="text-right bg-warning">
                    <tr>
                      <th>{{ $t('sugarHelper.sugar') }}</th>
                      <th>{{ $t('sugarHelper.water') }}</th>
                      <th>{{ $t('sugarHelper.solution') }}</th>
                      <th>{{ $t('sugarHelper.theoretical') }}</th>
                      <th>{{ $t('sugarHelper.stored') }}</th>
                    </tr>
                  </thead>
                  <tbody class="text-right">
                    <tr v-for="(n, index) in 20" :key="n">
                      <td>{{ n }}</td>
                      <td>{{ (n * threeToTwo.water).toFixed(1) }}</td>
                      <td>
                        {{
                          (
                            (n + n * threeToTwo.water) *
                            threeToTwo.solution
                          ).toFixed(1)
                        }}
                      </td>
                      <td>
                        {{ (n * theoretical).toFixed(1) }}
                      </td>
                      <td>{{ practical[index] }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="text-right bg-warning">
                    <tr>
                      <th>{{ $t('sugarHelper.sugar') }}</th>
                      <th>{{ $t('sugarHelper.water') }}</th>
                      <th>{{ $t('sugarHelper.solution') }}</th>
                      <th>{{ $t('sugarHelper.theoretical') }}</th>
                      <th>{{ $t('sugarHelper.stored') }}</th>
                    </tr>
                  </tfoot>
                </q-markup-table>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-card>
</template>

<script lang="ts">
const oneToOne = {
  water: 1,
  solution: 0.8,
};

const theoretical = 1.2;
const practical = [
  1.0, 1.9, 2.9, 3.8, 4.8, 5.8, 6.7, 7.7, 8.6, 9.6, 10.6, 11.5, 12.5, 13.4,
  14.4, 15.4, 16.3, 17.3, 18.2, 19.2,
];

const threeToTwo = {
  water: 0.667,
  solution: 0.76,
};
</script>

<script setup lang="ts">
import round from 'lodash-es/round';

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const options = [
  {
    label: t('sugarHelper.oneToOne'),
    value: 1,
  },
  {
    label: t('sugarHelper.threeToTwo'),
    value: 2,
  },
];
const type = ref(options[0]);
const activeTab = ref('oneToOne');
const sugar = ref(0);
const water = ref(0);
const solution = ref(0);
const calculatedTheoretical = ref(0);

watch(type, () => calculate());

function changeUser(field: string) {
  if (field === 'water') {
    sugar.value = 0;
    calculate();
  } else if (field === 'sugar') {
    water.value = 0;
    calculate();
  }
}

function calculate() {
  const base = type.value.value === 1 ? oneToOne : threeToTwo;
  if (sugar.value > 0) {
    water.value = round(sugar.value * base.water, 1);
  } else if (water.value > 0) {
    sugar.value = round(water.value / base.water, 1);
  }
  solution.value = round((sugar.value + water.value) * base.solution, 1);
  calculatedTheoretical.value = round(sugar.value * theoretical, 1);
}

function resetForm() {
  sugar.value = 0;
  water.value = 0;
  solution.value = 0;
  calculatedTheoretical.value = 0;
}
</script>
