const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const config = require('../config/env');

let cwClient = null;
let sequenceToken = null;
let logQueue = [];
let isFlushing = false;

// Sensitive keys that must be redacted from all log output
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'rawtoken', 'tokenhash', 'secret',
  'masterkey', 'dek', 'key', 'wrappeddek', 'authorization', 'cookie'
]);

function sanitize(obj, depth = 0) {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('token') || lower.includes('secret')) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitize(v, depth + 1);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

if (config.aws.cloudWatch.enabled) {
  try {
    const cwConfig = { region: config.aws.region };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      cwConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    cwClient = new CloudWatchLogsClient(cwConfig);
    console.log(`[CLOUDWATCH] Initialized client for log group: ${config.aws.cloudWatch.logGroup} in region ${config.aws.region}`);
  } catch (err) {
    console.warn(`[CLOUDWATCH WARNING] Could not initialize CloudWatch client: ${err.message}. Falling back to console logging.`);
  }
}

async function flushCloudWatchLogs() {
  if (!cwClient || logQueue.length === 0 || isFlushing) return;
  isFlushing = true;
  const batch = logQueue.splice(0, 25);

  try {
    const events = batch.map(item => ({
      timestamp: item.timestamp,
      message: JSON.stringify(item.payload),
    }));

    const command = new PutLogEventsCommand({
      logGroupName: config.aws.cloudWatch.logGroup,
      logStreamName: config.aws.cloudWatch.logStream,
      logEvents: events,
      sequenceToken: sequenceToken,
    });

    const response = await cwClient.send(command);
    sequenceToken = response.nextSequenceToken;
  } catch (err) {
    // If stream or group doesn't exist, attempt creation
    if (err.name === 'ResourceNotFoundException') {
      try {
        try {
          await cwClient.send(new CreateLogGroupCommand({ logGroupName: config.aws.cloudWatch.logGroup }));
        } catch (lgErr) {
          if (lgErr.name !== 'ResourceAlreadyExistsException') {
            // Log group creation ignored if already exists
          }
        }

        await cwClient.send(new CreateLogStreamCommand({
          logGroupName: config.aws.cloudWatch.logGroup,
          logStreamName: config.aws.cloudWatch.logStream,
        }));
      } catch (createErr) {
        // Stream creation error
      }
    } else if (err.name === 'InvalidSequenceTokenException' && err.expectedSequenceToken) {
      sequenceToken = err.expectedSequenceToken;
    }
  } finally {
    isFlushing = false;
  }
}

function log(level, message, metadata = {}) {
  const timestamp = Date.now();
  const safeMeta = sanitize(metadata);
  const payload = {
    timestamp: new Date(timestamp).toISOString(),
    level,
    message,
    ...safeMeta,
  };

  const formattedMsg = `[${payload.timestamp}] [${level.toUpperCase()}] ${message} ${
    Object.keys(safeMeta).length > 0 ? JSON.stringify(safeMeta) : ''
  }`;

  if (level === 'error') {
    console.error(formattedMsg);
  } else if (level === 'warn') {
    console.warn(formattedMsg);
  } else {
    console.log(formattedMsg);
  }

  if (cwClient) {
    logQueue.push({ timestamp, payload });
    if (logQueue.length >= 10) {
      flushCloudWatchLogs().catch(() => {});
    }
  }
}

// Periodically flush CloudWatch logs if enabled
if (config.aws.cloudWatch.enabled) {
  setInterval(() => {
    flushCloudWatchLogs().catch(() => {});
  }, 5000).unref();
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  security: (msg, meta) => log('security', msg, meta),
  sanitize,
};
