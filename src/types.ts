import cytoscape, {ExportBlobOptions} from 'cytoscape';

export interface CytoscapeSvg extends cytoscape.Core {
  svg(options?: ExportBlobOptions): Blob;
}

export interface Error {
  message: string;
  line: {start?: number; end?: number};
  column: {start?: number; end?: number};
}

export type Attributes = Record<string, string>;

export interface Link {
  deepLink: boolean;
  bidirectionalLink: boolean;
}

export interface Node {
  type: 'node';
  id: string;
  provider: string;
  service: string;
  attributes: Attributes;
  parent?: string;
}

export interface Edge extends Link {
  type: 'edge';
  src: string;
  dst: string;
  attributes: Attributes;
}
export type Edges = Edge[];

export interface Group {
  type: 'group';
  id: string;
  attributes: Attributes;
  elements: Elements;
  parent?: string;
}

export type Element = Node | Edge | Group;
export type Elements = Element[];

export interface Diagram {
  id: string;
  attributes: Attributes;
  elements: Elements;
}

export interface CytoscapeNodeData {
  id: string;
  label: string;
  parent?: string;
  provider?: string;
  service?: string;
  attributes: Record<string, any>;
}

export interface CytoscapeNode {
  data: CytoscapeNodeData;
  classes: string;
  selected: boolean;
  selectable: boolean;
  locked: boolean;
  grabbable: boolean;
}

export interface CytoscapeEdgeData {
  source: string;
  target: string;
  id: string;
  label?: string;
  attributes: Record<string, any>;
}

export interface CytoscapeEdge {
  data: CytoscapeEdgeData;
}
