# 卷积神经网络的三种卷积

## 标准卷积

设输入特征图为 $X \in \mathbb{R}^{H \times W \times C}$，标准卷积的输出为：

$$
Y_{i,j} = \sum_{c=1}^{C} \sum_{m} \sum_{n} X_{i+m, j+n, c} \cdot K_{m, n, c}
$$

其中 $K$ 为卷积核，感受野大小由卷积核尺寸决定。

## 深度可分离卷积

深度可分离卷积将标准卷积分解为两步，计算量降为原来的 $1/k^2$：

1. **逐通道卷积**：每个通道独立卷积
2. **逐点卷积**：用 $1 \times 1$ 卷积合并通道

$$
\begin{align}
\text{FLOPs}_{std} &= H \cdot W \cdot C \cdot C_o \cdot k^2 \\
\text{FLOPs}_{dw} &= H \cdot W \cdot C \cdot k^2 + H \cdot W \cdot C \cdot C_o
\end{align}
$$

## 空洞卷积

通过在卷积核中插入"空洞"扩大感受野，无需增加参数量。膨胀率为 $r$ 时，等效卷积核尺寸为 $k_{eff} = k + (k-1)(r-1)$。

对比结果如下：

| 类型    | 参数量 | 感受野          | 精度    |
| ----- | --- | ------------ | ----- |
| 标准卷积  | 高   | $k \times k$ | 92.4% |
| 深度可分离 | 低   | $k \times k$ | 90.8% |
| 空洞卷积  | 中   | $k_{eff}^2$  | 91.6% |

示例代码：

```python
import torch.nn as nn

conv = nn.Conv2d(3, 64, kernel_size=3, dilation=2)
```

注意`nn.Conv2d(3, 64)` 中 $C_{in}=3$ 表示输入通道数。
