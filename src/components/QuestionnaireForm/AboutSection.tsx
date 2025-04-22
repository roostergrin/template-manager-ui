import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface AboutSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({ formData, handleChange }) => (
  <div className="about-section">
    <h3 className="about-section__header">About Page Details</h3>
    <div className="about-section__group">
      <label>Practice Mission Statement</label>
      <textarea name="missionStatement" value={formData.missionStatement || ''} onChange={handleChange} />
    </div>
    <div className="about-section__group">
      <label>Doctor's Personal Statement / Philosophy</label>
      <textarea name="doctorPhilosophy" value={formData.doctorPhilosophy || ''} onChange={handleChange} />
    </div>
    <div className="about-section__group">
      <label>Team Member Names & Roles</label>
      <textarea name="teamMembers" value={formData.teamMembers || ''} onChange={handleChange} />
    </div>
    <div className="about-section__group">
      <label>Community Involvement / Charity Work</label>
      <textarea name="communityInvolvement" value={formData.communityInvolvement || ''} onChange={handleChange} />
    </div>
    <div className="about-section__group">
      <label>Reuse Doctor & Staff Images from Current Site?</label>
      <div>
        <label>
          <input type="radio" name="reuseImages" value="yes" checked={formData.reuseImages === 'yes'} onChange={handleChange} /> Yes
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="reuseImages" value="no" checked={formData.reuseImages === 'no'} onChange={handleChange} /> No
        </label>
      </div>
    </div>
    <div className="about-section__group">
      <label>Upload New Doctor & Staff Headshots</label>
      <input type="file" name="headshots" multiple />
    </div>
    <div className="about-section__group">
      <label>Upload Office Photos (Tour)</label>
      <input type="file" name="officePhotos" multiple />
    </div>
  </div>
);

export default AboutSection; 