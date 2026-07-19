# Deutsch Sprint AI function

This folder is the secure proxy between the public website and Qwen. Never put a DashScope API key in `ai-config.js` or any browser file.

## Deploy target

Create a Node.js HTTP function in Alibaba Cloud Function Compute, upload `index.cjs`, and use `index.handler` as the entry point. Configure the environment variables from `.env.example` in the Function Compute console.

Set `ALLOWED_ORIGIN` to the exact website origin. The function handles `POST` and `OPTIONS` requests. After deployment, copy only the public function URL into `ai-config.js` as `endpoint`.

## Production safeguards

- Add API gateway or WAF rate limits before allowing anonymous public traffic.
- Browser Origin checks are a CORS control, not user authentication.
- Add login and persistent storage before offering cross-device learning records.
- Keep request logs free of raw student text unless the user has explicitly agreed to retention.

