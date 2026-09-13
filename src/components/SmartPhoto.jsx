import { useEffect, useState } from 'react';
import { getPhotoUrl, hasPhoto } from '../utils/photos';

/**
 * SmartPhoto — displays the canonical public-domain NASA/ESA photograph of a
 * body (via Wikimedia Commons), with a loading shimmer and a graceful
 * procedural fallback if the network image can't load.
 *
 * Handles the classic cached-image race: browsers may finish loading an
 * image before React attaches onLoad, so we also check `el.complete` in a
 * ref callback and remount the <img> whenever the body changes.
 *
 * props:
 *   name      — body name (looked up in the photo map)
 *   className — extra classes for the wrapper
 *   width     — requested thumbnail width (px)
 *   caption   — show "NASA/ESA" credit line
 *   iconSize  — emoji fallback size (px)
 */
export default function SmartPhoto({
  name,
  className = '',
  width = 640,
  caption = false,
  iconSize = 44,
}) {
  const real = hasPhoto(name);
  const [state, setState] = useState(real ? 'loading' : 'fallback'); // loading | ok | fallback

  // Reset when the body changes
  useEffect(() => {
    setState(real ? 'loading' : 'fallback');
  }, [name, real]);

  const imgRef = (el) => {
    // Fires synchronously on mount — catches images already decoded from cache
    if (el && el.complete && el.naturalWidth > 0) {
      setState('ok');
    }
  };

  return (
    <div className={`smart-photo ${className}`} data-state={state}>
      {real && (
        <img
          key={name}
          ref={imgRef}
          src={getPhotoUrl(name, width)}
          alt={name}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ok')}
          onError={() => setState('fallback')}
        />
      )}
      {state !== 'ok' && (
        <div className="smart-photo-fallback" aria-hidden>
          <span className="smart-photo-orb" style={{ fontSize: iconSize }}>
            {name === 'Sun' ? '☀️' : name === 'Moon' ? '🌙' : '🪐'}
          </span>
        </div>
      )}
      {caption && state === 'ok' && (
        <span className="smart-photo-credit">NASA / ESA / JHUAPL — Wikimedia Commons</span>
      )}
    </div>
  );
}

/** Compact photo thumb used in result rows / cards. */
export function PhotoThumb({ name }) {
  return <SmartPhoto name={name} className="photo-thumb" width={160} iconSize={20} />;
}
