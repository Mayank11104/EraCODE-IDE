require('dotenv').config();

console.log('Raw values (check for spaces/quotes):');
console.log('---');
console.log(`AWS_ACCESS_KEY_ID: "${process.env.AWS_ACCESS_KEY_ID}"`);
console.log(`Length: ${process.env.AWS_ACCESS_KEY_ID?.length}`);
console.log('---');
console.log(`AWS_SECRET_ACCESS_KEY: "${process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 10)}..."`);
console.log(`Length: ${process.env.AWS_SECRET_ACCESS_KEY?.length}`);
console.log('---');

// Test AWS SDK directly
const { EC2Client, DescribeRegionsCommand } = require('@aws-sdk/client-ec2');

const client = new EC2Client({
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log('\nTesting AWS SDK connection...');

client.send(new DescribeRegionsCommand({}))
  .then(() => console.log('✅ AWS SDK connection successful!'))
  .catch((err) => console.error('❌ AWS SDK error:', err.message));
