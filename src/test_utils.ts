import {CytoscapeEdge, CytoscapeNode, Edge, Elements, Group, Node} from './types';

export const inputNode = (
  id: string,
  service: string,
  {provider = 'aws', attributes = {}, parent = undefined}
): Node => ({
  type: 'node',
  id,
  service,
  provider,
  attributes,
  parent,
});
export const inputGroup = (id: string, elements: Elements, {attributes = {}, parent = undefined}): Group => ({
  type: 'group',
  id,
  attributes,
  elements: elements.map(el => (el.type === 'edge' ? (el as Edge) : {...el, parent: id})),
  parent,
});
export const inputEdge = (
  src: string,
  dst: string,
  deepLink = false,
  bidirectionalLink = false,
  attributes = {}
): Edge => ({
  type: 'edge',
  src,
  dst,
  deepLink,
  bidirectionalLink,
  attributes,
});
export const expectedNode = ({
  id,
  label = id,
  provider,
  service,
  attributes = {},
  parent = undefined,
  classes = 'service',
}: {
  id: string;
  label?: string;
  provider?: string;
  service?: string;
  attributes?: Record<any, any>;
  parent?: string;
  classes?: string;
}): CytoscapeNode => ({
  data: {id, label, provider, service, attributes, parent},
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
  classes,
});
export const expectedEdge = ({
  source,
  target,
  id,
  attributes = {bidirectional: false},
  label = undefined,
}: {
  source: string;
  target: string;
  id: string;
  attributes?: Record<any, any>;
  label?: string;
}): CytoscapeEdge => ({
  data: {source, target, id, attributes, label},
});
