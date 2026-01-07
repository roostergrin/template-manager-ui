import React, { useState } from 'react';
import Step3Standard from './Step3Standard';
import Step3Legacy from './Step3Legacy';
import './Step3Container.sass';

type Step3Tab = 'standard' | 'legacy';

const Step3Container: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Step3Tab>('standard');

  return (
    <div className="step3-container">
      <div className="step3-container__tabs">
        <button
          className={`step3-container__tab ${activeTab === 'standard' ? 'step3-container__tab--active' : ''}`}
          onClick={() => setActiveTab('standard')}
        >
          Standard
        </button>
        <button
          className={`step3-container__tab ${activeTab === 'legacy' ? 'step3-container__tab--active' : ''}`}
          onClick={() => setActiveTab('legacy')}
        >
          Legacy / Advanced
        </button>
      </div>

      <div className="step3-container__content">
        {activeTab === 'standard' ? <Step3Standard /> : <Step3Legacy />}
      </div>
    </div>
  );
};

export default Step3Container;
