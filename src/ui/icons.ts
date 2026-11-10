/** Small inline icons (24×24, outline). Own drawings, no icon library (no extra dependency). */
const paths: Record<string, string> = {
  garden: 'M12 21v-7M12 14c-4 0-6-3-6-7 4 0 6 3 6 7Zm0 0c4 0 6-3 6-7-4 0-6 3-6 7ZM5 21h14',
  insights: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  theme: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z M12 3v18 M12 8l4.5-3 M12 13l7-5 M12 18l7.5-5',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4L10.7 6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
};

export function icon(name: keyof typeof paths): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', paths[name] as string);
  svg.append(path);
  return svg;
}

export type IconName = keyof typeof paths;
