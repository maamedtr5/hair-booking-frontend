import { useState } from 'react';
import { Navigation, MapPin, Bus } from 'lucide-react';
import { useSalonLocation } from '../hooks/useSettings';
import { Spinner } from './ui/Spinner';

/** Builds a Google Maps "directions to" URL. Uses precise lat/lng for the
 * destination when the admin has set them, falling back to a text-address
 * search otherwise (still works, just less pinpoint-accurate). Only
 * includes an origin if we actually have one — Google Maps handles "no
 * origin" gracefully by asking the person where they're coming from. */
function buildDirectionsUrl(opts: {
  destAddress: string;
  destLat: number | null;
  destLng: number | null;
  originLat?: number;
  originLng?: number;
}): string {
  const destination =
    opts.destLat !== null && opts.destLng !== null
      ? `${opts.destLat},${opts.destLng}`
      : opts.destAddress;
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  });
  if (opts.originLat !== undefined && opts.originLng !== undefined) {
    params.set('origin', `${opts.originLat},${opts.originLng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Keyless embed — works without a Google Cloud API key/billing, which is
// the right trade-off for a small business site, but it's an
// unofficial/undocumented endpoint rather than the supported Maps Embed
// API. If Google ever changes it, swap this for the Embed API + a key.
function buildEmbedSrc(address: string, lat: number | null, lng: number | null): string {
  const q = lat !== null && lng !== null ? `${lat},${lng}` : address;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

// Moovit's own documented format for a "directions to my business" link
// (see moovit.com/developers/links/): https://moovit.com/?to=<address>&tll=<lat>_<lng>
// Omits metroId — Moovit's docs show it as part of the format, but it's
// a numeric city ID I don't have a verified value for, and a wrong guess
// there risks pointing the trip planner at the wrong city entirely. The
// coordinates (when set) should be enough for Moovit to resolve the
// right metro area on their own; address-only still works the same way
// their own "search in the To field" flow does, just less precise.
function buildMoovitUrl(address: string, lat: number | null, lng: number | null): string {
  const params = new URLSearchParams({ to: address, lang: 'en' });
  if (lat !== null && lng !== null) params.set('tll', `${lat}_${lng}`);
  return `https://moovit.com/?${params.toString()}`;
}

export function GettingHere() {
  const { data: location, isLoading } = useSalonLocation();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Only ever requested on a click, never on page load — asking for
  // location automatically is both bad practice and the kind of thing
  // browsers increasingly block outright.
  function handleDirectionsFromHere() {
    if (!location) return;
    if (!('geolocation' in navigator)) {
      window.open(buildDirectionsUrl({ destAddress: location.address, destLat: location.latitude, destLng: location.longitude }), '_blank', 'noopener');
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        window.open(
          buildDirectionsUrl({
            destAddress: location.address,
            destLat: location.latitude,
            destLng: location.longitude,
            originLat: pos.coords.latitude,
            originLng: pos.coords.longitude,
          }),
          '_blank',
          'noopener',
        );
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location — opening directions without it instead.");
        window.open(buildDirectionsUrl({ destAddress: location.address, destLat: location.latitude, destLng: location.longitude }), '_blank', 'noopener');
      },
      { timeout: 8000 },
    );
  }

  if (isLoading) return null;
  // Nothing set up yet — don't show a half-empty section on the public
  // site before the admin has entered a real address.
  if (!location?.address) return null;

  return (
    <section className="getting-here container">
      <h2 className="section-title">Getting Here</h2>

      <div className="getting-here__grid">
        <div className="getting-here__map">
          <iframe
            title="Map to Locs Allure"
            src={buildEmbedSrc(location.address, location.latitude, location.longitude)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="getting-here__info">
          <p className="getting-here__address">
            <MapPin size={16} strokeWidth={1.75} />
            {location.address}
          </p>

          <div className="getting-here__actions">
            <button
              type="button"
              className="btn btn--gold btn--sm"
              onClick={handleDirectionsFromHere}
              disabled={locating}
            >
              {locating ? <Spinner size="sm" color="espresso" /> : <Navigation size={14} />}
              {locating ? 'Finding you…' : 'Directions from my location'}
            </button>
            <a
              className="btn btn--ghost btn--sm"
              href={buildMoovitUrl(location.address, location.latitude, location.longitude)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Bus size={14} />
              Plan a trotro/bus route
            </a>
          </div>
          {geoError && <p className="getting-here__geo-error">{geoError}</p>}

          {location.gettingHereNotes && (
            <div className="getting-here__notes">
              {location.gettingHereNotes.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
