<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiaryForecastQuery } from '@/composables/useQuery';
import { useAuthUserStore } from '@/stores/auth';
import GlobalLoading from '@/components/GlobalLoading.vue';

const props = defineProps<{
  apiaryId: number;
}>();

const { t, locale } = useI18n();
const storeUser = useAuthUserStore();
const isPremium = computed(() => storeUser.isPremium);

const { data, isLoading, isError, refetch } = useApiaryForecastQuery(
  toRef(props, 'apiaryId'),
  { enabled: isPremium }
);

/** Map an OpenWeather condition code to an icon and a translation key. */
function condition(code: number, isDay = true) {
  if (code >= 200 && code < 300) {
    return { icon: 'fas fa-cloud-bolt', label: 'thunderstorm' };
  }
  if (code >= 300 && code < 400) {
    return { icon: 'fas fa-cloud-rain', label: 'drizzle' };
  }
  if (code >= 500 && code < 600) {
    return [500, 501, 520].includes(code)
      ? { icon: 'fas fa-cloud-rain', label: 'rain' }
      : { icon: 'fas fa-cloud-showers-heavy', label: 'heavyRain' };
  }
  if (code >= 600 && code < 700) {
    return { icon: 'fas fa-snowflake', label: 'snow' };
  }
  if (code >= 700 && code < 800) {
    return { icon: 'fas fa-smog', label: 'fog' };
  }
  if (code === 800) {
    return { icon: isDay ? 'fas fa-sun' : 'fas fa-moon', label: 'clear' };
  }
  if (code === 801 || code === 802) {
    return {
      icon: isDay ? 'fas fa-cloud-sun' : 'fas fa-cloud-moon',
      label: 'partlyCloudy'
    };
  }
  return { icon: 'fas fa-cloud', label: 'cloudy' };
}

// The backend sends local times of the apiary without offset. The browser
// parses them as local time, so formatting keeps the apiary wall clock.
function formatHour(time: string) {
  return new Date(time).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDay(date: string) {
  return new Date(`${date}T00:00`).toLocaleDateString(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric'
  });
}

const flightHint = computed(() =>
  data.value
    ? t('forecast.flightHint', {
        temperature: data.value.thresholds.flight_min_temperature,
        precipitation:
          data.value.thresholds.flight_max_precipitation_probability,
        wind: data.value.thresholds.flight_max_wind_speed
      })
    : ''
);

const HOUR_WIDTH = 64;
const CHART_HEIGHT = 72;
const CHART_PADDING_TOP = 22;
const CHART_PADDING_BOTTOM = 8;

/** Points of the hourly temperature line, one at the center of each hour. */
const temperaturePoints = computed(() => {
  const hourly = data.value?.hourly ?? [];
  const temperatures = hourly.map(hour => hour.temperature);
  const max = Math.max(...temperatures);
  const range = max - Math.min(...temperatures) || 1;
  const height = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  return hourly.map((hour, index) => ({
    x: index * HOUR_WIDTH + HOUR_WIDTH / 2,
    y: CHART_PADDING_TOP + ((max - hour.temperature) / range) * height,
    temperature: hour.temperature
  }));
});

const current = computed(() =>
  data.value
    ? {
        ...data.value.current,
        ...condition(data.value.current.condition, data.value.current.is_day)
      }
    : null
);
</script>

<template>
  <div>
    <q-banner v-if="!isPremium" class="bg-warning text-dark rounded-borders">
      <template #avatar>
        <q-icon name="fas fa-lock" />
      </template>
      {{ t('forecast.premium') }}
      <template #action>
        <q-btn flat no-caps :label="t('premium')" to="/premium" />
      </template>
    </q-banner>

    <GlobalLoading v-else-if="isLoading" />

    <q-banner
      v-else-if="isError"
      class="bg-negative text-white rounded-borders"
    >
      <template #avatar>
        <q-icon name="fas fa-triangle-exclamation" />
      </template>
      {{ t('forecast.error') }}
      <template #action>
        <q-btn flat no-caps :label="t('reload')" @click="refetch()" />
      </template>
    </q-banner>

    <div v-else-if="data && current" class="q-gutter-y-md">
      <q-banner
        v-for="alert in data.alerts"
        :key="`${alert.event}-${alert.start}`"
        class="bg-orange-9 text-white rounded-borders"
      >
        <template #avatar>
          <q-icon name="fas fa-triangle-exclamation" />
        </template>
        <div class="text-weight-bold">
          {{ alert.event }} ({{ formatDay(alert.start.slice(0, 10)) }}
          {{ formatHour(alert.start) }} -
          {{ formatDay(alert.end.slice(0, 10)) }} {{ formatHour(alert.end) }})
        </div>
        <div class="text-caption">{{ alert.description }}</div>
        <div class="text-caption">{{ alert.sender }}</div>
      </q-banner>

      <div class="row items-center q-col-gutter-md">
        <div class="col-auto">
          <q-icon :name="current.icon" size="3em" />
        </div>
        <div class="col-auto">
          <div class="text-h4">{{ current.temperature }} °C</div>
          <div class="text-caption">
            {{ t(`forecast.conditions.${current.label}`) }},
            {{ t('forecast.feelsLike') }} {{ current.feels_like }} °C
          </div>
        </div>
        <div class="col-auto text-caption">
          <div>
            <q-icon name="fas fa-wind" /> {{ current.wind_speed }} km/h
            <span v-if="current.wind_gust !== null">
              ({{ current.wind_gust }} km/h)
            </span>
          </div>
          <div>
            <q-icon name="fas fa-droplet" /> {{ t('humidity') }}
            {{ current.humidity }} %
          </div>
          <div>
            <q-icon name="fas fa-umbrella" /> {{ current.precipitation }} mm
          </div>
        </div>
        <div class="col-auto">
          <q-badge
            :color="current.flight ? 'positive' : 'grey-7'"
            :label="
              current.flight ? t('forecast.flight') : t('forecast.noFlight')
            "
            class="q-pa-sm"
          >
            <q-tooltip>{{ flightHint }}</q-tooltip>
          </q-badge>
        </div>
      </div>

      <div class="hourly q-pb-sm">
        <div
          class="hourly-grid"
          :style="{
            gridTemplateColumns: `repeat(${data.hourly.length}, ${HOUR_WIDTH}px)`
          }"
        >
          <template v-for="(hour, index) in data.hourly" :key="hour.time">
            <div
              v-if="hour.flight"
              class="hourly-flight"
              :style="{ gridColumn: index + 1 }"
            />
            <div
              class="hourly-cell text-caption text-weight-bold"
              :style="{ gridColumn: index + 1, gridRow: 1 }"
            >
              {{
                index === 0 || hour.time.endsWith('T00:00')
                  ? formatDay(hour.time.slice(0, 10))
                  : '\u00A0'
              }}
            </div>
            <div
              class="hourly-cell text-caption"
              :style="{ gridColumn: index + 1, gridRow: 2 }"
            >
              {{ formatHour(hour.time) }}
            </div>
            <div
              class="hourly-cell"
              :style="{ gridColumn: index + 1, gridRow: 3 }"
            >
              <q-icon
                :name="condition(hour.condition, hour.is_day).icon"
                size="1.5em"
                class="q-my-xs"
              >
                <q-tooltip>
                  {{
                    t(
                      `forecast.conditions.${condition(hour.condition, hour.is_day).label}`
                    )
                  }}
                </q-tooltip>
              </q-icon>
            </div>
            <div
              class="hourly-cell text-caption"
              :style="{ gridColumn: index + 1, gridRow: 5 }"
            >
              <q-icon name="fas fa-umbrella" />
              {{ hour.precipitation_probability }} %
            </div>
            <div
              class="hourly-cell text-caption"
              :style="{ gridColumn: index + 1, gridRow: 6 }"
            >
              <q-icon name="fas fa-wind" /> {{ hour.wind_speed }}
            </div>
          </template>
          <svg
            class="hourly-chart"
            :width="data.hourly.length * HOUR_WIDTH"
            :height="CHART_HEIGHT"
          >
            <polyline
              :points="
                temperaturePoints
                  .map(point => `${point.x},${point.y}`)
                  .join(' ')
              "
              fill="none"
              stroke="var(--q-primary)"
              stroke-width="2"
            />
            <g v-for="point in temperaturePoints" :key="point.x">
              <circle
                :cx="point.x"
                :cy="point.y"
                r="3"
                fill="var(--q-primary)"
              />
              <text
                :x="point.x"
                :y="point.y - 8"
                text-anchor="middle"
                font-size="12"
                fill="currentColor"
              >
                {{ point.temperature }}°
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div
          v-for="day in data.daily"
          :key="day.date"
          class="col-12 col-sm-4 col-md-3"
        >
          <q-card flat bordered class="full-height">
            <q-card-section class="q-pa-sm">
              <div class="row items-center no-wrap">
                <div class="col text-weight-bold">{{
                  formatDay(day.date)
                }}</div>
                <q-icon :name="condition(day.condition).icon" size="1.5em">
                  <q-tooltip>
                    {{
                      t(`forecast.conditions.${condition(day.condition).label}`)
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <div class="text-subtitle1">
                {{ day.temperature_max }} / {{ day.temperature_min }} °C
              </div>
              <div class="text-caption">
                <q-icon name="fas fa-umbrella" /> {{ day.precipitation }} mm,
                {{ day.precipitation_probability }} %
              </div>
              <div class="text-caption">
                <q-icon name="fas fa-wind" /> {{ day.wind_speed }} km/h
              </div>
              <div class="q-mt-xs">
                <q-badge
                  v-if="day.flight_hours !== null"
                  :color="day.flight_hours > 0 ? 'positive' : 'grey-7'"
                  :label="t('forecast.flightHours', day.flight_hours)"
                  class="q-mr-xs"
                />
                <q-badge
                  v-else-if="day.flight_day"
                  color="positive"
                  :label="t('forecast.flightDay')"
                  class="q-mr-xs"
                />
                <q-badge
                  v-if="day.frost"
                  color="blue-7"
                  :label="t('forecast.frost')"
                  class="q-mr-xs"
                />
                <q-badge
                  v-if="day.heat"
                  color="deep-orange-7"
                  :label="t('forecast.heat')"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="text-caption text-grey">
        {{ flightHint }}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener"
          class="text-grey"
        >
          {{ t('forecast.source') }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hourly {
  overflow-x: auto;
}

.hourly-grid {
  display: grid;
  grid-template-rows: auto auto auto auto auto auto;
  white-space: nowrap;
}

.hourly-cell {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hourly-flight {
  grid-row: 1 / -1;
  background: rgba(33, 186, 69, 0.2);
}

.hourly-chart {
  position: relative;
  z-index: 1;
  grid-row: 4;
  grid-column: 1 / -1;
}
</style>
