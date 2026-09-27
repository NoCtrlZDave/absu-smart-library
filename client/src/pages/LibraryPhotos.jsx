import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Image as ImageIcon, Upload, Trash2, Save as SaveIcon,
  DoorOpen, Layers, Milestone, Loader2, MapPin, Info,
} from 'lucide-react';
import { Button, Spinner } from '../components/common';
import { locationApi } from '../services/location';
import { mediaApi } from '../services/media';
import { useToast } from '../components/common/useToast';
import './LibraryPhotos.css';

const SLOT_GROUPS = [
  { key: 'entrance', kind: 'entrance', label: 'Main Entrance', icon: DoorOpen },
  { key: 'floors', kind: 'floor', label: 'Floors', icon: Layers },
  { key: 'pillars', kind: 'pillar', label: 'Pillars', icon: Milestone },
];

const buildSlots = (mapData) => {
  const media = mapData?.media || {};
  const holes = [];

  if (media.entrance) {
    holes.push({ key: 'entrance', kind: 'entrance', label: 'Main Entrance', caption: media.entrance.caption || 'ABSU Library main entrance', image: media.entrance.image || '' });
  }

  Object.entries(media.floors || {}).forEach(([num, val]) => {
    holes.push({ key: `floor:${num}`, kind: 'floor', label: `Floor ${num}`, caption: val.caption || `Floor ${num}`, image: val.image || '' });
  });

  Object.keys(media.pillars || {})
    .sort((a, b) => Number(a) - Number(b))
    .forEach((num) => {
      const val = media.pillars[num] || {};
      holes.push({ key: `pillar:${num}`, kind: 'pillar', label: `Pillar ${num}`, caption: val.caption || `Pillar ${num}`, image: val.image || '' });
    });

  return holes;
};

const PhotoSlot = ({ slot, onRefresh }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [caption, setCaption] = useState(slot.caption || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCaption(slot.caption || '');
    setFile(null);
    setPreview(null);
  }, [slot.key, slot.caption]);

  const handlePick = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    setFile(picked);
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target.result);
    reader.readAsDataURL(picked);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const form = new FormData();
      if (file) form.append('image', file);
      if (caption.trim()) form.append('caption', caption.trim());
      if (!file && !caption.trim()) {
        toast('Choose a photo or enter a caption first', 'error');
        return;
      }
      await mediaApi.update(slot.key, form);
      toast(`${slot.label} photo saved`, 'success');
      onRefresh();
    } catch (err) {
      toast(err.message || 'Failed to save photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await mediaApi.remove(slot.key);
      toast(`${slot.label} photo removed`, 'success');
      onRefresh();
    } catch (err) {
      toast(err.message || 'Failed to remove photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const display = preview || slot.image;
  const hasSavedImage = Boolean(slot.image);
  const pending = Boolean(file);

  return (
    <div className="photo-slot">
      <div className="photo-slot__preview" onClick={() => inputRef.current?.click()}>
        {display ? (
          <img src={display} alt={slot.label} />
        ) : (
          <div className="photo-slot__placeholder">
            <ImageIcon size={32} />
            <span>No photo yet</span>
          </div>
        )}
        {pending && <span className="photo-slot__pending">New</span>}
        {!pending && !!display && !hasSavedImage && <span className="photo-slot__pending">Preview</span>}
      </div>

      <div className="photo-slot__body">
        <div className="photo-slot__label">{slot.label}</div>
        <div className="photo-slot__key">{slot.key}</div>

        <input
          className="photo-slot__caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Photo caption"
        />

        <div className="photo-slot__actions">
          <Button variant="outline" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload size={16} />
            Choose
          </Button>
          <Button type="button" onClick={handleSave} disabled={uploading} loading={uploading}>
            {uploading ? <Loader2 size={16} className="spin" /> : <SaveIcon size={16} />}
            Save
          </Button>
          {hasSavedImage && (
            <Button variant="outline" type="button" onClick={handleRemove} disabled={uploading} className="photo-slot__danger">
              <Trash2 size={16} />
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

const LibraryPhotos = ({ basePath = '/librarian' }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    locationApi.map()
      .then((data) => setMapData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const slots = useMemo(() => buildSlots(mapData), [mapData]);

  return (
    <div className="photos-page">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign(`${basePath}/dashboard`))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="page-header">
        <h1>Library Photos</h1>
        <p>Upload the photos shown in the step-by-step book location guide — the entrance, each floor and every pillar sign.</p>
      </div>

      <div className="photos-note">
        <Info size={18} />
        <span>
          These photos appear automatically in the “Get step-by-step directions” guide on every mapped book. Cover the
          same space as the “Photo coming soon” placeholders. Photos are saved to the cloud and apply across the whole
          library.
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Spinner />
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
          <p>Something went wrong: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {SLOT_GROUPS.map((group) => {
            const groupSlots = slots.filter((s) => s.kind === group.kind);
            if (!groupSlots.length) return null;
            const Icon = group.icon;
            return (
              <div className="content-card" key={group.key}>
                <h2 className="photos-section-title">
                  <Icon size={18} style={{ color: 'var(--primary)' }} />
                  {group.label}
                  <span className="photos-section-count">{groupSlots.length}</span>
                </h2>
                <div className="photo-grid">
                  {groupSlots.map((slot) => (
                    <PhotoSlot key={slot.key} slot={slot} onRefresh={load} />
                  ))}
                </div>
              </div>
            );
          })}

<div className="photos-footer">
            <MapPin size={16} />
            <span>
              Tip: skip choosing a photo and just edit a caption — it saves without touching the picture.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default LibraryPhotos;