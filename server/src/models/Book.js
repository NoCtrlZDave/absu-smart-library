import mongoose from 'mongoose';

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

bookSchema.pre('save', function (next) {
  if (this.copies && this.copies.length) {
    const loc = this.copies[0].location || this.location;
    this.location = loc;
  }
  this.locationString = buildLocationString(this.location || {});
  this.copies.forEach((c) => {
    if (!c.locationString) c.locationString = buildLocationString(c.location || this.location);
  });
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
  const availableCopies = (obj.copies || []).filter((c) => c.status === 'available').length;
  obj.totalCopies = totalCopies;
  obj.availableCopies = availableCopies;
  obj.available = availableCopies > 0;
  obj.author = obj.authors && obj.authors.length ? obj.authors.join(', ') : 'Unknown Author';
  if (!obj.location) obj.location = { library: 'Main Library' };
  obj.locationString = obj.locationString || buildLocationString(obj.location);
  obj.copies = (obj.copies || []).map((c) => ({
    ...c,
    id: c.code || c._id.toString(),
  }));
  return obj;
};

const Book = mongoose.model('Book', bookSchema);

export default Book;