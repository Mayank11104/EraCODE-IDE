require('dotenv').config();
const { EC2Client, DescribeImagesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({
  region: 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function findUbuntuAMI() {
  try {
    console.log('🔍 Finding Ubuntu 22.04 AMI in eu-west-1...\n');

    const command = new DescribeImagesCommand({
      Filters: [
        {
          Name: 'name',
          Values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'],
        },
        {
          Name: 'state',
          Values: ['available'],
        },
        {
          Name: 'architecture',
          Values: ['x86_64'],
        },
      ],
      Owners: ['099720109477'], // Canonical (Ubuntu official)
    });

    const response = await ec2Client.send(command);

    if (response.Images.length === 0) {
      console.log('❌ No Ubuntu AMIs found');
      return;
    }

    // Sort by creation date (newest first)
    const sortedImages = response.Images.sort((a, b) => 
      new Date(b.CreationDate) - new Date(a.CreationDate)
    );

    const latestImage = sortedImages[0];

    console.log('✅ Latest Ubuntu 22.04 AMI found:\n');
    console.log('AMI ID:', latestImage.ImageId);
    console.log('Name:', latestImage.Name);
    console.log('Created:', latestImage.CreationDate);
    console.log('\n📋 Update your .env file with:');
    console.log(`AWS_AMI_ID=${latestImage.ImageId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findUbuntuAMI();
