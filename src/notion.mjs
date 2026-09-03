const NOTION_BASE = 'https://api.notion.com/v1';

export class NotionBridgeClient {
  constructor(token, notionVersion = process.env.NOTION_VERSION || '2025-09-03') {
    if (!token) throw new Error('NOTION_TOKEN is required.');
    this.token = token;
    this.notionVersion = notionVersion;
  }

  async request(path, init = {}) {
    const res = await fetch(`${NOTION_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Notion-Version': this.notionVersion,
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion ${res.status} ${res.statusText} for ${init.method || 'GET'} ${path}: ${body}`);
    }
    return res.json();
  }

  retrievePage(pageId) { return this.request(`/pages/${normalizeId(pageId)}`); }

  async querySource(sourceId, body = {}) {
    const normalized = normalizeId(sourceId);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
      throw new Error(`Invalid Notion data source ID: ${sourceId}`);
    }

    const all = [];
    let cursor;
    do {
      const payload = { page_size: 100, ...body, ...(cursor ? { start_cursor: cursor } : {}) };
      const data = await this.request(
        `/data_sources/${normalized}/query`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      all.push(...(data.results || []));
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
    } while (cursor);
    return all;
  }
}

export function normalizeId(id='') {
  const hex = String(id).replace(/[^a-fA-F0-9]/g, '').toLowerCase();
  if (hex.length !== 32) return hex;
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function prop(page, name) { return page?.properties?.[name]; }
export function richText(parts = []) { return parts.map(p => p.plain_text ?? p.text?.content ?? '').join(''); }
export function plainText(property) {
  if (!property) return '';
  if (typeof property === 'string') return property;
  switch (property.type) {
    case 'title': return richText(property.title);
    case 'rich_text': return richText(property.rich_text);
    case 'select': return property.select?.name || '';
    case 'status': return property.status?.name || '';
    case 'url': return property.url || '';
    case 'email': return property.email || '';
    case 'phone_number': return property.phone_number || '';
    case 'checkbox': return property.checkbox ? 'true' : 'false';
    case 'number': return property.number == null ? '' : String(property.number);
    case 'date': return property.date?.start || '';
    case 'unique_id': {
      const p = property.unique_id?.prefix ? `${property.unique_id.prefix}-` : '';
      return property.unique_id?.number != null ? `${p}${property.unique_id.number}` : '';
    }
    case 'people': return (property.people || []).map(p => p.name || p.id).join(', ');
    case 'multi_select': return (property.multi_select || []).map(x => x.name).join(', ');
    case 'relation': return (property.relation || []).map(x => x.id).join(', ');
    default: return '';
  }
}
export function relationContains(property, pageId) {
  const target = normalizeId(pageId).toLowerCase();
  return property?.type === 'relation' && (property.relation || []).some(r => normalizeId(r.id).toLowerCase() === target);
}
