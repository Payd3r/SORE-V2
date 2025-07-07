const fs = require('fs');
const path = require('path');
const swaggerSpec = require('./swagger.config.js');

const swaggerJsonPath = path.join(__dirname, 'public', 'swagger.json');

fs.writeFileSync(swaggerJsonPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`Swagger specification generated at ${swaggerJsonPath}`); 