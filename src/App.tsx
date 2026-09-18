import React, { useState, useCallback, useRef } from 'react';
import { Upload, Play, RotateCcw, Maximize, HelpCircle } from 'lucide-react';
import { loadImage, loadImageFromUrl, resizeImage } from './utils/imageUtils';
import { generatePuzzlePieces } from './utils/voronoi';
import type { PieceData } from './utils/voronoi';
import PuzzleBoard, { type PuzzleBoardHandle } from './components/PuzzleBoard';

const PIECE_OPTIONS = [
  { label: 'Easy (10 pieces)', value: 10 },
  { label: 'Normal (30 pieces)', value: 30 },
  { label: 'Hard (60 pieces)', value: 60 },
  { label: 'Expert (100 pieces)', value: 100 },
];

const BUILT_IN_IMAGES = ['./sample1.jpg', './sample2.jpg', './sample3.jpg', './sample4.jpg', './sample5.jpg'];

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [pieceCount, setPieceCount] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const boardRef = useRef<PuzzleBoardHandle>(null);

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

  const handleSampleSelect = async (url: string) => {
    try {
      const img = await loadImageFromUrl(url);
      const resized = resizeImage(img, 800, 800);
      
      resized.onload = () => {
         setImage(resized);
      }
    } catch (err) {
      console.error('Failed to load sample image', err);
      alert('Failed to load sample image.');
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="file-input-wrapper" style={{ marginBottom: '1rem' }}>
                    <button className="btn">
                      <Upload size={20} />
                      Choose Image
                    </button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Or choose a sample:</div>
                  <div className="sample-thumbnails">
                    {BUILT_IN_IMAGES.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`Sample ${index + 1}`} 
                        className="sample-thumbnail"
                        onClick={() => handleSampleSelect(url)}
                      />
                    ))}
                  </div>
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
          <div className="glass-panel game-header" style={{ position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Voronoi Jigsaw</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Pieces placed: {pieces.filter(p => p.isPlaced).length} / {pieces.length}
              </p>
            </div>

            {isCleared && (
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
                <h2 style={{ color: '#4ade80', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Clear! 🎉</h2>
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                className="btn" 
                style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-secondary)' }} 
                onClick={() => setShowHelp(true)}
                title="Help"
              >
                <HelpCircle size={24} />
              </button>
              <button 
                className="btn" 
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }} 
                onClick={() => boardRef.current?.resetView()}
              >
                <Maximize size={18} />
                Reset View
              </button>
              {isCleared ? (
                <button className="btn" onClick={resetGame}>
                  <RotateCcw size={18} />
                  Play Again
                </button>
              ) : (
                <button className="btn" onClick={resetGame}>
                  <RotateCcw size={18} />
                  Quit
                </button>
              )}
            </div>
          </div>
          
          <div className="canvas-container">
            <PuzzleBoard 
              ref={boardRef}
              image={image!} 
              pieces={pieces} 
              onPiecePlaced={handlePiecePlaced} 
            />
          </div>

          {showHelp && (
            <div className="modal-overlay" onClick={() => setShowHelp(false)}>
              <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Controls</h3>
                <div style={{ textAlign: 'left', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                  <p>🖱️ <strong>Mouse:</strong> Scroll to zoom, drag background to pan</p>
                  <p>👆 <strong>Touch:</strong> Pinch to zoom, swipe background to pan</p>
                </div>
                <button className="btn" style={{ margin: '1rem auto 0' }} onClick={() => setShowHelp(false)}>
                  Got it!
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
