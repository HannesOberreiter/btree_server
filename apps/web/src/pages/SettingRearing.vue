<template>
  <q-card>
    <div class="row justify-center q-pb-sm">
      <div class="col-12 col-sm-10 col-md-8">
        <div class="text-body2 q-pb-sm text-center">
          {{ $t('rearing') }} {{ $t('method', 2) }}
        </div>
        <rearing-method></rearing-method>
      </div>
    </div>
  </q-card>
</template>
