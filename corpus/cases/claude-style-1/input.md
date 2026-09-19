### Quickstart

Here's how to get started with the tool.

#### Installation

Run the following command:

```bash
npm install -g example-tool
```

The config file supports \( n \geq 1 \) workers, and throughput scales as:

\[
T(n) = T(1) \cdot \frac{1}{1 + \alpha(n-1)}
\]

where \( \alpha \) is the contention factor.

#### Notes

**Warning:** Do not run more than one instance per directory.
