import React from 'react';
import GithubFileUpdater from '../components/GithubFileUpdater';

const GithubFileUpdaterDemo: React.FC = () => {
  const handleUpdateComplete = (response: any) => {
    console.log('File update completed:', response);
    // You can add additional logic here, like showing notifications
  };

  return (
    <div className="github-file-updater-demo">
      <div className="github-file-updater-demo__container">
        <header className="github-file-updater-demo__header">
          <h1>GitHub File Updater</h1>
          <p>Update individual files in your GitHub repositories</p>
        </header>
        
        <main className="github-file-updater-demo__main">
          <GithubFileUpdater onUpdateComplete={handleUpdateComplete} />
        </main>
      </div>
    </div>
  );
};

export default GithubFileUpdaterDemo;
