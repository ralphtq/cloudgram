// parse the document and renders it
import {parse} from './parser';
import {render} from './renderer';
import {Error} from './types';

export const drawDocument = (src: string, errorsCallback?: (errors: Error[]) => void) => {
  const {parsed, errors} = parse(src);

  if (errorsCallback && errors && errors.length > 0) {
    errorsCallback(errors);
    return;
  }

  if (!parsed) return;
  window.cy = render(parsed);
};
