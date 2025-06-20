const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  console.log('🌐 Local Network Access Information');
  console.log('=====================================\n');
  
  for (const interfaceName in interfaces) {
    const interface_ = interfaces[interfaceName];
    
    for (const alias of interface_) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (alias.family === 'IPv4' && !alias.internal) {
        console.log(`📡 Network Interface: ${interfaceName}`);
        console.log(`🔗 Local IP Address: ${alias.address}`);
        console.log(`🌍 Access URL: http://${alias.address}:3000`);
        console.log('---');
      }
    }
  }
  
  console.log('\n📋 Instructions:');
  console.log('1. Start the server with: npm run dev');
  console.log('2. Other computers on your network can access the app using the URLs above');
  console.log('3. Make sure Windows Firewall allows Node.js connections');
  console.log('4. All devices must be on the same WiFi/network');
  console.log('\n🔥 Windows Firewall:');
  console.log('- You may get a Windows Defender popup when starting the server');
  console.log('- Click "Allow access" to enable network connections');
  console.log('- Or manually allow Node.js in Windows Defender Firewall settings');
}

getLocalIPAddress(); 