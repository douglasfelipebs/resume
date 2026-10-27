const LABELS = {
    unit: 'Unit',
    integration: 'Integration',
    e2e: 'End-to-end'
};

const scenarios = [
    {
        id: 'pricing',
        title: 'An empty cart still receives a discount',
        broken: 'A pricing rule applies a discount when the cart has no items.',
        layer: 'unit',
        why: 'The rule is a pure function. A unit test calls it with an empty cart and expects no discount. It does not need an HTTP server or a browser.',
        others: {
            integration: 'An integration test can catch it later, but it is slower and mixes the rule with the database.',
            e2e: 'A browser test would catch it only after the UI, the API, and the data are all wired. That is a costly place to discover a pricing rule.'
        },
        sketch: "it('does not discount an empty cart', () => {\n  expect(price([])).toBe(0);\n});"
    },
    {
        id: 'contract',
        title: 'Create endpoint accepts a payload missing amount',
        broken: 'POST /invoices returns 201 when amount is absent. The invoices are fictional.',
        layer: 'integration',
        why: 'The bug is the contract between the HTTP handler and the schema. An integration test sends the payload to the app and expects 400. A unit test of the calculator never sees the missing field.',
        others: {
            unit: 'Unit tests never receive the HTTP body, so they stay green while the API accepts bad input.',
            e2e: 'An end-to-end test can see the bad response, but it needs a running UI. A schema rule belongs closer to the handler.'
        },
        sketch: "it('rejects an invoice without amount', async () => {\n  const res = await request(app).post('/invoices').send({ customer: 'Ada' });\n  expect(res.status).toBe(400);\n});"
    },
    {
        id: 'double-submit',
        title: 'The submit button creates two records',
        broken: 'A double click on Save creates two jobs. The jobs are fictional.',
        layer: 'e2e',
        why: 'The defect is in the screen flow: the button stays enabled, so the user can submit twice. An end-to-end test clicks twice and expects one record. A unit test of create, called once, stays green.',
        others: {
            unit: 'The create function, called once, behaves. The bug is that the screen calls it twice.',
            integration: 'An API test of a single POST stays green. The duplicate comes from the browser. A second bug, a missing idempotency key, would be its own integration test.'
        },
        sketch: "it('creates one job when Save is clicked twice', async () => {\n  await page.getByRole('button', { name: 'Save' }).click();\n  await page.getByRole('button', { name: 'Save' }).click();\n  await expect(page.getByRole('row')).toHaveCount(1);\n});"
    }
];

const lab = document.getElementById('lab');
const progress = document.getElementById('lab-progress');
const answers = {};

function withArticle(layer) {
    const name = LABELS[layer].toLowerCase();
    const article = layer === 'unit' ? 'a' : 'an';
    return `${article} ${name}`;
}

function buildResult(scenario, picked) {
    const correct = picked === scenario.layer;
    const wrap = document.createDocumentFragment();

    const verdict = document.createElement('p');
    verdict.className = 'lab-verdict';
    verdict.textContent = correct
        ? `Yes. I would start with ${withArticle(scenario.layer)} test.`
        : `I would start with ${withArticle(scenario.layer)} test, not ${withArticle(picked)} test.`;

    const why = document.createElement('p');
    why.textContent = scenario.why;
    wrap.append(verdict, why);

    if (!correct) {
        const other = document.createElement('p');
        other.textContent = scenario.others[picked];
        wrap.append(other);
    }

    const sketch = document.createElement('pre');
    sketch.className = 'lab-sketch';
    sketch.textContent = scenario.sketch;
    wrap.append(sketch);
    return { node: wrap, correct };
}

function updateProgress() {
    const answered = Object.keys(answers).length;
    progress.textContent = `Answered ${answered} of ${scenarios.length}`;
}

scenarios.forEach(scenario => {
    const card = document.createElement('article');
    card.className = 'lab-card';

    const title = document.createElement('h2');
    title.textContent = scenario.title;

    const broken = document.createElement('p');
    broken.textContent = scenario.broken;

    const options = document.createElement('div');
    options.className = 'lab-options';
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', `Choose a test layer for: ${scenario.title}`);

    const result = document.createElement('div');
    result.className = 'lab-result';
    result.hidden = true;

    const buttons = ['unit', 'integration', 'e2e'].map(layer => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-btn';
        button.dataset.layer = layer;
        button.textContent = LABELS[layer];
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
            answers[scenario.id] = layer;
            buttons.forEach(other => {
                const selected = other === button;
                other.classList.toggle('is-selected', selected);
                other.setAttribute('aria-pressed', String(selected));
            });
            const built = buildResult(scenario, layer);
            result.classList.toggle('is-correct', built.correct);
            result.classList.toggle('is-wrong', !built.correct);
            result.replaceChildren(built.node);
            result.hidden = false;
            updateProgress();
        });
        return button;
    });

    buttons.forEach(button => options.append(button));
    card.append(title, broken, options, result);
    lab.append(card);
});
