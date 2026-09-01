const fs = require('fs');
const file = 'c:\\Users\\fazal\\.gemini\\antigravity\\scratch\\Fazal-portfolio\\js\\admin.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /onclick="window\.([a-zA-Z0-9]+)\(([^)]+)\)"/g;

content = content.replace(regex, (match, fnName, args) => {
    let newArgs = args.replace(/['"]/g, '');
    let argPairs = newArgs.split(',').map((a, i) => data-arg=" + '"').join(' ');
    return data-action="" ;
});

// Add a global click handler at the very end of initAdminApp
content = content.replace(/}\s*\/\/\s*end initAdminApp/, 
  // Global event delegation for list actions
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const arg0 = btn.getAttribute('data-arg0');
    const arg1 = btn.getAttribute('data-arg1');
    
    if (action && typeof window[action] === 'function') {
        const parsedArg0 = isNaN(arg0) ? arg0 : parseInt(arg0, 10);
        const parsedArg1 = isNaN(arg1) ? arg1 : parseInt(arg1, 10);
        if (arg1 !== null) {
             window[action](parsedArg0, parsedArg1);
        } else if (arg0 !== null) {
             window[action](parsedArg0);
        } else {
             window[action]();
        }
    }
  });
} // end initAdminApp);

fs.writeFileSync(file, content);
console.log('Done replacement');
