import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import './Public.css';

const contactInfo = [
  { icon: MapPin, title: 'Address', lines: ['Abia State University, Uturu', 'Abia State, Nigeria'] },
  { icon: Phone, title: 'Phone', lines: ['+234 (0) 800 123 4567', '+234 (0) 803 456 7890'] },
  { icon: Mail, title: 'Email', lines: ['library@absu.edu.ng', 'support@absu.edu.ng'] },
  { icon: Clock, title: 'Opening Hours', lines: ['Mon - Fri: 8:00 AM - 9:00 PM', 'Sat: 10:00 AM - 6:00 PM'] },
];

const Contact = () => {
  const showToast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast('Please fill in your name, email, and message.', 'error');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      showToast('Your message has been sent. We will get back to you shortly.', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>Contact Us</h1>
        <p>We would love to hear from you. Reach out to the ABSU Smart Library team.</p>
      </div>

      <div className="about-content" style={{ marginBottom: '2rem' }}>
        {contactInfo.map((item) => {
          const Icon = item.icon;
          return (
            <div className="about-card" key={item.title}>
              <h2>
                <Icon size={20} />
                {item.title}
              </h2>
              {item.lines.map((line) => (
                <p key={line} style={{ margin: 0 }}>
                  {line}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      <div className="about-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={20} />
          Send us a Message
        </h2>
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-form-row">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              icon={Mail}
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              icon={Mail}
            />
          </div>
          <Input
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="What is this about?"
          />
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="input-label">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write your message here..."
              rows={6}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <Button type="submit" disabled={sending}>
              <Send size={18} />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;