/**
 * Deep-merges new i18n keys (nav extras, missing home keys, discovery copy)
 * into jekyll/i18n/*.json. Safe to re-run.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'jekyll', 'i18n');

function deepMerge(a, b) {
    if (b === undefined) return a;
    if (Array.isArray(b) || Array.isArray(a)) return b;
    if (b && typeof b === 'object' && a && typeof a === 'object') {
        const out = Object.assign({}, a);
        Object.keys(b).forEach((key) => {
            out[key] = key in a ? deepMerge(a[key], b[key]) : b[key];
        });
        return out;
    }
    return b;
}

const CITY_SLUGS = [
    'boston', 'washington-dc', 'orlando', 'atlanta', 'houston', 'los-angeles',
    'san-francisco', 'new-haven', 'ann-arbor', 'berkeley', 'denver', 'other-us-cities'
];

const AUDIENCE_IDS = [
    'middle-school', 'high-school', 'college', 'adult-professional',
    'international-students', 'other-groups'
];

const GROUP_IDS = [
    'school-groups', 'educational-tours', 'international-groups',
    'academic-programs', 'college-groups', 'professional-groups'
];

/* Shared English source for discovery copy. */
const EN = {
    nav: {
        exploreLabel: 'Explore',
        changeLanguage: 'Change language',
        changeLanguageCurrent: 'Change language, current language {name}',
        primary: 'Primary navigation'
    },
    home: {
        hero: {
            benefitSafeTitle: 'Safe',
            benefitSafeText: 'Low-voltage electronics and safety gear provided'
        },
        planWorkshop: {
            location: 'Location',
            locationPlaceholder: 'Select a location',
            workshops: 'Workshop',
            workshopAi: 'AI',
            workshopRobotics: 'Robotics',
            workshopMechanical: 'Mechanical',
            workshopWebsite: 'Web',
            groupSize: 'Group size',
            timing: 'Date'
        }
    },
    discovery: {
        ui: {
            sectionHeading: 'Find Your',
            sectionHeadingAccent: 'Workshop',
            sectionIntro: 'Explore by city, participants, workshop, or program',
            destinations: 'Destinations',
            destinationsSubtitle: 'Where is your group headed?',
            participants: 'Participants',
            participantsSubtitle: 'Who will take part?',
            workshops: 'Workshops',
            workshopsSubtitle: 'What will they experience?',
            program: 'Program',
            programSubtitle: 'What are you planning?',
            other: 'Other',
            backLabel: 'Find Your Workshop',
            planHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
            planCopy: 'Share your destination, group details, and schedule. Stage One will help plan the workshop.',
            engineeringWorkshops: 'Engineering Workshops',
            engineeringWorkshopsColon: 'Engineering Workshops:',
            engineeringWorkshopsFor: 'Engineering Workshops for',
            workshopsOfferedIn: 'Workshops Offered in',
            availableForTheseAges: 'Available for These Ages',
            ages: 'Ages',
            browseAllPrograms: 'Browse all programs',
            browseAllAges: 'Browse all ages and group types',
            programs: 'Programs',
            thingsToDo: 'Things to do',
            locationExploreIntro: 'Popular educational, cultural, and iconic experiences for student groups visiting',
            locationExploreDisclaimer: 'Nearby experiences are shown for itinerary inspiration only and are not included with Stage One workshops. Admission, transportation, reservations, and availability must be arranged separately. Inclusion does not imply affiliation or endorsement.',
            explorePrefix: 'Explore',
            exploreMore: 'Explore More',
            contactUs: 'Contact Us',
            madeWithLove: 'Made with <span class="discovery-page-footer__heart" aria-hidden="true">🧡</span> for curious minds',
            workshopCities: 'Workshop cities',
            siteFooter: 'Site footer',
            scrollQuotesLeft: 'Scroll quotes left',
            scrollQuotesRight: 'Scroll quotes right',
            viewMoreFeedback: 'View more participant feedback',
            participantFeedback: 'Participant Feedback',
            testimonialsHeading: 'What Groups Say',
            workshopDetailLabel: 'Explore the full workshop',
            planModalLede: 'Share your contact details and a few notes about your group. We’ll follow up to plan the workshop.',
            formName: 'Name <span aria-hidden="true">*</span>',
            formEmail: 'Email <span aria-hidden="true">*</span>',
            formGroupNotes: 'What should we know about your group?',
            formNotesPlaceholder: 'Tell us about your group, location, time of year, and anything else we should know.',
            formSend: 'Send Workshop Details',
            formNameError: 'Enter your name.',
            formEmailError: 'Enter a valid email.'
        },
        city: {
            boston: {
                intro: 'Boston offers an exceptional combination of American history, leading academic institutions, science, robotics, and technology. Founded in Boston, Stage One adds a locally connected engineering experience that fits naturally between campus visits, museum stops, and historic sightseeing.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Boston program.',
                testimonialsHeading: 'What Groups in Boston, MA Say'
            },
            'washington-dc': {
                intro: 'Washington, DC itineraries are rich in history, government, museums, national institutions, science, and aviation. A Stage One workshop adds a refreshing hands-on block to sightseeing-heavy schedules and works especially well as an engaging indoor or evening program with a clear educational purpose.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Washington, DC program.',
                testimonialsHeading: 'What Groups in Washington, DC Say'
            },
            orlando: {
                intro: 'Orlando connects themed entertainment with space exploration, simulation technology, leading institutions, environmental science, and outdoor Florida experiences. Stage One gives planners a strong educational anchor between attraction days or during an evening hotel block, adding meaningful STEM programming without another complicated transfer.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Orlando program.',
                testimonialsHeading: 'What Groups in Orlando, FL Say'
            },
            atlanta: {
                intro: 'Atlanta itineraries bring together civil rights history, leading institutions, business, and modern technology. Stage One adds an active engineering experience that balances campus visits and sightseeing while giving planners a complete educational program delivered directly to the group’s venue.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Atlanta program.',
                testimonialsHeading: 'What Groups in Atlanta, GA Say'
            },
            houston: {
                intro: 'Houston is one of the country’s strongest destinations for space exploration, aerospace, medicine, energy, and large-scale engineering. Stage One carries that theme beyond museums and attractions with a complete hands-on workshop that can be scheduled at the group’s hotel, campus, or meeting venue.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Houston program.',
                testimonialsHeading: 'What Groups in Houston, TX Say'
            },
            'los-angeles': {
                intro: 'Los Angeles brings together aerospace, entertainment, digital media, design, and technology in a way few destinations can match. Stage One connects those industries through a workshop that combines technical thinking with creativity and pairs naturally with studio experiences, science attractions, and visits to leading institutions.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Los Angeles program.',
                testimonialsHeading: 'What Groups in Los Angeles, CA Say'
            },
            'san-francisco': {
                intro: 'San Francisco places technology, entrepreneurship, science, and design at the center of the destination. Stage One complements innovation-focused visits, science attractions, leading institutions, and iconic city touring with a complete hands-on workshop delivered directly to the group’s venue.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your San Francisco program.',
                testimonialsHeading: 'What Groups in San Francisco, CA Say'
            },
            'new-haven': {
                intro: 'New Haven offers a distinctive academic setting shaped by prestigious institutions, research, and intellectual discovery. A Stage One workshop takes the itinerary beyond a traditional campus tour by adding a complete engineering experience that strengthens the trip’s college, career, and STEM focus.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your New Haven program.',
                testimonialsHeading: 'What Groups in New Haven, CT Say'
            },
            'ann-arbor': {
                intro: 'Ann Arbor’s academic culture, engineering community, and focus on research make it a natural destination for STEM-oriented travel. A Stage One workshop adds a substantial hands-on component after an institutional visit or during an open hotel block, with instructors, equipment, and materials included.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Ann Arbor program.',
                testimonialsHeading: 'What Groups in Ann Arbor, MI Say'
            },
            berkeley: {
                intro: 'Berkeley is known for bold ideas, academic discovery, and its connection to the wider Bay Area innovation economy. A Stage One workshop extends that theme through a hands-on engineering experience that fits naturally after an institutional visit or as an engaging afternoon or evening program.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Berkeley program.',
                testimonialsHeading: 'What Groups in Berkeley, CA Say'
            },
            denver: {
                intro: 'Denver combines aerospace, science, outdoor exploration, and the dramatic setting of the Rocky Mountain region. A Stage One workshop provides a strong indoor academic component before or after an outdoor excursion, attraction visit, or institutional tour, while also giving planners a dependable weather-independent activity.',
                ctaHeading: 'Ready to Add Hands-On Engineering to Your Itinerary?',
                ctaCopy: 'Share your dates, group size, and venue. Stage One will coordinate a workshop around your Denver program.',
                testimonialsHeading: 'What Groups in Denver, CO Say'
            },
            'other-us-cities': {
                intro: 'Stage One workshops are not limited to our current destinations. We work with groups to deliver complete hands-on engineering programs in cities across the United States, giving planners a flexible way to add meaningful STEM programming wherever their groups are traveling.',
                ctaHeading: 'Tell Us Where Your Group Is Headed',
                ctaCopy: 'Share your destination, dates, and group size. Stage One will help determine workshop delivery options for your trip.',
                testimonialsHeading: 'What Groups Say',
                exploreHeading: 'Bringing Stage One to Your Destination',
                exploreIntro: 'Planning a student program in another U.S. city? Share your destination, dates, and group size, and our team will help you explore available workshop options.'
            }
        },
        audience: {
            'middle-school': {
                label: 'Middle School',
                intro: 'Middle school students do real engineering from the first minute. Structured guidance, clear explanations, and regular hands-on milestones keep every student actively involved — no previous experience required.'
            },
            'high-school': {
                label: 'High School',
                intro: 'High school groups explore practical engineering through team-based challenges, technical discussion, design decisions, and hands-on problem-solving. Instructors adjust the depth to the group’s experience.'
            },
            college: {
                label: 'College and University',
                intro: 'College and university groups move at a faster pace with greater emphasis on applied engineering, collaboration, and technical decision-making. The workshop complements academic travel, campus programs, and group events.'
            },
            'adult-professional': {
                label: 'Adult / Professional',
                intro: 'Adult and professional groups take part in a practical, collaborative engineering experience designed for active participation — a refreshing alternative to conventional team events and professional programs.'
            },
            'international-students': {
                label: 'International Students',
                intro: 'Stage One works closely with tour providers, schools, and group leaders bringing international students to the United States. The workshop adds a genuine American engineering experience to the group’s U.S. itinerary.'
            },
            'other-groups': {
                label: 'Other',
                intro: 'Mixed ages, families, community organizations, camps, scouts, or something entirely different — Stage One instructors adjust pacing, team structure, and guidance so participants with different experience levels can contribute to the same hands-on challenge.'
            }
        },
        group: {
            'school-groups': {
                label: 'School Group',
                intro: 'Bring a complete engineering experience to your students — at your school or wherever your group travels. Stage One delivers the instructor, equipment, materials, and curriculum, and handles setup and cleanup.'
            },
            'educational-tours': {
                label: 'Educational Tour',
                intro: 'Stage One partners with educational tour companies across the United States. The workshop is a turn-key program block: we deliver the complete experience to the group’s hotel or venue, on the schedule your itinerary needs.'
            },
            'international-groups': {
                label: 'International Student Group',
                intro: 'For international groups traveling through the United States, Stage One adds a distinctive American STEM experience without complicating the itinerary. We bring the instructors, equipment, materials, and complete workshop directly to the group’s hotel, school, campus, or meeting venue, making it easy to schedule around sightseeing, institutional visits, attraction days, and travel.'
            },
            'academic-programs': {
                label: 'Academic Program',
                intro: 'Academic and enrichment programs use Stage One workshops as ready-made engineering experiences — complete with instructor, equipment, materials, and curriculum.'
            },
            'college-groups': {
                label: 'College Group',
                intro: 'Student organizations, orientation programs, honors cohorts, and campus events use Stage One workshops as engaging, substantive group experiences delivered right on campus or at the group’s venue.'
            },
            'professional-groups': {
                label: 'Adult / Professional Group',
                intro: 'Give your team or adult group a genuinely different shared experience: three hours of collaborative, hands-on engineering led by a professional engineer, delivered to your office, conference venue, or hotel.'
            }
        }
    }
};

const extrasPath = path.join(__dirname, 'discovery-extras.json');
const extrasMorePath = path.join(__dirname, 'discovery-extras-more.json');
const extras = Object.assign(
    {},
    JSON.parse(fs.readFileSync(extrasPath, 'utf8')),
    fs.existsSync(extrasMorePath) ? JSON.parse(fs.readFileSync(extrasMorePath, 'utf8')) : {}
);

const langs = ['en', 'es', 'pt-BR', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr', 'de', 'it'];

langs.forEach((lang) => {
    const file = path.join(DIR, lang + '.json');
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));
    const patch = lang === 'en' ? EN : extras[lang];
    if (!patch) {
        console.error('no extras for', lang);
        process.exit(1);
    }
    const merged = deepMerge(current, patch);
    fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
    console.log('updated', lang);
});

function flatten(node, prefix, out) {
    Object.keys(node).forEach((key) => {
        if (key === '_readme') return;
        const full = prefix ? prefix + '.' + key : key;
        const value = node[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, full, out);
        } else {
            out.add(full);
        }
    });
}

const enKeys = new Set();
flatten(JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8')), '', enKeys);
CITY_SLUGS.forEach((slug) => {
    ['intro', 'ctaHeading', 'ctaCopy', 'testimonialsHeading'].forEach((field) => {
        const key = 'discovery.city.' + slug + '.' + field;
        if (!enKeys.has(key)) console.warn('missing', key);
    });
});
AUDIENCE_IDS.forEach((id) => {
    ['label', 'intro'].forEach((field) => {
        const key = 'discovery.audience.' + id + '.' + field;
        if (!enKeys.has(key)) console.warn('missing', key);
    });
});
GROUP_IDS.forEach((id) => {
    ['label', 'intro'].forEach((field) => {
        const key = 'discovery.group.' + id + '.' + field;
        if (!enKeys.has(key)) console.warn('missing', key);
    });
});
