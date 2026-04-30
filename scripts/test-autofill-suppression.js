#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js.html'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /function\s+hardenAddressAutofillSuppression\s*\(/.test(app),
  'App must define hardenAddressAutofillSuppression.'
);
assert(
  /#dynamic-form-input/.test(app) && /#dynamic-form-verifikasi/.test(app) && /#dynamic-form-sampel/.test(app) && /#dynamic-form-status/.test(app),
  'Autofill suppression must cover all workspace forms, not only the main search form.'
);
assert(
  /PERSON_OR_CONTACT_FIELD_IDS/.test(app) && /isBrowserAutofillRiskFieldId/.test(app),
  'Autofill suppression must include person/contact fields so Chrome does not infer address profiles.'
);
assert(
  /setAttribute\('name',\s*neutralName\)/.test(app),
  'Autofill suppression must keep neutral field names after render/hydration.'
);
assert(
  /setAttribute\('autocomplete',\s*risk \? 'new-password' : 'off'\)/.test(app),
  'Risky address/person/contact fields must use new-password autocomplete rather than address-friendly tokens.'
);
assert(
  /setAttribute\('readonly',\s*'readonly'\)/.test(app) && /removeAttribute\('readonly'\)/.test(app),
  'Risky fields must be temporarily readonly during programmatic hydration to avoid browser save-address prompts.'
);
assert(
  /const\s+browserAutocomplete\s*=\s*isBrowserAutofillRiskFieldId\(field\.id\) \? 'new-password' : 'off'/.test(app),
  'Generated controls must apply the same autofill suppression at render time.'
);
assert(
  /hardenAddressAutofillSuppression\(document,\s*\{\s*keepReadonly:\s*true\s*\}\)/.test(app),
  'Record hydration must keep risky fields readonly for the full programmatic fill window.'
);
assert(
  /const\s+suppressChangeEvent\s*=\s*isBrowserAutofillRiskFieldId\(fieldKey\)/.test(app) && /if\s*\(!suppressChangeEvent\)\s*\{\s*el\.dispatchEvent\(new Event\("change",\s*\{\s*bubbles:\s*true\s*\}\)\);\s*\}/.test(app),
  'Hydration must not dispatch synthetic change events for address/person/contact fields that trigger Chrome save-address prompts.'
);
assert(
  /function\s+releaseBrowserAutofillHydrationReadonly\s*\(/.test(app) && /releaseBrowserAutofillHydrationReadonly\(document,\s*650\)/.test(app),
  'Readonly guard must be released after hydration so fields stay editable after the Chrome prompt-risk window.'
);

console.log('PASS: browser address autofill/save prompt is suppressed for workspace forms and record hydration.');
