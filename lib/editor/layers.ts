export function reorderItemsForLayerPanel<T>(
  items: T[],
  sourceId: string,
  targetId: string | undefined,
  getId: (item: T) => string | undefined
) {
  if (!targetId || sourceId === targetId) return items;
  const visualOrder = [...items].reverse();
  const sourceIndex = visualOrder.findIndex((item) => getId(item) === sourceId);
  const targetIndex = visualOrder.findIndex((item) => getId(item) === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return items;
  const [source] = visualOrder.splice(sourceIndex, 1);
  visualOrder.splice(targetIndex, 0, source);
  return visualOrder.reverse();
}
