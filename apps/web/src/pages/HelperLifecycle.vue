<template>
  <q-card flat>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('lifecycle') }}
        </div>
      </div>
    </div>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-md-11 col-lg-6">
          <q-markup-table dense separator="none" class="text-body1" flat bordered>
            <thead class="bg-info text-right">
              <tr>
                <th>{{ $t('lifecycleHelper.caste') }}</th>
                <th>
                  {{ $t('lifecycleHelper.timeToLarvae') }} ({{ $t('day', 2) }})
                </th>
                <th>
                  {{ $t('lifecycleHelper.timeToCapped') }} ({{ $t('day', 2) }})
                </th>
                <th>
                  {{ $t('lifecycleHelper.timeToHatch') }} ({{ $t('day', 2) }})
                </th>
                <th>
                  {{ $t('lifecycleHelper.timeToTask') }} ({{ $t('day', 2) }})
                </th>
              </tr>
            </thead>
            <tbody class="text-right" flat bordered>
              <tr>
                <td>{{ $t('queen') }}</td>
                <td>3</td>
                <td>8.5</td>
                <td>16</td>
                <td>{{ $t('lifecycleHelper.eggLaying') }}: 28</td>
              </tr>
              <tr>
                <td>{{ $t('worker') }}</td>
                <td>3</td>
                <td>9</td>
                <td>21</td>
                <td>{{ $t('lifecycleHelper.collecting') }}: 40</td>
              </tr>
              <tr>
                <td>{{ $t('drone') }}</td>
                <td>3</td>
                <td>9.5</td>
                <td>24</td>
                <td>{{ $t('lifecycleHelper.fertile') }}: 38</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
    </q-card-section>
    <q-card-section>
      <div class="row q-pa-sm justify-center">
        <div class="col-12 col-md-6 col-lg-4">
          <q-markup-table dense separator="none" class="text-body1">
            <thead class="bg-warning text-right">
              <tr>
                <th>{{ $t('lifecycleHelper.caste') }}</th>
                <th>{{ $t('lifecycleHelper.body-length') }} (mm)</th>
                <th>{{ $t('lifecycleHelper.body-weight') }} (mg)</th>
              </tr>
            </thead>
            <tbody class="text-right">
              <tr>
                <td>{{ $t('queen') }}</td>
                <td>18-22</td>
                <td>200</td>
              </tr>
              <tr>
                <td>{{ $t('worker') }}</td>
                <td>12-15</td>
                <td>100</td>
              </tr>
              <tr>
                <td>{{ $t('drone') }}</td>
                <td>15-17</td>
                <td>200</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
//
</script>
