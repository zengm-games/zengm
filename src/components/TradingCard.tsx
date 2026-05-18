import React, { forwardRef, HTMLAttributes } from 'react';

export interface Player {
  name: string;
  team: string;
  jerseyNumber?: number | string;
  position: string;
  overall?: number;
  potential?: number;
  stats?: {
    points?: number;
    rebounds?: number;
    assists?: number;
    yards?: number;
    touchdowns?: number;
    goals?: number;
  };
  awards?: string[];
  championships?: number;
  allStarSelections?: number;
  [key: string]: unknown;
}

export interface TradingCardProps extends HTMLAttributes<HTMLDivElement> {
  player: Player;
  theme?: 'light' | 'dark';
  sportType?: 'basketball' | 'football' | 'soccer';
  hideDecorativeBackground?: boolean;
}

const TradingCard = forwardRef<HTMLDivElement, TradingCardProps>(
  ({ player, theme = 'light', sportType = 'basketball', hideDecorativeBackground = false, style, ...rest }, ref) => {
    const {
      name,
      team,
      jerseyNumber,
      position,
      overall,
      potential,
      stats = {},
      awards = [],
      championships = 0,
      allStarSelections = 0,
    } = player;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#ffffff';
    const textColor = isDark ? '#f0f0f0' : '#333333';
    const accentColor = isDark ? '#e94560' : '#2c3e50';
    const cardBorder = isDark ? '1px solid #2c2c3a' : '1px solid #e0e0e0';

    const getSportStats = () => {
      switch (sportType) {
        case 'basketball':
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span>PTS: {stats.points ?? '--'}</span>
              <span>REB: {stats.rebounds ?? '--'}</span>
              <span>AST: {stats.assists ?? '--'}</span>
            </div>
          );
        case 'football':
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span>YDS: {stats.yards ?? '--'}</span>
              <span>TD: {stats.touchdowns ?? '--'}</span>
            </div>
          );
        case 'soccer':
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span>GLS: {stats.goals ?? '--'}</span>
              <span>AST: {stats.assists ?? '--'}</span>
            </div>
          );
        default:
          return null;
      }
    };

    const formatAwards = () => {
      const awardList = [...awards];
      if (championships > 0) awardList.push(`${championships}x Champion`);
      if (allStarSelections > 0) awardList.push(`${allStarSelections}x All-Star`);
      if (awardList.length === 0) return '—';
      return awardList.slice(0, 3).join(' • ');
    };

    return (
      <div
        ref={ref}
        style={{
          width: '400px',
          padding: '16px',
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          border: cardBorder,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
        {...rest}
      >
        {!hideDecorativeBackground && (
          <div
            data-html2canvas-ignore="true"
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}20, transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{name}</h2>
          {jerseyNumber && <span style={{ fontSize: '1rem', color: accentColor }}>#{jerseyNumber}</span>}
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: isDark ? '#aaa' : '#666', marginBottom: '12px' }}>
          <span>{team}</span>
          <span>{position}</span>
        </div>

        {(overall !== undefined || potential !== undefined) && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', borderTop: `1px solid ${isDark ? '#2c2c3a' : '#ececec'}`, paddingTop: '10px' }}>
            {overall !== undefined && (
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>OVR</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{overall}</div>
              </div>
            )}
            {potential !== undefined && (
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>POT</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{potential}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', color: accentColor }}>Key Stats</div>
          {getSportStats()}
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', color: accentColor }}>Notable Awards</div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{formatAwards()}</div>
        </div>
      </div>
    );
  }
);

TradingCard.displayName = 'TradingCard';

export default TradingCard;
