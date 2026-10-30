require('dotenv').config();

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { query, one, exec, test } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'learning-journey-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(ROOT, 'public')));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) =>
      cb(
        null,
        `${Date.now()}-${file.originalname.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        )}`
      )
  }),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

const id = prefix =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`
    .toUpperCase();

const today = () => new Date().toISOString().slice(0, 10);

const average = nums =>
  nums.length
    ? Math.round(
        nums.reduce((a, b) => a + Number(b || 0), 0) / nums.length
      )
    : 0;

const currentStudentId = req => req.session.user?.studentId;
const currentTeacherId = req => req.session.user?.teacherId;
const currentClassId = req => req.session.user?.classId;

async function teacherClass(req) {
  return currentClassId(req)
    ? one(
        'SELECT * FROM classes WHERE id=?',
        [currentClassId(req)]
      )
    : null;
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      message: 'Silakan login terlebih dahulu.'
    });
  }

  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        message: 'Silakan login terlebih dahulu.'
      });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({
        message: 'Akses tidak sesuai dengan peran akun.'
      });
    }

    next();
  };
}

/* =====================================================
   DATA ACCESS
   ===================================================== */

async function all(table, req) {
  if (
    req?.session?.user?.role === 'student'
  ) {
    return query(
      `SELECT * FROM \`${table}\`
       WHERE studentId=?
       ORDER BY id DESC`,
      [currentStudentId(req)]
    );
  }

  if (
    req?.session?.user?.role === 'teacher' &&
    [
      'reflections',
      'goals',
      'assessments',
      'feedback',
      'futurePlans',
      'tka',
      'universityplans',
      'careerplans',
      'archive',
      'portfolio'
    ].includes(table)
  ) {
    return query(
      `SELECT t.*
       FROM \`${table}\` t
       INNER JOIN students s
         ON s.id=t.studentId
       WHERE s.classId=?
       ORDER BY t.id DESC`,
      [currentClassId(req)]
    );
  }

  return query(
    `SELECT * FROM \`${table}\`
     ORDER BY id DESC`
  );
}

async function allStudents(table) {
  return query(
    `SELECT * FROM \`${table}\`
     ORDER BY id DESC`
  );
}

/* =====================================================
   HEALTH CHECK
   ===================================================== */

app.get('/api/health', async (_, res) => {
  try {
    await test();

    res.json({
      ok: true,
      app: 'Learning Journey',
      database: 'MySQL',
      version: '5.0.0'
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      database: 'MySQL',
      message: e.message
    });
  }
});

/* =====================================================
   LOGIN / SESSION
   ===================================================== */

app.get('/api/me', requireLogin, (req, res) => {
  res.json({
    user: req.session.user
  });
});

app.post('/api/login', async (req, res, next) => {
  try {
    const {
      username,
      password,
      role
    } = req.body || {};

    const user = await one(
      `SELECT *
       FROM users
       WHERE username=?
       AND password=?
       AND role=?
       LIMIT 1`,
      [
        username,
        password,
        role
      ]
    );

    if (!user) {
      return res.status(401).json({
        message:
          'Username, password, atau jenis akun tidak sesuai.'
      });
    }

    const studentProfile = user.studentId
      ? await one(
          `SELECT id,class,classId,grade
           FROM students
           WHERE id=?`,
          [user.studentId]
        )
      : null;

    const teacherProfile = user.teacherId
      ? await one(
          `SELECT id,classId
           FROM teachers
           WHERE id=?`,
          [user.teacherId]
        )
      : null;

    const assignedClass =
      teacherProfile?.classId
        ? await one(
            `SELECT id,name,grade,stage
             FROM classes
             WHERE id=?`,
            [teacherProfile.classId]
          )
        : null;

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      studentId: user.studentId || null,
      teacherId: user.teacherId || null,
      class:
        studentProfile?.class ||
        assignedClass?.name ||
        null,
      grade:
        studentProfile?.grade ||
        assignedClass?.grade ||
        null,
      classId:
        studentProfile?.classId ||
        teacherProfile?.classId ||
        null,
      stage:
        assignedClass?.stage ||
        null
    };

    res.json({
      user: req.session.user
    });

  } catch (e) {
    next(e);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true
    });
  });
});

/* =====================================================
   DASHBOARD
   ===================================================== */

app.get('/api/dashboard', requireLogin, async (req, res, next) => {
  try {

    if (req.session.user.role === 'student') {

      const sid = currentStudentId(req);

      const student = await one(
        'SELECT * FROM students WHERE id=?',
        [sid]
      );

      const reflections = await all(
        'reflections',
        req
      );

      const goals = await all(
        'goals',
        req
      );

      const portfolio = await all(
        'portfolio',
        req
      );

      const gradeProgress = [];

      for (const g of [10, 11, 12]) {

        const row = await one(
          `
          SELECT
            COALESCE(
              ROUND(
                AVG(
                  COALESCE(
                    scp.progress,
                    0
                  )
                ),
                0
              ),
              0
            ) progress,
            COUNT(ch.id) chapters
          FROM subjects s
          JOIN subject_chapters ch
            ON ch.subjectId=s.id
          LEFT JOIN student_chapter_progress scp
            ON scp.chapterId=ch.id
            AND scp.studentId=?
          WHERE s.grade=?
          `,
          [
            sid,
            String(g)
          ]
        );

        gradeProgress.push({
          grade: g,
          progress: Number(
            row?.progress || 0
          ),
          chapters: Number(
            row?.chapters || 0
          )
        });
      }

      const current =
        gradeProgress.find(
          x =>
            x.grade ===
            Number(student.grade)
        ) ||
        gradeProgress[0];

      const subjectRows =
        await query(
          `
          SELECT
            s.id,
            s.name,
            s.category,
            s.grade,
            s.icon,
            COALESCE(
              ROUND(
                AVG(
                  COALESCE(
                    scp.progress,
                    0
                  )
                ),
                0
              ),
              0
            ) progress,
            COUNT(ch.id) chapters
          FROM subjects s
          LEFT JOIN subject_chapters ch
            ON ch.subjectId=s.id
          LEFT JOIN student_chapter_progress scp
            ON scp.chapterId=ch.id
            AND scp.studentId=?
          WHERE s.grade=?
          GROUP BY s.id
          ORDER BY s.id
          `,
          [
            sid,
            String(student.grade)
          ]
        );

      const completed =
        await one(
          `
          SELECT COUNT(*) n
          FROM student_chapter_progress
          WHERE studentId=?
          AND progress=100
          `,
          [sid]
        );

      return res.json({
        role: 'student',
        student,

        stats: {
          reflections:
            reflections.length,
          goals:
            goals.length,
          portfolio:
            portfolio.length,
          averageCompetency:
            Number(
              current?.progress || 0
            ),
          learningProgress:
            Number(
              current?.progress || 0
            ),
          completedChapters:
            Number(
              completed?.n || 0
            )
        },

        reflections:
          reflections.slice(0, 5),

        goals,

        gradeProgress,

        subjects:
          subjectRows
      });
    }

    const classId =
      currentClassId(req);

    const students =
      await query(
        `
        SELECT *
        FROM students
        WHERE classId=?
        ORDER BY name
        `,
        [classId]
      );

    const studentIds =
      students.map(
        x => x.id
      );

    const reflections =
      studentIds.length
        ? await query(
            `
            SELECT *
            FROM reflections
            WHERE studentId IN (${studentIds
              .map(() => '?')
              .join(',')})
            ORDER BY date DESC,id DESC
            `,
            studentIds
          )
        : [];

    const goals =
      studentIds.length
        ? await query(
            `
            SELECT *
            FROM goals
            WHERE studentId IN (${studentIds
              .map(() => '?')
              .join(',')})
            ORDER BY id DESC
            `,
            studentIds
          )
        : [];

    const portfolio =
      studentIds.length
        ? await query(
            `
            SELECT *
            FROM portfolio
            WHERE studentId IN (${studentIds
              .map(() => '?')
              .join(',')})
            ORDER BY id DESC
            `,
            studentIds
          )
        : [];

    const feedback =
      studentIds.length
        ? await query(
            `
            SELECT *
            FROM feedback
            WHERE studentId IN (${studentIds
              .map(() => '?')
              .join(',')})
            ORDER BY id DESC
            `,
            studentIds
          )
        : [];

    const competencies =
      await allStudents(
        'competencies'
      );

    const row =
      studentIds.length
        ? await one(
            `
            SELECT
              COALESCE(
                ROUND(
                  AVG(
                    COALESCE(
                      scp.progress,
                      0
                    )
                  ),
                  0
                ),
                0
              ) progress
            FROM student_chapter_progress scp
            WHERE scp.studentId IN (${studentIds
              .map(() => '?')
              .join(',')})
            `,
            studentIds
          )
        : {
            progress: 0
          };

    const cls =
      await teacherClass(req);

    res.json({
      role: 'teacher',
      class: cls,

      stats: {
        students:
          students.length,
        reflections:
          reflections.length,
        averageCompetency:
          Number(
            row?.progress || 0
          ),
        activeGoals:
          goals.filter(
            x =>
              x.status ===
              'Berjalan'
          ).length
      },

      students,
      reflections,
      goals,
      portfolio,
      competencies,
      feedback
    });

  } catch (e) {
    next(e);
  }
});

/* =====================================================
   SUBJECTS
   ===================================================== */

/*
  PENTING:
  Siswa TIDAK boleh memilih grade dari URL.

  Contoh:
  siswa kelas 10:
  /api/subjects?grade=11

  Tetap akan dikembalikan materi kelas 10.

  Guru juga hanya mendapatkan materi kelas
  yang sesuai dengan grade akun gurunya.
*/

app.get(
  '/api/subjects',
  requireLogin,
  async (req, res, next) => {

    try {

      const sessionGrade =
        Number(
          req.session.user.grade
        );

      if (![10, 11, 12].includes(sessionGrade)) {
        return res.status(403).json({
          message:
            'Kelas akun tidak valid.'
        });
      }

      /*
        Query ?grade sengaja TIDAK digunakan
        sebagai sumber hak akses.
      */
      const grade =
        String(sessionGrade);

      const rows =
        await query(
          `
          SELECT
            s.id,
            s.name,
            s.category,
            s.grade,
            s.icon,

            COALESCE(
              ROUND(
                AVG(
                  COALESCE(
                    scp.progress,
                    0
                  )
                ),
                0
              ),
              0
            ) progress,

            COUNT(ch.id) chapters

          FROM subjects s

          LEFT JOIN subject_chapters ch
            ON ch.subjectId=s.id

          LEFT JOIN student_chapter_progress scp
            ON scp.chapterId=ch.id
            AND scp.studentId=?

          WHERE s.grade=?

          GROUP BY s.id
          ORDER BY s.id
          `,
          [
            req.session.user.studentId || '',
            grade
          ]
        );

      res.json(rows);

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   SUBJECT DETAIL
   ===================================================== */

app.get(
  '/api/subjects/:id',
  requireLogin,
  async (req, res, next) => {

    try {

      const x =
        await one(
          `
          SELECT
            id,
            name,
            category,
            grade,
            icon
          FROM subjects
          WHERE id=?
          `,
          [req.params.id]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Mata pelajaran tidak ditemukan.'
        });
      }

      /*
        SECURITY LOCK:
        Siswa hanya boleh membuka subject
        sesuai grade akun mereka.
      */

      if (
        Number(x.grade) !==
        Number(req.session.user.grade)
      ) {

        return res.status(403).json({
          message:
            req.session.user.role === 'student'
              ? 'Materi ini terkunci. Kamu hanya dapat mengakses materi sesuai kelasmu.'
              : 'Materi ini berada di luar kelas yang kamu pantau.'
        });
      }

      const chapters =
        await query(
          `
          SELECT
            ch.*,

            COALESCE(
              scp.progress,
              0
            ) progress,

            COALESCE(
              scp.status,
              'Belum Dimulai'
            ) status,

            COALESCE(
              scp.note,
              ''
            ) note,

            scp.lastUpdated

          FROM subject_chapters ch

          LEFT JOIN student_chapter_progress scp
            ON scp.chapterId=ch.id
            AND scp.studentId=?

          WHERE ch.subjectId=?

          ORDER BY ch.orderNo
          `,
          [
            req.session.user.studentId || '',
            req.params.id
          ]
        );

      const p =
        chapters.length
          ? Math.round(
              chapters.reduce(
                (n, c) =>
                  n +
                  Number(
                    c.progress || 0
                  ),
                0
              ) /
                chapters.length
            )
          : 0;

      res.json({
        ...x,
        progress: p,
        chapters
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   CHAPTER - TEACHER CREATE
   ===================================================== */

app.post(
  '/api/chapters',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (
        !b.subjectId ||
        !b.title
      ) {
        return res.status(400).json({
          message:
            'Mata pelajaran dan judul bab wajib diisi.'
        });
      }

      const subject =
        await one(
          `
          SELECT *
          FROM subjects
          WHERE id=?
          AND grade=?
          `,
          [
            b.subjectId,
            String(
              req.session.user.grade
            )
          ]
        );

      if (!subject) {
        return res.status(403).json({
          message:
            'Guru hanya dapat mengelola materi kelas yang dipantau.'
        });
      }

      const n =
        await one(
          `
          SELECT
            COALESCE(
              MAX(orderNo),
              0
            ) + 1 n
          FROM subject_chapters
          WHERE subjectId=?
          `,
          [b.subjectId]
        );

      const x = {
        id: id('CH'),
        subjectId:
          b.subjectId,
        title:
          b.title,
        description:
          b.description || '',
        orderNo:
          Number(n?.n || 1)
      };

      await exec(
        `
        INSERT INTO subject_chapters
        (
          id,
          subjectId,
          title,
          description,
          orderNo
        )
        VALUES
        (?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   CHAPTER - TEACHER UPDATE
   ===================================================== */

app.put(
  '/api/chapters/:id',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const chapter =
        await one(
          `
          SELECT
            ch.id,
            s.grade
          FROM subject_chapters ch
          INNER JOIN subjects s
            ON s.id=ch.subjectId
          WHERE ch.id=?
          `,
          [req.params.id]
        );

      if (!chapter) {
        return res.status(404).json({
          message:
            'Bab tidak ditemukan.'
        });
      }

      if (
        Number(chapter.grade) !==
        Number(req.session.user.grade)
      ) {
        return res.status(403).json({
          message:
            'Guru hanya dapat mengelola bab dari kelas yang dipantau.'
        });
      }

      await exec(
        `
        UPDATE subject_chapters
        SET
          title=?,
          description=?,
          orderNo=?
        WHERE id=?
        `,
        [
          b.title,
          b.description || '',
          Number(
            b.orderNo
          ) || 1,
          req.params.id
        ]
      );

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   CHAPTER - TEACHER DELETE
   ===================================================== */

app.delete(
  '/api/chapters/:id',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const chapter =
        await one(
          `
          SELECT
            ch.id,
            s.grade
          FROM subject_chapters ch
          INNER JOIN subjects s
            ON s.id=ch.subjectId
          WHERE ch.id=?
          `,
          [req.params.id]
        );

      if (!chapter) {
        return res.status(404).json({
          message:
            'Bab tidak ditemukan.'
        });
      }

      if (
        Number(chapter.grade) !==
        Number(req.session.user.grade)
      ) {
        return res.status(403).json({
          message:
            'Guru hanya dapat menghapus bab dari kelas yang dipantau.'
        });
      }

      await exec(
        `
        DELETE FROM subject_chapters
        WHERE id=?
        `,
        [req.params.id]
      );

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   CHAPTER PROGRESS - STUDENT
   ===================================================== */

app.put(
  '/api/chapters/:id/progress',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const p =
        Math.max(
          0,
          Math.min(
            100,
            Number(
              b.progress
            ) || 0
          )
        );

      /*
        SECURITY LOCK:
        Pastikan bab yang ingin diubah
        memang milik subject kelas siswa.
      */

      const chapter =
        await one(
          `
          SELECT
            ch.id,
            s.grade
          FROM subject_chapters ch
          INNER JOIN subjects s
            ON s.id=ch.subjectId
          WHERE ch.id=?
          `,
          [req.params.id]
        );

      if (!chapter) {
        return res.status(404).json({
          message:
            'Bab tidak ditemukan.'
        });
      }

      if (
        Number(chapter.grade) !==
        Number(req.session.user.grade)
      ) {
        return res.status(403).json({
          message:
            'Bab ini terkunci karena bukan bagian dari kelasmu.'
        });
      }

      const status =
        p === 0
          ? 'Belum Dimulai'
          : p === 100
            ? 'Selesai'
            : 'Berjalan';

      const x = {
        id:
          `${currentStudentId(req)}_${req.params.id}`,
        studentId:
          currentStudentId(req),
        chapterId:
          req.params.id,
        progress: p,
        status,
        note:
          b.note || '',
        lastUpdated:
          today()
      };

      await exec(
        `
        INSERT INTO student_chapter_progress
        (
          id,
          studentId,
          chapterId,
          progress,
          status,
          note,
          lastUpdated
        )
        VALUES
        (?,?,?,?,?,?,?)

        ON DUPLICATE KEY UPDATE
          progress=VALUES(progress),
          status=VALUES(status),
          note=VALUES(note),
          lastUpdated=VALUES(lastUpdated)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   CURRICULUM - TEACHER
   ===================================================== */

app.get(
  '/api/curriculum',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const grade =
        String(
          req.session.user.grade ||
          req.query.grade ||
          10
        );

      const subs =
        await query(
          `
          SELECT *
          FROM subjects
          WHERE grade=?
          ORDER BY id
          `,
          [grade]
        );

      for (const x of subs) {

        x.chapters =
          await query(
            `
            SELECT *
            FROM subject_chapters
            WHERE subjectId=?
            ORDER BY orderNo
            `,
            [x.id]
          );
      }

      res.json(subs);

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   COMPETENCIES
   ===================================================== */

app.get(
  '/api/competencies',
  requireLogin,
  async (_, res, next) => {

    try {
      res.json(
        await allStudents(
          'competencies'
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   REFLECTIONS
   ===================================================== */

app.get(
  '/api/reflections',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'reflections',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/reflections',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (
        !b.subject ||
        !b.topic ||
        !b.learned
      ) {
        return res.status(400).json({
          message:
            'Mata pelajaran, topik, dan hal yang dipelajari wajib diisi.'
        });
      }

      const x = {
        id: id('REF'),
        studentId:
          currentStudentId(req),
        subject:
          b.subject,
        topic:
          b.topic,
        chapterId:
          b.chapterId || null,
        learned:
          b.learned,
        level:
          b.level ||
          'Mulai Memahami',
        reason:
          b.reason || '',
        nextAction:
          b.nextAction || '',
        evidence:
          b.evidence || '',
        date:
          today()
      };

      await exec(
        `
        INSERT INTO reflections
        (
          id,
          studentId,
          subject,
          topic,
          chapterId,
          learned,
          level,
          reason,
          nextAction,
          evidence,
          date
        )
        VALUES
        (?,?,?,?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/reflections/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM reflections
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Refleksi tidak ditemukan.'
        });
      }

      const n = {
        subject:
          b.subject || x.subject,
        topic:
          b.topic || x.topic,
        chapterId:
          b.chapterId ??
          x.chapterId,
        learned:
          b.learned ||
          x.learned,
        level:
          b.level ||
          x.level,
        reason:
          b.reason ??
          x.reason,
        nextAction:
          b.nextAction ??
          x.nextAction,
        evidence:
          b.evidence ??
          x.evidence
      };

      await exec(
        `
        UPDATE reflections
        SET
          subject=?,
          topic=?,
          chapterId=?,
          learned=?,
          level=?,
          reason=?,
          nextAction=?,
          evidence=?
        WHERE id=?
        `,
        [
          n.subject,
          n.topic,
          n.chapterId,
          n.learned,
          n.level,
          n.reason,
          n.nextAction,
          n.evidence,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/reflections/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM reflections
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Refleksi tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   GOALS
   ===================================================== */

app.get(
  '/api/goals',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'goals',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/goals',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (!b.title) {
        return res.status(400).json({
          message:
            'Judul goal wajib diisi.'
        });
      }

      const x = {
        id: id('GOAL'),
        studentId:
          currentStudentId(req),
        title:
          b.title,
        description:
          b.description || '',
        category:
          b.category || 'Belajar',
        grade:
          Number(b.grade) || 10,
        targetDate:
          b.targetDate || null,
        progress:
          Math.min(
            100,
            Math.max(
              0,
              Number(
                b.progress
              ) || 0
            )
          ),
        status:
          b.status ||
          'Berjalan'
      };

      await exec(
        `
        INSERT INTO goals
        (
          id,
          studentId,
          title,
          description,
          category,
          grade,
          targetDate,
          progress,
          status
        )
        VALUES
        (?,?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/goals/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM goals
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Goal tidak ditemukan.'
        });
      }

      const n = {
        title:
          b.title ||
          x.title,
        description:
          b.description ??
          x.description,
        category:
          b.category ||
          x.category,
        targetDate:
          b.targetDate ||
          x.targetDate,
        progress:
          Math.min(
            100,
            Math.max(
              0,
              Number(
                b.progress ??
                x.progress
              )
            )
          ),
        status:
          b.status ||
          x.status
      };

      await exec(
        `
        UPDATE goals
        SET
          title=?,
          description=?,
          category=?,
          targetDate=?,
          progress=?,
          status=?
        WHERE id=?
        `,
        [
          n.title,
          n.description,
          n.category,
          n.targetDate || null,
          n.progress,
          n.status,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/goals/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM goals
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Goal tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   ASSESSMENTS / FEEDBACK
   ===================================================== */

app.get(
  '/api/assessments',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'assessments',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.get(
  '/api/feedback',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'feedback',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   FUTURE PATH
   ===================================================== */

app.get(
  '/api/future',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'futurePlans',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/future',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (!b.target) {
        return res.status(400).json({
          message:
            'Target wajib diisi.'
        });
      }

      const x = {
        id: id('FUT'),
        studentId:
          currentStudentId(req),
        type:
          b.type ||
          'Karier',
        target:
          b.target,
        detail:
          b.detail || '',
        year:
          b.year || '',
        status:
          b.status ||
          'Eksplorasi',
        notes:
          b.notes || ''
      };

      await exec(
        `
        INSERT INTO futurePlans
        (
          id,
          studentId,
          type,
          target,
          detail,
          year,
          status,
          notes
        )
        VALUES
        (?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/future/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM futurePlans
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Rencana tidak ditemukan.'
        });
      }

      const n = {
        type:
          b.type ||
          x.type,
        target:
          b.target ||
          x.target,
        detail:
          b.detail ??
          x.detail,
        year:
          b.year ||
          x.year,
        status:
          b.status ||
          x.status,
        notes:
          b.notes ??
          x.notes
      };

      await exec(
        `
        UPDATE futurePlans
        SET
          type=?,
          target=?,
          detail=?,
          year=?,
          status=?,
          notes=?
        WHERE id=?
        `,
        [
          n.type,
          n.target,
          n.detail,
          n.year,
          n.status,
          n.notes,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/future/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM futurePlans
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Rencana tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   ACHIEVEMENTS
   ===================================================== */

app.get(
  '/api/achievements',
  requireLogin,
  async (_, res, next) => {

    try {
      res.json(
        await allStudents(
          'achievements'
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   PORTFOLIO
   ===================================================== */

app.get(
  '/api/portfolio',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'portfolio',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/portfolio',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (!b.title) {
        return res.status(400).json({
          message:
            'Judul karya wajib diisi.'
        });
      }

      const x = {
        id: id('POR'),
        studentId:
          currentStudentId(req),
        title:
          b.title,
        category:
          b.category ||
          'Proyek',
        description:
          b.description || '',
        link:
          b.link || '',
        file:
          b.file || '',
        date:
          today(),
        status:
          b.status ||
          'Draft'
      };

      await exec(
        `
        INSERT INTO portfolio
        (
          id,
          studentId,
          title,
          category,
          description,
          link,
          file,
          date,
          status
        )
        VALUES
        (?,?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/portfolio/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM portfolio
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Portfolio tidak ditemukan.'
        });
      }

      const n = {
        title:
          b.title ||
          x.title,
        category:
          b.category ||
          x.category,
        description:
          b.description ??
          x.description,
        link:
          b.link ??
          x.link,
        status:
          b.status ||
          x.status,
        file:
          b.file ??
          x.file
      };

      await exec(
        `
        UPDATE portfolio
        SET
          title=?,
          category=?,
          description=?,
          link=?,
          file=?,
          status=?
        WHERE id=?
        `,
        [
          n.title,
          n.category,
          n.description,
          n.link,
          n.file,
          n.status,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/portfolio/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM portfolio
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Portfolio tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/portfolio/upload',
  requireRole('student'),
  upload.single('file'),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({
        message:
          'File belum dipilih.'
      });
    }

    res.json({
      ok: true,
      file:
        `/uploads/${req.file.filename}`,
      name:
        req.file.originalname,
      size:
        req.file.size
    });
  }
);

/* =====================================================
   TKA
   ===================================================== */

app.get(
  '/api/tka',
  requireLogin,
  async (req, res, next) => {

    try {
      res.json(
        await all(
          'tka',
          req
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/tka',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x = {
        id: id('TKA'),
        studentId:
          currentStudentId(req),
        title:
          b.title ||
          'Target TKA',
        subject:
          b.subject ||
          'Umum',
        date:
          b.date ||
          null,
        score:
          Number(
            b.score
          ) || 0,
        status:
          b.status ||
          'Belum',
        notes:
          b.notes || ''
      };

      await exec(
        `
        INSERT INTO tka
        (
          id,
          studentId,
          title,
          subject,
          date,
          score,
          status,
          notes
        )
        VALUES
        (?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/tka/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM tka
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Data TKA tidak ditemukan.'
        });
      }

      const n = {
        title:
          b.title ||
          x.title,
        subject:
          b.subject ||
          x.subject,
        date:
          b.date ||
          x.date,
        score:
          Number(
            b.score ??
            x.score
          ),
        status:
          b.status ||
          x.status,
        notes:
          b.notes ??
          x.notes
      };

      await exec(
        `
        UPDATE tka
        SET
          title=?,
          subject=?,
          date=?,
          score=?,
          status=?,
          notes=?
        WHERE id=?
        `,
        [
          n.title,
          n.subject,
          n.date || null,
          n.score,
          n.status,
          n.notes,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/tka/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM tka
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Data TKA tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   UNIVERSITY / CAREER PREPARATION
   ===================================================== */

app.get(
  '/api/preparation',
  requireLogin,
  async (req, res, next) => {

    try {

      res.json({
  university:
    await all(
      'universityplans',
      req
    ),
  career:
    await all(
      'careerplans',
      req
    )
});

    } catch (e) {
      next(e);
    }
  }
);

app.post(
  '/api/preparation/:type',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const table =
        req.params.type ===
        'university'
          ? 'universityplans'
          : 'careerplans';

      const prefix =
        table ===
        'universityplans'
          ? 'UNI'
          : 'CAR';

      const b =
        req.body || {};

      const x = {
        id:
          id(prefix),
        studentId:
          currentStudentId(req),
        title:
          b.title ||
          'Rencana',
        institution:
          b.institution || '',
        targetYear:
          b.targetYear || '',
        status:
          b.status ||
          'Eksplorasi',
        notes:
          b.notes || '',
        progress:
          Number(
            b.progress
          ) || 0
      };

      await exec(
        `
        INSERT INTO ${table}
        (
          id,
          studentId,
          title,
          institution,
          targetYear,
          status,
          notes,
          progress
        )
        VALUES
        (?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

app.put(
  '/api/preparation/:type/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const table =
        req.params.type ===
        'university'
          ? 'universityplans'
          : 'careerplans';

      const b =
        req.body || {};

      const x =
        await one(
          `
          SELECT *
          FROM ${table}
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!x) {
        return res.status(404).json({
          message:
            'Rencana tidak ditemukan.'
        });
      }

      const n = {
        title:
          b.title ||
          x.title,
        institution:
          b.institution ??
          x.institution,
        targetYear:
          b.targetYear ??
          x.targetYear,
        status:
          b.status ||
          x.status,
        notes:
          b.notes ??
          x.notes,
        progress:
          Number(
            b.progress ??
            x.progress
          )
      };

      await exec(
        `
        UPDATE ${table}
        SET
          title=?,
          institution=?,
          targetYear=?,
          status=?,
          notes=?,
          progress=?
        WHERE id=?
        `,
        [
          n.title,
          n.institution,
          n.targetYear,
          n.status,
          n.notes,
          n.progress,
          x.id
        ]
      );

      res.json({
        ...x,
        ...n
      });

    } catch (e) {
      next(e);
    }
  }
);

app.delete(
  '/api/preparation/:type/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const table =
        req.params.type ===
        'university'
          ? 'universityplans'
          : 'careerplans';

      const r =
        await exec(
          `
          DELETE FROM ${table}
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );

      if (!r.affectedRows) {
        return res.status(404).json({
          message:
            'Rencana tidak ditemukan.'
        });
      }

      res.json({
        ok: true
      });

    } catch (e) {
      next(e);
    }
  }
);
/* =====================================================
   SCHOOL ARCHIVE
   ===================================================== */

app.get(
  '/api/archive',
  requireLogin,
  async (req, res, next) => {

    try {

      res.json(
        await all(
          'archive',
          req
        )
      );

    } catch (e) {

      next(e);

    }

  }
);


app.post(
  '/api/archive',
  requireRole('student'),
  upload.single('file'),
  async (req, res, next) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          message:
            'File wajib dipilih.'
        });

      }

      const b =
        req.body || {};

      if (!b.title?.trim()) {

        return res.status(400).json({
          message:
            'Judul arsip wajib diisi.'
        });

      }

      if (!b.description?.trim()) {

        return res.status(400).json({
          message:
            'Deskripsi wajib diisi.'
        });

      }

      const filePath =
        `/uploads/${req.file.filename}`;

      const x = {

        id:
          id('ARC'),

        studentId:
          currentStudentId(req),

        title:
          b.title.trim(),

        category:
          b.category ||
          'Tugas',

        grade:
          b.grade ||
          10,

        description:
          b.description.trim(),

        link:
          filePath,

        date:
          today()

      };


      await exec(
        `
        INSERT INTO archive
        (
          id,
          studentId,
          title,
          category,
          grade,
          description,
          link,
          date
        )
        VALUES
        (?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );


      res.json({

        ...x,

        file:
          filePath,

        name:
          req.file.originalname,

        size:
          req.file.size

      });

    } catch (e) {

      next(e);

    }

  }
);


app.put(
  '/api/archive/:id',
  requireRole('student'),
  upload.single('file'),
  async (req, res, next) => {

    try {

      const existing =
        await one(
          `
          SELECT *
          FROM archive
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );


      if (!existing) {

        return res.status(404).json({
          message:
            'Arsip tidak ditemukan.'
        });

      }


      const b =
        req.body || {};


      if (!b.title?.trim()) {

        return res.status(400).json({
          message:
            'Judul arsip wajib diisi.'
        });

      }


      if (!b.description?.trim()) {

        return res.status(400).json({
          message:
            'Deskripsi wajib diisi.'
        });

      }


      /*
      |--------------------------------------------------------------------------
      | Jika user memilih file baru
      |--------------------------------------------------------------------------
      */

      const filePath =
        req.file
          ? `/uploads/${req.file.filename}`
          : existing.link;


      const title =
        b.title.trim();

      const category =
        b.category ||
        existing.category ||
        'Tugas';

      const grade =
        b.grade ||
        existing.grade ||
        10;

      const description =
        b.description.trim();


      await exec(
        `
        UPDATE archive
        SET
          title=?,
          category=?,
          grade=?,
          description=?,
          link=?
        WHERE id=?
        AND studentId=?
        `,
        [
          title,
          category,
          grade,
          description,
          filePath,
          req.params.id,
          currentStudentId(req)
        ]
      );


      res.json({

        id:
          req.params.id,

        studentId:
          existing.studentId,

        title,

        category,

        grade,

        description,

        link:
          filePath,

        file:
          filePath,

        date:
          existing.date,

        name:
          req.file
            ? req.file.originalname
            : null,

        size:
          req.file
            ? req.file.size
            : null

      });

    } catch (e) {

      next(e);

    }

  }
);


app.delete(
  '/api/archive/:id',
  requireRole('student'),
  async (req, res, next) => {

    try {

      const r =
        await exec(
          `
          DELETE FROM archive
          WHERE id=?
          AND studentId=?
          `,
          [
            req.params.id,
            currentStudentId(req)
          ]
        );


      if (!r.affectedRows) {

        return res.status(404).json({
          message:
            'Arsip tidak ditemukan.'
        });

      }


      res.json({
        ok: true
      });

    } catch (e) {

      next(e);

    }

  }
);

/* =====================================================
   TEACHER STUDENT DETAIL
   ===================================================== */

app.get(
  '/api/student/:id',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const student =
        await one(
          `
          SELECT *
          FROM students
          WHERE id=?
          AND classId=?
          `,
          [
            req.params.id,
            currentClassId(req)
          ]
        );

      if (!student) {
        return res.status(404).json({
          message:
            'Siswa tidak ditemukan atau bukan bagian dari kelas yang Anda pantau.'
        });
      }

      const [
        reflections,
        goals,
        portfolio,
        feedback,
        competencies
      ] =
        await Promise.all([
          query(
            `
            SELECT *
            FROM reflections
            WHERE studentId=?
            ORDER BY id DESC
            `,
            [req.params.id]
          ),

          query(
            `
            SELECT *
            FROM goals
            WHERE studentId=?
            ORDER BY id DESC
            `,
            [req.params.id]
          ),

          query(
            `
            SELECT *
            FROM portfolio
            WHERE studentId=?
            ORDER BY id DESC
            `,
            [req.params.id]
          ),

          query(
            `
            SELECT *
            FROM feedback
            WHERE studentId=?
            ORDER BY id DESC
            `,
            [req.params.id]
          ),

          allStudents(
            'competencies'
          )
        ]);

      res.json({
        student,
        reflections,
        goals,
        portfolio,
        competencies,
        feedback
      });

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   TEACHER FEEDBACK
   ===================================================== */

app.post(
  '/api/feedback',
  requireRole('teacher'),
  async (req, res, next) => {

    try {

      const b =
        req.body || {};

      if (
        !b.studentId ||
        !b.comment
      ) {
        return res.status(400).json({
          message:
            'Siswa dan feedback wajib diisi.'
        });
      }

      const allowed =
        await one(
          `
          SELECT id
          FROM students
          WHERE id=?
          AND classId=?
          `,
          [
            b.studentId,
            currentClassId(req)
          ]
        );

      if (!allowed) {
        return res.status(403).json({
          message:
            'Guru hanya dapat memberi feedback kepada siswa di kelas yang dipantau.'
        });
      }

      const x = {
        id:
          id('FDB'),
        reflectionId:
          b.reflectionId || '',
        studentId:
          b.studentId,
        teacherId:
          req.session.user.teacherId,
        teacher:
          req.session.user.name,
        comment:
          b.comment,
        recommendation:
          b.recommendation || '',
        date:
          today()
      };

      await exec(
        `
        INSERT INTO feedback
        (
          id,
          reflectionId,
          studentId,
          teacherId,
          teacher,
          comment,
          recommendation,
          date
        )
        VALUES
        (?,?,?,?,?,?,?,?)
        `,
        Object.values(x)
      );

      res.json(x);

    } catch (e) {
      next(e);
    }
  }
);

/* =====================================================
   FRONTEND
   ===================================================== */

app.get(
  '*',
  (req, res) =>
    res.sendFile(
      path.join(
        ROOT,
        'public',
        'index.html'
      )
    )
);

/* =====================================================
   ERROR HANDLER
   ===================================================== */

app.use(
  (err, req, res, next) => {

    console.error(err);

    if (res.headersSent) {
      return next(err);
    }

console.error('SERVER ERROR:', err);

res.status(500).json({
  message:
    'Terjadi kesalahan server.',
  detail:
    process.env.NODE_ENV ===
    'development'
      ? err.message
      : undefined
});
  }
);

/* =====================================================
   START SERVER
   ===================================================== */

(async () => {

  try {

    await test();

    console.log(
      `MySQL terhubung. Learning Journey: http://localhost:${PORT}`
    );

    app.listen(
      PORT,
      '0.0.0.0'
    );

  } catch (e) {

    console.error(
      '\nMySQL belum terhubung. Pastikan MySQL XAMPP sudah START dan database sudah dibuat.'
    );

    console.error(
      e.message
    );

    process.exit(1);
  }

})();