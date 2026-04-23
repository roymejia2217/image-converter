# Image Converter

A lightweight, client-side image conversion tool built as a vanilla JavaScript SPA. It runs entirely in the browser with no server uploads, supporting fast and secure image format conversion.

## Overview

Image Converter allows users to upload images and convert them between JPEG, PNG, and WebP formats. The application features a clean Bootstrap 5 interface, quality control, batch processing with ZIP export, and a fully functional progress indicator.

## Key Features

- **Format Conversion**: Supports JPEG, PNG, and WebP with configurable quality settings.
- **Batch Processing**: Convert multiple files at once and download them as a ZIP archive.
- **Quality Slider**: Adjustable quality from 0.1 to 1.0 for JPEG and WebP outputs.
- **Dark Mode**: Automatic theme detection with manual toggle support.
- **Local Processing**: All conversion happens in the browser. No files are uploaded to any server.
- **Progress Tracking**: Visual progress bar updates per file during conversion.
- **Responsive Design**: Bootstrap 5 grid system ensures usability on mobile and desktop.

## Technologies

- **HTML5** and **CSS3** with Bootstrap 5
- **JavaScript** (ES6+) following SOLID/DRY/KISS principles
- **Vite** for bundling and development
- **browser-image-compression** for efficient image compression
- **JSZip** for creating ZIP archives of converted files

## Project Structure

```
image-converter/
│
├── index.html                # Main application entry point
├── src/                      # Source code
│   ├── config/               # Centralized configuration
│   │   ├── app-config.js     # Application constants
│   │   ├── canvas-config.js  # Canvas and validation settings
│   │   ├── config.js         # General configuration
│   │   ├── format-configs.js # Format-specific settings
│   │   └── tooltips.js       # Tooltip descriptions
│   ├── core/                 # Core modules (state, memory, metrics, lazy loading)
│   ├── handlers/             # Event handlers
│   ├── utils/                # Utility functions
│   ├── init/                 # Application initialization
│   ├── script.js             # Entry point
│   └── style.css             # Custom styles
│
├── public/                   # Public assets (favicon, etc.)
├── package.json              # Dependencies and npm scripts
├── vite.config.js            # Vite configuration
├── vitest.config.js          # Vitest test configuration
└── .gitignore                # Git ignore rules
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/roymejia2217/image-converter.git
   cd image-converter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
   Production-ready files will be generated in the `dist/` directory.

## Testing

Run the test suite with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Deployment

1. Run the build (`npm run build`).
2. Deploy the contents of the `dist/` directory to your hosting platform of choice.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
