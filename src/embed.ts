import {drawDocument} from './draw';
import {getDocumentFromUrl} from './utils';
import {Error} from './types';

const displayError = ({message}: {message: string}) => {
  const errorEl = document.createElement('p');
  errorEl.classList.add('error');
  errorEl.innerText = message;
  document.getElementById('cy')!.appendChild(errorEl);
};

const emptyDocumentError = () => displayError({message: 'Empty document'});
const parseError = (errors: Error[]) => displayError({message: `Document parse error: ${errors[0].message}`});

export const draw = () => {
  const src = getDocumentFromUrl();

  if (!src) {
    emptyDocumentError();
    return;
  }

  drawDocument(src, parseError);
};

document.addEventListener('DOMContentLoaded', draw);
