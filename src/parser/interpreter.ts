import {CstNode, IToken} from 'chevrotain';

import {parser} from './parser';

import {
  idLabel,
  elementsLabel,
  elementLabel,
  normalIdentifierLabel,
  quotedIdentifierLabel,
  linkLabel,
  serviceLabel,
  providerLabel,
  groupLabel,
  edgeLabel,
  nodeLabel,
  attrLabel,
  attrNameLabel,
  attrValueLabel,
  attrListLabel,
  bidirectionalArrowLabel,
  deepArrowLabel,
  bidirectionalDeepArrowLabel,
  directedArrowLabel,
} from './labels';
import {Attributes, Diagram, Edges, Elements, Group, Link, Node} from '../types';

const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

interface IdentifierCstNode extends CstNode {
  name: 'identified';
  children: IdentifierCtx;
}

type IdentifierCtx = {[quotedIdentifierLabel]: IToken[]} | {[normalIdentifierLabel]: IToken[]};

interface AttributeCstNode extends CstNode {
  name: 'attribute';
  children: AttributeCtx;
}

type AttributeCtx = {
  [attrNameLabel]: IToken[];
  [attrValueLabel]: IdentifierCstNode[];
};

interface AttributeListCstNode extends CstNode {
  name: 'attrList';
  children: AttributeListCtx;
}

type AttributeListCtx = {
  [attrLabel]?: AttributeCstNode[];
};

interface LinkCstNode extends CstNode {
  name: 'link';
  children: LinkCtx;
}

type LinkCtx =
  | {[directedArrowLabel]: IToken[]}
  | {[bidirectionalArrowLabel]: IToken[]}
  | {[deepArrowLabel]: IToken[]}
  | {[bidirectionalDeepArrowLabel]: IToken[]};

interface GroupCstNode extends CstNode {
  name: 'group';
  children: GroupCtx;
}

type GroupCtx = {
  [idLabel]: IdentifierCstNode[];
  [attrListLabel]: AttributeListCstNode[];
  [elementsLabel]: ElementsCstNode[];
};

interface EdgeCstNode extends CstNode {
  name: 'edge';
  children: EdgeCtx;
}

type EdgeCtx = {
  [idLabel]: IdentifierCstNode[];
  [linkLabel]: LinkCstNode[];
  [attrListLabel]: AttributeListCstNode[];
};

interface NodeCstNode extends CstNode {
  name: 'node';
  children: NodeCtx;
}

type NodeCtx = {
  [idLabel]: IdentifierCstNode[];
  [attrListLabel]: AttributeListCstNode[];
  [providerLabel]: IToken[];
  [serviceLabel]: IToken[];
};

interface ElementCstNode extends CstNode {
  name: 'element';
  children: ElementCtx;
}

type ElementCtx = {[nodeLabel]: NodeCstNode[]} | {[edgeLabel]: EdgeCstNode[]} | {[groupLabel]: GroupCstNode[]};

interface ElementsCstNode extends CstNode {
  name: 'elements';
  children: ElementsCtx;
}

type ElementsCtx = {
  [elementLabel]?: ElementCstNode[];
};

type DiagramCtx = {
  [idLabel]: IdentifierCstNode[];
  [elementsLabel]: ElementsCstNode[];
  [attrListLabel]: AttributeListCstNode[];
};

class DiagramInterpreter extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  diagram(ctx: DiagramCtx): Diagram {
    const elements = this.visit(ctx[elementsLabel]);
    const id = this.visit(ctx[idLabel]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    return {
      id,
      elements,
      attributes,
    };
  }

  elements(ctx: ElementsCtx): Elements {
    return ctx[elementLabel]?.map(n => this.visit(n)).flat() || [];
  }

  element(ctx: ElementCtx): Elements {
    if (nodeLabel in ctx) {
      return this.visit(ctx[nodeLabel]);
    } else if (edgeLabel in ctx) {
      return this.visit(ctx[edgeLabel]);
    } else if (groupLabel in ctx) {
      return this.visit(ctx[groupLabel]);
    }
    return [];
  }

  edge(ctx: EdgeCtx): Edges {
    const ids = ctx[idLabel].map(i => this.visit(i));
    const links = ctx[linkLabel].map(l => this.visit(l));
    const attributes = this.visit(ctx[attrListLabel]) || {};
    const edges = [];
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({
        type: 'edge',
        src: ids[i],
        dst: ids[i + 1],
        ...links[i],
        attributes,
      });
    }
    return edges;
  }

  node(ctx: NodeCtx): Node {
    const provider = ctx[providerLabel][0].image;
    const service = ctx[serviceLabel][0].image;
    const id = this.visit(ctx[idLabel]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    return {
      type: 'node',
      id,
      provider,
      service,
      attributes,
      parent: undefined,
    };
  }

  group(ctx: GroupCtx): Group {
    const id = this.visit(ctx[idLabel][0]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    const elements = this.visit(ctx[elementsLabel]).map((e: any) => ({
      ...e,
      parent: id,
    }));
    return {
      type: 'group',
      id,
      elements,
      attributes,
      parent: undefined,
    };
  }

  identifier(ctx: IdentifierCtx): string {
    return quotedIdentifierLabel in ctx
      ? ctx[quotedIdentifierLabel][0].image.slice(1).slice(0, -1)
      : ctx[normalIdentifierLabel][0].image;
  }

  link(ctx: LinkCtx): Link {
    return {
      deepLink: deepArrowLabel in ctx || bidirectionalDeepArrowLabel in ctx,
      bidirectionalLink: bidirectionalArrowLabel in ctx || bidirectionalDeepArrowLabel in ctx,
    };
  }

  attrList(ctx: AttributeListCtx): Attributes {
    return ctx[attrLabel]?.map(a => this.visit(a)).reduce((acc, a) => ({...acc, ...a}), {}) || {};
  }

  attribute(ctx: AttributeCtx): Attributes {
    const name = ctx[attrNameLabel][0].image;
    const value = this.visit(ctx[attrValueLabel][0]);
    return {[name]: value};
  }
}

export const interpreter = new DiagramInterpreter();
