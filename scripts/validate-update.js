const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fail=[];
function check(ok,msg){ if(!ok) fail.push(msg); else console.log('✓',msg); }
const required=['index.html','app.js','styles.css','service-worker.js','gateway-demo.html','gateway-demo.js','gateway-demo.css','promotion.html','promotion.js','promotion.css','welcome.html','welcome.js','welcome.css','magic-dragon-villa-logo.png'];
for(const f of required) check(fs.existsSync(path.join(root,f)),`required file: ${f}`);
const html=read('index.html'),app=read('app.js'),sw=read('service-worker.js'),publicWelcome=read('welcome.html'),publicWelcomeJs=read('welcome.js');
const v=(app.match(/RUNTIME_VERSION\s*=\s*'([^']+)'/)||[])[1];
check(!!v,'runtime version declared');
if(v){
  check(html.includes(`styles.css?v=${v}`),'stylesheet cache-buster matches runtime');
  check(html.includes(`app.js?v=${v}`),'script cache-buster matches runtime');
  check(html.toUpperCase().includes(`V${v}`.toUpperCase()),'visible header version matches runtime');
  check(sw.includes(`v${v.replace(/\./g,'')}`)||sw.includes(`v${v.replace(/\./g,'')}-`), 'service-worker cache version matches runtime');
}
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickEssentials','guestQuickWifiName','guestQuickDirections','guestQuickHostText','welcomeTransportInfo','welcomeFoodInfo','welcomeOtherServices','welcomeWellnessInfo','welcomeToursInfo','welcomeActivityTitle','welcomeActivityList','guestTransportInfo','guestFoodServiceInfo','guestOtherServices','guestWhatsOnTile','guestWellnessTile','guestToursTile','guestTodayActivities','guestWeeklyActivities','createPublicWelcomeLinkBtn','publicWelcomeLinkBox','guestFoodTile','guestTransportTile']) check(html.includes(`id="${id}"`),`Welcome UI id present: ${id}`);
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickWifiName','guestQuickDirections','guestQuickHostText','welcomeTransportInfo','welcomeFoodInfo','welcomeOtherServices','welcomeWellnessInfo','welcomeToursInfo','welcomeActivityTitle','welcomeActivityList','guestTransportInfo','guestFoodServiceInfo','guestOtherServices','guestWhatsOnTile','guestWellnessTile','guestToursTile','guestTodayActivities','guestWeeklyActivities','createPublicWelcomeLinkBtn','publicWelcomeLinkBox','guestFoodTile','guestTransportTile']) check(app.includes(id),`Welcome runtime references: ${id}`);
check(app.includes('materializeSafeRelatedPhotos'),'Safari related-photo Blob hardening retained');
check(!/indexedDB\.deleteDatabase\s*\(/.test(app),'no IndexedDB database deletion in app runtime');
check(!/localStorage\.clear\s*\(/.test(app),'no localStorage.clear in app runtime');
check(app.includes("papa-golf-assets-v01"),'separate affiliate asset database retained');
check(app.includes('affiliateLogoAsset'),'affiliate logo remains in backup path');

check(app.includes("new URL('welcome.html'"),'public Welcome URL uses standalone cross-device page');
check(app.includes("url.hash='d='"),'public Welcome data is carried in URL fragment, not server query');
check(!app.includes("getPapaGolfGooglePlacesKey()"+";return {v:1"),'Google Places key excluded from public Welcome payload');
check(publicWelcome.includes('publicHome')&&publicWelcome.includes('quickDirections'),'standalone public Welcome essentials present');
check(publicWelcomeJs.includes('decodePayload')&&publicWelcomeJs.includes('showPanel'),'standalone public Welcome navigation runtime present');
check((()=>{try{new Function(publicWelcomeJs);return true}catch{return false}})(),'standalone public Welcome JavaScript parses');
for(const file of ['index.html','welcome.html','gateway-demo.html','promotion.html']){
  const body=read(file);
  const refs=[...body.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('#')&&!x.startsWith('data:'));
  for(const ref of refs){const clean=ref.split(/[?#]/)[0];if(clean)check(fs.existsSync(path.join(root,clean)),`${file} local reference exists: ${clean}`);}
}
check(app.includes("body.classList.toggle('guest-preview-mode'"),'local guest preview hides admin chrome');
check(app.includes("body.classList.toggle('welcome-admin-mode'"),'Welcome owner screen uses dedicated clean navigation mode');
check(app.includes('finishWelcomeEdit'),'Welcome save flow returns to compact owner view');
if(fail.length){
  console.error('\nPapa Golf validation FAILED:');
  for(const x of fail) console.error('✗',x);
  process.exit(1);
}
console.log(`\nPapa Golf validation passed for v${v}.`);
