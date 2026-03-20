import type { Locator, Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import userDemoFixture from '../fixtures/user_demo.json' with { type: 'json' };
import userNewFixture from '../fixtures/user_new.json' with { type: 'json' };

export interface Fixtures {
	dataCy: (selector: string) => Locator;
	tableEditRow: (form: string) => Promise<void>;
	tableDeleteRow: () => Promise<void>;
	addDemoMail: (useNewUser?: boolean) => Promise<void>;
	addDemoPassword: (useNewUser?: boolean) => Promise<void>;
}

export const test = base.extend<Fixtures>({
	dataCy: async ({ page }, use) => {
		await use((selector: string) => page.locator(`[data-cy="${selector}"]`));
	},

	tableEditRow: async ({ page }, use) => {
		await use(async (form: string) => {
			await page.locator('tbody > tr > td').first().click();
			await page.locator('[data-cy="btn-table-edit"]').click();
			await expect(page.locator(`[data-cy="${form}"]`)).toBeAttached();
			await page.locator('[data-cy="btn-form-update"]').click();
			await expect(
				page.locator(`[data-cy="${form}"]`),
			).not.toBeAttached();
			await page.locator('tbody > tr > td').first().click();
		});
	},

	tableDeleteRow: async ({ page }, use) => {
		await use(async () => {
			await page.locator('tbody > tr > td').first().click();
			await page.locator('[data-cy="btn-table-dropdown"]').click();
			await page.locator('[data-cy="btn-table-delete"]').click();
			await expect(page.locator('.q-dialog')).toBeAttached();
			await page.locator('.btn-confirm').click();
			await expect(page.locator('.q-dialog')).not.toBeAttached();
		});
	},

	addDemoMail: async ({ page }, use) => {
		await use(async (useNewUser = false) => {
			const mail = useNewUser
				? `test${Date.now()}@btree.at`
				: userDemoFixture.mail;
			await page.locator('[name=email]').clear();
			await page.locator('[name=email]').fill(mail);
		});
	},

	addDemoPassword: async ({ page }, use) => {
		await use(async (useNewUser = false) => {
			const user = useNewUser ? userNewFixture : userDemoFixture;
			await page.locator('[name=password]').clear();
			await page.locator('[name=password]').fill(user.password);
			await page.locator('[name=confirmPassword]').clear();
			await page.locator('[name=confirmPassword]').fill(user.password);
		});
	},
});

export { expect };
export type { Locator, Page };
