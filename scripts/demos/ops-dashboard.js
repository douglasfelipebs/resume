const JOBS = [
    {
        id: 'JOB-1042',
        name: 'Nightly invoice import',
        status: 'done',
        owner: 'Billing',
        updated: '26 Oct 2026, 08:10',
        summary: 'Imported 1,240 fictional invoices. No rows were rejected.',
        steps: ['Fetched the file from storage', 'Validated the schema', 'Wrote the rows', 'Published import.finished']
    },
    {
        id: 'JOB-1048',
        name: 'Webhook delivery: payment.failed',
        status: 'failed',
        owner: 'Integrations',
        updated: '26 Oct 2026, 09:02',
        summary: 'The partner returned 503 twice. The message is waiting on a retry decision.',
        steps: ['Signed the payload', 'Posted to the partner', 'Received 503', 'Scheduled a retry']
    },
    {
        id: 'JOB-1051',
        name: 'Search index refresh',
        status: 'running',
        owner: 'Platform',
        updated: '26 Oct 2026, 09:40',
        summary: 'Rebuilding the fictional product index. Queries still read the previous snapshot.',
        steps: ['Locked the index alias', 'Writing the new snapshot', 'Alias swap still pending']
    },
    {
        id: 'JOB-1055',
        name: 'Invite emails',
        status: 'queued',
        owner: 'Growth',
        updated: '26 Oct 2026, 09:44',
        summary: 'Forty fictional invites are waiting for a quiet window.',
        steps: ['Batch accepted', 'Waiting for the send window']
    },
    {
        id: 'JOB-1056',
        name: 'Image thumbnail pass',
        status: 'queued',
        owner: 'Media',
        updated: '26 Oct 2026, 09:46',
        summary: 'New uploads are in the queue. No thumbnails have been written yet.',
        steps: ['Uploads stored', 'Thumbnail worker not started']
    },
    {
        id: 'JOB-1033',
        name: 'Session cleanup',
        status: 'done',
        owner: 'Platform',
        updated: '25 Oct 2026, 02:00',
        summary: 'Expired sessions were removed from the cache.',
        steps: ['Scanned the cache', 'Deleted expired keys', 'Recorded the count']
    },
    {
        id: 'JOB-1060',
        name: 'Report export',
        status: 'running',
        owner: 'Billing',
        updated: '26 Oct 2026, 09:48',
        summary: 'A CSV export is streaming. The file is not ready for download.',
        steps: ['Query started', 'Streaming rows', 'Upload not finished']
    },
    {
        id: 'JOB-1019',
        name: 'Partner token refresh',
        status: 'failed',
        owner: 'Integrations',
        updated: '26 Oct 2026, 07:15',
        summary: 'The identity provider rejected the refresh. Calls that need this token are paused.',
        steps: ['Read the stored refresh token', 'Token endpoint returned 401', 'Marked the integration paused']
    }
];

const searchInput = document.getElementById('job-search');
const statusInput = document.getElementById('job-status');
const failInput = document.getElementById('job-fail');
const reloadButton = document.getElementById('job-reload');
const summary = document.getElementById('job-summary');
const list = document.getElementById('job-list');
const detail = document.getElementById('job-detail');

let loaded = [];
let mode = 'loading';
let query = '';
let status = 'all';
let selectedId = null;
let request = 0;

function statusLabel(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function visibleJobs() {
    const needle = query.trim().toLowerCase();
    return loaded.filter(job => {
        const matchesStatus = status === 'all' || job.status === status;
        const matchesQuery = !needle
            || job.name.toLowerCase().includes(needle)
            || job.id.toLowerCase().includes(needle);
        return matchesStatus && matchesQuery;
    });
}

function renderSummary(visibleCount) {
    if (mode === 'loading') {
        summary.textContent = 'Loading jobs…';
        return;
    }
    if (mode === 'error') {
        summary.textContent = 'List unavailable. Uncheck the box and reload to try again.';
        return;
    }
    const noun = visibleCount === 1 ? 'job' : 'jobs';
    summary.textContent = `Showing ${visibleCount} of ${loaded.length} ${noun}. Search for a missing name to see the empty state. Check “Simulate a failed load” and press Reload to see the error.`;
}

function renderDetail() {
    detail.replaceChildren();
    if (mode === 'loading') {
        const text = document.createElement('p');
        text.textContent = 'Loading jobs…';
        detail.append(text);
        return;
    }
    if (mode === 'error') {
        const text = document.createElement('p');
        text.textContent = 'Nothing to inspect while the list is unavailable.';
        detail.append(text);
        return;
    }

    const job = loaded.find(item => item.id === selectedId);
    if (!job) {
        const text = document.createElement('p');
        text.textContent = 'Select a job to see its steps.';
        detail.append(text);
        return;
    }

    const title = document.createElement('h2');
    title.textContent = job.name;
    const meta = document.createElement('p');
    meta.className = 'detail-meta';
    meta.textContent = `${job.id} · ${job.owner} · ${job.updated}`;
    const badge = document.createElement('span');
    badge.className = `status status-${job.status}`;
    badge.textContent = statusLabel(job.status);
    const summaryText = document.createElement('p');
    summaryText.textContent = job.summary;
    const steps = document.createElement('ol');
    job.steps.forEach(step => {
        const item = document.createElement('li');
        item.textContent = step;
        steps.append(item);
    });
    detail.append(title, meta, badge, summaryText, steps);
}

function renderList() {
    const visible = mode === 'ready' ? visibleJobs() : [];
    renderSummary(visible.length);
    list.replaceChildren();

    if (mode === 'loading') {
        for (let index = 0; index < 4; index += 1) {
            const bar = document.createElement('div');
            bar.className = 'skeleton';
            list.append(bar);
        }
        renderDetail();
        return;
    }

    if (mode === 'error') {
        const banner = document.createElement('p');
        banner.className = 'banner-error';
        banner.textContent = 'The list could not be loaded. This failure is simulated.';
        list.append(banner);
        renderDetail();
        return;
    }

    if (visible.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No jobs match.';
        list.append(empty);
        renderDetail();
        return;
    }

    visible.forEach(job => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `job-row${job.id === selectedId ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(job.id === selectedId));

        const copy = document.createElement('span');
        copy.className = 'job-copy';
        const name = document.createElement('span');
        name.className = 'job-name';
        name.textContent = job.name;
        const id = document.createElement('span');
        id.className = 'job-id';
        id.textContent = job.id;
        const updated = document.createElement('span');
        updated.className = 'job-updated';
        updated.textContent = job.updated;
        copy.append(name, id, updated);

        const badge = document.createElement('span');
        badge.className = `status status-${job.status}`;
        badge.textContent = statusLabel(job.status);

        button.append(copy, badge);
        button.addEventListener('click', () => {
            selectedId = job.id;
            renderList();
        });
        list.append(button);
    });

    renderDetail();
}

function load() {
    const current = ++request;
    mode = 'loading';
    renderList();
    const fail = failInput.checked;

    window.setTimeout(() => {
        if (current !== request) return;
        if (fail) {
            mode = 'error';
            loaded = [];
            selectedId = null;
        } else {
            mode = 'ready';
            loaded = JOBS;
            if (!loaded.some(job => job.id === selectedId)) selectedId = null;
        }
        renderList();
    }, 700);
}

searchInput.addEventListener('input', () => {
    query = searchInput.value;
    if (mode === 'ready') renderList();
});

statusInput.addEventListener('change', () => {
    status = statusInput.value;
    if (mode === 'ready') renderList();
});

reloadButton.addEventListener('click', load);

document.getElementById('dashboard-toolbar').addEventListener('submit', (event) => {
    event.preventDefault();
});

load();
