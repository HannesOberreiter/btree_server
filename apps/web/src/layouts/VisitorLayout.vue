<template>
  <q-layout>
    <div class="q-pa-xs">
      <div class="row justify-center items-center content-center">
        <div class="col-12 col-sm-8 col-md-5 col-lg-4">
          <q-card>
            <q-card-section class="bg-primary text-white">
              <q-img
                src="~assets/logo.png"
                alt="b.tree Logo"
                spinner-color="white"
                class="float-left q-mr-sm"
                style="max-width: 55px"
              />
              <div class="text-h6">b.tree</div>
              <div class="text-subtitle2">Professional Beekeeping Database</div>
            </q-card-section>
            <q-page-container class="">
              <router-view />
            </q-page-container>

            <q-card-section
              class="bg-blue-grey-9 text-center text-white text-h6"
            >
              <div v-if="path.name !== 'register'">
                <span>Don't have an account? </span>
                <router-link class="text-secondary" to="/register">
                  Sign Up
                </router-link>
              </div>
              <div v-if="path.name !== 'login'">
                <span>Already registered? </span>
                <router-link class="text-secondary" to="/login">
                  Log In
                </router-link>
              </div>
              <div v-if="path.name !== 'recover'">
                <router-link class="text-secondary" to="/recover">
                  Forgot your password?
                </router-link>
              </div>
            </q-card-section>
          </q-card>
          <div class="text-center">
            <small>
              © 2013- {{ new Date().getFullYear() }}
              <a href="https://info.btree.at/">b.tree Beekeeping Database </a>
            </small>
          </div>
          <supporter-images></supporter-images>
        </div>
      </div>
    </div>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SupporterImages from '~/components/SupporterImages.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const path = computed(() => router.currentRoute.value);
</script>
