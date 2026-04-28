# Image Converter

A lightweight, client-side image conversion tool built as a vanilla JavaScript SPA. It runs entirely in the browser with no server uploads, supporting fast and secure image format conversion.

## Overview

Image Converter allows users to upload images and convert them between JPEG, PNG, WebP, GIF, BMP, and ICO formats. The application features a clean Bootstrap 5 interface, format-specific parameters, batch processing with ZIP export, and a fully functional progress indicator. All conversions are verified against magic bytes to ensure output integrity.

## Key Features

- **Format Conversion**: Supports JPEG, PNG, WebP, GIF, BMP, and ICO with format-specific parameters.
- **Batch Processing**: Convert multiple files at once and download them as a ZIP archive.
- **Format-Specific Parameters**: Quality (0.1-1.0) for JPEG/WebP, Max Colors (2-256) for GIF, Bit Depth (24/32) for BMP.
- **Output Verification**: All converted files are validated against magic bytes to confirm real format conversion.
- **Dark Mode**: Automatic theme detection with manual toggle support.
- **Local Processing**: All conversion happens in the browser. No files are uploaded to any server.
- **Progress Tracking**: Visual progress bar updates per file during conversion.
- **Responsive Design**: Bootstrap 5 grid system ensures usability on mobile and desktop.
- **Smooth Scrolling & Lazy Loading**: IntersectionObserver-based lazy loading for thumbnails improves performance with many files. Incremental DOM updates append or remove only the affected nodes rather than rebuilding the entire list.

## Supported Formats

| Format | Input | Output |
|--------|:-----:|:------:|
| JPEG   |  Yes  |  Yes   |
| PNG    |  Yes  |  Yes   |
| WebP   |  Yes  |  Yes   |
| GIF    |  Yes  |  Yes   |
| BMP    |  Yes  |  Yes   |
| ICO    |  Yes  |  Yes   |

## Usage

1. **Add Files**: Click "Add Images" or drag-and-drop files onto the page.
2. **Select Format**: Choose the target format from the dropdown menu.
3. **Configure Options**: Adjust format-specific settings as needed.
4. **Convert**: Click "Convert" to process all files.
5. **Download**: Click "Download" to save individual files or "Download All" for a ZIP archive.

### ICO-Specific Behavior

**ICO Output**: When converting to ICO, select one or more size presets via checkboxes (16x16, 32x32, 48x48, 64x64, 128x128, 256x256). Each selected size generates a separate icon entry. Sizes below 256 use BMP-derived DIB entries; the 256x256 size uses an embedded PNG.

**ICO Input**: When uploading an ICO file, all embedded icon sizes are extracted and packaged into a ZIP archive of PNG files.

## Technologies

- **HTML5** and **CSS3** with Bootstrap 5
- **JavaScript** (ES6+) following SOLID/DRY/KISS principles
- **Vite** for bundling and development
- **omggif** for GIF encoding with configurable palette
- **JSZip** for creating ZIP archives of converted files
- **Custom encoders** (src/utils/encoders.js) for BMP and Canvas-based formats with output verification

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
│   │   ├── encoders.js       # Custom encoders for BMP, GIF, and Canvas verification
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
