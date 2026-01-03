require('dotenv').config();
const { EC2Client, DescribeRegionsCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testAWS() {
  try {
    console.log('🔍 Testing AWS credentials...');
    const command = new DescribeRegionsCommand({});
    const response = await ec2Client.send(command);
    console.log('✅ AWS credentials are valid!');
    console.log('📍 Available regions:', response.Regions.length);
  } catch (error) {
    console.error('❌ AWS credentials failed:', error.message);
  }
}

testAWS();
