require('dotenv').config();

console.log('='.repeat(50));
console.log('AWS CREDENTIALS CHECK');
console.log('='.repeat(50));
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Loaded' : '❌ Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Loaded' : '❌ Missing');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set (will default to eu-west-1)');
console.log('AWS_AMI_ID:', process.env.AWS_AMI_ID || 'Not set');
console.log('AWS_KEY_PAIR_NAME:', process.env.AWS_KEY_PAIR_NAME || 'Not set');
console.log('='.repeat(50));

// Show first few characters (masked)
if (process.env.AWS_ACCESS_KEY_ID) {
  const masked = process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...';
  console.log('Access Key starts with:', masked);
}

if (process.env.AWS_SECRET_ACCESS_KEY) {
  const masked = process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...';
  console.log('Secret Key starts with:', masked);
}
