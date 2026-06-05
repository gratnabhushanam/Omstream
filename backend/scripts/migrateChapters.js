/**
 * One-time migration: sync all embedded story chapters to sub-documents.
 * This fixes stories saved before the syncChapters parentFolderId fix.
 * Run: node scripts/migrateChapters.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const StorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Story = mongoose.models.Story || mongoose.model('Story', StorySchema);

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // Find all folder-type stories that have embedded chapters
  const folders = await Story.find({ isFolder: true });
  console.log(`Found ${folders.length} folder stories to process.\n`);

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const folder of folders) {
    const chapters = folder.chapters || [];
    if (chapters.length === 0) {
      console.log(`  [SKIP] "${folder.title}" — no embedded chapters.`);
      continue;
    }

    console.log(`  [SYNC] "${folder.title}" (${folder._id}) — ${chapters.length} embedded chapters...`);

    // Find existing sub-documents for this folder
    const existing = await Story.find({
      $or: [
        { folderId: folder._id },
        { parentFolderId: folder.title }
      ]
    });
    const existingByTitle = {};
    for (const e of existing) {
      existingByTitle[e.title?.toLowerCase()] = e;
    }

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!ch.title) continue;

      const payload = {
        title: ch.title,
        description: ch.summary || ch.description || '',
        content: ch.content || '',
        thumbnail: ch.thumbnail || '',
        audioUrl: ch.audioUrl || '',
        folderId: folder._id,
        parentFolderId: folder.title,
        parentFolder: folder.title,
        sequence: ch.sequence || i + 1,
        takeaways: ch.takeaways || [],
        status: 'published',
        isFolder: false,
      };

      const key = ch.title.toLowerCase();
      if (existingByTitle[key]) {
        // Update existing sub-document
        await Story.findByIdAndUpdate(existingByTitle[key]._id, payload);
        console.log(`    ↻ Updated: "${ch.title}"`);
        totalUpdated++;
      } else {
        // Create new sub-document
        await Story.create(payload);
        console.log(`    + Created: "${ch.title}"`);
        totalCreated++;
      }
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Created: ${totalCreated} sub-chapters`);
  console.log(`  Updated: ${totalUpdated} sub-chapters`);

  // Auto-dedup: remove duplicate sub-chapters
  console.log('\nRunning deduplication...');
  const allSubs = await Story.find({ isFolder: { $ne: true }, parentFolderId: { $exists: true, $ne: '' } });
  const groups = {};
  for (const ch of allSubs) {
    const key = `${ch.parentFolderId}||${(ch.title || '').trim().toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ch);
  }
  let dedupCount = 0;
  for (const docs of Object.values(groups)) {
    if (docs.length <= 1) continue;
    docs.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
    const toDelete = docs.slice(1).map(d => d._id);
    await Story.deleteMany({ _id: { $in: toDelete } });
    dedupCount += toDelete.length;
  }
  console.log(`  Removed ${dedupCount} duplicate(s).`);

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
