const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fail=[];
function check(ok,msg){ if(!ok) fail.push(msg); else console.log('✓',msg); }
const required=['index.html','app.js','styles.css','service-worker.js','gateway-demo.html','gateway-demo.js','gateway-demo.css','promotion.html','promotion.js','promotion.css','magic-dragon-villa-logo.png'];
for(const f of required) check(fs.existsSync(path.join(root,f)),`required file: ${f}`);
const html=read('index.html'),app=read('app.js'),sw=read('service-worker.js');
const v=(app.match(/RUNTIME_VERSION\s*=\s*'([^']+)'/)||[])[1];
check(!!v,'runtime version declared');
if(v){
  check(html.includes(`styles.css?v=${v}`),'stylesheet cache-buster matches runtime');
  check(html.includes(`app.js?v=${v}`),'script cache-buster matches runtime');
  check(html.toUpperCase().includes(`V${v}`.toUpperCase()),'visible header version matches runtime');
  check(sw.includes(`v${v.replace(/\./g,'')}`)||sw.includes(`v${v.replace(/\./g,'')}-`), 'service-worker cache version matches runtime');
}
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickEssentials','guestQuickWifiName','guestQuickDirections','guestQuickHostText']) check(html.includes(`id="${id}"`),`Welcome UI id present: ${id}`);
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickWifiName','guestQuickDirections','guestQuickHostText']) check(app.includes(id),`Welcome runtime references: ${id}`);
check(app.includes('materializeSafeRelatedPhotos'),'Safari related-photo Blob hardening retained');
check(!/indexedDB\.deleteDatabase\s*\(/.test(app),'no IndexedDB database deletion in app runtime');
check(!/localStorage\.clear\s*\(/.test(app),'no localStorage.clear in app runtime');
check(app.includes("papa-golf-assets-v01"),'separate affiliate asset database retained');
check(app.includes('affiliateLogoAsset'),'affiliate logo remains in backup path');
if(fail.length){
  console.error('\nPapa Golf validation FAILED:');
  for(const x of fail) console.error('✗',x);
  process.exit(1);
}
console.log(`\nPapa Golf validation passed for v${v}.`);
