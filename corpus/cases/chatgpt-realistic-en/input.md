### Async Patterns in Node.js

#### Promisification

Wrapping callback APIs returns a Promise \(P\) that settles once:

\[
P = new \; Promise((resolve, reject) \Rightarrow callback(err, result))
\]

The error-first convention \((err, value)\) must be preserved.

#### Queue with concurrency limit

Implementation notes [4]. The throughput follows Little's law \(L = \lambda W\) [9]：

```js
async function runQueue(tasks, limit) {
  const workers = Array.from({ length: limit }, async () => {
    while (tasks.length) {
      const t = tasks.shift();
      await t();
    }
  });
  await Promise.all(workers);
}
```

**Key tradeoffs**:

- *Latency* improves until saturation at \(\lambda_{max}\)
- *Memory* grows with queue depth \(q\)

```text
queue stats: pending=0 done=42
```
