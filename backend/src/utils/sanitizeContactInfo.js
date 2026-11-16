const REDACTED_CONTACT = '[contato ocultado]';

const EMAIL_PATTERN =
  /\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+\b/gi;

const OBFUSCATED_EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|\{at\}|\s+at\s+)\s*[A-Z0-9-]+(?:\s*(?:\[dot\]|\(dot\)|\{dot\}|\s+dot\s+)\s*[A-Z0-9-]+)+\b/gi;

const PHONE_PATTERN =
  /(?<!\d)(?:\+\s?\d{1,3}[\s().-]?)?(?:\(?\d{2,3}\)?[\s().-]?)?\d{4,5}[\s.-]?\d{4}(?!\d)/g;

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>()\[\]{}"']+/gi;

const DOMAIN_PATTERN =
  /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>()\[\]{}"']*)?/gi;

const SOCIAL_HANDLE_PATTERN =
  /(?<![\w.+-])@[a-z0-9_][a-z0-9_.-]{1,30}\b/gi;

const SOCIAL_PROFILE_PATTERN =
  /\b(?:instagram|insta|telegram|discord|linkedin|facebook|twitter|tiktok|skype|snapchat)\s*[:=]\s*@?[a-z0-9][a-z0-9_.-]{1,30}\b/gi;

function replaceUrl(match) {
  const trailingPunctuation = match.match(/[.,!?;:]+$/)?.[0] || '';
  return `${REDACTED_CONTACT}${trailingPunctuation}`;
}

function sanitizeContactInfo(message) {
  if (typeof message !== 'string') {
    throw new TypeError('A mensagem deve ser um texto.');
  }

  return message
    .replace(EMAIL_PATTERN, REDACTED_CONTACT)
    .replace(OBFUSCATED_EMAIL_PATTERN, REDACTED_CONTACT)
    .replace(PHONE_PATTERN, match => {
      const digitCount = match.replace(/\D/g, '').length;
      return digitCount >= 10 && digitCount <= 15
        ? REDACTED_CONTACT
        : match;
    })
    .replace(SOCIAL_PROFILE_PATTERN, REDACTED_CONTACT)
    .replace(SOCIAL_HANDLE_PATTERN, REDACTED_CONTACT)
    .replace(URL_PATTERN, replaceUrl)
    .replace(DOMAIN_PATTERN, replaceUrl);
}

module.exports = sanitizeContactInfo;
