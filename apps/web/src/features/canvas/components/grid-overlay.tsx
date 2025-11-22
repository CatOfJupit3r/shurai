/**
 * Grid Overlay Component for Canvas
 */

// import { Layer, Line } from 'react-konva';
// import { useAtomValue } from 'jotai';
// import { gridEnabledAtom, gridSizeAtom, scaleAtom } from '../store/canvas-atoms';

interface iGridOverlayProps {
  width: number;
  height: number;
}

export function GridOverlay(_props: iGridOverlayProps) {
  // Placeholder implementation
  return null;
}

/*
// Full implementation - uncomment when react-konva is installed
export function GridOverlay({ width, height }: GridOverlayProps) {
  const gridEnabled = useAtomValue(gridEnabledAtom);
  const gridSize = useAtomValue(gridSizeAtom);
  const scale = useAtomValue(scaleAtom);

  if (!gridEnabled) return null;

  const lines: JSX.Element[] = [];
  const scaledGridSize = gridSize * scale;

  // Vertical lines
  for (let i = 0; i < width / scaledGridSize; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * scaledGridSize, 0, i * scaledGridSize, height]}
        stroke="#e5e7eb"
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i < height / scaledGridSize; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * scaledGridSize, width, i * scaledGridSize]}
        stroke="#e5e7eb"
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
}
*/
