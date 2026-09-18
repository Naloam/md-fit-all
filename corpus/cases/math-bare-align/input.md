### 推导过程

由链式法则展开：

\begin{align}
\frac{\partial L}{\partial W} &= \frac{\partial L}{\partial y} \cdot \frac{\partial y}{\partial W} \\
&= \delta \cdot x^T
\end{align}

其中 \(\delta\) 为误差项。

\begin{equation}
E = \frac{1}{2} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2
\end{equation}
