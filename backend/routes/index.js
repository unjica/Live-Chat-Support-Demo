import express from 'express';

const router = express.Router();

/**
 * HTTP health check: confirms the Express process is reachable.
 *
 * @param {import('express').Request} req - Incoming HTTP request.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
function healthCheck(req, res) {
  res.send('Socket.IO Server is up and running.');
}

router.get('/', healthCheck);

export default router;
