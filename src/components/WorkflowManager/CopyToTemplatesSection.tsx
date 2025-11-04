import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { CheckCircle2 } from 'lucide-react';
import useProgressTracking from "../../hooks/useProgressTracking";
import "./CopyToTemplatesSection.sass";
import { listSubdomains, copySubdomainWithinSubscription } from "../../services/pleskAdminService";

interface CopyToTemplatesSectionProps {
  onCopied?: (data: any) => void;
  initialSourceDomain?: string;
  initialTargetDomain?: string;
}

export interface CopyToTemplatesSectionRef {
  triggerCopy: () => Promise<void>;
}

const CopyToTemplatesSection = forwardRef<CopyToTemplatesSectionRef, CopyToTemplatesSectionProps>(({
  onCopied,
  initialSourceDomain = '',
  initialTargetDomain = ''
}, ref) => {
  const { updateTaskStatus } = useProgressTracking();

  const servers = useMemo(
    () => [
      { id: "crazy-visvesvaraya", label: "Topanga 52.24.217.50" },
    ],
    []
  );

  const [pleskIp, setPleskIp] = useState<string>("crazy-visvesvaraya");
  const [sourceDomain, setSourceDomain] = useState<string>(initialSourceDomain);
  const [targetDomain, setTargetDomain] = useState<string>(initialTargetDomain);
  const [availableSubscriptions, setAvailableSubscriptions] = useState<string[]>([]);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [copyErrorMessage, setCopyErrorMessage] = useState<string | null>(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [copyResponse, setCopyResponse] = useState<any>(null);

  // Compute the target subdomain based on the target domain
  const computeTargetSubdomain = (domain: string): string => {
    if (!domain) return "";
    
    // If domain ends with .com, use only the domain name part
    if (domain.endsWith(".com")) {
      const domainName = domain.slice(0, -4); // Remove .com
      return `api-${domainName}.roostergrintemplates.com`;
    }
    
    // For non-.com domains, replace all dots with hyphens
    const domainWithHyphens = domain.replace(/\./g, "-");
    return `api-${domainWithHyphens}.roostergrintemplates.com`;
  };

  const targetSubdomain = computeTargetSubdomain(targetDomain);

  // Allowed subdomain prefixes
  const allowedSubdomains = useMemo(
    () => [
      "api-bayareaortho",
      "api-calistoga",
      "api-eureka",
      "api-haightashbury",
      "api-pismo",
      "api-shasta",
      "api-sonoma",
      "api-stinson"
    ],
    []
  );

  // Load subdomains from the server
  const loadSubscriptions = useCallback(async () => {
    setSubsError(null);
    setIsLoadingSubs(true);
    try {
      console.log(`Loading subdomains for roostergrintemplates.com from server: ${pleskIp}`);
      const res = await listSubdomains("roostergrintemplates.com", pleskIp);
      const subdomains = (res?.subdomains ?? []) as string[];
      console.log(`Received ${subdomains.length} subdomains:`, subdomains);
      
      // Filter to only show allowed subdomains
      const filteredSubdomains = subdomains.filter((subdomain) =>
        allowedSubdomains.some((allowed) => subdomain.startsWith(allowed))
      );
      console.log(`Filtered to ${filteredSubdomains.length} allowed subdomains:`, filteredSubdomains);
      
      setAvailableSubscriptions(filteredSubdomains);
    } catch (e) {
      console.error("Error loading subdomains:", e);
      setSubsError(e instanceof Error ? e.message : "Failed to load subdomains");
    } finally {
      setIsLoadingSubs(false);
    }
  }, [pleskIp, allowedSubdomains]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Update source and target domains when props change
  useEffect(() => {
    if (initialSourceDomain) {
      setSourceDomain(initialSourceDomain);
    }
  }, [initialSourceDomain]);

  useEffect(() => {
    if (initialTargetDomain) {
      setTargetDomain(initialTargetDomain);
    }
  }, [initialTargetDomain]);

  const handleCopy = async () => {
    setCopyErrorMessage(null);
    setCopyStatus("pending");
    updateTaskStatus('infrastructure', 'pleskProvisioning', 'in-progress');
    
    try {
      // Extract just the subdomain name (e.g., "api-gordon-test-3" from "api-gordon-test-3.roostergrintemplates.com")
      const targetSubdomainName = targetSubdomain.split('.')[0];
      
      console.log(`Copying subdomain:`, {
        source: sourceDomain,
        target: targetSubdomainName,
        parent: "roostergrintemplates.com",
        server: pleskIp
      });
      
      const result = await copySubdomainWithinSubscription(
        sourceDomain,
        targetSubdomainName,
        "roostergrintemplates.com",
        pleskIp
      );
      
      console.log("Copy result:", result);
      setCopyResponse(result);
      setCopyStatus("success");
      updateTaskStatus('infrastructure', 'pleskProvisioning', 'completed');

      // Call onCopied callback if provided
      if (onCopied) {
        onCopied({
          apiSubdomain: targetSubdomain,
          sourceDomain,
          targetDomain,
          ...result
        });
      }
    } catch (e) {
      console.error("Copy error:", e);
      setCopyErrorMessage(e instanceof Error ? e.message : "Failed to copy subdomain");
      setCopyStatus("error");
      updateTaskStatus('infrastructure', 'pleskProvisioning', 'error');
    }
  };

  // Expose the handleCopy method to parent via ref
  useImperativeHandle(ref, () => ({
    triggerCopy: handleCopy
  }), [handleCopy]);

  return (
    <div className="copy-to-templates-section" role="region" aria-label="Copy to Templates">
      <div className="form-group">
        <label htmlFor="copy-templates-server">
          Server
        </label>
        <select
          id="copy-templates-server"
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

      <div className="form-group">
        <label htmlFor="copy-templates-source">
          Source Subdomain (roostergrintemplates.com)
        </label>
        <select
          id="copy-templates-source"
          value={sourceDomain}
          onChange={(e) => setSourceDomain(e.target.value)}
          aria-label="Source subdomain"
          disabled={isLoadingSubs}
        >
          <option value="">
            {isLoadingSubs 
              ? "Loading subdomains..." 
              : availableSubscriptions.length === 0 
                ? "No roostergrintemplates.com subdomains found" 
                : "Select a subdomain to copy..."}
          </option>
          {availableSubscriptions.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
        {subsError && (
          <div className="error-message" role="alert" style={{ marginTop: 6 }}>
            {subsError}
          </div>
        )}
        {!isLoadingSubs && !subsError && availableSubscriptions.length === 0 && (
          <div className="info-message" style={{ marginTop: 6, fontSize: '0.9em', color: '#6b7280' }}>
            No subdomains found under roostergrintemplates.com on this server. Try a different server.
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="copy-templates-target">
          Target Domain
        </label>
        <input
          id="copy-templates-target"
          type="text"
          value={targetDomain}
          onChange={(e) => setTargetDomain(e.target.value)}
          placeholder="example.com or example.co.uk"
          aria-label="Target domain"
        />
        {targetSubdomain && (
          <div className="computed-subdomain" role="status">
            Will create: <strong>{targetSubdomain}</strong>
          </div>
        )}
      </div>

      <button
        className="primary-button"
        onClick={handleCopy}
        disabled={!sourceDomain || !targetDomain || copyStatus === "pending"}
        aria-label="Copy to templates"
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
            <CheckCircle2 size={20} strokeWidth={2} />
            <h4>Subdomain Copied Successfully!</h4>
          </div>
          
          <div className="success-details">
            {"source_subdomain" in copyResponse && (
              <div className="detail-item">
                <strong>Source:</strong> {copyResponse.source_subdomain}
              </div>
            )}
            {"target_subdomain" in copyResponse && (
              <div className="detail-item">
                <strong>New Subdomain:</strong> {copyResponse.target_subdomain}
              </div>
            )}
            {copyResponse.operations && (
              <>
                {copyResponse.operations.subdomain_creation && (
                  <div className="detail-item">
                    <CheckCircle2 size={16} strokeWidth={2} /> Subdomain created
                  </div>
                )}
                {copyResponse.operations.file_copy && (
                  <div className="detail-item">
                    <CheckCircle2 size={16} strokeWidth={2} /> Files copied
                  </div>
                )}
                {copyResponse.operations.database_copy && (
                  <div className="detail-item">
                    <CheckCircle2 size={16} strokeWidth={2} /> Databases copied
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

CopyToTemplatesSection.displayName = 'CopyToTemplatesSection';

export default CopyToTemplatesSection;

