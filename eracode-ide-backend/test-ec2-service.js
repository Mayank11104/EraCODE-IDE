require('dotenv').config();
const awsEc2Service = require('./services/awsEc2Service');

async function testEC2Service() {
  try {
    console.log('🧪 Testing EC2 Service...\n');

    const sessionId = `test-${Date.now()}`;
    
    console.log('⚠️  This will launch a REAL EC2 instance (costs ~$0.01)');
    console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test launch
    console.log('1️⃣ Launching instance...');
    const instance = await awsEc2Service.launchInstance(sessionId);
    console.log('✅ Instance info:', instance);

    console.log('\n2️⃣ Testing SSH connection...');
    const sshConn = await awsEc2Service.createSSHConnection(instance.publicIp);
    console.log('✅ SSH connected!');
    sshConn.end();

    console.log('\n3️⃣ Terminating instance...');
    await awsEc2Service.terminateInstance(sessionId);
    console.log('✅ Instance terminated!');

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testEC2Service();
