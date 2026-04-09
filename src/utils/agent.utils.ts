import type { Request } from 'express';

export type SessionMetadata = {
    browser_agent: string;
    ip_address: string;
};

export function getSessionMetadata(req: Request): SessionMetadata {
    const userAgentHeader = req.headers['user-agent'];
    const forwardedForHeader = req.headers['x-forwarded-for'];

    const browserAgent =
        typeof userAgentHeader === 'string' && userAgentHeader.trim().length > 0
            ? userAgentHeader
            : 'unknown';

    const forwardedIp = Array.isArray(forwardedForHeader)
        ? forwardedForHeader[0]
        : forwardedForHeader;

    const ipAddress =
        typeof forwardedIp === 'string' && forwardedIp.trim().length > 0
            ? forwardedIp.split(',')[0].trim()
            : (req.ip ?? req.socket.remoteAddress ?? '0.0.0.0');

    return {
        browser_agent: browserAgent,
        ip_address: ipAddress,
    };
}
