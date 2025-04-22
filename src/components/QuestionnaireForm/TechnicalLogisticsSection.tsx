import React from 'react';
import { QuestionnaireData } from './QuestionnaireForm';

interface TechnicalLogisticsSectionProps {
  formData: QuestionnaireData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TechnicalLogisticsSection: React.FC<TechnicalLogisticsSectionProps> = ({ formData, handleChange }) => (
  <div className="technical-logistics-section">
    <h3 className="technical-logistics-section__header">Technical Logistics</h3>
    <div className="technical-logistics-section__group">
      <label>Who Manages Your DNS?</label>
      <input type="text" name="dnsManager" value={formData.dnsManager || ''} onChange={handleChange} />
    </div>
    <div className="technical-logistics-section__group">
      <label>Have You Delegated DNS Access to Rooster Grin?</label>
      <div>
        <label>
          <input type="radio" name="delegatedDns" value="yes" checked={formData.delegatedDns === 'yes'} onChange={handleChange} /> Yes
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="delegatedDns" value="no" checked={formData.delegatedDns === 'no'} onChange={handleChange} /> No
        </label>
      </div>
    </div>
    <div className="technical-logistics-section__group">
      <label>Google Analytics Property ID</label>
      <input type="text" name="googleAnalyticsId" value={formData.googleAnalyticsId || ''} onChange={handleChange} />
    </div>
    <div className="technical-logistics-section__group">
      <label>Do You Run Google Ads Landing Pages?</label>
      <div>
        <label>
          <input type="radio" name="googleAdsLandingPages" value="yes" checked={formData.googleAdsLandingPages === 'yes'} onChange={handleChange} /> Yes
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="googleAdsLandingPages" value="no" checked={formData.googleAdsLandingPages === 'no'} onChange={handleChange} /> No
        </label>
      </div>
    </div>
  </div>
);

export default TechnicalLogisticsSection; 