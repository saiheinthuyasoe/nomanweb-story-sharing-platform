import { test, expect } from '@playwright/test';

test.describe('Home Page Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Carousel section should be responsive', async ({ page }) => {
    const carousel = page.locator('section').first();
    await expect(carousel).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(carousel.locator('img')).toHaveCSS('object-fit', 'cover');

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(carousel.locator('img')).toHaveCSS('object-fit', 'cover');

    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(carousel.locator('img')).toHaveCSS('object-fit', 'cover');
  });

  test('Genre Navigation section should be responsive', async ({ page }) => {
    const genreNavigation = page.locator('section:has-text("Explore by Genre")');
    await expect(genreNavigation).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const genreGridMobile = genreNavigation.locator('div.grid');
    await expect(genreGridMobile).toHaveClass(/grid-cols-3/);

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    const genreGridTablet = genreNavigation.locator('div.grid');
    await expect(genreGridTablet).toHaveClass(/md:grid-cols-6/);
  });

  test('Weekly Features section should be responsive', async ({ page }) => {
    const weeklyFeatures = page.locator('section:has-text("Weekly Features")');
    await expect(weeklyFeatures).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const weeklyGridMobile = weeklyFeatures.locator('div.grid');
    await expect(weeklyGridMobile).toHaveClass(/grid-cols-1/);

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    const weeklyGridTablet = weeklyFeatures.locator('div.grid');
    await expect(weeklyGridTablet).toHaveClass(/md:grid-cols-3/);
  });

  test('Featured Books by Genre section should be responsive', async ({ page }) => {
    const featuredBooks = page.locator('section:has-text("Featured Books by Genre")');
    await expect(featuredBooks).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const featuredGridMobile = featuredBooks.locator('div.grid').first();
    await expect(featuredGridMobile).toHaveClass(/grid-cols-2/);

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    const featuredGridTablet = featuredBooks.locator('div.grid').first();
    await expect(featuredGridTablet).toHaveClass(/md:grid-cols-3/);

    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    const featuredGridDesktop = featuredBooks.locator('div.grid').first();
    await expect(featuredGridDesktop).toHaveClass(/lg:grid-cols-6/);
  });
});