# UNSEEN: one-city observation simulation

Serve `dist/` as a static site. Open `index.html` through a web server so that
`city-brain.js` is loaded. No API key, remote model, or third-party library is required.

Residents learn bounded action values with their own 12-input, 8-hidden-unit,
10-output neural networks. Online temporal-difference updates and a bounded
experience replay buffer adjust values from observed outcomes. Empirical action
models estimate three-step need changes. A symbolic planner identifies resource
prerequisites; personality and initial utility estimates bootstrap decisions.
Urgent needs constrain exploration. Residents can share action models at the park.

Each resident also carries a bounded social record: two values, an aspiration,
a recurring question, up to twelve remembered relationships, recent conversations,
and a short personal journal. Conversations spread named questions through the
city; residents can form small groups, invite trusted people, open collective
questions, and vote on temporary cooperation norms. Those norms make a small,
measured difference to related work. New invention records retain the question
that inspired their design, so an observer can trace a device back to the
city's social history.

Invention search recombines and mutates variable component graphs, including
speculative time/space primitives. Designs require resources and labor; failed
trials revise or abandon designs. Successful measured effects change the economy.
This is a fictional numeric model, not evidence that a design is physically viable.
There is no general intelligence, consciousness, natural-language generation,
unbounded physics engine, or autonomous source-code generation.

The observer can inspect and follow residents, pan, zoom, show names, and select
1,000x, 10,000x, or 100,000x time flow. The chosen rate is stored with the city
and is also applied when elapsed time is replayed after returning to the page.
Elapsed offline time is replayed in small batches; simulation and neural state
are saved to browser localStorage.
The old multi-city save is retained separately. No server executes while the page
is closed. Clearing browser data removes the single-city save.

Run the model and integration tests:

    node tests/city-brain.test.cjs
    node tests/city-world.test.cjs
    node tests/city-society.test.cjs
    node tests/city-speed.test.cjs
    node tests/integration.test.cjs
