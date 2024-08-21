import { greedyFAS } from './greedy-fas'
import { uniqueId} from './util'

export { run, undo };

function run(g) {
  const fas = g.graph().acyclicer === 'greedy' ? greedyFAS(g, weightFn(g)) : dfsFAS(g)
  fas.forEach(e => {
    const label = g.edge(e)
    g.removeEdge(e)
    label.forwardName = e.name
    label.reversed = true
    g.setEdge(e.w, e.v, label, uniqueId("rev"))
  })

  function weightFn(g) {
    return function (e) {
      return g.edge(e).weight
    };
  }
}

function dfsFAS(g) {
  const fas = []
  const stack = {}
  const visited = {}

  function dfs(v) {
    if (visited.hasOwnProperty(v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    g.outEdges(v).forEach(e => {
      if (stack.hasOwnProperty(e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  }

  g.nodes().forEach(dfs);
  return fas;
}

function undo(g) {
  g.edges().forEach(e => {
    const label = g.edge(e)
    if (label.reversed) {
      g.removeEdge(e)

      const forwardName = label.forwardName
      delete label.reversed
      delete label.forwardName
      g.setEdge(e.w, e.v, label, forwardName)
    }
  })
}
