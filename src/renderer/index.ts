/*
It receives the output from the parser and render it thanks to cytoscape.

It defines a single entrypoint, the `render` function.
*/

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';
import {getNodesAndEdges} from './transform';
import {Attributes, CytoscapeSvg, Diagram} from '../types';

cytoscape.use(dagre);

enum Direction {
  TB = 'tb',
  LR = 'lr',
}

enum LabelPosition {
  N = 'n',
  S = 's',
  E = 'e',
  W = 'w',
  NE = 'ne',
  NW = 'nw',
  SE = 'se',
  SW = 'sw',
}

export const getBackgroundColor = (e: cytoscape.CoreData): string => e.data()?.attributes?.fill || '#eee';
export const getBorderStyle = (e: cytoscape.CoreData): cytoscape.Css.LineStyle =>
  e.data()?.attributes?.style || 'dashed';
export const getBorderWidth = (e: cytoscape.CoreData): number => e.data()?.attributes?.width || 1;
export const getOpacity = (e: cytoscape.CoreData): number => e.data()?.attributes?.opacity || 1.0;
export const getColor = (e: cytoscape.CoreData): string => e.data()?.attributes?.stroke || '#ccc';
export const getEdgeStyle = (e: cytoscape.CoreData): cytoscape.Css.LineStyle => e.data()?.attributes?.style || 'solid';
export const getEdgeWidth = (e: cytoscape.CoreData): number => e.data()?.attributes?.width || 2;

const arrowStyle = (arrow: boolean): cytoscape.Css.ArrowShape => (arrow ? 'triangle' : 'none');
export const getSourceArrowStyle = (e: cytoscape.EdgeSingular): cytoscape.Css.ArrowShape =>
  arrowStyle(e.data()?.attributes?.bidirectional || false);

const getIcon = ({provider = 'generic', service = 'component'}: {provider?: string; service?: string}): string =>
  // @ts-ignore
  iconMap[provider][service];
export const getIconForNode = (e: cytoscape.NodeSingular): string => getIcon(e.data());

export const getDirection = (attr: Attributes): Direction =>
  Object.values(Direction).find(v => v === attr?.direction?.toLowerCase()) || Direction.TB;

type VPos = 'top' | 'center' | 'bottom';
const getVerticalPosition = (p: LabelPosition): VPos => {
  switch (p) {
    case LabelPosition.N:
    case LabelPosition.NE:
    case LabelPosition.NW:
      return 'top';
    case LabelPosition.E:
    case LabelPosition.W:
      return 'center';
    case LabelPosition.S:
    case LabelPosition.SE:
    case LabelPosition.SW:
      return 'bottom';
  }
};

type HPos = 'left' | 'center' | 'right';
const getHorizontalPosition = (p: LabelPosition): HPos => {
  switch (p) {
    case LabelPosition.NE:
    case LabelPosition.E:
    case LabelPosition.SE:
      return 'left';
    case LabelPosition.N:
    case LabelPosition.S:
      return 'center';
    case LabelPosition.NW:
    case LabelPosition.W:
    case LabelPosition.SW:
      return 'right';
  }
};
const getLabelPosition = (e: cytoscape.NodeSingular): LabelPosition =>
  Object.values(LabelPosition || {}).find(v => v === e.data()?.attributes?.labelPosition?.toLowerCase()) ||
  LabelPosition.N;
export const getHPosForNode = (e: cytoscape.NodeSingular): HPos => getHorizontalPosition(getLabelPosition(e));
export const getVPosForNode = (e: cytoscape.NodeSingular): VPos => getVerticalPosition(getLabelPosition(e));

export const render = ({elements, attributes}: Diagram) =>
  cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    elements: getNodesAndEdges(elements),
    layout: {
      // @ts-ignore
      name: 'dagre',
      rankDir: getDirection(attributes),
      spacingFactor: 2,
    },
    style: [
      {
        selector: 'node',
        style: {
          shape: 'round-rectangle',
          label: 'data(label)',
          'text-valign': getVPosForNode,
          'text-halign': getHPosForNode,
        },
      },
      {
        selector: '.service',
        style: {
          height: 80,
          width: 80,
          'background-image': getIconForNode,
          'background-opacity': 0.0,
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'control-point-step-size': 40,
          width: getEdgeWidth,
          'line-color': getColor,
          'line-style': getEdgeStyle,
          'source-arrow-shape': getSourceArrowStyle,
          'target-arrow-shape': 'triangle',
          'source-endpoint': 'outside-to-node-or-label',
          'target-endpoint': 'outside-to-node-or-label',
        },
      },
      {
        selector: 'edge[label]',
        style: {
          label: 'data(label)',
          'text-rotation': 'autorotate',
          'text-margin-x': 0,
          'text-margin-y': -15,
        },
      },
      {
        selector: 'node:parent',
        style: {
          'background-color': getBackgroundColor,
          'border-color': getColor,
          'background-opacity': getOpacity,
          'border-style': getBorderStyle,
          'border-width': getBorderWidth,
          'text-valign': getVPosForNode,
          'text-halign': getHPosForNode,
        },
      },
    ],
  }) as CytoscapeSvg;
