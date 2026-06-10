// components/booking/ServiceSelector.tsx
import { useState, useMemo } from 'react';
import { useServices } from '../../hooks/useServices';
import { useBookingFlowStore } from '../../stores/bookingFlowStore';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import type { Service } from '../../types';
import '..styles/layout/BookingStyles/ServiceSelector.css'

const CATEGORIES = ['All', 'Braiding', 'Natural Hair', 'Weaving', 'Loc Services', 'Treatments'];

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
  selected: boolean;
  onSelect: (service: Service) => void;
}

function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-pressed={selected}
      className={`service-card ${selected ? 'service-card--selected' : ''}`}
    >
      <div className="service-card__header">
        <span className="service-card__name">{service.name}</span>
        {service.category && (
          <Badge variant="neutral" size="sm">
            {service.category}
          </Badge>
        )}
      </div>

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
  const { data: services, isLoading, isError } = useServices();
  const { selectedService, setService } = useBookingFlowStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!services) return [];
    return services.filter((s) => {
      const matchesCategory =
        activeCategory === 'All' || s.category === activeCategory;
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, activeCategory, search]);

  const availableCategories = useMemo(() => {
    if (!services) return CATEGORIES;
    const found = new Set(services.map((s) => s.category).filter(Boolean));
    return ['All', ...CATEGORIES.slice(1).filter((c) => found.has(c))];
  }, [services]);

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

        <div className="service-selector__categories" role="tablist" aria-label="Filter by category">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`service-selector__cat-btn ${activeCategory === cat ? 'service-selector__cat-btn--active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="service-selector__empty">
          <p>No services match your search.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setActiveCategory('All'); }}
            className="btn btn--ghost btn--sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="service-selector__grid" role="listbox" aria-label="Select a service">
          {filtered.map((service) => (
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