/* Account request workflow: pending request -> admin approval -> REF_USER active account. */
const ACCOUNT_REQUEST_HEADERS_ = Object.freeze([
  'RequestId','SubmittedAt','nama_petugas','email','NoWhatsapp','jenis','nama_faskes','AlamatFaskes','UnitKerja','faskes_key',
  'FaskesKey','Kecamatan','Kelurahan','Pengampu','KodePuskesmas','StatusPermohonan',
  'ConsentAccepted','ReviewedAt','ReviewerEmail','FinalRole','FinalScopeLevel',
  'ReviewNote','UsernameCreated','UserCreatedAt','TelegramChatId','TelegramUsername'
]);
const ACCOUNT_REQUEST_STATUS_ = Object.freeze({ PENDING:'MENUNGGU', APPROVED:'DISETUJUI', REJECTED:'DITOLAK' });
const FACILITY_CORRECTION_HEADERS_ = Object.freeze(['CorrectionId','SubmittedAt','RequestId','KodeFaskes','NamaFaskesMaster','NamaFaskesUsulan','AlamatMaster','AlamatUsulan','KecamatanMaster','KecamatanUsulan','KelurahanMaster','KelurahanUsulan','PengampuMaster','PengampuUsulan','CatatanKoreksi','StatusKoreksi','ReviewedAt','ReviewerEmail','ReviewNote']);
const DEPOK_WILAYAH_ = Object.freeze({
  'Beji':['Beji','Beji Timur','Kemiri Muka','Kukusan','Pondok Cina','Tanah Baru'],
  'Bojongsari':['Bojongsari Baru','Bojongsari Lama','Curug','Duren Mekar','Duren Seribu','Pondok Petir','Serua'],
  'Cilodong':['Cilodong','Jatimulya','Kalibaru','Kalimulya','Sukamaju'],
  'Cimanggis':['Cisalak Pasar','Curug','Harjamukti','Mekarsari','Pasir Gunung Selatan','Tugu'],
  'Cinere':['Cinere','Gandul','Pangkalan Jati','Pangkalan Jati Baru'],
  'Cipayung':['Bojong Pondok Terong','Cipayung','Cipayung Jaya','Pondok Jaya','Ratujaya'],
  'Limo':['Grogol','Krukut','Limo','Meruyung'],
  'Pancoran Mas':['Depok','Depok Jaya','Mampang','Pancoran Mas','Rangkapan Jaya','Rangkapan Jaya Baru'],
  'Sawangan':['Bedahan','Cinangka','Kedaung','Pasir Putih','Pengasinan','Sawangan Baru','Sawangan Lama'],
  'Sukmajaya':['Abadijaya','Bakti Jaya','Cisalak','Mekar Jaya','Sukmajaya','Tirtajaya'],
  'Tapos':['Cilangkap','Cimpaeun','Jatijajar','Leuwinanggung','Sukamaju Baru','Sukatani','Tapos']
});
function _facilityCorrectionSheet_(){const ss=getSpreadsheet_();let sh=ss.getSheetByName('KOREKSI_FASKES');if(!sh)sh=ss.insertSheet('KOREKSI_FASKES');const h=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getDisplayValues()[0].map(String);if(!h.some(function(x){return x.trim();}))sh.getRange(1,1,1,FACILITY_CORRECTION_HEADERS_.length).setValues([FACILITY_CORRECTION_HEADERS_]);else FACILITY_CORRECTION_HEADERS_.filter(function(x){return h.indexOf(x)<0;}).forEach(function(x){sh.getRange(1,sh.getLastColumn()+1).setValue(x);});sh.setFrozenRows(1);return sh;}
function _facilityCorrectionId_(){return 'COR-' + Utilities.getUuid().replace(/-/g,'').slice(0,20).toUpperCase();}
function _saveFacilityCorrection_(p,requestId){const changed=String(p.alamatUsulan||'').trim()||String(p.kecamatanUsulan||'').trim()||String(p.kelurahanUsulan||'').trim()||String(p.catatanKoreksi||'').trim();if(!changed)return '';const sh=_facilityCorrectionSheet_(),h=_accountHeaders_(sh),m=p.master||{},row=h.map(function(x){return ({CorrectionId:_facilityCorrectionId_(),SubmittedAt:new Date(),RequestId:requestId,KodeFaskes:p.faskesKey||'',NamaFaskesMaster:m.nama||'',NamaFaskesUsulan:p.namaFaskesUsulan||'',AlamatMaster:m.alamat||'',AlamatUsulan:p.alamatUsulan||'',KecamatanMaster:m.kecamatan||'',KecamatanUsulan:p.kecamatanUsulan||'',KelurahanMaster:m.kelurahan||'',KelurahanUsulan:p.kelurahanUsulan||'',PengampuMaster:m.pengampu||'',PengampuUsulan:p.pengampu||'',CatatanKoreksi:p.catatanKoreksi||'',StatusKoreksi:'MENUNGGU'}[x]||'');});sh.appendRow(row);return row[h.indexOf('CorrectionId')];}

function _accountRequestSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName('PERMOHONAN_USER');
  if (!sh) sh = ss.insertSheet('PERMOHONAN_USER');
  const last = Math.max(1, sh.getLastColumn());
  const headers = sh.getRange(1,1,1,last).getDisplayValues()[0].map(String);
  if (!headers.some(function(h){ return h.trim(); })) sh.getRange(1,1,1,ACCOUNT_REQUEST_HEADERS_.length).setValues([ACCOUNT_REQUEST_HEADERS_]);
  else ACCOUNT_REQUEST_HEADERS_.filter(function(h){ return headers.indexOf(h) < 0; }).forEach(function(h){ sh.getRange(1,sh.getLastColumn()+1).setValue(h); });
  sh.setFrozenRows(1);
  return sh;
}
function _accountHeaders_(sh){ return sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();}); }
function _accountIndex_(headers,names){ return _headerIndexCI_(headers,names); }
function _accountRequestId_(){ return 'REQ-' + Utilities.getUuid().replace(/-/g,'').slice(0,20).toUpperCase(); }
function _accountEmail_(v){ return String(v||'').trim().toLowerCase(); }
function _accountRowObject_(headers,row){ return headers.reduce(function(o,h,i){if(h)o[h]=row[i];return o;},{}); }
function _accountPick_(obj,names){for(var i=0;i<names.length;i++){var v=obj[names[i]];if(String(v||'').trim())return String(v||'').trim();}return '';}
function _accountFaskesMap_(){
  const sh=getSheetOrNull_('REF_FASKES'), map={}; if(!sh||sh.getLastRow()<2)return map;
  const values=sh.getDataRange().getDisplayValues(), headers=values[0].map(function(v){return String(v||'').trim().toLowerCase();});
  const pick=function(names){return _accountIndex_(headers,names);};
  const iname=pick(['namafaskes','nama faskes','namafasyankes','nama fasyankes','nama']), icode=pick(['kodefaskes','kode faskes','faskeskey','key','kode']), ialamat=pick(['alamatfaskes','alamat faskes','alamat']), ikec=pick(['kecamatan','nama kecamatan']), ikel=pick(['kelurahan','nama kelurahan']), ipeng=pick(['pengampu','faskespengampu','puskesmas pengampu','uptd pengampu']);
  values.slice(1).forEach(function(r){const nama=iname>=0?String(r[iname]||'').trim():'', kode=icode>=0?String(r[icode]||'').trim():''; if(!nama&&!kode)return; const o={nama:nama,kode:kode,alamat:ialamat>=0?String(r[ialamat]||'').trim():'',kecamatan:ikec>=0?String(r[ikec]||'').trim():'',kelurahan:ikel>=0?String(r[ikel]||'').trim():'',pengampu:ipeng>=0?String(r[ipeng]||'').trim():''}; if(kode)map[_accountNormalize_(kode)]=o; if(nama)map[_accountNormalize_(nama)]=o;});
  return map;
}
function _accountNormalizeRequest_(r,faskesMap){
  const code=_accountPick_(r,['faskes_key','KodeFaskes','KodePuskesmas','FaskesKey']);
  const name=_accountPick_(r,['nama_faskes','NamaFaskes']);
  const master=(faskesMap&&faskesMap[_accountNormalize_(code)])||(faskesMap&&faskesMap[_accountNormalize_(name)])||{};
  if(!String(r.nama_faskes||'').trim())r.nama_faskes=master.nama||'';
  if(!String(r.faskes_key||'').trim())r.faskes_key=master.kode||code;
  if(!String(r.AlamatFaskes||'').trim())r.AlamatFaskes=master.alamat||'';
  if(!String(r.Kecamatan||'').trim())r.Kecamatan=master.kecamatan||'';
  if(!String(r.Kelurahan||'').trim())r.Kelurahan=master.kelurahan||'';
  if(!String(r.Pengampu||'').trim())r.Pengampu=master.pengampu||'';
  return r;
}
function _accountFindUserEmail_(email){ const sh=getSheetOrNull_('REF_USER'); if(!sh)return false; const h=_accountHeaders_(sh), ix=_accountIndex_(h,['Gmail','Email','email']); if(ix<0)return false; return sh.getDataRange().getDisplayValues().slice(1).some(function(r){return _accountEmail_(r[ix])===email;}); }
function _accountPendingEmail_(sh,email){ const h=_accountHeaders_(sh), vals=sh.getDataRange().getDisplayValues(); const ie=_accountIndex_(h,['email','Gmail','Email']), is=_accountIndex_(h,['StatusPermohonan']); return vals.slice(1).some(function(r){return ie>=0&&is>=0&&_accountEmail_(r[ie])===email&&String(r[is]).trim()===ACCOUNT_REQUEST_STATUS_.PENDING;}); }
function _accountPublicError_(message,code,fields){ return {status:'error',code:code||'ACCOUNT_REQUEST_ERROR',message:String(message),fieldErrors:fields||[]}; }
function _accountNormalize_(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function _accountResolveFaskes_(nameOrCode){
  const key=_accountNormalize_(nameOrCode); if(!key)return {nama:'',kode:''};
  const sh=getSheetOrNull_('REF_FASKES'); if(!sh||sh.getLastRow()<2)return {nama:String(nameOrCode||'').trim(),kode:String(nameOrCode||'').trim()};
  const values=sh.getDataRange().getDisplayValues(), headers=values[0].map(function(v){return String(v||'').trim().toLowerCase();});
  const pick=function(names){return _accountIndex_(headers,names);};
  const iname=pick(['namafaskes','nama faskes','namafasyankes','nama fasyankes','nama']), icode=pick(['kodefaskes','kode faskes','faskeskey','key','kode']);
  for(let i=1;i<values.length;i++){const r=values[i], nama=iname>=0?String(r[iname]||'').trim():'', kode=icode>=0?String(r[icode]||'').trim():''; if(_accountNormalize_(nama)===key||_accountNormalize_(kode)===key)return {nama:nama||String(nameOrCode||'').trim(),kode:kode||String(nameOrCode||'').trim()};}
  return {nama:String(nameOrCode||'').trim(),kode:String(nameOrCode||'').trim()};
}

// Safe, unauthenticated lookup for account-request form. Return only facility
// routing fields; never expose email, phone, or other REF_FASKES columns.
function getPublicAccountRequestMaster(){
  try {
    const sh=getSheetOrNull_('REF_FASKES'); if(!sh||sh.getLastRow()<2)return {status:'success',faskes:[]};
    const values=sh.getDataRange().getDisplayValues(), headers=values[0].map(function(v){return String(v||'').trim().toLowerCase();});
    const pick=function(names){for(const n of names){const i=headers.indexOf(n.toLowerCase());if(i>=0)return i;}return -1;};
    const name=pick(['namafaskes','nama faskes','namafasyankes','nama fasyankes','nama']), key=pick(['kodefaskes','kode faskes','faskeskey','key','kode']), type=pick(['jenis','jenis faskes','jenisfaskes','tipe','type']),
      address=pick(['alamat','alamat faskes','alamatfaskes']), kec=pick(['kecamatan','nama kecamatan']), kel=pick(['kelurahan','nama kelurahan']), peng=pick(['pengampu','faskespengampu','puskesmas pengampu','uptd pengampu']), status=pick(['statusaktif','status aktif','aktif','status']);
    if(name<0)return {status:'success',faskes:[]};
    const out=[]; values.slice(1).forEach(function(r){
      const active=status<0||!['tidak','nonaktif','non-aktif','0','false'].includes(String(r[status]||'').trim().toLowerCase());
      const n=String(r[name]||'').trim(); if(!active||!n)return;
      out.push({nama:n,kodeFaskes:key>=0?String(r[key]||'').trim():n,jenis:type>=0?String(r[type]||'').trim():'',alamat:address>=0?String(r[address]||'').trim():'',kecamatan:kec>=0?String(r[kec]||'').trim():'',kelurahan:kel>=0?String(r[kel]||'').trim():'',pengampu:peng>=0?String(r[peng]||'').trim():''});
    });
    // Official wilayah-to-pengampu confirmation comes from REF_PENGAMPU.
    const ps=getSheetOrNull_('REF_PENGAMPU');
    if(ps&&ps.getLastRow()>1){
      const pv=ps.getDataRange().getDisplayValues(), ph=pv[0].map(function(v){return String(v||'').trim().toLowerCase();}), pi=function(n){return ph.indexOf(n.toLowerCase());};
      const pk=pi('kodefaskes'), pn=pi('namapuskesmas'), pc=pi('kecamatan'), pl=pi('kelurahan'), pp=pi('pengampu'), pst=pi('status');
      const byCode={}; pv.slice(1).forEach(function(r){if(pst>=0&&String(r[pst]||'').trim().toLowerCase()!=='aktif')return; const code=pk>=0?String(r[pk]||'').trim():''; if(code)byCode[code]={kecamatan:pc>=0?String(r[pc]||'').trim():'',kelurahan:pl>=0?String(r[pl]||'').trim():'',pengampu:pp>=0?String(r[pp]||'').trim():(pn>=0?String(r[pn]||'').trim():'')};});
      out.forEach(function(x){const m=byCode[String(x.kodeFaskes)];if(m){if(!x.kecamatan)x.kecamatan=m.kecamatan;if(!x.kelurahan)x.kelurahan=m.kelurahan;if(!x.pengampu)x.pengampu=m.pengampu;}});
    }
    const wilayah=Object.keys(DEPOK_WILAYAH_).map(function(kecamatan){return {kecamatan:kecamatan,kelurahan:DEPOK_WILAYAH_[kecamatan].slice()};});
    return {status:'success',faskes:out,wilayah:wilayah,wilayahCount:wilayah.reduce(function(n,x){return n+x.kelurahan.length;},0)};
  }catch(e){return _accountPublicError_('Master faskes belum dapat dibaca.','MASTER_ERROR');}
}

function submitAccountRequest(payload){
  try {
    payload=payload||{}; const nama=String(payload.nama||'').trim(), email=_accountEmail_(payload.gmail), confirm=_accountEmail_(payload.confirmGmail);
    if(nama.length<3)return _accountPublicError_('Nama lengkap minimal 3 karakter.','VALIDATION');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)||email!==confirm)return _accountPublicError_('Email tidak valid atau konfirmasi tidak sama.','VALIDATION');
    if(!payload.unitKerja)return _accountPublicError_('Unit kerja wajib diisi.','VALIDATION');
    const noWhatsapp=String(payload.noWhatsapp||'').trim();
    if(!/^\+?[0-9\s()-]{8,20}$/.test(noWhatsapp))return _accountPublicError_('Nomor WhatsApp tidak valid.','VALIDATION');
    if(!String(payload.namaFaskes||'').trim()||!String(payload.kodeFaskes||payload.kodePuskesmas||payload.faskesKey||'').trim())return _accountPublicError_('Pilih nama faskes dari master. Jangan isi manual di luar daftar.','VALIDATION');
    if(payload.consent!==true)return _accountPublicError_('Persetujuan penggunaan data wajib dicentang.','VALIDATION');
    const lock=LockService.getScriptLock(); lock.waitLock(15000); try {
      const sh=_accountRequestSheet_(); if(_accountFindUserEmail_(email))return _accountPublicError_('Email sudah terdaftar sebagai pengguna.','EMAIL_ALREADY_REGISTERED');
      if(_accountPendingEmail_(sh,email))return _accountPublicError_('Permohonan email ini masih menunggu approval.','REQUEST_ALREADY_PENDING');
      const resolved=_accountResolveFaskes_(payload.kodeFaskes||payload.kodePuskesmas||payload.faskesKey||payload.namaFaskes||payload.unitKerja), faskesName=String(payload.namaFaskes||resolved.nama||payload.unitKerja||'').trim(), faskesCode=String(payload.kodeFaskes||payload.kodePuskesmas||payload.faskesKey||resolved.kode||'').trim();
      const id=_accountRequestId_(), h=_accountHeaders_(sh), row=h.map(function(x){return ({RequestId:id,SubmittedAt:new Date(),nama_petugas:nama,email:email,NoWhatsapp:noWhatsapp,jenis:String(payload.jenisUnit||''),nama_faskes:faskesName,AlamatFaskes:String(payload.alamatFaskes||payload.alamatUsulan||((payload.master&&payload.master.alamat)||'')).trim(),UnitKerja:String(payload.unitKerja||faskesName),faskes_key:faskesCode,FaskesKey:faskesCode,Kecamatan:String(payload.kecamatan||''),Kelurahan:String(payload.kelurahan||''),Pengampu:String(payload.pengampu||''),KodePuskesmas:faskesCode,StatusPermohonan:ACCOUNT_REQUEST_STATUS_.PENDING,ConsentAccepted:true,TelegramChatId:'',TelegramUsername:''}[x]||'');});
      sh.appendRow(row); const correctionId=_saveFacilityCorrection_(payload,id); SpreadsheetApp.flush();
      const notificationDetails = { caseCode: id, namaPemohon: nama, asalPemohon: faskesName || String(payload.unitKerja || '').trim(), action: 'Review permohonan akun baru', workspace: 'admin-akun', status: ACCOUNT_REQUEST_STATUS_.PENDING };
      try { sendAdminOperationalTelegramNotificationsOnce('PERMOHONAN_AKUN_BARU', notificationDetails); } catch (_e) {}
      try { sendAdminOperationalWahaNotificationOnce('PERMOHONAN_AKUN_BARU', notificationDetails); } catch (_e) {}
      return {status:'success',requestId:id,correctionId:correctionId,message:'Permohonan berhasil dikirim. Tunggu verifikasi administrator.'};
    } finally {lock.releaseLock();}
  } catch(e){ console.error('submitAccountRequest',e); return _accountPublicError_('Permohonan belum berhasil disimpan. Silakan coba lagi.','INTERNAL_ERROR'); }
}
function requestTelegramPairingForAccountRequest(requestId, email){
  try {
    const sh=_accountRequestSheet_(), h=_accountHeaders_(sh), vals=sh.getDataRange().getDisplayValues();
    const ir=_accountIndex_(h,['RequestId']), ie=_accountIndex_(h,['email','Gmail','Email']), is=_accountIndex_(h,['StatusPermohonan']);
    for(let i=1;i<vals.length;i++) if(String(vals[i][ir])===String(requestId) && _accountEmail_(vals[i][ie])===_accountEmail_(email) && vals[i][is]===ACCOUNT_REQUEST_STATUS_.PENDING){
      const token=Utilities.getUuid().replace(/-/g,''); CacheService.getScriptCache().put('TG_REQ_'+token, _accountEmail_(email),21600);
      const bot=_telegramApi_('getMe',{}); return {status:'success',url:'https://t.me/'+bot.username+'?start='+token,expiresSec:21600};
    }
    return _accountPublicError_('Permohonan tidak ditemukan atau sudah diproses.','REQUEST_NOT_FOUND');
  }catch(e){return _accountPublicError_('Link Telegram belum dapat dibuat.','TELEGRAM_ERROR');}
}
function _accountAdmin_(token){ const s=_getSessionFromToken_(token); if(!s.ok)throw new Error(s.message||'Sesi habis.'); const role=String(s.user.role||'').toLowerCase(); if(['admin','super-admin','superadmin'].indexOf(role)<0)throw new Error('Akses hanya untuk administrator.'); return s.user; }
function getAccountRequestDashboard(token,status){ try{_accountAdmin_(token); const sh=_accountRequestSheet_(), h=_accountHeaders_(sh), vals=sh.getDataRange().getDisplayValues().slice(1), faskesMap=_accountFaskesMap_(); const rows=vals.map(function(r){return _accountNormalizeRequest_(_accountRowObject_(h,r),faskesMap);}).filter(function(x){return !status||status==='SEMUA'||x.StatusPermohonan===status;}); return {status:'success',requests:rows.slice(-500).reverse(),stats:{pending:rows.filter(function(x){return x.StatusPermohonan===ACCOUNT_REQUEST_STATUS_.PENDING;}).length,approved:rows.filter(function(x){return x.StatusPermohonan===ACCOUNT_REQUEST_STATUS_.APPROVED;}).length,rejected:rows.filter(function(x){return x.StatusPermohonan===ACCOUNT_REQUEST_STATUS_.REJECTED;}).length,all:rows.length}};}catch(e){return _accountPublicError_(e.message,'ADMIN_ERROR');} }
function getFacilityCorrectionDashboard(token,status){try{_accountAdmin_(token);const sh=_facilityCorrectionSheet_(),h=_accountHeaders_(sh),rows=sh.getDataRange().getDisplayValues().slice(1).map(function(r){return _accountRowObject_(h,r);}).filter(function(x){return !status||status==='SEMUA'||x.StatusKoreksi===status;});return {status:'success',corrections:rows.slice(-500).reverse()};}catch(e){return _accountPublicError_(e.message,'CORRECTION_ADMIN_ERROR');}}
function reviewFacilityCorrection(token,correctionId,decision,note){try{const admin=_accountAdmin_(token),sh=_facilityCorrectionSheet_(),h=_accountHeaders_(sh),vals=sh.getDataRange().getValues(),ix=h.indexOf('CorrectionId');for(let i=1;i<vals.length;i++)if(String(vals[i][ix])===String(correctionId)){const row=i+1,current=String(sh.getRange(row,h.indexOf('StatusKoreksi')+1).getDisplayValue());if(current!=='MENUNGGU')return _accountPublicError_('Koreksi sudah diproses.','CORRECTION_ALREADY_REVIEWED');const d=String(decision||'').toUpperCase();if(['DITERIMA','DITOLAK','PERLU_KLARIFIKASI'].indexOf(d)<0)return _accountPublicError_('Keputusan koreksi tidak valid.','VALIDATION');const set=function(k,v){const c=h.indexOf(k);if(c>=0)sh.getRange(row,c+1).setValue(v);};set('StatusKoreksi',d);set('ReviewedAt',new Date());set('ReviewerEmail',admin.email);set('ReviewNote',String(note||''));return {status:'success',message:'Review koreksi tersimpan.',decision:d};}return _accountPublicError_('Koreksi tidak ditemukan.','CORRECTION_NOT_FOUND');}catch(e){return _accountPublicError_(e.message,'CORRECTION_REVIEW_ERROR');}}
function approveAccountRequest(token,requestId,finalRole,finalScopeLevel,note,otpChannel,notificationChannel){ try{const admin=_accountAdmin_(token); finalRole=String(finalRole||'petugas').trim().toLowerCase();finalScopeLevel=String(finalScopeLevel||'puskesmas').trim().toLowerCase().replace(/_/g,'-').replace(/\s+/g,'-');if(finalScopeLevel==='faskes')finalScopeLevel='faskes-pelapor';if(['dinkes','faskes-pelapor','puskesmas'].indexOf(finalScopeLevel)<0)throw new Error('Lingkup akses final tidak valid.');otpChannel=String(otpChannel||'email').trim().toLowerCase();notificationChannel=String(notificationChannel||'email').trim().toLowerCase();if(['email','telegram','both'].indexOf(otpChannel)<0)throw new Error('Kanal OTP final tidak valid.');if(['email','telegram','both','none'].indexOf(notificationChannel)<0)throw new Error('Kanal notifikasi final tidak valid.');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const sh=_accountRequestSheet_(),h=_accountHeaders_(sh),vals=sh.getDataRange().getValues(), ix=_accountIndex_(h,['RequestId']);let n=-1;for(let i=1;i<vals.length;i++)if(String(vals[i][ix])===String(requestId))n=i+1;if(n<0)throw new Error('Permohonan tidak ditemukan.');const current=String(sh.getRange(n,_accountIndex_(h,['StatusPermohonan'])+1).getDisplayValue());if(current!==ACCOUNT_REQUEST_STATUS_.PENDING)throw new Error('Permohonan sudah diproses.');const data=_accountNormalizeRequest_(_accountRowObject_(h,vals[n-1]),_accountFaskesMap_()), userSh=getSheetOrThrow_('REF_USER'), uh=_accountHeaders_(userSh);const dataEmail=_accountPick_(data,['email','Gmail','Email']);if(_accountFindUserEmail_(_accountEmail_(dataEmail)))throw new Error('Email sudah terdaftar pada REF_USER.');const username=_accountEmail_(dataEmail).split('@')[0], resolved=_accountResolveFaskes_(data.faskes_key||data.KodePuskesmas||data.FaskesKey||data.nama_faskes||data.UnitKerja), unitKerja=String(data.UnitKerja||'').trim(), faskesName=String(data.nama_faskes||resolved.nama||unitKerja||'').trim(), kodeFaskes=String(data.faskes_key||data.KodePuskesmas||data.FaskesKey||resolved.kode||'').trim(), alamatFaskes=_accountPick_(data,['AlamatFaskes']);const telegramChatId=String(data.TelegramChatId||'').trim(), telegramUsername=String(data.TelegramUsername||'').trim();const out=uh.map(function(x){return ({Username:username,Gmail:_accountEmail_(dataEmail),Email:_accountEmail_(dataEmail),Nama:data.nama_petugas,Role:finalRole,UnitKerja:unitKerja,NamaFaskes:faskesName,AlamatFaskes:alamatFaskes,'Alamat Faskes':alamatFaskes,KodeFaskes:kodeFaskes,KodePuskesmas:kodeFaskes,ScopeLevel:finalScopeLevel,StatusAktif:'AKTIF',Aktif:'YA',LoginMethod:'OTP_GMAIL',OtpEnabled:'YA',OtpChannel:otpChannel,OtpFallbackChannel:'email',NotificationChannel:notificationChannel,TelegramChatId:telegramChatId,TelegramUsername:telegramUsername,TelegramStatus:telegramChatId?'ACTIVE':'',TelegramVerifiedAt:telegramChatId?new Date():'',OtpTtlMinutes:5,OtpCooldownSeconds:60,Catatan:'Approved '+requestId+' by '+admin.email}[x]||'');});userSh.appendRow(out);const set=function(k,v){const c=_accountIndex_(h,[k]);if(c>=0)sh.getRange(n,c+1).setValue(v);};set('StatusPermohonan',ACCOUNT_REQUEST_STATUS_.APPROVED);set('ReviewedAt',new Date());set('ReviewerEmail',admin.email);set('FinalRole',finalRole);set('FinalScopeLevel',finalScopeLevel);set('ReviewNote',String(note||''));set('UsernameCreated',username);set('UserCreatedAt',new Date());SpreadsheetApp.flush();return {status:'success',message:'Permohonan disetujui dan akun dibuat.',username:username};}finally{lock.releaseLock();}}catch(e){return _accountPublicError_(e.message,'APPROVAL_ERROR');} }
function rejectAccountRequest(token,requestId,reason){try{const admin=_accountAdmin_(token);if(String(reason||'').trim().length<5)return _accountPublicError_('Alasan penolakan minimal 5 karakter.','VALIDATION');const sh=_accountRequestSheet_(),h=_accountHeaders_(sh),vals=sh.getDataRange().getValues(),ix=h.indexOf('RequestId');for(let i=1;i<vals.length;i++)if(String(vals[i][ix])===String(requestId)){const row=i+1;const set=function(k,v){const c=h.indexOf(k);if(c>=0)sh.getRange(row,c+1).setValue(v);};if(String(sh.getRange(row,h.indexOf('StatusPermohonan')+1).getDisplayValue())!==ACCOUNT_REQUEST_STATUS_.PENDING)return _accountPublicError_('Permohonan sudah diproses.','REQUEST_ALREADY_REVIEWED');set('StatusPermohonan',ACCOUNT_REQUEST_STATUS_.REJECTED);set('ReviewedAt',new Date());set('ReviewerEmail',admin.email);set('ReviewNote',String(reason).trim());return {status:'success',message:'Permohonan ditolak.'};}return _accountPublicError_('Permohonan tidak ditemukan.','REQUEST_NOT_FOUND');}catch(e){return _accountPublicError_(e.message,'REJECTION_ERROR');}}
