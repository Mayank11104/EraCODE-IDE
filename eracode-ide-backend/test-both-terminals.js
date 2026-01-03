require('dotenv').config();
const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected to backend\n');
  
  console.log('=' .repeat(50));
  console.log('TEST 1: LOCAL TERMINAL');
  console.log('='.repeat(50));
  
  // Test LOCAL terminal
  socket.emit('terminal:create', 'test-local-123', {
    cols: 80,
    rows: 24,
    shell: 'cmd.exe',
    cwd: 'D:\\CODE'
  });
});

socket.on('terminal:created', (terminalId, info) => {
  console.log('✅ LOCAL terminal created:', terminalId);
  console.log('   Shell:', info.shell);
  console.log('   CWD:', info.cwd);
  
  // Wait 3 seconds, then test CLOUD terminal
  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: CLOUD TERMINAL');
    console.log('='.repeat(50));
    
    socket.emit('cloud-terminal:create', 'test-cloud-456', {
      region: 'eu-west-1'
    });
  }, 3000);
});

socket.on('terminal:data', (terminalId, data) => {
  console.log(`[LOCAL ${terminalId}]:`, data.trim());
});

socket.on('cloud-terminal:progress', (data) => {
  console.log(`☁️ ${data.message} (${data.progress}%)`);
});

socket.on('cloud-terminal:ready', (info) => {
  console.log('✅ CLOUD terminal ready!');
  console.log('   Instance ID:', info.instanceId);
  console.log('   Public IP:', info.publicIp);
  console.log('   Region:', info.region);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ BOTH TERMINALS WORKING!');
  console.log('='.repeat(50));
  console.log('\nClosing terminals in 10 seconds...');
  
  setTimeout(() => {
    socket.emit('terminal:kill', 'test-local-123');
    socket.emit('cloud-terminal:close', 'test-cloud-456');
    setTimeout(() => process.exit(0), 5000);
  }, 10000);
});

socket.on('cloud-terminal:data', (sessionId, data) => {
  console.log(`[CLOUD ${sessionId}]:`, data.trim());
});

socket.on('cloud-terminal:error', (sessionId, error) => {
  console.error('❌ Cloud terminal error:', error);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
