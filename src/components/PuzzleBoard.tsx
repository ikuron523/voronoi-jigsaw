import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import type { PieceData } from '../utils/voronoi';
import Konva from 'konva';

interface PuzzleBoardProps {
  image: HTMLImageElement;
  pieces: PieceData[];
  onPiecePlaced: (id: string) => void;
}

// User requested 15-20px snap radius
const SNAP_RADIUS = 20;

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ image, pieces, onPiecePlaced }) => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [pieceStates, setPieceStates] = useState(pieces);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapSoundRef = useRef<HTMLAudioElement | null>(null);
  const fanfareSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load audio files placed in the 'public' folder
    snapSoundRef.current = new Audio('./snap.mp3');
    fanfareSoundRef.current = new Audio('./fanfare.mp3');

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const boardX = (dimensions.width - image.width) / 2;
  const boardY = (dimensions.height - image.height) / 2;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();

    const dist = Math.sqrt(x * x + y * y);

    if (dist < SNAP_RADIUS) {
      // Check if this is the last piece (if only one unplaced piece remains, this is it)
      const isLastPiece = pieceStates.filter(p => !p.isPlaced).length === 1;

      // Play the snap sound effect
      if (snapSoundRef.current) {
        snapSoundRef.current.currentTime = 0; // Rewind to allow consecutive playback

        if (isLastPiece && fanfareSoundRef.current) {
          // If it's the last piece, play the fanfare after the snap sound finishes
          snapSoundRef.current.onended = () => {
            fanfareSoundRef.current!.currentTime = 0;
            fanfareSoundRef.current!.play().catch(e => console.warn('Fanfare playback failed:', e));
            // Remove the event listener
            snapSoundRef.current!.onended = null;
          };
        } else {
          // Otherwise, remove the event listener
          snapSoundRef.current.onended = null;
        }

        snapSoundRef.current.play().catch(e => console.warn('Audio playback failed:', e));
      }

      node.position({ x: 0, y: 0 });
      node.draggable(false);
      node.moveToBottom();

      setPieceStates(prev =>
        prev.map(p => p.id === id ? { ...p, isPlaced: true, currentPos: { x: 0, y: 0 } } : p)
      );
      onPiecePlaced(id);
    } else {
      setPieceStates(prev =>
        prev.map(p => p.id === id ? { ...p, currentPos: { x, y } } : p)
      );
    }
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    node.moveToTop();
  };

  const isCleared = pieceStates.length > 0 && pieceStates.every(p => p.isPlaced);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer x={boardX} y={boardY}>
          <Rect
            x={0}
            y={0}
            width={image.width}
            height={image.height}
            fill={isCleared ? "transparent" : "rgba(0,0,0,0.1)"}
            stroke={isCleared ? "transparent" : "rgba(255,255,255,0.2)"}
            strokeWidth={isCleared ? 0 : 2}
            shadowColor="black"
            shadowBlur={isCleared ? 0 : 10}
            shadowOpacity={isCleared ? 0 : 0.8}
            shadowOffset={isCleared ? { x: 0, y: 0 } : { x: 4, y: 4 }}
          />

          {pieceStates.map(piece => {
            const pos = (piece as any).currentPos || piece.initialPos;

            return (
              <Line
                key={piece.id}
                x={pos.x}
                y={pos.y}
                points={piece.points}
                closed={true}
                fillPatternImage={image}
                fillPatternRepeat="no-repeat"
                stroke={piece.isPlaced ? (isCleared ? "transparent" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.8)"}
                strokeWidth={piece.isPlaced ? (isCleared ? 0 : 1) : 2}
                draggable={!piece.isPlaced}
                onDragStart={handleDragStart}
                onDragEnd={(e) => handleDragEnd(e, piece.id)}
                shadowColor="black"
                shadowBlur={piece.isPlaced ? 0 : 10}
                shadowOpacity={piece.isPlaced ? 0 : 0.8}
                shadowOffset={piece.isPlaced ? { x: 0, y: 0 } : { x: 4, y: 4 }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default PuzzleBoard;
