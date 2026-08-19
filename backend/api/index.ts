import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import express from 'express';
import { createApp } from '../src/app.js';

export const config = { maxDuration: 10 };

function boot(): Express {
  try {
    return createApp();
  } catch (error) {
    const app = express();
    const body = {
      status: 'crash',
      service: 'my30a-host-backend',
      message: error instanceof Error ? error.message : String(error),
    };
    app.use((_req, res) => {
      res.status(500).json(body);
    });
    return app;
  }
}

const app = boot();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  app(req, res);
}
