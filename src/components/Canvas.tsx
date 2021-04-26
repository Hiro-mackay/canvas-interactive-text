import React, { FC, memo, useCallback, useEffect, useRef } from 'react';

interface Props {
  initApp: (ref: HTMLCanvasElement) => void;
}

export const Canvas: FC<Props> = memo(({ initApp }) => {
  return <canvas ref={initApp}>Canvs viewer</canvas>;
});
