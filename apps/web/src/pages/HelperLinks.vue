<template>
  <q-card>
    <div class="row q-pa-sm justify-center">
      <div class="col-12">
        <div class="text-h5 q-pb-sm text-center">
          {{ $t('curatedLinks') }}
          <div class="text-caption">
            {{ $t('lastUpdate') }}: {{ lastUpdate }}
          </div>
        </div>
      </div>
      <div class="col-12 col-md-8 col-lg-6">
        <q-list bordered separator>
          <q-item v-for="(link, index) in links" :key="index" :href="link.url">
            <q-item-section clickable>
              <q-item-label class="text-left text-bold">
                <a :href="link.url" target="_blank" rel="noopener external">
                  {{
                    truncate(link.url.replace(/^https?:\/\/(www.)?/, ''), {
                      length: 25,
                    })
                  }}
                  <tooltip-base>{{ link.url }}</tooltip-base>
                </a>
              </q-item-label>
              <q-item-label caption class="text-justify">
                {{ link.description }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import truncate from 'lodash-es/truncate';

// Update lastUpdate constant if changing links, for better user experience!
const lastUpdate = '2022-06-17';
const links = [
  {
    url: 'https://www.beekeeping-news.com/',
    description:
      'A curated selection of worldwide feeds related around the topic of beekeeping and honeybees.',
  },
  {
    url: 'https://hiveeyes.org/',
    description:
      'We are developing a flexible beehive monitoring infrastructure platform and toolkit based on affordable hardware, wireless telemetry and modern software. Open source, open hardware and a friendly community.',
  },
  {
    url: 'https://www.nationalbeeunit.com/public/BeeDiseases/varroaCalculator.cfm',
    description: 'BeeBase varroa calculator.',
  },
  {
    url: 'http://coloss.org/beebook/',
    description:
      'The COLOSS BEEBOOK is a unique venture that aims to standardise methods for studying the honey bee. From the outset, the vision of the project has been to develop a definitive inventory of standard techniques and methods in honey bee research, in order to ensure that studies performed by different laboratories around the world would be directly comparable with each other.',
  },
];
</script>
