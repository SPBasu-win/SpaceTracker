const buckets = new Map();
export function rateLimit(maxRequests = 120, windowMs = 60_000) {
    return (req, res, next) => {
        const key = req.ip ?? "unknown";
        const now = Date.now();
        const bucket = buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        bucket.count += 1;
        if (bucket.count > maxRequests) {
            res.status(429).json({ error: "Too many requests" });
            return;
        }
        next();
    };
}
