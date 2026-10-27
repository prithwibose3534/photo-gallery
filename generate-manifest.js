const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, 'public');
const THUMB_DIR = path.join(PUBLIC_DIR, '.thumbs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'photos.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

async function processPhotos() {
  const allPhotos = [];

  function walk(dir, baseDir = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // ignore hidden/thumbs
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, baseDir);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (VALID_EXTENSIONS.has(ext)) {
          const relativeDir = path.relative(baseDir, dir);
          const albumName = relativeDir.split(path.sep)[0] || 'Unsorted';
          const webPath = '/' + path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');

          allPhotos.push({
            id: `${allPhotos.length + 1}`,
            album: albumName,
            url: webPath,
            title: path.parse(entry.name).name.replace(/[-_]/g, ' '),
            fullPath,
          });
        }
      }
    }
  }

  walk(PUBLIC_DIR);
  console.log(`Found ${allPhotos.length} photos. Generating thumbnails where needed...`);

  const manifest = [];
  for (const p of allPhotos) {
    const thumbFilename = `thumb_${p.id}.webp`;
    const thumbDiskPath = path.join(THUMB_DIR, thumbFilename);

    // Only generate if thumb doesn't exist yet
    if (!fs.existsSync(thumbDiskPath)) {
      try {
        await sharp(p.fullPath)
          .resize(400, 300, { fit: 'cover' })
          .webp({ quality: 75 })
          .toFile(thumbDiskPath);
      } catch (e) {
        console.error('Sharp failed on', p.fullPath, e.message);
      }
    }

    manifest.push({
      id: p.id,
      album: p.album,
      url: p.url, // Original high-res
      thumbUrl: `/.thumbs/${thumbFilename}`, // Fast tiny webp
      title: p.title,
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Finished! Manifest written to ${OUTPUT_FILE}`);
}

processPhotos();
