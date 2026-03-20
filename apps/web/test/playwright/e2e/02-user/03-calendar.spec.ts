import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Calendar', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('fullcalendar', async ({ page, dataCy }) => {
		await expect(page.locator('.calendar-container .fc')).toBeAttached();

		const btnToday = page.locator('.fc-today-button');
		const btnNext = page.locator('.fc-next-button');

		await expect(btnToday).toBeDisabled();
		await btnNext.click();
		await expect(btnToday).not.toBeDisabled();
		await btnToday.click();

		// FullCalendar uses a custom "soft double-click" via dateClick (two clicks within 300ms)
		const element = page.locator('.fc-day-today .fc-daygrid-day-top');
		await element.scrollIntoViewIfNeeded();
		const box = await element.boundingBox();
		if (!box)
			throw new Error('Element not found');
		const x = box.x + box.width / 2;
		const y = box.y + box.height / 2;
		await page.mouse.click(x, y);
		await page.mouse.click(x, y);

		await expect(dataCy('form-todo')).toBeAttached();
		await page.locator('[name=todo]').fill(chance.animal());
		await dataCy('btn-form-save').click();
		await expect(dataCy('form-todo')).not.toBeAttached();

		await page.locator('.fc-dayGridWeek-button').click();
		await expect(page.locator('.fc-dayGridWeek-view')).toBeAttached();

		await page.locator('.fc-listWeek-button').click();
		await expect(page.locator('.fc-listWeek-view')).toBeAttached();

		await page.locator('.fc-dayGridMonth-button').click();
		await expect(page.locator('.fc-dayGridMonth-view')).toBeAttached();

		await page
			.locator('.fc-day-today .fc-daygrid-day-events .fa-clipboard')
			.first()
			.click({ force: true });
		await expect(dataCy('dialog-event')).toBeAttached();
		await dataCy('btn-dialog-event-delete').click();
		await page.locator('.btn-confirm').click();
		await expect(dataCy('form-todo')).not.toBeAttached();

		await page.locator('.fc-sources-button').click();
		await expect(dataCy('dialog-calendar-setting')).toBeAttached();
		await dataCy('btn-close-dialog').click();
		await expect(dataCy('dialog-calendar-setting')).not.toBeAttached();
	});
});
