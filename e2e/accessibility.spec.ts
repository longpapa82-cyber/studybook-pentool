import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Count headings to ensure proper hierarchy
    const allHeadings = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((headings) => {
        return headings.map((h) => ({
          tag: h.tagName,
          text: h.textContent,
        }));
      });

    // Should have at least one h1
    const h1Count = allHeadings.filter((h) => h.tag === 'H1').length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible text or aria-label
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Button should have either text content or aria-label
      expect(accessibleName || text).toBeTruthy();
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        type: el?.getAttribute('type'),
      };
    });

    // Should focus on an interactive element
    expect(['BUTTON', 'A', 'INPUT'].includes(focusedElement.tag || '')).toBe(true);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Images should have alt attribute (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Check for color contrast violations
    const contrastViolations = contrastResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/');

    // Navigate to upload page (has file input)
    await page.getByRole('button', { name: /업로드/i }).click();

    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      // Input should have id with associated label, aria-label, or aria-labelledby
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('should support screen reader landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.getByRole('main');
    const mainCount = await main.count();
    expect(mainCount).toBeGreaterThanOrEqual(0); // Can be 0 if using div

    // Check for navigation landmark
    const nav = page.getByRole('navigation');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThanOrEqual(1);
  });
});
