import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),        // keep this if you’re using React
    tailwindcss(),  // Tailwind plugin
  ],
});
