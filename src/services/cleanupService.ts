import SessionBuild from '../models/sessionBuild';
import CachedQuery from '../models/cachedQuery';

export async function cleanupExpiredSessions(): Promise<void> {
    const now = new Date();

    const result = await SessionBuild.deleteMany({ expiresAt: { $lt: now } });

    console.log(`🗑️ Deleted ${result.deletedCount} expired sessions`);
}

export async function cleanupOldCachedQueries() {
    const result = await CachedQuery.deleteMany({
        timestamp: { $lt: new Date(Date.now() - (24 * 60 * 60 * 1000)) } // 24 hours
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old cached queries`);
}