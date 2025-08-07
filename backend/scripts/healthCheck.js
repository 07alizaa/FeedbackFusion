const http = require('http');

const services = [
  { name: 'Backend API', url: 'http://localhost:5001/api/admin/health' },
  { name: 'Database Connection', url: 'http://localhost:5001/api/admin/stats' },
  { name: 'Business Profiles', url: 'http://localhost:5001/api/business' },
  { name: 'Notification System', url: 'http://localhost:5001/api/notifications' }
];

console.log('🔍 Production Health Check Starting...\n');

async function checkService(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, (res) => {
      const status = res.statusCode < 500 ? '✅' : '❌';
      console.log(`${status} ${service.name}: ${res.statusCode}`);
      resolve({ name: service.name, status: res.statusCode, success: res.statusCode < 500 });
    });

    req.on('error', (err) => {
      console.log(`❌ ${service.name}: Connection failed - ${err.message}`);
      resolve({ name: service.name, status: 'ERROR', success: false });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ ${service.name}: Timeout`);
      resolve({ name: service.name, status: 'TIMEOUT', success: false });
    });
  });
}

async function runHealthCheck() {
  const results = [];
  
  for (const service of services) {
    const result = await checkService(service);
    results.push(result);
  }

  console.log('\n📊 Health Check Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Services Online: ${successCount}/${results.length}`);
  
  if (successCount === results.length) {
    console.log('🚀 All systems operational! FeedbackFusion is production ready.');
  } else {
    console.log('⚠️  Some services need attention before production deployment.');
  }
  
  console.log('\n🔗 Production Endpoints:');
  console.log('📊 Admin Dashboard: http://localhost:5001/api/admin');
  console.log('🏢 Business Profiles: http://localhost:5001/api/business');
  console.log('🔔 Notifications: http://localhost:5001/api/notifications');
  console.log('📝 Forms: http://localhost:5001/api/forms');
  console.log('🤖 AI Features: http://localhost:5001/api/ai');
  console.log('💳 Subscriptions: http://localhost:5001/api/subscriptions');
  console.log('📱 QR Codes: http://localhost:5001/api/qr');
}

// Run the health check
runHealthCheck().catch(console.error);
