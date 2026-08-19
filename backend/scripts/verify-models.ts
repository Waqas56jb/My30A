import { env } from '../src/config/env.js';
import { verifyOpenAiModel } from '../src/integrations/openai/openai.js';

const result = await verifyOpenAiModel();
console.log(JSON.stringify({ configured: env.OPENAI_MODEL, ...result }, null, 2));
if (!result.ok) process.exit(2);
