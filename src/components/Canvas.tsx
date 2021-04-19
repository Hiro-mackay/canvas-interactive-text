import React, { FC, memo, useCallback, useEffect, useRef } from 'react';

interface Props {
  initApp: (ref: HTMLCanvasElement) => void;
}

export const Canvas: FC<Props> = memo(({ initApp }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    initApp(ref.current);
  }, [ref]);

  return <canvas ref={ref}>Canvs viewer</canvas>;
});
