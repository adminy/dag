import { dijkstra } from './dijkstra'

export { dijkstraAll };

function dijkstraAll(g, weightFunc, edgeFunc?) {
  return g.nodes().reduce((acc, v) => {
    acc[v] = dijkstra(g, v, weightFunc, edgeFunc);
    return acc;
  }, {});
}
