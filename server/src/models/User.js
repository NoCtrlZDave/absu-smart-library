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
      enum: [
        'visitor',
        'guest',
        'student',
        'staff',
        'librarian',
        'assistant_librarian',
        'it_librarian',
        'circulation_staff',
        'admin',
      ],
      default: 'student',
    },
    matricNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    staffId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    permissions: [{ type: String, trim: true }],
    department: { type: String, trim: true, default: null },
    faculty: { type: String, trim: true, default: null },
    programme: { type: String, trim: true, default: null },
    level: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    profileImage: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    activationToken: { type: String, default: null, select: false },
    activationExpiresAt: { type: Date, default: null, select: false },
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
  const {
    password: _password,
    activationToken: _activationToken,
    activationExpiresAt: _activationExpiresAt,
    __v,
    ...safe
  } = this.toObject();
  safe.id = this._id.toString();
  return safe;
};

const User = mongoose.model('User', userSchema);

export default User;
