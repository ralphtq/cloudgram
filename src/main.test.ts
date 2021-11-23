import cytoscape from 'cytoscape';
import {saveAs} from 'file-saver';
import {Blob} from 'buffer';
import {CytoscapeSvg} from './types';

jest.mock('cytoscape');
jest.mock('file-saver');
jest.mock('./es_utils.ts');
jest.mock('./icons/aws.ts');
jest.mock('./icons/azure.ts');
jest.mock('./icons/gcp.ts');
jest.mock('./icons/generic.ts');
jest.mock('./icons/index.ts');
jest.mock('./icons/k8s.ts');

const validDocument = `
diagram "complete" {
  // creating the nodes
  aws.route53 dns;
  aws.cloudfront cf;
  aws.lambda edge;

  // creating the edges
  dns -> cf;
  cf -> edge;
}
`;

const invalidDocument = `
diagram "complete" {
  aws.route53 dns;
  aws.cloudfront cf;
  aws.lambda edge;

  // missing semi colon will generate an error
  dns -> cf
  cf -> edge;
}
`;

const svgContent = '<svg></svg>';
const blob = new Blob(['']);

const mockCy = (): CytoscapeSvg => {
  const cy = {
    png: jest.fn().mockReturnValue(blob),
    jpg: jest.fn().mockReturnValue(blob),
    svg: jest.fn().mockReturnValue(svgContent),
  };

  const originalWindow = {...window};
  const windowSpy = jest.spyOn(global, 'window', 'get');
  // @ts-ignore
  windowSpy.mockImplementation(() => ({
    ...originalWindow,
    cy: cy,
  }));

  // @ts-ignore
  return cy;
};

describe('refresh', () => {
  let refresh: () => void;
  let editor: any;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '<div id="editor"></div>';

    // we require the index after mocking the document
    // body so that ace can find the editor div
    const index = require('./main');
    refresh = index.draw;
    editor = index.editor;
  });

  it('draws the diagram from the editor and reset errors', () => {
    const annotationSetter = jest.fn();
    jest.spyOn(editor, 'getSession').mockImplementation(() => ({
      getDocument: jest.fn().mockImplementation(() => ({
        getValue: jest.fn().mockImplementation(() => validDocument),
      })),
      setAnnotations: annotationSetter,
    }));

    refresh();

    const expectedElements = {
      nodes: [
        {
          data: {
            id: 'dns',
            label: 'dns',
            provider: 'aws',
            service: 'route53',
            parent: undefined,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: 'service',
        },
        {
          data: {
            id: 'cf',
            label: 'cf',
            provider: 'aws',
            service: 'cloudfront',
            parent: undefined,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: 'service',
        },
        {
          data: {
            id: 'edge',
            label: 'edge',
            provider: 'aws',
            service: 'lambda',
            parent: undefined,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: 'service',
        },
      ],
      edges: [
        {
          data: {
            source: 'dns',
            target: 'cf',
            id: expect.any(String),
            label: undefined,
            attributes: {
              bidirectional: false,
            },
          },
        },
        {
          data: {
            source: 'cf',
            target: 'edge',
            id: expect.any(String),
            label: undefined,
            attributes: {
              bidirectional: false,
            },
          },
        },
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.any(Object),
      style: expect.any(Object),
    });

    expect(annotationSetter).toHaveBeenCalledWith([]);
  });

  it('shows errors in the editor', () => {
    const annotationSetter = jest.fn();
    jest.spyOn(editor, 'getSession').mockImplementation(() => ({
      getDocument: jest.fn().mockImplementation(() => ({
        getValue: jest.fn().mockImplementation(() => invalidDocument),
      })),
      setAnnotations: annotationSetter,
    }));

    refresh();

    expect(cytoscape).toHaveBeenCalledTimes(0);

    const expectedErrors = [
      {
        column: 3,
        row: 8,
        text: "Expecting --> ';' <-- but found --> 'cf' <--",
        type: 'error',
      },
    ];
    expect(annotationSetter).toHaveBeenCalledWith(expectedErrors);
  });
});

describe('link', () => {
  let copyLink: () => string;
  let editor: any;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '<div id="editor"></div>';

    // we require the index after mocking the document
    // body so that ace can find the editor div
    const index = require('./main');
    copyLink = index.copyLink;
    editor = index.editor;
  });

  it('copy the link to the diagram', () => {
    jest.spyOn(editor, 'getSession').mockImplementation(() => ({
      getDocument: jest.fn().mockImplementation(() => ({
        getValue: jest.fn().mockImplementation(() => validDocument),
      })),
    }));
    document.execCommand = jest.fn();

    const url = copyLink();

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // we cannot test the actual clipboard copy so the next best
    // thing is testing that the url returned is correct
    expect(url).toEqual(
      'http://localhost/index.html?document=%0Adiagram%20%22complete%22%20%7B%0A%20%20%2F%2F%20creating%20the%20nodes%0A%20%20aws.route53%20dns%3B%0A%20%20aws.cloudfront%20cf%3B%0A%20%20aws.lambda%20edge%3B%0A%0A%20%20%2F%2F%20creating%20the%20edges%0A%20%20dns%20-%3E%20cf%3B%0A%20%20cf%20-%3E%20edge%3B%0A%7D%0A'
    );
  });
});

describe('save graph', () => {
  let cy: CytoscapeSvg;

  beforeEach(() => {
    jest.clearAllMocks();
    cy = mockCy();
  });

  it('saves the graph as png', () => {
    document.body.innerHTML = `
      <select id="format">
        <option selected="">png</option>
        <option>jpeg</option>
        <option>svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('./main').saveGraph();

    expect(cy.png).toHaveBeenCalledWith({output: 'blob', scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(blob, expect.stringMatching(/\.png$/));
  });

  it('saves the graph as jpg', () => {
    document.body.innerHTML = `
      <select id="format">
        <option>png</option>
        <option selected="">jpeg</option>
        <option>svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('./main').saveGraph();

    expect(cy.jpg).toHaveBeenCalledWith({output: 'blob', scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(blob, expect.stringMatching(/\.jpeg$/));
  });

  it('saves the graph as svg', () => {
    document.body.innerHTML = `
      <select id="format">
        <option>png</option>
        <option>jpeg</option>
        <option selected="">svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('./main').saveGraph();

    expect(cy.svg).toHaveBeenCalledWith({scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/\.svg$/));
  });
});

describe('init document', () => {
  let editor: any;
  let initDocument: () => void;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '<div id="editor"></div>';

    const index = require('./main');
    editor = index.editor;
    initDocument = index.initDocument;
  });

  it('sets the editor content from the document query parameter', () => {
    history.replaceState({}, 'Index', '/index.html?document=diagram');
    const spy = jest.spyOn(editor, 'setValue').mockImplementation(() => ({}));

    initDocument();

    expect(spy).toHaveBeenCalledWith('diagram', -1);
  });

  it('uses the code in the html is no document defined', () => {
    history.replaceState({}, 'Index', '/index.html');
    const spy = jest.spyOn(editor, 'setValue').mockImplementation(() => ({}));

    initDocument();

    expect(spy).not.toHaveBeenCalled();
  });
});
