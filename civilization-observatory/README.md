# UNSEEN: one-city observation simulation

Serve `dist/` as a static site. Open `index.html` through a web server so that
`city-brain.js` is loaded. No API key, remote model, or third-party library is required.

Residents learn bounded action values with their own 12-input, 8-hidden-unit,
10-output neural networks. Online temporal-difference updates and a bounded
experience replay buffer adjust values from observed outcomes. Empirical action
models estimate three-step need changes. A symbolic planner identifies resource
prerequisites; personality and initial utility estimates bootstrap decisions.
Urgent needs constrain exploration. Residents can share action models at the park.

Invention search recombines and mutates variable component graphs, including
speculative time/space primitives. Designs require resources and labor; failed
trials revise or abandon designs. Successful measured effects change the economy.
This is a fictional numeric model, not evidence that a design is physically viable.
There is no general intelligence, consciousness, natural-language generation,
unbounded physics engine, or autonomous source-code generation.

The observer can inspect and follow residents, pan, zoom, and show names.
Simulation time advances at 1,000x. Elapsed offline time is replayed on return in
small batches; simulation and neural state are saved to browser localStorage.
The old multi-city save is retained separately. No server executes while the page
is closed. Clearing browser data removes the single-city save.

Run the learning and invention tests:

    node tests/city-brain.test.cjs
