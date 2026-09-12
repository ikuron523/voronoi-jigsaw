import { Delaunay } from 'd3-delaunay';

export interface PieceData {
  id: string;
  points: number[];
  initialPos: { x: number; y: number };
  correctPos: { x: number; y: number };
  isPlaced: boolean;
}

// Relax points using Lloyd's algorithm to get more uniform cells
const relaxPoints = (points: [number, number][], width: number, height: number, iterations = 2): [number, number][] => {
  let currentPoints = points;
  for (let i = 0; i < iterations; i++) {
    const delaunay = Delaunay.from(currentPoints);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const newPoints: [number, number][] = [];
    for (const polygon of voronoi.cellPolygons()) {
      let cx = 0, cy = 0;
      for (const p of polygon) {
        cx += p[0];
        cy += p[1];
      }
      newPoints.push([cx / polygon.length, cy / polygon.length]);
    }
    currentPoints = newPoints;
  }
  return currentPoints;
};

export const generatePuzzlePieces = (
  width: number,
  height: number,
  numPieces: number
): PieceData[] => {
  // Generate random points
  let points: [number, number][] = Array.from({ length: numPieces }, () => [
    Math.random() * width,
    Math.random() * height,
  ]);

  // Relax them to make pieces more evenly sized
  points = relaxPoints(points, width, height, 3);

  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  const pieces: PieceData[] = [];
  const polygons = Array.from(voronoi.cellPolygons());

  polygons.forEach((polygon, index) => {
    // d3-delaunay returns polygons with the first and last point identical
    const flatPoints: number[] = [];
    polygon.forEach(p => {
      flatPoints.push(p[0], p[1]);
    });

    // Calculate the center of the piece
    let cx = 0, cy = 0;
    const numPts = flatPoints.length / 2;
    for (let i = 0; i < flatPoints.length; i += 2) {
      cx += flatPoints[i];
      cy += flatPoints[i + 1];
    }
    cx /= numPts;
    cy /= numPts;

    // Approximate board offset (assuming it's centered in the window)
    const boardX = (window.innerWidth - width) / 2;
    const boardY = (window.innerHeight - height) / 2;

    // Pick a random safe target position on the screen
    // We add a margin for the top header (approx 100px) and edges (50px)
    const targetX = Math.random() * (window.innerWidth - 100) + 50;
    const targetY = Math.random() * (window.innerHeight - 150) + 100;

    // The offset needed to move the piece's center to the target screen position
    const x = targetX - boardX - cx;
    const y = targetY - boardY - cy;

    pieces.push({
      id: `piece-${index}`,
      points: flatPoints,
      correctPos: { x: 0, y: 0 },
      initialPos: { x, y },
      isPlaced: false,
    });
  });

  return pieces;
};
