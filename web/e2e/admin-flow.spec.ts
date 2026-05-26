import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('Login, Create Survey, Assign Location', async ({ page }) => {
    // Mock do login para evitar "Erro de conexão com o servidor"
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          user: { id: 1, access_code: 'admin', role: 'ADMIN' }
        })
      });
    });

    // Mocks for Surveys
    await page.route('**/surveys*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: '123', title: 'Pesquisa E2E Test', is_active: true }) });
      } else {
        await route.continue();
      }
    });

    // Mocks for Locations
    await page.route('**/locations*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: '456', name: 'Local E2E', unique_code: 'E2E', city: 'Castanhal', state: 'PA' }) });
      } else {
        await route.continue();
      }
    });

    // 1. Acesso ao Sistema e Login
    await page.goto('/');
    await page.getByRole('link', { name: 'Acessar o Sistema' }).click();
    
    // Aguarda e preenche a tela de login
    await page.getByRole('textbox', { name: 'Código de Acesso' }).fill('admin');
    await page.getByPlaceholder('Sua senha secreta').fill('admin123');
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click();

    // 2. Verificar Dashboard (aguarda o carregamento após login)
    await expect(page.locator('text=Dashboard').first()).toBeVisible();

    // 3. Navegação para Questionários (Criação de questionário)
    await page.getByRole('link', { name: 'Questionários' }).click();
    await expect(page.locator('h1', { hasText: 'Novo Questionário' })).toBeVisible();
    await page.getByPlaceholder('Ex: Pesquisa de Campo').fill('Pesquisa E2E Test');
    await page.getByRole('button', { name: 'Salvar Questionário' }).click();

    // 4. Navegação para Locais (Associação a local)
    await page.getByRole('link', { name: 'Locais' }).click();
    await expect(page.locator('text=Novo Local')).toBeVisible();
    await page.getByPlaceholder('Ex: Comunidade Ribeirinha São José').fill('Local E2E');
    await page.getByPlaceholder('Ex: SJ-01').fill('E2E');
    await page.getByRole('button', { name: 'Cadastrar Local' }).click();
  });
});