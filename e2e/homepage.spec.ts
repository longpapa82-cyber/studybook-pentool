import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display welcome screen', async ({ page }) => {
    await page.goto('/');

    // Check for main title
    await expect(page.getByRole('heading', { name: /StudyBook/i })).toBeVisible();

    // Check for description
    await expect(
      page.getByText(/PDF 전자책에 자유롭게 주석을 달고 학습하세요/)
    ).toBeVisible();

    // Check for CTA buttons
    await expect(page.getByRole('button', { name: /PDF 업로드/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /전자책 목록/i })).toBeVisible();
  });

  test('should navigate to upload page', async ({ page }) => {
    await page.goto('/');

    // Click upload button
    await page.getByRole('button', { name: /PDF 업로드/i }).click();

    // Check for upload form
    await expect(page.getByText(/PDF 파일 등록/i)).toBeVisible();
  });

  test('should navigate to list page', async ({ page }) => {
    await page.goto('/');

    // Click list button
    await page.getByRole('button', { name: /전자책 목록/i }).click();

    // Check for list view (even if empty)
    await expect(page.getByText(/등록된 PDF/i)).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    // Navigate through menu items
    await page.getByRole('button', { name: /업로드/i }).click();
    await expect(page.getByText(/PDF 파일 등록/i)).toBeVisible();

    await page.getByRole('button', { name: /목록/i }).click();
    await expect(page.getByText(/등록된 PDF/i)).toBeVisible();

    await page.getByRole('button', { name: /홈/i }).click();
    await expect(
      page.getByText(/PDF 전자책에 자유롭게 주석을 달고 학습하세요/)
    ).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that main elements are visible on mobile
    await expect(page.getByRole('heading', { name: /StudyBook/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF 업로드/i })).toBeVisible();
  });
});
