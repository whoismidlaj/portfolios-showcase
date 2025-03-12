<script setup>
import { ref } from 'vue';
const { $pb } = useNuxtApp();
const title = ref('');
const url = ref('');
const loading = ref(false);
const error = ref(null);
const success = ref(null);
const selectedOption = ref('screenshot'); // 'screenshot', or 'manual'
const fileInput = ref(null);
const customImage = ref(null);
const screenshotPreview = ref(null);

// Handle file upload for manual image selection
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    customImage.value = file;
  }
}

// Toggle between screenshot and manual upload
function toggleOption(option) {
  selectedOption.value = option;
  error.value = null;
  screenshotPreview.value = null;
}

// Preview the screenshot before saving
async function previewScreenshot() {
  if (!url.value) {
    error.value = 'URL is required for screenshot';
    return;
  }
  
  error.value = null;
  loading.value = true;
  screenshotPreview.value = null;
  
  try {
    // Generate a cache buster to avoid browser caching
    const cacheBuster = new Date().getTime();
    const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(url.value)}&t=${cacheBuster}`;
    
    // Show preview
    screenshotPreview.value = screenshotUrl;
  } catch (err) {
    console.error("Preview error:", err);
    error.value = 'Failed to generate preview. Try uploading image instead.';
  } finally {
    loading.value = false;
  }
}

async function createPortfolio() {
  if (!title.value || !url.value) {
    error.value = 'Title and URL are required';
    return;
  }
  
  if (selectedOption.value === 'manual' && !customImage.value) {
    error.value = 'Please select an image';
    return;
  }
  
  error.value = null;
  success.value = null;
  loading.value = true;
  
  try {
    let imgFile;
    
    if (selectedOption.value === 'screenshot') {
      try {
        // Get screenshot from our server endpoint
        const cacheBuster = new Date().getTime();
        const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(url.value)}&t=${cacheBuster}`;
        
        const imageRes = await fetch(screenshotUrl);
        
        if (!imageRes.ok) {
          throw new Error(`Screenshot API returned ${imageRes.status}`);
        }
        
        const blob = await imageRes.blob();
        
        if (!blob || blob.size < 1000) {
          throw new Error("Invalid image data received");
        }
        
        imgFile = new File(
          [blob], 
          "screenshot.jpg", 
          { type: "image/jpeg" }
        );
      } catch (imageError) {
        console.error("Screenshot error:", imageError);
        throw new Error("Could not generate screenshot. Try uploading image instead.");
      }
    }  else {
      // Using manual upload
      imgFile = customImage.value;
    }
    
    // Create and upload form data
    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("url", url.value);
    formData.append("thumbnail", imgFile);
    
    // Enhanced error handling for PocketBase
    try {
      const record = await $pb.collection("portfolios").create(formData);
      console.log("Portfolio created successfully:", record);
      success.value = "Portfolio created successfully!";
      title.value = "";
      url.value = "";
      screenshotPreview.value = null;
      if (selectedOption.value === 'manual') {
        customImage.value = null;
        if (fileInput.value) fileInput.value.value = '';
      }
    } catch (pbError) {
      console.error("PocketBase error:", pbError);
      
      // Try to extract detailed error information
      if (pbError.response && pbError.response.data) {
        const errorDetails = Object.entries(pbError.response.data)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ');
        throw new Error(`Failed to create portfolio: ${errorDetails}`);
      } else {
        throw new Error(pbError.message || "Failed to create portfolio. Please check your connection and try again.");
      }
    }
  } catch (err) {
    console.error("Error details:", err);
    error.value = err.message || "Failed to create portfolio";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="py-8 border-b border-gray-700/70 p-4">
      <h1 class="text-2xl tracking-tight font-light">Portfolio Showcase</h1>
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3">{{ error }}</div>
    <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3">{{ success }}</div>
    
    <!-- Option selector -->
    <div class="flex flex-wrap p-4 gap-4 border-b border-gray-700/70">
      <button 
        @click="toggleOption('screenshot')" 
        class="border border-gray-700/70 py-2 px-4 text-sm hover:bg-gray-700/30"
        :class="selectedOption === 'screenshot' ? 'bg-gray-700/30' : 'bg-transparent'"
      >
        Website Screenshot
      </button>
      <button 
        @click="toggleOption('manual')" 
        class="border border-gray-700/70 py-2 px-4 text-sm hover:bg-gray-700/30"
        :class="selectedOption === 'manual' ? 'bg-gray-700/30' : 'bg-transparent'"
      >
        Upload Image
      </button>
    </div>
    
    <form @submit.prevent="createPortfolio" class="flex flex-col p-4 gap-4">
      <input v-model="title" type="text" placeholder="Title" class="border border-gray-700/70 bg-transparent p-2" required />
      <input v-model="url" type="url" placeholder="Website URL" class="border border-gray-700/70 bg-transparent p-2" required />
      
      <!-- Preview screenshot option -->
      <div v-if="selectedOption === 'screenshot'" class="mt-2 mb-2">
        <button 
          type="button"
          @click="previewScreenshot" 
          class="border border-gray-700/70 py-2 px-4 text-sm hover:bg-gray-700/30"
          :disabled="loading || !url"
        >
          {{ loading ? "Loading..." : "Preview Screenshot" }}
        </button>
        
        <div v-if="screenshotPreview" class="mt-2 border p-2 rounded">
          <img :src="screenshotPreview" alt="Screenshot preview" class="w-full h-auto rounded" />
        </div>
      </div>
      
      <!-- File input only shown when 'manual' is selected -->
      <input 
        v-if="selectedOption === 'manual'"
        ref="fileInput"
        type="file" 
        accept="image/*" 
        @change="handleFileUpload" 
        class="border border-gray-700/70 py-2 px-4 text-sm hover:bg-gray-700/30" 
        required
      />
      
      <button 
        type="submit" 
        :disabled="loading" 
        class="border border-gray-700/70 py-2 px-4 text-sm hover:bg-gray-700/30"
      >
        {{ loading ? "Creating..." : "Create Portfolio" }}
      </button>
    </form>
  </div>
</template>