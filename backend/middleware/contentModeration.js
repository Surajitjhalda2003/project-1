const { cloudinary } = require('../config/cloudinary');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Content Moderation — powered by Sightengine (FREE tier: 500 ops/day)
 * Sign up FREE at: https://sightengine.com/
 * Add SIGHTENGINE_USER and SIGHTENGINE_SECRET to your .env
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Blocks: fully nude, semi-nude, partial nudity, very suggestive, lingerie,
 *         cleavage, female underwear, erotica, offensive content, gore/violence
 *
 * Images → /1.0/check.json  (synchronous)
 * Videos → /1.0/video/check.json + polling (async)
 */

// ── Evaluate nudity/offensive/gore scores from Sightengine response ─────────
const evaluateResult = (data) => {
  const n = data.nudity || {};

  // Log all scores so you can tune thresholds in your server console
  console.log('[ContentModeration] Nudity scores:', JSON.stringify(n));
  console.log('[ContentModeration] Offensive:', data.offensive?.prob, '| Gore:', data.gore?.prob);

  const sc = n.suggestive_classes || {};

  const isNude =
    // ── Hard explicit content ──────────────────────────────────────────────
    (n.raw               || 0) > 0.20 ||   // fully nude
    (n.sexual_activity   || 0) > 0.20 ||   // sexual act
    (n.erotica           || 0) > 0.20 ||   // erotica
    // ── Semi-nude / partial ───────────────────────────────────────────────
    (n.partial           || 0) > 0.20 ||   // partial nudity (semi-nude)
    (n.very_suggestive   || 0) > 0.20 ||   // very suggestive
    (n.suggestive        || 0) > 0.35 ||   // general suggestive
    // ── Suggestive sub-classes (nudity-2.0 model) ─────────────────────────
    (sc.lingerie         || 0) > 0.25 ||   // lingerie
    (sc.female_underwear || 0) > 0.25 ||   // underwear
    (sc.male_underwear   || 0) > 0.40 ||
    (sc.cleavage         || 0) > 0.40 ||   // exposed cleavage
    (sc.bikini           || 0) > 0.50 ||   // bikini/swimwear
    (sc.male_chest       || 0) > 0.70 ||   // shirtless male
    // ── Catch-all: low "safe" score means something is wrong ─────────────
    (n.safe !== undefined && (n.safe || 0) < 0.50);

  const isOffensive = (data.offensive?.prob || 0) > 0.60;
  const isGore      = (data.gore?.prob      || 0) > 0.60;

  if (isNude || isOffensive || isGore) {
    const reasons = [];
    if (isNude)      reasons.push('nudity or explicit content');
    if (isOffensive) reasons.push('offensive or vulgar content');
    if (isGore)      reasons.push('graphic violence');
    return { safe: false, reason: reasons.join(', ') };
  }

  return { safe: true };
};

// ── Image moderation (synchronous) ──────────────────────────────────────────
const checkImageSafety = async (imageUrl, apiUser, apiSecret) => {
  const params = new URLSearchParams({
    url:        imageUrl,
    models:     'nudity-2.0,offensive,gore',
    api_user:   apiUser,
    api_secret: apiSecret,
  });

  const response = await fetch(
    `https://api.sightengine.com/1.0/check.json?${params}`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (!response.ok) {
    console.error(`[ContentModeration] Sightengine image HTTP ${response.status}`);
    return { safe: true };
  }

  const data = await response.json();
  console.log('[ContentModeration] Full image API response:', JSON.stringify(data));

  if (data.status !== 'success') {
    console.error('[ContentModeration] Sightengine image error:', data);
    return { safe: true };
  }

  return evaluateResult(data);
};

// ── Video moderation (async with polling) ───────────────────────────────────
const checkVideoSafety = async (videoUrl, apiUser, apiSecret) => {
  const submitParams = new URLSearchParams({
    stream_url: videoUrl,
    models:     'nudity-2.0,offensive,gore',
    api_user:   apiUser,
    api_secret: apiSecret,
  });

  const submitResponse = await fetch(
    `https://api.sightengine.com/1.0/video/check.json?${submitParams}`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (!submitResponse.ok) {
    console.error(`[ContentModeration] Sightengine video submit HTTP ${submitResponse.status}`);
    return { safe: true };
  }

  const submitData = await submitResponse.json();
  console.log('[ContentModeration] Video submit response:', JSON.stringify(submitData));

  if (submitData.status !== 'success' || !submitData.request?.id) {
    console.error('[ContentModeration] Sightengine video submit error:', submitData);
    return { safe: true };
  }

  const requestId = submitData.request.id;
  console.log(`[ContentModeration] Video scan submitted — request id: ${requestId}`);

  // Poll for results — max 90 seconds
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const pollParams = new URLSearchParams({
      request_id: requestId,
      api_user:   apiUser,
      api_secret: apiSecret,
    });

    const pollResponse = await fetch(
      `https://api.sightengine.com/1.0/video/get-frames.json?${pollParams}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!pollResponse.ok) continue;

    const pollData = await pollResponse.json();

    if (pollData.status === 'failure') {
      console.error('[ContentModeration] Video scan failed:', pollData);
      return { safe: true };
    }

    if (pollData.status === 'success' && pollData.data?.frames?.length > 0) {
      console.log(`[ContentModeration] Video done — ${pollData.data.frames.length} frames scanned`);
      for (const frame of pollData.data.frames) {
        const result = evaluateResult(frame);
        if (!result.safe) {
          console.log(`[ContentModeration] Flagged at ${frame.offset}s: ${result.reason}`);
          return result;
        }
      }
      return { safe: true };
    }

    console.log(`[ContentModeration] Still processing... (attempt ${attempt + 1}/30)`);
  }

  console.warn('[ContentModeration] Video scan timed out — allowing upload');
  return { safe: true };
};

// ── Main entry point ─────────────────────────────────────────────────────────
const checkContentSafety = async (mediaUrl, resourceType = 'image') => {
  const SIGHTENGINE_USER   = process.env.SIGHTENGINE_USER;
  const SIGHTENGINE_SECRET = process.env.SIGHTENGINE_SECRET;

  if (!SIGHTENGINE_USER || !SIGHTENGINE_SECRET) {
    console.warn('[ContentModeration] ⚠️  Sightengine credentials missing — skipping scan.');
    return { safe: true };
  }

  try {
    if (resourceType === 'video') {
      return await checkVideoSafety(mediaUrl, SIGHTENGINE_USER, SIGHTENGINE_SECRET);
    }
    return await checkImageSafety(mediaUrl, SIGHTENGINE_USER, SIGHTENGINE_SECRET);
  } catch (err) {
    console.error('[ContentModeration] Scan error:', err.message);
    return { safe: true };
  }
};

// ── Delete rejected asset from Cloudinary ────────────────────────────────────
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[ContentModeration] Deleted rejected asset: ${publicId}`);
  } catch (err) {
    console.error('[ContentModeration] Cloudinary delete failed:', err.message);
  }
};

module.exports = { checkContentSafety, deleteFromCloudinary };
