// Strip protocol, www, paths, and trailing slashes from a domain string
// "https://www.drcraigortho.com/" -> "drcraigortho.com"
export const cleanDomain = (raw: string): string => {
  return raw
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
};

// Convert a domain to a slug (dots become dashes): "drcraigortho.com" -> "drcraigortho-com"
// Also handles full URLs: "https://www.drcraigortho.com/" -> "drcraigortho-com"
export const domainToSlug = (raw: string): string => {
  return cleanDomain(raw).replace(/\./g, '-');
};
