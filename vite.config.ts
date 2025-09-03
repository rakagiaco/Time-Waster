/**
 * Vite Configuration for Time-Waster RPG Game
 * 
 * Configures the Vite build system for optimal development and production builds
 * with proper asset handling, path aliases, and Phaser.js optimizations.
 */

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Base path for production deployment (relative for GitHub Pages compatibility)
  base: './',
  
  // Build configuration for production
  build: {
    outDir: 'dist',         // Output directory for built files
    assetsDir: 'assets',    // Directory for static assets within dist
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')  // Entry point for the application
      }
    }
  },
  
  // Development server configuration
  server: {
    host: true,    // Allow external connections for network testing
    port: 3000     // Default development port
  },
  
  // Module resolution and path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')  // Allows '@/...' imports for cleaner code
    }
  },
  
  // Dependency optimization for faster development builds
  optimizeDeps: {
    include: ['phaser']  // Pre-bundle Phaser.js for faster loading
  }
})
