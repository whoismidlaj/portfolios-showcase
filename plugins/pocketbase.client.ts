import PocketBase from 'pocketbase'

export default defineNuxtPlugin(() => {
  const pb = new PocketBase('http://onlyfrens.in:8090') // Change to your server URL if remote

  // Enable auth persistence
  pb.authStore.loadFromCookie(document.cookie)

  return {
    provide: {
      pb
    }
  }
})
