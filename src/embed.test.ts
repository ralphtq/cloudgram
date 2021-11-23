jest.mock('./icons/aws.ts');
jest.mock('./icons/azure.ts');
jest.mock('./icons/gcp.ts');
jest.mock('./icons/generic.ts');
jest.mock('./icons/index.ts');
jest.mock('./icons/k8s.ts');

import {draw} from './embed';

describe('errors', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cy"></div>';
  });

  it('displays an error when no document is present in query', () => {
    draw();
    const errorEl = document.querySelector('#cy > p');
    expect(errorEl).not.toBeNull();
    expect(errorEl?.classList.contains('error')).toBeTruthy();
    expect((errorEl as HTMLElement).innerText.toLowerCase()).toContain('empty');
  });

  it('displays a parsing error', () => {
    history.replaceState({}, 'Embed', '/embed.html?document=diagram');

    draw();

    const errorEl = document.querySelector('#cy > p');
    expect(errorEl).not.toBeNull();
    expect(errorEl?.classList.contains('error')).toBeTruthy();
    expect((errorEl as HTMLElement).innerText.toLowerCase()).toContain('parse');
  });
});
