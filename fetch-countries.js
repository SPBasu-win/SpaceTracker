const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson', (res) => {
  const path = 'client/public/countries.geojson';
  const filePath = fs.createWriteStream(path);
  res.pipe(filePath);
  filePath.on('finish',() => {
    filePath.close();
    console.log('Download Completed'); 
  })
}).on('error', (err) => {
  console.log('Error: ', err.message);
});
