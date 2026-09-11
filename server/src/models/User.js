import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['student', 'staff', 'librarian', 'admin'],
      default: 'student',
    },
    staffType: {
      type: String,
      enum: ['teaching', 'non-teaching'],
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
    },
    mustChangePassword: { type: Boolean, default: false },
    matric_number: { type: String, trim: true, default: null },
    department: { type: String, trim: true, default: null },
    level: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    profileImage: { type: String, default: null },
    staffNumber: { type: String, trim: true, default: null },
    title: { type: String, trim: true, default: null },
    faculty: { type: String, trim: true, default: null },
    identityInfo: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const { password: _password, __v, ...safe } = this.toObject();
  safe.id = this._id.toString();
  return safe;
};

const User = mongoose.model('User', userSchema);

export default User;