import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import type { PieceData } from '../utils/voronoi';
import Konva from 'konva';

export interface PuzzleBoardHandle {
  resetView: () => void;
}

interface PuzzleBoardProps {
  image: HTMLImageElement;
  pieces: PieceData[];
  onPiecePlaced: (id: string) => void;
  isHintActive: boolean;
}

// User requested 15-20px snap radius
const SNAP_RADIUS = 20;

const PuzzleBoard = forwardRef<PuzzleBoardHandle, PuzzleBoardProps>(({ image, pieces, onPiecePlaced, isHintActive }, ref) => {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [pieceStates, setPieceStates] = useState(pieces);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapSoundRef = useRef<HTMLAudioElement | null>(null);
  const fanfareSoundRef = useRef<HTMLAudioElement | null>(null);

  // Zoom & Pan state
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const lastDist = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      setStageScale(1);
      setStagePosition({ x: 0, y: 0 });
    }
  }));

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
    // Don't move to top if dragging the stage
    if (node.getType() !== 'Stage') {
      node.moveToTop();
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    // Zoom speed changed from 1.1 (too fast) to 1.03
    const scaleBy = 1.03;
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let direction = e.evt.deltaY > 0 ? -1 : 1;
    if (e.evt.ctrlKey) {
      direction = -direction;
    }
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    if (newScale < 0.1 || newScale > 10) return;

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const getDistance = (p1: Touch, p2: Touch) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const stage = e.target.getStage();
    if (!stage || !touch1 || !touch2) return;

    if (stage.isDragging()) {
      stage.stopDrag();
    }

    const dist = getDistance(touch1, touch2);
    if (!lastDist.current) {
      lastDist.current = dist;
    }

    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pointer = {
      x: center.x - rect.left,
      y: center.y - rect.top,
    };

    const oldScale = stage.scaleX();
    const scaleBy = dist / lastDist.current;
    const newScale = oldScale * scaleBy;
    if (newScale < 0.1 || newScale > 10) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });

    lastDist.current = dist;
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
  };

  const isCleared = pieceStates.length > 0 && pieceStates.every(p => p.isPlaced);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={(e) => {
          if (e.target.getType() === 'Stage') {
            setStagePosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
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

          {isHintActive && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={image.width}
              height={image.height}
              opacity={0.5}
              listening={false}
            />
          )}

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
});

export default PuzzleBoard;
