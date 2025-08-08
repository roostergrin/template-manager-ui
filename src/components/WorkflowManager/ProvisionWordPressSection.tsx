import React, { useEffect, useMemo, useState } from "react";
import useCreatePleskSubscription from "../../hooks/useCreatePleskSubscription";
import "../ProvisionSiteSection.sass";
import { listSubscriptions, testSSHConnection } from "../../services/pleskAdminService";

interface ProvisionWordPressSectionProps {
  onProvisioned?: (data: any) => void;
}

const ProvisionWordPressSection: React.FC<ProvisionWordPressSectionProps> = ({
  onProvisioned,
}) => {
  const servers = useMemo(
    () => [
      { id: "default", label: "Default" },
      { id: "sunset", label: "Sunset (Preferred)" },
    ],
    []
  );
  const [pleskIp, setPleskIp] = useState<string>("sunset");
  // Deprecated fields removed from UI

  const [
    _createResponse,
    _createStatus,
    _createSubscription,
    _createError,
    copyResponse,
    copyStatus,
    copySubscription,
    copyError,
  ] = useCreatePleskSubscription();

  const [copyErrorMessage, setCopyErrorMessage] = useState<string | null>(null);

  // Copy subscription UI state
  const [sourceDomain, setSourceDomain] = useState<string>("");
  const [targetDomain, setTargetDomain] = useState<string>("");
  const [availableSubscriptions, setAvailableSubscriptions] = useState<string[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);
  const [subsError, setSubsError] = useState<string | null>(null);

  const handleCopy = async () => {
    setCopyErrorMessage(null);
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
    } catch (e) {
      setCopyErrorMessage(e instanceof Error ? e.message : "Failed to copy subscription");
    }
  };

  const loadSubscriptions = async () => {
    setIsLoadingSubs(true);
    setSubsError(null);
    try {
      const res = await listSubscriptions(pleskIp);
      const subs = (res?.subscriptions ?? []) as string[];
      setAvailableSubscriptions(subs);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load subscriptions");
    } finally {
      setIsLoadingSubs(false);
    }
  };

  useEffect(() => {
    // Load subscriptions when server changes
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pleskIp]);

  return (
    <div className="provision-site-section" role="region" aria-label="Copy WordPress Subscription">
      <div className="provision-site-section__header">
        <h4 className="provision-site-section__title">Plesk / WordPress Provisioning</h4>
      </div>

      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="plesk-ip">
          Server
        </label>
        <select
          id="plesk-ip"
          className="provision-site-section__input"
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

      <h4 className="provision-site-section__title">Copy Existing Subscription</h4>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="copy-source-domain">
          Source Domain
        </label>
        <input
          id="copy-source-domain"
          className="provision-site-section__input"
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
          <div className="provision-site-section__error" role="alert" style={{ marginTop: 6 }}>
            {subsError}
          </div>
        )}
      </div>
      <div className="provision-site-section__input-group">
        <label className="provision-site-section__label" htmlFor="copy-target-domain">
          Target Domain
        </label>
        <input
          id="copy-target-domain"
          className="provision-site-section__input"
          type="text"
          value={targetDomain}
          onChange={(e) => setTargetDomain(e.target.value)}
          placeholder="example-copy.com"
          aria-label="Target domain"
        />
      </div>
      <button
        className="provision-site-section__button"
        onClick={handleCopy}
        disabled={!sourceDomain || !targetDomain || copyStatus === "pending"}
        aria-label="Copy Plesk subscription"
      >
        {copyStatus === "pending" ? "Copying..." : "Copy Subscription"}
      </button>

      {copyErrorMessage && (
        <div className="provision-site-section__error" role="alert">
          {copyErrorMessage}
        </div>
      )}

      {copyStatus === "success" && copyResponse && (
        <div className="provision-site-section__success" role="status">
          <div className="success-summary">
            <h4>✅ Subscription Copied</h4>
            <div className="success-details">
              {"target_domain" in copyResponse && (
                <div>
                  <strong>Target Domain:</strong> {(copyResponse as any).target_domain}
                </div>
              )}
              {"subdomain" in copyResponse && (
                <div>
                  <strong>Subdomain:</strong> {(copyResponse as any).subdomain}
                </div>
              )}
            </div>
          </div>
          <details style={{ marginTop: "15px" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
              View Full Copy Response
            </summary>
            <pre className="provision-site-section__json">
              {JSON.stringify(copyResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Advanced</summary>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="provision-site-section__button"
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
              className="provision-site-section__button"
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
  );
};

export default ProvisionWordPressSection;


