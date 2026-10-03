import { Chromiumly } from './Chromiumly';
import { UrlConverter } from './UrlConvert';

describe('Chromiumly', () => {
  const originalGotenbergUrl = process.env.GOTENBERG_URL;
  const originalGotenbergDocsUrl = process.env.GOTENBERG_DOCS_URL;

  afterEach(() => {
    if (originalGotenbergUrl === undefined) {
      delete process.env.GOTENBERG_URL;
    } else {
      process.env.GOTENBERG_URL = originalGotenbergUrl;
    }
    if (originalGotenbergDocsUrl === undefined) {
      delete process.env.GOTENBERG_DOCS_URL;
    } else {
      process.env.GOTENBERG_DOCS_URL = originalGotenbergDocsUrl;
    }
  });

  it('reads the Gotenberg endpoint when a converter is created', () => {
    process.env.GOTENBERG_URL = 'http://127.0.0.1:9000';

    expect(new UrlConverter().endpoint).toBe(
      'http://127.0.0.1:9000/forms/chromium/convert/url',
    );
  });

  it('builds an absolute document URL without corrupting the protocol', () => {
    process.env.GOTENBERG_DOCS_URL = 'http://host.docker.internal:3000/public/';

    expect(Chromiumly.getDocumentUrl('/pdf/invoice.html')).toBe(
      'http://host.docker.internal:3000/public/pdf/invoice.html',
    );
  });

  it('fails clearly when the document endpoint is missing', () => {
    delete process.env.GOTENBERG_DOCS_URL;

    expect(() => Chromiumly.getDocumentUrl('/pdf/invoice.html')).toThrow(
      'GOTENBERG_DOCS_URL is not configured.',
    );
  });
});
