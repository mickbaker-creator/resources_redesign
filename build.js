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

/* ── Extract <style> block from 00-styles.html ──────────────── */
const stylesRaw  = read('00-styles.html');
const stylesMatch = stylesRaw.match(/<style>([\s\S]*?)<\/style>/);
const styles      = stylesMatch ? stylesMatch[1] : '';

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
  '  <style>' + styles + '</style>',
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
