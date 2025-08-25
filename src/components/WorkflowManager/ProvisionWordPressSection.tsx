import React, { useEffect, useMemo, useState } from "react";
import useCreatePleskSubscription from "../../hooks/useCreatePleskSubscription";
import { useGithubRepo } from "../../context/GithubRepoContext";
import useProgressTracking from "../../hooks/useProgressTracking";
import ProgressIndicator from "../Common/ProgressIndicator";
import "./ProvisionWordPressSection.sass";
import { listSubscriptions, testSSHConnection } from "../../services/pleskAdminService";

interface ProvisionWordPressSectionProps {
  onProvisioned?: (data: any) => void;
}

const ProvisionWordPressSection: React.FC<ProvisionWordPressSectionProps> = () => {
  const { state } = useGithubRepo();
  const { githubRepo } = state;
  const { progressState, updateTaskStatus } = useProgressTracking();
  
  const servers = useMemo(
    () => [
      { id: "sunset", label: "Sunset (Templates) 44.237.72.16" },
      { id: "kewalos", label: "Kewalos (Custom) 44.237.149.155" },
      { id: "uluwatu", label: "Uluwatu (Landing pages) 44.236.196.209" },
      { id: "ssp-ortho", label: "SSP Ortho 3.17.97.149" },
    ],
    []
  );
  const [pleskIp, setPleskIp] = useState<string>("sunset");
  // Deprecated fields removed from UI

  const [
    /* _createResponse */,
    /* _createStatus */,
    /* _createSubscription */,
    /* _createError */,
    copyResponse,
    copyStatus,
    copySubscription,
    /* copyError */,
  ] = useCreatePleskSubscription();

  const [copyErrorMessage, setCopyErrorMessage] = useState<string | null>(null);

  // Copy subscription UI state
  const [sourceDomain, setSourceDomain] = useState<string>("");
  const [targetDomain, setTargetDomain] = useState<string>("");
  const [availableSubscriptions, setAvailableSubscriptions] = useState<string[]>([]);
  // const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);
  const [subsError, setSubsError] = useState<string | null>(null);

  // Auto-populate target domain based on GitHub repo name
  useEffect(() => {
    if (githubRepo) {
      setTargetDomain(`${githubRepo}.com`);
    }
  }, [githubRepo]);

  const handleCopy = async () => {
    setCopyErrorMessage(null);
    updateTaskStatus('infrastructure', 'pleskProvisioning', 'in-progress');
    
    try {
      await copySubscription({
        source_domain: sourceDomain,
        target_domain: targetDomain,
        server: pleskIp,
        subdomain: "api",
        copy_files: true,
        copy_databases: true,
        update_config_files: true,
      });
      updateTaskStatus('infrastructure', 'pleskProvisioning', 'completed');
    } catch (e) {
      setCopyErrorMessage(e instanceof Error ? e.message : "Failed to copy subscription");
      updateTaskStatus('infrastructure', 'pleskProvisioning', 'error');
    }
  };

  const loadSubscriptions = async () => {
          // setIsLoadingSubs(true);
    setSubsError(null);
    try {
      const res = await listSubscriptions(pleskIp);
      const subs = (res?.subscriptions ?? []) as string[];
      setAvailableSubscriptions(subs);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load subscriptions");
    } finally {
      // setIsLoadingSubs(false);
    }
  };

  useEffect(() => {
    // Load subscriptions when server changes
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pleskIp]);

  return (
    <div className="provision-wordpress-section" role="region" aria-label="Copy WordPress Subscription">
      <div className="provision-wordpress-section__header">
        <h4 className="provision-wordpress-section__title">Plesk / WordPress Provisioning</h4>
        <ProgressIndicator
          status={progressState.infrastructure.pleskProvisioning} 
          size="small"
          showLabel={true}
        />
      </div>

      <div className="form-group">
        <label htmlFor="plesk-ip">
          Server
        </label>
        <select
          id="plesk-ip"
          value={pleskIp}
          onChange={(e) => setPleskIp(e.target.value)}
          aria-label="Plesk server"
        >
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="form-group">
          <label htmlFor="copy-source-domain">
            Source Domain
          </label>
          <input
            id="copy-source-domain"
          type="text"
          value={sourceDomain}
          onChange={(e) => setSourceDomain(e.target.value)}
          placeholder="example.com"
          aria-label="Source domain"
          list="subscriptions-list"
        />
        <datalist id="subscriptions-list">
          {availableSubscriptions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {subsError && (
          <div className="error-message" role="alert" style={{ marginTop: 6 }}>
            {subsError}
          </div>
        )}
      </div>
        <div className="form-group">
          <label htmlFor="copy-target-domain">
            Target Domain
          </label>
          <input
            id="copy-target-domain"
          type="text"
          value={targetDomain}
          onChange={(e) => setTargetDomain(e.target.value)}
          placeholder="example-copy.com"
          aria-label="Target domain"
        />
        </div>
      </div>
      <button
        className="primary-button"
        onClick={handleCopy}
        disabled={!sourceDomain || !targetDomain || copyStatus === "pending"}
        aria-label="Copy Plesk subscription"
      >
        {copyStatus === "pending" ? "Copying..." : "Copy Subscription"}
      </button>

      {copyErrorMessage && (
        <div className="error-message" role="alert">
          {copyErrorMessage}
        </div>
      )}

      {copyStatus === "success" && copyResponse && (
        <div className="success-section" role="status">
          <div className="success-header">
            <h4>🎉 WordPress Subscription Copied Successfully!</h4>
          </div>
          
          <div className="success-details">
            {"target_domain" in copyResponse && (
              <div className="detail-item">
                <strong>Created Domain:</strong> {(copyResponse as any).target_domain}
              </div>
            )}
            {"subdomain" in copyResponse && (
              <div className="detail-item">
                <strong>API Subdomain:</strong> {(copyResponse as any).subdomain}
              </div>
            )}
            {"credentials" in copyResponse && (
              <>
                <div className="detail-item">
                  <strong>FTP Username:</strong> {(copyResponse as any).credentials.ftp.username}
                </div>
                <div className="detail-item">
                  <strong>FTP Password:</strong> {(copyResponse as any).credentials.ftp.password}
                </div>
                <div className="detail-item">
                  <strong>Database Username:</strong> {(copyResponse as any).credentials.database.username}
                </div>
                <div className="detail-item">
                  <strong>Database Password:</strong> {(copyResponse as any).credentials.database.password}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="advanced-section">
        <details>
          <summary>Advanced</summary>
          <div className="advanced-controls">
            <div className="button-row">
            <button
              className="secondary-button"
              onClick={async () => {
                try {
                  const res = await testSSHConnection(pleskIp);
                  alert(`SSH: ${res.success ? "ok" : "failed"}`);
                } catch (e) {
                  alert(`SSH test failed: ${e}`);
                }
              }}
            >
              Test SSH
            </button>
            <button
              className="secondary-button"
              onClick={async () => {
                try {
                  const res = await listSubscriptions(pleskIp);
                  console.log(res);
                  alert(`Subscriptions: ${res?.subscriptions?.length ?? 0}`);
                } catch (e) {
                  alert(`List subscriptions failed: ${e}`);
                }
              }}
            >
              List Subscriptions
            </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ProvisionWordPressSection;


