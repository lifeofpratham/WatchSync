import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public', // yaha bata de ki index.html public me hai
  build: {
    outDir: '../dist', // build dist root pe nikle
    emptyOutDir: true
  }
})
