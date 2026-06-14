const https = require('https');
https.get('https://raw.githubusercontent.com/PremaanshVyas/satlas/main/apps/web/src/globe/shaders/satellite.vert.glsl', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
