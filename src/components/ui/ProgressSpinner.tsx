import React, { memo } from '../../lib/teact/teact';
import type { FC } from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';

import './ProgressSpinner.scss';

const RADIUSES = {
  s: 22, m: 25, l: 28, xl: 20,
};
const STROKE_WIDTH = 2;
const MIN_PROGRESS = 0.05;
const MAX_PROGRESS = 1;

const ProgressSpinner: FC<{
  progress?: number;
  size?: 's' | 'm' | 'l' | 'xl';
  square?: boolean;
  transparent?: boolean;
  noCross?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}> = ({
  progress = 0,
  size = 'l',
  square,
  transparent,
  noCross,
  onClick,
}) => {
  const radius = RADIUSES[size];
  const circleRadius = radius - STROKE_WIDTH * 2;
  const borderRadius = radius - 1;
  const circumference = circleRadius * 2 * Math.PI;
  const strokeDashOffset = circumference - Math.min(Math.max(MIN_PROGRESS, progress), MAX_PROGRESS) * circumference;

  const className = buildClassName(
    `ProgressSpinner size-${size}`,
    transparent && 'transparent',
    square && 'square',
    noCross && 'no-cross',
  );

  return (
    <div
      className={className}
      onClick={onClick}
    >
      <svg
        viewBox={`0 0 ${borderRadius * 2} ${borderRadius * 2}`}
        height={borderRadius * 2}
        width={borderRadius * 2}
      >
        <circle
          stroke="white"
          fill="transparent"
          stroke-width={STROKE_WIDTH}
          stroke-dasharray={`${circumference} ${circumference}`}
          stroke-dashoffset={strokeDashOffset}
          stroke-linecap="round"
          r={circleRadius}
          cx={borderRadius}
          cy={borderRadius}
        />
      </svg>
    </div>
  );
};

export default memo(ProgressSpinner);
