<script setup>
import { ref, onMounted } from 'vue'
const { $pb } = useNuxtApp()

const portfolios = ref([])

async function loadPortfolios() {
  const records = await $pb.collection('portfolios').getFullList()

  portfolios.value = records.map(record => ({
    ...record,
    thumbnail: record.thumbnail
      ? `${$pb.baseUrl}/api/files/portfolios/${record.id}/${record.thumbnail}`
      : null,
  }))

  console.log('Portfolios:', portfolios.value)
}

onMounted(loadPortfolios)
</script>


<template>
  <div class="flex flex-col">
    <div class="py-8 border-b border-gray-700/70 p-4">
      <h1 class="text-2xl tracking-tight font-light">Portfolio Showcase</h1>
    </div>
    <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
      <a class="group" v-for="portfolio in portfolios" :key="portfolio.id" :href="portfolio.url" target="_blank">
        <li class="relative flex flex-col gap-2 border border-gray-700/70 p-2">
          <img class="overflow-clip" v-if="portfolio.thumbnail" :src="portfolio.thumbnail"
            alt="Portfolio Thumbnail" />
          <div
            class="absolute bottom-0 left-0 w-full h-full p-8 flex justify-between items-end opacity-0 group-hover:opacity-100 bg-gradient-to-t from-gray-900/50 to-gray-800/50">
            <h2 class="text-xl">{{ portfolio.title }}</h2>
            <Icon name="heroicons:arrow-up-right-20-solid" class="text-2xl" />
          </div>
        </li>
      </a>
    </ul>
  </div>
</template>
