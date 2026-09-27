import { useEffect, useState } from 'react';
import { Milestone, Map, Search, ArrowLeft, ArrowRight, ArrowLeftRight, Loader2, Layers } from 'lucide-react';
import { locationApi } from '../services/location';
import { Spinner } from '../components/common';
import './PillarMapPage.css';

const ARROW_ICON = {
  Left: ArrowLeft,
  Right: ArrowRight,
  'Left and Right': ArrowLeftRight,
};

const PillarMapPage = () => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [callNumber, setCallNumber] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    locationApi.map()
      .then((data) => {
        if (!mounted) return;
        setMapData(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    const value = callNumber.trim();
    if (!value) return;
    setResolving(true);
    setResolved(null);
    try {
      const result = await locationApi.resolve(value);
      setResolved(result);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="pillar-map-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner />
      </div>
    );
  }

  const pillars = mapData?.library_map
    ? Object.values(mapData.library_map).sort((a, b) => Number(a.pillar_number) - Number(b.pillar_number))
    : [];

  return (
    <div className="pillar-map-page">
      <div className="page-header">
        <h1>Physical Pillar Map</h1>
        <p>Pillars 1 - 13 signage used by the call number location mapper.</p>
      </div>

      <div className="pillar-map-resolver">
        <h3>
          <Search size={18} style={{ color: 'var(--primary)' }} />
          Resolve a Call Number
        </h3>
        <form onSubmit={handleResolve} className="pillar-map-resolver__form">
          <input
            type="text"
            placeholder="e.g. QD 453 .A23 or HF 5636 .A23"
            value={callNumber}
            onChange={(e) => setCallNumber(e.target.value)}
          />
          <button type="submit" className="pillar-map-resolver__btn" disabled={resolving || !callNumber.trim()}>
            {resolving ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
            Resolve
          </button>
        </form>
        {resolved && (
          <div className={`pillar-map-resolver__result ${resolved.mapped ? 'is-mapped' : 'is-unmapped'}`}>
            <strong className="pillar-map-resolver__call">{resolved.callNumber}</strong>
            <p>{resolved.text}</p>
            {resolved.mapped && (
              <div className="pillar-map-resolver__meta">
                <span>Pillar {resolved.pillar}</span>
                <span>Floor {resolved.floor}</span>
                <span>{resolved.prefix} - {resolved.subject}</span>
                {resolved.arrow && <span>{resolved.arrow} side</span>}
                {resolved.notes && <span>{resolved.notes}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
          <p>Something went wrong: {error}</p>
        </div>
      )}

      <div className="pillar-grid">
        {pillars.map((pillar) => {
          const subjects = pillar.subjects || [];
          return (
            <div className="pillar-card" key={pillar.pillar_number}>
              <div className="pillar-card__header">
                <Milestone size={18} />
                <span>
                  Pillar {pillar.pillar_number}
                </span>
                <span className="pillar-card__floor">
                  <Layers size={13} />
                  Floor {pillar.floor ?? 1}
                </span>
              </div>
              {pillar.notes && (
                <div className="pillar-card__notes">
                  <Map size={14} />
                  {pillar.notes}
                </div>
              )}
              {subjects.length === 0 && !pillar.notes && (
                <p className="pillar-card__empty">No subject signage on this pillar.</p>
              )}
              <ul className="pillar-card__subjects">
                {subjects.map((s, i) => {
                  const Icon = ARROW_ICON[s.arrow];
                  return (
                    <li key={`${s.prefix}-${s.subject}-${i}`}>
                      <div className="pillar-card__sign">
                        <span className="pillar-card__prefix">{s.prefix}</span>
                        <span className="pillar-card__subject">{s.subject}</span>
                        {s.notes && <span className="pillar-card__subject-note">({s.notes})</span>}
                      </div>
                      {Icon && (
                        <span className={`pillar-card__arrow ${s.arrow === 'Left' ? 'pillar-card__arrow--left' : ''}`} title={`Books on the ${s.arrow} side`}>
                          <Icon size={14} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PillarMapPage;