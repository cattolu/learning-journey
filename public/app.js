const S={user:null,role:'student',page:'dashboard'};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function api(url,opt={}){
  const r=await fetch(url,{
    ...opt,
    headers:{
      ...(opt.body instanceof FormData?{}:{'Content-Type':'application/json'}),
      ...(opt.headers||{})
    }
  });

  let d={};
  try{
    d=await r.json();
  }catch{}

  if(!r.ok)throw Error(d.message||'Terjadi kesalahan.');
  return d;
}

function toast(msg){
  const t=$('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2400);
}

function openModal(html){
  $('modalBody').innerHTML=html;
  $('modal').classList.remove('hidden');
}

function closeModal(){
  $('modal').classList.add('hidden');
}

window.closeModal=closeModal;

function progress(v){
  v=Math.max(0,Math.min(100,Number(v)||0));
  return `<div class="progress"><span style="width:${v}%"></span></div>`;
}

function pageHead(k,t,desc='',actions=''){
  return `<div class="pageHead">
    <div>
      <span class="pill">${esc(k)}</span>
      <h1>${esc(t)}</h1>
      <p>${esc(desc)}</p>
    </div>
    <div>${actions}</div>
  </div>`;
}

const studentNav=[
  ['dashboard','⌂','Dashboard'],
  ['journey','◉','My Journey'],
  ['subjects','▣','Mata Pelajaran'],
  ['reflection','✎','Reflection Studio'],
  ['competencies','◆','My Competencies'],
  ['goals','◎','Learning Goals'],
  ['archive','▤','School Archive'],
  ['lab','KELAS 12','label'],
  ['tka','✓','TKA Preparation'],
  ['university','🎓','University Preparation'],
  ['career','▸','Career Preparation'],
  ['future','→','Future Pathway'],
  ['pers','PERSONAL','label'],
  ['achievements','★','Achievements'],
  ['portfolio','▧','Portfolio']
];

const teacherNav=[
  ['dashboard','⌂','Dashboard'],
  ['students','♙','Students'],
  ['curriculum','▣','Curriculum'],
  ['monitoring','◉','Monitoring Reflections'],
  ['competencies','◆','Competency Analytics'],
  ['reports','▤','Reports']
];

const titles={
  dashboard:'Dashboard',
  journey:'My Journey',
  subjects:'Mata Pelajaran',
  reflection:'Reflection Studio',
  competencies:'My Competencies',
  goals:'Learning Goals',
  archive:'School Archive',
  tka:'TKA Preparation',
  university:'University Preparation',
  career:'Career Preparation',
  future:'Future Pathway',
  achievements:'Achievements',
  portfolio:'Portfolio',
  students:'Students',
  monitoring:'Monitoring Reflections',
  reports:'Reports',
  curriculum:'Curriculum'
};

function nav(){
  const arr=S.user.role==='teacher'?teacherNav:studentNav;

  $('nav').innerHTML=arr.map(x=>
    x[2]==='label'
      ?`<div class="navlabel">${esc(x[1])}</div>`
      :`<button data-p="${x[0]}">
          <span class="navicon">${x[1]}</span>
          <span>${esc(x[2])}</span>
        </button>`
  ).join('');

  document.querySelectorAll('#nav button').forEach(b=>{
    b.onclick=()=>go(b.dataset.p);
  });
}

function profile(){
  const u=S.user;
  const i=esc((u.name||'U')[0]);

  $('profile').innerHTML=`
    <div class="avatar">${i}</div>
    <div>
      <b>${esc(u.name)}</b>
      <small>${u.role==='teacher'?'Guru • MPLB':'Siswa • MPLB'}</small>
    </div>
  `;

  $('topUser').innerHTML=`
    <div class="avatar">${i}</div>
    <span>
      ${esc(u.name)}
      <small>${u.role==='teacher'?'Teacher':'Student'}</small>
    </span>
  `;
}

function show(){
  $('landing').classList.add('hidden');
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');

  nav();
  profile();
  go('dashboard');
}

function showLanding(){
  $('app').classList.add('hidden');
  $('login').classList.add('hidden');
  $('landing').classList.remove('hidden');
  window.scrollTo(0,0);
}

function showLogin(){
  $('landing').classList.add('hidden');
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');
  window.scrollTo(0,0);

  setTimeout(()=>{
    $('username')?.focus();
  },50);
}

function toggleSidebar(open){
  document.querySelector('.sidebar')?.classList.toggle('open',!!open);
  $('mobileOverlay')?.classList.toggle('show',!!open);
}

window.showLanding=showLanding;
window.showLogin=showLogin;
window.toggleSidebar=toggleSidebar;

async function login(){
  try{
    const d=await api('/api/login',{
      method:'POST',
      body:JSON.stringify({
        username:$('username').value.trim(),
        password:$('password').value,
        role:S.role
      })
    });

    S.user=d.user;
    $('loginError').textContent='';
    show();

  }catch(e){
    $('loginError').textContent=e.message;
  }
}
// Tekan Enter untuk login
$('username').addEventListener('keydown', function(e){
  if(e.key === 'Enter'){
    e.preventDefault();
    login();
  }
});

$('password').addEventListener('keydown', function(e){
  if(e.key === 'Enter'){
    e.preventDefault();
    login();
  }
});

/* =====================================================
   LOGIN ROLE
   Default hanya mengisi contoh akun.
   User tetap bebas mengganti username/password.
   ===================================================== */

document.querySelectorAll('.roles button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.roles button')
      .forEach(x=>x.classList.remove('active'));

    b.classList.add('active');
    S.role=b.dataset.role;

if(S.role==='student'){
  $('username').value='ramdhani.smkcn';
  $('password').value='ramdhani17';
}else{
  $('username').value='guru10';
  $('password').value='guru123';
}
  };
});

$('loginBtn').onclick=login;

$('password').onkeydown=e=>{
  if(e.key==='Enter')login();
};

$('logout').onclick=async()=>{
  await api('/api/logout',{method:'POST'});
  S.user=null;
  showLanding();
};

async function go(page){
  S.page=page;

  toggleSidebar(false);

  document.querySelectorAll('#nav button')
    .forEach(b=>b.classList.toggle('active',b.dataset.p===page));

  $('title').textContent=titles[page]||page;

  $('crumb').textContent=
    S.user.role==='teacher'
      ?'Teacher Workspace'
      :'Student Dashboard';

  $('content').innerHTML='<div class="empty">Memuat...</div>';

  try{
    await pages[page]();
  }catch(e){
    console.error(e);
    $('content').innerHTML=
      `<div class="empty">
        <b>Gagal memuat halaman</b><br>
        ${esc(e.message)}
      </div>`;
  }
}

window.go=go;


/* =====================================================
   DASHBOARD
   ===================================================== */

async function dashboard(){
  const d=await api('/api/dashboard');

  if(S.user.role==='teacher')
    return teacherDashboard(d);

  const s=d.stats;

  $('content').innerHTML=`
    <section class="hero">
      <div>
        <span class="pill">✦ YOUR LEARNING JOURNEY</span>

        <h1>
          Satu perjalanan,<br>
          <span>tiga tahun perkembangan.</span>
        </h1>

        <p>
          Catat apa yang kamu pelajari, lihat perkembangan kompetensimu,
          dan siapkan langkahmu menuju masa depan.
        </p>

        <button class="primary" onclick="reflectionForm()">
          ✎ Mulai Refleksi
        </button>
      </div>

      <div class="orbit-mini">
        <i class="dot a">10</i>
        <i class="dot b">11</i>
        <i class="dot c">12</i>

        <div>
          <strong>3</strong>
          <small>YEARS</small>
        </div>
      </div>
    </section>

    <div class="grid stats">
      <div class="stat">
        <div>
          <span class="muted">Reflections</span>
          <div class="num">${s.reflections}</div>
        </div>
        <div class="icon">✎</div>
      </div>

      <div class="stat">
        <div>
          <span class="muted">Competencies</span>
          <div class="num">${s.averageCompetency}%</div>
        </div>
        <div class="icon">◆</div>
      </div>

      <div class="stat">
        <div>
          <span class="muted">Learning Goals</span>
          <div class="num">${s.goals}</div>
        </div>
        <div class="icon">◎</div>
      </div>

      <div class="stat">
        <div>
          <span class="muted">Portfolio</span>
          <div class="num">${s.portfolio}</div>
        </div>
        <div class="icon">▧</div>
      </div>
    </div>

    <div class="grid two">

      <div class="card">
        <div class="cardHead">
          <h3>Perjalanan Belajarmu</h3>
          <button class="ghost" onclick="go('journey')">
            Lihat semua →
          </button>
        </div>

        <div class="grid journey">
          <div class="step active">
            <b>10</b>
            <span>Foundation</span>
          </div>

          <div class="step">
            <b>11</b>
            <span>Development</span>
          </div>

          <div class="step">
            <b>12</b>
            <span>Preparation</span>
          </div>

          <div class="step">
            <b>∞</b>
            <span>Future</span>
          </div>
        </div>

        <div class="progressRow">
          <div>
            <span>Overall competency</span>
            <b>${s.averageCompetency}%</b>
          </div>
          ${progress(s.averageCompetency)}
        </div>
      </div>

      <div class="card">
        <div class="cardHead">
          <h3>One Thing I Learned</h3>
          <button class="ghost" onclick="reflectionForm()">
            + Tambah
          </button>
        </div>

        ${
          d.reflections.map(r=>`
            <div class="item">
              <b>${esc(r.learned)}</b>
              <small>${esc(r.subject)} • ${esc(r.date)}</small>
            </div>
          `).join('')
          ||
          '<div class="empty">Belum ada refleksi.</div>'
        }
      </div>

    </div>
  `;
}

async function teacherDashboard(d){
  const s=d.stats;

  $('content').innerHTML=`
    <section class="hero">
      <div>
        <span class="pill">TEACHER MONITORING</span>

        <h1>
          Pantau perjalanan belajar<br>
          <span>setiap siswa.</span>
        </h1>

        <p>
          Lihat refleksi, kompetensi, goals, portfolio,
          dan feedback dalam satu workspace.
        </p>

        <button class="primary" onclick="go('students')">
          ♙ Lihat Siswa
        </button>
      </div>

      <div class="orbit-mini">
        <i class="dot a">${s.students}</i>
        <i class="dot b">${s.reflections}</i>
        <i class="dot c">${s.averageCompetency}%</i>

        <div>
          <strong>LIVE</strong>
          <small>MONITORING</small>
        </div>
      </div>
    </section>

    <div class="grid stats">

      <div class="stat">
        <span class="muted">Students</span>
        <div class="num">${s.students}</div>
        <div class="icon">♙</div>
      </div>

      <div class="stat">
        <span class="muted">Reflections</span>
        <div class="num">${s.reflections}</div>
        <div class="icon">✎</div>
      </div>

      <div class="stat">
        <span class="muted">Average Competency</span>
        <div class="num">${s.averageCompetency}%</div>
        <div class="icon">◆</div>
      </div>

      <div class="stat">
        <span class="muted">Active Goals</span>
        <div class="num">${s.activeGoals}</div>
        <div class="icon">◎</div>
      </div>

    </div>

    <div class="grid two">

      <div class="card">
        <div class="cardHead">
          <h3>Students</h3>
          <button class="ghost" onclick="go('students')">
            Monitoring →
          </button>
        </div>

        ${
          d.students.map(x=>`
            <div class="item">
              <b>${esc(x.name)}</b>
              <small>
                ${esc(x.class)} • ${esc(x.status)}
                <button class="ghost" onclick="studentDetail('${x.id}')">
                  Detail
                </button>
              </small>
            </div>
          `).join('')
        }
      </div>

      <div class="card">
        <h3>Competency Analytics</h3>

        ${
          d.competencies.slice(0,7).map(x=>`
            <div class="progressRow">
              <div>
                <span>${esc(x.name)}</span>
                <b>${x.progress}%</b>
              </div>
              ${progress(x.progress)}
            </div>
          `).join('')
        }
      </div>

    </div>
  `;
}
/* =====================================================
   JOURNEY
   ===================================================== */

async function journey(){
  const [r,g,f]=await Promise.all([
    api('/api/reflections'),
    api('/api/goals'),
    api('/api/future')
  ]);

  $('content').innerHTML=
    pageHead(
      'MY JOURNEY',
      'Perjalanan Belajarku',
      'Jejak perkembangan dari foundation sampai future pathway.'
    )
    +
    `
    <div class="grid journey">

      <div class="step active">
        <b>10</b>
        <span>Foundation</span>
      </div>

      <div class="step">
        <b>11</b>
        <span>Development</span>
      </div>

      <div class="step">
        <b>12</b>
        <span>Preparation</span>
      </div>

      <div class="step">
        <b>∞</b>
        <span>Future Journey</span>
      </div>

    </div>

    <div class="grid three">

      <div class="card">
        <h3>${r.length}</h3>
        <p class="muted">Refleksi</p>
      </div>

      <div class="card">
        <h3>${g.length}</h3>
        <p class="muted">Learning Goals</p>
      </div>

      <div class="card">
        <h3>${f.length}</h3>
        <p class="muted">Future Plans</p>
      </div>

    </div>

    <div class="card">
      <div class="cardHead">
        <h3>Learning Timeline</h3>
        <span class="badge">${r.length} refleksi</span>
      </div>

      <div class="timeline">

        ${
          r.slice().reverse().map(x=>`
            <div class="item">
              <b>${esc(x.topic)}</b>
              <small>
                ${esc(x.subject)} • ${esc(x.date)} •
                <span class="level">${esc(x.level)}</span>
              </small>
              <p class="muted">${esc(x.learned)}</p>
            </div>
          `).join('')
          ||
          '<div class="empty">Belum ada perjalanan.</div>'
        }

      </div>
    </div>
    `;
}


/* =====================================================
   SUBJECTS
   ===================================================== */

async function subjects(grade){

  const allowedGrade=Number(S.user.grade||10);

  const current=allowedGrade;

  S.subjectGrade=current;

  const a=await api('/api/subjects?grade='+current);

  const total=a.length
    ?Math.round(
      a.reduce((n,x)=>n+Number(x.progress||0),0)/a.length
    )
    :0;

  $('content').innerHTML=

    pageHead(
      'SUBJECT LIBRARY',
      `Mata Pelajaran — ${current} MPLB`,
      'Setiap mata pelajaran memiliki bab/submateri. Progress hanya bertambah berdasarkan aktivitas yang kamu tandai.'
    )

    +

    `<div class="grade-switch">

      ${[10,11,12].map(g=>{

        const isAllowed=g===allowedGrade;

        return `
          <button
            class="${g===current?'active':''}"
            ${isAllowed?`onclick="subjects(${g})"`:'disabled'}
            style="${isAllowed?'':'opacity:.45;cursor:not-allowed;'}"
          >
            ${g} MPLB ${isAllowed?'':'🔒'}
          </button>
        `;

      }).join('')}

    </div>`

    +

    `<div class="overall-banner">

      <div class="cardHead">

        <div>

          <h3>Progress menyeluruh ${current} MPLB</h3>

          <p class="muted">
            Rata-rata progress semua mata pelajaran pada tingkat ini.
          </p>

        </div>

        <strong class="metric" style="font-size:32px">
          ${total}%
        </strong>

      </div>

      ${progress(total)}

      <small class="muted">
        ${a.reduce((n,x)=>n+Number(x.chapters||0),0)} bab tersedia
      </small>

    </div>`

    +

    `<div class="grid three">

      ${
        a.map(x=>`

          <div class="subject">

            <div class="subjectTop">

              <div class="subjectIcon">
                ${x.icon||'▣'}
              </div>

              <span class="badge">
                ${x.progress}%
              </span>

            </div>

            <h3>${esc(x.name)}</h3>

            <p class="muted">
              ${esc(x.category)} • ${x.chapters} bab
            </p>

            ${progress(x.progress)}

            <div class="mini-progress">
              ${x.progress===0?'Belum dimulai':'Sedang berjalan'}
            </div>

            <button
              class="ghost"
              style="margin-top:14px"
              onclick="subjectDetail('${x.id}')"
            >
              Lihat bab & progress →
            </button>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada mata pelajaran untuk kelas ini.</div>'
      }

    </div>`;
}


async function subjectDetail(id){

  const x=await api('/api/subjects/'+id);

  const canEdit=S.user.role==='student';

  openModal(`

    <div class="subject-summary">

      <div>

        <span class="pill">KELAS ${esc(x.grade)}</span>

        <h2>${esc(x.name)}</h2>

        <p class="muted">
          ${esc(x.category)} • ${x.chapters.length} bab/submateri
        </p>

      </div>

      <div class="metric">${x.progress}%</div>

    </div>

    ${progress(x.progress)}

    <div class="chapter-list">

      ${
        x.chapters.map((c,i)=>`

          <div class="chapter-row">

            <div class="chapter-num">${i+1}</div>

            <div>

              <div class="chapter-title">
                ${esc(c.title)}
              </div>

              <div class="chapter-meta">
                ${esc(c.description||'')}
                ${c.lastUpdated?`• Update ${esc(c.lastUpdated)}`:''}
              </div>

              ${progress(c.progress)}

              <small class="muted">
                ${c.progress}% · ${esc(c.status)}
              </small>

            </div>

            <div class="chapter-actions">

              ${
                canEdit
                ?`

                  <select onchange="updateChapterProgress('${c.id}',this.value)">

                    <option value="0" ${Number(c.progress)===0?'selected':''}>0% Belum</option>

                    <option value="25" ${Number(c.progress)===25?'selected':''}>25%</option>

                    <option value="50" ${Number(c.progress)===50?'selected':''}>50%</option>

                    <option value="75" ${Number(c.progress)===75?'selected':''}>75%</option>

                    <option value="100" ${Number(c.progress)===100?'selected':''}>100% Selesai</option>

                  </select>

                `
                :''
              }

            </div>

          </div>

        `).join('')
      }

    </div>

    <p class="muted" style="margin-top:18px">

      Setiap bab memiliki progress sendiri. Rata-rata bab membentuk
      progress mata pelajaran, lalu diringkas menjadi progress kelas
      dan dashboard.

    </p>

  `);
}


async function updateChapterProgress(idv,val){

  try{

    await api('/api/chapters/'+idv+'/progress',{
      method:'PUT',
      body:JSON.stringify({
        progress:Number(val)
      })
    });

    toast('Progress bab diperbarui');

    closeModal();

    go('subjects');

  }catch(e){

    toast(e.message);

  }

}


/* =====================================================
   REFLECTION
   ===================================================== */

async function reflection(){

  const a=await api('/api/reflections');

  $('content').innerHTML=

    pageHead(
      'REFLECTION STUDIO',
      'Reflection Studio',
      'Ubah pengalaman belajar menjadi catatan perkembangan yang bermakna.',
      '<button class="primary" onclick="reflectionForm()">+ Tambah Refleksi</button>'
    )

    +

    `<div class="grid twoCards">

      ${
        a.map(x=>`

          <div class="reflection">

            <div class="muted">
              ${esc(x.subject)} • ${esc(x.date)}
              <span class="level">${esc(x.level)}</span>
            </div>

            <h3>${esc(x.topic)}</h3>

            <p>
              <b>One thing I learned:</b>
              ${esc(x.learned)}
            </p>

            <p class="muted">
              <b>Next:</b>
              ${esc(x.nextAction||'-')}
            </p>

            <div class="actions">

              <button
                class="ghost"
                onclick="reflectionDetail('${x.id}')"
              >
                Detail
              </button>

              <button
                class="ghost"
                onclick="reflectionForm('${x.id}')"
              >
                Edit
              </button>

              <button
                class="danger"
                onclick="deleteReflection('${x.id}')"
              >
                Hapus
              </button>

            </div>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada refleksi.</div>'
      }

    </div>`;
}


async function reflectionForm(editId=''){

  let existing=null;

  if(editId){

    existing=(await api('/api/reflections'))
      .find(x=>x.id===editId);

  }

  const a=await api('/api/subjects?grade='+(S.user.grade||10));

  let chapters=[];

  if(existing?.chapterId){

    const subj=a.find(x=>x.name===existing.subject);

    if(subj){

      chapters=(await api('/api/subjects/'+subj.id)).chapters;

    }

  }

  openModal(`

    <h2>✎ ${existing?'Edit':'Tambah'} Reflection</h2>

    <div class="formgrid">

      <label>
        Mata Pelajaran

        <select
          id="fs"
          onchange="loadReflectionChapters(this.value)"
        >

          ${
            a.map(x=>`

              <option
                value="${x.id}"
                ${x.name===existing?.subject?'selected':''}
              >
                ${esc(x.name)}
              </option>

            `).join('')
          }

        </select>

      </label>

      <label>
        Bab yang dipelajari

        <select id="fch">

          <option value="">
            Tidak ditautkan
          </option>

          ${
            chapters.map(c=>`

              <option
                value="${c.id}"
                ${c.id===existing?.chapterId?'selected':''}
              >
                ${esc(c.title)}
              </option>

            `).join('')
          }

        </select>

      </label>

      <label class="wide">
        Level

        <select id="fl">

          ${
            [
              'Belum Memahami',
              'Mulai Memahami',
              'Memahami',
              'Mampu Menerapkan'
            ].map(v=>`

              <option
                ${v===existing?.level?'selected':''}
              >
                ${v}
              </option>

            `).join('')
          }

        </select>

      </label>

      <label class="wide">
        Topik

        <input
          id="ft"
          value="${esc(existing?.topic||'')}"
          placeholder="Contoh: Sistem penyimpanan arsip"
        >

      </label>

      <label class="wide">
        Apa satu hal paling penting yang dipelajari?

        <textarea
          id="fy"
          placeholder="Tuliskan hal utama yang kamu pelajari..."
        >${esc(existing?.learned||'')}</textarea>

      </label>

      <label class="wide">
        Kenapa?

        <textarea
          id="fr"
          placeholder="Kenapa hal tersebut penting bagi kamu?"
        >${esc(existing?.reason||'')}</textarea>

      </label>

      <label class="wide">
        Langkah berikutnya?

        <textarea
          id="fn"
          placeholder="Apa yang akan kamu lakukan setelah ini?"
        >${esc(existing?.nextAction||'')}</textarea>

      </label>

      <label class="wide">
        Link bukti

        <input
          id="fe"
          value="${esc(existing?.evidence||'')}"
          placeholder="Opsional — link tugas/dokumen"
        >

      </label>

    </div>

    <div class="actions">

      <button
        class="ghost"
        onclick="closeModal()"
      >
        Batal
      </button>

      <button
        class="primary"
        onclick="saveReflection('${editId}')"
      >
        ${existing?'Simpan Perubahan':'Simpan Refleksi'}
      </button>

    </div>

  `);
}
/* =====================================================
   CONTINUATION — REFLECTION / COMPETENCIES / GOALS / ARCHIVE
   ===================================================== */

async function loadReflectionChapters(subjectId){
  try{
    const x=await api('/api/subjects/'+subjectId);

    $('fch').innerHTML=
      '<option value="">Tidak ditautkan</option>'+
      x.chapters.map(c=>`
        <option value="${c.id}">
          ${esc(c.title)}
        </option>
      `).join('');

  }catch(e){
    toast(e.message);
  }
}


async function saveReflection(idv=''){
  try{

    const b={
      subject:$('fs').value
        ?$('fs').selectedOptions[0].textContent
        :'',
      chapterId:$('fch').value||null,
      topic:$('ft').value,
      learned:$('fy').value,
      level:$('fl').value,
      reason:$('fr').value,
      nextAction:$('fn').value,
      evidence:$('fe').value
    };

    await api(
      idv
        ?'/api/reflections/'+idv
        :'/api/reflections',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();
    toast('Refleksi tersimpan');
    go('reflection');

  }catch(e){
    toast(e.message);
  }
}


async function reflectionDetail(idv){

  const x=(await api('/api/reflections'))
    .find(y=>y.id===idv);

  if(!x)return;

  openModal(`
    <h2>${esc(x.topic)}</h2>

    <p class="muted">
      ${esc(x.subject)} • ${esc(x.date)}
    </p>

    <span class="level">${esc(x.level)}</span>

    <p>
      <b>Yang dipelajari</b><br>
      ${esc(x.learned)}
    </p>

    <p>
      <b>Alasan</b><br>
      ${esc(x.reason||'-')}
    </p>

    <p>
      <b>Next action</b><br>
      ${esc(x.nextAction||'-')}
    </p>

    ${
      x.evidence
      ?`
        <p>
          <b>Bukti</b><br>
          <a href="${esc(x.evidence)}" target="_blank">
            Buka bukti →
          </a>
        </p>
      `
      :''
    }
  `);
}


async function deleteReflection(idv){

  if(!confirm('Hapus refleksi ini?'))return;

  try{

    await api('/api/reflections/'+idv,{
      method:'DELETE'
    });

    toast('Refleksi dihapus');
    go('reflection');

  }catch(e){
    toast(e.message);
  }
}


/* =====================================================
   COMPETENCIES
   ===================================================== */

async function competencies(){

  const a=await api('/api/competencies');

  const avg=Math.round(
    a.reduce((n,x)=>n+x.progress,0)/a.length
  );

  $('content').innerHTML=
    pageHead(
      'COMPETENCY PASSPORT',
      'My Competencies',
      'Lihat perkembangan skill yang terbentuk sepanjang perjalananmu.'
    )

    +

    `<div class="card" style="margin-bottom:18px">

      <span class="muted">
        Rata-rata kompetensi
      </span>

      <div class="metric">
        ${avg}%
      </div>

      ${progress(avg)}

    </div>`

    +

    `<div class="grid twoCards">

      ${
        a.map(x=>`

          <div class="card">

            <div class="cardHead">

              <div>
                <h3>${esc(x.name)}</h3>
                <span class="muted">${esc(x.category)}</span>
              </div>

              <span class="badge">
                ${esc(x.level)}
              </span>

            </div>

            <div class="progressRow">

              <div>
                <span>Progress</span>
                <b>${x.progress}%</b>
              </div>

              ${progress(x.progress)}

            </div>

          </div>

        `).join('')
      }

    </div>`;
}


/* =====================================================
   GOALS
   ===================================================== */

async function goals(){

  const a=await api('/api/goals');

  $('content').innerHTML=
    pageHead(
      'LEARNING GOALS',
      'Learning Goals',
      'Buat target yang jelas dan pantau progress-nya.',
      '<button class="primary" onclick="goalForm()">+ New Goal</button>'
    )

    +

    `<div class="grid twoCards">

      ${
        a.map(x=>`

          <div class="card">

            <div class="cardHead">

              <h3>${esc(x.title)}</h3>

              <span class="badge">
                ${esc(x.status)}
              </span>

            </div>

            <p class="muted">
              ${esc(x.description)}
            </p>

            <div class="progressRow">

              <div>
                <span>${esc(x.category)}</span>
                <b>${x.progress}%</b>
              </div>

              ${progress(x.progress)}

            </div>

            <small class="muted">
              Target ${esc(x.targetDate||'-')}
            </small>

            <div class="actions">

              <button
                class="ghost"
                onclick="goalForm('${x.id}')"
              >
                Edit
              </button>

              <button
                class="danger"
                onclick="deleteGoal('${x.id}')"
              >
                Hapus
              </button>

            </div>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada goal.</div>'
      }

    </div>`;
}


async function goalForm(idv=''){

  const x=idv
    ?(await api('/api/goals')).find(y=>y.id===idv)
    :null;

  openModal(`
    <h2>◎ ${x?'Edit':'Tambah'} Learning Goal</h2>

    <label>
      Judul
      <input id="gt" value="${esc(x?.title||'')}">
    </label>

    <label>
      Deskripsi
      <textarea id="gd">${esc(x?.description||'')}</textarea>
    </label>

    <div class="formgrid">

      <label>
        Kategori

        <select id="gc">

          <option ${x?.category==='Belajar'?'selected':''}>
            Belajar
          </option>

          <option ${x?.category==='Kompetensi'?'selected':''}>
            Kompetensi
          </option>

          <option ${x?.category==='Portfolio'?'selected':''}>
            Portfolio
          </option>

          <option ${x?.category==='Karier'?'selected':''}>
            Karier
          </option>

        </select>

      </label>

      <label>
        Progress (%)

        <input
          id="gp"
          type="number"
          min="0"
          max="100"
          value="${x?.progress||0}"
        >

      </label>

      <label>
        Target tanggal

        <input
          id="gdte"
          type="date"
          value="${esc(x?.targetDate||'')}"
        >

      </label>

      <label>
        Status

        <select id="gs">

          <option ${x?.status==='Berjalan'?'selected':''}>
            Berjalan
          </option>

          <option ${x?.status==='Selesai'?'selected':''}>
            Selesai
          </option>

          <option ${x?.status==='Ditunda'?'selected':''}>
            Ditunda
          </option>

        </select>

      </label>

    </div>

    <button
      class="primary full"
      onclick="saveGoal('${idv}')"
    >
      Simpan Goal
    </button>

  `);
}

async function saveGoal(idv=''){

  try{

    const title = $('gt').value.trim();
    const description = $('gd').value.trim();
    const category = $('gc').value;
    const progress = $('gp').value;
    const targetDate = $('gdte').value;
    const status = $('gs').value;

    // Validasi semua field wajib diisi
    if(!title){
      toast('Judul goal wajib diisi.');
      $('gt').focus();
      return;
    }

    if(!description){
      toast('Deskripsi goal wajib diisi.');
      $('gd').focus();
      return;
    }

    if(!category){
      toast('Kategori wajib dipilih.');
      $('gc').focus();
      return;
    }

    if(progress === ''){
      toast('Progress wajib diisi.');
      $('gp').focus();
      return;
    }

    if(!targetDate){
      toast('Target tanggal wajib diisi.');
      $('gdte').focus();
      return;
    }

    if(!status){
      toast('Status wajib dipilih.');
      $('gs').focus();
      return;
    }

    const body={
      title,
      description,
      category,
      progress,
      targetDate,
      status
    };

    await api(
      idv?'/api/goals/'+idv:'/api/goals',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(body)
      }
    );

    closeModal();
    toast('Goal tersimpan');
    go('goals');

  }catch(e){
    toast(e.message);
  }
}

async function deleteGoal(idv){

  if(!confirm('Hapus goal ini?'))return;

  try{

    await api('/api/goals/'+idv,{
      method:'DELETE'
    });

    toast('Goal dihapus');
    go('goals');

  }catch(e){
    toast(e.message);
  }
}
/* =====================================================
   ARCHIVE
   ===================================================== */

async function archive(){

  try{

    const a = await api('/api/archive');

    $('content').innerHTML =
      pageHead(
        'SCHOOL ARCHIVE',
        'School Archive',
        'Simpan dokumen, tugas, dan jejak pembelajaran.',
        '<button class="primary" onclick="archiveForm()">+ Tambah Arsip</button>'
      )

      +

      `<div class="grid three">

        ${
          a.map(x => {

            const fileUrl = x.file || x.link || '';

            return `

              <div class="card">

                <span class="badge">
                  ${esc(x.category)}
                </span>

                <h3>
                  ${esc(x.title)}
                </h3>

                <p class="muted">
                  Kelas ${esc(x.grade)} • ${esc(x.date)}
                </p>

                <p>
                  ${esc(x.description || '')}
                </p>

                ${
                  fileUrl

                  ? `
                    <div style="margin-top:14px;">

                      <a
                        class="ghost"
                        href="${esc(fileUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat Arsip →
                      </a>

                    </div>
                  `

                  : `
                    <p class="muted">
                      Tidak ada dokumen.
                    </p>
                  `
                }

                <div
                  class="actions"
                  style="margin-top:18px;"
                >

                  <button
                    class="ghost"
                    onclick="archiveForm('${x.id}')"
                  >
                    Edit
                  </button>

                  <button
                    class="danger"
                    onclick="deleteArchive('${x.id}')"
                  >
                    Hapus
                  </button>

                </div>

              </div>

            `;

          }).join('')

          ||

          '<div class="empty">Belum ada arsip.</div>'
        }

      </div>`;

  }catch(e){

    toast(e.message);

  }
}


async function archiveForm(idv = ''){

  try{

    const x = idv
      ? (await api('/api/archive')).find(y => y.id === idv)
      : null;

    if(idv && !x){
      toast('Arsip tidak ditemukan.');
      return;
    }

    openModal(`

      <h2>
        ▤ ${x ? 'Edit' : 'Tambah'} Arsip
      </h2>

      <label>
        Judul *
        <input
          id="at"
          type="text"
          value="${x ? esc(x.title || '') : ''}"
          placeholder="Masukkan judul arsip"
          required
        >
      </label>

      <div class="formgrid">

        <label>
          Kategori *

          <select id="ac" required>

            <option value="Tugas"
              ${x?.category === 'Tugas' ? 'selected' : ''}>
              Tugas
            </option>

            <option value="Sertifikat"
              ${x?.category === 'Sertifikat' ? 'selected' : ''}>
              Sertifikat
            </option>

            <option value="Dokumen"
              ${x?.category === 'Dokumen' ? 'selected' : ''}>
              Dokumen
            </option>

            <option value="Proyek"
              ${x?.category === 'Proyek' ? 'selected' : ''}>
              Proyek
            </option>

            <option value="Lainnya"
              ${x?.category === 'Lainnya' ? 'selected' : ''}>
              Lainnya
            </option>

          </select>

        </label>

        <label>
          Kelas *

          <input
            id="ag"
            type="number"
            min="10"
            max="12"
            value="${x ? esc(x.grade) : '10'}"
            required
          >

        </label>

      </div>

      <label>
        Deskripsi *

        <textarea
          id="ad"
          placeholder="Masukkan deskripsi arsip"
          required
        >${x ? esc(x.description || '') : ''}</textarea>

      </label>

      <label>
        ${x ? 'Ganti File' : 'Upload File'} *

        <input
          id="af"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
          ${x ? '' : 'required'}
        >

        <small
          style="
            display:block;
            margin-top:6px;
            color:#777;
          "
        >
          PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX,
          JPG, JPEG, atau PNG. Maksimal 8 MB.
        </small>

      </label>

      ${
        x && (x.file || x.link)

        ? `
          <div
            style="
              margin-top:10px;
              padding:12px;
              background:#f5f7f6;
              border-radius:10px;
            "
          >

            <small>
              File saat ini:
            </small>

            <br>

            <a
              href="${esc(x.file || x.link)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lihat file saat ini →
            </a>

          </div>
        `

        : ''
      }

      <button
        class="primary full"
        onclick="saveArchive('${idv}')"
      >
        ${x ? 'Simpan Perubahan' : 'Simpan Arsip'}
      </button>

    `);

  }catch(e){

    toast(e.message);

  }
}


async function saveArchive(idv = ''){

  try{

    const title =
      $('at')?.value.trim() || '';

    const category =
      $('ac')?.value || '';

    const grade =
      $('ag')?.value || '';

    const description =
      $('ad')?.value.trim() || '';

    const file =
      $('af')?.files?.[0] || null;


    if(!title){

      toast('Judul wajib diisi.');

      return;

    }


    if(!category){

      toast('Kategori wajib dipilih.');

      return;

    }


    if(!grade){

      toast('Kelas wajib diisi.');

      return;

    }


    if(!description){

      toast('Deskripsi wajib diisi.');

      return;

    }


    if(!idv && !file){

      toast('File wajib dipilih.');

      return;

    }


    if(file && file.size > 8 * 1024 * 1024){

      toast('Ukuran file maksimal 8 MB.');

      return;

    }


    const fd =
      new FormData();

    fd.append(
      'title',
      title
    );

    fd.append(
      'category',
      category
    );

    fd.append(
      'grade',
      grade
    );

    fd.append(
      'description',
      description
    );


    if(file){

      fd.append(
        'file',
        file
      );

    }


    const url =
      idv
        ? `/api/archive/${idv}`
        : '/api/archive';


    await api(
      url,
      {
        method:
          idv
            ? 'PUT'
            : 'POST',

        body: fd
      }
    );


    closeModal();


    toast(
      idv
        ? 'Arsip berhasil diperbarui'
        : 'Arsip berhasil ditambahkan'
    );


    go('archive');


  }catch(e){

    toast(e.message);

  }

}


async function deleteArchive(idv){

  if(
    !confirm(
      'Hapus arsip ini?'
    )
  ){

    return;

  }


  try{

    await api(
      '/api/archive/' + idv,
      {
        method:'DELETE'
      }
    );


    toast(
      'Arsip berhasil dihapus'
    );


    go('archive');


  }catch(e){

    toast(e.message);

  }

}

/* =====================================================
   TKA
   ===================================================== */

async function tka(){

  const a=await api('/api/tka');

  const avg=a.length
    ?Math.round(a.reduce((n,x)=>n+x.score,0)/a.length)
    :0;

  $('content').innerHTML=
    pageHead(
      'GRADE 12 PREPARATION',
      'TKA Preparation',
      'Catat target, tryout, dan kesiapan TKA.',
      '<button class="primary" onclick="tkaForm()">+ Tambah Tryout</button>'
    )

    +

    `<div class="grid two">

      <div class="card">

        <span class="muted">
          Average Score
        </span>

        <div class="metric">
          ${avg}
          <small style="font-size:18px">/100</small>
        </div>

        ${progress(avg)}

      </div>

      <div class="card">

        <h3>Preparation Checklist</h3>

        ${
          [
            'Tentukan target skor',
            'Identifikasi materi yang perlu diperkuat',
            'Latihan soal rutin',
            'Review hasil tryout',
            'Susun strategi waktu'
          ].map((x,i)=>`

            <label class="checkline">
              <input type="checkbox" ${i<2?'checked':''}>
              ${x}
            </label>

          `).join('')
        }

      </div>

    </div>

    <div class="card" style="margin-top:18px">

      <div class="cardHead">

        <h3>Riwayat Tryout</h3>

        <span class="badge">
          ${a.length} data
        </span>

      </div>

      <div class="tableWrap">

        <table class="table">

          <tr>
            <th>Judul</th>
            <th>Mapel</th>
            <th>Skor</th>
            <th>Status</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>

          ${
            a.map(x=>`

              <tr>

                <td>${esc(x.title)}</td>

                <td>${esc(x.subject)}</td>

                <td>
                  <b>${x.score}</b>/100
                </td>

                <td>${esc(x.status)}</td>

                <td>${esc(x.date||'-')}</td>

                <td>

                  <button
                    class="ghost"
                    onclick="tkaForm('${x.id}')"
                  >
                    Edit
                  </button>

                  <button
                    class="danger"
                    onclick="deleteTka('${x.id}')"
                  >
                    Hapus
                  </button>

                </td>

              </tr>

            `).join('')

            ||

            '<tr><td colspan="6">Belum ada data.</td></tr>'
          }

        </table>

      </div>

    </div>`;
}


async function tkaForm(idv=''){

  const x=idv
    ?(await api('/api/tka')).find(y=>y.id===idv)
    :null;

  openModal(`
    <h2>✓ ${x?'Edit':'Tambah'} TKA</h2>

    <label>
      Judul

      <input
        id="tt"
        value="${esc(x?.title||'Tryout TKA')}"
      >

    </label>

    <div class="formgrid">

      <label>
        Mapel

        <input
          id="ts"
          value="${esc(x?.subject||'Literasi')}"
        >

      </label>

      <label>
        Skor

        <input
          id="tx"
          type="number"
          min="0"
          max="100"
          value="${x?.score||0}"
        >

      </label>

      <label>
        Tanggal

        <input
          id="td"
          type="date"
          value="${esc(x?.date||'')}"
        >

      </label>

      <label>
        Status

        <select id="tst">

          <option ${x?.status==='Selesai'?'selected':''}>
            Selesai
          </option>

          <option ${x?.status==='Belum'?'selected':''}>
            Belum
          </option>

          <option ${x?.status==='Berjalan'?'selected':''}>
            Berjalan
          </option>

        </select>

      </label>

    </div>

    <label>
      Catatan
      <textarea id="tn">${esc(x?.notes||'')}</textarea>
    </label>

    <button
      class="primary full"
      onclick="saveTka('${idv}')"
    >
      Simpan TKA
    </button>

  `);
}

async function saveTka(idv=''){

  try{

    const title = $('tt').value.trim();
    const subject = $('ts').value.trim();
    const score = $('tx').value;
    const date = $('td').value;
    const status = $('tst').value;
    const notes = $('tn').value.trim();

    if(!title){
      toast('Judul TKA wajib diisi.');
      $('tt').focus();
      return;
    }

    if(!subject){
      toast('Mata pelajaran wajib diisi.');
      $('ts').focus();
      return;
    }

    if(score === ''){
      toast('Nilai TKA wajib diisi.');
      $('tx').focus();
      return;
    }

    if(!date){
      toast('Tanggal TKA wajib diisi.');
      $('td').focus();
      return;
    }

    if(!status){
      toast('Status TKA wajib dipilih.');
      $('tst').focus();
      return;
    }

    if(!notes){
      toast('Catatan TKA wajib diisi.');
      $('tn').focus();
      return;
    }

    const b={
      title,
      subject,
      score,
      date,
      status,
      notes
    };

    await api(
      idv?'/api/tka/'+idv:'/api/tka',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();
    toast('Data TKA tersimpan');
    go('tka');

  }catch(e){
    toast(e.message);
  }
}

async function deleteTka(idv){

  if(!confirm('Hapus data TKA?'))return;

  await api('/api/tka/'+idv,{
    method:'DELETE'
  });

  toast('Data dihapus');
  go('tka');
}


/* =====================================================
   PREPARATION
   ===================================================== */

async function preparation(type,title,desc){

  const d=await api('/api/preparation');

  const a=d[type]||[];

  const endpoint=
    type==='university'
      ?'university'
      :'career';

  $('content').innerHTML=
    pageHead(
      type==='university'?'FUTURE STUDY':'CAREER READINESS',
      title,
      desc,
      `<button
        class="primary"
        onclick="prepForm('${endpoint}')"
      >
        + Tambah Rencana
      </button>`
    )

    +

    `<div class="grid three">

      ${
        a.map(x=>`

          <div class="card">

            <span class="badge">
              ${esc(x.status)}
            </span>

            <h3>${esc(x.title)}</h3>

            <p class="muted">
              ${esc(x.institution)} • ${esc(x.targetYear||'-')}
            </p>

            <p>${esc(x.notes)}</p>

            ${progress(x.progress)}

            <small class="muted">
              ${x.progress}% progress
            </small>

            <div class="actions">

              <button
                class="ghost"
                onclick="prepForm('${endpoint}','${x.id}')"
              >
                Edit
              </button>

              <button
                class="danger"
                onclick="deletePrep('${endpoint}','${x.id}')"
              >
                Hapus
              </button>

            </div>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada rencana.</div>'
      }

    </div>`;
}


async function university(){

  return preparation(
    'university',
    'University Preparation',
    'Rencanakan eksplorasi jurusan, kampus, dan persiapan seleksi.'
  );

}


async function career(){

  return preparation(
    'career',
    'Career Preparation',
    'Bangun kesiapan kerja melalui skill, CV, eksplorasi role, dan target perusahaan.'
  );

}


async function prepForm(type,idv=''){

  const d=await api('/api/preparation');

  const arr=
    d[type==='university'?'university':'career'];

  const x=idv
    ?arr.find(y=>y.id===idv)
    :null;

  openModal(`

    <h2>
      ${type==='university'?'🎓 University':'▸ Career'}
      ${x?'Edit':'Plan'}
    </h2>

    <label>
      Judul <span class="required">*</span>

      <input
        id="ptitle"
        value="${esc(x?.title||'')}"
        required
      >

    </label>

    <div class="formgrid">

      <label>
        Institusi/Kampus/Perusahaan <span class="required">*</span>

        <input
          id="pinst"
          value="${esc(x?.institution||'')}"
          required
        >

      </label>

      <label>
        Target tahun <span class="required">*</span>

        <input
          id="pyear"
          type="number"
          value="${esc(x?.targetYear||'')}"
          required
        >

      </label>

      <label>
        Progress (%) <span class="required">*</span>

        <input
          id="pp"
          type="number"
          min="0"
          max="100"
          value="${x?.progress||0}"
          required
        >

      </label>

      <label>
        Status <span class="required">*</span>

        <select id="pst" required>

          <option ${x?.status==='Planning'?'selected':''}>
            Planning
          </option>

          <option ${x?.status==='Berjalan'?'selected':''}>
            Berjalan
          </option>

          <option ${x?.status==='Selesai'?'selected':''}>
            Selesai
          </option>

        </select>

      </label>

    </div>

    <label>
      Catatan <span class="required">*</span>

      <textarea
        id="pnotes"
        required
      >${esc(x?.notes||'')}</textarea>

    </label>

    <button
      class="primary full"
      onclick="savePrep('${type}','${idv}')"
    >
      Simpan Rencana
    </button>

  `);
}
async function savePrep(type,idv=''){

  try{

    const title = $('ptitle').value.trim();
    const institution = $('pinst').value.trim();
    const targetYear = $('pyear').value;
    const progress = $('pp').value;
    const status = $('pst').value;
    const notes = $('pnotes').value.trim();

    if(!title){
      toast('Judul wajib diisi.');
      $('ptitle').focus();
      return;
    }

    if(!institution){
      toast('Institusi/Kampus/Perusahaan wajib diisi.');
      $('pinst').focus();
      return;
    }

    if(!targetYear){
      toast('Target tahun wajib diisi.');
      $('pyear').focus();
      return;
    }

    if(progress === ''){
      toast('Progress wajib diisi.');
      $('pp').focus();
      return;
    }

    if(!status){
      toast('Status wajib dipilih.');
      $('pst').focus();
      return;
    }

    if(!notes){
      toast('Catatan wajib diisi.');
      $('pnotes').focus();
      return;
    }

    const b={
      title,
      institution,
      targetYear,
      progress,
      status,
      notes
    };

    const base='/api/preparation/'+type;

    await api(
      idv?base+'/'+idv:base,
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();
    toast('Rencana tersimpan');
    go(type);

  }catch(e){
    toast(e.message);
  }
}

async function deletePrep(type,idv){

  if(!confirm('Hapus rencana ini?'))return;

  await api('/api/preparation/'+type+'/'+idv,{
    method:'DELETE'
  });

  toast('Rencana dihapus');
  go(type);
}


/* =====================================================
   FUTURE PATHWAY
   ===================================================== */

async function future(){

  const a=await api('/api/future');

  $('content').innerHTML=
    pageHead(
      'FUTURE PATHWAY',
      'Future Pathway',
      'Dokumentasikan kemungkinan langkah setelah lulus.',
      '<button class="primary" onclick="planForm()">+ Tambah Pathway</button>'
    )

    +

    `<div class="grid twoCards">

      ${
        a.map(x=>`

          <div class="future">

            <span class="badge">
              ${esc(x.type)}
            </span>

            <h3>${esc(x.target)}</h3>

            <p class="muted">
              ${esc(x.detail)}
            </p>

            <b>${esc(x.status)}</b>

            <small class="muted">
              Target ${esc(x.year||'-')}
            </small>

            <div class="actions">

              <button
                class="ghost"
                onclick="planForm('${x.id}')"
              >
                Edit
              </button>

              <button
                class="danger"
                onclick="deletePlan('${x.id}')"
              >
                Hapus
              </button>

            </div>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada future pathway.</div>'
      }

    </div>`;
}


async function planForm(idv=''){

  const x=idv
    ?(await api('/api/future')).find(y=>y.id===idv)
    :null;

  openModal(`

    <h2>→ ${x?'Edit':'Tambah'} Future Pathway</h2>

    <div class="formgrid">

      <label>
        Jenis

        <select id="pt">

          <option ${x?.type==='Perguruan Tinggi'?'selected':''}>
            Perguruan Tinggi
          </option>

          <option ${x?.type==='Bekerja'?'selected':''}>
            Bekerja
          </option>

          <option ${x?.type==='Wirausaha'?'selected':''}>
            Wirausaha
          </option>

          <option ${x?.type==='Pelatihan/Sertifikasi'?'selected':''}>
            Pelatihan/Sertifikasi
          </option>

        </select>

      </label>

      <label>
        Tahun

        <input
          id="py"
          value="${esc(x?.year||'')}"
        >

      </label>

    </div>

    <label>
      Target

      <input
        id="pname"
        value="${esc(x?.target||'')}"
      >

    </label>

    <label>
      Detail

      <textarea id="pd">${esc(x?.detail||'')}</textarea>

    </label>

    <label>
      Status

      <select id="ps">

        <option ${x?.status==='Eksplorasi'?'selected':''}>
          Eksplorasi
        </option>

        <option ${x?.status==='Direncanakan'?'selected':''}>
          Direncanakan
        </option>

        <option ${x?.status==='Berjalan'?'selected':''}>
          Berjalan
        </option>

        <option ${x?.status==='Selesai'?'selected':''}>
          Selesai
        </option>

      </select>

    </label>

    <label>
      Catatan

      <textarea id="pn">${esc(x?.notes||'')}</textarea>

    </label>

    <button
      class="primary full"
      onclick="savePlan('${idv}')"
    >
      Simpan Pathway
    </button>

  `);
}


async function savePlan(idv=''){

  const b={
    type:$('pt').value,
    target:$('pname').value,
    detail:$('pd').value,
    year:$('py').value,
    status:$('ps').value,
    notes:$('pn').value
  };

  try{

    await api(
      idv
        ?'/api/future/'+idv
        :'/api/future',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();
    toast('Pathway tersimpan');
    go('future');

  }catch(e){
    toast(e.message);
  }
}


async function deletePlan(idv){

  if(!confirm('Hapus pathway ini?'))return;

  await api('/api/future/'+idv,{
    method:'DELETE'
  });

  toast('Pathway dihapus');
  go('future');
}


/* =====================================================
   ACHIEVEMENTS
   ===================================================== */

async function achievements(){

  const a=await api('/api/achievements');

  $('content').innerHTML=
    pageHead(
      'ACHIEVEMENTS',
      'Achievements',
      'Milestone kecil yang menunjukkan perkembangan perjalananmu.'
    )

    +

    `<div class="grid three">

      ${
        a.map(x=>`

          <div
            class="card"
            style="opacity:${x.earned?1:.62}"
          >

            <div style="font-size:34px">
              ${x.icon}
            </div>

            <h3>${esc(x.name)}</h3>

            <p class="muted">
              ${esc(x.description)}
            </p>

            <span class="badge">
              ${x.earned?'✓ Earned':'Locked'}
            </span>

            ${
              x.date
              ?`<small class="muted">${esc(x.date)}</small>`
              :''
            }

          </div>

        `).join('')
      }

    </div>`;
}
/* =====================================================
   PORTFOLIO
   ===================================================== */

async function portfolio(){

  const a=await api('/api/portfolio');

  $('content').innerHTML=
    pageHead(
      'PROOF OF LEARNING',
      'Portfolio',
      'Kumpulkan proyek, tugas, karya, dan bukti kompetensi.',
      '<button class="primary" onclick="portfolioForm()">+ Add Work</button>'
    )

    +

    `<div class="grid twoCards">

      ${
        a.map(x=>`

          <div class="reflection">

            <span class="badge">
              ${esc(x.category)}
            </span>

            <h3>${esc(x.title)}</h3>

            <p>${esc(x.description)}</p>

            <small class="muted">
              ${esc(x.date)} • ${esc(x.status)}
            </small>

            ${
              x.file
              ?`
                <br>

                <a
                  href="${esc(x.file)}"
                  target="_blank"
                >
                  Open uploaded file →
                </a>
              `
              :''
            }

            <div class="actions">

              <button
                class="ghost"
                onclick="portfolioForm('${x.id}')"
              >
                Edit
              </button>

              <button
                class="danger"
                onclick="deletePortfolio('${x.id}')"
              >
                Hapus
              </button>

            </div>

          </div>

        `).join('')

        ||

        '<div class="empty">Belum ada portfolio.</div>'
      }

    </div>`;
}


/* =====================================================
   PORTFOLIO FORM
   ===================================================== */

async function portfolioForm(idv=''){

  const x=idv
    ?(await api('/api/portfolio')).find(y=>y.id===idv)
    :null;

  openModal(`

    <h2>
      ${x?'▧ Edit Portfolio':'▧ Tambah Portfolio'}
    </h2>

    <label>
      Judul Portfolio
      <input
        id="ot"
        value="${esc(x?.title||'')}"
        placeholder="Contoh: Proyek Administrasi Digital"
      >
    </label>

    <label>
      Kategori
      <select id="oc">

        <option value="Tugas" ${x?.category==='Tugas'?'selected':''}>
          Tugas
        </option>

        <option value="Proyek" ${x?.category==='Proyek'?'selected':''}>
          Proyek
        </option>

        <option value="Sertifikat" ${x?.category==='Sertifikat'?'selected':''}>
          Sertifikat
        </option>

        <option value="Karya" ${x?.category==='Karya'?'selected':''}>
          Karya
        </option>

        <option value="Kompetensi" ${x?.category==='Kompetensi'?'selected':''}>
          Kompetensi
        </option>

      </select>
    </label>

    <label>
      Status
      <select id="os">

        <option value="Draft" ${x?.status==='Draft'?'selected':''}>
          Draft
        </option>

        <option value="Completed" ${x?.status==='Completed'?'selected':''}>
          Completed
        </option>

        <option value="Submitted" ${x?.status==='Submitted'?'selected':''}>
          Submitted
        </option>

      </select>
    </label>

    <label>
      Deskripsi
      <textarea
        id="od"
        placeholder="Jelaskan secara singkat mengenai portfolio ini."
      >${esc(x?.description||'')}</textarea>
    </label>

    <label>
      Upload File
      <input
        id="of"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
      >

      <small style="display:block;margin-top:6px;color:#777;">
        Pilih file yang ingin diunggah. Maksimal 8 MB.
      </small>
    </label>

    ${
      x?.file
      ?`
        <div style="margin-top:8px;">
          <small class="muted">
            File saat ini:
          </small>

          <br>

          <a
            href="${esc(x.file)}"
            target="_blank"
          >
            Lihat file yang sudah diupload →
          </a>
        </div>
      `
      :''
    }

    <button
      class="primary full"
      onclick="savePortfolio('${idv}')"
    >
      Simpan Portfolio
    </button>

  `);
}


/* =====================================================
   SAVE PORTFOLIO
   ===================================================== */

async function savePortfolio(idv=''){

  try{

    const title = $('ot').value.trim();
    const category = $('oc').value;
    const status = $('os').value;
    const description = $('od').value.trim();

    let file='';

    const fileEl = $('of');
    const f = fileEl?.files?.[0];

    // Validasi field wajib
    if(!title){
      toast('Judul portfolio wajib diisi.');
      $('ot').focus();
      return;
    }

    if(!category){
      toast('Kategori portfolio wajib dipilih.');
      $('oc').focus();
      return;
    }

    if(!status){
      toast('Status portfolio wajib dipilih.');
      $('os').focus();
      return;
    }

    if(!description){
      toast('Deskripsi portfolio wajib diisi.');
      $('od').focus();
      return;
    }

    /*
     * Jika user memilih file,
     * upload file terlebih dahulu.
     */

    if(f){

      const fd = new FormData();

      fd.append('file', f);

      const up = await api('/api/portfolio/upload',{
        method:'POST',
        body:fd
      });

      if(!up || !up.file){
        throw new Error('File gagal diupload.');
      }

      file = up.file;
    }

    /*
     * Jika membuat portfolio baru,
     * file wajib dipilih.
     */

    if(!idv && !file){

      toast('File portfolio wajib dipilih.');

      return;
    }

    const b = {
      title,
      category,
      status,
      description
    };

    /*
     * Jika ada file baru,
     * simpan lokasi file tersebut.
     */

    if(file){
      b.file = file;
    }

    await api(
      idv
        ? '/api/portfolio/'+idv
        : '/api/portfolio',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();

    toast('Portfolio tersimpan');

    go('portfolio');

  }catch(e){

    toast(e.message);

  }

}

/* =====================================================
   DELETE PORTFOLIO
   ===================================================== */

async function deletePortfolio(idv){

  if(!confirm('Hapus portfolio ini?')){

    return;

  }

  try{

    await api(
      '/api/portfolio/'+idv,
      {
        method:'DELETE'
      }
    );

    toast('Portfolio dihapus');

    go('portfolio');

  }catch(e){

    toast(e.message);

  }

}
async function students(){

  const d=await api('/api/dashboard');

  $('content').innerHTML=
    pageHead(
      'TEACHER WORKSPACE',
      'Students',
      'Daftar siswa yang dapat dipantau.'
    )

    +

    `<div class="tableWrap">

      <table class="table">

        <tr>
          <th>Student</th>
          <th>Class</th>
          <th>NIS</th>
          <th>Status</th>
          <th>Action</th>
        </tr>

        ${
          d.students.map(x=>`

            <tr>

              <td>
                <b>${esc(x.name)}</b>
              </td>

              <td>
                ${esc(x.class)}
              </td>

              <td>
                ${esc(x.nis)}
              </td>

              <td>
                <span class="badge">
                  ${esc(x.status)}
                </span>
              </td>

              <td>

                <button
                  class="ghost"
                  onclick="studentDetail('${x.id}')"
                >
                  Open Journey
                </button>

              </td>

            </tr>

          `).join('')
        }

      </table>

    </div>`;
}
/* =====================================================
   TEACHER
   ===================================================== */

async function students(){

  const d=await api('/api/dashboard');

  $('content').innerHTML=
    pageHead(
      'TEACHER WORKSPACE',
      'Students',
      'Daftar siswa yang dapat dipantau.'
    )

    +

    `<div class="tableWrap">

      <table class="table">

        <tr>
          <th>Student</th>
          <th>Class</th>
          <th>NIS</th>
          <th>Status</th>
          <th>Action</th>
        </tr>

        ${
          d.students.map(x=>`

            <tr>

              <td>
                <b>${esc(x.name)}</b>
              </td>

              <td>${esc(x.class)}</td>

              <td>${esc(x.nis)}</td>

              <td>
                <span class="badge">
                  ${esc(x.status)}
                </span>
              </td>

              <td>

                <button
                  class="ghost"
                  onclick="studentDetail('${x.id}')"
                >
                  Open Journey
                </button>

              </td>

            </tr>

          `).join('')
        }

      </table>

    </div>`;
}
async function studentDetail(idv){

  try{

    const d =
      await api('/api/student/' + idv);

    openModal(`

      <h2>
        ${esc(d.student.name)}
      </h2>

      <p class="muted">
        ${esc(d.student.class)}
        • NIS ${esc(d.student.nis)}
      </p>


      <div class="grid three">

        <div class="stat">
          <span>Reflections</span>
          <div class="num">
            ${d.reflections.length}
          </div>
        </div>

        <div class="stat">
          <span>Goals</span>
          <div class="num">
            ${d.goals.length}
          </div>
        </div>

        <div class="stat">
          <span>Portfolio</span>
          <div class="num">
            ${d.portfolio.length}
          </div>
        </div>

      </div>


      <h3 style="margin-top:22px;">
        Portfolio Siswa
      </h3>


      ${
        d.portfolio.length

        ? `

          <div style="
            display:grid;
            gap:12px;
            margin-top:12px;
          ">

            ${

              d.portfolio.map(p => {

                const fileUrl =
                  p.file ||
                  p.link ||
                  '';

                return `

                  <div
                    class="card"
                    style="padding:16px;"
                  >

                    <span class="badge">
                      ${esc(
                        p.category ||
                        'Portfolio'
                      )}
                    </span>

                    <h3 style="margin:8px 0;">
                      ${esc(
                        p.title ||
                        'Tanpa judul'
                      )}
                    </h3>

                    <p class="muted">
                      ${esc(
                        p.date ||
                        ''
                      )}
                    </p>

                    <p>
                      ${esc(
                        p.description ||
                        'Tidak ada deskripsi.'
                      )}
                    </p>

                    ${
                      fileUrl

                      ? `
                        <div style="
                          margin-top:12px;
                        ">

                          <a
                            class="ghost"
                            href="${esc(fileUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Portfolio →
                          </a>

                        </div>
                      `

                      : `
                        <p class="muted">
                          Tidak ada file yang diunggah.
                        </p>
                      `
                    }

                  </div>

                `;

              }).join('')

            }

          </div>

        `

        : `

          <div
            class="empty"
            style="margin-top:12px;"
          >
            Siswa belum memiliki portfolio.
          </div>

        `
      }


      <h3 style="margin-top:26px;">
        Latest Reflections
      </h3>


      ${
        d.reflections
          .slice()
          .reverse()
          .map(r => `

            <div
              class="reflection"
              style="margin:10px 0;"
            >

              <b>
                ${esc(r.topic)}
              </b>

              <p>
                ${esc(r.learned)}
              </p>

              <button
                class="primary"
                onclick="
                  feedbackForm(
                    '${r.id}',
                    '${r.studentId}'
                  )
                "
              >
                Give feedback
              </button>

            </div>

          `)
          .join('')

        ||

        '<p class="muted">Belum ada refleksi.</p>'
      }

    `);

  }catch(e){

    toast(e.message);

  }

}


function feedbackForm(r,s){

  openModal(`

    <h2>Feedback Guru</h2>

    <label>
      Feedback

      <textarea id="fc"></textarea>
    </label>

    <label>
      Rekomendasi

      <textarea id="frc"></textarea>
    </label>

    <button
      class="primary full"
      onclick="sendFeedback('${r}','${s}')"
    >
      Kirim Feedback
    </button>

  `);
}


async function sendFeedback(r,s){

  try{

    await api('/api/feedback',{
      method:'POST',
      body:JSON.stringify({
        reflectionId:r,
        studentId:s,
        comment:$('fc').value,
        recommendation:$('frc').value
      })
    });

    closeModal();
    toast('Feedback terkirim');
    go('monitoring');

  }catch(e){
    toast(e.message);
  }
}


async function monitoring(){

  const d=await api('/api/dashboard');

  $('content').innerHTML=
    pageHead(
      'MONITORING CENTER',
      'Monitoring Reflections',
      'Guru dapat melihat refleksi terbaru dan memberi intervensi.'
    )

    +

    `<div class="tableWrap">

      <table class="table">

        <tr>
          <th>Student</th>
          <th>Subject</th>
          <th>Topic</th>
          <th>Level</th>
          <th>Date</th>
          <th></th>
        </tr>

        ${
          d.reflections.slice().reverse().map(r=>`

            <tr>

              <td>
                ${esc(
                  d.students.find(s=>s.id===r.studentId)?.name
                  ||r.studentId
                )}
              </td>

              <td>${esc(r.subject)}</td>

              <td>${esc(r.topic)}</td>

              <td>
                <span class="level">
                  ${esc(r.level)}
                </span>
              </td>

              <td>${esc(r.date)}</td>

              <td>

                <button
                  class="ghost"
                  onclick="feedbackForm('${r.id}','${r.studentId}')"
                >
                  Feedback
                </button>

              </td>

            </tr>

          `).join('')

          ||

          '<tr><td colspan="6">Belum ada refleksi.</td></tr>'
        }

      </table>

    </div>`;
}


async function reports(){

  const d=await api('/api/dashboard');

  $('content').innerHTML=
    pageHead(
      'ANALYTICS',
      'Reports',
      'Ringkasan perkembangan kompetensi dan aktivitas belajar.',
      '<button class="ghost" onclick="window.print()">Print report</button>'
    )

    +

    `<div class="grid two">

      <div class="card">

        <h3>Competency Distribution</h3>

        ${
          d.competencies.map(x=>`

            <div class="progressRow">

              <div>
                <span>${esc(x.name)}</span>
                <b>${x.progress}%</b>
              </div>

              ${progress(x.progress)}

            </div>

          `).join('')
        }

      </div>


      <div class="card">

        <h3>Class Insight</h3>

        <p class="muted">
          Gunakan refleksi untuk melihat siswa yang membutuhkan
          dukungan dan kompetensi yang perlu diperkuat.
        </p>

        <div class="metric">
          ${d.stats.averageCompetency}%
        </div>

        <span class="muted">
          Rata-rata kompetensi
        </span>

      </div>

    </div>`;
}


/* =====================================================
   LEARNING JOURNEY v5
   ===================================================== */

S.subjectGrade=null;


function gradeName(g){

  return g==10
    ?'Foundation'
    :g==11
      ?'Development'
      :g==12
        ?'Preparation'
        :'Future';

}


function gradeCard(x,current){

  return `

    <button
      class="journey-progress-card ${Number(x.grade)===Number(current)?'active-grade':''}"
      style="text-align:left;cursor:pointer"
      onclick="subjects(${x.grade})"
    >

      <b>Kelas ${x.grade} MPLB</b>

      <small>
        ${gradeName(x.grade)} • ${x.chapters} bab tersedia
      </small>

      ${progress(x.progress)}

      <strong>${x.progress}%</strong>

    </button>

  `;

}


/* =====================================================
   UPDATED STUDENT DASHBOARD
   ===================================================== */

async function dashboard(){

  const d=await api('/api/dashboard');

  if(S.user.role==='teacher')
    return teacherDashboard(d);

  const s=d.stats;
  const gp=d.gradeProgress||[];

  $('content').innerHTML=`

    <section class="hero">

      <div>

        <span class="pill">
          ✦ ${esc(d.student.class||'MPLB')}
        </span>

        <h1>
          Satu perjalanan,<br>
          <span>tiga tahun perkembangan.</span>
        </h1>

        <p>
          Semua progress dimulai dari <b>0%</b>.
          Persentase berubah otomatis setelah kamu menyelesaikan
          bab pembelajaran.
        </p>

        <button
          class="primary"
          onclick="go('subjects')"
        >
          ▣ Lihat Materi & Progress
        </button>

      </div>

      <div class="orbit-mini">

        <i class="dot a">10</i>
        <i class="dot b">11</i>
        <i class="dot c">12</i>

        <div>
          <strong>${s.learningProgress}%</strong>
          <small>PROGRESS</small>
        </div>

      </div>

    </section>
        <div class="grid stats">

      <div class="stat">

        <div>
          <span class="muted">
            Progress ${esc(d.student.class)}
          </span>

          <div class="num">
            ${s.learningProgress}%
          </div>
        </div>

        <div class="icon">◆</div>

      </div>


      <div class="stat">

        <div>
          <span class="muted">
            Bab Selesai
          </span>

          <div class="num">
            ${s.completedChapters}
          </div>
        </div>

        <div class="icon">✓</div>

      </div>


      <div class="stat">

        <div>
          <span class="muted">
            Reflections
          </span>

          <div class="num">
            ${s.reflections}
          </div>
        </div>

        <div class="icon">✎</div>

      </div>


      <div class="stat">

        <div>
          <span class="muted">
            Portfolio
          </span>

          <div class="num">
            ${s.portfolio}
          </div>
        </div>

        <div class="icon">▧</div>

      </div>

    </div>


    <div class="overall-banner">

      <div class="cardHead">

        <div>

          <h3>
            Perjalanan Kelas 10 → 12
          </h3>

          <p class="muted">
            Progress setiap tingkat dihitung dari bab yang benar-benar dikerjakan.
          </p>

        </div>

        <span class="badge">
          0% awal
        </span>

      </div>


      <div class="journey-progress-grid">

        ${
          gp.map(x=>gradeCard(x,d.student.grade)).join('')
        }

      </div>

    </div>


    <div class="grid two">

      <div class="card">

        <div class="cardHead">

          <h3>
            Materi ${esc(d.student.class)}
          </h3>

          <button
            class="ghost"
            onclick="go('subjects')"
          >
            Buka semua →
          </button>

        </div>

        ${
          (d.subjects||[]).map(x=>`

            <div
              class="progressRow"
              style="margin:14px 0"
            >

              <div>
                <span>${esc(x.name)}</span>
                <b>${x.progress}%</b>
              </div>

              ${progress(x.progress)}

              <small class="muted">
                ${x.chapters} bab •
                ${x.progress===0?'Belum dimulai':'Sedang berjalan'}
              </small>

            </div>

          `).join('')

          ||

          '<div class="empty">Belum ada mata pelajaran.</div>'
        }

      </div>


      <div class="card">

        <div class="cardHead">

          <h3>
            One Thing I Learned
          </h3>

          <button
            class="ghost"
            onclick="reflectionForm()"
          >
            + Tambah
          </button>

        </div>

        ${
          d.reflections.map(r=>`

            <div class="item">

              <b>${esc(r.learned)}</b>

              <small>
                ${esc(r.subject)} • ${esc(r.date)}
              </small>

            </div>

          `).join('')

          ||

          '<div class="empty">Belum ada refleksi. Mulai setelah mempelajari materi.</div>'
        }

      </div>

    </div>
  `;
}


async function teacherDashboard(d){

  const s=d.stats;
  const cls=d.class||{};

  $('content').innerHTML=`

    <section class="hero">

      <div>

        <span class="pill">
          TEACHER MONITORING ·
          ${esc(cls.name||S.user.class||'MPLB')}
        </span>

        <h1>
          Pantau perjalanan belajar<br>
          <span>setiap siswa.</span>
        </h1>

        <p>
          ${esc(cls.name||'Kelas MPLB')} memiliki
          ${s.students} akun siswa.
          Semua aktivitas yang tampil hanya berasal dari kelas
          yang Anda pantau.
        </p>

        <button
          class="primary"
          onclick="go('students')"
        >
          ♙ Lihat ${s.students} Siswa
        </button>

      </div>


      <div class="orbit-mini">

        <i class="dot a">${s.students}</i>
        <i class="dot b">${s.reflections}</i>
        <i class="dot c">${s.averageCompetency}%</i>

        <div>

          <strong>${esc(cls.grade||S.user.grade)}</strong>

          <small>
            ${esc(cls.stage||'MPLB')}
          </small>

        </div>

      </div>

    </section>


    <div class="grid stats">

      <div class="stat">

        <span class="muted">
          Siswa ${esc(cls.name||'')}
        </span>

        <div class="num">
          ${s.students}
        </div>

        <div class="icon">♙</div>

      </div>


      <div class="stat">

        <span class="muted">
          Reflections
        </span>

        <div class="num">
          ${s.reflections}
        </div>

        <div class="icon">✎</div>

      </div>


      <div class="stat">

        <span class="muted">
          Average Progress
        </span>

        <div class="num">
          ${s.averageCompetency}%
        </div>

        <div class="icon">◆</div>

      </div>


      <div class="stat">

        <span class="muted">
          Active Goals
        </span>

        <div class="num">
          ${s.activeGoals}
        </div>

        <div class="icon">◎</div>

      </div>

    </div>


    <div class="overall-banner">

      <div class="cardHead">

        <div>

          <h3>
            ${esc(cls.name||'Kelas MPLB')}
          </h3>

          <p class="muted">
            Guru: ${esc(S.user.name)} •
            ${s.students} akun siswa
          </p>

        </div>

        <span class="badge">
          ${s.averageCompetency}% overall
        </span>

      </div>

      ${progress(s.averageCompetency)}

    </div>


    <div class="grid two">

      <div class="card">

        <div class="cardHead">

          <h3>Daftar Siswa</h3>

          <button
            class="ghost"
            onclick="go('students')"
          >
            Buka monitoring →
          </button>

        </div>

        ${
          d.students.slice(0,10).map(x=>`

            <div class="item">

              <b>${esc(x.name)}</b>

              <small>
                ${esc(x.nis)} •
                ${esc(x.class)}

                <button
                  class="ghost"
                  onclick="studentDetail('${x.id}')"
                >
                  Detail
                </button>

              </small>

            </div>

          `).join('')
        }

      </div>


      <div class="card">

        <h3>Aktivitas Terbaru</h3>

        ${
          d.reflections.slice(0,8).map(r=>`

            <div class="item">

              <b>${esc(r.topic)}</b>

              <small>
                ${esc(r.subject)} • ${esc(r.date)}
              </small>

            </div>

          `).join('')

          ||

          '<div class="empty">Belum ada refleksi dari siswa.</div>'
        }

      </div>

    </div>

  `;
}


async function journey(){

  const d=await api('/api/dashboard');

  const r=d.reflections||[];
  const g=d.goals||[];

  const f=await api('/api/future');

  $('content').innerHTML=
    pageHead(
      'MY JOURNEY',
      'Perjalanan Belajarku',
      'Jejak perkembangan dari 10 MPLB sampai 12 MPLB dan future pathway.'
    )

    +

    `<div class="journey-progress-grid">

      ${
        (d.gradeProgress||[])
          .map(x=>gradeCard(x,d.student.grade))
          .join('')
      }

    </div>


    <div
      class="grid three"
      style="margin-top:18px"
    >

      <div class="card">

        <h3>${r.length}</h3>

        <p class="muted">
          Refleksi
        </p>

      </div>


      <div class="card">

        <h3>${g.length}</h3>

        <p class="muted">
          Learning Goals
        </p>

      </div>


      <div class="card">

        <h3>${f.length}</h3>

        <p class="muted">
          Future Plans
        </p>

      </div>

    </div>


    <div
      class="card"
      style="margin-top:18px"
    >

      <div class="cardHead">

        <h3>
          Learning Timeline
        </h3>

        <span class="badge">
          ${r.length} aktivitas
        </span>

      </div>


      <div class="timeline">

        ${
          r.slice().reverse().map(x=>`

            <div class="item">

              <b>${esc(x.topic)}</b>

              <small>
                ${esc(x.subject)}
                ${x.chapterTitle?' • '+esc(x.chapterTitle):''}
                • ${esc(x.date)}
              </small>

              <p class="muted">
                ${esc(x.learned)}
              </p>

            </div>

          `).join('')

          ||

          '<div class="empty">Belum ada aktivitas. Mulai dari Mata Pelajaran.</div>'
        }

      </div>

    </div>`;
}


/* =====================================================
   CURRICULUM
   ===================================================== */

async function curriculum(){

  const grade=Number(S.user.grade||10);

  const a=await api('/api/curriculum?grade='+grade);

  $('content').innerHTML=
    pageHead(
      'TEACHER CURRICULUM',
      `Curriculum — ${grade} MPLB`,
      'Guru hanya mengelola mata pelajaran dan bab pada kelas yang dipantau.',
      '<button class="primary" onclick="chapterForm()">+ Tambah Bab</button>'
    )

    +

    `<div class="overall-banner">

      <b>${esc(S.user.name)}</b>
      · ${esc(S.user.class||'')}
      · ${a.length} mata pelajaran

    </div>


    <div class="grid twoCards">

      ${
        a.map(s=>`
          <div class="card">

            <div class="cardHead">

              <div>

                <h3>${esc(s.name)}</h3>

                <span class="muted">
                  ${esc(s.category)}
                </span>

              </div>

              <span class="badge">
                ${s.chapters.length} bab
              </span>

            </div>

            ${
              s.chapters.map((c,i)=>`

                <div
                  class="chapter-row"
                  style="margin-top:9px"
                >

                  <div class="chapter-num">
                    ${i+1}
                  </div>

                  <div>

                    <div class="chapter-title">
                      ${esc(c.title)}
                    </div>

                    <div class="chapter-meta">
                      ${esc(c.description||'')}
                    </div>

                  </div>

                  <button
                    class="danger"
                    onclick="deleteChapter('${c.id}')"
                  >
                    Hapus
                  </button>

                </div>

              `).join('')

              ||

              '<div class="empty">Belum ada bab.</div>'
            }

          </div>

        `).join('')
      }

    </div>`;
}


async function chapterForm(){

  const subs=await api(
    '/api/subjects?grade='+(S.user.grade||10)
  );

  openModal(`

    <h2>▣ Tambah Bab Pembelajaran</h2>

    <p class="muted">
      Bab baru akan langsung masuk ke kurikulum
      ${esc(S.user.class||'kelas Anda')}.
    </p>

    <label>
      Mata Pelajaran

      <select id="cs">

        ${
          subs.map(s=>`

            <option value="${s.id}">
              ${esc(s.name)}
            </option>

          `).join('')
        }

      </select>

    </label>


    <label>
      Judul Bab

      <input
        id="ct"
        placeholder="Contoh: Bab 7 — Praktik Lanjutan"
      >

    </label>


    <label>
      Deskripsi

      <textarea
        id="cd"
        placeholder="Ringkasan materi bab"
      ></textarea>

    </label>


    <button
      class="primary full"
      onclick="saveChapter()"
    >
      Simpan Bab
    </button>

  `);
}


async function saveChapter(){

  try{

    await api('/api/chapters',{
      method:'POST',

      body:JSON.stringify({

        subjectId:$('cs').value,

        title:$('ct').value,

        description:$('cd').value

      })
    });

    closeModal();

    toast('Bab ditambahkan');

    go('curriculum');

  }catch(e){

    toast(e.message);

  }
}


async function deleteChapter(idv){

  if(!confirm(
    'Hapus bab ini? Progress siswa pada bab ini juga akan ikut terhapus.'
  ))return;

  try{

    await api('/api/chapters/'+idv,{
      method:'DELETE'
    });

    toast('Bab dihapus');

    go('curriculum');

  }catch(e){

    toast(e.message);

  }
}


/* =====================================================
   REFLECTION FORM FINAL
   ===================================================== */

async function reflectionForm(editId=''){

  let existing=null;

  if(editId){

    existing=(await api('/api/reflections'))
      .find(x=>x.id===editId);

  }

  const a=await api(
    '/api/subjects?grade='+(S.user.grade||10)
  );

  let chapters=[];

  if(existing?.chapterId){

    const subj=a.find(
      x=>x.name===existing.subject
    );

    if(subj){

      chapters=(await api('/api/subjects/'+subj.id))
        .chapters;

    }

  }

  openModal(`

    <h2>
      ✎ ${existing?'Edit':'Tambah'} Reflection
    </h2>

    <div class="formgrid">

      <label>
        Mata Pelajaran

        <select
          id="fs"
          onchange="loadReflectionChapters(this.value)"
        >

          ${
            a.map(x=>`

              <option
                value="${x.id}"
                ${x.name===existing?.subject?'selected':''}
              >
                ${esc(x.name)}
              </option>

            `).join('')
          }

        </select>

      </label>


      <label>
        Bab yang dipelajari

        <select id="fch">

          <option value="">
            Tidak ditautkan
          </option>

          ${
            chapters.map(c=>`

              <option
                value="${c.id}"
                ${c.id===existing?.chapterId?'selected':''}
              >
                ${esc(c.title)}
              </option>

            `).join('')
          }

        </select>

      </label>


      <label class="wide">

        Level

        <select id="fl">

          ${
            [
              'Belum Memahami',
              'Mulai Memahami',
              'Memahami',
              'Mampu Menerapkan'
            ].map(v=>`

              <option ${v===existing?.level?'selected':''}>
                ${v}
              </option>

            `).join('')
          }

        </select>

      </label>


      <label class="wide">

        Topik

        <input
          id="ft"
          value="${esc(existing?.topic||'')}"
          placeholder="Contoh: Sistem penyimpanan arsip"
        >

      </label>


      <label class="wide">

        Apa satu hal paling penting yang dipelajari?

        <textarea id="fy">
          ${esc(existing?.learned||'')}
        </textarea>

      </label>


      <label>

        Kenapa?

        <textarea id="fr">
          ${esc(existing?.reason||'')}
        </textarea>

      </label>


      <label>

        Langkah berikutnya?

        <textarea id="fn">
          ${esc(existing?.nextAction||'')}
        </textarea>

      </label>


      <label class="wide">

        Link bukti

        <input
          id="fe"
          value="${esc(existing?.evidence||'')}"
          placeholder="https://..."
        >

      </label>

    </div>


    <button
      class="primary full"
      onclick="saveReflection('${editId}')"
    >
      Simpan Reflection →
    </button>

  `);
}


async function loadReflectionChapters(subjectId){

  try{

    const x=await api(
      '/api/subjects/'+subjectId
    );

    $('fch').innerHTML=
      '<option value="">Tidak ditautkan</option>'+
      x.chapters.map(c=>`

        <option value="${c.id}">
          ${esc(c.title)}
        </option>

      `).join('');

  }catch(e){

    toast(e.message);

  }
}


async function saveReflection(idv=''){

  try{

    const b={

      subject:$('fs').value
        ?$('fs').selectedOptions[0].textContent
        :'',

      chapterId:$('fch').value||null,

      topic:$('ft').value,

      learned:$('fy').value,

      level:$('fl').value,

      reason:$('fr').value,

      nextAction:$('fn').value,

      evidence:$('fe').value

    };

    await api(
      idv
        ?'/api/reflections/'+idv
        :'/api/reflections',
      {
        method:idv?'PUT':'POST',
        body:JSON.stringify(b)
      }
    );

    closeModal();

    toast('Refleksi tersimpan');

    go('reflection');

  }catch(e){

    toast(e.message);

  }
}


/* =====================================================
   FINAL PAGES
   ===================================================== */

const pages={

  dashboard,

  journey,

  subjects,

  reflection,

  competencies,

  goals,

  archive,

  tka,

  university,

  career,

  future,

  achievements,

  portfolio,

  students,

  curriculum,

  monitoring,

  reports

};


/* =====================================================
   SESSION CHECK
   ===================================================== */

(async()=>{

  try{

    const d=await api('/api/me');

    S.user=d.user;

    show();

  }catch{

    showLanding();

  }

})();