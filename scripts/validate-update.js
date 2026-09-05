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
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickEssentials','guestQuickWifiName','guestQuickDirections','guestQuickHostText','welcomeTransportInfo','welcomeFoodInfo','welcomeOtherServices','welcomeWellnessInfo','welcomeToursInfo','welcomeActivityTitle','welcomeActivityList','guestTransportInfo','guestFoodServiceInfo','guestOtherServices','guestWhatsOnTile','guestWellnessTile','guestToursTile','guestTodayActivities','guestWeeklyActivities','createPublicWelcomeLinkBtn','publicWelcomeLinkBox','guestFoodTile','guestTransportTile','welcomeCheckIn','welcomeCheckOut','welcomeFacilities','welcomeMapInfo','welcomeNotices','saveWelcomeStayDetailsBtn','guestStayTile','guestArrivalInfo','guestFacilitiesInfo','guestMapInfo','guestNoticesInfo']) check(html.includes(`id="${id}"`),`Welcome UI id present: ${id}`);
for(const id of ['welcomeReadinessCard','welcomeReadinessPreviewBtn','guestQuickWifiName','guestQuickDirections','guestQuickHostText','welcomeTransportInfo','welcomeFoodInfo','welcomeOtherServices','welcomeWellnessInfo','welcomeToursInfo','welcomeActivityTitle','welcomeActivityList','guestTransportInfo','guestFoodServiceInfo','guestOtherServices','guestWhatsOnTile','guestWellnessTile','guestToursTile','guestTodayActivities','guestWeeklyActivities','createPublicWelcomeLinkBtn','publicWelcomeLinkBox','guestFoodTile','guestTransportTile','welcomeCheckIn','welcomeCheckOut','welcomeFacilities','welcomeMapInfo','welcomeNotices','saveWelcomeStayDetailsBtn','guestStayTile','guestArrivalInfo','guestFacilitiesInfo','guestMapInfo','guestNoticesInfo']) check(app.includes(id),`Welcome runtime references: ${id}`);
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
check(html.includes('id="sharedDataGatewayId"')&&html.includes('id="publishSharedWelcomeBtn"'),'Shared Data owner controls present');
check(app.includes('publishSharedWelcome')&&app.includes('sharedPermanentWelcomeUrl'),'shared backend publish bridge present');
check(app.includes('papaGolfGateways')&&app.includes('identitytoolkit.googleapis.com'),'Firebase owner/auth bridge present');
check(publicWelcomeJs.includes('loadSharedWelcome')&&publicWelcomeJs.includes('firestore.googleapis.com'),'public Welcome can resolve stable shared Gateway');
check(fs.existsSync(path.join(root,'FIREBASE_SETUP.md')),'Firebase setup guide included');

check((()=>{try{new Function(publicWelcomeJs);return true}catch{return false}})(),'standalone public Welcome JavaScript parses');
for(const file of ['index.html','welcome.html','gateway-demo.html','promotion.html']){
  const body=read(file);
  const refs=[...body.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('#')&&!x.startsWith('data:'));
  for(const ref of refs){const clean=ref.split(/[?#]/)[0];if(clean)check(fs.existsSync(path.join(root,clean)),`${file} local reference exists: ${clean}`);}
}
check(app.includes("body.classList.toggle('guest-preview-mode'"),'local guest preview hides admin chrome');
check(app.includes("body.classList.toggle('welcome-admin-mode'"),'Welcome owner screen uses dedicated clean navigation mode');
check(app.includes('finishWelcomeEdit'),'Welcome save flow returns to compact owner view');
check(app.includes('PAPA_GOLF_WELCOME_SCHEMA_VERSION'),'canonical Welcome schema version declared');
check(app.includes('buildCanonicalWelcomeModel'),'backend-ready canonical Welcome model builder retained');
check(app.includes('ensureWelcomeModelIdentity'),'stable property/unit identity migration retained');
check(app.includes('version: 9'),'backup format v9 includes consolidated Welcome model');
check(app.includes('v:4,s:PAPA_GOLF_WELCOME_SCHEMA_VERSION'),'public Welcome payload v4 carries schema version');
check(publicWelcome.includes('stayPanel')&&publicWelcome.includes('arrivalInfo'),'standalone public Welcome supports structured stay details');
if(fail.length){
  console.error('\nPapa Golf validation FAILED:');
  for(const x of fail) console.error('✗',x);
  process.exit(1);
}
console.log(`\nPapa Golf validation passed for v${v}.`);
