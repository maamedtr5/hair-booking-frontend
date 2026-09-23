import { useState, useMemo } from 'react';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useBookingFlowStore } from '../../store/bookingFlowStore';
import { Spinner } from '../ui/Spinner';
import type { Service } from '../../types';


function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface ServiceCardProps {
  service: Service;
  categoryName?: string;
  selected: boolean;
  onSelect: (service: Service) => void;
}

function ServiceCard({ service, categoryName, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-pressed={selected}
      className={`service-card ${selected ? 'service-card--selected' : ''}`}
    >
      <div className="service-card__header">
        <span className="service-card__name">{service.name}</span>
      </div>

      {categoryName && <span className="cat-badge" style={{ marginBottom: 8 }}>{categoryName}</span>}

      {service.description && (
        <p className="service-card__description">{service.description}</p>
      )}

      <div className="service-card__meta">
        <span className="service-card__price">{formatPrice(service.price)}</span>
        <span className="service-card__duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatDuration(service.duration)}
        </span>
      </div>

      {selected && (
        <div className="service-card__check" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ServiceSelector() {
  const { data: categories, isLoading, isError } = useServiceCategories();
  const { selectedService, setService } = useBookingFlowStore();
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Categories the client can actually book from right now: active, with
  // at least one active service in them.
  const bookableCategories = useMemo(
    () => (categories ?? []).filter((c) => (c.services ?? []).length > 0),
    [categories],
  );

  // Default to the first category (or the one the currently-selected
  // service belongs to) once categories load. Computed during render
  // (React's documented pattern for state derived from other state)
  // rather than in an effect — it only fires once, since activeCategoryId
  // is non-null on every render after this one.
  if (activeCategoryId === null && bookableCategories.length > 0) {
    const preferred = selectedService
      ? bookableCategories.find((c) => c.id === selectedService.categoryId)
      : undefined;
    setActiveCategoryId((preferred ?? bookableCategories[0]).id);
  }

  const isSearching = search.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return bookableCategories.flatMap((cat) =>
      (cat.services ?? [])
        .filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
        .map((s) => ({ service: s, categoryName: cat.name })),
    );
  }, [bookableCategories, search, isSearching]);

  const activeCategory = bookableCategories.find((c) => c.id === activeCategoryId);

  if (isLoading) {
    return (
      <div className="service-selector__loading">
        <Spinner size="lg" />
        <p>Loading services…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="service-selector__error">
        <p>Unable to load services. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="service-selector">
      <div className="service-selector__toolbar">
        <div className="service-selector__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search services"
            className="service-selector__search-input"
          />
        </div>
      </div>

      {!isSearching && bookableCategories.length > 1 && (
        <div className="service-selector__tabs" role="tablist" aria-label="Service categories">
          {bookableCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={cat.id === activeCategoryId}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`service-selector__tab ${cat.id === activeCategoryId ? 'service-selector__tab--active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {!isSearching && activeCategory?.description && (
        <p className="service-selector__category-desc">{activeCategory.description}</p>
      )}

      {isSearching ? (
        searchResults.length === 0 ? (
          <div className="service-selector__empty">
            <p>No services match your search.</p>
            <button type="button" onClick={() => setSearch('')} className="btn btn--ghost btn--sm">
              Clear search
            </button>
          </div>
        ) : (
          <div className="service-selector__grid" role="listbox" aria-label="Select a service">
            {searchResults.map(({ service, categoryName }) => (
              <ServiceCard
                key={service.id}
                service={service}
                categoryName={categoryName}
                selected={selectedService?.id === service.id}
                onSelect={setService}
              />
            ))}
          </div>
        )
      ) : bookableCategories.length === 0 ? (
        <div className="service-selector__empty">
          <p>No services are available for booking right now.</p>
        </div>
      ) : (
        <div className="service-selector__grid" role="listbox" aria-label="Select a service">
          {(activeCategory?.services ?? []).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedService?.id === service.id}
              onSelect={setService}
            />
          ))}
        </div>
      )}

      {selectedService && (
        <div className="service-selector__summary" aria-live="polite">
          <span>Selected:</span>
          <strong>{selectedService.name}</strong>
          <span className="service-selector__summary-price">
            {formatPrice(selectedService.price)}
          </span>
          <span className="service-selector__summary-dur">
            {formatDuration(selectedService.duration)}
          </span>
        </div>
      )}
    </div>
  );
}
