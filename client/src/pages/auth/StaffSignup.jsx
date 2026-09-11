import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Camera, Upload, GraduationCap, Briefcase } from 'lucide-react';
import { Button, Input, Select } from '../../components/common';
import { useAuth } from '../../context/useAuth';
import { authApi } from '../../services/auth';
import './Auth.css';

const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Engr.', 'Rev.', 'Chief'];
const STAFF_TYPES = [
  { value: 'teaching', label: 'Teaching Staff' },
  { value: 'non-teaching', label: 'Non-Teaching Staff' },
];

const StaffSignup = () => {
  const navigate = useNavigate();
  const { registerStaff } = useAuth();
  const fileRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    staffType: 'teaching',
    title: '',
    staffNumber: '',
    department: '',
    faculty: '',
    identityInfo: '',
    password: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (formData.staffType === 'teaching') {
      if (!formData.staffNumber) newErrors.staffNumber = 'Staff number is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.faculty) newErrors.faculty = 'Faculty is required';
    }
    if (!formData.identityInfo) newErrors.identityInfo = 'Please confirm your identity';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setUploading(true);
    try {
      let profileImageUrl = '';
      if (profileImage) {
        const fd = new FormData();
        fd.append('image', profileImage);
        const pic = await authApi.uploadPicture(fd);
        profileImageUrl = pic?.url || '';
      }

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        staffType: formData.staffType,
        profileImage: profileImageUrl,
        title: formData.staffType === 'teaching' ? formData.title : undefined,
        staffNumber: formData.staffType === 'teaching' ? formData.staffNumber : undefined,
        department: formData.department,
        faculty: formData.staffType === 'teaching' ? formData.faculty : undefined,
        identityInfo: formData.identityInfo,
      };

      const result = await registerStaff(payload);
      if (result.success) {
        navigate('/staff/pending');
      } else {
        setErrors({ general: result.error });
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <h1>Staff Account</h1>
          <p>
            Register with your official details. Your account stays {`"pending"`} until an
            administrator verifies your identity.
          </p>
        </div>

        {errors.general && <div className="auth-error-banner">{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <Input
              label="First name"
              name="firstName"
              placeholder="e.g. Kelechi"
              value={formData.firstName}
              onChange={handleChange}
              icon={UserPlus}
              error={errors.firstName}
            />
          </div>
          <div className="form-row">
            <Input
              label="Last name"
              name="lastName"
              placeholder="e.g. Eze"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />
          </div>
          <div className="form-row">
            <Input
              label="Official email"
              name="email"
              type="email"
              placeholder="you@absu.edu.ng"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
          </div>

          <div className="form-row">
            <label className="input-label">Staff type</label>
            <div className="staff-type-group">
              {STAFF_TYPES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  className={`staff-type-chip ${formData.staffType === st.value ? 'staff-type-chip--active' : ''}`}
                  onClick={() => {
                    setFormData((p) => ({ ...p, staffType: st.value }));
                    if (errors.staffType) setErrors((p) => ({ ...p, staffType: '' }));
                  }}
                >
                  {st.value === 'teaching' ? <GraduationCap size={16} /> : <Briefcase size={16} />}
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="input-label">Profile picture</label>
            <div className="photo-upload-row">
              <div className="photo-preview">{preview ? <img src={preview} alt="preview" /> : <Camera size={22} />}</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              <div>
                <Button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                  <Upload size={15} /> {preview ? 'Change picture' : 'Upload picture'}
                </Button>
                <p className="input-helper" style={{ marginTop: '0.35rem' }}>
                  A clear photo helps the administrator verify you.
                </p>
              </div>
            </div>
          </div>

          {formData.staffType === 'teaching' && (
            <>
              <div className="form-row">
                <Select
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  options={TITLES.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div className="form-row">
                <Input
                  label="Staff number"
                  name="staffNumber"
                  placeholder="e.g. ABSU/STAFF/0042"
                  value={formData.staffNumber}
                  onChange={handleChange}
                  error={errors.staffNumber}
                />
              </div>
              <div className="form-row">
                <Input
                  label="Department"
                  name="department"
                  placeholder="e.g. Food Science & Technology"
                  value={formData.department}
                  onChange={handleChange}
                  error={errors.department}
                />
              </div>
              <div className="form-row">
                <Input
                  label="Faculty"
                  name="faculty"
                  placeholder="e.g. College of Physical Sciences"
                  value={formData.faculty}
                  onChange={handleChange}
                  error={errors.faculty}
                />
              </div>
            </>
          )}

          <div className="form-row">
            <label className="input-label">Identity confirmation</label>
            <textarea
              className="textarea-field"
              name="identityInfo"
              placeholder="Briefly state how we can confirm your identity, e.g. staff number on issued identity card, office, department head..."
              value={formData.identityInfo}
              onChange={handleChange}
            />
            {errors.identityInfo && <span className="input-error">{errors.identityInfo}</span>}
          </div>

          <div className="form-row">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
          </div>
          <div className="form-row">
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
          </div>

          <Button type="submit" className="btn-primary" disabled={loading || uploading}>
            {loading ? (uploading ? 'Uploading picture...' : 'Creating account...') : 'Create Account'}
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="forgot-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffSignup;