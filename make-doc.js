const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber
} = require('docx');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────────────────────
const RTL = true;

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    bidirectional: RTL,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 36, font: 'Arial', color: '1A3C6E' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    bidirectional: RTL,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: '0077B8' })]
  });
}

function body(text, { bold = false, color = '333333' } = {}) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, bold, size: 24, font: 'Arial', color })]
  });
}

function cmd(label, code) {
  // label (Arabic) on right, then code in a styled box look
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: label + '  ', size: 24, font: 'Arial', color: '333333' }),
      new TextRun({ text: code, bold: true, size: 24, font: 'Courier New', color: '0A5C9A',
                    highlight: 'lightGray' })
    ]
  });
}

function bullet(text, { bold = false } = {}) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 50, after: 50 },
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, bold, size: 24, font: 'Arial', color: '333333' })]
  });
}

function numbered(text, { bold = false } = {}) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 50, after: 50 },
    numbering: { reference: 'numbers', level: 0 },
    children: [new TextRun({ text, bold, size: 24, font: 'Arial', color: '333333' })]
  });
}

function note(text) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: '⚠️  ', size: 24, font: 'Arial' }),
      new TextRun({ text, bold: true, size: 24, font: 'Arial', color: 'C0392B' })
    ]
  });
}

function tip(text) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: '✅  ', size: 24, font: 'Arial' }),
      new TextRun({ text, size: 24, font: 'Arial', color: '27AE60' })
    ]
  });
}

function gap(size = 120) {
  return new Paragraph({ spacing: { before: size, after: 0 }, children: [new TextRun('')] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '0077B8', space: 1 } },
    children: [new TextRun('')]
  });
}

// ── folder-structure table ────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function structTable() {
  const rows = [
    ['server/',      'الـ backend — Node.js + Express + قاعدة البيانات'],
    ['assets/',      'CSS, JavaScript, الصور'],
    ['html/',        'كل صفحات الموقع (HTML)'],
    ['taskhunt.db',  'ملف قاعدة البيانات SQLite (بيتعمل تلقائياً)'],
  ];

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2400, 6600],
    rows: rows.map(([folder, desc], i) =>
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 2400, type: WidthType.DXA },
            shading: i % 2 === 0
              ? { fill: 'E8F4FB', type: ShadingType.CLEAR }
              : { fill: 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: folder, bold: true, font: 'Courier New', size: 22, color: '0A5C9A' })]
            })]
          }),
          new TableCell({
            borders,
            width: { size: 6600, type: WidthType.DXA },
            shading: i % 2 === 0
              ? { fill: 'E8F4FB', type: ShadingType.CLEAR }
              : { fill: 'FFFFFF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              bidirectional: RTL,
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: desc, font: 'Arial', size: 22, color: '333333' })]
            })]
          })
        ]
      })
    )
  });
}

// ── document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 440, hanging: 280 } } }
        }]
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 440, hanging: 280 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 24, color: '333333' } }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },   // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          bidirectional: RTL,
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '0077B8', space: 1 } },
          children: [new TextRun({ text: 'دليل تشغيل مشروع TaskHunt', font: 'Arial', size: 20, color: '0077B8' })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'صفحة ', font: 'Arial', size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
            new TextRun({ text: ' من ', font: 'Arial', size: 18, color: '888888' }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: '888888' }),
          ]
        })]
      })
    },
    children: [

      // ══ TITLE ══
      new Paragraph({
        bidirectional: RTL,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: 'دليل تشغيل مشروع', bold: true, size: 52, font: 'Arial', color: '1A3C6E' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'TaskHunt', bold: true, size: 64, font: 'Arial', color: '0077B8' })]
      }),
      new Paragraph({
        bidirectional: RTL,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: 'منصة الفريلانس الخاصة بينا', size: 24, font: 'Arial', color: '888888', italics: true })]
      }),

      divider(),

      // ══ INTRO ══
      h2('عن المشروع'),
      body('TaskHunt هي منصة فريلانس متكاملة بتربط العملاء (Clients) بالفريلانسرز. العملاء بينشروا مشاريع، والفريلانسرز بيقدموا عليها. المنصة مبنية على Node.js + Express في الـ backend و SQLite كقاعدة بيانات، والـ frontend عبارة عن HTML/CSS/JS عادي.'),
      gap(80),

      divider(),

      // ══ REQUIREMENTS ══
      h2('المتطلبات المطلوبة'),
      body('الأدوات دي لازم تكون متثبتة عندك قبل ما تشتغل على المشروع:'),
      gap(60),
      bullet('Node.js  ✅  (مثبت)'),
      bullet('DB Browser for SQLite  ✅  (مثبت)'),
      bullet('متصفح إنترنت (Chrome / Edge / Firefox)'),
      bullet('VS Code أو أي محرر كود (اختياري)'),
      gap(80),

      divider(),

      // ══ STEPS ══
      h2('خطوات تشغيل المشروع'),
      gap(60),

      // Step 1
      body('الخطوة 1 — افتح الـ Folder', { bold: true }),
      body('افتح الـ folder الخاص بالمشروع في VS Code أو أي محرر كود، أو افتح Terminal/PowerShell مباشرة.'),
      gap(60),

      // Step 2
      body('الخطوة 2 — افتح الـ Terminal', { bold: true }),
      body('في VS Code: اضغط  Ctrl + `  (backtick) — هيفتح terminal جوه البرنامج.'),
      body('أو افتح Command Prompt/PowerShell بشكل منفصل.'),
      gap(60),

      // Step 3
      body('الخطوة 3 — روّح لجوه الـ Folder', { bold: true }),
      body('تأكد إن الـ terminal شايل المسار الصح. اكتب الأمر ده وغير الـ path للمسار الحقيقي عندك:'),
      cmd('الأمر:', 'cd C:\\Users\\YourName\\Downloads\\taskhunt-project'),
      gap(60),

      // Step 4
      body('الخطوة 4 — ثبّت الـ Packages (مرة واحدة بس)', { bold: true }),
      body('أول مرة بس، لازم تثبت مكتبات Node.js المطلوبة:'),
      cmd('الأمر:', 'npm install'),
      body('انتظر لحد ما يخلص — هيتعمل folder اسمه  node_modules  جوه الـ folder.'),
      gap(60),

      // Step 5
      body('الخطوة 5 — شغّل السيرفر', { bold: true }),
      body('ده الأمر الأساسي اللي هتشغله كل ما تفتح المشروع:'),
      cmd('الأمر:', 'node server/server.js'),
      tip('لو ظهر: "TaskHunt server running at http://localhost:3000" — يبقى تمام، السيرفر شغال!'),
      gap(60),

      // Step 6
      body('الخطوة 6 — افتح الموقع في المتصفح', { bold: true }),
      body('افتح المتصفح واكتب في شريط العنوان:'),
      cmd('الرابط:', 'http://localhost:3000'),
      body('هيفتح معاك الـ Home Page بتاعة TaskHunt.'),
      gap(80),

      divider(),

      // ══ DATABASE ══
      h2('قاعدة البيانات'),
      gap(60),
      bullet('الـ database بتتعمل تلقائياً أول ما تشغل السيرفر — مش محتاج تعمل حاجة.'),
      bullet('اسم الملف: taskhunt.db — هتلاقيه في الـ folder الرئيسي للمشروع.'),
      bullet('الـ database بتتملى تلقائياً ببيانات تجريبية (فريلانسرز + مشاريع) من أول تشغيل.'),
      gap(80),
      body('إزاي تفتح قاعدة البيانات في DB Browser:', { bold: true }),
      numbered('افتح برنامج DB Browser for SQLite'),
      numbered('اضغط: File → Open Database'),
      numbered('روّح لـ folder المشروع واختار ملف: taskhunt.db'),
      numbered('هتشوف كل الجداول (users, posts, freelancers, proposals)'),
      gap(80),
      note('مهم جداً: لازم تقفل DB Browser قبل ما تشغل السيرفر أو وهو شغال.'),
      body('لو DB Browser فاتح والسيرفر شغال في نفس الوقت — الـ database هتتقفل وهيظهر error وماينفعش تشتغل.'),
      gap(80),

      divider(),

      // ══ IMPORTANT NOTES ══
      h2('ملاحظات مهمة'),
      gap(60),
      note('لا تفتح الـ HTML files بـ double-click — مش هيشتغل صح.'),
      body('لازم تفتح الصفحات دايماً عبر المتصفح من الرابط:  http://localhost:3000'),
      gap(60),
      note('لو السيرفر مش شغال والصفحات بتفتح فاضية أو بتطلع error:'),
      numbered('تأكد إن DB Browser مقفول تماماً'),
      numbered('ارجع للـ terminal وشغل:  node server/server.js'),
      numbered('لو ظهر error تاني، اعمل restart للـ terminal وجرب تاني'),
      gap(60),
      tip('السيرفر بيشتغل على Port 3000 — لو عايز تغيره، عدّل الرقم في آخر ملف server/server.js'),
      gap(60),
      tip('مش محتاج تشغل npm install غير مرة واحدة بس (أول مرة). بعدين كل اللي محتاجه: node server/server.js'),
      gap(80),

      divider(),

      // ══ STRUCTURE ══
      h2('هيكل المشروع'),
      body('الملفات والـ folders المهمة:'),
      gap(80),
      structTable(),
      gap(120),
      divider(),

      // ══ CLOSING ══
      new Paragraph({
        bidirectional: RTL,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: 'بالتوفيق! 🚀', bold: true, size: 28, font: 'Arial', color: '0077B8' })]
      }),
      new Paragraph({
        bidirectional: RTL,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: 'لو عندك أي مشكلة، راجع قسم الملاحظات المهمة أو تواصل مع أصحاب المشروع.', size: 20, font: 'Arial', color: '888888', italics: true })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('C:\\Users\\Sc\\Downloads\\taskhunt-project\\دليل تشغيل TaskHunt.docx', buf);
  console.log('✅ Document created successfully!');
}).catch(err => {
  console.error('❌ Error:', err.message);
});
