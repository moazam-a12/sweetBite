const { exec } = require('child_process');
const path = require('path');

// MongoDB connection string (replace <username>, <password>, <cluster>, <dbname>)
const uri = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@sweetbite.teuce4y.mongodb.net/sweetbite';

// Output folder (Downloads folder)
const outputDir = path.join(require('os').homedir());

// Command to dump database
const cmd = `mongodump --uri="${uri}" --out="${outputDir}"`;

// Run mongodump
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error exporting database: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`❌ Mongodump stderr: ${stderr}`);
  }
  console.log(`✅ Database exported successfully to ${outputDir}`);
});
