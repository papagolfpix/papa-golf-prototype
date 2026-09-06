const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fail=[];
function check(ok,msg){ if(!ok) fail.push(msg); else console.log('✓',msg); }
const required=['index.html','app.js','styles.css','service-worker.js','gateway-demo.html','gateway-demo.js','gateway-demo.css','promotion.html','promotion.js','promotion.css','welcome.html','welcome.js','welcome.css','magic-dragon-villa-logo.png'];
for(const f of required) check(fs.existsSync(path.join(root,f)),`required file: ${f}`);
const html=read('index.html'),app=read('app.js'),styles=read('styles.css'),sw=read('service-worker.js'),publicWelcome=read('welcome.html'),publicWelcomeJs=read('welcome.js');
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
check(app.includes('Firebase Shared Data project/API settings and anonymous owner auth tokens'),'Firebase Shared Data auth/config explicitly excluded from backup');
check(!/welcomeBackupSnapshot[\s\S]{0,1200}PAPA_GOLF_SHARED_AUTH_KEY/.test(app),'Firebase owner auth token not included in Welcome backup snapshot');

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
check(html.includes('id="sharedSetupIdentity"')&&html.includes('id="sharedRulesText"')&&html.includes('id="copySharedRulesBtn"'),'secure Shared Data setup assistant present');
check(app.includes('buildSharedFirestoreRules')&&app.includes('allow list: if false'),'generated Firestore rules block collection listing');
check(app.includes("request.auth.uid == '${uid}'")&&app.includes('request.resource.data.ownerUid == request.auth.uid'),'generated Firestore writes bind to exact owner UID');
check(!app.includes('allow read, write: if true'),'no permissive Firestore rule embedded in runtime');
check(app.includes('OPERATION_NOT_ALLOWED')&&app.includes('Anonymous sign-in is not enabled yet'),'Firebase auth diagnostics explain disabled Anonymous sign-in');
check(app.includes("localStorage.removeItem(PAPA_GOLF_SHARED_AUTH_KEY)"),'changing Firebase project/key invalidates stale owner auth');

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
check(app.includes('version: 11'),'backup format v11 includes consolidated Welcome model, QR touchpoints and audit photos');
check(app.includes('v:4,s:PAPA_GOLF_WELCOME_SCHEMA_VERSION'),'public Welcome payload v4 carries schema version');
check(publicWelcome.includes('stayPanel')&&publicWelcome.includes('arrivalInfo'),'standalone public Welcome supports structured stay details');
// v0.39.0 compact guest navigation / personalization foundation
check(html.includes('data-reorder-list="welcome"'), 'owner preview has reorderable slim Welcome list');
check(html.includes('guest-menu-drag'), 'owner preview has explicit reorder handles');
check(app.includes("papaGolfGuestWelcomeOrderV1"), 'guest Welcome order persists locally without account');
check(app.includes('pointerdown') && app.includes('pointermove') && app.includes('saveWelcomeMenuOrder'), 'owner preview touch reorder runtime present');
check(publicWelcome.includes('data-reorder-list="welcome"') && publicWelcome.includes('menu-drag'), 'public Welcome has reorderable slim list');
check(publicWelcomeJs.includes("papaGolfGuestWelcomeOrderV1") && publicWelcomeJs.includes('saveMenuOrder'), 'public Welcome order persistence present');
check(publicWelcome.includes('system-menu-tile') && !publicWelcome.includes('data-menu-key="help"'), 'Help & Emergency remains protected from reordering');
check(read('styles.css').includes('.guest-menu-tile .guest-menu-copy small span{font:inherit!important'), 'What’s On summary cannot inherit legacy oversized span styling');
check(read('styles.css').includes('.guest-menu-drag{width:32px;height:44px'), 'owner preview reorder handle retains 44px touch target');
check(read('welcome.css').includes('.menu-drag{width:32px;height:44px'), 'public Welcome reorder handle retains 44px touch target');
check(read('styles.css').includes('min-height:58px') && read('welcome.css').includes('min-height:58px'), 'compact mobile rows use matched density in preview and public Welcome');

// v0.39.2 tactile lift-and-reflow reorder feedback
check(app.includes("placeholder.className='guest-menu-placeholder'") && app.includes("active.style.position='fixed'"), 'owner preview dragged row lifts into floating layer with landing placeholder');
check(app.includes('document.elementsFromPoint') && app.includes('row.animate'), 'owner preview detects underlying rows and animates list reflow');
check(app.includes('autoScroll') && app.includes('window.scrollBy'), 'owner preview supports edge auto-scroll while reordering');
check(publicWelcomeJs.includes("placeholder.className='menu-placeholder'") && publicWelcomeJs.includes("active.style.position='fixed'"), 'public Welcome dragged row lifts with landing placeholder');
check(publicWelcomeJs.includes('document.elementsFromPoint') && publicWelcomeJs.includes('row.animate'), 'public Welcome animates neighbouring rows out of the way');
check(read('styles.css').includes('.guest-menu-tile.is-reordering{z-index:1000') && read('styles.css').includes('transform:scale(1.035)'), 'owner preview selected row has visible raised-state styling');
check(read('welcome.css').includes('.menu-row.is-reordering{z-index:1000') && read('welcome.css').includes('transform:scale(1.035)'), 'public Welcome selected row has visible raised-state styling');
check(app.includes("hit.classList.contains('guest-system-tile')") && publicWelcomeJs.includes("hit.classList.contains('system-menu-tile')"), 'protected Help & Emergency remains excluded from reorder targets');


// v0.40.0 property walkthrough / physical QR touchpoints
for(const id of ['qrTouchpointLocation','qrTouchpointExisting','qrTouchpointDestination','qrTouchpointLabel','qrTouchpointPriority','qrTouchpointNote','addQrTouchpointBtn','qrTouchpointList','qrTouchpointSummary']) check(html.includes(`id="${id}"`),`QR touchpoint UI id present: ${id}`);
check(app.includes("PAPA_GOLF_QR_TOUCHPOINTS_KEY='papaGolfQrTouchpointsV1'"),'private QR touchpoint storage key declared');
check(app.includes('getQrTouchpoints')&&app.includes('saveQrTouchpoints')&&app.includes('renderQrTouchpoints'),'QR touchpoint audit runtime present');
check(app.includes('qrTouchpoints: getQrTouchpoints()')&&app.includes('[PAPA_GOLF_QR_TOUCHPOINTS_KEY, welcome.qrTouchpoints]'),'QR touchpoints included in backup and restore');
check(app.includes('welcomeSectionUrl')&&app.includes("params.set('s'"),'touchpoint links deep-link to exact Welcome section');
check(publicWelcomeJs.includes('PUBLIC_SECTION_PANELS')&&publicWelcomeJs.includes('openRequestedPublicSection'),'public Welcome supports physical QR section deep links');
check(publicWelcomeJs.includes("sharedHashParams().get('s')"),'public Welcome reads section destination from URL fragment');
check(read('styles.css').includes('.qr-touchpoint-card')&&read('styles.css').includes('.qr-touchpoint-qr'),'QR touchpoint audit has mobile card and QR styling');
check(app.includes("Permanent shared QR")&&app.includes("Local snapshot QR"),'touchpoint cards distinguish permanent shared QR from Local Alpha snapshot');

// v0.41.0 contextual navigation + Quick Essentials density
check(html.includes('id="welcomeGuestBackBtn" class="pg-round-nav-btn"')&&html.includes('id="welcomeGuestHomeBtn" class="pg-round-nav-btn"'),'owner Guest Preview has compact round Back and Home controls');
check(app.includes("PG_NAV_HISTORY_KEY = 'papaGolfNavHistoryV1'")&&app.includes('sessionStorage'),'Papa Golf route history is session-scoped and contains no persistent guest data');
check(app.includes('function papaGolfGoBack()')&&app.includes('function papaGolfGoHome()')&&app.includes('guest-panel:'),'Back/Home navigation supports guest detail history');
check(app.includes("papaGolfCurrentRoute==='photos-home' && preview")&&app.includes("applyPapaGolfRoute('welcome-admin')"),'Safari-restored Guest Preview has a safe Back fallback');
check(!publicWelcome.includes('welcomeGuestHomeBtn')&&!publicWelcome.includes('pg-round-nav-btn'),'public Welcome does not expose owner/admin navigation controls');
check(read('styles.css').includes('.pg-round-nav-btn')&&read('styles.css').includes('min-width:46px'),'owner Back/Home controls retain comfortable touch targets');
check(read('styles.css').includes('.guest-essential-action{display:grid;grid-template-columns:38px')&&read('welcome.css').includes('.quick-action{display:grid;grid-template-columns:38px'),'Quick Essentials is compacted consistently in preview and public Welcome');

// v0.41.1 Home return continuity
check(html.includes('id="homeReturnBackBtn"')&&html.includes('pg-home-return-back hidden'),'Home landing includes a normally-hidden round return Back control');
check(app.includes('function syncPapaGolfHomeReturnNav()')&&app.includes("papaGolfCurrentRoute==='photos-home' && readPapaGolfNavHistory().length>0"),'Home return Back appears only when an in-app route exists');
check(app.includes("document.getElementById('homeReturnBackBtn')?.addEventListener('click',papaGolfGoBack)"),'Home return Back uses the same Papa Golf navigation stack');
check(read('styles.css').includes('.pg-home-return-back')&&read('styles.css').includes('min-width:44px'),'Home return Back retains a comfortable touch target');


// v0.42.0 navigation normalization + audit photos/reports
check(html.includes('id="welcomeHomeBtn" class="pg-round-nav-btn')&&html.includes('id="welcomeA5HomeBtn" class="pg-round-nav-btn'),'Welcome admin and A5 preview use standard round Home controls');
check(!html.includes('id="welcomeBackBtn" class="secondary-btn"')&&!html.includes('id="welcomeA5BackBtn" class="secondary-btn"'),'legacy large Welcome Back buttons removed');
for(const id of ['qrTouchpointCameraInput','qrTouchpointPhotoInput','clearQrTouchpointPhotoBtn','previewQrAuditReportBtn','printQrAuditReportBtn','qrAuditReportDialog']) check(html.includes(`id="${id}"`),`audit photo/report UI present: ${id}`);
check(app.includes("PAPA_GOLF_AUDIT_ASSET_DB='papa-golf-audit-assets-v01'")&&app.includes('prepareAuditPhoto'),'private audit photo asset store and compression present');
check(app.includes('auditPhotoAssets:')&&app.includes('welcome.auditPhotoAssets'),'backup and restore include audit photo assets');
check(app.includes('version: 11'),'backup format advanced to v11');
check(app.includes('function buildQrAuditReport()')&&app.includes('Open guest demo'),'manager-facing audit report includes live demo destination');
check(app.includes("pushPapaGolfRoute(id==='photosTabBtn'?'photos-home':id==='mapTabBtn'?'map-view':'areas-view')"),'main tabs participate in Papa Golf navigation history');
check(read('styles.css').includes('.qr-audit-report-dialog')&&read('styles.css').includes('.qr-touchpoint-photo-preview'),'audit report and photo capture have responsive styling');


// v0.42.1 deep navigation audit
check(html.includes('id="pgGlobalNav"')&&html.includes('id="pgGlobalBackBtn"')&&html.includes('id="pgGlobalHomeBtn"'),'single global Back/Home navigation cluster exists');
check(app.includes('function syncPapaGolfGlobalNav()')&&app.includes("home.classList.toggle('hidden',isHome)"),'global navigation is route-aware');
check(app.includes("document.getElementById('pgGlobalBackBtn')?.addEventListener('click',papaGolfGoBack)")&&app.includes("document.getElementById('pgGlobalHomeBtn')?.addEventListener('click',papaGolfGoHome)"),'global Back/Home controls use Papa Golf route stack');
check(styles.includes('.pg-global-nav{position:fixed')&&styles.includes('z-index:3000'),'global navigation is fixed above internal screens');
check(styles.includes('.pg-screen-nav,.pg-preview-nav,.pg-home-return-back{display:none!important}'),'fragmented local navigation copies are visually retired');
check(!publicWelcome.includes('pgGlobalNav')&&!publicWelcome.includes('pgGlobalBackBtn'),'public Welcome does not expose owner/admin global navigation');

if(fail.length){
  console.error('\nPapa Golf validation FAILED:');
  for(const x of fail) console.error('✗',x);
  process.exit(1);
}
console.log(`\nPapa Golf validation passed for v${v}.`);
