const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('/projects.json', 'utf8'));
  console.log('Valid JSON. Array length:', data.length);
} catch (e) {
  console.error('Invalid JSON:', e.message);
}
