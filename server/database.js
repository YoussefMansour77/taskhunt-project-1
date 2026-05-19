const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'taskhunt.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    role      TEXT    NOT NULL CHECK(role IN ('client','freelancer')),
    avatar    TEXT    DEFAULT NULL,
    bio       TEXT    DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    budget      REAL    DEFAULT 0,
    category    TEXT    DEFAULT 'General',
    status      TEXT    DEFAULT 'open' CHECK(status IN ('open','closed')),
    user_id     INTEGER NOT NULL REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL REFERENCES posts(id),
    user_id     INTEGER NOT NULL REFERENCES users(id),
    message     TEXT    NOT NULL,
    price       REAL    NOT NULL,
    status      TEXT    DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS freelancers (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    role_text        TEXT    NOT NULL,
    category         TEXT    NOT NULL,
    sub_category     TEXT    NOT NULL,
    hourly_rate      INTEGER NOT NULL,
    experience_years INTEGER NOT NULL,
    rating           REAL    NOT NULL DEFAULT 4.5,
    skills           TEXT    NOT NULL DEFAULT '',
    image_url        TEXT    DEFAULT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    type       TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    ref_id     INTEGER,
    ref_type   TEXT,
    is_read    INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id        INTEGER NOT NULL REFERENCES posts(id),
    client_id      INTEGER NOT NULL REFERENCES users(id),
    freelancer_id  INTEGER NOT NULL REFERENCES users(id),
    proposal_id    INTEGER NOT NULL REFERENCES proposals(id),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id       INTEGER NOT NULL REFERENCES conversations(id),
    sender_id             INTEGER NOT NULL REFERENCES users(id),
    body                  TEXT    NOT NULL,
    is_read_by_recipient  INTEGER DEFAULT 0,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL UNIQUE REFERENCES users(id),
    display_name      TEXT,
    avatar            TEXT,
    title             TEXT,
    bio               TEXT,
    skills            TEXT    DEFAULT '[]',
    category          TEXT,
    sub_category      TEXT,
    experience_level  TEXT    CHECK(experience_level IN ('beginner','intermediate','expert')),
    hourly_rate       REAL,
    portfolio_url     TEXT,
    github_url        TEXT,
    linkedin_url      TEXT,
    phone             TEXT,
    city              TEXT,
    country           TEXT,
    languages         TEXT    DEFAULT '[]',
    education         TEXT,
    profile_complete  INTEGER DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_profiles (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL UNIQUE REFERENCES users(id),
    display_name     TEXT,
    avatar           TEXT,
    description      TEXT,
    profile_complete INTEGER DEFAULT 0,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Reviews table (safe migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_id   INTEGER NOT NULL REFERENCES users(id),
    client_id       INTEGER NOT NULL REFERENCES users(id),
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id)
  );
`);

// Seeded freelancers removed — only registered users appear in Hire Talent
if (false && db.prepare('SELECT COUNT(*) as n FROM freelancers').get().n === 0) {
  const ins = db.prepare('INSERT INTO freelancers (name,role_text,category,sub_category,hourly_rate,experience_years,rating,skills,image_url) VALUES (?,?,?,?,?,?,?,?,?)');
  const seed = db.transaction(rows => { for (const r of rows) ins.run(...r); });
  seed([
    // ── Data & AI ──────────────────────────────────────────────────────────
    ['Ahmed Samir','Data Analyst – dashboards & reports','Data & AI','Data Analysis & Visualization',25,5,4.8,'Excel,Power BI,SQL','/assets/images/userimages/men/1.jfif'],
    ['Mona Hassan','Data Visualization Expert with Tableau','Data & AI','Data Analysis & Visualization',28,7,4.7,'Tableau,Python,Pandas','/assets/images/userimages/women/1.jfif'],
    ['Omar Khaled','Business Data Analyst & Reporting Specialist','Data & AI','Data Analysis & Visualization',30,2,4.9,'SQL,Excel,Power BI','/assets/images/userimages/men/2.jfif'],
    ['Sara Ali','Machine Learning Engineer – predictive models','Data & AI','Machine Learning Models',40,6,4.8,'Python,Scikit-learn,TensorFlow','/assets/images/userimages/women/2.jfif'],
    ['Youssef Nabil','ML Engineer focused on NLP systems','Data & AI','Machine Learning Models',38,4,4.7,'NLP,Python,PyTorch','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','AI Model Developer & Data Scientist','Data & AI','Machine Learning Models',42,3,4.9,'Deep Learning,Python,Keras','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','Deep Learning Engineer (CNN & RNN specialist)','Data & AI','Deep Learning',45,2,4.9,'TensorFlow,PyTorch,AI','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','Computer Vision & Deep Learning Expert','Data & AI','Deep Learning',50,5,4.8,'OpenCV,CNN,Python','/assets/images/userimages/men/14.jfif'],
    ['Nour Adel','AI Researcher in Deep Neural Networks','Data & AI','Deep Learning',48,5,4.9,'PyTorch,Research,AI','/assets/images/userimages/men/14.jfif'],
    ['Khaled Mahmoud','Data Engineer – ETL & Pipelines','Data & AI','Data Engineering',32,4,4.7,'Python,SQL,AWS','/assets/images/userimages/men/3.jfif'],
    ['Omar Saeed','Big Data Engineer','Data & AI','Data Engineering',28,5,4.6,'Hadoop,Spark,ETL','/assets/images/userimages/men/4.jfif'],
    ['Sara Adel','Cloud Data Engineer','Data & AI','Data Engineering',30,3,4.8,'Azure,AWS,SQL','/assets/images/userimages/women/3.jfif'],
    ['Nourhan Ali','Forecasting Specialist','Data & AI','Predictive Analytics',35,5,4.8,'Python,Forecasting,Stats','/assets/images/userimages/women/4.jfif'],
    ['Ahmed Tarek','Business Forecast Analyst','Data & AI','Predictive Analytics',33,6,4.7,'Excel,Power BI,SQL','/assets/images/userimages/men/5.jfif'],
    ['Mona Ibrahim','Predictive Analytics Expert','Data & AI','Predictive Analytics',37,2,4.9,'Python,R,ML','/assets/images/userimages/women/5.jfif'],
    ['Karim Mostafa','Generative AI Developer','Data & AI','Generative AI',55,4,4.9,'GPT-4,LangChain,Stable Diffusion','/assets/images/userimages/men/6.jfif'],
    ['Dina Ahmed','AI Content Creator with Midjourney & DALL-E','Data & AI','Generative AI',45,3,4.8,'Midjourney,DALL-E,ChatGPT','/assets/images/userimages/women/6.jfif'],
    ['Yasser Salem','Generative AI Researcher','Data & AI','Generative AI',50,5,4.9,'LLMs,Prompt Engineering,Python','/assets/images/userimages/men/7.jfif'],
    // ── Development & IT ──────────────────────────────────────────────────
    ['Mohamed Fathy','Senior Full Stack Developer (React & Node.js)','Development & IT','Full Stack Engineers',40,6,4.9,'React,Node.js,MongoDB','/assets/images/userimages/men/1.jfif'],
    ['Sara Yasser','Full Stack Engineer (Vue.js & Laravel)','Development & IT','Full Stack Engineers',38,5,4.8,'Vue.js,Laravel,MySQL','/assets/images/userimages/women/1.jfif'],
    ['Rania Adel','Full Stack Developer (Next.js & GraphQL)','Development & IT','Full Stack Engineers',42,4,4.7,'Next.js,GraphQL,TypeScript','/assets/images/userimages/women/7.jfif'],
    ['Ahmed Gamal','Backend Developer (Django & REST APIs)','Development & IT','Backend Developers',35,4,4.7,'Django,REST API,PostgreSQL','/assets/images/userimages/men/2.jfif'],
    ['Mona Tarek','Backend Engineer (Spring Boot & Microservices)','Development & IT','Backend Developers',37,5,4.8,'Spring Boot,Java,Microservices','/assets/images/userimages/women/2.jfif'],
    ['Khalid Adel','Node.js Backend Developer','Development & IT','Backend Developers',33,3,4.7,'Node.js,Express,MongoDB','/assets/images/userimages/men/8.jfif'],
    ['Youssef Adel','DevOps Engineer (AWS & Docker)','Development & IT','DevOps Engineers',42,6,4.9,'AWS,Docker,Kubernetes','/assets/images/userimages/men/3.jfif'],
    ['Omar Saeed','DevOps Specialist (CI/CD & Cloud)','Development & IT','DevOps Engineers',39,5,4.8,'CI/CD,Azure,Linux','/assets/images/userimages/men/4.jfif'],
    ['Hassan Reda','Android Developer (Kotlin & Java)','Development & IT','Android Developers',34,4,4.7,'Kotlin,Java,Android Studio','/assets/images/userimages/men/5.jfif'],
    ['Nourhan Ali','Android App Developer (Flutter & Dart)','Development & IT','Android Developers',36,5,4.8,'Flutter,Dart,Firebase','/assets/images/userimages/women/3.jfif'],
    ['Mostafa Nasser','Cyber Security Engineer (Penetration Testing)','Development & IT','Cyber Security Engineers',45,6,4.9,'Penetration Testing,Network Security,Linux','/assets/images/userimages/men/6.jfif'],
    ['Sara Khaled','Cyber Security Specialist (SOC & SIEM)','Development & IT','Cyber Security Engineers',43,5,4.8,'SOC,SIEM,Incident Response','/assets/images/userimages/women/6.jfif'],
    // ── Design & Creative ─────────────────────────────────────────────────
    ['Olivia M.','Creates unique brand identities and logos','Design & Creative','Brand & Logo Designers',18,9,4.9,'Adobe Illustrator,Vector Art,Typography','/assets/images/userimages/women/4.jfif'],
    ['Marcus T.','Builds strong visual branding concepts','Design & Creative','Brand & Logo Designers',22,7,4.8,'Adobe Illustrator,Vector Art,Typography','/assets/images/userimages/men/13.jfif'],
    ['Sofia R.','Brand & Logo Designer creating compelling visual identities','Design & Creative','Brand & Logo Designers',30,2,4.9,'Adobe Illustrator,Vector Art,Typography','/assets/images/userimages/women/3.jfif'],
    ['Hannah B.','Designs visuals for print and digital media','Design & Creative','Graphic Designers',40,6,4.8,'Adobe Photoshop,Banner Design,Social Media Design','/assets/images/userimages/women/2.jfif'],
    ['Victor N.','Improves usability through smart design','Design & Creative','Graphic Designers',38,4,4.7,'Adobe Photoshop,Banner Design,Social Media Design','/assets/images/userimages/men/10.jfif'],
    ['Yuki T.','Designs visuals for print and digital media','Design & Creative','Graphic Designers',42,3,4.9,'Adobe Photoshop,Banner Design,Social Media Design','/assets/images/userimages/men/18.jfif'],
    ['Roman O.','Builds smooth and user-friendly experiences','Design & Creative','UX Designers',45,2,4.9,'User Research,Wireframing,Figma','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','Designs intuitive digital product interfaces','Design & Creative','UX Designers',50,5,4.8,'User Research,Wireframing,Figma','/assets/images/userimages/men/14.jfif'],
    ['Nour Adel','UX designer specializing in intuitive user experiences','Design & Creative','UX Designers',48,5,4.9,'User Research,Wireframing,Figma','/assets/images/userimages/women/1.jfif'],
    ['Gabriele T.','Edits engaging short-form reel content','Design & Creative','Instagram Reel Editors',32,4,4.7,'Short-form Editing,Transitions,Audio Sync','/assets/images/userimages/men/3.jfif'],
    ['Zahid A.','Creates trendy Instagram video edits','Design & Creative','Instagram Reel Editors',28,5,4.6,'Short-form Editing,Transitions,Audio Sync','/assets/images/userimages/men/4.jfif'],
    ['Hanane B.','Produces fast-paced social media reels','Design & Creative','Instagram Reel Editors',30,3,4.8,'Short-form Editing,Transitions,Audio Sync','/assets/images/userimages/women/3.jfif'],
    ['Muhammad Z.','Produces polished videos for YouTube channels','Design & Creative','Youtube Video Editors',32,4,4.7,'Adobe Premiere Pro,Thumbnail Design,Motion Graphics','/assets/images/userimages/men/3.jfif'],
    ['Tahir N.','Edits engaging long-form YouTube content','Design & Creative','Youtube Video Editors',28,5,4.6,'Adobe Premiere Pro,Thumbnail Design,Motion Graphics','/assets/images/userimages/men/4.jfif'],
    ['Maya S.','Creates professional channel video edits','Design & Creative','Youtube Video Editors',30,3,4.8,'Adobe Premiere Pro,Thumbnail Design,Motion Graphics','/assets/images/userimages/women/3.jfif'],
    ['Michael T.','Captures professional video content creatively','Design & Creative','Videographers',32,4,4.7,'Camera Operation,Lighting Setup,Color Grading','/assets/images/userimages/men/3.jfif'],
    ['Omar F.','Films cinematic footage for projects','Design & Creative','Videographers',28,5,4.6,'Camera Operation,Lighting Setup,Color Grading','/assets/images/userimages/men/4.jfif'],
    ['Sophie R.','Produces high-quality visual storytelling','Design & Creative','Videographers',30,3,4.8,'Camera Operation,Lighting Setup,Color Grading','/assets/images/userimages/women/3.jfif'],
    ['Ryan H.','Designs modern and responsive websites','Design & Creative','Web Designers',32,4,4.7,'Responsive Design,Figma,HTML/CSS','/assets/images/userimages/men/3.jfif'],
    ['Ruslan K.','Creates clean and engaging web layouts','Design & Creative','Web Designers',28,5,4.6,'Responsive Design,Figma,HTML/CSS','/assets/images/userimages/men/4.jfif'],
    ['Yulia S.','Builds user-friendly website experiences','Design & Creative','Web Designers',30,3,4.8,'Responsive Design,Figma,HTML/CSS','/assets/images/userimages/women/3.jfif'],
    // ── Sales & Marketing ─────────────────────────────────────────────────
    ['Adam K.','Expert in SEO and performance marketing','Sales & Marketing','Digital Marketers',25,3,4.7,'SEO,Google Ads,Analytics','/assets/images/userimages/men/6.jfif'],
    ['Omar N.','Growth marketer focused on ROI','Sales & Marketing','Digital Marketers',28,4,4.8,'SEO,Email Marketing,Analytics','/assets/images/userimages/men/7.jfif'],
    ['Hassan M.','Specialist in PPC campaigns','Sales & Marketing','Digital Marketers',31,5,4.8,'PPC,Google Ads,Analytics','/assets/images/userimages/men/9.jfif'],
    ['Mona H.','Builds high-converting Facebook ad campaigns','Sales & Marketing','Facebook Ads Specialists',30,5,4.9,'Facebook Ads,Funnels,Retargeting','/assets/images/userimages/women/6.jfif'],
    ['Nour A.','Social media ads expert','Sales & Marketing','Facebook Ads Specialists',29,3,4.7,'Facebook Ads,Instagram Ads,Targeting','/assets/images/userimages/women/9.jfif'],
    ['Randa O.','Performance Marketing Specialist','Sales & Marketing','Facebook Ads Specialists',33,4,4.8,'Meta Ads,A/B Testing,Analytics','/assets/images/userimages/women/10.jfif'],
    ['Lina S.','Drives business growth and partnerships','Sales & Marketing','Business Development Managers',35,6,4.8,'Sales Strategy,Lead Generation,CRM','/assets/images/userimages/women/7.jfif'],
    ['Karim F.','Expert in scaling startups','Sales & Marketing','Business Development Managers',34,7,4.9,'Sales,Strategy,Negotiation','/assets/images/userimages/men/10.jfif'],
    ['Mohamed A.','Sales executive for client acquisition','Sales & Marketing','Business Development Managers',27,4,4.7,'Cold Calling,Closing Deals,Negotiation','/assets/images/userimages/men/16.jfif'],
    ['Yousef A.','Builds strong brand identities','Sales & Marketing','Branding Experts',22,2,4.6,'Brand Strategy,Positioning,Identity','/assets/images/userimages/men/8.jfif'],
    ['Dina K.','Creates memorable brand experiences','Sales & Marketing','Branding Experts',26,3,4.7,'Branding,Identity,Strategy','/assets/images/userimages/women/10.jfif'],
    ['Sara T.','Optimizes ecommerce stores for sales','Sales & Marketing','Ecommerce Consultants',27,4,4.7,'Shopify,Conversion Rate,Marketing','/assets/images/userimages/women/8.jfif'],
    ['Ali Z.','Helps boost ecommerce sales','Sales & Marketing','Ecommerce Consultants',24,2,4.6,'Shopify,Marketing,Optimization','/assets/images/userimages/men/11.jfif'],
    // ── Writing & Translation ─────────────────────────────────────────────
    ['Dr. Laila Mahmoud','PhD Academic Writer | Research Papers & Theses','Writing & Translation','Academic Writers',28,6,4.9,'APA/MLA,Research,Citation','/assets/images/userimages/women/1.jfif'],
    ['Omar Farouk','Academic Writer: Social Sciences & Humanities','Writing & Translation','Academic Writers',32,4,4.8,'Critical Analysis,Chicago Style','/assets/images/userimages/men/1.jfif'],
    ['Nadia Hisham','Business Plan Consultant & Pitch Deck Expert','Writing & Translation','Business Plan Writers',35,5,4.9,'Financial Projections,Market Research','/assets/images/userimages/women/2.jfif'],
    ['Hossam El-Din','Professional Copy Editor & Proofreader (EN/AR)','Writing & Translation','Copy Editors',25,7,4.7,'Grammar,Style Guide,Fact-checking','/assets/images/userimages/men/2.jfif'],
    ['Salma Youssef','Creative Storyteller | Scripts & Fiction Writer','Writing & Translation','Creative Writers',30,3,4.9,'Short Stories,Blogs,Character Dev','/assets/images/userimages/women/3.jfif'],
    ['Carlos Mendez','Certified Translator EN ⇄ ES | Technical & Legal','Writing & Translation','English to Spanish Translators',38,8,4.8,'Localization,CAT Tools,Legal Trans','/assets/images/userimages/men/3.jfif'],
    ['Yara Gamal','Technical Writer | API Docs & User Manuals','Writing & Translation','Technical Writers',42,5,4.9,'Markdown,MadCap Flare,Software Docs','/assets/images/userimages/women/4.jfif'],
    ['Khaled Samir','SEO Content Writer | Blog posts & Web copy','Writing & Translation','SEO Content Writers',27,4,4.7,'Keyword Research,WordPress,SEMrush','/assets/images/userimages/men/4.jfif'],
    ['Fatma Nour','Resume & LinkedIn Profile Writer','Writing & Translation','Resume Writers',30,5,4.8,'ATS Optimization,Career Coaching,LinkedIn','/assets/images/userimages/women/5.jfif'],
    ['Ahmed Ramadan','Professional Proofreader & Editor','Writing & Translation','Proofreaders',22,6,4.7,'Grammar Check,Copyediting,Proofreading','/assets/images/userimages/men/5.jfif'],
    // ── Admin & Support ───────────────────────────────────────────────────
    ['Ahmed Ali','Professional personal assistant for scheduling & emails','Admin & Support','Personal Assistants',25,5,4.5,'Scheduling,Email Management,Organization','/assets/images/userimages/men/1.jfif'],
    ['Mona Saber','Virtual assistant for business communication','Admin & Support','Personal Assistants',28,7,4.7,'Communication,Planning,Admin Support','/assets/images/userimages/women/1.jfif'],
    ['Omar Khalid','Remote assistant for data entry & task tracking','Admin & Support','Personal Assistants',30,2,4.9,'Data Entry,Organization,Follow-up','/assets/images/userimages/men/2.jfif'],
    ['Sara Mohamed','Expert in professional document creation with Google Docs','Admin & Support','Google Docs Experts',40,6,4.8,'Docs,Formatting,Editing','/assets/images/userimages/women/2.jfif'],
    ['Youssef Nabil','Skilled in creating structured reports & documents','Admin & Support','Google Docs Experts',38,4,4.7,'Docs,Writing,Templates','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','Professional document layout & editing specialist','Admin & Support','Google Docs Experts',42,3,4.9,'Docs,Layout,Editing','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','Google Sheets expert in data analysis & formulas','Admin & Support','Google Sheets Experts',45,2,4.9,'Sheets,Formulas,Data Analysis','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','Advanced automation in Google Sheets','Admin & Support','Google Sheets Experts',50,5,4.8,'Automation,Scripts,Sheets','/assets/images/userimages/men/14.jfif'],
    ['Nour Adel','Expert in organizing large datasets efficiently','Admin & Support','Google Sheets Experts',48,5,4.9,'Data Analysis,Sheets,Reporting','/assets/images/userimages/men/14.jfif'],
    ['Khaled Mahmoud','Excel expert in dashboards & data reporting','Admin & Support','Microsoft Excel Experts',32,4,4.7,'Excel,Formulas,Dashboards','/assets/images/userimages/men/3.jfif'],
    ['Omar Saeed','Excel automation & business reports specialist','Admin & Support','Microsoft Excel Experts',28,5,4.7,'VBA,Automation,Reports','/assets/images/userimages/men/4.jfif'],
    ['Sara Adel','Excel analyst for data visualization & reporting','Admin & Support','Microsoft Excel Experts',30,3,4.8,'Charts,Analysis,Excel','/assets/images/userimages/women/3.jfif'],
    ['Nourhan Ali','Office specialist in Word, Excel, and PowerPoint','Admin & Support','Microsoft Office Specialists',35,5,4.8,'Word,Excel,PowerPoint','/assets/images/userimages/women/4.jfif'],
    ['Ahmed Tarek','Professional in Microsoft Office documentation','Admin & Support','Microsoft Office Specialists',27,6,4.7,'Office,Docs,Reports','/assets/images/userimages/men/5.jfif'],
    ['Mona Hassan','Expert in creating Word, Excel, and PowerPoint files','Admin & Support','Microsoft Office Specialists',35,4,4.9,'Word,Excel,PowerPoint','/assets/images/userimages/women/5.jfif'],
    ['Mostafa Nasser','Word expert in professional formatting & document design','Admin & Support','Microsoft Word Experts',22,3,4.9,'Word,Formatting,Documents','/assets/images/userimages/men/6.jfif'],
    ['Sara Khaled','Professional writer & editor specializing in Word','Admin & Support','Microsoft Word Experts',24,5,4.8,'Writing,Editing,Word','/assets/images/userimages/women/6.jfif'],
    ['Youssef Adel','Expert in Word templates & structured reports','Admin & Support','Microsoft Word Experts',23,4,4.9,'Templates,Reports,Word','/assets/images/userimages/men/7.jfif'],
    ['Ahmed Adel','PowerPoint designer creating modern presentations','Admin & Support','PowerPoint Experts',30,3,4.8,'Slides,Design,Storytelling','/assets/images/userimages/men/8.jfif'],
    ['Nour Ali','Professional slide designer for impactful presentations','Admin & Support','PowerPoint Experts',32,5,4.7,'Presentations,Slides,Animation','/assets/images/userimages/women/7.jfif'],
    ['Ramy Hassan','Corporate presentation expert','Admin & Support','PowerPoint Experts',28,4,4.8,'PowerPoint,Infographics,Charts','/assets/images/userimages/men/9.jfif'],
    // ── Finance & Accounting ──────────────────────────────────────────────
    ['Ahmed Samir','Business Consultant helping startups scale','Finance & Accounting','Business Consultants',25,5,4.8,'Startup Consulting,Business Plan,Content Writing','/assets/images/userimages/men/1.jfif'],
    ['Mona Hassan','Business Analyst managing financial realities','Finance & Accounting','Business Consultants',28,7,4.7,'Business Analysis,Financial Analysis,Management Consulting','/assets/images/userimages/women/1.jfif'],
    ['Omar Khaled','Experienced Entrepreneur & Business Consultant','Finance & Accounting','Business Consultants',30,2,4.9,'Business Consulting,Business Plan,Startup Consulting','/assets/images/userimages/men/2.jfif'],
    ['Sara Ali','Accounts Payable Manager helping businesses','Finance & Accounting','Accounts Payable Managers',40,6,4.8,'Bookkeeping,Intuit QuickBooks,Accounting','/assets/images/userimages/women/2.jfif'],
    ['Youssef Nabil','Highly experienced remote accountant','Finance & Accounting','Accounts Payable Managers',38,4,4.7,'Accounts Payable,QuickBooks Online,Buildium','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','AP Specialist for service industries & law firms','Finance & Accounting','Accounts Payable Managers',42,3,4.9,'Accounts Payable Management,Microsoft Excel,Bank Reconciliation','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','CFO & Financial Modeling Expert','Finance & Accounting','Financial Modelers',45,2,4.9,'Real Estate Financial Modeling,Mergers & Acquisitions,Business Plan Writing','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','Financial Modeler & CFA Analyst','Finance & Accounting','Financial Modelers',50,5,4.8,'Forecasting,Chartered Financial Analyst,Virtual Assistance','/assets/images/userimages/men/14.jfif'],
    ['Nour Adel','Financial Modeling & Valuation Expert','Finance & Accounting','Financial Modelers',48,5,4.9,'DCF Valuation,Excel,Financial Analysis','/assets/images/userimages/women/4.jfif'],
    ['Khaled Farid','Tax Advisor & Financial Planner','Finance & Accounting','Tax Advisors',38,6,4.8,'Tax Planning,Compliance,QuickBooks','/assets/images/userimages/men/3.jfif'],
    ['Dina Rafik','CPA & Accounting Specialist','Finance & Accounting','Tax Advisors',35,5,4.7,'CPA,Tax Filing,Auditing','/assets/images/userimages/women/5.jfif'],
    // ── Legal ─────────────────────────────────────────────────────────────
    ['Ahmed Samir','Legal Consultant Specialized In Corporate Law & Contracts','Legal','Corporate Law Professionals',25,5,4.8,'Corporate Law,Contract,Arbitration','/assets/images/userimages/men/1.jfif'],
    ['Mona Hassan','Legal Associate Specialized In Commercial Disputes','Legal','Corporate Law Professionals',28,7,4.7,'Commercial,Litigation,Legal Writing','/assets/images/userimages/women/1.jfif'],
    ['Omar Khaled','Expert Corporate Consultant & General Counsel','Legal','Corporate Law Professionals',30,2,4.9,'Contracts,Mergers,Tax Law','/assets/images/userimages/men/2.jfif'],
    ['Laila Soliman','Expert in Student & Work Visas','Legal','Immigration Law Professionals',40,6,4.8,'Study Visa,Work Visa,PR Status','/assets/images/userimages/women/2.jfif'],
    ['Marwan Ali','Senior Consultant for Citizenship','Legal','Immigration Law Professionals',38,4,4.7,'Citizenship,Legal Advice,Translation','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','Specialist in Business Immigration','Legal','Immigration Law Professionals',42,3,4.9,'Tax Law,Investment,Visa','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','Senior Strategic Legal Advisor','Legal','Legal Advisors',45,2,4.9,'Strategy,Compliance,Policy','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','General Legal Consultant','Legal','Legal Advisors',50,5,4.8,'Mediation,Agreements,Research','/assets/images/userimages/men/14.jfif'],
    ['Ahmed Adel','Advisor for Startups & Small Business','Legal','Legal Advisors',48,5,4.9,'Startups,Contracts,IP Rights','/assets/images/userimages/men/14.jfif'],
    ['Sara Ahmed','Legal Consultant specializing in business law','Legal','Legal Consultants',44,6,4.8,'Business Law,Regulatory Compliance,Contracts','/assets/images/userimages/women/3.jfif'],
    ['Nourhan Ali','Contract & Commercial Law Expert','Legal','Legal Consultants',42,4,4.7,'Contract Law,Commercial Agreements,Drafting','/assets/images/userimages/women/4.jfif'],
    ['Khaled Hassan','IP & Technology Law Consultant','Legal','Legal Consultants',46,7,4.9,'IP Rights,Technology Law,Patent','/assets/images/userimages/men/3.jfif'],
    // ── HR & Training ─────────────────────────────────────────────────────
    ['Ahmed Samir','HR Specialist focused on employee engagement','HR & Training','Employee Engagement Specialists',25,5,4.8,'Employee Engagement,HR Tools,Surveys','/assets/images/userimages/men/1.jfif'],
    ['Mona Hassan','Employee Engagement Consultant improving team satisfaction','HR & Training','Employee Engagement Specialists',28,7,4.7,'Employee Experience,Feedback Systems,HR Analytics','/assets/images/userimages/women/1.jfif'],
    ['Omar Khaled','Workplace Engagement Specialist','HR & Training','Employee Engagement Specialists',30,2,4.9,'Performance Management,Team Engagement,Communication','/assets/images/userimages/men/2.jfif'],
    ['Sara Ali','Leadership development specialist building strong leaders','HR & Training','Leadership Development Specialists',40,6,4.8,'Leadership Training,Coaching,Team Building','/assets/images/userimages/women/2.jfif'],
    ['Youssef Nabil','Leadership coach improving team performance','HR & Training','Leadership Development Specialists',38,4,4.7,'Communication,Performance Management,Mentoring','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','Organizational development & leadership growth specialist','HR & Training','Leadership Development Specialists',42,3,4.9,'Strategic Planning,Talent Development,Problem Solving','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','Technical recruiter specializing in IT professionals','HR & Training','Technical Recruiters',45,2,4.9,'Recruitment,LinkedIn,Candidate Screening','/assets/images/userimages/men/17.jfif'],
    ['Mostafa Gamal','IT recruiter focused on talent acquisition','HR & Training','Technical Recruiters',50,5,4.8,'Talent Acquisition,Interviewing,HR Systems','/assets/images/userimages/men/14.jfif'],
    ['Nour Adel','Technical hiring specialist for engineering teams','HR & Training','Technical Recruiters',48,5,4.9,'Hiring Strategy,Communication,Onboarding','/assets/images/userimages/men/14.jfif'],
    ['Khaled Mahmoud','Curriculum developer designing educational programs','HR & Training','Curriculum Developers',32,4,4.7,'Instructional Design,Content Creation,E-learning','/assets/images/userimages/men/3.jfif'],
    ['Omar Saeed','Learning content developer creating structured courses','HR & Training','Curriculum Developers',28,5,4.6,'Curriculum Planning,Training Materials,Course Design','/assets/images/userimages/men/4.jfif'],
    ['Sara Adel','E-learning specialist & curriculum designer','HR & Training','Curriculum Developers',30,3,4.8,'E-learning,LMS,Instructional Design','/assets/images/userimages/women/3.jfif'],
    // ── Engineering & Architecture ────────────────────────────────────────
    ['Ahmed Samir','AutoCAD Designer for 2D & 3D engineering drawings','Engineering & Architecture','AutoCAD Developers',25,5,4.8,'AutoCAD,Drafting,3D Modeling','/assets/images/userimages/men/1.jfif'],
    ['Mona Hassan','Mechanical AutoCAD Specialist','Engineering & Architecture','AutoCAD Developers',30,3,4.7,'AutoCAD,Mechanical Design,CAD','/assets/images/userimages/women/1.jfif'],
    ['Omar Khaledi','Electrical CAD Designer','Engineering & Architecture','AutoCAD Developers',28,4,4.9,'AutoCAD,Electrical Drawings,Layouts','/assets/images/userimages/men/2.jfif'],
    ['Sara Ali','Civil Engineering Consultant','Engineering & Architecture','Engineering Consultants',40,6,4.8,'Structural Analysis,Site Planning,Consulting','/assets/images/userimages/women/2.jfif'],
    ['Youssef Nabil','Mechanical Engineering Consultant','Engineering & Architecture','Engineering Consultants',38,5,4.7,'HVAC,Systems Design,Consulting','/assets/images/userimages/men/10.jfif'],
    ['Hassan Reda','Project Engineering Advisor','Engineering & Architecture','Engineering Consultants',42,7,4.9,'Project Management,Risk Analysis,Planning','/assets/images/userimages/men/18.jfif'],
    ['Ali Mohamed','Interior Designer for modern spaces','Engineering & Architecture','Interior Architects',35,5,4.8,'3Ds Max,Interior Design,Rendering','/assets/images/userimages/men/17.jfif'],
    ['Nour Adel','Luxury Interior Architect','Engineering & Architecture','Interior Architects',37,4,4.9,'SketchUp,Design,Visualization','/assets/images/userimages/men/14.jfif'],
    ['Fatma Hassan','Home Interior Specialist','Engineering & Architecture','Interior Architects',33,3,4.7,'AutoCAD,Furniture Design,Decor','/assets/images/userimages/women/4.jfif'],
    ['Mahmoud Ali','Architectural Modeler & BIM Specialist','Engineering & Architecture','Architectural Modelers',38,5,4.8,'Revit,BIM,AutoCAD','/assets/images/userimages/men/5.jfif'],
    ['Nora Emad','3D Architectural Visualization Expert','Engineering & Architecture','Architectural Modelers',35,4,4.7,'SketchUp,Lumion,Visualization','/assets/images/userimages/women/5.jfif'],
    ['Karim Hassan','Landscape & Site Modeling Specialist','Engineering & Architecture','Architectural Modelers',32,3,4.8,'Rhino,3D Modeling,Site Planning','/assets/images/userimages/men/6.jfif'],
  ]);
}

// Seeded posts removed — only real user-created posts appear in Find Work
if (false && db.prepare("SELECT COUNT(*) as n FROM posts WHERE title='Excel Data Analysis & Power BI Dashboard'").get().n === 0) {
  const bcrypt = require('bcryptjs');
  const hash   = bcrypt.hashSync('taskhunt_seed', 4); // low cost — dev seed only

  const insUser = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'client')");
  const getUserId = (email) => db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;

  const seedClients = [
    ['Ahmed Samir',    'ahmedsamir@seed.th'],
    ['Sara Ali',       'saraali@seed.th'],
    ['Ali Mohamed',    'alimohamed@seed.th'],
    ['Mahmoud Tarek',  'mahmoudtarek@seed.th'],
    ['Omar Hassan',    'omarhassan@seed.th'],
    ['Nour Adel',      'nouradel@seed.th'],
    ['Farida Ahmed',   'faridaahmed@seed.th'],
    ['Youssef Gamal',  'youssefgamal@seed.th'],
    ['Salma Reda',     'salmared@seed.th'],
    ['Ahmed Nabil',    'ahmednabil@seed.th'],
    ['Nada Sherif',    'nadasherif@seed.th'],
    ['Mohamed Ibrahim','mohamedibrahim@seed.th'],
    ['Khaled Emad',    'khaledemad@seed.th'],
    ['Amr Adel',       'amradel@seed.th'],
    ['Mona Lotfy',     'monalotfy@seed.th'],
    ['Hossam Reda',    'hossamreda@seed.th'],
    ['Reem Hany',      'reemhany@seed.th'],
  ];

  for (const [name, email] of seedClients) insUser.run(name, email, hash);

  const insPost = db.prepare('INSERT INTO posts (title, description, budget, category, user_id) VALUES (?, ?, ?, ?, ?)');
  const seedPosts = db.transaction(rows => { for (const r of rows) insPost.run(...r); });

  seedPosts([
    ['Excel Data Analysis & Power BI Dashboard',     'Looking for an expert to clean sales data and create an interactive dashboard.',          450,  'Data & AI',             getUserId('ahmedsamir@seed.th')],
    ['Machine Learning Model for Prediction',         'Build a predictive model using Python and Scikit-learn for customer churn.',              1200, 'Data & AI',             getUserId('saraali@seed.th')],
    ['Deep Learning Specialist for Image Recognition','Image classification using TensorFlow.',                                                   45,   'Data & AI',             getUserId('alimohamed@seed.th')],
    ['Full Stack Web Application (React/Node)',        'Develop e-commerce platform with MERN stack.',                                            2500, 'Development & IT',      getUserId('mahmoudtarek@seed.th')],
    ['Backend API Development (Python/Django)',        'RESTful APIs for mobile app backend.',                                                     30,   'Development & IT',      getUserId('omarhassan@seed.th')],
    ['DevOps Setup & AWS Deployment',                 'CI/CD pipelines and AWS configuration.',                                                  800,  'Development & IT',      getUserId('nouradel@seed.th')],
    ['Social Media Graphics Design',                  '10 templates for Instagram and Facebook.',                                                150,  'Design & Creative',     getUserId('faridaahmed@seed.th')],
    ['UX/UI Design for Mobile Application',           'Fintech app design using Figma.',                                                         600,  'Design & Creative',     getUserId('youssefgamal@seed.th')],
    ['Digital Marketing Campaign Management',         'Manage Facebook & Google ads.',                                                           400,  'Sales & Marketing',     getUserId('salmared@seed.th')],
    ['SEO Optimization for E-commerce',               'Improve Shopify store ranking.',                                                          25,   'Sales & Marketing',     getUserId('ahmednabil@seed.th')],
    ['Creative Content Writing (Blog Posts)',          '5 engaging tech blog articles.',                                                          100,  'Writing & Translation', getUserId('nadasherif@seed.th')],
    ['Technical Translation (English to Arabic)',      '20-page software manual.',                                                               200,  'Writing & Translation', getUserId('mohamedibrahim@seed.th')],
    ['Virtual Assistant for Daily Tasks',             'Email, scheduling, data entry.',                                                          15,   'Admin & Support',       getUserId('khaledemad@seed.th')],
    ['Excel Data Entry & Formatting',                 'Organize large datasets.',                                                               100,  'Admin & Support',       getUserId('amradel@seed.th')],
    ['Financial Analysis & Forecasting',              'Financial projections for business plan.',                                               500,  'Finance & Accounting',  getUserId('monalotfy@seed.th')],
    ['Corporate Contract Review',                     'Legal partnership agreement review.',                                                    1000, 'Legal',                 getUserId('hossamreda@seed.th')],
    ['Technical Recruitment for Startup',             'Source & interview developers.',                                                         25,   'HR & Training',         getUserId('reemhany@seed.th')],
  ]);
}

// Add post_type column if not present (safe migration)
try { db.exec("ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT 'job'"); } catch (_) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS direct_conversations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id  INTEGER NOT NULL REFERENCES users(id),
    user2_id  INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
  );

  CREATE TABLE IF NOT EXISTS direct_messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    conv_id   INTEGER NOT NULL REFERENCES direct_conversations(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    body      TEXT    NOT NULL,
    is_read   INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Admins table ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default admin on first run
if (db.prepare('SELECT COUNT(*) as n FROM admins').get().n === 0) {
  const bcrypt = require('bcryptjs');
  db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)')
    .run('Super Admin', 'admin@taskhunt.com', bcrypt.hashSync('admin123', 10));
  console.log('\n  ✅ Default admin created:');
  console.log('     Email:    admin@taskhunt.com');
  console.log('     Password: admin123\n');
}

module.exports = db;
