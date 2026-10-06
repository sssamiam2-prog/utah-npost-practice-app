/**
 * Builds three original NPOST-style practice forms (75 items each).
 * Run: node scripts/generate-exams.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'data');

const SECTION_META = [
  { label: 'Mathematics', minutes: 20, count: 20, instructions: 'Select the best answer. No calculator. Scratch paper is allowed.' },
  { label: 'Reading comprehension', minutes: 25, count: 25, instructions: 'Read each passage, then choose the best answer based only on the passage.' },
  { label: 'Grammar', minutes: 15, count: 20, instructions: 'Select the underlined portion that contains an error, or "No error" if the sentence is correct.' },
  { label: 'Incident report writing', minutes: 15, count: 10, instructions: 'Write one complete sentence using only the facts given. Check spelling, punctuation, and grammar.' },
];

function mathBank(seed) {
  const items = [
    { prompt: 'A patrol shift is 480 minutes. If 35% is spent on reports, how many minutes are spent on reports?', options: ['148', '168', '172', '192'], answer: 1, explanation: '480 × 0.35 = 168 minutes.' },
    { prompt: 'An agency buys 6 boxes of forms with 250 forms per box. How many forms is that in total?', options: ['1,200', '1,500', '1,800', '2,100'], answer: 1, explanation: '6 × 250 = 1,500 forms.' },
    { prompt: 'Officer Diaz drives 18 miles in 24 minutes at a steady speed. How many miles per hour is that?', options: ['36', '42', '45', '48'], answer: 2, explanation: '24 minutes is 0.4 hour; 18 ÷ 0.4 = 45 mph.' },
    { prompt: 'A supply order costs $84 plus 8% tax. What is the total cost?', options: ['$88.72', '$90.72', '$91.52', '$92.72'], answer: 1, explanation: 'Tax is $6.72; total $90.72.' },
    { prompt: 'If 3 officers share 2 radios equally by time, how many hours does each officer get from one 12-hour radio shift?', options: ['4', '6', '8', '9'], answer: 2, explanation: 'Each officer uses the pair 2/3 of the time: 12 × (2/3) = 8 hours of radio access per officer across the shared schedule described.' },
    { prompt: 'A parking lot has 8 rows with 15 spaces each. If 47 spaces are occupied, how many are empty?', options: ['63', '73', '78', '83'], answer: 1, explanation: '120 total spaces − 47 = 73 empty.' },
    { prompt: 'Training requires 40 hours. If an recruit completes 5 hours per day, how many full days are needed at minimum?', options: ['6', '7', '8', '9'], answer: 2, explanation: '40 ÷ 5 = 8 days.' },
    { prompt: 'A store marks up uniform pants from $32 to $40. What is the percent markup on cost?', options: ['20%', '25%', '30%', '35%'], answer: 1, explanation: 'Increase is $8; 8 ÷ 32 = 25%.' },
    { prompt: 'Evidence is logged every 45 minutes. Starting at 08:00, at what time is the fourth log entry made?', options: ['09:15', '09:30', '10:15', '10:30'], answer: 2, explanation: 'Three intervals after the first: 08:00 + 135 minutes = 10:15.' },
    { prompt: 'A rectangular room is 12 feet by 18 feet. What is the area in square feet?', options: ['186', '196', '216', '226'], answer: 2, explanation: '12 × 18 = 216 square feet.' },
    { prompt: 'If 5 tickets cost $27.50, what is the cost of 8 tickets at the same unit price?', options: ['$42.00', '$44.00', '$46.00', '$48.00'], answer: 1, explanation: 'Unit price $5.50; 8 × 5.50 = $44.00.' },
    { prompt: 'A budget line item is reduced from $2,400 to $2,040. What percent was cut?', options: ['12%', '15%', '18%', '20%'], answer: 1, explanation: 'Reduction $360; 360 ÷ 2400 = 15%.' },
    { prompt: 'Two shifts overlap for 90 minutes. How many hours is that overlap?', options: ['1.0', '1.25', '1.5', '1.75'], answer: 2, explanation: '90 minutes = 1.5 hours.' },
    { prompt: 'A patrol car uses 0.08 gallons per mile. How many gallons are used for 125 miles?', options: ['8', '9', '10', '11'], answer: 2, explanation: '125 × 0.08 = 10 gallons.' },
    { prompt: 'If the ratio of day shift to night shift officers is 3:2 and there are 30 officers total, how many are on night shift?', options: ['10', '12', '14', '16'], answer: 1, explanation: 'Night is 2/5 of 30 = 12.' },
    { prompt: 'A fine is $50 plus $5 for each mile over the limit. How much is a ticket for 12 miles over?', options: ['$105', '$110', '$115', '$120'], answer: 1, explanation: '50 + (12 × 5) = $110.' },
    { prompt: 'A clerk files 240 pages in 6 hours. At that rate, how many pages in 2.5 hours?', options: ['90', '95', '100', '105'], answer: 2, explanation: '40 pages/hour × 2.5 = 100 pages.' },
    { prompt: 'A number increased by 20% equals 84. What was the original number?', options: ['68', '70', '72', '74'], answer: 1, explanation: '84 ÷ 1.2 = 70.' },
    { prompt: 'How many minutes are in 2.75 hours?', options: ['155', '160', '165', '170'], answer: 2, explanation: '2.75 × 60 = 165 minutes.' },
    { prompt: 'A class has 48 candidates. If 70% must pass a drill, how many must pass?', options: ['32', '33', '34', '35'], answer: 2, explanation: '48 × 0.7 = 33.6, so 34 candidates at the 70% threshold count.' },
  ];
  return items.map((q, i) => ({ ...q, prompt: `[Form ${seed}] ${q.prompt}` }));
}

const READING_PASSAGES = [
  {
    title: 'Community meeting notice',
    text: 'The Riverton Police Department will host a neighborhood meeting on Thursday, March 14, at 6:30 p.m. in the community room at 118 West Center Street. Topics include traffic calming near the elementary school and updated parking rules for the spring festival. Residents may submit written questions until March 10. Spanish interpretation will be available. Parking for attendees is in the south lot; do not block fire lanes.',
    questions: [
      { prompt: 'When is the meeting scheduled?', options: ['March 10 at 6:30 p.m.', 'March 14 at 6:30 p.m.', 'March 14 at 7:30 p.m.', 'March 18 at 6:30 p.m.'], answer: 1, explanation: 'The notice lists Thursday, March 14, at 6:30 p.m.' },
      { prompt: 'Where should attendees park?', options: ['North lot only', 'South lot', 'Street in front of the building', 'Fire lane if full'], answer: 1, explanation: 'Parking is in the south lot; fire lanes must stay clear.' },
      { prompt: 'What deadline is given for written questions?', options: ['March 8', 'March 10', 'March 12', 'March 14'], answer: 1, explanation: 'Questions are accepted until March 10.' },
      { prompt: 'Which topic will NOT necessarily be covered according to the notice?', options: ['Traffic calming', 'Festival parking', 'Hiring new officers', 'Parking rules update'], answer: 2, explanation: 'Hiring is not mentioned; traffic calming and festival parking are.' },
      { prompt: 'What accommodation is offered for language access?', options: ['Sign language only', 'Spanish interpretation', 'Printed transcripts only', 'No accommodations'], answer: 1, explanation: 'Spanish interpretation will be available.' },
    ],
  },
  {
    title: 'Ride-along policy excerpt',
    text: 'Applicants for a civilian ride-along must be at least 18, pass a background check, and sign a liability waiver. Ride-alongs occur on weekdays between 10:00 a.m. and 8:00 p.m. Participants must wear closed-toe shoes and a department-issued vest. Recording devices are prohibited unless pre-approved in writing by the watch commander. The officer may end the ride-along at any time for safety reasons.',
    questions: [
      { prompt: 'What is the minimum age for applicants?', options: ['16', '17', '18', '21'], answer: 2, explanation: 'Applicants must be at least 18.' },
      { prompt: 'When may ride-alongs occur?', options: ['Any day, any time', 'Weekdays 10 a.m.–8 p.m.', 'Weekends only', 'Night shifts only'], answer: 1, explanation: 'Weekdays between 10:00 a.m. and 8:00 p.m.' },
      { prompt: 'Which item is required apparel?', options: ['Ball cap', 'Department vest', 'Athletic sandals', 'Personal body camera'], answer: 1, explanation: 'Participants must wear a department-issued vest.' },
      { prompt: 'Under what condition may recording be allowed?', options: ['Always allowed', 'Never allowed', 'With written pre-approval', 'If posted online later'], answer: 2, explanation: 'Recording requires written pre-approval from the watch commander.' },
      { prompt: 'Who may end the ride-along for safety?', options: ['Only the participant', 'Only the chief', 'The officer', 'City attorney'], answer: 2, explanation: 'The officer may end the ride-along at any time for safety.' },
    ],
  },
  {
    title: 'Lost property bulletin',
    text: 'On April 2, a black backpack was turned in to the front desk. Contents include a blue spiral notebook, a set of keys on a carabiner, and a reusable water bottle with no name. The owner must describe the notebook and identify one unique key to claim the item. Unclaimed property will be transferred to the city warehouse after 90 days. Photo ID is required at pickup.',
    questions: [
      { prompt: 'What must the owner do to claim the backpack?', options: ['Pay a $25 fee', 'Describe the notebook and identify a unique key', 'Provide a receipt from a store', 'File a police report online only'], answer: 1, explanation: 'The bulletin requires describing the notebook and identifying one unique key.' },
      { prompt: 'What happens after 90 days if unclaimed?', options: ['Destroyed immediately', 'Returned to finder', 'Transferred to city warehouse', 'Donated to school'], answer: 2, explanation: 'Unclaimed property goes to the city warehouse after 90 days.' },
      { prompt: 'Which item is NOT listed as contents?', options: ['Blue notebook', 'Keys on carabiner', 'Laptop computer', 'Water bottle'], answer: 2, explanation: 'No laptop is listed among the contents.' },
      { prompt: 'What is required at pickup?', options: ['Social media post', 'Photo ID', 'Witness signature', 'Notarized letter'], answer: 1, explanation: 'Photo ID is required at pickup.' },
      { prompt: 'Where was the backpack turned in?', options: ['Evidence room', 'Front desk', 'Parking garage', 'City warehouse'], answer: 1, explanation: 'It was turned in to the front desk.' },
    ],
  },
  {
    title: 'Traffic advisory',
    text: 'From May 5 through May 9, Main Street between 400 South and 600 South will have one lane closed daily from 9:00 a.m. to 4:00 p.m. for utility work. Detour signs will direct southbound traffic to State Street. Emergency access for residences and businesses will be maintained. The project may pause during heavy rain. Updates will be posted on the city traffic page by 7:00 a.m. each day.',
    questions: [
      { prompt: 'How long will lane closures run each day?', options: ['7 hours', '8 hours', '9 hours', '10 hours'], answer: 0, explanation: '9:00 a.m. to 4:00 p.m. is 7 hours.' },
      { prompt: 'Where will southbound traffic be directed?', options: ['Main Street', 'State Street', 'Interstate 15', '400 South only'], answer: 1, explanation: 'Detour signs direct southbound traffic to State Street.' },
      { prompt: 'What may pause the project?', options: ['Weekends', 'Heavy rain', 'School events', 'Night hours'], answer: 1, explanation: 'The project may pause during heavy rain.' },
      { prompt: 'Where will daily updates appear?', options: ['Radio only', 'City traffic page', 'Printed mailers', 'Officer social accounts'], answer: 1, explanation: 'Updates post on the city traffic page by 7:00 a.m.' },
      { prompt: 'Which access must be maintained?', options: ['Only pedestrian', 'Emergency access for residences and businesses', 'Only commercial trucks', 'No access allowed'], answer: 1, explanation: 'Emergency access for residences and businesses will be maintained.' },
    ],
  },
  {
    title: 'Volunteer program summary',
    text: 'The Police Explorer post meets twice monthly on Tuesdays at 6:00 p.m. Explorers must maintain at least a 2.5 GPA, attend 75% of meetings, and complete a first-aid certification within six months of joining. Uniforms are provided on loan. Explorers may not carry weapons or operate emergency equipment. Parent or guardian consent is required for applicants under 18.',
    questions: [
      { prompt: 'How often does the post meet?', options: ['Weekly', 'Twice monthly', 'Once monthly', 'Quarterly'], answer: 1, explanation: 'The post meets twice monthly on Tuesdays.' },
      { prompt: 'What GPA must explorers maintain?', options: ['2.0', '2.5', '3.0', '3.5'], answer: 1, explanation: 'At least a 2.5 GPA is required.' },
      { prompt: 'What must be completed within six months?', options: ['Firearms qualification', 'First-aid certification', 'Driver training', 'State exam'], answer: 1, explanation: 'First-aid certification within six months of joining.' },
      { prompt: 'Which activity is prohibited?', options: ['Attending meetings', 'Wearing uniforms', 'Operating emergency equipment', 'Maintaining GPA'], answer: 2, explanation: 'Explorers may not operate emergency equipment.' },
      { prompt: 'Who must consent for applicants under 18?', options: ['School principal', 'Parent or guardian', 'Mayor', 'Post advisor only'], answer: 1, explanation: 'Parent or guardian consent is required under 18.' },
    ],
  },
];

function readingBank(formId) {
  const out = [];
  for (const passage of READING_PASSAGES) {
    for (const q of passage.questions) {
      out.push({
        passageTitle: passage.title,
        passage: passage.text,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      });
    }
  }
  while (out.length < 25) {
    const p = READING_PASSAGES[out.length % READING_PASSAGES.length];
    const q = p.questions[out.length % p.questions.length];
    out.push({
      passageTitle: p.title + ` (variant ${formId})`,
      passage: p.text,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    });
  }
  return out.slice(0, 25);
}

function grammarBank(formId) {
  const templates = [
    { prompt: 'The officer {A:were|B:was|C:are|D:am} first on scene.', answer: 1, explanation: 'Subject "officer" is singular; use "was".' },
    { prompt: 'Each of the witnesses {A:give|B:gives|C:giving|D:given} a written statement.', answer: 1, explanation: '"Each" is singular; use "gives".' },
    { prompt: 'The team {A:have|B:has|C:having|D:haves} completed the inventory.', answer: 1, explanation: 'Collective noun "team" takes singular "has" here.' },
    { prompt: 'Neither the keys nor the wallet {A:was|B:were|C:is|D:are} in the locker.', answer: 1, explanation: 'With "neither/nor", verb agrees with nearer subject "wallet" (plural concept → were).' },
    { prompt: 'She {A:dont|B:doesn\'t|C:doesnt|D:do not} know the suspect\'s name.', answer: 1, explanation: 'Third person singular needs "doesn\'t".' },
    { prompt: 'They {A:seen|B:saw|C:have saw|D:had saw} the vehicle leave the lot.', answer: 1, explanation: 'Simple past "saw" is correct.' },
    { prompt: 'The report {A:was wrote|B:was written|C:were written|D:was writed} by Officer Lee.', answer: 1, explanation: 'Passive past uses "was written".' },
    { prompt: 'Turn {A:left|B:leave|C:lefts|D:leaving} at the next light, then proceed north.', answer: 0, explanation: 'Imperative "Turn left" is correct; no error in option A as written—sentence uses A correctly.' },
    { prompt: 'Its {A:a|B:an|C:the|D:no article needed} honor to serve this community.', answer: 0, explanation: 'Before "honor" (consonant sound), use "an" — error is "a" in A.' },
    { prompt: 'The child, along with her parents, {A:was|B:were|C:are|D:have been} interviewed.', answer: 0, explanation: 'Subject is "child"; use singular "was".' },
    { prompt: 'He {A:laid|B:lay|C:lie|D:lain} the evidence on the table.', answer: 0, explanation: 'Transitive past of lay is "laid".' },
    { prompt: 'There {A:is|B:are|C:was|D:were} three shell casings near the curb.', answer: 1, explanation: 'Plural "three shell casings" needs "are".' },
    { prompt: 'The memo {A:effect|B:affect|C:effects|D:affects} only night shift.', answer: 3, explanation: 'Verb meaning influence is "affects".' },
    { prompt: 'We {A:have went|B:went|C:have gone|D:had went} to the training last week.', answer: 2, explanation: 'Present perfect "have gone" fits recent past to now context; "went" also works for simple past—best fix is C for "have gone" if continuing relevance.' },
    { prompt: 'The {A:principals|B:principle|C:principal\'s|D:principles} decision was final.', answer: 2, explanation: 'Possessive "principal\'s decision".' },
    { prompt: 'Between you and {A:I|B:me|C:myself|D:we}, the call was difficult.', answer: 1, explanation: 'Object of preposition "between" takes "me".' },
    { prompt: 'The suspect ran {A:passed|B:past|C:pass|D:passes} the storefront.', answer: 1, explanation: 'Direction uses "past".' },
    { prompt: 'Who\'s {A:turn|B:turns|C:whose|D:who is} phone is ringing?', answer: 2, explanation: 'Possessive "Whose phone".' },
    { prompt: 'The data {A:is|B:are|C:were|D:have been} being analyzed tonight.', answer: 0, explanation: 'Treat "data" as singular mass noun in formal usage here: "is".' },
    { prompt: 'Please {A:bring|B:take|C:carry|D:fetch} this form to the records clerk.', answer: 0, explanation: 'Speaker-focused motion toward listener uses "bring" appropriately in many departments; "take" if away—context accepts bring.' },
  ];
  return templates.map((t, i) => ({
    prompt: `[Set ${formId}-${i + 1}] ${t.prompt.replace(/\{A:([^|]+)\|B:([^|]+)\|C:([^|]+)\|D:([^}]+)\}/g, (_, a, b, c, d) => {
      const parts = [a, b, c, d];
      const letters = ['A', 'B', 'C', 'D'];
      return parts.map((p, idx) => `${letters[idx]}. ${p}`).join(' ');
    })}`,
    options: ['Portion A', 'Portion B', 'Portion C', 'Portion D', 'No error'],
    answer: t.answer,
    explanation: t.explanation,
  }));
}

function writingBank(formId) {
  const scenarios = [
    {
      passageTitle: 'Incident facts — shoplifting',
      passage: 'Date: 06/12/2025. Time: 14:22. Location: 2200 South Redwood Road, Suite 18. Suspect: adult male, gray hoodie, black backpack. Action: concealed two boxes of batteries and exited without paying. Employee: Maria Chen, stopped suspect at door. Property recovered. No injuries.',
      prompt: 'Write one sentence stating when and where the incident occurred and what was taken.',
      modelAnswer: 'On 06/12/2025 at 14:22 at 2200 South Redwood Road, Suite 18, an adult male in a gray hoodie concealed two boxes of batteries and left without paying.',
      explanation: 'Include date, time, location, suspect description, and property taken in one sentence.',
    },
    {
      passageTitle: 'Incident facts — traffic stop',
      passage: 'Date: 07/01/2025. Time: 23:05. Location: 900 East at 4500 South. Vehicle: silver sedan, plate TEMP-1192. Violation: failed to signal lane change. Driver: identified as Jordan Wells, valid license. Warning issued. No arrest.',
      prompt: 'Write one sentence describing the stop and outcome.',
      modelAnswer: 'On 07/01/2025 at 23:05 at 900 East and 4500 South, Officer stopped a silver sedan for failing to signal a lane change and issued Jordan Wells a warning.',
      explanation: 'Cover when, where, reason, driver, and warning outcome.',
    },
    {
      passageTitle: 'Incident facts — welfare check',
      passage: 'Date: 08/19/2025. Time: 09:40. Location: 118 North Pine Avenue, Apt 3. Caller: neighbor reported unanswered calls for two days. Resident: Elaine Porter, age 72, alert and oriented. Medical: declined transport. Door secured.',
      prompt: 'Write one sentence summarizing the welfare check result.',
      modelAnswer: 'On 08/19/2025 at 09:40 at 118 North Pine Avenue, Apt 3, officers found Elaine Porter alert and oriented, she declined medical transport, and the door was secured.',
      explanation: 'State time, place, resident condition, and that transport was declined.',
    },
    {
      passageTitle: 'Incident facts — vandalism',
      passage: 'Date: 09/03/2025. Time: 06:15. Location: City Park pavilion. Damage: blue spray paint on north wall, approx. 6 feet wide. Reporting party: parks employee Luis Ortega. Photos taken. No suspects seen.',
      prompt: 'Write one sentence describing the damage and reporting party.',
      modelAnswer: 'On 09/03/2025 at 06:15 at the City Park pavilion, parks employee Luis Ortega reported blue spray paint about six feet wide on the north wall and no suspects were seen.',
      explanation: 'Include date, time, location, damage, reporter, and lack of suspects.',
    },
    {
      passageTitle: 'Incident facts — found property',
      passage: 'Date: 10/11/2025. Time: 16:50. Location: TRAX station at 900 South. Item: brown leather wallet containing ID for Sam Nguyen and $40 cash. Finder: commuter turned wallet to officer. Wallet logged into property.',
      prompt: 'Write one sentence stating what was found and how it was handled.',
      modelAnswer: 'On 10/11/2025 at 16:50 at the 900 South TRAX station, a commuter turned in a brown leather wallet belonging to Sam Nguyen with $40 cash, and the wallet was logged into property.',
      explanation: 'Mention finder action, item, owner ID, cash, and logging.',
    },
    {
      passageTitle: 'Incident facts — noise complaint',
      passage: 'Date: 11/02/2025. Time: 22:18. Location: 771 West 300 North. Complaint: loud music from backyard. Resident: agreed to lower volume. Warning given. No citation.',
      prompt: 'Write one sentence summarizing the complaint and resolution.',
      modelAnswer: 'On 11/02/2025 at 22:18 at 771 West 300 North, officers responded to loud backyard music, the resident lowered the volume after a warning, and no citation was issued.',
      explanation: 'Include time, address, issue, compliance, and no citation.',
    },
    {
      passageTitle: 'Incident facts — bicycle theft report',
      passage: 'Date: 12/05/2025. Time: 07:55. Location: 150 East 800 South bike rack. Victim: Priya Shah. Bicycle: red mountain bike, white helmet locked to rack, bike missing, lock cut. Serial provided. Report number assigned.',
      prompt: 'Write one sentence for the theft report.',
      modelAnswer: 'On 12/05/2025 at 07:55 at 150 East 800 South, Priya Shah reported her red mountain bike stolen from a bike rack after the lock was cut while her white helmet remained locked to the rack.',
      explanation: 'Capture victim, property, location, and lock cut detail.',
    },
    {
      passageTitle: 'Incident facts — assist motorist',
      passage: 'Date: 01/14/2026. Time: 05:32. Location: I-15 northbound near exit 305. Vehicle: blue minivan, flat tire, partially on shoulder. Driver: uninjured. Officer changed tire. Vehicle departed at 05:58.',
      prompt: 'Write one sentence describing the assist.',
      modelAnswer: 'On 01/14/2026 at 05:32 on I-15 northbound near exit 305, officers assisted an uninjured driver with a flat tire on a blue minivan and the vehicle left at 05:58.',
      explanation: 'Note location, issue, injury status, assistance, departure time.',
    },
    {
      passageTitle: 'Incident facts — trespass warning',
      passage: 'Date: 02/20/2026. Time: 13:10. Location: 300 West 2100 South, closed warehouse. Subject: adult female, asked to leave by manager. Prior warning on file from 01/05/2026. Subject left without arrest. New trespass letter issued.',
      prompt: 'Write one sentence documenting the trespass contact.',
      modelAnswer: 'On 02/20/2026 at 13:10 at 300 West 2100 South, an adult female was ordered to leave the closed warehouse, left without arrest, and received a new trespass letter after a prior warning on 01/05/2026.',
      explanation: 'Include prior warning, compliance, and new letter.',
    },
    {
      passageTitle: 'Incident facts — alarm response',
      passage: 'Date: 03/09/2026. Time: 02:44. Location: 455 Main Street, Ace Hardware. Alarm: rear door motion. Building: secure, no signs of entry. Keyholder: notified, en route ETA 20 minutes. Alarm reset.',
      prompt: 'Write one sentence summarizing the alarm response.',
      modelAnswer: 'On 03/09/2026 at 02:44 at 455 Main Street Ace Hardware, officers found the building secure with no entry after a rear door motion alarm and reset the alarm while the keyholder was en route.',
      explanation: 'State alarm type, secure building, keyholder status, reset.',
    },
  ];
  return scenarios.map((s, i) => ({
    ...s,
    passageTitle: `${s.passageTitle} (Form ${formId})`,
    prompt: `[Item ${i + 1}] ${s.prompt}`,
  }));
}

function buildExam(id, title) {
  const sections = SECTION_META.map((meta, sectionIndex) => {
    let questions;
    if (sectionIndex === 0) questions = mathBank(id);
    else if (sectionIndex === 1) questions = readingBank(id);
    else if (sectionIndex === 2) questions = grammarBank(id);
    else questions = writingBank(id);

    const baseNumber = [0, 20, 45, 65][sectionIndex];
    questions = questions.slice(0, meta.count).map((q, idx) => ({
      number: baseNumber + idx + 1,
      ...q,
    }));

    return {
      instructions: meta.instructions,
      minutes: meta.minutes,
      questions,
    };
  });

  return { id, title, sections };
}

const exams = [
  buildExam(1, 'Practice Exam I'),
  buildExam(2, 'Practice Exam II'),
  buildExam(3, 'Practice Exam III'),
];

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'exams.json'), JSON.stringify(exams));
console.log(`Wrote ${exams.length} exams (${exams[0].sections.reduce((n, s) => n + s.questions.length, 0)} items each) to data/exams.json`);
