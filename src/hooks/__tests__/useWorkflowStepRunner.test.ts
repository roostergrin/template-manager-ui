import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import apiClient from '../../services/apiService';
import type { CreateGithubRepoResult, CreateDemoRepoResult, ProvisionCloudflarePageResult, WorkflowStep } from '../../types/UnifiedWorkflowTypes';

// ─── Browser API Stubs (jsdom lacks these) ──────────────────────

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

// ─── Module Mocks ────────────────────────────────────────────────

vi.mock('../../services/apiService');
const mockedApiClient = vi.mocked(apiClient);

// Track logger calls
const mockLogProcessing = vi.fn().mockReturnValue({ phase: 'processing' });
const mockLogApiRequest = vi.fn().mockReturnValue({ phase: 'api_request' });
const mockLogApiResponse = vi.fn().mockReturnValue({ phase: 'api_response' });
const mockLogStart = vi.fn().mockReturnValue({ phase: 'start' });
const mockLogComplete = vi.fn().mockReturnValue({ phase: 'complete' });
const mockLogError = vi.fn().mockReturnValue({ phase: 'error' });

vi.mock('../../utils/workflowLogger', () => ({
  createStepLogger: () => ({
    logStart: mockLogStart,
    logApiRequest: mockLogApiRequest,
    logApiResponse: mockLogApiResponse,
    logProcessing: mockLogProcessing,
    logComplete: mockLogComplete,
    logError: mockLogError,
  }),
  createTimer: () => ({ elapsed: () => 100 }),
}));

vi.mock('../../mocks', () => ({
  isMockModeEnabled: () => false,
}));

vi.mock('../../modelGroups', () => ({
  modelGroups: {},
  getGithubTemplateRepo: () => 'ai-template-stinson',
}));

vi.mock('../../utils/jsonImageAnalyzer', () => ({
  parseJsonForImages: vi.fn(),
  updateImageSlot: vi.fn(),
  getImageKitUrl: vi.fn(),
  getSlotsNeedingImages: vi.fn(),
}));

vi.mock('../../utils/themeBuilder', () => ({
  buildThemeFromDesignSystem: vi.fn(),
  mergeThemeWithDesignSystem: vi.fn(),
}));

vi.mock('../../utils/injectPreserveImage', () => ({
  createPreserveImageMap: vi.fn(),
  injectPreserveImageIntoContent: vi.fn(),
}));

// Mock workflow context
const mockSetStepStatus = vi.fn();
const mockSetCurrentStep = vi.fn();
const mockAddProgressEvent = vi.fn();
const mockAddSessionLogEntry = vi.fn();
const mockSetGeneratedData = vi.fn();
const mockCanRunStep = vi.fn().mockReturnValue(true);

let mockGeneratedData: Record<string, unknown> = {};

const mockGetSiteConfigSync = vi.fn().mockReturnValue({
  domain: 'test-site.com',
  template: 'stinson',
  templateType: 'json',
  siteType: 'medical',
  preserveDoctorPhotos: false,
  enableImagePicker: true,
  enableHotlinking: true,
  deploymentTarget: 'production',
});

// Build mock steps array with all step IDs
const buildMockStep = (id: string, name: string): WorkflowStep => ({
  id,
  name,
  description: `Step: ${name}`,
  phase: 'infrastructure',
  status: 'pending',
  dependencies: [],
  estimatedDurationSeconds: 10,
});

const mockSteps: WorkflowStep[] = [
  buildMockStep('create-github-repo', 'Create GitHub Repo'),
  buildMockStep('provision-wordpress-backend', 'Provision WordPress'),
  buildMockStep('provision-site', 'Provision Site'),
  buildMockStep('scrape-site', 'Scrape Site'),
  buildMockStep('create-vector-store', 'Create Vector Store'),
  buildMockStep('select-template', 'Select Template'),
  buildMockStep('generate-sitemap', 'Generate Sitemap'),
  buildMockStep('allocate-content', 'Allocate Content'),
  buildMockStep('generate-content', 'Generate Content'),
  buildMockStep('download-theme', 'Download Theme'),
  buildMockStep('image-picker', 'Image Picker'),
  buildMockStep('prevent-hotlinking', 'Prevent Hotlinking'),
  buildMockStep('upload-json-to-github', 'Upload JSON to GitHub'),
  buildMockStep('export-to-wordpress', 'Export to WordPress'),
  buildMockStep('second-pass', 'Second Pass'),
  buildMockStep('upload-logo', 'Upload Logo'),
  buildMockStep('upload-favicon', 'Upload Favicon'),
  buildMockStep('create-demo-repo', 'Create Demo Repo'),
  buildMockStep('provision-cloudflare-pages', 'Provision Cloudflare Pages'),
];

const mockGetStepsSync = vi.fn().mockReturnValue(mockSteps);

vi.mock('../../contexts/UnifiedWorkflowProvider', () => ({
  useUnifiedWorkflow: () => ({
    state: {
      config: {
        siteConfig: {
          domain: 'test-site.com',
          template: 'stinson',
          templateType: 'json',
          siteType: 'medical',
          deploymentTarget: 'production',
        },
      },
      generatedData: mockGeneratedData,
      editedInputData: {},
      steps: mockSteps,
    },
    actions: {
      getSiteConfigSync: mockGetSiteConfigSync,
      getStepsSync: mockGetStepsSync,
      setStepStatus: mockSetStepStatus,
      setCurrentStep: mockSetCurrentStep,
      addProgressEvent: mockAddProgressEvent,
      addSessionLogEntry: mockAddSessionLogEntry,
      setGeneratedData: mockSetGeneratedData,
      setEditedInputData: vi.fn(),
      canRunStep: mockCanRunStep,
    },
  }),
}));

// Import after mocks
import { useWorkflowStepRunner } from '../useWorkflowStepRunner';

// ─── Test Suites ─────────────────────────────────────────────────

describe('useWorkflowStepRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneratedData = {};
    mockGetSiteConfigSync.mockReturnValue({
      domain: 'test-site.com',
      template: 'stinson',
      templateType: 'json',
      siteType: 'medical',
      preserveDoctorPhotos: false,
      enableImagePicker: true,
      enableHotlinking: true,
      deploymentTarget: 'production',
    });
    mockCanRunStep.mockReturnValue(true);
  });

  // ─── US-002: Create GitHub Repo Idempotency ──────────────────

  describe('runCreateGithubRepo - idempotency logging (US-002)', () => {
    it('should log "Repository already existed" when already_existed is true', async () => {
      const mockResponse: CreateGithubRepoResult = {
        success: true,
        owner: 'roostergrin',
        repo: 'test-site-com',
        already_existed: true,
        full_name: 'roostergrin/test-site-com',
        html_url: 'https://github.com/roostergrin/test-site-com',
        default_branch: 'master',
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      let stepResult: unknown;
      await act(async () => {
        stepResult = await result.current.executeStep('create-github-repo');
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/create-github-repo-from-template/',
        expect.objectContaining({ new_name: 'test-site-com' })
      );
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Repository already existed: roostergrin/test-site-com'
      );
    });

    it('should log "Repository newly created" when already_existed is false', async () => {
      const mockResponse: CreateGithubRepoResult = {
        success: true,
        owner: 'roostergrin',
        repo: 'test-site-com',
        already_existed: false,
        full_name: 'roostergrin/test-site-com',
        html_url: 'https://github.com/roostergrin/test-site-com',
        default_branch: 'master',
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('create-github-repo');
      });

      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Repository newly created: roostergrin/test-site-com'
      );
    });

    it('should return failure when domain is empty', async () => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: '',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        deploymentTarget: 'production',
      });

      const { result } = renderHook(() => useWorkflowStepRunner());

      let stepResult: { success: boolean; error?: string };
      await act(async () => {
        stepResult = await result.current.executeStep('create-github-repo') as typeof stepResult;
      });

      // The step should report an error (the outer wrapper catches it)
      expect(mockedApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('GitHub API rate limit'));

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('create-github-repo');
      });

      // Error is caught and step marked as error
      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'create-github-repo',
        'error',
        undefined,
        expect.stringContaining('GitHub API rate limit')
      );
    });
  });

  // ─── US-003: Create Demo Repo Idempotency ────────────────────

  describe('runCreateDemoRepo - idempotency logging (US-003)', () => {
    beforeEach(() => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        preserveDoctorPhotos: false,
        enableImagePicker: true,
        enableHotlinking: true,
        deploymentTarget: 'demo',
      });
    });

    it('should log "Demo repository already existed" when already_existed is true', async () => {
      const mockResponse: CreateDemoRepoResult = {
        success: true,
        owner: 'demo-rooster',
        repo: 'test-site-com',
        already_existed: true,
        full_name: 'demo-rooster/test-site-com',
        html_url: 'https://github.com/demo-rooster/test-site-com',
        default_branch: 'master',
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('create-demo-repo');
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/create-demo-repo/',
        expect.objectContaining({ repo_name: 'test-site-com' })
      );
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Demo repository already existed: demo-rooster/test-site-com'
      );
    });

    it('should log "Demo repository newly created" when already_existed is false', async () => {
      const mockResponse: CreateDemoRepoResult = {
        success: true,
        owner: 'demo-rooster',
        repo: 'test-site-com',
        already_existed: false,
        full_name: 'demo-rooster/test-site-com',
        html_url: 'https://github.com/demo-rooster/test-site-com',
        default_branch: 'master',
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('create-demo-repo');
      });

      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Demo repository newly created: demo-rooster/test-site-com'
      );
    });

    it('should skip when deploymentTarget is not demo', async () => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        deploymentTarget: 'production',
      });

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('create-demo-repo');
      });

      expect(mockedApiClient.post).not.toHaveBeenCalled();
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Skipping demo repo - using production deployment'
      );
    });
  });

  // ─── US-004: Provision Cloudflare Pages Idempotency ──────────

  describe('runProvisionCloudflarePages - idempotency logging (US-004)', () => {
    beforeEach(() => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        deploymentTarget: 'demo',
      });
      // Provide required demoRepoResult
      mockGeneratedData = {
        demoRepoResult: {
          success: true,
          owner: 'demo-rooster',
          repo: 'test-site-com',
          already_existed: false,
        },
      };
    });

    it('should log "Cloudflare Pages project already existed" when already_existed is true', async () => {
      const mockResponse: ProvisionCloudflarePageResult = {
        success: true,
        project_name: 'test-site-com',
        url: 'https://test-site-com.pages.dev',
        already_existed: true,
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('provision-cloudflare-pages');
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/provision-cloudflare-pages/',
        expect.objectContaining({ project_name: 'test-site-com' })
      );
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Cloudflare Pages project already existed: test-site-com'
      );
    });

    it('should log "Cloudflare Pages project newly created" when already_existed is false', async () => {
      const mockResponse: ProvisionCloudflarePageResult = {
        success: true,
        project_name: 'test-site-com',
        url: 'https://test-site-com.pages.dev',
        already_existed: false,
      };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('provision-cloudflare-pages');
      });

      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Cloudflare Pages project newly created: test-site-com'
      );
    });

    it('should skip when deploymentTarget is not demo', async () => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        deploymentTarget: 'production',
      });

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('provision-cloudflare-pages');
      });

      expect(mockedApiClient.post).not.toHaveBeenCalled();
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Skipping Cloudflare Pages - using production deployment'
      );
    });

    it('should fail when demo repo result is missing', async () => {
      mockGeneratedData = {};

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('provision-cloudflare-pages');
      });

      expect(mockedApiClient.post).not.toHaveBeenCalled();
      // Error is set on step status
      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'provision-cloudflare-pages',
        'error',
        undefined,
        expect.stringContaining('Demo repository must be created first')
      );
    });
  });

  // ─── Upload JSON to GitHub (sequential calls) ─────────────────

  describe('runUploadJsonToGithub - sequential file uploads', () => {
    const fileUploadEndpoint = '/update-github-repo-file/';
    const successResponse = { success: true, content: { html_url: 'https://github.com/...' } };

    beforeEach(() => {
      mockGeneratedData = {
        githubRepoResult: {
          success: true,
          owner: 'roostergrin',
          repo: 'test-site-com',
          full_name: 'roostergrin/test-site-com',
          default_branch: 'master',
        },
        contentResult: {
          pageData: { home: { title: 'Home Page' }, about: { title: 'About Us' } },
          globalData: { siteName: 'Test Site', phone: '555-1234' },
        },
      };
      mockedApiClient.post.mockResolvedValue(successResponse);
    });

    it('should upload pages.json and globalData.json sequentially', async () => {
      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      // Should call /update-github-repo-file/ at least twice (pages + global)
      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      expect(uploadCalls.length).toBeGreaterThanOrEqual(2);

      // First call: pages.json
      expect(uploadCalls[0][1]).toEqual(expect.objectContaining({
        owner: 'roostergrin',
        repo: 'test-site-com',
        file_path: 'data/pages.json',
        branch: 'master',
        message: 'Update pages.json from workflow',
      }));

      // Second call: globalData.json
      expect(uploadCalls[1][1]).toEqual(expect.objectContaining({
        owner: 'roostergrin',
        repo: 'test-site-com',
        file_path: 'data/globalData.json',
        branch: 'master',
        message: 'Update globalData.json from workflow',
      }));
    });

    it('should upload theme.json as third call when theme data exists', async () => {
      mockGeneratedData = {
        ...mockGeneratedData,
        themeResult: {
          theme: { primaryColor: '#007bff', fontFamily: 'Arial' },
        },
      };

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      expect(uploadCalls).toHaveLength(3);

      // Third call: theme.json
      expect(uploadCalls[2][1]).toEqual(expect.objectContaining({
        file_path: 'data/theme.json',
        message: 'Update theme.json from workflow',
      }));
    });

    it('should NOT upload theme.json when no theme data exists', async () => {
      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      expect(uploadCalls).toHaveLength(2);
    });

    it('should serialize data as pretty-printed JSON in file_content', async () => {
      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      const pagesPayload = uploadCalls[0][1] as { file_content: string };
      const globalPayload = uploadCalls[1][1] as { file_content: string };

      expect(pagesPayload.file_content).toBe(
        JSON.stringify({ home: { title: 'Home Page' }, about: { title: 'About Us' } }, null, 2)
      );
      expect(globalPayload.file_content).toBe(
        JSON.stringify({ siteName: 'Test Site', phone: '555-1234' }, null, 2)
      );
    });

    it('should stop and return failure if pages.json upload fails', async () => {
      mockedApiClient.post.mockResolvedValueOnce({ success: false, error: 'permission denied' });

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      // Only one call made before stopping
      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      expect(uploadCalls).toHaveLength(1);

      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'upload-json-to-github',
        'error',
        undefined,
        expect.stringContaining('Failed to upload pages.json')
      );
    });

    it('should stop and return failure if globalData.json upload fails', async () => {
      mockedApiClient.post
        .mockResolvedValueOnce(successResponse)       // pages.json succeeds
        .mockResolvedValueOnce({ success: false });    // globalData.json fails

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'upload-json-to-github',
        'error',
        undefined,
        expect.stringContaining('Failed to upload globalData.json')
      );
    });

    it('should handle network errors gracefully', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'upload-json-to-github',
        'error',
        undefined,
        expect.stringContaining('Network timeout')
      );
    });

    it('should skip upload for wordpress template type', async () => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'wordpress',
        siteType: 'medical',
        deploymentTarget: 'production',
      });

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      expect(mockedApiClient.post).not.toHaveBeenCalledWith(
        fileUploadEndpoint,
        expect.anything()
      );
      expect(mockLogProcessing).toHaveBeenCalledWith(
        'Skipping JSON upload - using WordPress template'
      );
    });

    it('should return success result with correct GitHub URLs', async () => {
      mockGeneratedData = {
        ...mockGeneratedData,
        themeResult: {
          theme: { primaryColor: '#007bff' },
        },
      };

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'upload-json-to-github',
        'completed',
        expect.objectContaining({
          success: true,
          pagesJsonUrl: 'https://github.com/roostergrin/test-site-com/blob/master/data/pages.json',
          globalDataJsonUrl: 'https://github.com/roostergrin/test-site-com/blob/master/data/globalData.json',
          themeJsonUrl: 'https://github.com/roostergrin/test-site-com/blob/master/data/theme.json',
        })
      );
    });

    it('should use demo repo when deploymentTarget is demo', async () => {
      mockGetSiteConfigSync.mockReturnValue({
        domain: 'test-site.com',
        template: 'stinson',
        templateType: 'json',
        siteType: 'medical',
        deploymentTarget: 'demo',
      });
      mockGeneratedData = {
        demoRepoResult: {
          success: true,
          owner: 'demo-rooster',
          repo: 'test-site-com',
        },
        contentResult: {
          pageData: { home: { title: 'Home' } },
          globalData: { siteName: 'Test' },
        },
      };

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );
      expect(uploadCalls[0][1]).toEqual(expect.objectContaining({
        owner: 'demo-rooster',
        repo: 'test-site-com',
      }));
    });

    it('should prefer hotlink-processed data over raw content data', async () => {
      mockGeneratedData = {
        githubRepoResult: {
          success: true,
          owner: 'roostergrin',
          repo: 'test-site-com',
        },
        contentResult: {
          pageData: { home: { img: 'http://original.com/photo.jpg' } },
          globalData: { logo: 'http://original.com/logo.png' },
        },
        hotlinkPagesResult: { home: { img: 'https://cloudfront.net/photo.jpg' } },
        hotlinkGlobalDataResult: { logo: 'https://cloudfront.net/logo.png' },
        hotlinkThemeResult: { primaryColor: '#007bff', bg: 'https://cloudfront.net/bg.jpg' },
      };

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      const uploadCalls = mockedApiClient.post.mock.calls.filter(
        (call) => call[0] === fileUploadEndpoint
      );

      // pages.json should use hotlink data
      const pagesContent = JSON.parse((uploadCalls[0][1] as { file_content: string }).file_content);
      expect(pagesContent.home.img).toBe('https://cloudfront.net/photo.jpg');

      // globalData.json should use hotlink data
      const globalContent = JSON.parse((uploadCalls[1][1] as { file_content: string }).file_content);
      expect(globalContent.logo).toBe('https://cloudfront.net/logo.png');

      // theme.json should use hotlink theme
      expect(uploadCalls).toHaveLength(3);
      const themeContent = JSON.parse((uploadCalls[2][1] as { file_content: string }).file_content);
      expect(themeContent.bg).toBe('https://cloudfront.net/bg.jpg');
    });

    it('should fail when no page data is available', async () => {
      mockGeneratedData = {
        githubRepoResult: {
          success: true,
          owner: 'roostergrin',
          repo: 'test-site-com',
        },
      };

      const { result } = renderHook(() => useWorkflowStepRunner());

      await act(async () => {
        await result.current.executeStep('upload-json-to-github');
      });

      expect(mockedApiClient.post).not.toHaveBeenCalledWith(
        fileUploadEndpoint,
        expect.anything()
      );
      expect(mockSetStepStatus).toHaveBeenCalledWith(
        'upload-json-to-github',
        'error',
        undefined,
        expect.stringContaining('No page data available')
      );
    });
  });
});
