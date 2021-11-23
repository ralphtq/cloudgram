import {arrayDiff, uniqBy} from '../utils';
import {CytoscapeEdge, CytoscapeNode, Edge, Element, Elements, Group, Node} from '../types';

const isGroupElement = (el: Element): el is Group => el.type === 'group';
const isNodeElement = (el: Element): el is Node => el.type === 'node';
const isEdgeElement = (el: Element): el is Edge => el.type === 'edge';
const hasEdgeElements = (el: Group) => el.elements && el.elements.filter(e => !isEdgeElement(e)).length;

const getLabel = (el: Element) => el.attributes['label'];
const getNodeClasses = (el: Group | Node) => (isNodeElement(el) ? 'service' : '');

interface Separated {
  nodes: (Node | Group)[];
  edges: Edge[];
}

const processNode = (node: Node | Group): CytoscapeNode => ({
  data: {
    id: node.id,
    label: getLabel(node) ?? node.id,
    parent: node.parent,
    provider: 'provider' in node ? node.provider : undefined,
    service: 'service' in node ? node.service : undefined,
    attributes: node.attributes,
  },
  classes: getNodeClasses(node),
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
});

const processEdge = (edge: Edge): CytoscapeEdge => ({
  data: {
    source: edge.src,
    target: edge.dst,
    id: `${edge.src}-${edge.dst}`,
    label: getLabel(edge), // unlike nodes edges don't have a default label unless explicitly set
    attributes: {...edge.attributes, bidirectional: edge.bidirectionalLink},
  },
});

// merges two sets of nodes and edges
const mergeNodesAndEdges = (
  {nodes: currentNodes, edges: currentEdges}: Separated,
  {nodes: newNodes, edges: newEdges}: Separated
) => ({
  nodes: [...currentNodes, ...newNodes],
  edges: [...currentEdges, ...newEdges],
});

/**
 * Takes an element from the parser and divide it into either a node or an edge
 * In case the input element is a group, which contains other element, it will recursively
 * traverse the group children and divide them among nodes and edges
 */
const separateElement = (element: Element): Separated => {
  switch (element.type) {
    case 'node':
      return {nodes: [element], edges: []};
    case 'group':
      return element['elements'].map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [element], edges: []});
    case 'edge':
      return {nodes: [], edges: [element]};
    default:
      throw new Error(`Unknown element ${element['type']}`);
  }
};

const separateElements = (elements: Elements): Separated =>
  elements.map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [], edges: []});

/**
 * Take a list of nodes and edges and creates nodes for any edge referencing
 * a non existing node as a source or destination.
 *
 * This is a nicety so that while editing in the editor a typo in the name of
 * node in an edge definition will not cause an error but an empty and well
 * recognisable node will be automatically created
 */
const addMissingNodes = ({nodes, edges}: Separated): Separated => {
  const edgeEnds = [...edges.map(e => e.src), ...edges.map(e => e.dst)];
  const nodesIds = nodes.map(e => e.id);
  return {
    nodes: [
      ...nodes,
      ...arrayDiff(edgeEnds, nodesIds).map(
        id =>
          ({
            type: 'node',
            id,
            parent: undefined,
            provider: 'generic',
            service: 'generic',
            attributes: {},
          } as Node)
      ),
    ],
    edges,
  };
};

/**
 * Remove all duplicate nodes and edges. A node is considered duplicate by its id
 * while an edge is considered duplicate if its source, destination, deepLink and bidirectionalLink
 * type are equal
 */
const removeDuplicates = ({nodes, edges}: Separated): Separated => ({
  nodes: uniqBy(nodes),
  edges: uniqBy(edges, ({src, dst, deepLink, bidirectionalLink}) => `${src}-${dst}-${deepLink}-${bidirectionalLink}`),
});

/**
 * It traverse the defined edges and for any deep edge, i.e. an edge with deepLink flag equal to true,
 * it substitute the edge with a list of edges pointing to the children of the destination node if any.
 */
const explodeEdges = ({nodes, edges}: Separated): Separated => {
  const nodesMap = nodes.reduce((acc, n) => ({...acc, [n['id']]: n}), {} as Record<string, Node | Group>);
  return {
    nodes,
    edges: edges
      .map(edge => {
        if (!edge.deepLink) return edge;
        if (!isGroupElement(nodesMap[edge.dst])) return edge;

        // if the group has no children there is nothing to link into
        const group = nodesMap[edge.dst] as Group;
        if (!hasEdgeElements(group)) return edge;

        return group.elements
          .filter(el => !isEdgeElement(el))
          .map(e => e as Node | Group)
          .map(({id}) => ({...edge, dst: id, deepLink: false}));
      })
      .flat(),
  };
};

const preprocessElements = (elements: Elements): Separated =>
  explodeEdges(removeDuplicates(addMissingNodes(separateElements(elements))));

export const getNodesAndEdges = (elements: Elements): {nodes: CytoscapeNode[]; edges: CytoscapeEdge[]} => {
  const {nodes, edges} = preprocessElements(elements);
  return {
    nodes: nodes.map(processNode),
    edges: edges.map(processEdge),
  };
};
