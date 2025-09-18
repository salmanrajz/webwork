const { exec } = require('child_process');

console.log('🧪 Testing Desktop App Status...\n');

// Check if desktop app is running
exec('ps aux | grep -E "(electron|webwork)" | grep -v grep', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Desktop app not running');
    return;
  }
  
  console.log('✅ Desktop app is running');
  console.log('Processes:', stdout.trim());
  
  // Check if we can see any activity monitoring
  console.log('\n🔍 Checking for activity monitoring...');
  
  // Test if we can detect active window
  exec('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Cannot detect active application');
    } else {
      console.log('✅ Active application:', stdout.trim());
    }
  });
});

// Check if backend is running
exec('curl -s http://localhost:4000/api/health 2>/dev/null || echo "Backend not running"', (error, stdout, stderr) => {
  console.log('\n🔧 Backend status:', stdout.trim());
});

// Check restriction rules in database
exec('cd /Users/salman/Documents/projects/webwork/backend && node -e "import(\'./src/models/index.js\').then(async (models) => { const rules = await models.RestrictionRule.findAll(); console.log(\'Rules in database:\', rules.length); process.exit(0); })"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Cannot check database rules');
  } else {
    console.log('✅ Database rules:', stdout.trim());
  }
});

