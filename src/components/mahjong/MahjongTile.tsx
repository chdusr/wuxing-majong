import React from 'react';
import { MahjongTileData, ElementType } from '../../types/mahjong';
import { ELEMENT_COLORS } from '../../utils/mahjongRules';

interface MahjongTileProps {
  tile?: MahjongTileData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  isLastDrawn?: boolean;
  isHighlighted?: boolean;
  isFaceDown?: boolean;
  isRotated?: boolean; // For claimed melds
  onClick?: () => void;
  className?: string;
  showElementBadge?: boolean;
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  size = 'md',
  isSelected = false,
  isLastDrawn = false,
  isHighlighted = false,
  isFaceDown = false,
  isRotated = false,
  onClick,
  className = '',
  showElementBadge = true,
}) => {
  // Size variations (width, height, text font size)
  const sizeClasses = {
    xs: 'w-6 h-8 text-xs rounded-sm',
    sm: 'w-8 h-11 text-base rounded-md',
    md: 'w-10 h-14 text-xl rounded-lg',
    lg: 'w-12 h-16 text-2xl rounded-xl',
    xl: 'w-14 h-20 text-3xl rounded-2xl',
  }[size];

  // Face down tile (for opponent hands or deck wall)
  if (isFaceDown || !tile) {
    return (
      <div
        className={`relative flex-shrink-0 select-none ${sizeClasses} ${isRotated ? 'rotate-90' : ''} ${className}`}
        style={{
          perspective: '400px',
        }}
      >
        {/* Jade / Emerald iOS textured tile back */}
        <div
          className="w-full h-full rounded-[inherit] border border-emerald-400/30 bg-gradient-to-b from-[#155e4b] via-[#0b3d30] to-[#04241c] shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center"
        >
          {/* Subtle engraved bamboo / cloud motif */}
          <div className="w-2/3 h-2/3 border border-emerald-400/20 rounded-sm flex items-center justify-center opacity-60">
            <span className="text-[10px] text-emerald-300 font-serif">🀄</span>
          </div>
        </div>
      </div>
    );
  }

  const elementStyle = ELEMENT_COLORS[tile.element] || ELEMENT_COLORS.earth;

  // Custom typography colors directly matching the photos from PDF
  // (e.g. 木=Green, 火=Red, 土=Brown/Amber, 金=Orange, 水=Sky Blue/Dark Navy)
  return (
    <div
      onClick={onClick}
      className={`relative flex-shrink-0 select-none cursor-pointer transition-all duration-150 transform ${sizeClasses} ${
        isSelected
          ? '-translate-y-2.5 shadow-[0_8px_16px_rgba(217,122,255,0.4)] ring-2 ring-purple-400'
          : 'hover:-translate-y-1 active:translate-y-0 shadow-[0_3px_6px_rgba(0,0,0,0.35)]'
      } ${
        isHighlighted
          ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 animate-pulse'
          : ''
      } ${isRotated ? 'rotate-90 origin-center' : ''} ${className}`}
    >
      {/* 3D Tile Ivory / Bone Body */}
      <div
        className="w-full h-full rounded-[inherit] border border-amber-100/40 bg-gradient-to-b from-[#FFFDF8] via-[#FAF6ED] to-[#EBE2CF] p-0.5 flex flex-col items-center justify-between shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_3px_0_#C5BA9E,0_4px_5px_rgba(0,0,0,0.4)]"
      >
        {/* Top Element Micro-Badge (optional) */}
        <div className="w-full flex items-center justify-between px-1 pt-0.5 pointer-events-none">
          {showElementBadge && size !== 'xs' && (
            <span
              className="text-[9px] font-bold px-1 rounded-[3px] scale-90 -ml-0.5"
              style={{
                color: elementStyle.text,
                backgroundColor: 'rgba(0,0,0,0.06)',
              }}
            >
              {tile.elementName}
            </span>
          )}
          {tile.yinYang && size !== 'xs' && (
            <span
              className={`text-[8px] font-semibold scale-75 -mr-0.5 ${
                tile.yinYang === 'yang' ? 'text-amber-700' : 'text-slate-600'
              }`}
            >
              {tile.yinYang === 'yang' ? '阳' : '阴'}
            </span>
          )}
        </div>

        {/* Center Main Calligraphy Character */}
        <div className="flex-1 flex items-center justify-center -mt-0.5">
          <span
            className="font-bold tracking-tight font-serif select-none"
            style={{
              color: elementStyle.text,
              textShadow: '0 1px 0 rgba(255,255,255,0.8), 0 -0.5px 0 rgba(0,0,0,0.15)',
            }}
          >
            {tile.name}
          </span>
        </div>

        {/* Bottom subtle indicator */}
        <div className="w-full flex justify-center pb-0.5 pointer-events-none">
          <div
            className="w-3 h-0.5 rounded-full opacity-40"
            style={{ backgroundColor: elementStyle.text }}
          />
        </div>
      </div>

      {/* Last Drawn Pill Badge */}
      {isLastDrawn && (
        <div className="absolute -top-2 -right-1 z-10 px-1 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-[9px] text-white font-bold rounded-full shadow-sm scale-90 border border-white/60 animate-bounce">
          摸
        </div>
      )}
    </div>
  );
};
