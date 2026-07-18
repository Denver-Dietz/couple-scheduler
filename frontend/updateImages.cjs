const fs = require('fs');
const path = require('path');

const datesDir = path.join(__dirname, 'public', 'dates');
const imagesDir = path.join(datesDir, 'images');

const imageFiles = fs.readdirSync(imagesDir);
const jsonFiles = fs.readdirSync(datesDir).filter(f => f.endsWith('.json'));

for (const file of jsonFiles) {
  const filePath = path.join(datesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const idea of data.ideas) {
    const id = idea.id;
    // Find matching image (e.g., active_01.png or active_01.jpg)
    const matchingImage = imageFiles.find(img => img.startsWith(id + '.') || (id.startsWith('art') && img.startsWith('art'))); // Wait, what if ID is 'art_01'?
    const specificImage = imageFiles.find(img => img.startsWith(id + '.'));
    
    if (specificImage) {
      idea.hasImage = true;
      idea.imageUrl = '/dates/images/' + specificImage;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Updated ' + file);
  }
}
