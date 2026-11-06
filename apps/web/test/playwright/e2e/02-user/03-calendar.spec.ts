import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('fullcalendar', async ({ page, dataCy }) => {
    const calendar = page.locator('.calendar-container');
    await expect(calendar.getByRole('grid')).toBeAttached();

    const btnToday = calendar.getByRole('button', {
      name: 'This Month',
      exact: true
    });
    const btnNext = calendar.getByRole('button', {
      name: 'Next Month',
      exact: true
    });

    await expect(btnToday).toBeDisabled();
    await btnNext.click();
    await expect(btnToday).not.toBeDisabled();
    await btnToday.click();

    // FullCalendar uses a custom "soft double-click" via dateClick (two clicks within 300ms)
    const today = await page.evaluate(() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const element = calendar.locator(`[role="gridcell"][data-date="${today}"]`);
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    if (!box) {
      throw new Error('Element not found');
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    // A single click must not open the form, also not on today's cell.
    await page.mouse.click(x, y);
    await page.waitForTimeout(400);
    await expect(dataCy('form-todo')).not.toBeAttached();

    // FullCalendar ignores a second click that follows at once, so wait like a human double click.
    await page.mouse.click(x, y);
    await page.waitForTimeout(100);
    await page.mouse.click(x, y);

    await expect(dataCy('form-todo')).toBeAttached();
    const todo = chance.animal();
    await page.locator('[name=todo]').fill(todo);
    await dataCy('btn-form-save').click();
    await expect(dataCy('form-todo')).not.toBeAttached();

    const weekTab = calendar.getByRole('tab', {
      name: 'Week view',
      exact: true
    });
    const listTab = calendar.getByRole('tab', {
      name: 'events view',
      exact: true
    });
    const monthTab = calendar.getByRole('tab', {
      name: 'month view',
      exact: true
    });
    await weekTab.click();
    await expect(weekTab).toHaveAttribute('aria-selected', 'true');

    await listTab.click();
    await expect(listTab).toHaveAttribute('aria-selected', 'true');

    await monthTab.click();
    await expect(monthTab).toHaveAttribute('aria-selected', 'true');

    await calendar
      .locator(`[role="gridcell"][data-date="${today}"]`)
      .getByRole('button', { name: todo, exact: true })
      .click();
    await expect(dataCy('dialog-event')).toBeAttached();
    await dataCy('btn-dialog-event-delete').click();
    await page.locator('.btn-confirm').click();
    await expect(dataCy('dialog-event')).not.toBeAttached();

    await calendar.getByRole('button', { name: 'Abos', exact: true }).click();
    await expect(dataCy('dialog-calendar-setting')).toBeAttached();
    await dataCy('btn-close-dialog').click();
    await expect(dataCy('dialog-calendar-setting')).not.toBeAttached();
  });
});
