import mongoose from 'mongoose';

const structureNodeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['library', 'floor', 'section', 'rack', 'shelf'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: null },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'StructureNode', default: null },
    capacity: { type: Number, default: null },
  },
  { timestamps: true }
);

structureNodeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = this._id.toString();
  if (obj.parent) obj.parent = obj.parent.toString();
  return obj;
};

const StructureNode = mongoose.model('StructureNode', structureNodeSchema);

export default StructureNode;