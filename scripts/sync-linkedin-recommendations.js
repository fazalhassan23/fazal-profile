/**
 * scripts/sync-linkedin-recommendations.js
 * Automated sync script to fetch LinkedIn recommendations and merge them into portfolio-data.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_PATH = path.join(__dirname, '..', 'data', 'portfolio-data.json');
const LI_AT = process.env.LINKEDIN_LI_AT;
const PROFILE_ID = process.env.LINKEDIN_PROFILE_ID || 'fazalmahmudhassan';

console.log('--- Starting LinkedIn Recommendations Sync ---');

// 1. Read existing data
let rawData;
try {
  rawData = fs.readFileSync(DATA_PATH, 'utf8');
} catch (e) {
  console.error(`Error reading database file at ${DATA_PATH}:`, e);
  process.exit(1);
}

let portfolioData;
try {
  portfolioData = JSON.parse(rawData);
} catch (e) {
  console.error('Error parsing portfolio data JSON:', e);
  process.exit(1);
}

if (!portfolioData.recommendations) {
  portfolioData.recommendations = [];
}

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');

if (!LI_AT) {
  console.warn('[Warning] LINKEDIN_LI_AT environment variable is not defined.');
  console.warn('To automate this sync, add LINKEDIN_LI_AT to your GitHub secrets.');
  console.log('Exiting gracefully without modifications (working tree clean).');
  process.exit(0);
}

// 2. Fetch recommendations from LinkedIn Voyager API
// Voyager expects cookie: li_at=VALUE and JSESSIONID="ajax:VALUE" + csrf-token: "ajax:VALUE"
const csrfToken = 'ajax:12345678901234567';
const cookie = `li_at=${LI_AT}; JSESSIONID="${csrfToken}";`;

const options = {
  hostname: 'www.linkedin.com',
  path: `/voyager/api/identity/profiles/${PROFILE_ID}/recommendationsReceived?count=100`,
  method: 'GET',
  headers: {
    'Cookie': cookie,
    'Csrf-Token': csrfToken,
    'X-Restli-Protocol-Version': '2.0.0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

console.log(`Fetching recommendations for profile: ${PROFILE_ID}...`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`LinkedIn API returned status code ${res.statusCode}.`);
      console.error('Response body:', body.slice(0, 300));
      console.log('Check if your LINKEDIN_LI_AT cookie is valid and has not expired.');
      process.exit(1);
    }

    try {
      const payload = JSON.parse(body);
      const elements = payload.elements || [];
      console.log(`Successfully fetched ${elements.length} recommendations from LinkedIn.`);

      let newEntriesCount = 0;
      let duplicateCount = 0;

      elements.forEach(el => {
        const recommender = el.recommender || {};
        const author = `${recommender.firstName || ''} ${recommender.lastName || ''}`.trim();
        const text = el.text || '';
        const headline = recommender.occupation || '';
        const relationship = el.relationship || 'LinkedIn colleague';
        
        if (!author || !text) return;

        const exists = portfolioData.recommendations.some(r => {
          return r.author.toLowerCase() === author.toLowerCase() || 
                 r.text.substring(0, 50).toLowerCase() === text.substring(0, 50).toLowerCase();
        });

        if (exists) {
          duplicateCount++;
          return;
        }

        let dateStr = '';
        if (el.created) {
          try {
            const dateObj = new Date(el.created);
            const options = { year: 'numeric', month: 'long' };
            dateStr = dateObj.toLocaleDateString('en-US', options);
          } catch(err) {}
        }

        portfolioData.recommendations.push({
          id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          author: author,
          firstName: recommender.firstName || '',
          lastName: recommender.lastName || '',
          headline: headline,
          company: '',
          avatar: recommender.picture ? (recommender.picture.rootUrl || '') : '',
          linkedinUrl: recommender.publicIdentifier ? `https://linkedin.com/in/${recommender.publicIdentifier}` : '',
          relationship: relationship,
          date: dateStr,
          text: text,
          featured: false,
          visible: true
        });

        newEntriesCount++;
      });

      console.log(`Deduplication completed. Found ${newEntriesCount} new entries, ${duplicateCount} duplicates.`);

      if (newEntriesCount > 0) {
        if (isDryRun) {
          console.log('[Dry Run] Changes detected but not saved.');
        } else {
          fs.writeFileSync(DATA_PATH, JSON.stringify(portfolioData, null, 2), 'utf8');
          console.log(`Successfully updated ${DATA_PATH} with new recommendations.`);
        }
      } else {
        console.log('No new recommendations to import.');
      }

      console.log('--- Sync Completed Successfully ---');
      process.exit(0);

    } catch (e) {
      console.error('Failed to parse LinkedIn response body as JSON:', e);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('HTTPS Request Error:', err);
  process.exit(1);
});

req.end();
