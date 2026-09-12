import React, { useState, useCallback } from 'react';
import { Upload, Play, RotateCcw } from 'lucide-react';
import { loadImage, resizeImage } from './utils/imageUtils';
import { generatePuzzlePieces } from './utils/voronoi';
import type { PieceData } from './utils/voronoi';
import PuzzleBoard from './components/PuzzleBoard';

const PIECE_OPTIONS = [
  { label: 'Easy (10 pieces)', value: 10 },
  { label: 'Normal (30 pieces)', value: 30 },
  { label: 'Hard (60 pieces)', value: 60 },
  { label: 'Expert (100 pieces)', value: 100 },
];

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [pieceCount, setPieceCount] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await loadImage(file);
      const resized = resizeImage(img, 800, 800);
      
      resized.onload = () => {
         setImage(resized);
      }
    } catch (err) {
      console.error('Failed to load image', err);
      alert('Failed to load image.');
    }
  };

  const startGame = () => {
    if (!image) return;
    
    const boardWidth = image.width;
    const boardHeight = image.height;
    
    const newPieces = generatePuzzlePieces(boardWidth, boardHeight, pieceCount);
    setPieces(newPieces);
    setIsPlaying(true);
    setIsCleared(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsCleared(false);
    setPieces([]);
    setImage(null);
  };

  const handlePiecePlaced = useCallback((id: string) => {
    setPieces(prev => {
      const next = prev.map(p => p.id === id ? { ...p, isPlaced: true } : p);
      if (next.every(p => p.isPlaced)) {
        setIsCleared(true);
      }
      return next;
    });
  }, []);

  return (
    <>
      {!isPlaying ? (
        <div className="upload-container">
          <div className="glass-panel upload-card">
            <h1 className="title">Voronoi Jigsaw</h1>
            <p className="subtitle">Upload an image and play a beautiful Voronoi puzzle.</p>
            
            <div style={{ marginBottom: '2rem' }}>
              {image ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={image.src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                  <button 
                    onClick={() => setImage(null)}
                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="file-input-wrapper">
                  <button className="btn">
                    <Upload size={20} />
                    Choose Image
                  </button>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <label>Difficulty:</label>
              <select 
                className="difficulty-select"
                value={pieceCount} 
                onChange={(e) => setPieceCount(Number(e.target.value))}
              >
                {PIECE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'center', opacity: !image ? 0.5 : 1 }}
              disabled={!image}
              onClick={startGame}
            >
              <Play size={20} />
              Start Puzzle
            </button>
          </div>
        </div>
      ) : (
        <div className="game-container">
          <div className="glass-panel game-header">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Voronoi Jigsaw</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Pieces placed: {pieces.filter(p => p.isPlaced).length} / {pieces.length}
              </p>
            </div>
            <button className="btn" onClick={resetGame}>
              <RotateCcw size={18} />
              Quit
            </button>
          </div>
          
          <div className="canvas-container">
            <PuzzleBoard 
              image={image!} 
              pieces={pieces} 
              onPiecePlaced={handlePiecePlaced} 
            />
          </div>

          {isCleared && (
            <div className="clear-overlay">
              <div className="glass-panel clear-message">
                <h2 className="clear-title">Clear!</h2>
                <button className="btn" style={{ margin: '0 auto' }} onClick={resetGame}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
