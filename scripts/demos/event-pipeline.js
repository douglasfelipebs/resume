const MAX_ATTEMPTS = 3;
const STEP_MS = 800;

const form = document.getElementById('pipeline-form');
const topicInput = document.getElementById('pipeline-topic');
const modeInput = document.getElementById('pipeline-mode');
const resetButton = document.getElementById('pipeline-reset');
const columns = {
    queue: document.getElementById('pipeline-queue'),
    consumer: document.getElementById('pipeline-consumer'),
    done: document.getElementById('pipeline-done'),
    dead: document.getElementById('pipeline-dead')
};
const logList = document.getElementById('pipeline-log');

const state = {
    queue: [],
    active: null,
    done: [],
    dead: [],
    log: [],
    seq: 1,
    run: 0
};

let timer = null;

function log(line) {
    state.log.unshift(line);
    state.log = state.log.slice(0, 40);
}

function messageCard(message, modifier) {
    const item = document.createElement('li');
    item.className = `msg${modifier ? ` ${modifier}` : ''}`;
    const title = document.createElement('strong');
    title.textContent = message.topic;
    const meta = document.createElement('span');
    meta.textContent = `${message.id} · attempt ${message.attempts} of ${MAX_ATTEMPTS}`;
    item.append(title, meta);
    return item;
}

function renderColumn(list, messages, emptyLabel, modifier) {
    list.replaceChildren();
    if (messages.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'col-empty';
        empty.textContent = emptyLabel;
        list.append(empty);
        return;
    }
    messages.forEach(message => list.append(messageCard(message, modifier)));
}

function render() {
    renderColumn(columns.queue, state.queue, 'Nothing waiting.');
    renderColumn(columns.consumer, state.active ? [state.active] : [], 'Idle.', 'msg-active');
    renderColumn(columns.done, state.done, 'None processed yet.', 'msg-ok');
    renderColumn(columns.dead, state.dead, 'Empty.', 'msg-dead');

    logList.replaceChildren();
    if (state.log.length === 0) {
        const item = document.createElement('li');
        item.textContent = 'Publish a message to start the log.';
        logList.append(item);
        return;
    }
    state.log.forEach(line => {
        const item = document.createElement('li');
        item.textContent = line;
        logList.append(item);
    });
}

function shouldFail(message) {
    if (message.mode === 'dead') return true;
    return message.mode === 'retry' && message.attempts < 2;
}

function pump() {
    if (state.active || state.queue.length === 0) return;

    const run = state.run;
    const message = state.queue.shift();
    message.attempts += 1;
    state.active = message;
    log(`${message.id} picked up, attempt ${message.attempts} of ${MAX_ATTEMPTS}.`);
    render();

    timer = window.setTimeout(() => {
        if (run !== state.run) return;

        if (shouldFail(message)) {
            if (message.attempts >= MAX_ATTEMPTS) {
                state.dead.unshift(message);
                log(`${message.id} moved to the dead letter after ${message.attempts} attempts.`);
            } else {
                state.queue.unshift(message);
                log(`Attempt ${message.attempts} failed. ${message.id} returned to the queue.`);
            }
        } else {
            state.done.unshift(message);
            log(`${message.id} processed.`);
        }

        state.active = null;
        render();
        pump();
    }, STEP_MS);
}

function publish(topic, mode) {
    const message = {
        id: `m-${state.seq}`,
        topic,
        mode,
        attempts: 0
    };
    state.seq += 1;
    state.queue.push(message);
    log(`Published ${message.id} on ${topic}.`);
    render();
    pump();
}

function reset() {
    state.run += 1;
    window.clearTimeout(timer);
    timer = null;
    state.queue = [];
    state.active = null;
    state.done = [];
    state.dead = [];
    state.log = [];
    render();
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    publish(topicInput.value, modeInput.value);
});

resetButton.addEventListener('click', reset);
render();
