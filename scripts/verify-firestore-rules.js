const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

const checks = [
  {
    name: 'requires authentication',
    ok: /request\.auth\s*!=\s*null/.test(rules),
  },
  {
    name: 'checks owner uid',
    ok: /request\.auth\.uid\s*==\s*userId/.test(rules),
  },
  {
    name: 'protects user documents',
    ok: /match\s+\/users\/\{userId\}/.test(rules),
  },
  {
    name: 'protects user coin subcollection',
    ok: /match\s+\/coins\/\{coinId\}/.test(rules) && /allow\s+read,\s*write:\s*if\s+ownsUserDocument\(userId\)/.test(rules),
  },
  {
    name: 'denies all other paths',
    ok: /match\s+\/\{document=\*\*\}/.test(rules) && /allow\s+read,\s*write:\s*if\s+false/.test(rules),
  },
];

const failures = checks.filter((check) => !check.ok);
if (failures.length) {
  console.error('Firestore rules verification failed:');
  failures.forEach((failure) => console.error(`- ${failure.name}`));
  process.exit(1);
}

console.log('Firestore rules verification passed.');
