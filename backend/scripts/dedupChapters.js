/**
 * Quick dedup: remove duplicate sub-chapters (same title + parentFolderId).
 * Keeps the one with the most content.
 * Run: node scripts/dedupChapters.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const StorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Story = mongoose.models.Story || mongoose.model('Story', StorySchema);

async function dedup() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Finding duplicates...\n');

  // Find all sub-chapters (not folders)
  const all = await Story.find({ isFolder: { $ne: true }, parentFolderId: { $exists: true, $ne: '' } });

  // Group by parentFolderId + title
  const groups = {};
  for (const ch of all) {
    const key = `${ch.parentFolderId}||${(ch.title || '').trim().toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ch);
  }

  let removed = 0;
  for (const [key, docs] of Object.entries(groups)) {
    if (docs.length <= 1) continue;
    console.log(`Duplicate found: "${key}" (${docs.length} copies)`);
    // Keep the one with the most content
    docs.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
    const toDelete = docs.slice(1).map(d => d._id);
    await Story.deleteMany({ _id: { $in: toDelete } });
    console.log(`  Kept: ${docs[0]._id} | Deleted: ${toDelete.join(', ')}`);
    removed += toDelete.length;
  }

  console.log(`\nDone. Removed ${removed} duplicate(s).`);
  await mongoose.disconnect();
}

dedup().catch(err => { console.error(err); process.exit(1); });
