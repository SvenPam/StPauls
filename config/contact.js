// The contact form: shown only when Site settings hold a whole Web3Forms key.
const KEY = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// The key exactly as saved, or '' when it is anything else (a stray space, the whole snippet, part of a key).
export function contactKey(settings) {
  const key = settings?.contact_access_key;
  return typeof key === 'string' && KEY.test(key) ? key : '';
}

// The enquiry types without blanks, or one type so the required select can always be answered.
export function enquiryTypes(settings) {
  const types = (Array.isArray(settings?.enquiry_types) ? settings.enquiry_types : []).filter((t) => typeof t === 'string' && t.trim());
  return types.length ? types : ['General Enquiry'];
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('contactKey', contactKey);
  eleventyConfig.addFilter('enquiryTypes', enquiryTypes);
}
