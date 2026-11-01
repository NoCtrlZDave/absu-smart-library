import mongoose from 'mongoose';
import { getPhysicalLocation, getLocationByCategory, deriveLocationFromCategory } from '../services/locationMapper.js';
import { generateAccessionNumber } from '../services/accessions.js';
import StructureNode from './StructureNode.js';

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sectionLabelFor = async (guide, fallback) => {
  if (!guide || guide.pillar == null) return fallback;
  const pillar = Number(guide.pillar);
  const subject = guide.subject ? String(guide.subject).trim() : null;
  try {
    let node = null;
    if (subject) {
      node = await StructureNode.findOne({
        type: 'section',
        pillars: pillar,
        name: { $regex: new RegExp(`^${escapeRegExp(subject)}$`, 'i') },
      });
    }
    if (!node) node = await StructureNode.findOne({ type: 'section', pillars: pillar }).sort({ name: 1 });
    return node ? node.name : fallback;
  } catch {
    return fallback;
  }
};

const copySchema = new mongoose.Schema(
  {
    code: { type: String, default: null },
    accessionNumber: { type: String, default: null },
    callNumber: { type: String, default: null },
    copyNumber: { type: String, default: null },
    status: {
      type: String,
      enum: ['available', 'borrowed', 'reserved', 'missing', 'damaged', 'misplaced', 'verified'],
      default: 'available',
    },
    borrower: { type: String, default: null },
    dueDate: { type: String, default: null },
    reservedBy: { type: String, default: null },
    reservedUntil: { type: Date, default: null },
    location: {
      library: { type: String, default: 'Main Library' },
      floor: { type: String, default: null },
      section: { type: String, default: null },
      rack: { type: String, default: null },
      shelf: { type: String, default: null },
    },
    locationString: { type: String, default: null },
    detectedLocation: { type: String, default: null },
    rfidTag: { type: String, default: null },
    condition: { type: String, default: 'good' },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, default: null },
    edition: { type: String, default: null },
    authors: [{ type: String, trim: true }],
    isbn: { type: String, trim: true, index: true },
    publisher: { type: String, default: null },
    placeOfPublication: { type: String, default: null },
    year: { type: Number, default: null },
    category: { type: String, default: 'General', index: true },
    department: { type: String, default: null },
    ddcNumber: { type: String, default: null, index: true },
    description: { type: String, default: null },
    subjects: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],
    physicalDescription: { type: String, default: null },
    notes: [{ type: String }],
    format: { type: String, default: null },
    coverImage: { type: String, default: null },
    snippet: { type: String, default: null },

    cataloguing: {
      cataloguedBy: { type: String, default: null },
      cataloguedDate: { type: String, default: null },
      checkedBy: { type: String, default: null },
      checkedDate: { type: String, default: null },
      originalCataloguing: { type: Boolean, default: false },
      cip: { type: String, default: null },
      tracings: [{ type: String }],
      crossReferences: [{ type: String }],
    },

    location: {
      library: { type: String, default: 'Main Library' },
      floor: { type: String, default: null },
      section: { type: String, default: null },
      rack: { type: String, default: null },
      shelf: { type: String, default: null },
    },
    locationString: { type: String, default: null },

    copies: [copySchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

bookSchema.index({ title: 'text', publisher: 'text' });

bookSchema.pre('save', async function (next) {
  for (const copy of this.copies || []) {
    if (!copy.accessionNumber) {
      copy.accessionNumber = await generateAccessionNumber();
    }
    if (!copy.code) {
      copy.code = copy.accessionNumber;
    }
    const copyLoc = copy.location || {};
    if (!copyLoc.rack && !copyLoc.shelf && !copyLoc.floor && !copyLoc.section) {
      const byCall = getPhysicalLocation(copy.callNumber);
      const derived = deriveLocationFromCategory(
        this.category,
        copyLoc.library || this.location?.library || 'Main Library'
      );
      if (byCall.mapped) {
        copy.location = {
          ...copyLoc,
          floor: `Floor ${byCall.floor || 1}`,
          section: await sectionLabelFor(byCall, byCall.subject || null),
          rack: null,
          shelf: null,
        };
      } else if (derived) {
        copy.location = {
          ...copyLoc,
          ...derived,
          section: await sectionLabelFor(derived.physicalLocation || derived, derived.section || null),
        };
      }
    }
    if (!copy.locationString) copy.locationString = buildLocationString(copy.location || this.location);
  }

  const bookLoc = this.location || {};
  if (!bookLoc.rack && !bookLoc.shelf && !bookLoc.floor && !bookLoc.section) {
    const derived = deriveLocationFromCategory(this.category, bookLoc.library || 'Main Library');
    if (derived) {
      this.location = {
        ...bookLoc,
        ...derived,
        section: await sectionLabelFor(derived.physicalLocation || derived, derived.section || null),
      };
    }
  }

  if (this.copies && this.copies.length) {
    this.location = this.copies[0].location || this.location;
  }
  this.locationString = buildLocationString(this.location || {});
  next();
});

function buildLocationString(loc) {
  if (!loc) return null;
  const parts = [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

bookSchema.methods.toCatalogueJSON = function () {
  const obj = this.toObject();
  obj.id = this._id.toString();
  const totalCopies = (obj.copies || []).length;
  const copies = obj.copies || [];
  const countStatus = (status) => copies.filter((c) => c.status === status).length;
  const availableCopies = countStatus('available') + countStatus('verified');
  const reservedCopies = countStatus('reserved');
  const borrowedCopies = countStatus('borrowed');
  obj.totalCopies = totalCopies;
  obj.availableCopies = availableCopies;
  obj.reservedCopies = reservedCopies;
  obj.borrowedCopies = borrowedCopies;
  obj.damagedCopies = countStatus('damaged');
  obj.missingCopies = countStatus('missing');
  obj.misplacedCopies = countStatus('misplaced');
  obj.unavailableCopies = totalCopies - availableCopies - reservedCopies - borrowedCopies;
  obj.available = availableCopies > 0;
  obj.author = obj.authors && obj.authors.length ? obj.authors.join(', ') : 'Unknown Author';
  if (!obj.location) obj.location = { library: 'Main Library' };
  obj.locationString = obj.locationString || buildLocationString(obj.location);
  const categoryGuide = getLocationByCategory(obj.category);
  obj.copies = (obj.copies || []).map((c) => {
    const byCall = getPhysicalLocation(c.callNumber);
    return {
      ...c,
      id: c.code || c._id.toString(),
      physicalLocation: byCall.mapped ? byCall : categoryGuide,
    };
  });
  obj.physicalLocation = obj.copies.length ? obj.copies[0].physicalLocation : categoryGuide;
  return obj;
};

const Book = mongoose.model('Book', bookSchema);

export default Book;