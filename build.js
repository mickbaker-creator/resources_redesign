#!/usr/bin/env node
/**
 * build.js
 * Assembles the 6 WordPress HTML block files into a single
 * dist/index.html for Vercel preview.
 *
 * — <style> is extracted from 00-styles.html and placed in <head>
 * — Blocks 01–05 are concatenated in <body>
 * — WP media image placeholders are swapped for Unsplash preview
 *   URLs so the carousel renders without a WordPress media library.
 *
 * In WordPress: upload the 3 report images to Media Library and
 * update the src paths in 01-hero.html.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── Preview image substitutions ───────────────────────────────
   Left side:  placeholder paths used in the WP block files
   Right side: Unsplash URLs used in the Vercel preview only
─────────────────────────────────────────────────────────────── */
const IMAGE_SUBS = {
  '/wp-content/uploads/2025/05/hiring-snapshot-report-cover.jpg':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=800&fit=crop',
  '/wp-content/uploads/2025/05/hiring-snapshot-report-key-findings.jpg':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=800&fit=crop',
  '/wp-content/uploads/2025/05/hiring-snapshot-report-chart.jpg':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=800&fit=crop',
  '/wp-content/uploads/2025/05/hiring-snapshot-report-cover-thumb.jpg':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=260&fit=crop',
  '/wp-content/uploads/2025/05/hiring-snapshot-report-key-findings-thumb.jpg':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=260&fit=crop',
  '/wp-content/uploads/2025/05/hiring-snapshot-report-chart-thumb.jpg':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=260&fit=crop',
};

/* ── Block files (in render order) ─────────────────────────── */
const BLOCKS = [
  '00-styles.html',
  '01-hero.html',
  '02-content.html',
  '03-related.html',
  '04-form-tray.html',
  '05-scripts.html',
];

/* ── Helpers ─────────────────────────────────────────────────── */
function read(filename) {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8');
}

function applyImageSubs(html) {
  return Object.entries(IMAGE_SUBS).reduce(
    (acc, [wp, preview]) => acc.split(wp).join(preview),
    html
  );
}

/* ── WordPress design token fallbacks ───────────────────────────
   var(--wp--preset--*) variables are only injected by the WP theme
   engine. Without this block the Vercel preview renders unstyled
   (no colour, no spacing, browser-default fonts).
   WordPress's own definitions override these at higher specificity,
   so they have no effect when the page runs inside WordPress.
─────────────────────────────────────────────────────────────── */
const WP_TOKEN_FALLBACKS = `
/* ── WP preset token fallbacks (Vercel preview only) ── */
:root {
  /* Core */
  --wp--preset--color--black:     #000000;
  --wp--preset--color--white:     #FFFFFF;
  --wp--preset--color--off-black: #121214;
  --wp--preset--color--off-white: #FCFBFF;
  --wp--preset--color--dark-grey: #545454;

  /* Neutral */
  --wp--preset--color--neutral-800: #27272A;
  --wp--preset--color--neutral-700: #3F3F46;
  --wp--preset--color--neutral-500: #71717A;
  --wp--preset--color--neutral-400: #A9A9B2;
  --wp--preset--color--neutral-200: #E4E4E7;
  --wp--preset--color--neutral-100: #F4F4F5;

  /* Violet */
  --wp--preset--color--dark-violet:      #280541;
  --wp--preset--color--deep-violet:      #460078;
  --wp--preset--color--violet-500:       #7622D7;
  --wp--preset--color--primary-violet:   #A569FF;
  --wp--preset--color--violet-400:       #BB91EB;
  --wp--preset--color--light-violet-500: #9A58FC;
  --wp--preset--color--light-violet-450: #A669F8;
  --wp--preset--color--light-violet-400: #B382FD;
  --wp--preset--color--light-violet-300: #CDACFE;
  --wp--preset--color--light-violet-200: #E6D5FE;
  --wp--preset--color--light-violet-50:  #F9F5FF;
  --wp--preset--color--light-violet-10:  #F2E9FB;

  /* Neon Green */
  --wp--preset--color--neon-green-800: #4F8203;
  --wp--preset--color--neon-green-700: #67AA03;
  --wp--preset--color--neon-green-500: #94E022;
  --wp--preset--color--neon-green-400: #BAFC58;
  --wp--preset--color--neon-green-200: #DDFEAC;
  --wp--preset--color--neon-green-100: #EEFED5;

  /* Sky Blue */
  --wp--preset--color--sky-600: #0098C7;
  --wp--preset--color--sky-500: #00B4EB;
  --wp--preset--color--sky-400: #40D1FF;
  --wp--preset--color--sky-300: #70DDFF;
  --wp--preset--color--sky-200: #A0E8FF;
  --wp--preset--color--sky-100: #CFF4FF;

  /* Orange */
  --wp--preset--color--orange-700: #DC6204;
  --wp--preset--color--orange-600: #F67A0E;
  --wp--preset--color--orange-500: #FFA000;
  --wp--preset--color--orange-300: #FFD080;
  --wp--preset--color--orange-200: #FFE7BF;
  --wp--preset--color--orange-100: #FFF0D5;

  /* Semantic */
  --wp--preset--color--error-700: #BD2D09;
  --wp--preset--color--error-600: #DE350B;
  --wp--preset--color--error-500: #EB5537;
  --wp--preset--color--error-400: #F88371;
  --wp--preset--color--error-100: #FEE5E2;
  --wp--preset--color--success-700: #017D6D;
  --wp--preset--color--success-600: #019788;
  --wp--preset--color--success-500: #01B39C;
  --wp--preset--color--success-400: #49D0BF;
  --wp--preset--color--success-100: #D1FAF5;

  /* Gradients */
  --wp--preset--gradient--white-to-lv-50:
    linear-gradient(180deg, #FFFFFF 0%, #F9F5FF 100%);
  --wp--preset--gradient--white-to-lv-200:
    linear-gradient(180deg, #FFFFFF 0%, #E6D5FE 100%);
  --wp--preset--gradient--white-to-lv-300:
    linear-gradient(180deg, #FFFFFF 0%, #CDACFE 100%);
  --wp--preset--gradient--lv-200-to-lv-500:
    linear-gradient(135deg, #E6D5FE 0%, #9A58FC 100%);
  --wp--preset--gradient--dark-violet-to-off-black:
    radial-gradient(ellipse at top, #280541 0%, #121214 100%);
  --wp--preset--gradient--dark-violet-to-off-black-h:
    linear-gradient(90deg, #280541 0%, #121214 100%);
  --wp--preset--gradient--ai-gradient:
    linear-gradient(135deg, #7622D7 0%, #00B4EB 50%, #94E022 100%);
  --wp--preset--gradient--green-to-dark-green:
    linear-gradient(135deg, #BAFC58 0%, #4F8203 100%);
  --wp--preset--gradient--off-white-to-white:
    linear-gradient(180deg, #FCFBFF 0%, #FFFFFF 100%);

  /* Font families
     Saiga is a custom font served by the WP theme — falls back to
     DM Sans (loaded via @import above) outside of WordPress. */
  --wp--preset--font-family--default: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --wp--preset--font-family--heading: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Font sizes */
  --wp--preset--font-size--xs:  0.75rem;
  --wp--preset--font-size--sm:  0.875rem;
  --wp--preset--font-size--md:  1rem;
  --wp--preset--font-size--lg:  1.125rem;
  --wp--preset--font-size--xl:  1.5rem;
  --wp--preset--font-size--2-xl: 1.75rem;
  --wp--preset--font-size--3-xl: 2.25rem;
  --wp--preset--font-size--4-xl: 2.625rem;
  --wp--preset--font-size--5-xl: 2.75rem;
  --wp--preset--font-size--6-xl: 4rem;
  --wp--preset--font-size--heading-1-4xl: clamp(2.5rem, 5vw,   5rem);
  --wp--preset--font-size--heading-1-3xl: clamp(2.5rem, 4vw,   4rem);
  --wp--preset--font-size--heading-2-2xl: clamp(2rem,   3.5vw, 3.75rem);
  --wp--preset--font-size--heading-2-xl:  clamp(2rem,   2.5vw, 2.625rem);
  --wp--preset--font-size--heading-3-l:   clamp(1.5rem, 2vw,   1.75rem);
  --wp--preset--font-size--heading-4-m:   clamp(1.125rem, 1.5vw, 1.5rem);
  --wp--preset--font-size--heading-5-s:   1.125rem;
  --wp--preset--font-size--paragraph-1-l: clamp(1.125rem, 1.5vw, 1.5rem);
  --wp--preset--font-size--paragraph-2-m: clamp(1rem,   1.25vw, 1.125rem);
  --wp--preset--font-size--paragraph-3-s: clamp(0.875rem, 1vw,  1rem);
  --wp--preset--font-size--paragraph-4-xs: 0.875rem;
  --wp--preset--font-size--paragraph-5-xxs: 0.75rem;

  /* Spacing */
  --wp--preset--spacing--1:  0.25rem;
  --wp--preset--spacing--2:  0.5rem;
  --wp--preset--spacing--3:  0.75rem;
  --wp--preset--spacing--4:  1rem;
  --wp--preset--spacing--5:  1.25rem;
  --wp--preset--spacing--6:  1.5rem;
  --wp--preset--spacing--8:  2rem;
  --wp--preset--spacing--10: 2.5rem;
  --wp--preset--spacing--12: 3rem;
  --wp--preset--spacing--16: 4rem;
  --wp--preset--spacing--20: 5rem;
  --wp--preset--spacing--24: 6rem;
  --wp--preset--spacing--32: 8rem;
  --wp--preset--spacing--40: 10rem;
  --wp--preset--spacing--48: 12rem;
  --wp--preset--spacing--64: 16rem;
}

/* Minimal body reset — WP theme normally provides this */
body { margin: 0; padding: 0; }
`;

/* ── Extract <style> block from 00-styles.html ──────────────── */
const stylesRaw  = read('00-styles.html');
const stylesMatch = stylesRaw.match(/<style>([\s\S]*?)<\/style>/);
const styles      = (stylesMatch ? stylesMatch[1] : '');

if (!styles) {
  console.error('⚠  Could not extract <style> from 00-styles.html');
}

/* ── Combine body blocks (01 – 05) ──────────────────────────── */
const bodyBlocks = BLOCKS.slice(1)
  .map(function (f) {
    return '\n<!-- ══ ' + f + ' ══ -->\n' + read(f);
  })
  .join('\n');

const body = applyImageSubs(bodyBlocks);

/* ── Assemble final HTML ─────────────────────────────────────── */
const html = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="UTF-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '  <meta name="description" content="Download the 2025 Hiring Snapshot Report: current trends in recruitment across Australian SMEs. Based on a survey of 1,000+ SME leaders.">',
  '  <title>2025 Hiring Snapshot Report: Current Trends in Recruitment | Employment Hero</title>',
  '  <style>' + WP_TOKEN_FALLBACKS + styles + '</style>',
  '</head>',
  '<body>',
  body,
  '</body>',
  '</html>',
].join('\n');

/* ── Write output ────────────────────────────────────────────── */
const outDir  = path.join(__dirname, 'dist');
const outFile = path.join(outDir, 'index.html');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, 'utf8');

console.log('✓  Built ' + outFile + ' (' + (html.length / 1024).toFixed(1) + ' kB)');
