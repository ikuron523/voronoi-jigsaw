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
    // ユーザーが 'public' フォルダに配置した音源を読み込む
    snapSoundRef.current = new Audio('/snap.mp3');
    fanfareSoundRef.current = new Audio('/fanfare.mp3');
    
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
      // これが最後のピースかどうか判定（現在未配置のピースが1つだけなら、これが最後）
      const isLastPiece = pieceStates.filter(p => !p.isPlaced).length === 1;

      // スナップ時の効果音を再生
      if (snapSoundRef.current) {
        snapSoundRef.current.currentTime = 0; // 連続で再生できるように巻き戻す
        
        if (isLastPiece && fanfareSoundRef.current) {
          // 最後のピースの場合は、snap音が終わった後にファンファーレを再生
          snapSoundRef.current.onended = () => {
            fanfareSoundRef.current!.currentTime = 0;
            fanfareSoundRef.current!.play().catch(e => console.warn('Fanfare playback failed:', e));
            // イベントリスナーを解除しておく
            snapSoundRef.current!.onended = null;
          };
        } else {
          // それ以外の場合はイベントリスナーを解除
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

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer x={boardX} y={boardY}>
          <Rect
            x={0}
            y={0}
            width={image.width}
            height={image.height}
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.5}
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
                stroke={piece.isPlaced ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)"}
                strokeWidth={piece.isPlaced ? 1 : 2}
                draggable={!piece.isPlaced}
                onDragStart={handleDragStart}
                onDragEnd={(e) => handleDragEnd(e, piece.id)}
                shadowColor="black"
                shadowBlur={piece.isPlaced ? 0 : 5}
                shadowOpacity={piece.isPlaced ? 0 : 0.5}
                shadowOffset={piece.isPlaced ? {x:0, y:0} : {x:2, y:2}}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default PuzzleBoard;
