import * as util from './util'

export { run, cleanup }

/*
 * A nesting graph creates dummy nodes for the tops and bottoms of subgraphs,
 * adds appropriate edges to ensure that all cluster nodes are placed between
 * these boundries, and ensures that the graph is connected.
 *
 * In addition we ensure, through the use of the minlen property, that nodes
 * and subgraph border nodes to not end up on the same rank.
 *
 * Preconditions:
 *
 *    1. Input graph is a DAG
 *    2. Nodes in the input graph has a minlen attribute
 *
 * Postconditions:
 *
 *    1. Input graph is connected.
 *    2. Dummy nodes are added for the tops and bottoms of subgraphs.
 *    3. The minlen attribute for nodes is adjusted to ensure nodes do not
 *       get placed on the same rank as subgraph border nodes.
 *
 * The nesting graph idea comes from Sander, "Layout of Compound Directed
 * Graphs."
 */
function run(g) {
  const root = util.addDummyNode(g, 'root', {}, '_root');
  const depths = treeDepths(g) as Record<string, number>;
  const height = Math.max(...Object.values(depths)) - 1; // Note: depths is an Object not an array
  const nodeSep = 2 * height + 1;

  g.graph().nestingRoot = root;

  // Multiply minlen by nodeSep to align nodes on non-border ranks.
  g.edges().forEach(e => g.edge(e).minlen *= nodeSep);

  // Calculate a weight that is sufficient to keep subgraphs vertically compact
  const weight = sumWeights(g) + 1;

  // Create border nodes and link them up
  g.children().forEach(child => dfs(g, root, nodeSep, weight, height, depths, child));

  // Save the multiplier for node layers for later removal of empty border
  // layers.
  g.graph().nodeRankFactor = nodeSep;
}

function dfs(g, root, nodeSep, weight, height, depths, v) {
  const children = g.children(v);
  if (!children.length) {
    if (v !== root) {
      g.setEdge(root, v, { weight: 0, minlen: nodeSep });
    }
    return;
  }

  const top = util.addBorderNode(g, '_bt');
  const bottom = util.addBorderNode(g, '_bb');
  const label = g.node(v);

  g.setParent(top, v);
  label.borderTop = top;
  g.setParent(bottom, v);
  label.borderBottom = bottom;

  children.forEach(child => {
    dfs(g, root, nodeSep, weight, height, depths, child);

    const childNode = g.node(child);
    const childTop = childNode.borderTop ? childNode.borderTop : child;
    const childBottom = childNode.borderBottom ? childNode.borderBottom : child;
    const thisWeight = childNode.borderTop ? weight : 2 * weight;
    const minlen = childTop !== childBottom ? 1 : height - depths[v] + 1;

    g.setEdge(top, childTop, {
      weight: thisWeight,
      minlen: minlen,
      nestingEdge: true,
    });

    g.setEdge(childBottom, bottom, {
      weight: thisWeight,
      minlen: minlen,
      nestingEdge: true,
    });
  });

  if (!g.parent(v)) {
    g.setEdge(root, top, { weight: 0, minlen: height + depths[v] });
  }
}

function treeDepths(g) {
  const depths = {};
  function dfs(v, depth) {
    const children = g.children(v);
    if (children && children.length) {
      children.forEach(child => dfs(child, depth + 1));
    }
    depths[v] = depth;
  }
  g.children().forEach(v => dfs(v, 1));
  return depths;
}

function sumWeights(g) {
  return g.edges().reduce((acc, e) => acc + g.edge(e).weight, 0);
}

function cleanup(g) {
  const graphLabel = g.graph();
  g.removeNode(graphLabel.nestingRoot);
  delete graphLabel.nestingRoot;
  g.edges().forEach(e => {
    const edge = g.edge(e);
    if (edge.nestingEdge) {
      g.removeEdge(e);
    }
  });
}
