require('dotenv').config();
const mysql = require('mysql2/promise');

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'learning_journey';

/* =====================================================
   DATA KELAS DAN GURU
   ===================================================== */

const classSeed = [
  {
    id: 'CLS10',
    name: '10 MPLB',
    grade: 10,
    stage: 'Foundation',
    teacherId: 'TCH10',
    teacherName: 'SENDY AFIFA SALSABILA',
    username: 'sendy.smkcn',
    password: 'sendy4827'
  },
  {
    id: 'CLS11',
    name: '11 MPLB',
    grade: 11,
    stage: 'Development',
    teacherId: 'TCH11',
    teacherName: 'KEISHA PATRICIA',
    username: 'keisha.smkcn',
    password: 'keisha7315'
  },
  {
    id: 'CLS12',
    name: '12 MPLB',
    grade: 12,
    stage: 'Preparation',
    teacherId: 'TCH12',
    teacherName: 'MELISA PUTRI',
    username: 'melisa.smkcn',
    password: 'melisa9642'
  }
];

/* =====================================================
   DATA MATA PELAJARAN
   ===================================================== */

const subjectSeed = [
  [
    'SUB10-01',
    'Dasar-Dasar MPLB',
    'Kejuruan',
    '10',
    '▣',
    [
      'Bab 1 — Ruang Lingkup MPLB',
      'Bab 2 — Administrasi Perkantoran',
      'Bab 3 — Prosedur Kerja',
      'Bab 4 — Etika dan Budaya Kerja',
      'Bab 5 — Praktik Administrasi Dasar',
      'Bab 6 — Proyek Administrasi Dasar'
    ]
  ],
  [
    'SUB10-02',
    'Kearsipan',
    'Kejuruan',
    '10',
    '▤',
    [
      'Bab 1 — Konsep Dasar Arsip',
      'Bab 2 — Sistem Penyimpanan Arsip',
      'Bab 3 — Klasifikasi dan Indeks',
      'Bab 4 — Pemeliharaan Arsip',
      'Bab 5 — Penyusutan Arsip',
      'Bab 6 — Praktik Pengelolaan Arsip'
    ]
  ],
  [
    'SUB10-03',
    'Teknologi Perkantoran',
    'Kejuruan',
    '10',
    '◈',
    [
      'Bab 1 — Perangkat Perkantoran',
      'Bab 2 — Pengolah Dokumen',
      'Bab 3 — Spreadsheet Dasar',
      'Bab 4 — Presentasi Digital',
      'Bab 5 — Manajemen File dan Folder',
      'Bab 6 — Praktik Teknologi Perkantoran'
    ]
  ],
  [
    'SUB10-04',
    'Komunikasi',
    'Kejuruan',
    '10',
    '◌',
    [
      'Bab 1 — Dasar Komunikasi',
      'Bab 2 — Komunikasi Lisan',
      'Bab 3 — Komunikasi Tertulis',
      'Bab 4 — Etika Komunikasi',
      'Bab 5 — Praktik Pelayanan',
      'Bab 6 — Simulasi Komunikasi'
    ]
  ],
  [
    'SUB10-05',
    'Administrasi Umum',
    'Kejuruan',
    '10',
    '▥',
    [
      'Bab 1 — Organisasi dan Administrasi',
      'Bab 2 — Tata Naskah',
      'Bab 3 — Agenda dan Disposisi',
      'Bab 4 — Pelayanan Administrasi',
      'Bab 5 — Praktik Administrasi',
      'Bab 6 — Proyek Administrasi'
    ]
  ],

  [
    'SUB11-01',
    'Kearsipan Digital',
    'Kejuruan',
    '11',
    '⌘',
    [
      'Bab 1 — Arsip Digital',
      'Bab 2 — Struktur Folder',
      'Bab 3 — Metadata dan Penamaan',
      'Bab 4 — Keamanan Arsip Digital',
      'Bab 5 — Retensi dan Backup',
      'Bab 6 — Proyek Arsip Digital'
    ]
  ],
  [
    'SUB11-02',
    'Administrasi Perkantoran',
    'Kejuruan',
    '11',
    '▥',
    [
      'Bab 1 — Perencanaan Administrasi',
      'Bab 2 — Pengelolaan Dokumen',
      'Bab 3 — Rapat dan Notulensi',
      'Bab 4 — Pelayanan Internal',
      'Bab 5 — Praktik Administrasi',
      'Bab 6 — Proyek Administrasi'
    ]
  ],
  [
    'SUB11-03',
    'Komunikasi Bisnis',
    'Kejuruan',
    '11',
    '◌',
    [
      'Bab 1 — Komunikasi Bisnis',
      'Bab 2 — Email Profesional',
      'Bab 3 — Surat Bisnis',
      'Bab 4 — Presentasi Bisnis',
      'Bab 5 — Negosiasi dan Layanan',
      'Bab 6 — Simulasi Komunikasi Bisnis'
    ]
  ],
  [
    'SUB11-04',
    'Teknologi Perkantoran Lanjutan',
    'Kejuruan',
    '11',
    '◈',
    [
      'Bab 1 — Otomatisasi Dokumen',
      'Bab 2 — Spreadsheet Lanjutan',
      'Bab 3 — Kolaborasi Digital',
      'Bab 4 — Sistem Informasi Perkantoran',
      'Bab 5 — Praktik Digital Office',
      'Bab 6 — Proyek Otomatisasi'
    ]
  ],
  [
    'SUB11-05',
    'Simulasi Dunia Kerja',
    'Praktik',
    '11',
    '↗',
    [
      'Bab 1 — Budaya Kerja',
      'Bab 2 — SOP Perkantoran',
      'Bab 3 — Pelayanan dan Front Office',
      'Bab 4 — Simulasi Pekerjaan',
      'Bab 5 — Evaluasi Kinerja',
      'Bab 6 — Proyek Simulasi Kerja'
    ]
  ],

  [
    'SUB12-01',
    'Pengelolaan Perkantoran',
    'Kejuruan',
    '12',
    '▥',
    [
      'Bab 1 — Perencanaan Kerja',
      'Bab 2 — Pengelolaan Agenda',
      'Bab 3 — Pengelolaan Rapat',
      'Bab 4 — Pengelolaan Informasi',
      'Bab 5 — Evaluasi Administrasi',
      'Bab 6 — Proyek Pengelolaan Perkantoran'
    ]
  ],
  [
    'SUB12-02',
    'Kearsipan Digital Lanjutan',
    'Kejuruan',
    '12',
    '⌘',
    [
      'Bab 1 — Digital Filing System',
      'Bab 2 — Automasi Arsip',
      'Bab 3 — Keamanan dan Akses',
      'Bab 4 — Audit Arsip',
      'Bab 5 — Proyek Arsip Digital',
      'Bab 6 — Evaluasi Sistem Arsip'
    ]
  ],
  [
    'SUB12-03',
    'Otomatisasi Administrasi',
    'Kejuruan',
    '12',
    '◆',
    [
      'Bab 1 — Konsep Otomatisasi',
      'Bab 2 — Workflow Administrasi',
      'Bab 3 — Form dan Database',
      'Bab 4 — Integrasi Aplikasi',
      'Bab 5 — Proyek Otomatisasi',
      'Bab 6 — Evaluasi Otomatisasi'
    ]
  ],
  [
    'SUB12-04',
    'Proyek Kejuruan',
    'Proyek',
    '12',
    '◇',
    [
      'Bab 1 — Identifikasi Masalah',
      'Bab 2 — Perencanaan Proyek',
      'Bab 3 — Pelaksanaan',
      'Bab 4 — Dokumentasi dan Portfolio',
      'Bab 5 — Presentasi Hasil',
      'Bab 6 — Evaluasi Proyek'
    ]
  ],
  [
    'SUB12-05',
    'Persiapan Dunia Kerja',
    'Praktik',
    '12',
    '→',
    [
      'Bab 1 — CV dan Portfolio',
      'Bab 2 — Job Search',
      'Bab 3 — Simulasi Interview',
      'Bab 4 — Etika Dunia Kerja',
      'Bab 5 — Career Planning',
      'Bab 6 — Simulasi Rekrutmen'
    ]
  ]
];

/* =====================================================
   KOMPETENSI
   ===================================================== */

const comps = [
  ['COMP001', 'Komunikasi', 'Soft Skill'],
  ['COMP002', 'Keterampilan Digital', 'Digital'],
  ['COMP003', 'Administrasi', 'Kejuruan'],
  ['COMP004', 'Kearsipan', 'Kejuruan'],
  ['COMP005', 'Problem Solving', 'Soft Skill'],
  ['COMP006', 'Kerja Sama', 'Soft Skill'],
  ['COMP007', 'Kemandirian', 'Soft Skill'],
  ['COMP008', 'Adaptasi Teknologi', 'Digital']
];

/* =====================================================
   ACHIEVEMENTS
   ===================================================== */

const achievements = [
  ['ACH001', 'First Reflection', 'Menyelesaikan refleksi pertama.', '✎'],
  ['ACH002', 'Chapter Explorer', 'Menyelesaikan bab pertama.', '◆'],
  ['ACH003', 'Learning Streak', 'Aktif mencatat pembelajaran secara konsisten.', '↗'],
  ['ACH004', 'Portfolio Ready', 'Memiliki karya yang dapat ditampilkan.', '▧'],
  ['ACH005', 'Goal Setter', 'Membuat learning goal pertama.', '◎'],
  ['ACH006', 'Future Ready', 'Menyusun rencana masa depan.', '→']
];

/* =====================================================
   DATA SISWA
   Username menggunakan format nama.smkcn
   Password berbeda dari username
   ===================================================== */

const studentSeed = [
  // =========================
  // KELAS 10 MPLB - 11 SISWA
  // =========================

  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1001',
    name: 'RAMDHANI FITRATUNNISA',
    username: 'ramdhani.smkcn',
    password: 'ramdhani17',
    nis: '260001',
    nisn: '1020260001'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1002',
    name: 'AMELIA PRATIWI',
    username: 'amelia.smkcn',
    password: 'amelia42',
    nis: '260002',
    nisn: '1020260002'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1003',
    name: 'NISRINA MUMTAZ',
    username: 'nisrina.smkcn',
    password: 'nisrina63',
    nis: '260003',
    nisn: '1020260003'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1004',
    name: 'NAYA SAVINA ZAHARA',
    username: 'naya.smkcn',
    password: 'naya28',
    nis: '260004',
    nisn: '1020260004'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1005',
    name: 'DHINI MELIA ROSTRIYANTI',
    username: 'dhini.smkcn',
    password: 'dhini91',
    nis: '260005',
    nisn: '1020260005'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1006',
    name: 'ABIDYA NABIEL FAYZEL',
    username: 'abidya.smkcn',
    password: 'abidya35',
    nis: '260006',
    nisn: '1020260006'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1007',
    name: 'FATHIYA ALIFA TSABITA',
    username: 'fathiya.smkcn',
    password: 'fathiya74',
    nis: '260007',
    nisn: '1020260007'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1008',
    name: 'GABRIELA ESTER PAULINA',
    username: 'gabriela.smkcn',
    password: 'gabriela56',
    nis: '260008',
    nisn: '1020260008'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1009',
    name: 'RENATA RACHEL',
    username: 'renata.smkcn',
    password: 'renata83',
    nis: '260009',
    nisn: '1020260009'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1010',
    name: 'KARTIKA INDAH LESTARI',
    username: 'kartika.smkcn',
    password: 'kartika19',
    nis: '260010',
    nisn: '1020260010'
  },
  {
    grade: 10,
    classId: 'CLS10',
    className: '10 MPLB',
    id: 'STD1011',
    name: 'CLAUDYA VALENTIN KEBKOLE',
    username: 'claudya.smkcn',
    password: 'claudya47',
    nis: '260011',
    nisn: '1020260011'
  },

  // =========================
  // KELAS 11 MPLB - 10 SISWA
  // =========================

  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1101',
    name: 'ANA AFIDHATUL MAULIDA',
    username: 'ana.smkcn',
    password: 'ana62',
    nis: '260012',
    nisn: '1120260012'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1102',
    name: 'REVA LAZITA',
    username: 'reva.smkcn',
    password: 'reva31',
    nis: '260013',
    nisn: '1120260013'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1103',
    name: 'NOVA SETYA RAMADHANIS',
    username: 'nova.smkcn',
    password: 'nova88',
    nis: '260014',
    nisn: '1120260014'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1104',
    name: 'MUHAMMAD YAFI ABDUL HAFIZ',
    username: 'muhammad.smkcn24',
    password: 'muhammad24',
    nis: '260015',
    nisn: '1120260015'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1105',
    name: 'RIA ANGELINA GULTOM',
    username: 'ria.smkcn53',
    password: 'ria53',
    nis: '260016',
    nisn: '1120260016'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1106',
    name: 'NAFILA MAHARANI',
    username: 'nafila.smkcn',
    password: 'nafila76',
    nis: '260017',
    nisn: '1120260017'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1107',
    name: 'DEVI AMELIA TAMBUNAN',
    username: 'devi.smkcn',
    password: 'devi14',
    nis: '260018',
    nisn: '1120260018'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1108',
    name: 'DINA AFIRLI',
    username: 'dina.smkcn',
    password: 'dina69',
    nis: '260019',
    nisn: '1120260019'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1109',
    name: 'RIA REVALINA RIDAYANTI',
    username: 'ria.smkcn37',
    password: 'ria37',
    nis: '260020',
    nisn: '1120260020'
  },
  {
    grade: 11,
    classId: 'CLS11',
    className: '11 MPLB',
    id: 'STD1110',
    name: 'HAIKAL NURIN ALAMIN',
    username: 'haikal.smkcn',
    password: 'haikal82',
    nis: '260021',
    nisn: '1120260021'
  },

  // =========================
  // KELAS 12 MPLB - 10 SISWA
  // =========================

  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1201',
    name: 'IRDATILA RENI RAMADANI',
    username: 'irdatila.smkcn',
    password: 'irdatila45',
    nis: '260022',
    nisn: '1220260022'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1202',
    name: 'DESLYNE MAHARANI',
    username: 'deslyne.smkcn',
    password: 'deslyne96',
    nis: '260023',
    nisn: '1220260023'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1203',
    name: 'NANDA ADITYA FEBRIANTI',
    username: 'nanda.smkcn',
    password: 'nanda21',
    nis: '260024',
    nisn: '1220260024'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1204',
    name: 'KAILA JEWEL PANDEGIROT',
    username: 'kaila.smkcn',
    password: 'kaila58',
    nis: '260025',
    nisn: '1220260025'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1205',
    name: 'INDI ELA DWIARY',
    username: 'indi.smkcn',
    password: 'indi73',
    nis: '260026',
    nisn: '1220260026'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1206',
    name: 'FAJRI IZZA MAHESA',
    username: 'fajri.smkcn',
    password: 'fajri34',
    nis: '260027',
    nisn: '1220260027'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1207',
    name: 'NAURA ELYA WIBOWO',
    username: 'naura.smkcn',
    password: 'naura87',
    nis: '260028',
    nisn: '1220260028'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1208',
    name: 'MUHAMMAD RIEFHA HUSAENI',
    username: 'muhammad.smkcn26',
    password: 'muhammad26',
    nis: '260029',
    nisn: '1220260029'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1209',
    name: 'RAFA BAIHAQI GUNAWAN',
    username: 'rafa.smkcn',
    password: 'rafa61',
    nis: '260030',
    nisn: '1220260030'
  },
  {
    grade: 12,
    classId: 'CLS12',
    className: '12 MPLB',
    id: 'STD1210',
    name: 'CHELSEA FITRIANI OCTAWA',
    username: 'chelsea.smkcn',
    password: 'chelsea49',
    nis: '260031',
    nisn: '1220260031'
  }
];

/* =====================================================
   MAIN
   ===================================================== */

async function main() {
  const c = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  /* =====================================================
     CREATE DATABASE
     ===================================================== */

  await c.query(`
    CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);

  await c.changeUser({
    host,
    port,
    user,
    password,
    database: dbName
  });

  /* =====================================================
     CREATE TABLES
     ===================================================== */

  await c.query(`
    SET FOREIGN_KEY_CHECKS=0;

    CREATE TABLE IF NOT EXISTS classes(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      grade INT NOT NULL,
      stage VARCHAR(80),
      status VARCHAR(30) DEFAULT 'Aktif'
    );

    CREATE TABLE IF NOT EXISTS users(
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      name VARCHAR(150),
      role ENUM('student','teacher'),
      studentId VARCHAR(50),
      teacherId VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS teachers(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      subject VARCHAR(100),
      status VARCHAR(40) DEFAULT 'Aktif',
      classId VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS students(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      nis VARCHAR(50),
      nisn VARCHAR(50),
      class VARCHAR(80),
      classId VARCHAR(50),
      grade INT DEFAULT 10,
      status VARCHAR(40) DEFAULT 'Aktif',
      avatar VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS subjects(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100),
      grade VARCHAR(50),
      progress INT DEFAULT 0,
      icon VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS subject_chapters(
      id VARCHAR(50) PRIMARY KEY,
      subjectId VARCHAR(50) NOT NULL,
      title VARCHAR(255),
      description TEXT,
      orderNo INT DEFAULT 1,
      FOREIGN KEY(subjectId)
        REFERENCES subjects(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_chapter_progress(
      id VARCHAR(100) PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      chapterId VARCHAR(50) NOT NULL,
      progress INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Belum Dimulai',
      note TEXT,
      lastUpdated DATE,
      UNIQUE KEY uq_student_chapter(studentId,chapterId),
      FOREIGN KEY(studentId)
        REFERENCES students(id)
        ON DELETE CASCADE,
      FOREIGN KEY(chapterId)
        REFERENCES subject_chapters(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reflections(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50) NOT NULL,
      subject VARCHAR(150),
      topic VARCHAR(255),
      chapterId VARCHAR(50) NULL,
      learned TEXT,
      level VARCHAR(80),
      reason TEXT,
      nextAction TEXT,
      evidence TEXT,
      date DATE,
      INDEX(studentId)
    );

    CREATE TABLE IF NOT EXISTS competencies(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150),
      category VARCHAR(100),
      progress INT DEFAULT 0,
      level VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS goals(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      description TEXT,
      category VARCHAR(100),
      grade INT,
      targetDate DATE NULL,
      progress INT DEFAULT 0,
      status VARCHAR(80)
    );

    CREATE TABLE IF NOT EXISTS assessments(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      type VARCHAR(80),
      category VARCHAR(100),
      subject VARCHAR(150),
      grade INT,
      score DECIMAL(6,2),
      max DECIMAL(6,2),
      date DATE
    );

    CREATE TABLE IF NOT EXISTS feedback(
      id VARCHAR(50) PRIMARY KEY,
      reflectionId VARCHAR(50),
      studentId VARCHAR(50),
      teacherId VARCHAR(50),
      teacher VARCHAR(150),
      comment TEXT,
      recommendation TEXT,
      date DATE,
      INDEX(studentId)
    );

    CREATE TABLE IF NOT EXISTS futurePlans(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      type VARCHAR(100),
      target VARCHAR(255),
      detail TEXT,
      year VARCHAR(20),
      status VARCHAR(80),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS tka(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      subject VARCHAR(150),
      date DATE,
      score DECIMAL(6,2) DEFAULT 0,
      status VARCHAR(80),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS universityPlans(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      institution VARCHAR(255),
      targetYear VARCHAR(20),
      status VARCHAR(80),
      notes TEXT,
      progress INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS careerPlans(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      institution VARCHAR(255),
      targetYear VARCHAR(20),
      status VARCHAR(80),
      notes TEXT,
      progress INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS archive(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      category VARCHAR(100),
      grade VARCHAR(20),
      description TEXT,
      link TEXT,
      date DATE
    );

    CREATE TABLE IF NOT EXISTS achievements(
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150),
      description VARCHAR(255),
      icon VARCHAR(20),
      earned BOOLEAN DEFAULT FALSE,
      date DATE
    );

    CREATE TABLE IF NOT EXISTS portfolio(
      id VARCHAR(50) PRIMARY KEY,
      studentId VARCHAR(50),
      title VARCHAR(255),
      category VARCHAR(100),
      description TEXT,
      link TEXT,
      file TEXT,
      date DATE,
      status VARCHAR(80)
    );

    SET FOREIGN_KEY_CHECKS=1;
  `);

  /* =====================================================
     RESET DATA SEED
     ===================================================== */

  await c.query(`
    SET FOREIGN_KEY_CHECKS=0;

    DELETE FROM student_chapter_progress;
    DELETE FROM subject_chapters;
    DELETE FROM subjects;
    DELETE FROM reflections;
    DELETE FROM competencies;
    DELETE FROM goals;
    DELETE FROM assessments;
    DELETE FROM feedback;
    DELETE FROM futurePlans;
    DELETE FROM tka;
    DELETE FROM universityPlans;
    DELETE FROM careerPlans;
    DELETE FROM archive;
    DELETE FROM achievements;
    DELETE FROM portfolio;
    DELETE FROM users;
    DELETE FROM students;
    DELETE FROM teachers;
    DELETE FROM classes;

    SET FOREIGN_KEY_CHECKS=1;
  `);

  /* =====================================================
     INSERT KELAS DAN GURU
     ===================================================== */

  for (const cls of classSeed) {

    await c.execute(
      'INSERT INTO classes(id,name,grade,stage,status) VALUES(?,?,?,?,?)',
      [
        cls.id,
        cls.name,
        cls.grade,
        cls.stage,
        'Aktif'
      ]
    );

    await c.execute(
      'INSERT INTO teachers(id,name,subject,status,classId) VALUES(?,?,?,?,?)',
      [
        cls.teacherId,
        cls.teacherName,
        'MPLB',
        'Aktif',
        cls.id
      ]
    );

    await c.execute(
      'INSERT INTO users(id,username,password,name,role,studentId,teacherId) VALUES(?,?,?,?,?,?,?)',
      [
        `USR-${cls.teacherId}`,
        cls.username,
        cls.password,
        cls.teacherName,
        'teacher',
        null,
        cls.teacherId
      ]
    );
  }

  /* =====================================================
     INSERT SISWA
     ===================================================== */

  for (const student of studentSeed) {

    const avatar = student.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('');

    await c.execute(
      'INSERT INTO students(id,name,nis,nisn,class,classId,grade,status,avatar) VALUES(?,?,?,?,?,?,?,?,?)',
      [
        student.id,
        student.name,
        student.nis,
        student.nisn,
        student.className,
        student.classId,
        student.grade,
        'Aktif',
        avatar
      ]
    );

    await c.execute(
      'INSERT INTO users(id,username,password,name,role,studentId,teacherId) VALUES(?,?,?,?,?,?,?)',
      [
        `USR-${student.id}`,
        student.username,
        student.password,
        student.name,
        'student',
        student.id,
        null
      ]
    );
  }

  /* =====================================================
     INSERT MATA PELAJARAN DAN BAB
     ===================================================== */

  for (const [sid, name, cat, grade, icon, chapters] of subjectSeed) {

    await c.execute(
      'INSERT INTO subjects(id,name,category,grade,progress,icon) VALUES(?,?,?,?,?,?)',
      [
        sid,
        name,
        cat,
        grade,
        0,
        icon
      ]
    );

    for (let i = 0; i < chapters.length; i++) {

      const cid = `${sid}-CH${String(i + 1).padStart(2, '0')}`;

      await c.execute(
        'INSERT INTO subject_chapters(id,subjectId,title,description,orderNo) VALUES(?,?,?,?,?)',
        [
          cid,
          sid,
          chapters[i],
          'Materi pembelajaran yang dapat dipantau progresnya.',
          i + 1
        ]
      );
    }
  }

  /* =====================================================
     INSERT KOMPETENSI
     ===================================================== */

  for (const x of comps) {

    await c.execute(
      'INSERT INTO competencies(id,name,category,progress,level) VALUES(?,?,?,?,?)',
      [
        x[0],
        x[1],
        x[2],
        0,
        'Belum Dinilai'
      ]
    );
  }

  /* =====================================================
     INSERT ACHIEVEMENTS
     ===================================================== */

  for (const x of achievements) {

    await c.execute(
      'INSERT INTO achievements(id,name,description,icon,earned,date) VALUES(?,?,?,?,0,NULL)',
      x
    );
  }

  /* =====================================================
     SELESAI
     ===================================================== */

  console.log(`\nDatabase '${dbName}' siap.`);
  console.log('3 kelas telah dibuat.');
  console.log('Kelas 10 MPLB: 11 siswa.');
  console.log('Kelas 11 MPLB: 10 siswa.');
  console.log('Kelas 12 MPLB: 10 siswa.');
  console.log('Total: 31 siswa.');
  console.log('Semua progress siswa dimulai dari 0%.');

  console.log('Guru:');
  console.log('10 MPLB → sendy.smkcn / sendy4827');
  console.log('11 MPLB → keisha.smkcn / keisha7315');
  console.log('12 MPLB → melisa.smkcn / melisa9642');

  console.log('Username siswa menggunakan format nama.smkcn.');
  console.log('Password siswa menggunakan nama depan + 2 digit angka.');
  console.log('Database berhasil di-seed.');

  await c.end();
}

main().catch(e => {
  console.error('\nGAGAL SETUP DATABASE:', e.message);
  process.exit(1);
});