import { describe, it, expect, beforeEach } from 'vitest';
import { useEbookStore } from '@/stores/ebookStore';

describe('ebookStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEbookStore.setState({
      pdfDocument: null,
      pdfId: null,
      pdfName: null,
      currentPage: 1,
      totalPages: 0,
      zoom: 1,
      loading: false,
      error: null,
      displayMode: 'single',
      isThumbnailPanelOpen: false,
    });
  });

  describe('Page Navigation', () => {
    it('should navigate to next page', () => {
      const { goToPage, nextPage, currentPage } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ totalPages: 10, currentPage: 1 });

      // Action
      nextPage();

      // Assert
      expect(useEbookStore.getState().currentPage).toBe(2);
    });

    it('should not go beyond last page', () => {
      const { nextPage } = useEbookStore.getState();

      // Setup - at last page
      useEbookStore.setState({ totalPages: 10, currentPage: 10 });

      // Action
      nextPage();

      // Assert - should stay at last page
      expect(useEbookStore.getState().currentPage).toBe(10);
    });

    it('should navigate to previous page', () => {
      const { prevPage } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ totalPages: 10, currentPage: 5 });

      // Action
      prevPage();

      // Assert
      expect(useEbookStore.getState().currentPage).toBe(4);
    });

    it('should not go below first page', () => {
      const { prevPage } = useEbookStore.getState();

      // Setup - at first page
      useEbookStore.setState({ totalPages: 10, currentPage: 1 });

      // Action
      prevPage();

      // Assert - should stay at first page
      expect(useEbookStore.getState().currentPage).toBe(1);
    });

    it('should go to specific page', () => {
      const { goToPage } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ totalPages: 10, currentPage: 1 });

      // Action
      goToPage(7);

      // Assert
      expect(useEbookStore.getState().currentPage).toBe(7);
    });

    it('should clamp page number to valid range', () => {
      const { goToPage } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ totalPages: 10, currentPage: 5 });

      // Try to go to invalid page (too high)
      goToPage(15);
      expect(useEbookStore.getState().currentPage).toBe(10);

      // Try to go to invalid page (too low)
      goToPage(-5);
      expect(useEbookStore.getState().currentPage).toBe(1);
    });
  });

  describe('Zoom Controls', () => {
    it('should zoom in', () => {
      const { zoomIn } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ zoom: 1 });

      // Action
      zoomIn();

      // Assert
      expect(useEbookStore.getState().zoom).toBeGreaterThan(1);
    });

    it('should zoom out', () => {
      const { zoomOut } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ zoom: 1.5 });

      // Action
      zoomOut();

      // Assert
      expect(useEbookStore.getState().zoom).toBeLessThan(1.5);
    });

    it('should not zoom below minimum (0.5)', () => {
      const { zoomOut } = useEbookStore.getState();

      // Setup - at minimum zoom
      useEbookStore.setState({ zoom: 0.5 });

      // Action - try to zoom out more
      zoomOut();
      zoomOut();
      zoomOut();

      // Assert - should stay at minimum
      expect(useEbookStore.getState().zoom).toBe(0.5);
    });

    it('should not zoom above maximum (3.0)', () => {
      const { zoomIn } = useEbookStore.getState();

      // Setup - at maximum zoom
      useEbookStore.setState({ zoom: 3.0 });

      // Action - try to zoom in more
      zoomIn();
      zoomIn();
      zoomIn();

      // Assert - should stay at maximum
      expect(useEbookStore.getState().zoom).toBe(3.0);
    });

    it('should reset zoom to 1.0', () => {
      const { resetZoom } = useEbookStore.getState();

      // Setup - zoomed in
      useEbookStore.setState({ zoom: 2.5 });

      // Action
      resetZoom();

      // Assert
      expect(useEbookStore.getState().zoom).toBe(1.0);
    });

    it('should set zoom to specific value', () => {
      const { setZoom } = useEbookStore.getState();

      // Setup
      useEbookStore.setState({ zoom: 1 });

      // Action
      setZoom(1.75);

      // Assert
      expect(useEbookStore.getState().zoom).toBe(1.75);
    });
  });

  describe('Display Mode', () => {
    it('should toggle display mode', () => {
      const { toggleDisplayMode } = useEbookStore.getState();

      // Setup - single mode
      useEbookStore.setState({ displayMode: 'single' });

      // Action
      toggleDisplayMode();

      // Assert - should be double
      expect(useEbookStore.getState().displayMode).toBe('double');

      // Action again
      toggleDisplayMode();

      // Assert - should be back to single
      expect(useEbookStore.getState().displayMode).toBe('single');
    });
  });

  describe('Thumbnail Panel', () => {
    it('should toggle thumbnail panel', () => {
      const { toggleThumbnailPanel } = useEbookStore.getState();

      // Setup - closed
      useEbookStore.setState({ isThumbnailPanelOpen: false });

      // Action
      toggleThumbnailPanel();

      // Assert - should be open
      expect(useEbookStore.getState().isThumbnailPanelOpen).toBe(true);

      // Action again
      toggleThumbnailPanel();

      // Assert - should be closed
      expect(useEbookStore.getState().isThumbnailPanelOpen).toBe(false);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useEbookStore.getState();

      // Action
      setLoading(true);

      // Assert
      expect(useEbookStore.getState().loading).toBe(true);

      // Action
      setLoading(false);

      // Assert
      expect(useEbookStore.getState().loading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useEbookStore.getState();

      // Action
      setError('Test error message');

      // Assert
      expect(useEbookStore.getState().error).toBe('Test error message');

      // Clear error
      setError(null);

      // Assert
      expect(useEbookStore.getState().error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { reset } = useEbookStore.getState();

      // Setup - modify state
      useEbookStore.setState({
        currentPage: 5,
        totalPages: 10,
        zoom: 2.0,
        loading: true,
        error: 'Some error',
        displayMode: 'double',
        isThumbnailPanelOpen: true,
      });

      // Action
      reset();

      // Assert - all back to defaults
      const state = useEbookStore.getState();
      expect(state.pdfDocument).toBeNull();
      expect(state.pdfId).toBeNull();
      expect(state.pdfName).toBeNull();
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(0);
      expect(state.zoom).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.displayMode).toBe('single');
      expect(state.isThumbnailPanelOpen).toBe(false);
    });
  });
});
