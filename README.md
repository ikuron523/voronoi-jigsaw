# Voronoi Jigsaw

A beautiful, modern jigsaw puzzle game built with React and Konva, featuring organically shaped puzzle pieces generated using Voronoi diagrams.

This puzzle game is a browser-based game that can be played on desktop or mobile devices.

## 🧩 Features
- **Voronoi Puzzle Pieces:** Pieces are uniquely generated using Voronoi diagrams instead of traditional grid shapes.
- **Custom Images:** Play with built-in sample images or upload any image from your device.
- **Difficulty Levels:** Choose from Easy (10), Normal (30), Hard (60), or Expert (100) pieces.
- **Responsive Controls:** Play comfortably on desktop or mobile with intuitive zoom and pan support.
- **Hint System:** Stuck? Use the hint button to see the original image as a guide.

## 🎮 How to Play

### Rules
1. Select an image (upload one or choose a built-in sample) and a difficulty level.
2. Click "Start Puzzle".
3. Drag the scattered puzzle pieces onto the dark board in the center.
4. When a piece is moved close to its correct position, it will automatically "snap" into place and lock.
5. Snap all pieces into their correct positions to complete the puzzle!

### Controls
- **Drag Piece:** Click and drag a puzzle piece to move it.
- **Zoom In/Out:** Use the mouse scroll wheel, or pinch in/out with two fingers on touch screens.
- **Pan (Move View):** Click and drag the empty background to scroll around the workspace.
- **Reset View:** Click the "Reset View" button in the top right to center the camera.
- **Hint:** Click the "Hint" button to briefly display the completed image on the board.

## 💻 Local Development

### Requirements
- Node.js

### Setup
1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd jigsaw
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided local URL (usually `http://localhost:5173/`) in your browser.

### Build for Production
To build the project for production deployment, run:
```bash
npm run build
```
The optimized static files will be generated in the `dist` directory.

### LICENSE
This puzzle game is licensed under the terms of the MIT license. Please see the [LICENSE](LICENSE) file for more information.
