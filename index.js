// =============================================================================
// Security Hardening — Input Validation, Error Sanitization, Security Constants
// =============================================================================

/** Security constants */
const MAX_INPUT_LENGTH = 4096;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ADDRESS_LENGTH = 64;
const SOLANA_PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SENSITIVE_PATTERNS = /(?:api[_-]?key|secret|password|token|auth|credential|private[_-]?key)/i;

/** Sanitize error objects to prevent information leakage */
function sanitizeError(error) {
  const msg = error instanceof Error ? error.message : String(error);
  return msg
    .replace(/\/[^\s:]+/g, '[path]')
    .replace(/at\s+.+\(.*\)/g, '[internal]')
    .replace(SENSITIVE_PATTERNS, '[redacted]')
    .replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, '[REDACTED_KEY]')
    .slice(0, 500);
}

/** Validate and sanitize string input */
function validateStringInput(value, maxLen = MAX_INPUT_LENGTH, field = 'input') {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  if (value.length > maxLen) throw new Error(`${field} exceeds maximum length`);
  return value.trim();
}

/** Validate Solana wallet address */
function validateWalletAddress(address) {
  const trimmed = String(address).trim();
  if (trimmed.length > MAX_ADDRESS_LENGTH) throw new Error('Address too long');
  if (!SOLANA_PUBKEY_RE.test(trimmed)) throw new Error('Invalid Solana address');
  return trimmed;
}

/** Validate chat message */
function validateMessage(msg) {
  if (typeof msg !== 'string') throw new Error('Message must be a string');
  const trimmed = msg.trim();
  if (trimmed.length === 0) throw new Error('Message must not be empty');
  if (trimmed.length > MAX_MESSAGE_LENGTH) throw new Error('Message too long');
  return trimmed.replace(/<[^>]*>/g, '');
}

// =============================================================================
// Application
// =============================================================================

import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = Buffer;

import { registerRootComponent } from "expo";
import App from "./client/App";

registerRootComponent(App);
