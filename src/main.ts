/*
Entrypoint for the app

The starting point is the `draw` method performing the following tasks:
- get the document from the ACE editor
- pass the documented to the parser
- pass the parsed document to the renderer

Upon loading of the page an event listener is setup for changes in the
editor that will trigger a redraw.
*/

import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';
import {saveAs} from 'file-saver';
import cytoscape from 'cytoscape';
// @ts-ignore
import svg from 'cytoscape-svg';

import {initSentry} from './es_utils';
initSentry();

import {drawDocument} from './draw';
import {drawVersion} from './es_utils';
import {getDocumentFromUrl} from './utils';
import {Mode} from './editor';
import {staticWordCompleter, textCompleter} from './editor/completion';
import {CytoscapeSvg, Error} from './types';

declare global {
  interface Window {
    cy: CytoscapeSvg;
  }
}

cytoscape.use(svg);

// exported to be mocked by tests
export const editor = ace.edit('editor', {
  theme: 'ace/theme/chrome',
  // @ts-ignore
  mode: new Mode(),
  // @ts-ignore
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  showPrintMargin: false,
});
editor.completers = [staticWordCompleter, textCompleter];

const displayErrors = (errors: Error[]) =>
  editor.getSession().setAnnotations(
    errors.map(e => ({
      row: (e.line.start ?? 1) - 1,
      column: e.column.start,
      text: e.message,
      type: 'error',
    }))
  );

const getDocument = () => editor.getSession().getDocument().getValue();
const setDocument = (document: string) => editor.setValue(document, -1);
const documentUrl = (path = 'index.html') =>
  `${location.protocol}//${location.host}/${path}?document=${encodeURIComponent(getDocument())}`;

const referenceWidth = 400;
const getGraphAspectRatio = () =>
  window.cy.elements().renderedBoundingBox({}).w / window.cy.elements().renderedBoundingBox({}).h;
const getIFrameHeight = () => Math.round(referenceWidth / getGraphAspectRatio());

const displayModal = () => {
  console.log(getGraphAspectRatio());
  (
    document.querySelector('#embed-modal pre')! as HTMLElement
  ).innerText = `<iframe width="${referenceWidth}px" height="${getIFrameHeight()}px" src="${documentUrl(
    'embed.html'
  )}"></iframe>`;
  document.getElementById('embed-modal')!.style.display = 'block';
  document.getElementById('embed')!.onclick = null;
};
const closeModal = () => {
  document.getElementById('embed-modal')!.style.display = 'none';
  document.getElementById('embed')!.onclick = displayModal;
};

export const saveGraph = () => {
  // @ts-ignore
  const cy = window.cy;
  const selectEl = document.getElementById('format') as HTMLSelectElement;
  const format = selectEl!.options[selectEl.selectedIndex].value;

  let imgBlob;
  switch (format) {
    case 'svg':
      const svgContent = cy.svg({scale: 1, full: true});
      imgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
      break;
    case 'jpeg':
      imgBlob = cy.jpg({output: 'blob', scale: 1, full: true});
      break;
    default:
      imgBlob = cy.png({output: 'blob', scale: 1, full: true});
      break;
  }

  saveAs(imgBlob, `graph.${format}`);
};

export const copyToClipboard = (text: string) => {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const copyLink = (): string => {
  const url = documentUrl();
  copyToClipboard(url);
  return url;
};

export const initDocument = () => {
  const doc = getDocumentFromUrl();
  if (doc) setDocument(doc);
};

export const draw = () => {
  const src = getDocument();
  editor.getSession().setAnnotations([]);
  drawDocument(src, displayErrors);
};

export const setup = () => {
  // redraw on editor changes
  // @ts-ignore
  editor.getSession().on('change', draw);

  // hook up navbar actions
  document.getElementById('save')!.onclick = saveGraph;
  document.getElementById('copy-link')!.onclick = copyLink;
  document.getElementById('embed')!.onclick = displayModal;

  // modal dismissal
  (document.getElementsByClassName('close')[0] as HTMLElement).onclick = closeModal;
  window.onclick = event => {
    if (event.target === document.getElementById('embed-modal')) closeModal();
  };
};

document.addEventListener('DOMContentLoaded', function () {
  initDocument();
  drawVersion();
  draw();
  setup();
});
