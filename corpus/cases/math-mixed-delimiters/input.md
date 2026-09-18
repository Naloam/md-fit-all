### 梯度下降

#### 更新规则

参数更新公式为 \(\theta_{t+1} = \theta_t - \eta \nabla L(\theta_t)\)，其中学习率 \(\eta > 0\)。

二阶方法的更新方程：

\[
\theta_{t+1} = \theta_t - H_t^{-1} \nabla L(\theta_t)
\]

其中 \(H_t\) 是 Hessian 矩阵，\(\nabla\) 为梯度算子。
