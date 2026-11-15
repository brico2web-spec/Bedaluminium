/* Shared Supabase REST client. The publishable key is safe for browser use; RLS protects writes. */
(function () {
    const BASE_URL = 'https://lewbqologrsbwxahqjpq.supabase.co';
    const PUBLISHABLE_KEY = 'sb_publishable_48UkhxtOs21xmYZBoA1yKw_dMa8oxcv';
    const TOKEN_KEY = 'bedAlu_supabase_access_token';

    async function request(path, options = {}) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const headers = {
            apikey: PUBLISHABLE_KEY,
            Authorization: 'Bearer ' + (token || PUBLISHABLE_KEY),
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        };
        const response = await fetch(BASE_URL + path, { ...options, headers });
        if (!response.ok) {
            const message = await response.text();
            throw new Error('Supabase ' + response.status + ': ' + message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    window.bedAluSupabase = {
        async signIn(email, password) {
            const response = await fetch(BASE_URL + '/auth/v1/token?grant_type=password', {
                method: 'POST',
                headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) throw new Error('Supabase sign-in failed: ' + await response.text());
            const session = await response.json();
            if (session.user?.app_metadata?.role !== 'admin') throw new Error('This account is not assigned the admin role.');
            sessionStorage.setItem(TOKEN_KEY, session.access_token);
            return session.user;
        },
        async getSiteData() {
            const rows = await request('/rest/v1/site_settings?id=eq.main&select=payload');
            return rows?.[0]?.payload || null;
        },
        async saveSiteData(payload) {
            return request('/rest/v1/site_settings?on_conflict=id', {
                method: 'POST',
                headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify({ id: 'main', payload, updated_at: new Date().toISOString() })
            });
        },
        async getTestimonials(status = 'approved') {
            const query = new URLSearchParams({ select: 'id,name,location,comment,language,status,created_at', status: 'eq.' + status, order: 'created_at.desc' });
            return request('/rest/v1/testimonials?' + query.toString());
        },
        async addTestimonial(review) {
            return request('/rest/v1/testimonials', {
                method: 'POST',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({
                    name: review.name, location: review.location, comment: review.comment,
                    language: review.language, status: 'pending'
                })
            });
        },
        async moderateTestimonial(id, status) {
            const query = new URLSearchParams({ id: 'eq.' + id, status: 'eq.pending' });
            return request('/rest/v1/testimonials?' + query.toString(), {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ status })
            });
        }
    };
})();
