import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const mode = process.argv[2] || 'smoke';
const files = [];
function walk(dir){ for (const name of readdirSync(dir)){ const p=join(dir,name); const st=statSync(p); if(st.isDirectory() && !['.git','node_modules','.next'].includes(name)) walk(p); else if(st.isFile() && /\.(tsx|ts|css|md|json)$/.test(name)) files.push(p.replaceAll("\\", "/")); }}
walk(process.cwd());
const required = ['app/page.tsx','app/products/page.tsx','app/checkout/page.tsx','app/admin/page.tsx','docs/current-ux.md'];
const missing = required.filter(p=>!files.some(f=>f.endsWith(p)));
if(missing.length){ console.error('Missing required files:', missing.join(', ')); process.exit(1); }
if(mode==='lint'){
  const bad = files.filter(f=>/\.(tsx|ts)$/.test(f)).filter(f=>readFileSync(f,'utf8').includes('TODO_BACKEND'));
  if(bad.length){ console.error('Unexpected backend TODO markers:', bad.join(', ')); process.exit(1); }
  const customerFacingFiles = files.filter((file) => /\.(tsx|ts)$/.test(file))
    .filter((file) => (file.includes('/app/') || file.includes('/components/') || file.endsWith('/lib/eligibility/public-state-requirements.ts')))
    .filter((file) => !file.includes('/admin/'));
  const forbiddenCustomerPhrases = [
    'CHECK STATE GUIDANCE',
    'manual review',
    'pending_admin_review',
    'pending_document_upload',
    'compliance coverage',
    'rule engine',
  ];
  const phraseHits = [];
  for (const file of customerFacingFiles) {
    const text = readFileSync(file, 'utf8').toLowerCase();
    for (const phrase of forbiddenCustomerPhrases) {
      if (text.includes(phrase.toLowerCase())) phraseHits.push(`${file}: ${phrase}`);
    }
  }
  if(phraseHits.length){ console.error('Forbidden customer-facing phrases found:\n' + phraseHits.join('\n')); process.exit(1); }
  const stateRules = readFileSync('lib/compliance/restricted-state-rules.ts', 'utf8');
  const stateListMatch = stateRules.match(/usStateAndDcCodes = \[([\s\S]*?)\] as const/);
  const states = stateListMatch ? [...stateListMatch[1].matchAll(/"([A-Z]{2})"/g)].map((match) => match[1]) : [];
  const expectedStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
  const missingStates = expectedStates.filter((state) => !states.includes(state));
  const extraStates = states.filter((state) => !expectedStates.includes(state));
  if(states.length !== 51 || missingStates.length || extraStates.length){ console.error(`Restricted state list must be exactly 50 states + DC. Found ${states.length}; missing: ${missingStates.join(',')}; extra: ${extraStates.join(',')}`); process.exit(1); }
  const seedText = readFileSync('prisma/seed.ts', 'utf8');
  const requiredSeedPhrases = [
    'Development rule based on Self Defense Mall stun-gun laws reference; counsel review required before production.',
    'Allowed by development stun-gun state reference; counsel review required before production.',
    'Blocked by development stun-gun state reference.',
  ];
  const missingSeedPhrases = requiredSeedPhrases.filter((phrase) => !seedText.includes(phrase));
  if(missingSeedPhrases.length){ console.error('Seed is missing required stun-gun development rule text:\n' + missingSeedPhrases.join('\n')); process.exit(1); }
  for (const state of ['DC', 'HI', 'MA']) {
    if(!seedText.includes(state)){ console.error(`Seed is missing required blocked stun-gun state ${state}.`); process.exit(1); }
  }
  console.log(`Static lint passed for ${files.length} files.`);
} else if(mode==='typecheck'){
  const text = files.filter(f=>/\.(tsx|ts)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('\n');
  for (const token of ['CheckoutOutcome','StatusTone','React.ReactNode']) if(!text.includes(token)){ console.error(`Expected type token missing: ${token}`); process.exit(1); }
  console.log('Static typecheck proxy passed; TypeScript dependency unavailable in this environment.');
} else {
  const routeCount = files.filter(f=>f.endsWith('page.tsx')).length;
  if(routeCount < 40){ console.error(`Expected at least 40 routes, found ${routeCount}`); process.exit(1); }
  console.log(`Smoke check passed with ${routeCount} page routes.`);
}


