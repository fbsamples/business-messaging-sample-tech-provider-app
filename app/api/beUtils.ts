// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

'use server';

import { sql } from '@vercel/postgres';

import getPrivateConfig from '@/app/privateConfig';
import publicConfig from '@/app/publicConfig';
import type {
  SubscribeWebhookResponse,
  SqlResult,
  WabaDetails,
  WabaRow,
  WabaWithDetails,
  PhoneNumber,
  PhoneDetails,
  ClientPhone,
  RegisterNumberResponse,
  DeregisterNumberResponse,
  RequestCodeResponse,
  VerifyCodeResponse,
  SendMessageResponse,
  MessageTemplate,
  TemplateComponentParam,
  TemplateGatingData,
  PageRow,
  PageWithDetails,
  AdAccountRow,
  AdAccountWithDetails,
  DatasetRow,
  DatasetWithDetails,
  CatalogRow,
  CatalogWithDetails,
  InstagramAccountRow,
  InstagramAccountWithDetails,
  AppDetails,
} from '@/app/types/api';

const { graphApiVersion, redirectUri } = publicConfig;

export async function getToken(code: string, appId: string): Promise<string> {
  const privateConfig = await getPrivateConfig();
  const { fbAppSecret } = privateConfig;
  console.log('getToken:', 'appId', appId);
  // OAuth token exchange requires client_secret as a query parameter per Meta's API spec
  const url = `/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${fbAppSecret}&code=${code}`;
  const data = await graphApiWrapperGet(url);
  console.log('getTokenResponse:', 'appId', appId);
  if (data.error) throw data.error;
  return data.access_token;
}

export async function subscribeWebhook(accessToken: string, wabaId: string): Promise<SubscribeWebhookResponse> {
  console.log('subscribeWebhook:', 'wabaId', wabaId);
  const url = `/${wabaId}/subscribed_apps`;
  const data = await graphApiWrapperPost(url, accessToken);
  console.log('subscribeWebhookResponse:', 'wabaId', wabaId);
  if (data.error) throw data.error;
  return data;
}

async function saveWabaToken(
  accessToken: string,
  wabaId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('saveWabaToken:', 'wabaId', wabaId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO wabas (user_id, app_id, waba_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${wabaId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, waba_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function savePageToken(
  accessToken: string,
  pageId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('savePageToken:', 'pageId', pageId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO pages (user_id, app_id, page_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${pageId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, page_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveAdAccountToken(
  accessToken: string,
  adAccountId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('saveAdAccountToken:', 'adAccountId', adAccountId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO ad_accounts (user_id, app_id, ad_account_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${adAccountId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, ad_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveDatasetToken(
  accessToken: string,
  datasetId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('saveDatasetToken:', 'datasetId', datasetId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO datasets (user_id, app_id, dataset_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${datasetId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, dataset_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveCatalogToken(
  accessToken: string,
  catalogId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('saveCatalogToken:', 'catalogId', catalogId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO catalogs (user_id, app_id, catalog_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${catalogId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, catalog_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveInstagramAccountToken(
  accessToken: string,
  instagramAccountId: string,
  appId: string,
  userId: string,
  businessId: string,
): Promise<SqlResult> {
  console.log('saveInstagramAccountToken:', 'instagramAccountId', instagramAccountId, 'appId', appId, 'businessId', businessId);

  return await sql`
        INSERT INTO instagram_accounts (user_id, app_id, instagram_account_id, access_token, business_id, last_updated)
        VALUES (${userId}, ${appId}, ${instagramAccountId}, ${accessToken}, ${businessId}, current_timestamp)
        ON CONFLICT (user_id, app_id, instagram_account_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, business_id = EXCLUDED.business_id, last_updated=current_timestamp
    `;
}

async function saveBusinessToken(
  accessToken: string,
  businessId: string,
  appId: string,
  userId: string,
): Promise<SqlResult> {
  console.log('saveBusinessToken:', 'businessId', businessId, 'appId', appId);

  return await sql`
        INSERT INTO businesses (user_id, app_id, business_id, access_token, last_updated)
        VALUES (${userId}, ${appId}, ${businessId}, ${accessToken}, current_timestamp)
        ON CONFLICT (user_id, app_id, business_id)
        DO UPDATE SET access_token = EXCLUDED.access_token, last_updated=current_timestamp
    `;
}

export async function saveTokens(
  userId: string,
  appId: string,
  businessId: string,
  pageIds: string[],
  adAccountIds: string[],
  wabaIds: string[],
  datasetIds: string[],
  catalogIds: string[],
  instagramAccountIds: string[],
  accessToken: string,
): Promise<SqlResult[]> {
  const promises: Promise<SqlResult>[] = [];
  promises.push(saveBusinessToken(accessToken, businessId, appId, userId));
  pageIds.forEach((pageId) => {
    promises.push(savePageToken(accessToken, pageId, appId, userId, businessId));
  });
  adAccountIds.forEach((adAccountId) => {
    promises.push(saveAdAccountToken(accessToken, adAccountId, appId, userId, businessId));
  });
  wabaIds.forEach((wabaId) => {
    promises.push(saveWabaToken(accessToken, wabaId, appId, userId, businessId));
  });
  datasetIds.forEach((datasetId) => {
    promises.push(saveDatasetToken(accessToken, datasetId, appId, userId, businessId));
  });
  catalogIds.forEach((catalogId) => {
    promises.push(saveCatalogToken(accessToken, catalogId, appId, userId, businessId));
  });
  instagramAccountIds.forEach((instagramAccountId) => {
    promises.push(saveInstagramAccountToken(accessToken, instagramAccountId, appId, userId, businessId));
  });
  return Promise.all(promises);
}

export async function registerNumber(phoneId: string, accessToken: string): Promise<RegisterNumberResponse> {
  const privateConfig = await getPrivateConfig();
  const { fbRegPin } = privateConfig;
  console.log('registerNumber:', 'phoneId', phoneId);
  const url = `/${phoneId}/register`;
  const data = await graphApiWrapperPost(url, accessToken, {
    messaging_product: 'whatsapp',
    pin: fbRegPin,
  });
  console.log('registerNumberResponse:', 'phoneId', phoneId);
  if (data.error) throw data.error;
  return data;
}

export async function deregisterNumber(phoneId: string, accessToken: string): Promise<DeregisterNumberResponse> {
  console.log('deregisterNumber:', 'phoneId', phoneId);
  const url = `/${phoneId}/deregister`;
  const data = await graphApiWrapperPost(url, accessToken);
  console.log('deregisterNumberResponse:', 'phoneId', phoneId);
  if (data.error) throw data.error;
  return data;
}

export async function send(
  phoneNumberId: string,
  accessToken: string,
  destPhone: string,
  messageContent: string,
): Promise<SendMessageResponse> {
  console.log('send:', 'phoneNumberId', phoneNumberId);
  const url = `/${phoneNumberId}/messages`;
  const data = await graphApiWrapperPost(url, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: messageContent,
    },
  });
  if (data.error) throw data.error;
  return data;
}

//////////////////////////////////////////////////////////
// WABA Details \/
//////////////////////////////////////////////////////////

export async function getWabas(userId: string): Promise<WabaWithDetails[]> {
  // Get page IDs and access tokens from the database
  const { rows }: { rows: WabaRow[] } = await sql`
    SELECT DISTINCT waba_id, access_token, business_id
    FROM wabas
    WHERE user_id = ${userId}
    ORDER BY waba_id ASC
  `;

  // Fetch page names from Facebook Graph API
  const wholeWabas: WabaWithDetails[] = await Promise.all(
    rows.map(async (waba: WabaRow) => {
      try {
        const wholeWaba: WabaDetails = await getWabaDetails(waba.waba_id, waba.access_token);
        return {
          ...wholeWaba,
          business_id: waba.business_id,
          access_token: waba.access_token,
        } as WabaWithDetails;
      } catch (error) {
        console.error(`Error fetching name for page ${waba.waba_id}:`, error);
        return {
          id: waba.waba_id,
          name: 'Error Loading Name',
          account_review_status: 'unknown',
          ownership_type: 'unknown',
          subscribed_apps: { data: [] },
          business_verification_status: 'unknown',
          country: 'unknown',
          currency: 'unknown',
          timezone_id: 'unknown',
          is_enabled_for_insights: false,
          phone_numbers: { data: [] },
          business_id: waba.business_id,
          access_token: waba.access_token,
        } as WabaWithDetails;
      }
    }),
  );
  return wholeWabas;
}

async function getWabaDetails(wabaId: string, accessToken: string): Promise<WabaDetails> {
  const url = `/${wabaId}?fields=account_review_status,purchase_order_number,audiences,name,ownership_type,subscribed_apps,business_verification_status,country,currency,timezone_id,on_behalf_of_business_info,schedules,is_enabled_for_insights,message_templates,phone_numbers`;
  return graphApiWrapperGet(url, accessToken);
}

//////////////////////////////////////////////////////////
// Phones
//////////////////////////////////////////////////////////

async function getWabaRows(userId: string): Promise<WabaRow[]> {
  const { rows }: { rows: WabaRow[] } =
    await sql`SELECT DISTINCT ON (waba_id) access_token, waba_id, business_id FROM wabas WHERE user_id = ${userId}`;
  return rows;
}

export async function getClientPhones(userId: string): Promise<ClientPhone[]> {
  const rows: WabaRow[] = await getWabaRows(userId);
  const nestedPhones: PhoneDetails[][] = await Promise.all(
    rows.map(async (row: WabaRow) => {
      const wabaId: string = row.waba_id;
      const accessToken: string = row.access_token;
      const data = await graphApiWrapperGet(`/${wabaId}?fields=phone_numbers`, accessToken);
      const phones: PhoneNumber[] = data?.phone_numbers?.data || [];
      const phoneDeets: PhoneDetails[] = await Promise.all(
        phones.map(async (phone: PhoneNumber) => {
          return await getPhoneDetails(phone.id, accessToken, wabaId);
        }),
      );
      return phoneDeets;
    }),
  );
  return nestedPhones.flat() as ClientPhone[];
}

async function getPhoneDetails(phoneId: string, accessToken: string, wabaId: string): Promise<PhoneDetails> {
  const data = await graphApiWrapperGet(
    `/${phoneId}?fields=status,account_mode,certificate,is_on_biz_app,display_phone_number,code_verification_status`,
    accessToken,
  );
  data.wabaId = wabaId;
  const isAckBotEnabled = await getAckBotStatus(phoneId);
  data.isAckBotEnabled = isAckBotEnabled;
  return data;
}

export async function getTokenForWaba(wabaId: string, userId: string): Promise<string> {
  console.log('getTokenForWaba:', 'wabaId', wabaId);
  const { rows }: { rows: { access_token: string }[] } =
    await sql`SELECT access_token FROM wabas WHERE waba_id = ${wabaId} AND user_id = ${userId}`;
  if (rows.length === 0) {
    throw new Error(`No access token found for WABA ${wabaId}`);
  }
  return rows[0].access_token;
}

export async function getTokenForWabaByUser(wabaId: string, userId: string, appId: string): Promise<string | null> {
  console.log('getTokenForWabaByUser:', 'wabaId', wabaId, 'userId', userId, 'appId', appId);
  const { rows }: { rows: { access_token: string }[] } = await sql`
    SELECT access_token FROM wabas
    WHERE waba_id = ${wabaId} AND user_id = ${userId} AND app_id = ${appId}
  `;
  return rows[0]?.access_token || null;
}

// ============================================================================
// Calling
// ============================================================================

export async function graphApiCallAction(
  userId: string,
  wabaId: string,
  phoneNumberId: string,
  body: Record<string, unknown>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  const token = await getTokenForWaba(wabaId, userId);
  return graphApiWrapperPost(`/${phoneNumberId}/calls`, token, body);
}

export async function graphApiCallPermissionsGet(
  userId: string,
  wabaId: string,
  phoneNumberId: string,
  userWaId: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  const token = await getTokenForWaba(wabaId, userId);
  return graphApiWrapperGet(
    `/${phoneNumberId}/call_permissions?user_wa_id=${userWaId}`,
    token,
  );
}

export async function graphApiGetCallSettings(
  userId: string,
  wabaId: string,
  phoneNumberId: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  const token = await getTokenForWaba(wabaId, userId);
  return graphApiWrapperGet(`/${phoneNumberId}/settings`, token);
}

export async function graphApiUpdateCallSettings(
  userId: string,
  wabaId: string,
  phoneNumberId: string,
  enabled: boolean,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  const token = await getTokenForWaba(wabaId, userId);
  return graphApiWrapperPost(`/${phoneNumberId}/settings`, token, {
    calling: {
      status: enabled ? 'ENABLED' : 'DISABLED',
      callback_permission_status: enabled ? 'ENABLED' : 'DISABLED',
    },
  });
}

export async function graphApiEnableCallingWithToken(
  phoneNumberId: string,
  accessToken: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  return graphApiWrapperPost(`/${phoneNumberId}/settings`, accessToken, {
    calling: {
      status: 'ENABLED',
      callback_permission_status: 'ENABLED',
    },
  });
}

export async function graphApiSendCallPermissionRequest(
  userId: string,
  wabaId: string,
  phoneNumberId: string,
  to: string,
  bodyText: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  const token = await getTokenForWaba(wabaId, userId);
  return graphApiWrapperPost(`/${phoneNumberId}/messages`, token, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'call_permission_request',
      body: { text: bodyText },
      action: { name: 'call_permission_request' },
    },
  });
}

//////////////////////////////////////////////////////////
// Verification Request \/
//////////////////////////////////////////////////////////

export async function requestCode(phoneId: string, accessToken: string): Promise<RequestCodeResponse> {
  console.log('requestCode:', 'phoneId', phoneId);
  const url = `/${phoneId}/request_code?code_method=SMS&language=en`;
  return graphApiWrapperPost(url, accessToken);
}

export async function verifyCode(phoneId: string, accessToken: string, otpCode: string): Promise<VerifyCodeResponse> {
  console.log('verifyCode:', 'phoneId', phoneId);
  const url = `/${phoneId}/verify_code?code=${otpCode}`;
  return graphApiWrapperPost(url, accessToken).then((data) => {
    // graphApiWrapperPost never throws — it returns the raw response including errors.
    // We must explicitly check and throw so the /api/verify-code route catches the
    // error and returns a 4xx, keeping the modal on P1 (verify step) instead of
    // advancing to P2 (register step) on a wrong OTP.
    if (data.error) throw data.error;
    return data;
  });
}

//////////////////////////////////////////////////////////
// Paid Messaging (Templates)
//////////////////////////////////////////////////////////

export async function getMessageTemplates(wabaId: string, accessToken: string): Promise<MessageTemplate[]> {
  console.log('getMessageTemplates:', 'wabaId', wabaId);
  const url = `/${wabaId}/message_templates?fields=name,language,status,components,category&limit=1000`;
  const data = await graphApiWrapperGet(url, accessToken);
  if (data.error) {
    console.error('getMessageTemplates error:', data.error.message || data.error.code || 'unknown');
    throw new Error(data.error.message || 'Failed to fetch message templates');
  }
  const templates: MessageTemplate[] = data.data || [];
  const sendableStatuses = ['APPROVED', 'QUALITY_PENDING'];
  return templates.filter((t: MessageTemplate) => sendableStatuses.includes(t.status));
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  templateLanguage: string,
  components: TemplateComponentParam[]
): Promise<SendMessageResponse> {
  console.log('sendTemplateMessage:', 'phoneNumberId', phoneNumberId, 'to', to, 'templateName', templateName);
  const url = `/${phoneNumberId}/messages`;
  const data = await graphApiWrapperPost(url, accessToken, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components,
    },
  });

  // graphApiWrapperPost does NOT throw on Graph API errors — it returns
  // the error object as data. We must explicitly check and throw.
  if (data.error) {
    const err = new Error(data.error.message || 'Graph API error');
    Object.assign(err, { status: 400, graphApiError: data.error });
    throw err;
  }

  return data;
}

export async function checkWabaPaymentMethod(
  wabaId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const healthData = await graphApiWrapperGet(
      `/${wabaId}?fields=health_status`, accessToken
    );

    // health_status returns { can_send_message, entities[] } where each entity
    // has { entity_type, can_send_message, errors[] }. A WABA entity with a
    // PAYMENT_METHOD_ERROR in its errors means no valid payment method is attached.
    // The absence of such an error means payment is healthy.
    if (healthData && !healthData.error && healthData.health_status) {
      const entities: { entity_type: string; errors: { error_description: string; possible_solution: string }[] }[] =
        healthData.health_status.entities || [];
      const wabaEntity = entities.find((e) => e.entity_type === 'WABA');
      const hasPaymentError = wabaEntity?.errors?.some(
        (err) => err.possible_solution?.toLowerCase().includes('payment method')
      ) ?? false;
      return !hasPaymentError;
    }
  } catch (err) {
    console.error('checkWabaPaymentMethod error:', 'wabaId', wabaId, err);
  }

  return false;
}

export async function getTemplateGatingData(
  wabaId: string,
  accessToken: string
): Promise<TemplateGatingData> {
  let hasPaymentMethod = false;
  let hasApprovedTemplates = false;

  try {
    const [paymentResult, templateData] = await Promise.all([
      checkWabaPaymentMethod(wabaId, accessToken),
      graphApiWrapperGet(
        `/${wabaId}/message_templates?fields=name,status&limit=100`,
        accessToken
      ).catch((err: unknown): null => { console.error('getTemplateGatingData: failed to fetch templates:', err); return null; }),
    ]);

    hasPaymentMethod = paymentResult;

    if (templateData && !templateData.error) {
      const templates: { status: string }[] = templateData.data || [];
      const sendableStatuses = ['APPROVED', 'QUALITY_PENDING'];
      hasApprovedTemplates = templates.some((t) => sendableStatuses.includes(t.status));
    }
  } catch (err) {
    console.error('getTemplateGatingData error:', 'wabaId', wabaId, err);
  }

  return { hasPaymentMethod, hasApprovedTemplates };
}

//////////////////////////////////////////////////////////
// Pages
//////////////////////////////////////////////////////////

export async function getPages(userId: string): Promise<PageWithDetails[]> {
  // Get page IDs and access tokens from the database
  const { rows }: { rows: PageRow[] } = await sql`
    SELECT DISTINCT page_id, access_token, business_id
    FROM pages
    WHERE user_id = ${userId}
    ORDER BY page_id ASC
  `;

  // Fetch page names from Facebook Graph API
  const pagesWithNames: PageWithDetails[] = await Promise.all(
    rows.map(async (page: PageRow) => {
      try {
        const data = await graphApiWrapperGet(`/${page.page_id}?fields=name,ad_campaign`, page.access_token);
        return {
          ...page,
          name: data.name || 'Unknown Page',
          ad_campaign: data.ad_campaign || 'No Ad Campaign',
        } as PageWithDetails;
      } catch (error) {
        console.error(`Error fetching name for page ${page.page_id}:`, error);
        return {
          ...page,
          name: 'Error Loading Name',
          ad_campaign: 'No Ad Campaign',
        } as PageWithDetails;
      }
    }),
  );
  return pagesWithNames;
}

//////////////////////////////////////////////////////////
// Ad accounts
//////////////////////////////////////////////////////////

export async function getAdAccounts(userId: string): Promise<AdAccountWithDetails[]> {
  // Get ad account IDs and access tokens from the database
  const { rows }: { rows: AdAccountRow[] } = await sql`
    SELECT DISTINCT ad_account_id, access_token, business_id
    FROM ad_accounts
    WHERE user_id = ${userId}
    ORDER BY ad_account_id ASC
  `;

  // Fetch ad account names from Facebook Graph API
  const adAccountsWithNames: AdAccountWithDetails[] = await Promise.all(
    rows.map(async (account: AdAccountRow) => {
      try {
        const data = await graphApiWrapperGet(`/act_${account.ad_account_id}?fields=name`, account.access_token);
        return {
          ...account,
          name: data.name || 'Unknown Account',
        };
      } catch (error) {
        console.error(`Error fetching name for ad account ${account.ad_account_id}:`, error);
        return {
          ...account,
          name: 'Error Loading Name',
        };
      }
    }),
  );
  return adAccountsWithNames;
}

//////////////////////////////////////////////////////////
// Request Wrappers
//////////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
async function graphApiWrapperGet(url: string, accessToken?: string): Promise<any> {
  console.log('graphApiWrapperGet:', 'path', url.split('?')[0]);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(`https://graph.facebook.com/${graphApiVersion}${url}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  const data = await response.json();
  if (data.error) {
    console.log(
      'graphApiWrapperGetResponse:',
      'path',
      url.split('?')[0],
      'error',
      data.error.message || data.error.code || 'unknown',
    );
  } else {
    console.log('graphApiWrapperGetResponse:', 'path', url.split('?')[0]);
  }
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
async function graphApiWrapperPost(
  url: string,
  accessToken: string,
  params: Record<string, unknown> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Graph API responses have dynamic, untyped shapes
): Promise<any> {
  console.log('graphApiWrapperPost:', 'path', url.split('?')[0]);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(`https://graph.facebook.com/${graphApiVersion}${url}`, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (data.error) {
    console.log(
      'graphApiWrapperPostError:',
      'path',
      url.split('?')[0],
      'error',
      data.error.message || data.error.code || 'unknown',
    );
  } else {
    console.log('graphApiWrapperPostResponse:', 'path', url.split('?')[0]);
  }
  return data;
}

//////////////////////////////////////////////////////////
// SQL
//////////////////////////////////////////////////////////

export async function getAckBotStatus(phoneId: string): Promise<boolean> {
  const { rows }: { rows: { is_ack_bot_enabled: string }[] } =
    await sql`SELECT is_ack_bot_enabled FROM phones WHERE phone_id = ${phoneId}`;
  const isAckBotEnabled = rows[0]?.is_ack_bot_enabled === 'true';
  return isAckBotEnabled;
}

export async function getAckBotMessage(phoneId: string, userId?: string): Promise<string> {
  if (userId) {
    const { rows }: { rows: { ack_bot_message?: string }[] } =
      await sql`SELECT ack_bot_message FROM phones WHERE phone_id = ${phoneId} AND user_id = ${userId}`;
    return rows[0]?.ack_bot_message || '';
  }
  // Webhook context: no user session, authenticated by X-Hub-Signature-256
  const { rows }: { rows: { ack_bot_message?: string }[] } =
    await sql`SELECT ack_bot_message FROM phones WHERE phone_id = ${phoneId}`;
  return rows[0]?.ack_bot_message || '';
}

export async function setAckBotStatus(
  phoneId: string,
  isAckBotEnabled: boolean,
  userId: string,
  ackBotMessage?: string,
): Promise<SqlResult> {
  if (ackBotMessage !== undefined) {
    return await sql`
            INSERT INTO phones (phone_id, is_ack_bot_enabled, ack_bot_message, user_id)
            VALUES (${phoneId}, ${isAckBotEnabled}, ${ackBotMessage}, ${userId})
            ON CONFLICT (phone_id)
            DO UPDATE SET is_ack_bot_enabled = EXCLUDED.is_ack_bot_enabled, ack_bot_message = EXCLUDED.ack_bot_message, user_id = EXCLUDED.user_id
        `;
  }
  return await sql`
        INSERT INTO phones (phone_id, is_ack_bot_enabled, user_id)
        VALUES (${phoneId}, ${isAckBotEnabled}, ${userId})
        ON CONFLICT (phone_id)
        DO UPDATE SET is_ack_bot_enabled = EXCLUDED.is_ack_bot_enabled, user_id = EXCLUDED.user_id
    `;
}

//////////////////////////////////////////////////////////
// App Details
//////////////////////////////////////////////////////////

export async function getAppDetails(appId: string): Promise<AppDetails> {
  const privateConfig = await getPrivateConfig();
  console.log('getAppDetails:', 'appId', appId);
  const url = `/${appId}?fields=client_config,name,logo_url,app_domains,app_type,company,link,config_ids`;
  const data = await graphApiWrapperGet(url, `${publicConfig.appId}|${privateConfig.fbAppSecret}`);
  if (data.error) throw data.error;
  return data;
}

//////////////////////////////////////////////////////////
// Datasets
//////////////////////////////////////////////////////////

export async function getDatasets(userId: string): Promise<DatasetWithDetails[]> {
  // Get dataset IDs and access tokens from the database
  const { rows }: { rows: DatasetRow[] } = await sql`
    SELECT DISTINCT dataset_id, access_token, business_id
    FROM datasets
    WHERE user_id = ${userId}
    ORDER BY dataset_id ASC
  `;

  // Fetch dataset details from Facebook Graph API
  const datasetsWithDetails: DatasetWithDetails[] = await Promise.all(
    rows.map(async (dataset: DatasetRow) => {
      try {
        const data = await graphApiWrapperGet(
          `/${dataset.dataset_id}?fields=name,code,last_fired_time`,
          dataset.access_token,
        );
        return {
          id: dataset.dataset_id,
          name: data.name || 'Unnamed Dataset',
          code: data.code || `fbq('init', '${dataset.dataset_id}');`,
          status: 'Active',
          last_fired_time: data.last_fired_time || null,
          access_token: dataset.access_token,
          business_id: dataset.business_id,
        };
      } catch (error) {
        console.error(`Error fetching details for dataset ${dataset.dataset_id}:`, error);
        return {
          id: dataset.dataset_id,
          name: 'Error Loading dataset',
          code: `fbq('init', '${dataset.dataset_id}');`,
          status: 'Error',
          last_fired_time: null,
          access_token: dataset.access_token,
          business_id: dataset.business_id,
        };
      }
    }),
  );
  return datasetsWithDetails;
}

//////////////////////////////////////////////////////////
// Catalogs
//////////////////////////////////////////////////////////

export async function getCatalogs(userId: string): Promise<CatalogWithDetails[]> {
  // Get catalog IDs and access tokens from the database
  const { rows }: { rows: CatalogRow[] } = await sql`
    SELECT DISTINCT catalog_id, access_token, business_id
    FROM catalogs
    WHERE user_id = ${userId}
    ORDER BY catalog_id ASC
  `;

  // Fetch catalog details from Facebook Graph API
  const catalogsWithDetails: CatalogWithDetails[] = await Promise.all(
    rows.map(async (catalog: CatalogRow) => {
      try {
        const data = await graphApiWrapperGet(`/${catalog.catalog_id}?fields=name`, catalog.access_token);
        return {
          id: catalog.catalog_id,
          name: data.name || 'Unnamed Catalog',
          access_token: catalog.access_token,
          business_id: catalog.business_id,
        };
      } catch (error) {
        console.error(`Error fetching details for catalog ${catalog.catalog_id}:`, error);
        return {
          id: catalog.catalog_id,
          name: 'Error Loading Catalog',
          access_token: catalog.access_token,
          business_id: catalog.business_id,
        };
      }
    }),
  );
  return catalogsWithDetails;
}

//////////////////////////////////////////////////////////
// Instagram Accounts
//////////////////////////////////////////////////////////

export async function getInstagramAccounts(userId: string): Promise<InstagramAccountWithDetails[]> {
  // Get Instagram account IDs and access tokens from the database
  const { rows }: { rows: InstagramAccountRow[] } = await sql`
    SELECT DISTINCT instagram_account_id, access_token, business_id
    FROM instagram_accounts
    WHERE user_id = ${userId}
    ORDER BY instagram_account_id ASC
  `;

  // Build IG account ID -> username map using page tokens.
  // The ES user token typically lacks instagram_basic scope, so querying
  // /{ig_id}?fields=username directly returns an error.
  // Instead we use the page token (which has pages_show_list scope) to call
  // /{page_id}?fields=instagram_business_account{id,username,name} and map
  // the linked IG account ID to its username.
  const { rows: pageRows }: { rows: { page_id: string; access_token: string }[] } = await sql`
    SELECT DISTINCT page_id, access_token
    FROM pages
    WHERE user_id = ${userId}
  `;

  const igUsernameMap: Record<string, string> = {};
  await Promise.all(
    pageRows.map(async (page) => {
      try {
        const data = await graphApiWrapperGet(
          `/${page.page_id}?fields=instagram_business_account{id,username,name}`,
          page.access_token,
        );
        const iga = data?.instagram_business_account;
        if (iga?.id) {
          igUsernameMap[iga.id] = iga.username || iga.name || '';
        }
      } catch {
        // best-effort; ignore individual page failures
      }
    }),
  );

  // Fetch Instagram account details from Facebook Graph API
  const instagramAccountsWithDetails: InstagramAccountWithDetails[] = await Promise.all(
    rows.map(async (account: InstagramAccountRow) => {
      // Primary: use username resolved via page token
      const resolvedUsername = igUsernameMap[account.instagram_account_id];
      if (resolvedUsername) {
        return {
          id: account.instagram_account_id,
          username: resolvedUsername,
          access_token: account.access_token,
          business_id: account.business_id,
        };
      }
      // Fallback: query the IG ID directly (works if token has instagram_basic scope)
      try {
        const data = await graphApiWrapperGet(
          `/${account.instagram_account_id}?fields=username,name`,
          account.access_token,
        );
        if (data.username || data.name) {
          return {
            id: account.instagram_account_id,
            username: data.username || data.name,
            access_token: account.access_token,
            business_id: account.business_id,
          };
        }
        console.warn(`Instagram ${account.instagram_account_id}: no username or name found`);
      } catch (error) {
        console.error(`Error fetching details for Instagram account ${account.instagram_account_id}:`, error);
      }
      return {
        id: account.instagram_account_id,
        username: 'unknown',
        access_token: account.access_token,
        business_id: account.business_id,
      };
    }),
  );
  return instagramAccountsWithDetails;
}
